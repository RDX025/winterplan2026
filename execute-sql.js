const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hsybcomykhfnyngtytyg.supabase.co',
  'sbp_fcf7f647957508e2e85b3e8fa64801dfa5f4ec56'
);

const sql = `
-- 创建表
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS habit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  date DATE NOT NULL,
  habit_type TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, date, habit_type)
);

CREATE TABLE IF NOT EXISTS interest_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  interest_type TEXT NOT NULL,
  score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, interest_type)
);

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
`;

async function execute() {
  console.log('🚀 开始执行SQL...');
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
  
  console.log('✅ SQL执行成功!');
  console.log('返回数据:', data);
}

execute();
