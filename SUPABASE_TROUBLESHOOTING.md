# Supabase 连接问题排查指南

## 快速测试

打开浏览器控制台 (F12) 查看同步日志：

```javascript
// 应该看到：
🔧 Supabase配置检查:
  URL: ✅ 已配置
  Key: ✅ 已配置
🔌 使用 Supabase 模式
✅ Supabase连接成功
```

## 常见问题

### ❌ 问题1: "relation does not exist"
**原因**: 数据库表未创建

**解决**: 在Supabase SQL Editor中运行：

```sql
-- 1. 创建学生表
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建日程表
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

-- 3. 创建进度表
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

-- 4. 创建习惯表
CREATE TABLE IF NOT EXISTS habit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  date DATE NOT NULL,
  habit_type TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, date, habit_type)
);

-- 5. 创建兴趣表
CREATE TABLE IF NOT EXISTS interest_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  interest_type TEXT NOT NULL,
  score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, interest_type)
);
```

### ❌ 问题2: "Row Level Security" 拒绝访问
**原因**: RLS策略阻止了anon key访问

**解决**: 在Supabase Dashboard → Authentication → Policies：

**方案A**: 为anon用户禁用RLS（开发环境）
```sql
ALTER TABLE schedule_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE interest_scores DISABLE ROW LEVEL SECURITY;
```

**方案B**: 创建允许所有操作的策略
```sql
-- 为 schedule_items 创建策略
CREATE POLICY "Allow anon access" ON schedule_items
  FOR ALL USING (true) WITH CHECK (true);

-- 为其他表创建类似策略...
```

### ❌ 问题3: anon key无效
**原因**: key格式错误或已过期

**解决**: 在Supabase Dashboard → Settings → API：
1. 复制 "anon" public key
2. 格式: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### ❌ 问题4: CORS 错误
**原因**: Supabase未允许你的域名

**解决**: 在Supabase Dashboard → Settings → API → CORS：
添加你的域名：
- `http://localhost:5173` (本地开发)
- `https://rdx025.github.io` (GitHub Pages)

## Supabase Dashboard 步骤

1. 打开 https://hsybcomykhfnyngtytyg.supabase.co
2. 登录你的Supabase账号
3. 点击左侧 **SQL Editor**
4. 复制上面的SQL语句并运行
5. 点击 **Authentication** → **Policies**
6. 为每个表创建访问策略

## 测试连接

运行 `jiankexuexue/test-supabase.html` 页面查看测试结果。
