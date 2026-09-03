-- Vem Provar — parte 36: entregador aceitar e cumprir corridas
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table orders add column if not exists driver_id uuid references drivers(id);
alter table drivers add column if not exists available boolean not null default true;

-- entregador consegue aceitar uma corrida livre (driver_id null -> vira o dele)
-- e depois atualizar o status só das corridas que são dele
create policy "drivers can claim or update their delivery" on orders
  for update using (
    exists (
      select 1 from drivers d
      where d.user_id = auth.uid() and (orders.driver_id is null or orders.driver_id = d.id)
    )
  )
  with check (
    exists (select 1 from drivers d where d.user_id = auth.uid() and driver_id = d.id)
  );
