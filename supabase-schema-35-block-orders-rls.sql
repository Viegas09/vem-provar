-- Vem Provar — parte 35: bloqueio de cliente valendo no banco, não só na tela
-- (a tela do Checkout já impede, mas a trava de verdade tem que estar aqui —
-- sem isso, um cliente bloqueado tecnicamente ainda conseguiria criar pedido
-- chamando a API do Supabase direto, ignorando o app)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

drop policy if exists "anyone can create an order" on orders;

create policy "customers can create orders unless blocked" on orders
  for insert with check (
    customer_id is null
    or not exists (select 1 from profiles p where p.id = customer_id and p.blocked = true)
  );
