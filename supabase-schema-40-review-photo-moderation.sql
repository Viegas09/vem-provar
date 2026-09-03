-- Vem Provar — parte 40: admin pode moderar avaliações e remover fotos impróprias
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table reviews add column if not exists hidden boolean not null default false;
alter table reviews add column if not exists hidden_reason text;

-- ocultar não é excluir: a avaliação continua existindo, só some da página pública
-- do restaurante. Reaproveita o is_admin() já criado (schema-34) pra evitar recursão de RLS.
create policy "admins can update any review" on reviews
  for update using (public.is_admin());

-- pra remover foto de prato imprópria (o banner do restaurante já tem policy de
-- admin desde a suspensão — schema-32; faltava só menu_items)
create policy "admins can update any menu item" on menu_items
  for update using (public.is_admin());
