-- Vem Provar — parte 48: garante RLS ligado em restaurant_mp_credentials
-- Essa tabela guarda o access_token/refresh_token real da conta Mercado Pago de cada
-- restaurante — nenhuma tela do app lê ou escreve nela direto (só o servidor, com a
-- service role, que ignora RLS). Não achei essa tabela em nenhuma migração rastreada
-- neste repositório, então não tenho como saber se o RLS dela já estava ligado.
-- Rodar isso é seguro de qualquer forma: só passa a bloquear leitura/escrita direto do
-- navegador (anon/authenticated), nada no app depende desse acesso pra funcionar.
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table restaurant_mp_credentials enable row level security;

-- de propósito, nenhuma policy criada aqui: sem nenhuma, o RLS bloqueia tudo pra
-- anon/authenticated por padrão, e só a service role (usada nos endpoints /api/mp-*)
-- continua enxergando a tabela.
