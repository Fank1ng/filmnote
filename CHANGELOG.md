# FD&Ceci 更新日志

## 2026-05-13

### Worker 安全与部署修复
- **移除 TMDB 明文 Key fallback**：前端与 Worker 不再硬编码 TMDB API Key，改为 Cloudflare Worker Secret `TMDB_API_KEY`
- **兼容 TMDB v4 读访问令牌**：Worker 自动识别 JWT 读令牌并使用 `Authorization: Bearer` 请求 TMDB，同时保留 v3 `api_key` 兼容
- **CORS 白名单修复**：允许 `file://` 对应的 `Origin: null`，本地直接打开 HTML 时也可访问 Worker/TMDB 数据
- **Worker 配置修复**：修正 `wrangler.toml` 中 `[vars]` 位置，恢复 `TMDB_CACHE` KV binding
- **线上验证**：`/health` 返回 `tmdbKeyConfigured=true`、`kvConfigured=true`，`/trending` 正常返回 TMDB 数据

### 推荐接口加固
- **修复推荐运行时 bug**：`enrichAndScorePhase2` 补传 `env`，避免个性化推荐二阶段访问 TMDB 时失败
- **统一 JSON/CORS 响应**：新增 `jsonResponse`/`errorResponse`，接口错误状态更明确
- **输入上限**：`/prefetch` 50 ID、`/titles` 100 ID、`/credits` 50 ID、`/recommend` 1000 条评分、请求体 256KB
- **推荐缓存版本化**：推荐 Cache Key 增加 `REC_CACHE_VERSION=v2`，算法/输入结构升级后自动破旧缓存
- **推荐请求瘦身**：前端只发送 `user_id/type/tmdb_id/total_score/created_at`，不再把短评、简介等整包数据发给 Worker

### 推荐解释与负反馈
- **“为什么推荐”标签**：Worker 返回 `reasons`，推荐卡片展示“相似高分片 / 常看类型 / 高分年代 / 语种偏好”等解释
- **不再推荐原因**：`blocked_movies` 增加 `reason` 字段，屏蔽电影时可记录“已看过 / 类型不喜欢 / 太热门 / 太旧”等原因
- **自由文本负反馈生效**：Worker 识别“太冷门 / 看过其他版本 / 不想看这个导演”等自定义原因，转成冷门、相似版本、导演、类型等扣分信号参与推荐排序
- **屏蔽管理补全片名海报**：管理屏蔽弹窗会通过 TMDB 补齐电影标题、年份和海报，不再只显示 `tmdb_id`
- **Supabase 升级脚本**：新增 `supabase_upgrade_2026_05.sql`，包含 `blocked_movies.reason`、索引和基础 RLS 策略

### 想看清单
- **发现页一键想看**：未评分电影卡片新增 `☆/★` 想看按钮，本周热门、Top100、个性化推荐均可加入
- **用户菜单管理入口**：新增“想看清单”弹窗，支持分页查看、移出想看、直接进入快速评分
- **评分后自动移出**：从想看清单评分成功后，自动从 `watchlist_movies` 移除
- **Supabase 持久化**：新增 `watchlist_movies` 表升级 SQL，RLS 仅允许用户管理自己的想看数据

### 本地与工程维护
- **账号加载错误提示**：登录恢复、用户资料读取、会话 token 更新失败时显示具体错误，不再静默卡住
- **localStorage 缓存版本化**：`filmnote_cache_*` 增加 `CACHE_VERSION`，结构升级后自动丢弃旧缓存
- **前端入口拆分**：`index.html` 拆出 `styles.css`、`api.js`、`app.js`，并预留 `tmdb-cache.js`、`recommend-ui.js` 模块边界
- **依赖锁定**：新增 `worker/package-lock.json`，部署环境可复现安装 Wrangler 依赖
- **忽略本地依赖目录**：`.gitignore` 增加 `worker/node_modules/` 与 `node_modules/`

## 2026-05-09

### 英文导演/演员搜索（重建）
- **`searchIndex` 零阻塞搜索系统**：`buildSearchIndex()` 同步构建 `{entryId: "title|director|..."}` 索引，L1 基本字段零依赖即刻可用，L2 TMDB 中英文演职员异步富化自动生效
- **Worker `/credits` POST 端点**：批量获取中英文演职员，前端 50/批分片发送覆盖全部条目，5 个一批并发+50 ID 上限
- **`loadAllData` 去阻塞**：`warmCreditsEnCache` 纯 fire-and-forget，页面加载不再等待 Worker，影单列表立即渲染
- **4 个索引重建触发点**：缓存渲染前、新数据获取后、originalTitleCache/creditsEnCache 异步到达后自动 `renderList()`

### 单设备登录互踢
- **`session_token` 机制**：登录时 `crypto.randomUUID()` 生成 token → `sessionStorage`（tab 隔离）+ DB `user_preferences.session_token`
- **多触发点**：`loadAllData()` 校验、10s 轮询、visibilitychange 切回前台、Realtime `session_token` 变更检测
- **Realtime 优化**：仅 `session_token` 实际变更时触发 `loadAllData()`，避免自己写 prefs 导致双次加载

### 注册用户名去重
- **DB 约束**：`user_preferences.display_name` UNIQUE 约束
- **前端查重**：注册 + 改名时查询 `display_name` 是否已被占用

### simplify 审查清理
- `SESSION_KEY` 常量替换 6 处裸字符串、删除 `checkSessionOnFocus` 冗余函数及 6 处 WHAT 注释
- `warmCreditsEnCache` 从阻塞 `await` 改为 fire-and-forget、`renderActiveTab` 移除 session 检测
- 搜索热路径 cache miss 时 guard 跳过空 concat、`sessionStorage` 双读合并

## 2026-05-07

### 电影详情永久缓存体系
- **movieCache 完整缓存**：localStorage 永久存储 genres、vote_average、runtime、director、cast，与 overview 统一存取路径
- **Worker `/prefetch` 扩展**：返回 `details` 字段（完整 TMDB detail 对象），不再仅返回 overview 字符串
- **`extractMovieDetail` + `buildTmdbDetailHTML`**：统一提取/渲染逻辑，详情弹窗缓存命中时零网络请求
- **三级缓存渲染**：完整缓存 → overview-only → spinner，同步判断无需等待

### Worker 4端点迁移（前端减负）
- **`/detail/:tmdbId`**：合并 detail+credits 单次请求，消除双 HTTP 往返
- **`/titles`**：批量获取 original_title 替代串行预热
- **`/prefetch`**：增加 `return_overviews` 参数，一次拉取批量 overview
- **`/recommend`**：服务端 `exclude` 过滤替代客户端 `selectWithFreshness()`

### simplify + 5-agent 审查清理
- **`/simplify` 5项**：`setBatch` 优化、删除 `warmTitleTimer`、prefetch 反向索引 O(n²)→O(n+m)、Worker 避免种子 Set 预计算、提取 `buildAvoidGenreSet`
- **5-agent 审查 5项**：删除死代码（`buildDirectorCastHTML`/`hasOverview`）、消除重复 JSON.parse、genres `esc()` 缺失、N+1 DB 批量 UPDATE、catch 块错误日志

## 2026-05-06

### "不再推荐" UI 优化
- **布局修复**：`＋我的评分` + `🚫` 横向并排显示，修复按钮竖向排列问题
- **精简按钮范围**：本周热门、Top100 移除 🚫 按钮，仅在推荐 tab 显示
- **管理入口移至上角**：管理屏蔽从发现页内嵌面板移至右上角用户下拉菜单（退出上方）
- **模态框 + 分页**：点击"管理屏蔽"弹出模态框，复用影单同款分页组件，每页 12 部
- **恢复推荐自动调整页码**：取消屏蔽后页码自动修正，防止空页

## 2026-05-05

### 不再推荐机制
- **🚫 不再推荐按钮**：发现页推荐卡片未评分电影显示 🚫 按钮，一键加入屏蔽列表
- **Supabase blocked_movies 表**：持久化存储，RLS 用户隔离，Realtime 多端同步
- **Worker 端过滤**：推荐请求携带 blockedIds，`addRecs` 过滤已屏蔽电影，Cache Key 包含 blocked hash 自动破缓存
- **卡片淡出动画**：屏蔽后卡片 300ms 淡出移除，网格空了自动刷新
- **三级过滤覆盖**：推荐/本周热门/Top100 三个标签均已屏蔽电影

### 推荐性能优化
- **种子电影并行拉取**：Route 1 种子循环改为 `Promise.all` 并行请求，冷启动 ~25s → ~15s
- **发现路由并行化**：Routes 2-8 全部并行执行，KV 热启动 ~15s → ~9s
- **关键词延迟加载**：Phase2 关键词获取推迟至 MMR 之后，缓存命中 ~1.9s → ~1.4s
- **Phase2 批次缩减**：高级模式 80→60 部，基础模式 30→20 部，减少 TMDB 调用

### 前端精简 & 后端强化
- **前端减负 277 行**：删除死代码(refreshMainDims/discoverHistoryBatches)、移除 ~220 行本地推荐 fallback、移除前端防重复检查
- **Worker 新增端点**：`/trending`(热门Top12)、`/toprated`(Top100, vote_count≥500)、`/search?q=&type=`(TMDB搜索)
- **前端调用统一走 Worker**：loadTrending/loadTopRated/searchTmdb 不再直接调 TMDB API，改为 Worker 端点
- **Supabase 数据完整性**：添加 UNIQUE 约束 `(user_id, tmdb_id, type)` + `(entry_id, user_id, season_number)`，数据库层面防止重复

### Cloudflare KV 持久化缓存
- **三级缓存架构**：L1 内存 Map → L2 Cloudflare KV → L3 TMDB API
- **永久存储**：电影/剧集详情、演职员表写入 KV 永不过期，只拉取一次
- **智能 TTL**：推荐/相似列表 7 天，搜索/热门 1 天，平衡新鲜度与调用量
- **命中效果**：首次推荐 3-5s（TMDB 拉取），二次刷新 <1s（内存命中），冷启动 ~2s（KV 回填内存）
- **免费额度充足**：KV 1GB 存储 / 1000 写/天 / 100 万读/天，2 人规模远低于限制

## 2026-05-04

### Cloudflare Worker 后端
- **TMDB API 代理**：所有 TMDB 请求通过 `filmnote.lccf1223.workers.dev` 中转，API Key 不再暴露在前端
- **推荐算法服务端化**：`POST /recommend` 端点，Worker 并行拉取 TMDB 数据并执行评分排序，前端只需 1 次请求
- **双层缓存**：tmdbCache（内存，24h）+ Cache API（跨实例，1h），同一用户评分不变时刷新 0 次 TMDB 调用
- **movie-rater.html 重定向**：替换为 `index.html` 自动跳转

### 体验优化
- 推荐刷新冷却时间 15s → 5s（Worker 缓存已消除 TMDB 压力）

### 架构收益
- TMDB 限流（40次/10s）在 20 人规模下无压力
- 推荐刷新：二次命中 <2 秒，首次仍需 4-5 秒（取决于 TMDB 响应速度）
- 全部运行在 Cloudflare + GitHub Pages 免费额度内

---

## 2026-05-03

### TMDB 详情增强
- **影单弹窗增加电影简介/演员/导演**：有 tmdb_id 的记录自动加载 TMDB 简介、导演、前6位演员
- **发现页卡片可点击查看详情**：点击任意电影卡片弹窗显示完整 TMDB 信息（简介/导演/演员/TMDB 评分/类型）
- **内存缓存避免重复请求**：同一电影连续点击不重复请求 TMDB API
- 简介超过 150 字符可展开/收起

### Bug 修复
- 修复发现页"为你推荐"加载中途切换子标签导致内容错乱
- 修复列表分页按钮 .btn/.btn-sm 冲突 class 导致点击区域不稳定，按钮统一 44×44px

### 推荐页重设计
- **动态标签名**：基础模式"Ceci推荐"，高级模式(≥100部)"Ceci精心推荐"；ceci用户对应"FD推荐"/"FD精心推荐"
- **取消分页**：基础12部 / 高级24部，4列网格一次性展示
- **刷新替换率≥75%**：每次刷新至少替换9/18部新面孔，保证内容新鲜
- **循环逻辑**：追踪评价总数，连续3次刷新无变化→第4次循环重置
- **状态提示**：基础模式下刷新按钮后显示"评价100部，ceci将为你精心推荐"
- **高级算法(≥100部)**：
  - 10颗种子（5高分+3中分+2避雷），4条候选路由（推荐×2页/相似/类型发现/导演搜索）
  - 避雷机制：score<4的作品作为负面种子，类型高度重叠的候选被惩罚降权
  - 用户画像：基于Top30高分作品构建年代偏好和导演排行
  - 评分因子调整：类型35%+TMDB评分20%+源评分15%+年代15%+热度10%+新片5%
- **影单英文搜索**：后台预热originalTitleCache，搜索时纳入英文原名匹配

### 影单一致性 & 体验优化
- **单人记录卡片与多人样式统一**：评分方框改为 mc-score-sm（52×52），维度标签统一 mc-dim-item 格式
- **详情页朋友评分修复**：增加 title+year fallback 匹配，兼容手动添加（无 tmdb_id）的条目
- **详情页维度/颜色统一**：6维度改为 mc-dim-item 标签，总评分改用用户色，朋友评分维度标签带用户色
- **编辑按钮改为快捷弹窗**：电影编辑直接弹出评分窗口（预填原评分），与"+我的评分"交互一致；剧集编辑保留跳转完整表单
- **左上角用户名显示用户色**
- **导航标签顺序调整**：添加评价 → 影单 → 发现 → 统计分析
- **手机端发现页双列布局**
- **Realtime CLOSED 自动重连**：断线3秒重试

### 分页 & 本周热门优化
- **页码最多显示5个**：提取共享 `buildPaginationHTML` 函数，滑动窗口+省略号，影单和发现页统一
- **本周热门改为热度Top12**：取 trending API 第1页，按 popularity 降序排列，不过滤已评价电影

### Bug 修复
- 修复单条目卡片桌面端编辑/删除/＋我的评分按钮缺失（仅 .mc-actions-mobile 在桌面端被隐藏）
- 修复 initApp 阶段 getUserName 查不到当前用户导致右上角用户名显示为普通色（增加 currentProfile 回退）

---

## 2026-05-02

### Bug 修复
- 评分保存后定位逻辑统一：按当前筛选/排序计算正确页码，仅当条目不匹配时才清除筛选条件
- skipListRender 防止 loadAllData 触发的双重渲染
- 刷新按钮仅"Ceci为你推荐"子标签可见，本周热门/Top100 不显示
- 分页按钮加大至40×40px，改用委托事件+data-pg属性+300ms防抖，提升点击稳定性
- **提取 getFilteredSortedGroups 共享函数**：renderList 和 locateAndGoToList 使用完全一致的分组/筛选/排序逻辑，消除合并卡片定位页码偏差
- 列表分页改用委托事件+data-lp-pg属性+300ms防抖，与发现页分页模式统一
- 发现页快捷评分后跳转影单并定位到新记录

---

## 2026-05-01

### 发现推荐
- **新增"发现"Tab**：Ceci为你推荐 / 本周热门 / Top100 三个子标签
- **Ceci为你推荐**智能推荐算法：
  - 5部种子电影（3高分+2随机中分），3路汇聚（推荐/相似/发现）
  - 多因子排序：类型匹配40% + TMDB评分25% + 源电影评分20% + 热度10% + 新片5%
  - 每3次访问混入探索性推荐，打破信息茧房
  - 1/2/3页码导航
- **推荐标签名按用户切换**：ceci→"FD为你推荐"(金色)，其他→"Ceci为你推荐"(粉色)
- 桌面4列卡片网格，手机1列
- 快捷评分弹窗：推荐卡片/影单"+我的评分"一键打分

### 影单体验
- 「＋我的评分」改为快捷弹窗，不再跳转添加页
- 阻止同一用户对同一电影/剧集重复评价
- 六维评分显示顺序统一为 WEIGHTS 定义顺序
- Top100 "只看未看"筛选按用户隔离

### Bug 修复
- 修复发现页加号按钮失效（TMDB `id` vs `m.tmdb_id`）
- 修复 Top100 筛选基于全站记录而非当前用户
- 本周热门 fetch 2页确保32部，Top100 fetch 至100部

---

## 2026-04-30

### 影单合并卡片
- 特权用户(ceci/Fank1ng)：自身+Fank1ng/ceci+其他人平均
- 普通用户：自身+Fank1ng+ceci，无特权用户时回退显示其余用户
- 编辑/删除按钮统一右对齐，卡片仅一个"+我的评分"
- showDetail 朋友评分使用统一分组 key

### 统计图表
- 柱状图重做（flexbox stretch 布局 + 百分比高度）
- 对比柱状图修复区分度
- 统计数值颜色统一跟用户色

### 代码优化
- 提取 getGroupKey、getUserName、isPrivileged 共享函数
- localStorage 缓存 1小时TTL 按用户隔离
- TMDB 搜索 AbortController 取消过期请求
- 删除死代码、消除重复、优化渲染

### 邀请码系统
- 注册需邀请码，有效期3小时
- fank1ng/ceci 可见邀请码管理按钮

---

## 2026-04-29

### 多用户系统
- Supabase Auth + RLS 权限
- 多用户颜色系统（Fank1ng金/ceci粉/朋友蓝）
- Supabase Realtime 实时同步
- 用户偏好存储（display_name）

### UI 优化
- 六维评分卡片3x2网格对齐
- 评分方框尺寸统一52x52
- 分季评分展开/折叠
- 分页导航
- 移动端适配
- FD&Ceci 品牌标识

### 密码功能
- 忘记密码/重置密码/修改密码

### 统计
- 个人/他人/对比三视图
- 分数分布柱状图
- 六维平均对比
