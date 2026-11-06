DO $dd_beta_owner$
DECLARE chosen uuid; eligible_count integer;
BEGIN
  SELECT count(*) INTO eligible_count FROM public.dd_comment_moderators m
JOIN auth.users u ON u.id=m.user_id
WHERE u.email_confirmed_at IS NOT NULL
 AND u.banned_until IS NULL
 AND EXISTS (SELECT 1 FROM public.investigation_boards b WHERE b.user_id=m.user_id)
 AND EXISTS (SELECT 1 FROM public.research_documents d WHERE d.user_id=m.user_id);
  IF eligible_count <> 1 THEN RAISE EXCEPTION 'Safe beta owner enrolment: eligible account count not one'; END IF;
  SELECT m.user_id INTO STRICT chosen FROM public.dd_comment_moderators m
JOIN auth.users u ON u.id=m.user_id
WHERE u.email_confirmed_at IS NOT NULL
 AND u.banned_until IS NULL
 AND EXISTS (SELECT 1 FROM public.investigation_boards b WHERE b.user_id=m.user_id)
 AND EXISTS (SELECT 1 FROM public.research_documents d WHERE d.user_id=m.user_id);
  INSERT INTO public.dd_chat_owner_admins(user_id) VALUES (chosen) ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.dd_forum_owner_admins(user_id) VALUES (chosen) ON CONFLICT(user_id) DO NOTHING;
END $dd_beta_owner$;