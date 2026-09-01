-- Vem Provar — parte 32: admin pode suspender um restaurante (moderação)
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table restaurants add column if not exists suspended boolean not null default false;
alter table restaurants add column if not exists suspension_reason text;

create policy "admins can update any restaurant" on restaurants
  for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
