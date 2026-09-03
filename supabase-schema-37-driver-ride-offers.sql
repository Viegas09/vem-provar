-- Vem Provar — parte 37: corrida "pinga" pra um entregador por vez (estilo Uber)
-- e botão do restaurante pra manter a entrega com o motoboy da casa
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table restaurants add column if not exists use_platform_drivers boolean not null default true;

create table if not exists order_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete cascade,
  status text not null default 'offered' check (status in ('offered', 'declined', 'expired')),
  created_at timestamptz not null default now()
);

-- só pode existir UM oferecimento "offered" ativo por pedido de cada vez —
-- é essa trava que garante que a corrida pinga pra um entregador de cada vez
create unique index if not exists order_offers_one_active_offer
  on order_offers(order_id) where status = 'offered';

alter table order_offers enable row level security;

create policy "drivers can read their own offers" on order_offers
  for select using (
    exists (select 1 from drivers d where d.user_id = auth.uid() and d.id = driver_id)
  );

create policy "drivers can create their own offer" on order_offers
  for insert with check (
    exists (select 1 from drivers d where d.user_id = auth.uid() and d.id = driver_id)
  );

create policy "drivers can update their own offer" on order_offers
  for update using (
    exists (select 1 from drivers d where d.user_id = auth.uid() and d.id = driver_id)
  );
