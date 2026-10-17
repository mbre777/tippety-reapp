-- Tippety: Trigger, Wertung und RPCs

-- ---------------------------------------------------------------- Profil bei Signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- Tipp-Sperre
-- Greift nur bei INSERT bzw. Aenderung von home/away (Wertung setzt nur points).
create or replace function public.enforce_tip_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_kickoff timestamptz;
  v_status  text;
begin
  select m.kickoff_at, m.status into v_kickoff, v_status
  from public.matches m where m.id = new.match_id;

  if v_kickoff is null or now() >= v_kickoff or v_status <> 'scheduled' then
    raise exception 'tip_locked' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger tips_lock_insert
  before insert on public.tips
  for each row execute function public.enforce_tip_lock();
create trigger tips_lock_update
  before update of home, away, match_id on public.tips
  for each row execute function public.enforce_tip_lock();

-- ---------------------------------------------------------------- Punkte
-- 5 = exakt, 3 = richtige Tordifferenz (nur bei Sieg/Niederlage),
-- 2 = richtige Tendenz (inkl. Remis mit falschem Ergebnis), 0 = sonst.
create or replace function public.calc_points(p_tip_home int, p_tip_away int, p_res_home int, p_res_away int)
returns int language sql immutable set search_path = '' as $$
  select case
    when p_res_home is null or p_res_away is null then null
    when p_tip_home = p_res_home and p_tip_away = p_res_away then 5
    when p_res_home <> p_res_away and (p_tip_home - p_tip_away) = (p_res_home - p_res_away) then 3
    when sign(p_tip_home - p_tip_away) = sign(p_res_home - p_res_away) then 2
    else 0
  end
$$;

-- Idempotent: berechnet alle Tipps eines Spiels aus dem aktuellen Ergebnis neu.
-- Fussball: *_final; Eishockey: *_regular (Stand nach 60 Minuten).
-- Nicht 'finished' -> Punkte werden auf NULL zurueckgesetzt.
create or replace function public.score_match(p_match_id uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  m public.matches;
  v_home int;
  v_away int;
  v_count int;
begin
  select * into m from public.matches where id = p_match_id;
  if not found then
    raise exception 'match_not_found' using errcode = 'P0002';
  end if;

  if m.status = 'finished' then
    if m.sport = 'hockey' then
      v_home := m.home_regular; v_away := m.away_regular;
    else
      v_home := m.home_final;   v_away := m.away_final;
    end if;
  end if;

  update public.tips t
     set points = public.calc_points(t.home, t.away, v_home, v_away),
         scored_version = case when v_home is null then null else m.result_version end
   where t.match_id = p_match_id
     and (t.points is distinct from public.calc_points(t.home, t.away, v_home, v_away)
          or t.scored_version is distinct from case when v_home is null then null else m.result_version end);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Version hochzaehlen bei Ergebnis-/Statusaenderung
create or replace function public.matches_before_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.home_regular, new.away_regular, new.home_final, new.away_final, new.status, new.decided_by)
     is distinct from
     (old.home_regular, old.away_regular, old.home_final, old.away_final, old.status, old.decided_by) then
    new.result_version := old.result_version + 1;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger matches_bump_version
  before update on public.matches
  for each row execute function public.matches_before_update();

create or replace function public.matches_after_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'finished'
     or (tg_op = 'UPDATE' and old.status = 'finished') then
    perform public.score_match(new.id);
  end if;
  return null;
end $$;

create trigger matches_score
  after insert or update on public.matches
  for each row execute function public.matches_after_change();

-- ---------------------------------------------------------------- Nickname
create or replace function public.nickname_status(p_nickname text, p_self uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v text := lower(btrim(coalesce(p_nickname, '')));
begin
  if v !~ '^[a-z0-9_]{3,16}$' then
    return 'invalid';
  end if;
  if exists (select 1 from public.reserved_nicknames r
             where (r.kind = 'exact' and r.term = v)
                or (r.kind = 'contains' and strpos(replace(v, '_', ''), r.term) > 0)) then
    return 'reserved';
  end if;
  if exists (select 1 from public.profiles p
             where p.nickname::text = v and p.id is distinct from p_self) then
    return 'taken';
  end if;
  return 'available';
end $$;

create or replace function public.check_nickname(p_nickname text)
returns text language sql stable security definer set search_path = '' as $$
  select public.nickname_status(p_nickname, auth.uid())
$$;

create or replace function public.set_nickname(p_nickname text)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v text := lower(btrim(coalesce(p_nickname, '')));
  v_status text;
  r public.profiles;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  v_status := public.nickname_status(v, v_uid);
  if v_status <> 'available' then
    raise exception 'nickname_%', v_status using errcode = 'P0001';
  end if;
  begin
    insert into public.profiles (id, nickname) values (v_uid, v)
    on conflict (id) do update set nickname = excluded.nickname, updated_at = now()
    returning * into r;
  exception when unique_violation then
    raise exception 'nickname_taken' using errcode = 'P0001';
  end;
  return r;
end $$;

-- ---------------------------------------------------------------- Gruppen
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members gm
                 where gm.group_id = p_group_id and gm.user_id = auth.uid())
$$;

create or replace function public.generate_invite_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- ohne 0/O/1/I (32 Zeichen)
  b bytea := uuid_send(gen_random_uuid());
  v text := '';
begin
  for i in 0..7 loop
    v := v || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return v;
end $$;

create or replace function public.create_group(p_name text)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  g public.groups;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 40 then
    raise exception 'invalid_group_name' using errcode = 'P0001';
  end if;
  for attempt in 1..10 loop
    begin
      insert into public.groups (name, invite_code, owner_id)
      values (btrim(p_name), public.generate_invite_code(), v_uid)
      returning * into g;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  insert into public.group_members (group_id, user_id, role) values (g.id, v_uid, 'owner');
  return g;
end $$;

create or replace function public.join_group_by_code(p_code text)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  g public.groups;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  select * into g from public.groups
   where invite_code = upper(btrim(coalesce(p_code, '')));
  if not found then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.group_members where group_id = g.id and user_id = v_uid) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  insert into public.group_members (group_id, user_id, role) values (g.id, v_uid, 'member');
  return g;
end $$;

-- Verlaesst der Owner die Gruppe, geht sie an das aelteste Mitglied; letzter Member -> Gruppe geloescht.
create or replace function public.leave_group(p_group_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_next uuid;
begin
  delete from public.group_members where group_id = p_group_id and user_id = v_uid
  returning role into v_role;
  if v_role is null then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
  if v_role = 'owner' then
    select user_id into v_next from public.group_members
     where group_id = p_group_id order by joined_at, user_id limit 1;
    if v_next is null then
      delete from public.groups where id = p_group_id;
    else
      update public.group_members set role = 'owner' where group_id = p_group_id and user_id = v_next;
      update public.groups set owner_id = v_next where id = p_group_id;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------- Tipps
create or replace function public.upsert_tip(p_match_id uuid, p_home int, p_away int)
returns public.tips language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  t public.tips;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_home is null or p_away is null or p_home not between 0 and 99 or p_away not between 0 and 99 then
    raise exception 'invalid_tip' using errcode = 'P0001';
  end if;
  insert into public.tips (user_id, match_id, home, away)
  values (v_uid, p_match_id, p_home, p_away)
  on conflict (user_id, match_id) do update set home = excluded.home, away = excluded.away
  returning * into t;
  return t;
end $$;

-- ---------------------------------------------------------------- Rechte auf Funktionen
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.check_nickname(text), public.set_nickname(text),
  public.create_group(text), public.join_group_by_code(text), public.leave_group(uuid),
  public.upsert_tip(uuid, int, int), public.is_group_member(uuid), public.calc_points(int, int, int, int)
  to authenticated;
revoke execute on function public.score_match(uuid), public.nickname_status(text, uuid),
  public.generate_invite_code() from authenticated;
grant execute on all functions in schema public to service_role;
