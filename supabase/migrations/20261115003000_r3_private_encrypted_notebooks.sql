-- R3 encrypted cloud-backup slot, one per verified Disclosure Desk account.
-- Deliberately stores ciphertext ONLY, with independent owner-only RLS.
-- No profile, Boards, W.NE or existing community policies are changed.
create table if not exists public.dd_r3_private_notebooks (
  owner_user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_envelope jsonb not null,
  generation text not null,
  format_version smallint not null default 1 check (format_version = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dd_r3_generation_hex check (generation ~ '^[0-9a-f]{32}$'),
  constraint dd_r3_encrypted_size check (octet_length(encrypted_envelope::text) between 200 and 2000000),
  constraint dd_r3_envelope_shape check (
    jsonb_typeof(encrypted_envelope) = 'object'
    and encrypted_envelope->>'format' = 'dd-r3-private-aes256gcm-v1'
    and encrypted_envelope->>'cipher' = 'AES-256-GCM'
    and encrypted_envelope->>'generation' = generation
  )
);
comment on table public.dd_r3_private_notebooks is
  'R3 user-owned encrypted notebook backup only. No cleartext research content or passphrases.';
alter table public.dd_r3_private_notebooks enable row level security;
alter table public.dd_r3_private_notebooks force row level security;
revoke all on public.dd_r3_private_notebooks from PUBLIC, anon;
grant select, insert, update, delete on public.dd_r3_private_notebooks to authenticated;
create policy dd_r3_read_own on public.dd_r3_private_notebooks
 for select to authenticated
 using (owner_user_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) = false);
create policy dd_r3_create_own on public.dd_r3_private_notebooks
 for insert to authenticated
 with check (owner_user_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) = false);
create policy dd_r3_update_own on public.dd_r3_private_notebooks
 for update to authenticated
 using (owner_user_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) = false)
 with check (owner_user_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) = false);
create policy dd_r3_delete_own on public.dd_r3_private_notebooks
 for delete to authenticated
 using (owner_user_id = (select auth.uid()) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false) = false);
