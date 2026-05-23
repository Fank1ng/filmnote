# FilmNote — FD&Ceci 电影/剧集评价应用

## 项目概况

Fank1ng 与 ceci 共用的电影+剧集评分系统。Vue 3 + Pinia + Vite + TypeScript 前端入口 + legacy 单页应用兼容层 + Supabase BaaS + GitHub Pages 部署 + Cloudflare Worker 后端。

| 角色 | 颜色 |
|------|------|
| Fank1ng | 金色 `#f59e0b` |
| ceci | 粉色 `#ec4899` |
| 其他朋友 | 蓝色 `#3b82f6` |

- **线上**: https://fank1ng.github.io/filmnote/
- **仓库**: https://github.com/Fank1ng/filmnote （master 分支自动部署）

## 架构

```
src/main.ts             — Vue 3 + Pinia 前端入口
src/app/bootstrap.ts    — 安装兼容全局并加载 legacy 脚本
src/features/registry.ts— 完整 feature registry；当前 feature 为 legacy-backed 渐进迁移状态
src/                    — 新模块化架构层：app/stores/config/api/core/shared/features/types
app.js                  — legacy 前端业务脚本，逐步迁移到 src/features/*
worker/src/index.js     — Cloudflare Worker：推荐算法/TMDB代理/KV缓存
supabase_constraints.sql— 数据库约束：去重/blocked_movies表及RLS
```

- **Worker 域名**: `filmnote.lccf1223.workers.dev`
- **KV namespace**: `FILMNOTE_KV`（电影详情/演职员永久缓存，推荐/搜索 TTL 缓存）
- **三级缓存**: L1 内存 Map → L2 Cloudflare KV → L3 TMDB API

## Supabase

- URL: `https://rkkakwmxzipxmofgrlwa.supabase.co`
- Anon Key: 传统 JWT 格式（不是 `sb_publishable_` 格式）
- 表: `entries`, `season_ratings`, `user_preferences`, `blocked_movies`
- RLS: 所有人可读，仅本人可写
- Auth: 邮箱+密码，已关闭邮箱验证确认

## 6 维度评分（权重）

故事与剧本 25% | 角色与表演 20% | 导演与视觉 15% | 剪辑与节奏 10% | 声音与配乐 10% | 情感共鸣 20%

## 关键注意事项

- **Worker 部署**: 修改 `worker/src/index.js` 后需 `cd worker && npx wrangler deploy`
- **前端开发**: 使用 `npm run dev`，生产构建使用 `npm run build`
- **Vue 主线**: 新 UI 使用 Vue SFC + Composition API；跨功能状态使用 Pinia stores
- **Feature registry**: 所有产品域都必须登记到 `src/features/registry.ts`
- **Pages 部署**: workflow 会执行 `npm ci && npm run build` 并发布 `dist/`
- **GitHub Pages 并发锁**: workflow 有 `concurrency: group: pages; cancel-in-progress: true`，新 push 会取消正在运行的部署
- **legacy 迁移**: 新功能优先进入 `src/features/*` 和 `src/shared/components/*`，避免继续扩大 `app.js`
- **legacy bridge**: Vue 侧通过 feature adapter 调用旧行为，避免直接访问 `window.FilmNoteLegacy`
- **TMDb API**: 中国网络需 VPN，Worker 端不受影响
- **Auth 状态管理**: 完全手动控制 `initApp()` / `doLogout()`，不使用 `onAuthStateChange`（历史原因：与手动 init 冲突导致 session 丢失）

## 用户偏好

- 中文提问→中文回复，英文提问→英文回复，不混用
- 偏好命令行执行（Bash）多于直接文件编辑
- 偏好先出方案/计划再编码，迭代式优化
- 研究对比类需求先给表格再给详细分析
- 不要主动提交 git commit，等用户指示

## 最近重要变更（2026-05-05）

- "不再推荐"机制：`blocked_movies` 表 + Worker blockedIds 过滤 + 前端 🚫 按钮 + 管理面板
- 推荐引擎并行化：Route 1 种子循环和 Routes 2-8 发现路由 Promise.all 化，Phase2 减少至 60/20
- 关键词延迟到 MMR 之后拉取，与最终评分一起计算
- Worker 新增 `/trending`、`/toprated`、`/search` 端点
