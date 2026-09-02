-- Vem Provar — parte 34: admin poder ver clientes e bloquear em caso de fraude/abuso
-- Rode este script inteiro no Supabase: SQL Editor -> New query -> colar -> Run

alter table profiles add column if not exists email text;
alter table profiles add column if not exists blocked boolean not null default false;
alter table profiles add column if not exists blocked_reason text;

-- preenche o e-mail de quem já tinha conta antes dessa coluna existir
update profiles set email = u.email
from auth.users u
where profiles.id = u.id and profiles.email is null;

-- a partir de agora, todo cadastro novo já grava o e-mail no profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- função auxiliar pra checar se quem está logado é admin sem disparar recursão
-- de RLS (a policy abaixo consulta a própria tabela profiles)
create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer set search_path = public stable;

create policy "admins can read all profiles" on profiles
  for select using (public.is_admin());

create policy "admins can update any profile" on profiles
  for update using (public.is_admin());
