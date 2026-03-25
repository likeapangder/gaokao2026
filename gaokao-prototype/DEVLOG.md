# 必应高考 (Bing Gaokao) — 开发日志 DEVLOG

> 项目目录：`/Users/linhsinpei/Gaokao2026/gaokao-prototype/`
> 启动命令：`cd gaokao-prototype && npm run dev`
> 构建命令：`npm run build`

---

## 概览

| 维度 | 内容 |
|------|------|
| 技术栈 | Vite 8 + React 19 + React Router v7 |
| 状态管理 | useReducer + localStorage（CandidateContext）|
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable |
| 图表 | Recharts |
| 图标 | lucide-react |
| AI 报告 | 模板引擎 Mock（无真实 API）|
| 视觉风格 | Microsoft Fluent Design / Mica 质感 |
| 构建产物 | 746 KB（minified）/ 227 KB（gzipped）|
| 首屏渲染 | 构建耗时 694ms ✅ |

---

## Phase 0 — 依赖安装与项目配置

**时间**：2026-03-24

**变更内容**

- 安装 5 个新依赖：`react-router-dom@7`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `lucide-react`
- 更新 `index.html`：
  - `lang="en"` → `lang="zh-CN"`
  - 标题改为 `必应高考`

**新增文件**：无（修改现有文件）

**修改文件**：
- `index.html`
- `package.json`（自动更新 dependencies）

---

## Phase 1 — 数据模型与 Mock 数据

**时间**：2026-03-24

**架构决策**：所有数据模型用 JSDoc 注释而非 TypeScript，保持原项目 `.jsx` 风格。

**新增文件**

| 文件 | 内容 |
|------|------|
| `src/data/schemas.js` | 全量 JSDoc 类型定义（University, Major, ScoreRankRow, ReportTemplate 等）及常量映射表 |
| `src/data/universities.js` | 21 所大学 Mock 数据，含顶尖985/强势985/优质211/双非特色四档，每所含 2023-2025 三年最低录取位次 |
| `src/data/majors.js` | 32 个专业 Mock 数据，覆盖工学/理学/经济/管理/医学/法学/文学/教育/新兴交叉，含选科要求和就业前景 |
| `src/data/scoreRankTable.js` | 5 省（北京/上海/天津/江苏/山东）× 3 年（2023-2025）= 15 张一分一段表，使用正态分布近似生成 |
| `src/data/reportTemplates.js` | 三档报告模板（high/mid/low），每档含 5 个章节（intro/stretch/match/safety/closing），使用 `{{变量}}` 占位符 |

**关键设计**：
- `rank_history` 格式 `[{year, minScore, minRank}]` 支持指数平滑算法的三年输入
- `scoreRankTable` 使用 `generateTable()` 辅助函数正态分布生成，支持后续替换为真实数据
- `bing_news_hook` 和 `bing_wiki_link` 字段预留 Bing 搜索集成接口

---

## Phase 2 — 核心引擎逻辑

**时间**：2026-03-24

**新增文件**

| 文件 | 内容 |
|------|------|
| `src/logic/rankEngine.js` | Rank-Mapping Engine：二分查找分数→位次/位次→分数双向转换，支持省份降级（找不到指定年份时取最新年份） |
| `src/logic/autoPilot.js` | 2:5:3 Auto-Pilot：指数平滑法（α=0.5）计算3年位次均值，按 delta 值分类冲/稳/保 |

**算法设计**

```
指数平滑法（Exponential Smoothing）
  α = 0.5（近年权重更高）
  S_t = α * X_t + (1-α) * S_{t-1}
  输入：rank_history（按年份升序）
  输出：平滑后的位次估计值（取整）

分类阈值（delta = (smoothedRank - candidateRank) / candidateRank）
  冲 (stretch) : delta ∈ [-0.15, -0.05)
  稳 (match)   : delta ∈ [-0.05,  0.15]
  保 (safety)  : delta >  0.15
  超出范围     : delta < -0.15（远超实力，不推荐）
```

**接口设计**：`scoreToRank` / `rankToScore` 返回同步值，外部可包裹 Promise 兼容后续 API 替换。

---

## Phase 3 — CandidateContext 全局状态

**时间**：2026-03-24

**新增文件**：`src/context/CandidateContext.jsx`

**状态结构**

```js
{
  province:     '',      // 省份代码
  examType:     '',      // 'old' | '3+1+2'
  score:        null,    // 总分
  firstSubject: '',      // 首选科目（3+1+2 专用）
  optionals:    [],      // 再选科目（3+1+2 专用，最多2门）
  rank:         null,    // 派生值：由 scoreToRank 自动计算
  total:        null,    // 全省参考人数
  volunteers:   [],      // 志愿表
}
```

**关键特性**：
- `rank` / `total` 是**派生值**，不持久化到 localStorage（省空间 + 避免脏数据）
- `useEffect` 监听 `score` + `province` 变化，自动触发位次重算
- 志愿表操作：addVolunteer（去重校验）/ removeVolunteer / reorderVolunteers
- 持久化 key：`bing-gaokao-candidate`

---

## Phase 4 — useProvinceLayout Hook

**时间**：2026-03-24

**新增文件**：`src/hooks/useProvinceLayout.js`

**省份映射表**

| 省份 | 考试类型 | 显示选科 | 满分 |
|------|---------|---------|------|
| BJ / TJ | old（老高考）| 否 | 750 |
| SH | old（老高考）| 否 | 660 |
| JS / SD / GD / HB / HN / FJ / CQ / LN / ZJ | 3+1+2 新高考 | 是 | 750 |

**动态行为**：省份切换时，`ScoreInputModal` 自动显示/隐藏首选科目和再选科目表单项。

---

## Phase 5 — 路由结构与全局布局

**时间**：2026-03-24

**路由树**

```
/ (RootLayout = Layout + ScoreInputModal 状态管理)
├── /                    → HomePage
├── /recommendation      → RecommendationPage
├── /volunteers          → VolunteerSheetPage
├── /ai-report           → AIReportPage
├── /wiki/uni            → UniWikiPage
├── /wiki/major          → MajorWikiPage
└── /score-rank          → ScoreRankPage
```

**新增 / 修改文件**

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/router.jsx` | 新建 | createBrowserRouter 配置，RootLayout 挂载 Modal 状态 |
| `src/components/Layout.jsx` | 新建 | 全局顶栏（Mica 毛玻璃）+ 考生信息胶囊 + 主导航 |
| `src/main.jsx` | 修改 | 包裹 CandidateProvider + AppRouter |
| `src/App.jsx` | 修改 | 清空为空组件（路由由 router.jsx 接管）|

---

## Phase 6 — 7 个页面组件

**时间**：2026-03-24

**共享组件**

| 文件 | 功能 |
|------|------|
| `src/components/ScoreInputModal.jsx` | 填写成绩弹窗：省份选择 → 动态表单（useProvinceLayout）→ 提交更新 Context |
| `src/components/UniversityCard.jsx` | 院校卡片：名称/标签/近三年位次/冲稳保分类/加入志愿表按钮 |
| `src/components/MajorDetailCard.jsx` | 专业卡片：选科要求/就业前景/Bing 外链 |

**页面组件**

| 文件 | 核心功能 |
|------|---------|
| `src/pages/HomePage.jsx` | Hero 区（Bing 风格搜索栏 + 成绩摘要胶囊 + CTA 按钮）+ 功能入口卡片 |
| `src/pages/RecommendationPage.jsx` | 三栏推荐（调用 generateRecommendations）+ 算法说明横幅 |
| `src/pages/VolunteerSheetPage.jsx` | 看板 DnD（@dnd-kit arrayMove）+ 分组统计 |
| `src/pages/AIReportPage.jsx` | tier 判断 → 模板填充（{{变量}} replace）→ 报告渲染 + 打印 |
| `src/pages/UniWikiPage.jsx` | 搜索+筛选院校列表 + 点击展开 Recharts 趋势图 |
| `src/pages/MajorWikiPage.jsx` | 搜索+学科门类+选科过滤 + "匹配我的选科"快捷开关 |
| `src/pages/ScoreRankPage.jsx` | Recharts AreaChart + ReferenceLine 高亮 + 图表/表格视图切换 |

---

## Phase 7 — Fluent Design 视觉系统

**时间**：2026-03-24

**修改文件**：`src/index.css`（完全重写，从 112 行扩展至 900+ 行）

**CSS 变量系统**

| 变量组 | 说明 |
|--------|------|
| `--fluent-accent` | 品牌蓝 `#0078d4`（暗色：`#60cdff`）|
| `--color-stretch/match/safety` | 冲红/稳绿/保蓝功能色 |
| `--mica-bg / --mica-blur` | Mica 毛玻璃质感（backdrop-filter: blur(20px)）|
| `--shadow-2/4/8/16/64` | 5 档阴影层级 |
| `--radius-sm/md/lg/xl` | 4/8/12/16px 圆角 |
| `--trans-fast/normal/slow` | 80/160/240ms 过渡 |

**视觉特性**：
- 顶栏 Mica 毛玻璃（`position: sticky` + `backdrop-filter`）
- Modal 入场动画（`translateY + scale` 16ms）
- 功能卡片 hover 上浮（`translateY(-2px)`）
- Hero 渐变背景（`135deg, #001f5c → #0078d4 → #60cdff`）
- 支持系统暗色模式（`@media prefers-color-scheme: dark`）
- Print 样式（隐藏 Nav/Footer，全宽报告区）

---

## 最终文件结构

```
src/
├── context/
│   └── CandidateContext.jsx        ← useReducer + localStorage 全局状态
├── data/
│   ├── schemas.js                   ← JSDoc 类型定义 + 常量
│   ├── universities.js              ← 21 所大学 Mock
│   ├── majors.js                    ← 32 个专业 Mock
│   ├── scoreRankTable.js            ← 15 张一分一段表（5省×3年）
│   └── reportTemplates.js           ← 三档报告模板
├── hooks/
│   └── useProvinceLayout.js         ← 省份→表单配置 Hook
├── logic/
│   ├── rankEngine.js                ← 分数↔位次双向转换（二分查找）
│   └── autoPilot.js                 ← 指数平滑 + 2:5:3 分类算法
├── components/
│   ├── Layout.jsx                   ← 全局顶栏 + 页脚
│   ├── ScoreInputModal.jsx          ← 填写成绩弹窗
│   ├── UniversityCard.jsx           ← 院校卡片
│   └── MajorDetailCard.jsx          ← 专业卡片
├── pages/
│   ├── HomePage.jsx                 ← / 首页
│   ├── RecommendationPage.jsx       ← /recommendation 志愿推荐
│   ├── VolunteerSheetPage.jsx       ← /volunteers 志愿表看板
│   ├── AIReportPage.jsx             ← /ai-report AI 报告
│   ├── UniWikiPage.jsx              ← /wiki/uni 查大学
│   ├── MajorWikiPage.jsx            ← /wiki/major 查专业
│   └── ScoreRankPage.jsx            ← /score-rank 一分一段
├── router.jsx                       ← React Router v7 配置
├── App.jsx                          ← （已清空，路由接管）
├── main.jsx                         ← 入口：CandidateProvider + AppRouter
└── index.css                        ← Fluent Design 全站样式（900+ 行）
```

---

## 构建验证结果

```
✓ 2302 modules transformed
dist/index.html          0.46 kB │ gzip: 0.32 kB
dist/assets/*.css       24.87 kB │ gzip: 4.86 kB
dist/assets/*.js       746.34 kB │ gzip: 227.58 kB
✓ built in 694ms
```

> ⚠️ JS bundle > 500KB：由 Recharts（~200KB）和 @dnd-kit（~30KB）贡献。
> 后续可通过动态 `import()` 对图表页做 code splitting 优化。

---

## Phase 8 — 梯度分配 + 兴趣加权（2026-03-24）

**修改文件**：`src/logic/autoPilot.js`

**背景**：原 `generateRecommendations()` 使用 delta 比例分类，但没有省份名额上限控制，也不支持个人偏好排序。

**新增函数**

| 函数 | 说明 |
|------|------|
| `getProvinceSlots(provinceId)` | 查表返回该省志愿总名额（SD/HB=96，GD/JS/ZJ=80，BJ=30，SH=24…）|
| `calcTierSlots(totalSlots)` | 按 2:5:3 比例计算三档名额，余数补给「稳」以保证总和精确 |
| `calcInterestScore(uni, interests)` | 多维度兴趣打分：院校类型+30、省市+25、tags+15、level_tags+20（可叠加）|
| `sortWithInterests(enrichedUnis, interests)` | 综合得分排序：`finalScore = interestScore × 1.2 + (MAX_RANK - smoothedRank)` |
| `generateVolunteerSheet(userRank, provinceData, interests)` | 主入口：4 步流水线（名额计算 → 区间分桶 → 兴趣排序 → 名额裁剪）|

**分档区间对比**

| | `generateRecommendations`（旧，delta 比例）| `generateVolunteerSheet`（新，绝对位次区间）|
|---|---|---|
| 冲 | delta ∈ [-0.15, -0.05) | smoothedRank ∈ [rank×0.85, rank×0.98) |
| 稳 | delta ∈ [-0.05, +0.15] | smoothedRank ∈ [rank×0.98, rank×1.15] |
| 保 | delta > +0.15           | smoothedRank ∈ (rank×1.15, rank×1.50] |

> 两套函数并存：`generateRecommendations` 用于「推荐页无限滚动」，`generateVolunteerSheet` 用于「一键填表按省份名额限制」。

**兴趣加权设计决策**：
- 加权系数 `×1.2` 对应用户描述的"权值 +20%"，作用于兴趣分而非位次分，保持位次数据可解释性
- 兴趣为空时 `interestScore = 0`，`finalScore` 退化为纯位次排序，行为与旧逻辑兼容
- `interests` 标签大小写不敏感（统一 `toLowerCase()` 比对）

**调用示例**：
```js
generateVolunteerSheet(
  45000,                              // 考生位次
  { provinceId: 'SD', universities }, // 山东省数据
  ['985', '理工', '北京']             // 兴趣标签
)
// → { slots: { stretch:19, match:48, safety:29 }, stretch:[...], match:[...], safety:[...], meta:{...} }
```

---

## Phase 9 — ReportEngine（确定性模板引擎）(2026-03-24)

**新增文件**
- `src/logic/StringLibrary.js` — 纯文案数据层
- `src/logic/ReportEngine.js`  — 纯逻辑层，输出结构化 JSON

**修改文件**
- `src/pages/AIReportPage.jsx`         — 完全重写，接入 ReportEngine
- `src/context/CandidateContext.jsx`   — 新增 `interests[]` 字段
- `src/components/ScoreInputModal.jsx` — 新增兴趣标签多选区
- `src/index.css`                      — 新增报告章节样式

---

### StringLibrary.js — 三层结构

```
POLICY_NOTES               ← 政策性固定文案（6 条，人工审核，原文不修改）
TIER_LIBRARY[tier]         ← 5 档文案库（S/A/B/C/D）
  [section]                ← 6 个章节（intro/stretch/match/safety/strategy/disclaimer）
    [interestKey]          ← N 个兴趣变体 + 'default' 兜底
INTEREST_KEY_MAP           ← 同义词映射表（如 '金融'→'财经'，'工科'→'理工'）
```

**档位划分（5 档，精度提升）**

| 档位 | 百分位区间 | 说明 |
|------|-----------|------|
| S | 前 5% | 顶尖（C9/清北复交浙等）|
| A | 5%~20% | 强势 985 |
| B | 20%~45% | 优质 211 / 特色 985 |
| C | 45%~70% | 普通本科 / 双非特色 |
| D | 70%~100% | 本科线附近 / 专科预警 |

---

### ReportEngine.js — 7 步流水线

```
Step 1  validateProfile()          ← 类型校验，错误路径返回结构化 { ok: false, errors }
Step 2  calcTier(percentile)       ← TIER_THRESHOLDS 查表，确定档位
Step 3  resolveInterestKey()       ← 精确命中 > 同义词 > 'default'
Step 4  generateRecommendations()  ← 复用 autoPilot，供插值用
Step 5  buildVars()                ← 构建插值变量包（20+ 个变量）
Step 6  pickText() + interpolate() ← 文案选取 + {{变量}} 替换
Step 7  组装 ReportJSON            ← 含 meta / sections[] / recommendations{}
```

**输出 JSON 结构**

```js
{
  ok: true,
  errors: [],
  meta: {
    tier, tierLabel, tierColor, badgeText, strategyLine,
    interestKey, generatedAt, province, score, rank, total, percentile,
    year, examType, firstSubject, optionals,
  },
  sections: [
    { key, title, content, type: 'normal'|'policy'|'warning'|'summary' },
    // ... 最多 11 个章节（5 正文 + 2~3 政策 + 1 志愿摘要 + 1 选科 + 1 免责）
  ],
  recommendations: { stretch: [], match: [], safety: [] },
}
```

**100% 确定性保证**：
- 零 AI API 调用，文案全部来自 StringLibrary 人工审核库
- `interpolate()` 未命中变量时替换为空字符串（不显示 `[变量名]`）
- `pickText()` 二级 fallback 链（interestKey → 'default'），永不返回 undefined
- `validateProfile()` 防御性校验，异常路径返回 `{ ok: false }` 而非 throw

---

## 待优化事项（后续迭代）

| 优先级 | 项目 |
|--------|------|
| 高 | Code splitting（ScoreRankPage 和 UniWikiPage 动态引入 Recharts）|
| 高 | 跨列拖拽（DnD 当前实现同列内排序，跨列移动需扩展 DragOverlay）|
| 中 | 真实一分一段数据接入（替换 generateTable Mock）|
| 中 | 院校专业联动（志愿卡片支持选择专业方向）|
| 中 | 移动端导航（汉堡菜单，当前 < 768px 隐藏 nav-links）|
| 低 | 接入真实 AI API（Claude / OpenAI 生成深度报告）|
| 低 | PWA 离线缓存支持 |
