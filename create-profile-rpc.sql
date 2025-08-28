-- RPC 함수로 프로필 조회 (PostgREST 스키마 캐시 우회용)
CREATE OR REPLACE FUNCTION get_user_profile(input_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  phone_number VARCHAR(20),
  date_of_birth DATE,
  preferences JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 사용자 인증 확인 (RLS 우회)
  IF auth.uid() != input_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to profile';
  END IF;

  -- 프로필 반환
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.phone_number,
    p.date_of_birth,
    p.preferences,
    p.stats,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = input_user_id;
END;
$$;

-- RPC 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;

-- 프로필 생성 RPC 함수
CREATE OR REPLACE FUNCTION create_user_profile(
  input_user_id UUID,
  input_display_name VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  phone_number VARCHAR(20),
  date_of_birth DATE,
  preferences JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 사용자 인증 확인
  IF auth.uid() != input_user_id THEN
    RAISE EXCEPTION 'Unauthorized profile creation';
  END IF;

  -- 기존 프로필이 있는지 확인
  IF EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = input_user_id) THEN
    -- 기존 프로필 반환
    RETURN QUERY
    SELECT 
      p.id,
      p.user_id,
      p.display_name,
      p.bio,
      p.avatar_url,
      p.phone_number,
      p.date_of_birth,
      p.preferences,
      p.stats,
      p.created_at,
      p.updated_at
    FROM profiles p
    WHERE p.user_id = input_user_id;
  ELSE
    -- 새 프로필 생성
    RETURN QUERY
    INSERT INTO profiles (
      user_id,
      display_name,
      preferences,
      stats
    )
    VALUES (
      input_user_id,
      COALESCE(input_display_name, '사용자'),
      '{
        "theme": "system",
        "language": "ko",
        "notifications": {
          "email": true,
          "push": false,
          "goalReminders": true,
          "eventReminders": true,
          "weeklyReport": true
        },
        "privacy": {
          "showProfile": true,
          "showStats": true
        }
      }'::jsonb,
      '{
        "totalGoals": 0,
        "completedGoals": 0,
        "totalEvents": 0,
        "completedEvents": 0,
        "currentStreak": 0,
        "longestStreak": 0
      }'::jsonb
    )
    RETURNING *;
  END IF;
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, VARCHAR) TO authenticated;