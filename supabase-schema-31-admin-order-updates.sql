-- Vem Provar — parte 31: admin pode atualizar o status de qualquer pedido
-- (intervenção manual em pedidos presos/travados a partir do painel admin)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

create policy "admins can update any order" on orders
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
