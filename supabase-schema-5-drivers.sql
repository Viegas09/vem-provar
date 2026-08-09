create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  full_name text not null,
  phone text,
  vehicle_type text not null default 'moto' check (vehicle_type in ('moto', 'carro', 'bike')),
  plate text,
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);

alter table drivers enable row level security;

create policy "drivers can read their own profile" on drivers
  for select using (auth.uid() = user_id);

create policy "drivers can insert their own profile" on drivers
  for insert with check (auth.uid() = user_id);

create policy "drivers can update their own profile" on drivers
  for update using (auth.uid() = user_id);
