-- Vem Provar — parte 42: cashback/fidelidade (cupom automático a cada N pedidos entregues)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

-- cupom "pessoal": só vale pro cliente dono dele (nulo = vale pra qualquer um, como já era)
alter table coupons add column if not exists customer_id uuid references auth.users(id) on delete cascade;

-- liga o cupom ao pedido que o gerou, só pra evitar gerar 2 cupons se o status
-- "delivered" acabar sendo gravado mais de uma vez pro mesmo pedido
alter table coupons add column if not exists source_order_id uuid references orders(id) on delete set null;

create index if not exists coupons_customer_id_idx on coupons(customer_id);

alter table coupons enable row level security;

create policy "customers can read their own coupons" on coupons
  for select using (customer_id = auth.uid());
