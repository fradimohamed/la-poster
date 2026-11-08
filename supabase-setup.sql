-- Étape 1 : nouveau projet Supabase La Poster seulement.
-- Ne supprime aucune table existante. Auditez tout schéma existant avant ces scripts.
create table if not exists public.products (
  id text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (length(trim(name)) between 1 and 120),
  artist text not null default '',
  category text not null check (category in ('HIP-HOP','ROCK','COLLECTION')),
  description text not null default '',
  characteristics text not null default '',
  price_millimes bigint not null check (price_millimes between 1 and 9000000000000),
  image_url text not null,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','admin')) default 'customer',
  created_at timestamptz not null default now()
);

insert into public.products (id,name,artist,category,description,characteristics,price_millimes,image_url,available) values
('igor','IGOR','TYLER, THE CREATOR','HIP-HOP','Poster musical — Tyler, The Creator.','Affiche musicale illustrée.',20000,'images/poster-1.jpg.jpg',true),
('i-am-music','I AM MUSIC','PLAYBOI CARTI','HIP-HOP','Poster musical — Playboi Carti.','Affiche musicale illustrée.',20000,'images/poster-2.jpg.jpg',true),
('am','AM','ARCTIC MONKEYS','ROCK','Poster musical — Arctic Monkeys.','Affiche musicale illustrée.',20000,'images/poster-3.jpg.jpg',true),
('collection-sousse','Collection Exclusive Sousse','LA POSTER','COLLECTION','Collection exclusive La Poster.','Collection spéciale La Poster.',20000,'images/poster-1.jpg.jpg',true)
on conflict (id) do nothing;

create or replace function public.is_shop_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$ select exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'admin'); $$;
revoke all on function public.is_shop_admin() from public, anon;
grant execute on function public.is_shop_admin() to authenticated;

alter table public.products enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "catalogue public" on public.products;
drop policy if exists "catalogue visitors" on public.products;
drop policy if exists "catalogue authenticated" on public.products;
create policy "catalogue visitors" on public.products for select to anon using (available);
create policy "catalogue authenticated" on public.products for select to authenticated using (available or (select public.is_shop_admin()));
drop policy if exists "admins manage products" on public.products;
drop policy if exists "admins insert products" on public.products;
drop policy if exists "admins update products" on public.products;
drop policy if exists "admins delete products" on public.products;
create policy "admins insert products" on public.products for insert to authenticated with check ((select public.is_shop_admin()));
create policy "admins update products" on public.products for update to authenticated using ((select public.is_shop_admin())) with check ((select public.is_shop_admin()));
create policy "admins delete products" on public.products for delete to authenticated using ((select public.is_shop_admin()));

drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
-- Aucune politique INSERT/UPDATE/DELETE client sur user_roles : attribution manuelle via SQL Editor.
revoke all on public.products, public.user_roles from anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.products to authenticated;

