-- =====================================================================
--  MEHMON — aqlli QR-menyu (Supabase sxemasi)
--  SQL Editor → shu faylni to'liq joylashtiring → Run
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- JADVALLAR ----------
create table if not exists public.mn_restaurants (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid unique default auth.uid() references auth.users on delete cascade,
  slug           text not null unique check (slug ~ '^[a-z0-9-]{3,24}$'),
  name           text not null,
  tagline        text,
  address        text,
  phone          text,
  accent         text not null default '#F5B829',
  staff_chat_id  bigint,
  staff_code     text not null unique default encode(gen_random_bytes(6), 'hex'),
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.mn_categories (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.mn_restaurants on delete cascade,
  name           jsonb not null,               -- {"uz":"..","ru":"..",...}
  emoji          text not null default '🍽',
  sort           int not null default 0
);

create table if not exists public.mn_dishes (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.mn_restaurants on delete cascade,
  category_id    uuid references public.mn_categories on delete set null,
  name           jsonb not null,
  description    jsonb not null default '{}'::jsonb,
  price          numeric not null check (price >= 0),
  emoji          text not null default '🍽',
  photo_url      text,
  prep_min       int not null default 15,
  is_available   boolean not null default true,
  is_popular     boolean not null default false,
  is_spicy       boolean not null default false,
  is_veg         boolean not null default false,
  sort           int not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.mn_tables (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.mn_restaurants on delete cascade,
  label          text not null,
  code           text not null unique default upper(encode(gen_random_bytes(3), 'hex')),
  seats          int not null default 4
);

create table if not exists public.mn_orders (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.mn_restaurants on delete cascade,
  table_id       uuid references public.mn_tables on delete set null,
  table_label    text,
  number         int not null,
  items          jsonb not null,               -- [{dish_id,name,emoji,price,qty}]
  total          numeric not null,
  status         text not null default 'new' check (status in ('new','cooking','ready','served','cancelled')),
  note           text,
  lang           text not null default 'uz',
  guest_name     text,
  guest_chat_id  bigint,
  public_token   text not null unique default encode(gen_random_bytes(10), 'hex'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.mn_calls (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.mn_restaurants on delete cascade,
  table_label    text,
  kind           text not null check (kind in ('waiter','bill')),
  done           boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists mn_dishes_rest_idx on public.mn_dishes(restaurant_id);
create index if not exists mn_orders_rest_idx on public.mn_orders(restaurant_id, created_at desc);
create index if not exists mn_calls_rest_idx  on public.mn_calls(restaurant_id, created_at desc);

-- ---------- RLS: egasi faqat o'z restoranini boshqaradi ----------
create or replace function public.mn_my_rest() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.mn_restaurants where owner_id = auth.uid();
$$;

alter table public.mn_restaurants enable row level security;
alter table public.mn_categories  enable row level security;
alter table public.mn_dishes      enable row level security;
alter table public.mn_tables      enable row level security;
alter table public.mn_orders      enable row level security;
alter table public.mn_calls       enable row level security;

drop policy if exists mn_rest_own on public.mn_restaurants;
create policy mn_rest_own on public.mn_restaurants for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['mn_categories','mn_dishes','mn_tables','mn_orders','mn_calls'] loop
    execute format('drop policy if exists %I_own on public.%I', t, t);
    execute format('create policy %I_own on public.%I for all using (restaurant_id = public.mn_my_rest()) with check (restaurant_id = public.mn_my_rest())', t, t);
  end loop;
end $$;

-- ---------- OCHIQ FUNKSIYALAR (mehmon uchun) ----------
create or replace function public.mn_get_menu(p_slug text, p_code text default null)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'restaurant', json_build_object('id', r.id, 'slug', r.slug, 'name', r.name, 'tagline', r.tagline,
                                    'address', r.address, 'phone', r.phone, 'accent', r.accent, 'is_demo', r.is_demo),
    'table', (select json_build_object('id', t.id, 'label', t.label, 'code', t.code)
              from public.mn_tables t where t.restaurant_id = r.id and t.code = upper(p_code)),
    'categories', coalesce((select json_agg(json_build_object('id', c.id, 'name', c.name, 'emoji', c.emoji) order by c.sort)
                  from public.mn_categories c where c.restaurant_id = r.id), '[]'::json),
    'dishes', coalesce((select json_agg(json_build_object('id', d.id, 'category_id', d.category_id, 'name', d.name,
                  'description', d.description, 'price', d.price, 'emoji', d.emoji, 'photo_url', d.photo_url,
                  'prep_min', d.prep_min, 'is_popular', d.is_popular, 'is_spicy', d.is_spicy, 'is_veg', d.is_veg) order by d.sort)
                  from public.mn_dishes d where d.restaurant_id = r.id and d.is_available), '[]'::json)
  )
  from public.mn_restaurants r where r.slug = lower(p_slug);
$$;

create or replace function public.mn_order_status(p_token text)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('number', o.number, 'status', o.status, 'items', o.items, 'total', o.total,
    'table_label', o.table_label, 'created_at', o.created_at, 'updated_at', o.updated_at,
    'restaurant', r.name, 'slug', r.slug, 'accent', r.accent)
  from public.mn_orders o join public.mn_restaurants r on r.id = o.restaurant_id
  where o.public_token = p_token;
$$;

-- Buyurtma: narxlar serverda hisoblanadi (mijoz narxni o'zgartira olmaydi)
create or replace function public.mn_place_order(p_slug text, p_code text, p_items jsonb, p_note text,
  p_lang text, p_guest_name text, p_chat_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare
  r public.mn_restaurants; t public.mn_tables; it jsonb; d public.mn_dishes;
  lines jsonb := '[]'::jsonb; tot numeric := 0; q int; n int; o public.mn_orders;
begin
  select * into r from public.mn_restaurants where slug = lower(p_slug);
  if r.id is null then raise exception 'Restoran topilmadi'; end if;
  select * into t from public.mn_tables where restaurant_id = r.id and code = upper(p_code);
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Savat bo''sh'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    q := least(greatest(coalesce((it->>'qty')::int, 1), 1), 50);
    select * into d from public.mn_dishes where id = (it->>'dish_id')::uuid and restaurant_id = r.id and is_available;
    if d.id is null then continue; end if;
    lines := lines || jsonb_build_object('dish_id', d.id, 'name', d.name, 'emoji', d.emoji, 'price', d.price, 'qty', q);
    tot := tot + d.price * q;
  end loop;
  if jsonb_array_length(lines) = 0 then raise exception 'Taomlar topilmadi'; end if;
  select coalesce(max(number), 0) + 1 into n from public.mn_orders
    where restaurant_id = r.id and created_at > date_trunc('day', now());
  insert into public.mn_orders (restaurant_id, table_id, table_label, number, items, total, note, lang, guest_name, guest_chat_id)
  values (r.id, t.id, coalesce(t.label, 'Olib ketish'), n, lines, tot, left(p_note, 300), coalesce(p_lang, 'uz'),
          left(p_guest_name, 60), p_chat_id)
  returning * into o;
  return json_build_object('id', o.id, 'number', o.number, 'token', o.public_token, 'total', o.total,
    'table_label', o.table_label, 'restaurant', r.name, 'staff_chat_id', r.staff_chat_id, 'items', o.items);
end $$;

create or replace function public.mn_call(p_slug text, p_code text, p_kind text)
returns json language plpgsql security definer set search_path = public as $$
declare r public.mn_restaurants; t public.mn_tables;
begin
  select * into r from public.mn_restaurants where slug = lower(p_slug);
  if r.id is null then raise exception 'Restoran topilmadi'; end if;
  select * into t from public.mn_tables where restaurant_id = r.id and code = upper(p_code);
  insert into public.mn_calls (restaurant_id, table_label, kind) values (r.id, coalesce(t.label, '—'), p_kind);
  return json_build_object('ok', true, 'restaurant', r.name, 'table_label', coalesce(t.label, '—'), 'staff_chat_id', r.staff_chat_id);
end $$;

-- ---------- DEMO: oshxona ekranini login'siz ko'rish (faqat is_demo restoran) ----------
create or replace function public.mn_demo_board()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'restaurant', (select json_build_object('id', id, 'name', name, 'slug', slug) from public.mn_restaurants where is_demo limit 1),
    'orders', coalesce((select json_agg(o order by o.created_at desc) from (
        select id, number, table_label, items, total, status, note, lang, guest_name, created_at, updated_at
        from public.mn_orders where restaurant_id = (select id from public.mn_restaurants where is_demo limit 1)
          and created_at > now() - interval '24 hours' order by created_at desc limit 60) o), '[]'::json),
    'calls', coalesce((select json_agg(c order by c.created_at desc) from (
        select id, table_label, kind, done, created_at from public.mn_calls
        where restaurant_id = (select id from public.mn_restaurants where is_demo limit 1)
          and not done and created_at > now() - interval '6 hours' order by created_at desc limit 20) c), '[]'::json)
  );
$$;

create or replace function public.mn_demo_set_status(p_order uuid, p_status text)
returns json language plpgsql security definer set search_path = public as $$
declare o public.mn_orders;
begin
  update public.mn_orders set status = p_status, updated_at = now()
   where id = p_order and restaurant_id = (select id from public.mn_restaurants where is_demo limit 1)
     and p_status in ('new','cooking','ready','served','cancelled')
  returning * into o;
  if o.id is null then raise exception 'Topilmadi'; end if;
  return json_build_object('id', o.id, 'number', o.number, 'status', o.status, 'lang', o.lang,
    'guest_chat_id', o.guest_chat_id, 'public_token', o.public_token, 'table_label', o.table_label);
end $$;

create or replace function public.mn_demo_call_done(p_call uuid)
returns void language sql security definer set search_path = public as $$
  update public.mn_calls set done = true
  where id = p_call and restaurant_id = (select id from public.mn_restaurants where is_demo limit 1);
$$;

-- Egasi uchun status (bot xabari server orqali)
create or replace function public.mn_link_staff(p_code text, p_chat bigint)
returns text language sql security definer set search_path = public as $$
  update public.mn_restaurants set staff_chat_id = p_chat where staff_code = p_code returning name;
$$;

create or replace function public.mn_order_by_id(p_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select row_to_json(o) from public.mn_orders o where o.id = p_id;
$$;

grant execute on function public.mn_get_menu(text, text)        to anon, authenticated;
grant execute on function public.mn_order_status(text)          to anon, authenticated;
grant execute on function public.mn_call(text, text, text)      to anon, authenticated;
grant execute on function public.mn_demo_board()                to anon, authenticated;
grant execute on function public.mn_demo_set_status(uuid, text) to anon, authenticated;
grant execute on function public.mn_demo_call_done(uuid)        to anon, authenticated;
revoke execute on function public.mn_place_order(text, text, jsonb, text, text, text, bigint) from public, anon, authenticated;
revoke execute on function public.mn_link_staff(text, bigint)   from public, anon, authenticated;
revoke execute on function public.mn_order_by_id(uuid)          from public, anon, authenticated;
grant  execute on function public.mn_place_order(text, text, jsonb, text, text, text, bigint) to service_role;
grant  execute on function public.mn_link_staff(text, bigint)   to service_role;
grant  execute on function public.mn_order_by_id(uuid)          to service_role;

-- Nasiya trigger'i Mehmon foydalanuvchilariga do'kon yaratmasin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'app', '') = 'mehmon' then return new; end if;
  insert into public.shops (id, name, owner_name, phone)
  values (new.id,
    coalesce(nullif(new.raw_user_meta_data->>'shop_name',''), 'Mening do''konim'),
    new.raw_user_meta_data->>'owner_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;
