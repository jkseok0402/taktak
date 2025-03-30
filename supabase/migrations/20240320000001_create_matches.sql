create table public.matches (
  id uuid default gen_random_uuid() primary key,
  winner_id text not null,
  loser_id text not null,
  winner_sets integer not null,
  loser_sets integer not null,
  match_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.matches enable row level security;

create policy "Anyone can view matches" on public.matches
  for select using (true);

create policy "Anyone can insert matches" on public.matches
  for insert with check (true); 