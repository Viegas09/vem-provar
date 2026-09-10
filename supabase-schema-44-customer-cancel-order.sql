-- Vem Provar — parte 44: cliente pode cancelar o próprio pedido, só enquanto ainda está pendente
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

create policy "customers can cancel their own pending orders" on orders
  for update using (
    customer_id = auth.uid() and status = 'pending'
  )
  with check (
    customer_id = auth.uid() and status = 'cancelled'
  );
