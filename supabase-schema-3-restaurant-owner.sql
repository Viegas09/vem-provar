alter table restaurants add column if not exists owner_id uuid references auth.users(id);
alter table restaurants add column if not exists phone text;
alter table restaurants add column if not exists address text;

alter table restaurants alter column category drop not null;
alter table restaurants alter column delivery_time drop not null;

create policy "owners can insert their restaurant" on restaurants
  for insert with check (auth.uid() = owner_id);

create policy "owners can update their restaurant" on restaurants
  for update using (auth.uid() = owner_id);

create policy "owners can insert menu items" on menu_items
  for insert with check (
    exists (
      select 1 from restaurants
      where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "owners can update menu items" on menu_items
  for update using (
    exists (
      select 1 from restaurants
      where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );

create policy "owners can delete menu items" on menu_items
  for delete using (
    exists (
      select 1 from restaurants
      where restaurants.id = menu_items.restaurant_id
      and restaurants.owner_id = auth.uid()
    )
  );
