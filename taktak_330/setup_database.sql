-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 테이블에 RLS 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 users 테이블을 볼 수 있도록 허용
CREATE POLICY "모든 사용자가 users 테이블을 볼 수 있음" ON public.users
  FOR SELECT USING (true);

-- 모든 사용자가 users 테이블에 추가할 수 있도록 허용
CREATE POLICY "모든 사용자가 users 테이블에 추가할 수 있음" ON public.users
  FOR INSERT WITH CHECK (true);

-- 테스트 사용자 추가
INSERT INTO public.users (name)
VALUES ('admin');

-- 경기 결과 테이블 생성
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL REFERENCES public.users(id),
  loser_id UUID NOT NULL REFERENCES public.users(id),
  winner_sets INTEGER NOT NULL,
  loser_sets INTEGER NOT NULL,
  match_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 경기 결과 테이블에 RLS 정책 설정
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 matches 테이블을 볼 수 있도록 허용
CREATE POLICY "모든 사용자가 matches 테이블을 볼 수 있음" ON public.matches
  FOR SELECT USING (true);

-- 모든 사용자가 matches 테이블에 추가할 수 있도록 허용
CREATE POLICY "모든 사용자가 matches 테이블에 추가할 수 있음" ON public.matches
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 matches 테이블을 삭제할 수 있도록 허용
CREATE POLICY "모든 사용자가 matches 테이블을 삭제할 수 있음" ON public.matches
  FOR DELETE USING (true);

-- 샘플 데이터 삽입
INSERT INTO public.users (name)
VALUES 
  ('Player 1'),
  ('Player 2');

-- 샘플 경기 기록 삽입 
-- (Player 1이 Player 2를 3:0으로 이겼다고 가정)
WITH player1 AS (SELECT id FROM public.users WHERE name = 'Player 1' LIMIT 1),
     player2 AS (SELECT id FROM public.users WHERE name = 'Player 2' LIMIT 1)
INSERT INTO public.matches (winner_id, loser_id, winner_sets, loser_sets, match_date)
SELECT 
  (SELECT id FROM player1),
  (SELECT id FROM player2),
  3,
  0,
  CURRENT_DATE; 