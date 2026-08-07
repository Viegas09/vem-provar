-- Vem Provar — parte 2: contas de usuário + geolocalização
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run
-- (Pode rodar mesmo já tendo rodado o supabase-schema.sql antes; este é um script separado.)

-- Coordenadas dos restaurantes (pra ordenar "mais perto de você" de verdade)
alter table restaurants add column if not exists latitude numeric(9,6);
alter table restaurants add column if not exists longitude numeric(9,6);

-- Perfil de cada usuário (cliente, dono de restaurante, entregador ou admin)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'restaurant', 'driver', 'admin')),
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users can read their own profile" on profiles
  for select using (auth.uid() = id);

create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Cria automaticamente uma linha em profiles sempre que alguém se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Coordenadas de exemplo pros 4 restaurantes (Itapecerica da Serra)
update restaurants set latitude = -23.7167, longitude = -46.8497 where slug = 'pizzaria-do-bairro';
update restaurants set latitude = -23.7145, longitude = -46.8520 where slug = 'burguer-da-serra';
update restaurants set latitude = -23.7189, longitude = -46.8471 where slug = 'cafe-colina';
update restaurants set latitude = -23.7201, longitude = -46.8455 where slug = 'sushi-ita';
