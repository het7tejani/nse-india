create table if not exists public.holdings(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,symbol text not null check(symbol ~ '^[A-Z0-9][A-Z0-9&-]{0,19}$'),quantity numeric not null check(quantity>0),buy_price numeric not null check(buy_price>0),created_at timestamptz default now(),unique(user_id,symbol));
alter table public.holdings enable row level security;
revoke all on public.holdings from anon;
grant select,insert,update,delete on public.holdings to authenticated;
create policy "own_select" on public.holdings for select to authenticated using(user_id=(select auth.uid()));
create policy "own_insert" on public.holdings for insert to authenticated with check(user_id=(select auth.uid()));
create policy "own_update" on public.holdings for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "own_delete" on public.holdings for delete to authenticated using(user_id=(select auth.uid()));
