-- =============================================
-- ATOS Fit Database Schema for Supabase + ICP Auth
-- Uses ICP Principal ID as user identifier
-- =============================================

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.food_logs CASCADE;
DROP TABLE IF EXISTS public.chatbot_logs CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Table (uses ICP Principal as ID)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY, -- ICP Principal ID (e.g., "2vxsx-fae" or full principal)
  email TEXT,
  full_name TEXT NOT NULL DEFAULT 'ICP User',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  fitness_level TEXT DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT[] DEFAULT '{}',
  profile_picture TEXT,
  age INTEGER,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  date_joined TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 2. Exercises Table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  repetitions INTEGER,
  sets INTEGER DEFAULT 1,
  duration_sec INTEGER,
  angle_accuracy DECIMAL(5,2),
  calories_burned INTEGER,
  date_performed TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. Chatbot Logs Table
CREATE TABLE public.chatbot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  is_user_message BOOLEAN DEFAULT true,
  conversation_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Food Logs Table
CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fat DECIMAL(5,2),
  portion_size TEXT,
  image_url TEXT,
  date_logged TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. Achievements Table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  tokens_earned INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 100,
  level INTEGER DEFAULT 1,
  date_earned TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_code)
);

-- 6. User Stats Table (Aggregated)
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_workouts INTEGER DEFAULT 0,
  total_calories_burned INTEGER DEFAULT 0,
  total_workout_time INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for Performance
-- =============================================

CREATE INDEX idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX idx_exercises_date ON public.exercises(date_performed);
CREATE INDEX idx_exercises_name ON public.exercises(exercise_name);

CREATE INDEX idx_chatbot_logs_user_id ON public.chatbot_logs(user_id);
CREATE INDEX idx_chatbot_logs_conversation ON public.chatbot_logs(conversation_id);
CREATE INDEX idx_chatbot_logs_timestamp ON public.chatbot_logs(timestamp);

CREATE INDEX idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX idx_food_logs_date ON public.food_logs(date_logged);

CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);

-- =============================================
-- DISABLE ROW LEVEL SECURITY (for ICP Auth)
-- Since we're using ICP for auth, not Supabase Auth
-- =============================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Grant permissions to anon and authenticated roles
-- =============================================

GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.exercises TO anon, authenticated;
GRANT ALL ON public.chatbot_logs TO anon, authenticated;
GRANT ALL ON public.food_logs TO anon, authenticated;
GRANT ALL ON public.achievements TO anon, authenticated;
GRANT ALL ON public.user_stats TO anon, authenticated;
