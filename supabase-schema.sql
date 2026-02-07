// Supabase 数据库架构设计
// 运行此脚本在 Supabase SQL 编辑器中创建表结构

-- 1. 学生表
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT DEFAULT '彦平少侠',
  avatar TEXT DEFAULT '🥷',
  start_date DATE DEFAULT CURRENT_DATE,
  current_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 每日进度表
CREATE TABLE daily_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  math_progress INTEGER DEFAULT 0,
  english_progress INTEGER DEFAULT 0,
  habits_progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- 3. 习惯打卡表
CREATE TABLE habit_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  habit_type TEXT NOT NULL, -- 'wake', 'piano', 'exercise', 'read', 'sleep', 'math'
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date, habit_type)
);

-- 4. 兴趣追踪表
CREATE TABLE interest_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL, -- 'history', 'engineering', 'music', 'martial', 'logic', 'art'
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, interest_type)
);

-- 5. 每日选择记录表
CREATE TABLE daily_choices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  choice_type TEXT NOT NULL, -- 'engineering', 'music', 'history', 'logic'
  choice_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 课程时间线表
CREATE TABLE course_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  time TEXT NOT NULL, -- '08:00'
  event_title TEXT NOT NULL,
  event_subtitle TEXT,
  event_icon TEXT,
  duration_hours DECIMAL,
  status TEXT DEFAULT 'pending', -- 'pending', 'current', 'completed'
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 奖励解锁表
CREATE TABLE unlocked_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_icon TEXT,
  unlock_condition TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 成就表
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  achievement_name TEXT NOT NULL,
  achievement_desc TEXT,
  achievement_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全 (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略 (演示用，生产环境需要改为基于用户认证的策略)
CREATE POLICY "允许所有操作" ON students FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON daily_progress FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON habit_checks FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON interest_scores FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON daily_choices FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON course_timeline FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON unlocked_rewards FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON achievements FOR ALL USING (true);

-- 创建索引优化查询性能
CREATE INDEX idx_daily_progress_student_date ON daily_progress(student_id, date);
CREATE INDEX idx_habit_checks_student_date ON habit_checks(student_id, date);
CREATE INDEX idx_course_timeline_student_date ON course_timeline(student_id, date);
CREATE INDEX idx_daily_choices_student_date ON daily_choices(student_id, date);
