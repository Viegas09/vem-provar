-- Vem Provar — parte 33: liga o Supabase Realtime na tabela orders
-- (necessário pros painéis admin e do parceiro atualizarem sozinhos, sem polling)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter publication supabase_realtime add table orders;
