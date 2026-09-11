-- Vem Provar — parte 46: cliente também avalia o entregador (não só o restaurante)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table reviews add column if not exists driver_id uuid references drivers(id);
alter table reviews add column if not exists driver_rating smallint;
alter table reviews add column if not exists driver_comment text;
