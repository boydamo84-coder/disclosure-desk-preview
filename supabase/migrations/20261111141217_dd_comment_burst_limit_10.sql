-- Allow ten public-card comments or replies per account in the existing ten-minute window.
CREATE OR REPLACE FUNCTION public.dd_guard_comment_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if auth.uid() is null
   or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
  raise exception 'Registered account required to comment';
 end if;
 if new.author_id is distinct from auth.uid() then
  raise exception 'Incorrect comment author';
 end if;
 -- Serialise same-account submissions so parallel retries cannot bypass limits.
 perform pg_advisory_xact_lock(hashtext('dd-comment-user:'||new.author_id::text));
 if new.parent_id is not null
   and not exists(select 1 from public.dd_case_comments p
     where p.id=new.parent_id and p.case_id=new.case_id and p.status='approved') then
  raise exception 'Invalid reply parent';
 end if;
 new.created_at:=now();new.updated_at:=now();
 if (select count(*) from public.dd_case_comments
   where author_id=new.author_id and created_at>now()-interval '10 minutes')>=10 then
  raise exception 'Posting limit reached. Try again later';
 end if;
 if (select count(*) from public.dd_case_comments
   where author_id=new.author_id and created_at>now()-interval '24 hours')>=40 then
  raise exception 'Daily posting limit reached';
 end if;
 if exists(select 1 from public.dd_case_comments
   where author_id=new.author_id and case_id=new.case_id
    and lower(btrim(body))=lower(btrim(new.body))
    and created_at>now()-interval '24 hours') then
  raise exception 'Duplicate comment';
 end if;
 return new;
end $function$;
