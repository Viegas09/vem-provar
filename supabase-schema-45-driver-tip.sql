-- Vem Provar — parte 45: gorjeta opcional pro entregador no checkout
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table orders add column if not exists tip_amount numeric(10,2) not null default 0;
