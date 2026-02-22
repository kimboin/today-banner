create table if not exists public.daily_banner_claims (
  date_key text primary key,
  text varchar(40) not null,
  claimed_at timestamptz not null default now()
);
