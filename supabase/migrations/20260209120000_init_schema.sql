-- 剑客游学数据库初始化

-- 学生表
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每日进度表
CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  date DATE NOT NULL,
  math_progress INT DEFAULT 0,
  english_progress INT DEFAULT 0,
  habits_progress INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- 习惯打卡表
CREATE TABLE IF NOT EXISTS habit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  date DATE NOT NULL,
  habit_type TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, date, habit_type)
);

-- 兴趣评分表
CREATE TABLE IF NOT EXISTS interest_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  interest_type TEXT NOT NULL,
  score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, interest_type)
);

-- 日程表
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  date DATE NOT NULL,
  event_title TEXT NOT NULL,
  event_icon TEXT DEFAULT '📌',
  start_hour INT NOT NULL,
  start_minute INT DEFAULT 0,
  end_hour INT NOT NULL,
  end_minute INT DEFAULT 0,
  color TEXT DEFAULT '#F4D03F',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, event_title, start_hour)
);

-- 每周精彩表
CREATE TABLE IF NOT EXISTS weekly_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  achievement_date DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  icon TEXT DEFAULT '🌟',
  score INT DEFAULT 0,
  comment TEXT,
  media_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 解锁奖励表
CREATE TABLE IF NOT EXISTS unlocked_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  reward_name TEXT NOT NULL,
  reward_icon TEXT,
  unlock_condition TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  achievement_name TEXT NOT NULL,
  achievement_desc TEXT,
  achievement_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 禁用RLS（开发环境）
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE interest_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_progress_student_date ON daily_progress(student_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_checks_student_date ON habit_checks(student_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_items_student_date ON schedule_items(student_id, date);
