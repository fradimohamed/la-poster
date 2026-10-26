-- Étape 2, après supabase-setup.sql, dans le nouveau projet Supabase La Poster.
-- Aucun paiement réel. Livraison à 0 dans la RPC à titre provisoire; à confirmer.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  attempt_id uuid not null,
  request_fingerprint text not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  payment_method text not null check (payment_method in ('card-demo','cash-demo')),
  subtotal_millimes bigint not null check (subtotal_millimes > 0),
  shipping_millimes bigint not null default 0 check (shipping_millimes >= 0),
  total_millimes bigint not null check (total_millimes = subtotal_millimes + shipping_millimes),
  status text not null default 'nouvelle' check (status in ('nouvelle','en_preparation','terminee','annulee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, attempt_id)
);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);

create or replace function public.set_order_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists set_order_updated_at on public.orders;
create trigger set_order_updated_at before update on public.orders
for each row execute function public.set_order_updated_at();

alter table public.orders enable row level security;
drop policy if exists "read own orders or admin" on public.orders;
create policy "read own orders or admin" on public.orders for select to authenticated using (user_id = (select auth.uid()) or (select public.is_shop_admin()));
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update to authenticated using ((select public.is_shop_admin())) with check ((select public.is_shop_admin()));
-- Les clients n'ont aucun droit INSERT/DELETE direct sur les commandes.
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

create or replace function public.create_demo_order(
  p_attempt_id uuid,
  p_items jsonb,
  p_shipping_address jsonb,
  p_payment_method text,
  p_expected_total_millimes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_entry jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_seen text[] := array[]::text[];
  v_lines jsonb := '[]'::jsonb;
  v_subtotal bigint := 0;
  v_shipping bigint := 0; -- Montant provisoire jusqu'à configuration d'un tarif.
  v_fingerprint text;
  v_order public.orders%rowtype;
  v_id uuid := gen_random_uuid();
begin
  if v_uid is null then raise exception 'Authentification requise'; end if;
  if p_attempt_id is null or p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Panier invalide'; end if;
  if jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Panier invalide'; end if;
  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object' then raise exception 'Adresse invalide'; end if;
  if p_payment_method is null or p_payment_method not in ('card-demo','cash-demo') then raise exception 'Mode de paiement invalide'; end if;
  if p_expected_total_millimes is null then raise exception 'Total invalide'; end if;
  if exists (select 1 from unnest(array['first_name','last_name','email','phone','address','city','postal_code','country']) as required_keys(key) where coalesce(trim(p_shipping_address->>required_keys.key),'') = '') then raise exception 'Coordonnées de livraison incomplètes'; end if;
  if length(p_shipping_address->>'email') > 254 or length(p_shipping_address->>'address') > 500 then raise exception 'Coordonnées trop longues'; end if;

  -- Empreinte de la requête utilisateur : même réponse sur un nouvel essai réseau,
  -- même si le prix du catalogue a changé entre-temps.
  v_fingerprint := md5(jsonb_build_object('items',p_items,'address',p_shipping_address,'payment',p_payment_method,'total',p_expected_total_millimes)::text);
  select * into v_order from public.orders where user_id = v_uid and attempt_id = p_attempt_id;
  if found then
    if v_order.request_fingerprint <> v_fingerprint then raise exception 'Cette référence de tentative a déjà été utilisée avec des détails différents'; end if;
    return jsonb_build_object('id',v_order.id,'reference',v_order.reference,'status',v_order.status,'total_millimes',v_order.total_millimes);
  end if;

  for v_entry in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_entry) <> 'object' or coalesce(v_entry->>'id','') = '' or coalesce(v_entry->>'quantity','') !~ '^[0-9]+$' then raise exception 'Ligne de panier invalide'; end if;
    v_quantity := (v_entry->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'Quantité invalide'; end if;
    if (v_entry->>'id') = any(v_seen) then raise exception 'Articles dupliqués'; end if;
    v_seen := array_append(v_seen, v_entry->>'id');
    select * into v_product from public.products where id = v_entry->>'id' and available = true;
    if not found then raise exception 'Produit indisponible'; end if;
    if v_product.price_millimes > 9000000000000 / v_quantity then raise exception 'Montant invalide'; end if;
    v_subtotal := v_subtotal + v_product.price_millimes * v_quantity;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('id',v_product.id,'name',v_product.name,'artist',v_product.artist,'category',v_product.category,'description',v_product.description,'characteristics',v_product.characteristics,'image_url',v_product.image_url,'unit_price_millimes',v_product.price_millimes,'quantity',v_quantity,'line_total_millimes',v_product.price_millimes * v_quantity));
  end loop;
  if p_expected_total_millimes <> v_subtotal + v_shipping then raise exception 'Le catalogue ou le total a changé. Rechargez la page.'; end if;
  insert into public.orders (id,reference,user_id,attempt_id,request_fingerprint,items,shipping_address,payment_method,subtotal_millimes,shipping_millimes,total_millimes)
  values (v_id,'LP-' || upper(substr(replace(v_id::text,'-',''),1,12)),v_uid,p_attempt_id,v_fingerprint,v_lines,p_shipping_address,p_payment_method,v_subtotal,v_shipping,v_subtotal + v_shipping)
  on conflict (user_id,attempt_id) do nothing;
  select * into v_order from public.orders where user_id = v_uid and attempt_id = p_attempt_id;
  if v_order.request_fingerprint <> v_fingerprint then raise exception 'Cette référence de tentative a déjà été utilisée avec des détails différents'; end if;
  return jsonb_build_object('id',v_order.id,'reference',v_order.reference,'status',v_order.status,'total_millimes',v_order.total_millimes);
end;
$$;
revoke all on function public.create_demo_order(uuid,jsonb,jsonb,text,bigint) from public, anon;
grant execute on function public.create_demo_order(uuid,jsonb,jsonb,text,bigint) to authenticated;
comment on table public.orders is 'Commandes de démonstration. Aucun paiement réel; livraison provisoirement à 0 et à confirmer.';

-- Diagnostic de privilèges à exécuter après l'installation. RLS dépend de l'identité SQL du testeur.
select
  has_function_privilege('anon', 'public.create_demo_order(uuid,jsonb,jsonb,text,bigint)', 'EXECUTE') as anon_can_create_order,
  has_function_privilege('authenticated', 'public.create_demo_order(uuid,jsonb,jsonb,text,bigint)', 'EXECUTE') as customer_can_call_order_rpc,
  has_table_privilege('authenticated', 'public.orders', 'INSERT') as customer_can_insert_orders_directly,
  row_security_active('public.orders') as orders_rls_active;
-- Attendu : false, true, false. row_security_active dépend du rôle SQL utilisé ici.

