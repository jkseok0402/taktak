create table public.users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  login_code text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 정책 설정
alter table public.users enable row level security;

create policy "Anyone can view users" on public.users
  for select using (true);

create policy "Anyone can insert users" on public.users
  for insert with check (true);

-- 테스트 사용자 추가
insert into public.users (name, login_code) values ('관리자', '123456'); 