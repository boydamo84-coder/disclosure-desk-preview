"use strict";
// Non-destructive guard for the reusable LIVE SQL inspection script.
// Runs in CI only; never opens a network connection to Supabase.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const sql = fs.readFileSync(path.resolve(__dirname, "../supabase/ACCOUNT_DELETION_LIVE_READONLY_AUDIT_20261108.sql"), "utf8");
const active = sql.split("\n")
 .map(line=>line.replace(/--.*$/, "").trim())
 .filter(Boolean).join("\n");
const statements = active.split(";").map(x=>x.trim()).filter(Boolean);
assert.equal(statements[0], "BEGIN READ ONLY", "Audit must begin with a READ ONLY transaction");
assert.equal(statements.at(-1), "ROLLBACK", "Audit must never commit");
assert.equal((active.match(/\bBEGIN READ ONLY\b/g)||[]).length, 1, "Only one read-only transaction permitted");
assert.equal((active.match(/\bROLLBACK\b/g)||[]).length, 1);
for(const item of statements.slice(1,-1)){
 assert.match(item,/^(WITH\s|SELECT\s)/i, "Only CTE or SELECT inspection is permitted");
}
assert.doesNotMatch(active,/\b(INSERT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|COMMIT|CALL|DO|COPY|EXECUTE|SET\s+(?!LOCAL\s+ROLE))\b/i,
 "Live audit cannot mutate schema, data or session outside read-only scopes");
assert.doesNotMatch(sql, /[A-Za-z0-9_.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
 "Never put personal account email in audit source");
assert.ok(active.includes("auth.users"));
assert.ok(active.includes("pg_proc"));
console.log("PASS LIVE AUDIT: SQL restricted to read-only CTE/SELECT, rollback; no personal identifiers or destructive statements");
