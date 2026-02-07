# 剑客游学 - Development Specification (开发规格书)

**版本：** 2.0  
**日期：** 2026-02-07  
**作者：** Fox7 Development Team  
**状态：** Draft

---

## 1. 技术架构 (Technical Architecture)

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │  HTML/CSS  │  │ JavaScript │  │ Supabase Client.js │ │
│  │  (UI Layer)│  │ (App Logic)│  │   (API Wrapper)    │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS (REST API)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase (Backend)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │ PostgreSQL │  │  Auth API  │  │  Storage (STL)     │ │
│  │ (Database) │  │    (RLS)   │  │   (3D Models)      │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Deployment (Vercel/Netlify)                │
│          Static Hosting + Serverless Functions            │
└─────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

#### 前端技术栈
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **框架** | Vanilla JS | ES6+ | 无框架，原生 JavaScript |
| **UI** | HTML5 + CSS3 | - | 响应式布局 + CSS Grid/Flexbox |
| **数据可视化** | Canvas API | - | 雷达图渲染 |
| **网络请求** | Supabase JS | ^2.39.0 | 官方 SDK |
| **本地存储** | localStorage | - | 离线缓存（降级方案） |
| **构建工具** | Vite | ^5.0.0 | 可选，开发环境热更新 |

#### 后端技术栈
| 服务 | 技术 | 说明 |
|------|------|------|
| **数据库** | Supabase (PostgreSQL) | 完全托管的 PostgreSQL |
| **认证** | Supabase Auth | 可选，当前为演示模式 |
| **存储** | Supabase Storage | 存储 STL 文件 |
| **实时订阅** | Supabase Realtime | 可选，多设备同步 |

#### 部署方案
| 环境 | 平台 | 说明 |
|------|------|------|
| **开发** | 本地 | Live Server / Vite Dev Server |
| **测试** | Vercel Preview | PR 自动部署预览 |
| **生产** | Vercel / Netlify | CDN + HTTPS |

---

## 2. 数据库设计 (Database Design)

### 2.1 表结构详细说明

#### Table 1: `students` (学生表)
```sql
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT DEFAULT '琴剑少侠',
  avatar TEXT DEFAULT '🥷',
  start_date DATE DEFAULT CURRENT_DATE,
  current_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**字段说明：**
- `id`: 主键，自动生成 UUID
- `name`: 学生姓名，必填
- `title`: 武侠称号（如"少年剑客"）
- `avatar`: Emoji 头像
- `start_date`: 开始日期，用于计算当前第几天
- `current_day`: 当前进度（1-14天）

**索引：**
```sql
CREATE INDEX idx_students_start_date ON students(start_date);
```

---

#### Table 2: `daily_progress` (每日进度表)
```sql
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
```

**字段说明：**
- `student_id`: 外键关联学生
- `date`: 日期，与 student_id 组成唯一约束
- `math_progress`: 数学进度 0-100
- `english_progress`: 英语进度 0-100
- `habits_progress`: 习惯完成度 0-100（自动计算）

**索引：**
```sql
CREATE INDEX idx_daily_progress_student_date ON daily_progress(student_id, date DESC);
```

**业务逻辑：**
- 每天零点自动创建当天记录（前端首次加载时）
- `habits_progress` 由前端计算：`(完成习惯数 / 6) * 100`

---

#### Table 3: `habit_checks` (习惯打卡表)
```sql
CREATE TABLE habit_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  habit_type TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date, habit_type)
);
```

**枚举值：**
- `habit_type`: `'wake' | 'piano' | 'exercise' | 'read' | 'sleep' | 'math'`

**字段说明：**
- `is_completed`: 是否完成
- `completed_at`: 完成时间戳（用于验证真实性）

**索引：**
```sql
CREATE INDEX idx_habit_checks_student_date ON habit_checks(student_id, date);
```

---

#### Table 4: `interest_scores` (兴趣分数表)
```sql
CREATE TABLE interest_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, interest_type)
);
```

**枚举值：**
- `interest_type`: `'history' | 'engineering' | 'music' | 'martial' | 'logic' | 'art'`

**业务逻辑：**
- 初始值全部为 0
- 每次选择对应兴趣 +5 分
- 最大值 100

---

#### Table 5: `daily_choices` (每日选择记录表)
```sql
CREATE TABLE daily_choices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  choice_type TEXT NOT NULL,
  choice_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**字段说明：**
- `choice_type`: 对应 `interest_type`
- `choice_title`: 选择的具体内容（如"读三国故事"）

---

#### Table 6: `course_timeline` (课程时间线表)
```sql
CREATE TABLE course_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  time TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_subtitle TEXT,
  event_icon TEXT,
  duration_hours DECIMAL,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**枚举值：**
- `status`: `'pending' | 'current' | 'completed'`

**业务逻辑：**
- 每天自动创建5个固定时间段
- `current` 状态根据当前时间自动判断

---

#### Table 7: `unlocked_rewards` (解锁奖励表)
```sql
CREATE TABLE unlocked_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_icon TEXT,
  unlock_condition TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### Table 8: `achievements` (成就表)
```sql
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  achievement_name TEXT NOT NULL,
  achievement_desc TEXT,
  achievement_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 2.2 数据库安全策略 (RLS)

#### 当前模式（演示用）
```sql
CREATE POLICY "允许所有操作" ON students FOR ALL USING (true);
```

#### 生产模式（需启用认证）
```sql
-- 删除演示策略
DROP POLICY "允许所有操作" ON students;

-- 用户只能访问自己的数据
CREATE POLICY "用户访问自己数据" 
ON students 
FOR ALL 
USING (auth.uid() = id);
```

---

## 3. API 设计 (API Design)

### 3.1 Supabase 客户端封装

#### 初始化客户端
```javascript
// supabase-client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

#### API 方法列表

##### 1. 学生信息
```javascript
// 获取学生信息
async function getStudent(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();
  
  if (error) throw error;
  return data;
}
```

##### 2. 每日进度
```javascript
// 获取今日进度
async function getTodayProgress(studentId) {
  const today = new Date().toISOString().split('T')[0];
  
  let { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .single();
  
  // 如果不存在，自动创建
  if (error && error.code === 'PGRST116') {
    ({ data, error } = await supabase
      .from('daily_progress')
      .insert([{ student_id: studentId, date: today }])
      .select()
      .single());
  }
  
  if (error) throw error;
  return data;
}

// 更新进度
async function updateProgress(type, value, studentId) {
  const today = new Date().toISOString().split('T')[0];
  const field = `${type}_progress`; // 'math_progress'
  
  const { data, error } = await supabase
    .from('daily_progress')
    .update({ [field]: value })
    .eq('student_id', studentId)
    .eq('date', today)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

##### 3. 习惯打卡
```javascript
// 切换习惯打卡状态
async function toggleHabit(habitType, studentId) {
  const today = new Date().toISOString().split('T')[0];
  
  // 查询是否存在
  let { data: existing } = await supabase
    .from('habit_checks')
    .select('*')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('habit_type', habitType)
    .single();
  
  if (existing) {
    // 切换状态
    const newStatus = !existing.is_completed;
    const { data, error } = await supabase
      .from('habit_checks')
      .update({
        is_completed: newStatus,
        completed_at: newStatus ? new Date().toISOString() : null
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // 创建新记录
    const { data, error } = await supabase
      .from('habit_checks')
      .insert([{
        student_id: studentId,
        date: today,
        habit_type: habitType,
        is_completed: true,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

##### 4. 兴趣追踪
```javascript
// 更新兴趣分数
async function updateInterest(interestType, increment, studentId) {
  const { data: current } = await supabase
    .from('interest_scores')
    .select('score')
    .eq('student_id', studentId)
    .eq('interest_type', interestType)
    .single();
  
  const newScore = Math.min(100, (current?.score || 0) + increment);
  
  const { data, error } = await supabase
    .from('interest_scores')
    .update({ 
      score: newScore,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .eq('interest_type', interestType)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## 4. 前端开发规范 (Frontend Development)

### 4.1 项目结构
```
jiankexuexue/
├── index.html              # 主页面
├── style.css               # 样式文件
├── app.js                  # 主应用逻辑
├── supabase-client.js      # API 封装
├── .env                    # 环境变量（不提交到 Git）
├── .gitignore
├── package.json
├── vite.config.js          # Vite 配置（可选）
└── assets/
    ├── fonts/              # 字体文件
    ├── stl/                # 3D 模型文件
    └── sounds/             # 音效文件
```

### 4.2 代码规范

#### JavaScript 规范
```javascript
// 1. 使用 async/await 处理异步操作
async function loadData() {
  try {
    const progress = await getTodayProgress(STUDENT_ID);
    renderProgress(progress);
  } catch (error) {
    console.error('加载失败:', error);
    showToast('数据加载失败，请刷新重试');
  }
}

// 2. 使用常量定义配置
const CONFIG = {
  STUDENT_ID: '11111111-1111-1111-1111-111111111111',
  HABITS: ['wake', 'piano', 'exercise', 'read', 'sleep', 'math'],
  INTERESTS: ['history', 'engineering', 'music', 'martial', 'logic', 'art']
};

// 3. 函数命名：动词开头
async function fetchTodayProgress() { }
function renderTimeline(data) { }
function handleHabitClick(habitId) { }

// 4. 错误处理：统一 try-catch
async function safeAPICall(apiFunc, errorMsg) {
  try {
    return await apiFunc();
  } catch (error) {
    console.error(error);
    showToast(errorMsg || '操作失败');
    throw error;
  }
}
```

#### CSS 规范
```css
/* 1. 使用 BEM 命名 */
.habit-card { }
.habit-card__icon { }
.habit-card--checked { }

/* 2. 使用 CSS 变量 */
:root {
  --color-primary: #f4d03f;
  --color-math: #ff6b6b;
  --color-english: #4ecdc4;
  --color-habits: #95e1d3;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}

/* 3. 移动优先 */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}
```

### 4.3 性能优化

#### 1. 防抖与节流
```javascript
// 防抖：用户停止输入后才执行
function debounce(func, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// 节流：限制执行频率
function throttle(func, limit = 1000) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用示例
const handleScroll = throttle(() => {
  console.log('滚动事件');
}, 200);
```

#### 2. 懒加载
```javascript
// 雷达图延迟渲染
let radarChart = null;

function lazyLoadRadarChart() {
  if (!radarChart) {
    radarChart = new RadarChart('radarCanvas');
  }
  return radarChart;
}
```

#### 3. 缓存策略
```javascript
// 内存缓存
const cache = new Map();

async function getCachedData(key, fetcher, ttl = 60000) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < ttl) {
      return data;
    }
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// 使用示例
const progress = await getCachedData('today-progress', getTodayProgress);
```

---

## 5. 开发任务分解 (Task Breakdown)

### 5.1 Sprint 1: 基础设施搭建（4小时）

#### Task 1.1: Supabase 配置
- [ ] 创建 Supabase 项目
- [ ] 执行 `supabase-schema.sql`
- [ ] 执行 `supabase-mockdata.sql`
- [ ] 测试数据库连接

**估时：** 30分钟

---

#### Task 1.2: 前端项目初始化
- [ ] 初始化 npm 项目
- [ ] 安装依赖 `@supabase/supabase-js`
- [ ] 配置 `.env` 环境变量
- [ ] 创建 `supabase-client.js`

**估时：** 30分钟

---

#### Task 1.3: 现有代码清理
- [ ] 删除 localStorage 相关代码
- [ ] 重构 `app.js` 结构
- [ ] 抽离配置到 `config.js`

**估时：** 1小时

---

### 5.2 Sprint 2: 核心功能开发（8小时）

#### Task 2.1: 每日仪表盘
```javascript
// 需实现的函数
async function initDashboard() {
  const progress = await getTodayProgress();
  renderProgressBars(progress);
}

function renderProgressBars(progress) {
  document.getElementById('mathProgress').style.width = progress.math_progress + '%';
  document.getElementById('engProgress').style.width = progress.english_progress + '%';
  document.getElementById('habitsProgress').style.width = progress.habits_progress + '%';
}
```
**估时：** 1小时

---

#### Task 2.2: 习惯打卡系统
```javascript
// 需实现的函数
async function initHabits() {
  const habits = await getTodayHabits();
  renderHabits(habits);
}

function renderHabits(habits) {
  habits.forEach(habit => {
    const card = document.getElementById(`habit-${habit.habit_type}`);
    card.classList.toggle('checked', habit.is_completed);
  });
}

async function handleHabitClick(habitType) {
  const updated = await toggleHabit(habitType);
  
  // 更新 UI
  const card = document.getElementById(`habit-${habitType}`);
  card.classList.toggle('checked', updated.is_completed);
  
  // 重新计算习惯进度
  await recalculateHabitsProgress();
}

async function recalculateHabitsProgress() {
  const habits = await getTodayHabits();
  const completed = habits.filter(h => h.is_completed).length;
  const progress = Math.round((completed / 6) * 100);
  
  await updateProgress('habits', progress);
  renderProgressBars(await getTodayProgress());
}
```
**估时：** 2小时

---

#### Task 2.3: 课程时间线
```javascript
// 需实现的函数
async function initTimeline() {
  const timeline = await getTodayTimeline();
  renderTimeline(timeline);
}

function renderTimeline(timeline) {
  const container = document.querySelector('.timeline');
  container.innerHTML = timeline.map(item => `
    <div class="timeline-item ${item.status}" data-id="${item.id}">
      <div class="time">${item.time}</div>
      <div class="event">
        <span class="event-icon">${item.event_icon}</span>
        <div class="event-info">
          <span class="event-title">${item.event_title}</span>
          <span class="event-subtitle">${item.event_subtitle}</span>
        </div>
        <span class="event-status">${getStatusIcon(item.status)}</span>
      </div>
    </div>
  `).join('');
  
  // 绑定点击事件
  container.querySelectorAll('.timeline-item').forEach(item => {
    item.addEventListener('click', () => handleTimelineClick(item.dataset.id));
  });
}

async function handleTimelineClick(timelineId) {
  if (!confirm('确认完成此任务吗？')) return;
  
  await updateTimelineStatus(timelineId, 'completed');
  await initTimeline(); // 重新渲染
  showToast('✅ 打卡成功');
}
```
**估时：** 2小时

---

#### Task 2.4: 每日兴趣选择
```javascript
async function handleChoiceClick(choiceType, choiceTitle) {
  // 1. 记录选择
  await recordChoice(choiceType, choiceTitle);
  
  // 2. 更新兴趣分数
  await updateInterest(choiceType, 5);
  
  // 3. 重新渲染雷达图
  const interests = await getInterests();
  drawRadarChart(interests);
  
  showToast('✅ 已记录选择');
}
```
**估时：** 1.5小时

---

#### Task 2.5: 兴趣雷达图
```javascript
async function initRadarChart() {
  const interests = await getInterests();
  drawRadarChart(interests);
}

function drawRadarChart(interests) {
  const canvas = document.getElementById('radarChart');
  const ctx = canvas.getContext('2d');
  
  // ... 绘制逻辑（已有代码可复用）
  
  // 添加数据更新动画
  animateRadarChart(ctx, interests);
}
```
**估时：** 1.5小时

---

### 5.3 Sprint 3: 高级功能（6小时）

#### Task 3.1: 奖励系统
- [ ] 实现解锁条件检测
- [ ] 弹窗动画
- [ ] STL 文件下载

**估时：** 2小时

---

#### Task 3.2: 成就系统
- [ ] 定义15个成就规则
- [ ] 后台自动检测逻辑
- [ ] 成就墙UI

**估时：** 2小时

---

#### Task 3.3: 城市活动推荐
- [ ] 活动数据 API
- [ ] 城市切换功能
- [ ] 日期筛选

**估时：** 2小时

---

### 5.4 Sprint 4: 测试与优化（4小时）

#### Task 4.1: 单元测试
```javascript
// test/supabase-client.test.js
import { describe, it, expect } from 'vitest';
import { getTodayProgress, toggleHabit } from '../supabase-client.js';

describe('Supabase Client', () => {
  it('should get today progress', async () => {
    const progress = await getTodayProgress(TEST_STUDENT_ID);
    expect(progress).toHaveProperty('math_progress');
  });
  
  it('should toggle habit', async () => {
    const habit = await toggleHabit('piano', TEST_STUDENT_ID);
    expect(habit.is_completed).toBe(true);
  });
});
```
**估时：** 2小时

---

#### Task 4.2: 性能优化
- [ ] 图片压缩
- [ ] API 请求合并
- [ ] 懒加载实现

**估时：** 1小时

---

#### Task 4.3: 兼容性测试
- [ ] Chrome/Safari/Firefox 测试
- [ ] iOS/Android 真机测试
- [ ] 响应式布局调整

**估时：** 1小时

---

## 6. 测试计划 (Testing Plan)

### 6.1 功能测试清单

#### 每日仪表盘
- [ ] 进度条正确显示
- [ ] 数据从 Supabase 读取
- [ ] 离线时显示缓存数据

#### 习惯打卡
- [ ] 点击切换状态
- [ ] 打卡时间戳记录
- [ ] 习惯进度自动更新

#### 课程时间线
- [ ] 点击打卡成功
- [ ] 状态正确更新
- [ ] 确认弹窗正常

#### 兴趣选择
- [ ] 选择记录到数据库
- [ ] 兴趣分数增加
- [ ] 雷达图更新

### 6.2 性能测试

| 测试项 | 目标值 | 测量工具 |
|--------|--------|----------|
| 首屏加载时间 | < 2秒 | Lighthouse |
| API 响应时间 | < 500ms | Chrome DevTools |
| 内存占用 | < 50MB | Performance Monitor |

### 6.3 兼容性测试矩阵

| 浏览器 | 版本 | 桌面 | 移动 |
|--------|------|------|------|
| Chrome | 90+ | ✅ | ✅ |
| Safari | 14+ | ✅ | ✅ |
| Firefox | 88+ | ✅ | ✅ |

---

## 7. 部署方案 (Deployment)

### 7.1 环境配置

#### 开发环境
```bash
# .env.development
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_ENV=development
```

#### 生产环境
```bash
# .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_ENV=production
```

### 7.2 Vercel 部署

#### 配置文件
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### 部署命令
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 7.3 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 8. 时间估算 (Time Estimation)

### 8.1 开发时间表

| 阶段 | 任务 | 估时 | 实际 |
|------|------|------|------|
| Sprint 1 | 基础设施 | 4h | - |
| Sprint 2 | 核心功能 | 8h | - |
| Sprint 3 | 高级功能 | 6h | - |
| Sprint 4 | 测试优化 | 4h | - |
| **总计** | | **22h** | - |

### 8.2 里程碑

- **Day 1 (8h):** 完成 Sprint 1 + Sprint 2 前半部分
- **Day 2 (8h):** 完成 Sprint 2 后半部分 + Sprint 3
- **Day 3 (6h):** 完成 Sprint 4 + 部署上线

---

## 9. 风险管理 (Risk Management)

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Supabase 服务中断 | 低 | 高 | 实现本地缓存降级 |
| API 限流 | 中 | 中 | 请求合并 + 防抖 |
| 跨域问题 | 低 | 低 | 配置 CORS |
| 数据迁移失败 | 低 | 高 | 备份原数据 |

---

## 10. 附录 (Appendix)

### 10.1 环境变量示例
```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 10.2 开发命令
```bash
# 本地开发
npm run dev

# 构建生产
npm run build

# 预览构建
npm run preview

# 运行测试
npm test

# 格式化代码
npm run format
```

### 10.3 代码提交规范
```
feat: 添加习惯打卡功能
fix: 修复雷达图渲染问题
docs: 更新 README
style: 调整按钮样式
refactor: 重构 API 调用逻辑
test: 添加单元测试
chore: 更新依赖
```

---

**文档版本：** v1.0  
**最后更新：** 2026-02-07 11:00  
**下一步：** 开始 Sprint 1 开发
