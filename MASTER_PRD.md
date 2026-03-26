# Bing Gaokao Web App - Master PRD (Phase 3 Final)

## 1. Core Architecture (SERP First)
* 全站抛弃传统页面跳转与 Modal 弹窗。所有详情页（学校详情、专业详情）必须采用 `SerpFeatureCard` (沉浸式搜索结果卡片) 呈现。
* 视觉必须遵循 Microsoft Fluent Design: `bg-white`, `backdrop-blur-xl`, 高亮度, 细边框, 柔和阴影。

## 2. Global State (CandidateContext)
* 必须包含核心基础档案：`province`, `score`, `rank` (自动映射), `subjects` (如['物理','化学']).
* **[核心升级] 多维偏好矩阵 (Preferences):** * 必须包含：`locations` (地域偏好数组), `majorGroups` (学科门类偏好数组), `strategy` (优先策略枚举)。
  * `strategy` 枚举值：`university_first` | `major_first` | `location_first` | `balanced`。

## 3. The Auto-Pilot Engine (2:5:3 Logic)
* **File:** `src/logic/autoPilot.js`
* **Rule 1 (Hard Filter - The Subject Guard):** 生成前必须校验 `Major.subject_requirement` 与 `Candidate.subjects`。不符直接 drop，绝对不允许进入列表。
* **Rule 2 (Smoothing):** 使用 Exponential Smoothing 计算近三年位次作为 `smoothedRank`。
* **Rule 3 (Distribution):** 20% 冲 (0.85R-0.98R), 50% 稳 (0.98R-1.15R), 30% 保 (1.15R-1.5R)。
* **Rule 4 (Strategy-Weighted Sorting):** * 在各梯度组内，根据 `preferences.strategy` 进行动态加权得分 (interestScore) 排序。
  * `university_first`: 若命中 985/211/双一流 等 Level Tags，给予最高权重 (+50)。
  * `major_first`: 若学校开设专业命中 `preferences.majorGroups`，给予最高权重 (+50)。
  * `location_first`: 若学校省份命中 `preferences.locations` (含大区映射)，给予最高权重 (+50)。
  * 最终得分 `finalScore = interestScore * 1.2 + (MAX_RANK - smoothedRank)`。

## 4. Hard-Coded Auditor (志愿防呆机制)
* **File:** `src/logic/VolunteerAuditor.js`
* **Check 1 ("倒挂校验"):** 监测整个列表，若第 N+1 志愿的录取难度（位次要求）远高于第 N 志愿，标记为 Warning。
* **Check 2 ("选科校验"):** 用户手动添加志愿时，若选科不符，标记为 Error，强制禁用导出功能。

## 5. Agentic UX (伪装的智能)
* **File:** `src/components/AgenticLoader.jsx`
* 用户在首页点击“一键生成志愿表”时，必须调用该组件。
* 阻塞 2.5 秒，每隔 600ms 伴随 Lucide 图标切换进度文案（初始化引擎 -> 解析档案与偏好矩阵 -> 运行 2:5:3 策略加权算法 -> 组装完成）。
* 完成后无缝渲染真实的志愿表结果页。