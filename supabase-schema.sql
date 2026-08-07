-- Vem Provar — schema inicial (restaurantes, cardápio e pedidos)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

create extension if not exists "pgcrypto";

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  rating numeric(2,1) not null default 5.0,
  delivery_time text not null,
  delivery_fee numeric(6,2) not null default 0,
  color_variant int not null default 0,
  icon_key text not null default 'store',
  created_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(8,2) not null,
  color_variant int not null default 0,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id),
  address text not null,
  payment_method text not null,
  subtotal numeric(8,2) not null,
  delivery_fee numeric(8,2) not null,
  total numeric(8,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  price numeric(8,2) not null,
  qty int not null
);

-- Segurança (RLS): por enquanto sem login de usuário, então liberamos
-- leitura pública de restaurantes/cardápio e liberamos criar pedidos.
-- Quando entrarmos com login, isso será refinado por usuário.
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "restaurants are publicly readable" on restaurants
  for select using (true);

create policy "menu items are publicly readable" on menu_items
  for select using (true);

create policy "anyone can create an order" on orders
  for insert with check (true);

create policy "anyone can read orders" on orders
  for select using (true);

create policy "anyone can create order items" on order_items
  for insert with check (true);

create policy "anyone can read order items" on order_items
  for select using (true);

-- Dados iniciais (os mesmos 4 restaurantes que já estavam no site)
insert into restaurants (slug, name, category, rating, delivery_time, delivery_fee, color_variant, icon_key) values
  ('pizzaria-do-bairro', 'Pizzaria do Bairro', 'Pizza · Italiana', 4.8, '30–40', 0, 0, 'pizza'),
  ('burguer-da-serra', 'Burguer da Serra', 'Lanches · Hambúrguer', 4.7, '25–35', 4.99, 4, 'sandwich'),
  ('cafe-colina', 'Café Colina', 'Café · Padaria', 4.9, '15–25', 0, 3, 'coffee'),
  ('sushi-ita', 'Sushi Ita', 'Japonês · Sushi', 4.8, '40–50', 6.90, 2, 'fish');

insert into menu_items (restaurant_id, name, description, price, color_variant)
select id, item.name, item.description, item.price, item.v
from restaurants, lateral (
  values
    ('Pizza Margherita', 'Molho de tomate, mussarela e manjericão fresco', 42.90, 0),
    ('Pizza Calabresa', 'Calabresa fatiada, cebola e azeitonas', 39.90, 4),
    ('Pizza Quatro Queijos', 'Mussarela, provolone, parmesão e gorgonzola', 44.90, 2),
    ('Refrigerante Lata', '350ml', 6.00, 3)
) as item(name, description, price, v)
where restaurants.slug = 'pizzaria-do-bairro';

insert into menu_items (restaurant_id, name, description, price, color_variant)
select id, item.name, item.description, item.price, item.v
from restaurants, lateral (
  values
    ('Smash Duplo', 'Dois smash burgers, queijo cheddar e molho da casa', 28.90, 4),
    ('Cheeseburguer Clássico', 'Burger 160g, queijo e picles', 24.90, 0),
    ('Batata Frita', 'Porção individual crocante', 14.90, 2),
    ('Milkshake', 'Chocolate, morango ou baunilha', 16.90, 3)
) as item(name, description, price, v)
where restaurants.slug = 'burguer-da-serra';

insert into menu_items (restaurant_id, name, description, price, color_variant)
select id, item.name, item.description, item.price, item.v
from restaurants, lateral (
  values
    ('Pão na Chapa', 'Pão francês na chapa com manteiga', 9.90, 3),
    ('Cappuccino', '300ml, espuma cremosa', 8.50, 0),
    ('Croissant', 'Amanteigado, assado na hora', 11.90, 4),
    ('Bolo do Dia', 'Fatia generosa, sabor variado', 10.00, 2)
) as item(name, description, price, v)
where restaurants.slug = 'cafe-colina';

insert into menu_items (restaurant_id, name, description, price, color_variant)
select id, item.name, item.description, item.price, item.v
from restaurants, lateral (
  values
    ('Combo Temaki (2un)', 'Salmão e atum, à sua escolha', 32.90, 2),
    ('Combo 20 Peças', 'Sushi e sashimi sortidos', 54.90, 0),
    ('Hot Roll (10un)', 'Empanado, recheio de salmão cream cheese', 29.90, 4),
    ('Yakisoba', 'Macarrão oriental com legumes e frango', 34.90, 3)
) as item(name, description, price, v)
where restaurants.slug = 'sushi-ita';
