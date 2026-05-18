# FilmNote — FD&Ceci 电影/剧集评价应用

## 项目概况

Fank1ng 与 ceci 共用的电影+剧集评分系统。纯 HTML 单页应用 + Supabase BaaS + GitHub Pages 部署 + Cloudflare Worker 后端。

| 角色 | 颜色 |
|------|------|
| Fank1ng | 金色 `#f59e0b` |
| ceci | 粉色 `#ec4899` |
| 其他朋友 | 蓝色 `#3b82f6` |

- **线上**: https://fank1ng.github.io/filmnote/
- **仓库**: https://github.com/Fank1ng/filmnote （master 分支自动部署）

## 架构

```
index.html              — 前端单页 (~3300行)：影单/发现/统计/添加评价/设置
worker/src/index.js     — Cloudflare Worker (~980行)：推荐算法/TMDB代理/KV缓存
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
- **GitHub Pages 并发锁**: workflow 有 `concurrency: group: pages; cancel-in-progress: true`，新 push 会取消正在运行的部署
- **编辑 index.html 注意**: 文件 3300+ 行，Edit 工具经常因空格/tab 不匹配失败，可用 Bash + Python 脚本做复杂替换
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
