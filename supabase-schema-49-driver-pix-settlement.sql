-- Vem Provar — parte 49: chave Pix do entregador + fechamento de repasse no painel do restaurante
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table drivers add column if not exists pix_key text;
alter table orders add column if not exists driver_payout_settled_at timestamptz;

-- o restaurante precisa ver nome + chave Pix do entregador que fez as entregas dele,
-- pra saber pra quem pagar — mas só do entregador que realmente entregou algo pra ele,
-- não de qualquer entregador da plataforma
create policy "restaurant owners can read drivers who delivered for them" on drivers
  for select using (
    exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.driver_id = drivers.id and r.owner_id = auth.uid()
    )
  );
