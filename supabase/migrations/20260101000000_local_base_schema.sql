-- LOCAL DEV ONLY: base schema for debt_accounts + debts.
-- These tables are created manually in the owner's hosted Supabase project and
-- are NOT part of the repo's committed migrations. This file is generated during
-- local dev environment setup so `supabase start` can bring up a working DB.
-- Column shapes are inferred from src/services/*.js and src/components/modals/*.

create table if not exists public.debt_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  type text not null default 'owe',
  principal_amount bigint not null default 0,
  creditor text,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  type text not null default 'owe',
  person text,
  amount bigint not null default 0,
  transaction_date date,
  due_date date,
  notes text,
  account_id uuid references public.debt_accounts (id) on delete set null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists debt_accounts_user_id_idx on public.debt_accounts (user_id);
create index if not exists debts_account_id_idx on public.debts (account_id);

alter table public.debt_accounts enable row level security;
alter table public.debts enable row level security;

drop policy if exists "debt_accounts_all_own" on public.debt_accounts;
create policy "debt_accounts_all_own" on public.debt_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "debts_all_own" on public.debts;
create policy "debts_all_own" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Hosted Supabase grants these automatically; add explicitly for local dev.
grant select, insert, update, delete on public.debt_accounts to authenticated;
grant select, insert, update, delete on public.debts to authenticated;
