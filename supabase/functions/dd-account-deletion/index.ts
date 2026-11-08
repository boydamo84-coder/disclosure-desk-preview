// Disclosure Desk account deletion: SAFE PREVIEW ONLY. Never deploy as a deletion endpoint.
// No storage.remove, SQL updates, or auth.admin.deleteUser is present in this function.
// DD_ACCOUNT_DELETION_PREFLIGHT_ENABLED is OFF by default. Execution always refuses.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import { makeDeletionPreflight } from "./preflight-core.mjs";

const allowedOrigins = new Set([
  "https://uapdisclosuredesk.com",
  "https://www.uapdisclosuredesk.com"
]);
const cors = (origin: string | null) => ({
  ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Cache-Control": "no-store",
  "Vary": "Origin"
});
const reply = (status: number, data: unknown, origin: string | null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8" }
  });

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== "POST") return reply(405, { error: "Use POST" }, origin);
  if (origin && !allowedOrigins.has(origin)) return reply(403, { error: "Origin not allowed" }, origin);
  // Critically, the only exposed action is READ-ONLY preflight; no action may perform deletion.
  if (Deno.env.get("DD_ACCOUNT_DELETION_PREFLIGHT_ENABLED") !== "true") {
    return reply(503, { error: "Account deletion preflight not yet available" }, origin);
  }
  const url = Deno.env.get("SUPABASE_URL") || "";
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !publicKey || !serviceKey) return reply(503, { error: "Service not configured" }, origin);

  const authorization = request.headers.get("Authorization") || "";
  if (!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization)) {
    return reply(401, { error: "Sign-in required" }, origin);
  }
  if (Number(request.headers.get("Content-Length") || "0") > 512) {
    return reply(413, { error: "Invalid request size" }, origin);
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 512) throw new Error("Too large");
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: "Invalid request" }, origin);
  }
  // Reject supplied user_id, emails, tokens, confirmation strings and all future/unknown actions.
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || (body as Record<string, unknown>).action !== "preflight") {
    return reply(400, { error: "Only account preflight is supported" }, origin);
  }
  const accessToken = authorization.slice(7);
  const scoped = createClient(url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: { user }, error: authError } = await scoped.auth.getUser(accessToken);
  if (authError || !user || user.is_anonymous || !user.email_confirmed_at) {
    return reply(401, { error: "Verified registered account required" }, origin);
  }

  // The service key exists SERVER-SIDE ONLY. Every private count is bound to the
  // Auth-verified user; never use an ID from JSON and never return content or keys.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const countMine = async (table: string, column: string) => {
    const { count, error } = await admin.from(table).select("*", { head: true, count: "exact" })
      .eq(column, user.id);
    if (error || typeof count !== "number") throw new Error("incomplete preflight");
    return count;
  };

  try {
    const [
      forumOwner, chatOwner, commentModerator,
      documents, revisions, researchImages, boards, avatarProfiles,
      forumThreads, forumReplies, chatMessages, witnessReports
    ] = await Promise.all([
      countMine("dd_forum_owner_admins", "user_id"),
      countMine("dd_chat_owner_admins", "user_id"),
      countMine("dd_comment_moderators", "user_id"),
      countMine("research_documents", "user_id"),
      countMine("research_document_revisions", "user_id"),
      countMine("research_assets", "user_id"),
      countMine("investigation_boards", "user_id"),
      countMine("dd_avatar_profiles", "user_id"),
      countMine("dd_forum_threads", "author_id"),
      countMine("dd_forum_replies", "author_id"),
      countMine("dd_chat_messages", "author_id"),
      countMine("dd_witness_reports", "author_id")
    ]);
    const result = makeDeletionPreflight({
      verifiedAccount: true,
      confirmedEmail: true,
      ownerRoles: { forumOwner: forumOwner > 0, chatOwner: chatOwner > 0, commentModerator: commentModerator > 0 },
      counts: { documents, revisions, researchImages, boards, avatarProfiles,
        forumThreads, forumReplies, chatMessages, witnessReports }
    });
    return reply(200, { ...result, message: "This is a read-only account deletion preview. Nothing has been deleted." }, origin);
  } catch {
    return reply(503, { error: "Account deletion preview could not be verified safely" }, origin);
  }
});
