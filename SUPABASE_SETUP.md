# 剑客游学 - Supabase 集成指南

## 📋 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 登录/注册账号
3. 点击 "New Project" 创建新项目
4. 记录以下信息：
   - Project URL（项目URL）
   - Anon/Public Key（公钥）

### 2. 创建数据库表结构

1. 在 Supabase 控制台，进入 **SQL Editor**
2. 复制 `supabase-schema.sql` 的全部内容
3. 粘贴到 SQL 编辑器并点击 **Run**
4. 等待执行完成，应该看到成功提示

### 3. 插入测试数据

1. 在同一个 SQL 编辑器
2. 复制 `supabase-mockdata.sql` 的全部内容
3. 粘贴并点击 **Run**
4. 测试数据会自动插入

### 4. 配置环境变量

#### 本地测试（Node.js）

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Supabase 信息：

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

#### 前端部署（Vite）

如果使用 Vite 开发，在项目根目录创建 `.env`：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. 测试 Supabase 连接

```bash
node test-supabase.js
```

你应该看到类似输出：

```
🔌 测试 Supabase 连接...

1️⃣ 测试读取学生信息
✅ 学生信息: { id: '...', name: '琴剑少侠', ... }

2️⃣ 测试读取今日进度
✅ 今日进度: { math_progress: 50, ... }

...

🎉 所有测试完成！
```

## 📊 数据库表结构说明

| 表名 | 说明 |
|------|------|
| `students` | 学生基本信息 |
| `daily_progress` | 每日学习进度（数学、英语、习惯） |
| `habit_checks` | 习惯打卡记录（早起、练琴等） |
| `interest_scores` | 兴趣雷达分数（6个维度） |
| `daily_choices` | 每日选择记录（用于追踪兴趣） |
| `course_timeline` | 课程时间线（每日学习计划） |
| `unlocked_rewards` | 已解锁的奖励（3D模型等） |
| `achievements` | 已获得的成就 |

## 🔧 API 使用示例

### 获取今日进度

```javascript
import { getTodayProgress } from './supabase-client.js';

const progress = await getTodayProgress();
console.log(progress.math_progress); // 50
```

### 切换习惯打卡

```javascript
import { toggleHabit } from './supabase-client.js';

await toggleHabit('piano'); // 切换"练琴"状态
```

### 更新数学进度

```javascript
import { updateProgress } from './supabase-client.js';

await updateProgress('math', 60); // 设置数学进度为60%
```

### 读取兴趣雷达数据

```javascript
import { getInterests } from './supabase-client.js';

const interests = await getInterests();
// { history: 70, engineering: 40, music: 50, ... }
```

## 🛡️ 安全注意事项

**当前配置是演示模式**，所有表都允许公开读写（方便测试）。

生产环境需要：

1. **启用用户认证**：使用 Supabase Auth
2. **修改 RLS 策略**：
   ```sql
   -- 删除公开策略
   DROP POLICY "允许所有操作" ON students;
   
   -- 创建基于用户的策略
   CREATE POLICY "用户只能访问自己的数据" 
   ON students 
   FOR ALL 
   USING (auth.uid() = id);
   ```

## 🚀 下一步

1. ✅ 运行 `node test-supabase.js` 验证连接
2. 📝 修改前端代码，将 localStorage 替换为 Supabase 调用
3. 🎨 添加加载状态和错误处理
4. 🔒 生产环境前启用用户认证

## 📚 参考资料

- [Supabase 文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
