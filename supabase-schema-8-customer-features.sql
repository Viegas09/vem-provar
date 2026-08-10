alter table orders add column if not exists customer_id uuid references auth.users(id);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

alter table favorites enable row level security;

create policy "users can read their own favorites" on favorites
  for select using (auth.uid() = user_id);

create policy "users can insert their own favorites" on favorites
  for insert with check (auth.uid() = user_id);

create policy "users can delete their own favorites" on favorites
  for delete using (auth.uid() = user_id);
