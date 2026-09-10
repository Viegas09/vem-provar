-- Vem Provar — parte 43: reportar problema com o pedido (item faltando, pedido
-- errado, qualidade, não chegou, outro) — cliente relata, restaurante e admin
-- veem e marcam como resolvido.
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

create table if not exists order_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  type text not null,
  description text,
  status text not null default 'aberto',
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- um relato por pedido — evita spam de relatos duplicados no mesmo pedido
create unique index if not exists order_issues_order_id_key on order_issues(order_id);
create index if not exists order_issues_restaurant_id_idx on order_issues(restaurant_id);

alter table order_issues enable row level security;

create policy "customers can create their own issue" on order_issues
  for insert with check (customer_id = auth.uid());

create policy "customers can read their own issue" on order_issues
  for select using (customer_id = auth.uid());

create policy "restaurant owner can read issues on their orders" on order_issues
  for select using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "restaurant owner can resolve issues on their orders" on order_issues
  for update using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "admins can read all issues" on order_issues
  for select using (public.is_admin());

create policy "admins can resolve any issue" on order_issues
  for update using (public.is_admin());
