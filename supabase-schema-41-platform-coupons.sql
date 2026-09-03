-- Vem Provar — parte 41: cupons criados pela própria plataforma (valem em qualquer restaurante)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

-- o checkout já trata restaurant_id nulo como "vale em qualquer loja" (Checkout.jsx já
-- checava isso desde a v1 dos cupons); só faltava a coluna aceitar nulo e o admin
-- poder criar/gerenciar esse tipo de cupom
alter table coupons alter column restaurant_id drop not null;

create policy "admins can create coupons" on coupons
  for insert with check (public.is_admin());

create policy "admins can update any coupon" on coupons
  for update using (public.is_admin());

create policy "admins can read all coupons" on coupons
  for select using (public.is_admin());
