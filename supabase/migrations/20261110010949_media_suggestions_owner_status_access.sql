-- Allow the existing self-only Boolean owner check to be evaluated by nomination invoker RPCs and RLS. Owner table privileges and helper definition are unchanged; anonymous execution remains denied.
begin;
grant execute on function public.dd_discussions_is_owner() to authenticated;
commit;