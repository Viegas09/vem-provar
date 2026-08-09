-- Vem Provar — parte 6: dono do restaurante pode atualizar o status dos próprios pedidos
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

create policy "restaurant owners can update their orders" on orders
  for update using (
    exists (
      select 1 from restaurants r where r.id = orders.restaurant_id and r.owner_id = auth.uid()
    )
  );
