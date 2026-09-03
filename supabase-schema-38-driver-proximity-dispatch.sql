-- Dispatch por proximidade: em vez de "quem clicar primeiro" ganha a oferta,
-- o entregador mais perto do restaurante (entre os disponíveis, sem oferta ativa
-- e que ainda não recusou/perdeu o prazo nesse pedido) é quem recebe o ping.
--
-- drivers.latitude/longitude já existem (capturados uma vez no cadastro). Agora
-- passam a ser atualizados em tempo real enquanto o entregador está disponível.
alter table drivers add column if not exists location_updated_at timestamptz;

-- bug encontrado testando isso: aceitar uma corrida nunca marcava a oferta como
-- resolvida (só o pedido ganhava driver_id) — a linha ficava com status 'offered'
-- pra sempre. No fluxo antigo (insert direto) isso passava batido porque a
-- tentativa seguinte esbarrava no índice único e virava "não consegui, tudo bem".
-- Na função nova, que primeiro checa "esse entregador já tem oferta ativa?", essa
-- oferta nunca resolvida reaparecia como se fosse uma corrida nova pingando de novo.
alter table order_offers drop constraint if exists order_offers_status_check;
alter table order_offers add constraint order_offers_status_check
  check (status in ('offered', 'accepted', 'declined', 'expired'));

-- security definer: só assim dá pra comparar a localização de TODOS os entregadores
-- disponíveis (pra achar o mais perto) sem abrir a leitura da localização de um
-- entregador pros outros — o cliente só recebe de volta a oferta (se ganhou) ou nada.
create or replace function claim_nearest_offer(
  p_driver_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns order_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer order_offers;
  v_order_id uuid;
  v_r_lat numeric;
  v_r_lng numeric;
  v_nearest_driver uuid;
begin
  if not exists (select 1 from drivers where id = p_driver_id and user_id = auth.uid()) then
    raise exception 'not your driver profile';
  end if;

  update drivers
    set latitude = coalesce(p_lat, latitude),
        longitude = coalesce(p_lng, longitude),
        location_updated_at = now()
    where id = p_driver_id;

  select * into v_offer from order_offers where driver_id = p_driver_id and status = 'offered' limit 1;
  if found then
    return v_offer;
  end if;

  if not exists (select 1 from drivers where id = p_driver_id and available = true) then
    return null;
  end if;

  select o.id, r.latitude, r.longitude
    into v_order_id, v_r_lat, v_r_lng
    from orders o
    join restaurants r on r.id = o.restaurant_id
    where o.status = 'preparing'
      and o.driver_id is null
      and r.plan = 'entrega'
      and r.use_platform_drivers = true
      and not exists (select 1 from order_offers oo where oo.order_id = o.id and oo.status = 'offered')
      and not exists (
        select 1 from order_offers oo
        where oo.order_id = o.id and oo.driver_id = p_driver_id and oo.status in ('declined', 'expired')
      )
    order by o.created_at asc
    limit 1;

  if v_order_id is null then
    return null;
  end if;

  -- entregador elegível mais perto do restaurante ganha a vez; sem localização
  -- fica sempre por último (não trava o sistema, só perde prioridade)
  select d.id into v_nearest_driver
    from drivers d
    where d.available = true
      and not exists (select 1 from order_offers oo where oo.driver_id = d.id and oo.status = 'offered')
      and not exists (
        select 1 from order_offers oo
        where oo.order_id = v_order_id and oo.driver_id = d.id and oo.status in ('declined', 'expired')
      )
    order by
      (d.latitude is null or d.longitude is null) asc,
      case when d.latitude is not null and d.longitude is not null then
        2 * 6371 * asin(sqrt(
          sin(radians((d.latitude - v_r_lat) / 2)) ^ 2 +
          cos(radians(v_r_lat)) * cos(radians(d.latitude)) *
          sin(radians((d.longitude - v_r_lng) / 2)) ^ 2
        ))
      else null end asc nulls last
    limit 1;

  if v_nearest_driver is null or v_nearest_driver <> p_driver_id then
    return null;
  end if;

  insert into order_offers (order_id, driver_id, status)
  values (v_order_id, p_driver_id, 'offered')
  returning * into v_offer;

  return v_offer;
exception
  when unique_violation then
    return null;
end;
$$;

grant execute on function claim_nearest_offer(uuid, double precision, double precision) to authenticated;
