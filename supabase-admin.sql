-- Remplacez le UUID par celui de l'utilisateur créé dans Supabase > Authentication > Users.
-- À lancer manuellement dans SQL Editor avec un compte de confiance. Ne jamais intégrer dans une page web.
insert into public.user_roles (user_id, role)
values ('VOTRE-UUID-AUTH'::uuid, 'admin')
on conflict (user_id) do update set role = excluded.role;
