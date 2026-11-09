-- Vem Provar — parte 50: entregador privado do restaurante (quem não usa motoboy da plataforma)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table drivers add column if not exists restaurant_id uuid references restaurants(id);

-- o restaurante precisa ver os entregadores que ele mesmo cadastrou, pra listar e atribuir pedido
create policy "restaurant owners can read their private drivers" on drivers
  for select using (
    restaurant_id is not null and exists (
      select 1 from restaurants r where r.id = drivers.restaurant_id and r.owner_id = auth.uid()
    )
  );
