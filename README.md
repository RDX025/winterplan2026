# 剑客游学

寒假学习计划的游戏化 Web 应用（Vanilla JS + Supabase）。

## 快速开始

```bash
npm install
npm run dev
```

## 环境变量

在 `.env` 中配置：

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 主要功能

- 每日仪表盘（数学/英语/习惯）
- 课程时间线打卡
- 习惯打卡系统
- 每日兴趣选择 + 雷达图
- 奖励系统 + 成就墙
- 离线缓存降级（断网可用）

## 测试

```bash
npm test
```

## 部署

Vercel 部署配置见 `vercel.json`。

## STL 文件

请上传 STL 到 Supabase Storage `stl` bucket 并更新 `app.js` 中的 `REWARDS` 下载链接。
