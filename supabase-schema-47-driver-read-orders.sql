-- Vem Provar — parte 47: entregador não tinha permissão de LEITURA em orders/order_items
-- (só existia a política de UPDATE "drivers can claim or update their delivery" — sem uma de
-- SELECT, as telas "corridas disponíveis" e "minhas entregas" do entregador vinham vazias)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

create policy "drivers can read available or their own deliveries" on orders
  for select using (
    exists (
      select 1 from drivers d
      where d.user_id = auth.uid()
      and (orders.driver_id is null or orders.driver_id = d.id)
    )
  );

create policy "drivers can read items of available or their own deliveries" on order_items
  for select using (
    exists (
      select 1 from orders o
      join drivers d on d.user_id = auth.uid()
      where o.id = order_items.order_id
      and (o.driver_id is null or o.driver_id = d.id)
    )
  );
