-- Cache per-request identity checks in RLS and cover the reviewer foreign key.
-- Ownership, registered-account requirements and moderation rules are unchanged.
begin;
create index dd_media_suggestion_reviewer on public.dd_media_suggestions(reviewed_by);
alter policy dd_media_suggestion_read on public.dd_media_suggestions
 using ((select auth.uid()) is not null and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
  and (user_id=(select auth.uid()) or (select public.dd_discussions_is_owner())));
alter policy dd_media_suggestion_insert on public.dd_media_suggestions
 with check (user_id=(select auth.uid()) and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
  and status='pending' and reviewed_by is null and reviewed_at is null);
commit;
