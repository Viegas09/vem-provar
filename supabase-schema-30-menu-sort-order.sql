-- Vem Provar — parte 30: ordem manual do cardápio (arrastar pra reordenar itens e categorias)
-- Rode este script inteiro no Supabase

alter table menu_items add column if not exists sort_order integer not null default 0;
