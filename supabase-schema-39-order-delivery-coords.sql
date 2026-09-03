-- Guarda a coordenada do endereço de entrega no próprio pedido (não só o texto),
-- pra dar rota precisa pro entregador (Google Maps / Waze) até a porta do cliente.
-- Pedidos antigos ficam com essas colunas nulas — a navegação cai pro endereço em
-- texto nesse caso (o Maps/Waze também aceitam texto, só perde um pouco de precisão).
alter table orders add column if not exists latitude numeric(9,6);
alter table orders add column if not exists longitude numeric(9,6);
