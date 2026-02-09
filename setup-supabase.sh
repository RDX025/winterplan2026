#!/bin/bash

# 剑客游学 - Supabase自动化设置脚本
# 用法: ./setup-supabase.sh <ACCESS_TOKEN>

set -e

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TOKEN=${1:-$SUPABASE_ACCESS_TOKEN}
PROJECT_REF="hsybcomykhfnyngtytyg"
API_BASE="https://api.supabase.com/v1/projects/$PROJECT_REF"

echo -e "${YELLOW}🚀 开始Supabase自动化设置...${NC}"
echo ""

# 1. 检查Token
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 错误: 请提供Access Token${NC}"
    echo "用法: ./setup-supabase.sh <ACCESS_TOKEN>"
    echo "或设置环境变量: export SUPABASE_ACCESS_TOKEN='sbp_xxx'"
    exit 1
fi

echo -e "${GREEN}✅ Token已获取${NC}"

# 2. 执行SQL建表
echo ""
echo -e "${YELLOW}📦 创建数据库表...${NC}"

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, avatar TEXT, created_at TIMESTAMPTZ DEFAULT NOW())"}'

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS daily_progress (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID REFERENCES students(id), date DATE NOT NULL, math_progress INT DEFAULT 0, english_progress INT DEFAULT 0, habits_progress INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(student_id, date))"}'

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS habit_checks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID REFERENCES students(id), date DATE NOT NULL, habit_type TEXT NOT NULL, is_completed BOOLEAN DEFAULT FALSE, completed_at TIMESTAMPTZ, UNIQUE(student_id, date, habit_type))"}'

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS interest_scores (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID REFERENCES students(id), interest_type TEXT NOT NULL, score INT DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(student_id, interest_type))"}'

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS schedule_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID REFERENCES students(id), date DATE NOT NULL, event_title TEXT NOT NULL, event_icon TEXT DEFAULT '\''📌'\'', start_hour INT NOT NULL, start_minute INT DEFAULT 0, end_hour INT NOT NULL, end_minute INT DEFAULT 0, color TEXT DEFAULT '\''#F4D03F'\'', status TEXT DEFAULT '\''pending'\'', created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(student_id, date, event_title, start_hour))"}'

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS weekly_achievements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID REFERENCES students(id), achievement_date DATE NOT NULL, title TEXT NOT NULL, category TEXT, icon TEXT DEFAULT '\''🌟'\'', score INT DEFAULT 0, comment TEXT, media_url TEXT, video_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW())"}'

echo -e "${GREEN}✅ 表创建完成${NC}"

# 3. 禁用RLS
echo ""
echo -e "${YELLOW}🔓 禁用行级安全(RLS)...${NC}"

for table in students daily_progress habit_checks interest_scores schedule_items weekly_achievements; do
  curl -s -X POST "$API_BASE/database/query" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"ALTER TABLE $table DISABLE ROW LEVEL SECURITY\"}"
done

echo -e "${GREEN}✅ RLS禁用完成${NC}"

# 4. 创建默认学生
echo ""
echo -e "${YELLOW}👤 创建默认学生...${NC}"

curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "INSERT INTO students (id, name, avatar) VALUES ('\''11111111-1111-1111-1111-111111111111'\'', '\''彦平少侠'\'', '\''ninja'\'') ON CONFLICT (id) DO UPDATE SET name = '\''彦平少侠'\'' RETURNING *"}'

echo ""
echo -e "${GREEN}✅ 默认学生创建完成${NC}"

# 5. 验证
echo ""
echo -e "${YELLOW}🔍 验证数据库...${NC}"

echo "表列表:"
curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name IN ('\''students'\'', '\''daily_progress'\'', '\''habit_checks'\'', '\''interest_scores'\'', '\''schedule_items'\'', '\''weekly_achievements'\'')"}'

echo ""
echo -e "${GREEN}🎉 Supabase设置完成！${NC}"
echo ""
echo "下一步: 刷新前端页面测试数据同步"

# 5. 创建user_photos表（照片）
echo ""
echo "📸 创建照片表..."
curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS user_photos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_id UUID REFERENCES students(id), photo_data TEXT NOT NULL, date TEXT, created_at TIMESTAMPTZ DEFAULT NOW())"}'

echo "🔓 禁用user_photos的RLS..."
curl -s -X POST "$API_BASE/database/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE user_photos DISABLE ROW LEVEL SECURITY"}'

echo "✅ user_photos表创建完成"
