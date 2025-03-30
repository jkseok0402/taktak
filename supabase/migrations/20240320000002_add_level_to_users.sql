-- users 테이블에 level 컬럼 추가
alter table public.users
add column level integer not null default 1;

-- level 컬럼에 대한 제약 조건 추가 (1-9 사이의 값만 허용)
alter table public.users
add constraint users_level_check check (level >= 1 and level <= 9);

-- 기존 사용자의 level을 1로 설정
update public.users set level = 1 where level is null; 