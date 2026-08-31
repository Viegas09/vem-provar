-- Vem Provar — parte 29: categorias no cardápio (ex: Lanches, Bebidas, Sobremesas)
-- Rode este script inteiro no Supabase

alter table menu_items add column if not exists category text;
