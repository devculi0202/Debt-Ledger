-- WhatsApp debt reminders: settings + send log
-- Run in Supabase SQL editor (or via CLI) before enabling the Reminder debt page.

-- Ensure debts can be scoped per user for the reminder scanner
alter table public.debts
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists debts_user_id_idx on public.debts (user_id);
create index if not exists debts_due_date_idx on public.debts (due_date)
  where due_date is not null and paid is not true;

-- Global reminder config (one row per user)
create table if not exists public.reminder_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  phone text not null default '',
  message_template text not null default
    'Reminder: {person} — {amount} due on {due_date}.',
  days_before integer not null default 3 check (days_before >= 0),
  enabled boolean not null default false,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Avoid duplicate WhatsApp sends for the same debt/remind day
create table if not exists public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  remind_on_date date not null,
  sent_at timestamptz not null default now(),
  unique (debt_id, remind_on_date)
);

create index if not exists reminder_sends_user_id_idx on public.reminder_sends (user_id);

alter table public.reminder_settings enable row level security;
alter table public.reminder_sends enable row level security;

drop policy if exists "reminder_settings_select_own" on public.reminder_settings;
create policy "reminder_settings_select_own"
  on public.reminder_settings for select
  using (auth.uid() = user_id);

drop policy if exists "reminder_settings_insert_own" on public.reminder_settings;
create policy "reminder_settings_insert_own"
  on public.reminder_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminder_settings_update_own" on public.reminder_settings;
create policy "reminder_settings_update_own"
  on public.reminder_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reminder_settings_delete_own" on public.reminder_settings;
create policy "reminder_settings_delete_own"
  on public.reminder_settings for delete
  using (auth.uid() = user_id);

drop policy if exists "reminder_sends_select_own" on public.reminder_sends;
create policy "reminder_sends_select_own"
  on public.reminder_sends for select
  using (auth.uid() = user_id);

-- Inserts are done by the Railway worker with the service role (bypasses RLS).
-- Users can read their send history from the app if needed.