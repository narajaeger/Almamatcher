-- 20260629_premium_orders.sql
-- Orders table for iPaymu premium purchases.
-- The actual granting of is_premium is done server-side by the
-- `ipaymu-callback` Edge Function using the service_role key
-- (the prevent_premium_self_grant trigger blocks any client attempt).

create table if not exists public.premium_orders (
  id           text primary key,            -- our referenceId sent to iPaymu
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan         text not null,               -- monthly | quarterly | yearly
  months       int  not null,
  amount       int  not null,               -- IDR
  status       text not null default 'pending', -- pending | paid | failed | expired
  ipaymu_trx_id text,
  session_id   text,
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);

create index if not exists premium_orders_user_idx on public.premium_orders(user_id);
create index if not exists premium_orders_status_idx on public.premium_orders(status);

alter table public.premium_orders enable row level security;

-- Users may read their own orders (to show purchase history / status).
drop policy if exists "read own premium orders" on public.premium_orders;
create policy "read own premium orders"
  on public.premium_orders for select
  using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies: only the Edge Functions
-- (service_role) write to this table.
