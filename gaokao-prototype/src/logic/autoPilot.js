/**
 * 必应高考 — 2:5:3 Auto-Pilot 算法（含梯度分配 + 兴趣加权）
 *
 * 新增能力：
 *   generateVolunteerSheet() — 按省份志愿总数梯度分配名额，并对兴趣匹配的院校加权排序
 *
 * 设计原则：
 *   1. 兴趣加权只影响组内排序，不改变冲/稳/保分类边界
 *   2. 名额裁剪按权重分从高到低取前 N 位（而非随机截断）
 *   3. 所有纯算法函数均为同步、无副作用的纯函数
 */

/**
 * 指数平滑法计算近 N 年位次加权均值
 * α = 0.5，越近的年份权重越高
 * 排列顺序：rankHistory 按年份从旧到新（2023→2025）
 *
 * 公式：S_t = α * X_t + (1-α) * S_{t-1}
 * 最终返回平滑后的位次估计值
 *
 * @param {Array<{year: number, minRank: number}>} rankHistory
 * @returns {number} 平滑后的位次估计（四舍五入）
 */
export function exponentialSmoothing(rankHistory) {
  if (!rankHistory || rankHistory.length === 0) return Infinity

  // 按年份升序排列（旧→新）
  const sorted = [...rankHistory].sort((a, b) => a.year - b.year)
  const alpha = 0.5

  let smoothed = sorted[0].minRank
  for (let i = 1; i < sorted.length; i++) {
    smoothed = alpha * sorted[i].minRank + (1 - alpha) * smoothed
  }

  return Math.round(smoothed)
}

/**
 * 一键生成 2:5:3 志愿推荐列表
 *
 * 分类规则（基于 candidateRank 与 smoothedRank 的 delta）：
 *   delta = (smoothedRank - candidateRank) / candidateRank
 *   冲 (stretch) : delta ∈ [-0.15, -0.05)  → 院校位次比考生高 5%~15%（考生冒险上冲）
 *   稳 (match)   : delta ∈ [-0.05,  0.05]  → 院校位次与考生接近（±5%）
 *   保 (safety)  : delta >  0.15           → 院校位次比考生低 15%+（保底）
 *
 * 返回结果按 smoothedRank 升序排列（位次越小 = 越难进）
 *
 * @param {number} candidateRank - 考生位次
 * @param {Array<import('../data/universities').University>} universities
 * @returns {{ stretch: Array, match: Array, safety: Array }}
 */
export function generateRecommendations(candidateRank, universities) {
  const stretch = []
  const match = []
  const safety = []

  for (const uni of universities) {
    if (!uni.rank_history || uni.rank_history.length === 0) continue

    const smoothedRank = exponentialSmoothing(uni.rank_history)
    const delta = (smoothedRank - candidateRank) / candidateRank

    const enriched = { ...uni, smoothedRank, delta }

    if (delta >= -0.15 && delta < -0.05) {
      stretch.push(enriched)
    } else if (delta >= -0.05 && delta <= 0.05) {
      match.push(enriched)
    } else if (delta > 0.15) {
      safety.push(enriched)
    }
    // delta 在 0.05~0.15 之间的"偏稳"区间，归入稳（可按需调整）
    else if (delta > 0.05 && delta <= 0.15) {
      match.push(enriched)
    }
  }

  // 各类别内按平滑位次升序排列（最难进的排最前）
  const byRank = (a, b) => a.smoothedRank - b.smoothedRank
  stretch.sort(byRank)
  match.sort(byRank)
  safety.sort(byRank)

  return { stretch, match, safety }
}

/**
 * 快速判断单所大学相对于考生的分类
 * @param {number} candidateRank
 * @param {Array<{year: number, minRank: number}>} rankHistory
 * @returns {'stretch'|'match'|'safety'|'out_of_range'}
 */
export function classifyUniversity(candidateRank, rankHistory) {
  if (!rankHistory || rankHistory.length === 0) return 'out_of_range'

  const smoothedRank = exponentialSmoothing(rankHistory)
  const delta = (smoothedRank - candidateRank) / candidateRank

  if (delta >= -0.15 && delta < -0.05) return 'stretch'
  if (delta >= -0.05 && delta <= 0.15) return 'match'
  if (delta > 0.15) return 'safety'
  return 'out_of_range' // delta < -0.15：远超考生实力
}

// ─────────────────────────────────────────────────────────────
//  梯度分配 + 兴趣加权系统
// ─────────────────────────────────────────────────────────────

/**
 * 各省志愿总名额配置表
 * 来源：各省高考改革政策（平行志愿最大填报数）
 *
 * @type {Record<string, number>}
 */
const PROVINCE_SLOTS = {
  SD: 96,  // 山东：专业组 96 个
  HB: 96,  // 河北：专业组 96 个
  GD: 80,  // 广东：院校专业组 80 个
  JS: 80,  // 江苏：院校专业组 80 个
  HN: 45,  // 湖南：专业组 45 个
  HB_OLD: 45, // 湖北：45 个
  ZJ: 80,  // 浙江：专业 80 个
  BJ: 30,  // 北京：30 个
  SH: 24,  // 上海：24 个（4 段 × 6 个）
  TJ: 50,  // 天津：50 个
  FJ: 40,  // 福建：40 个
  LN: 40,  // 辽宁：40 个
  CQ: 96,  // 重庆：96 个
  DEFAULT: 45, // 其余省份默认 45 个
}

/**
 * 获取指定省份的志愿总名额
 * @param {string} provinceId
 * @returns {number}
 */
export function getProvinceSlots(provinceId) {
  return PROVINCE_SLOTS[provinceId] ?? PROVINCE_SLOTS.DEFAULT
}

/**
 * 根据总名额计算三档名额分配（严格 2:5:3）
 * 余数优先补给「稳」档，保证三档之和 === totalSlots
 *
 * @param {number} totalSlots
 * @returns {{ stretch: number, match: number, safety: number }}
 *
 * @example
 *   calcTierSlots(96)  → { stretch: 19, match: 48, safety: 29 }
 *   calcTierSlots(30)  → { stretch: 6,  match: 15, safety: 9  }
 */
export function calcTierSlots(totalSlots) {
  const stretch = Math.floor(totalSlots * 0.2)
  const safety  = Math.floor(totalSlots * 0.3)
  const match   = totalSlots - stretch - safety   // 余数全给「稳」
  return { stretch, match, safety }
}

/**
 * 计算单所院校对一组兴趣标签的匹配得分
 *
 * 匹配规则（可叠加，无上限）：
 *   院校 type     命中 interests → +30 分
 *   院校 tags     每命中一个    → +15 分（如 '985'、'211'、'双一流'）
 *   院校 level_tags 每命中一个 → +20 分（如 '顶尖985'、'强势理工'）
 *
 * @param {import('../data/universities').University} uni
 * @param {string[]} interests - 兴趣标签，如 ['理工', 'AI', '985', '北京']
 * @returns {number} 原始兴趣分（用于组内权重排序，≥ 0）
 */
function calcInterestScore(uni, interests) {
  if (!interests || interests.length === 0) return 0

  const interestSet = new Set(interests.map((s) => s.trim().toLowerCase()))
  let score = 0

  // 院校类型匹配（如 '理工'、'综合'、'师范'）
  if (uni.type && interestSet.has(uni.type.toLowerCase())) score += 30

  // 省市匹配（如 '北京'、'上海'）
  if (uni.province && interestSet.has(uni.province.toLowerCase())) score += 25

  // tags 匹配（如 '985'、'211'、'双一流'、'C9'）
  for (const tag of uni.tags ?? []) {
    if (interestSet.has(tag.toLowerCase())) score += 15
  }

  // level_tags 匹配（如 '顶尖985'、'强势理工'、'建筑名校'）
  for (const tag of uni.level_tags ?? []) {
    if (interestSet.has(tag.toLowerCase())) score += 20
  }

  return score
}

/**
 * 对一组院校按「兴趣加权综合得分」降序排列
 *
 * 综合得分公式：
 *   finalScore = interestScore * 1.2 + rankScore
 *   rankScore  = MAX_RANK - smoothedRank（位次越小 rankScore 越高）
 *
 * 兴趣加权系数 +20% 对应用户需求中的「权值 +20%」——
 * 通过放大 interestScore 相对于 rankScore 的比重实现，
 * 而非直接修改 smoothedRank，保留原始位次数据的可解释性。
 *
 * @param {Array} enrichedUnis  - 含 smoothedRank 的院校列表
 * @param {string[]} interests
 * @returns {Array} 带 interestScore / finalScore 字段的新数组，按 finalScore 降序
 */
function sortWithInterests(enrichedUnis, interests) {
  const MAX_RANK = 1_000_000  // 位次上界（用于将 rank 转为正向分数）

  return enrichedUnis
    .map((uni) => {
      const interestScore = calcInterestScore(uni, interests)
      const rankScore     = MAX_RANK - uni.smoothedRank
      // 兴趣加权 +20%：interestScore 乘以 1.2 后与位次分合并
      const finalScore    = interestScore * 1.2 + rankScore
      return { ...uni, interestScore, finalScore }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
}

/**
 * 梯度志愿表生成器（完整版）
 *
 * 输入:
 *   userRank     — 考生位次（由 rankEngine.scoreToRank 计算）
 *   provinceData — 包含该省全量院校列表的对象，结构：
 *                  { provinceId: string, universities: University[] }
 *   interests    — 兴趣标签数组，如 ['985', '理工', '北京', 'AI']
 *
 * 输出:
 *   {
 *     slots:   { stretch, match, safety },          // 各档名额
 *     stretch: University[],                        // 冲档（已加权 + 裁剪）
 *     match:   University[],                        // 稳档
 *     safety:  University[],                        // 保档
 *     meta: {
 *       totalSlots,    // 该省志愿总名额
 *       userRank,      // 考生位次（透传）
 *       interests,     // 兴趣标签（透传）
 *       interestApplied, // 是否启用了兴趣加权
 *     }
 *   }
 *
 * 分档位次区间（基于 userRank 绝对值，与 generateRecommendations 保持一致）：
 *   冲：smoothedRank ∈ [userRank × 0.85, userRank × 0.98)
 *   稳：smoothedRank ∈ [userRank × 0.98, userRank × 1.15]
 *   保：smoothedRank ∈ (userRank × 1.15, userRank × 1.50]
 *
 * @param {number}   userRank
 * @param {{ provinceId: string, universities: Array }} provinceData
 * @param {string[]} interests
 * @returns {{ slots: object, stretch: Array, match: Array, safety: Array, meta: object }}
 */
export function generateVolunteerSheet(userRank, provinceData, interests = []) {
  const { provinceId, universities } = provinceData

  // ── Step 1: 计算该省名额分配 ──────────────────────────────
  const totalSlots = getProvinceSlots(provinceId)
  const slots      = calcTierSlots(totalSlots)

  // ── Step 2: 对每所院校计算平滑位次，按区间分桶 ───────────
  const buckets = { stretch: [], match: [], safety: [] }

  for (const uni of universities) {
    if (!uni.rank_history || uni.rank_history.length === 0) continue

    const smoothedRank = exponentialSmoothing(uni.rank_history)
    const enriched     = { ...uni, smoothedRank }

    // 筛选区间（与用户提供的伪代码对齐）
    if (smoothedRank >= userRank * 0.85 && smoothedRank < userRank * 0.98) {
      buckets.stretch.push(enriched)
    } else if (smoothedRank >= userRank * 0.98 && smoothedRank <= userRank * 1.15) {
      buckets.match.push(enriched)
    } else if (smoothedRank > userRank * 1.15 && smoothedRank <= userRank * 1.50) {
      buckets.safety.push(enriched)
    }
    // smoothedRank < userRank × 0.85 → 远超实力，排除
    // smoothedRank > userRank × 1.50 → 过于保守，排除
  }

  // ── Step 3: 兴趣加权排序 ──────────────────────────────────
  const interestApplied = interests.length > 0
  const ranked = {
    stretch: sortWithInterests(buckets.stretch, interests),
    match:   sortWithInterests(buckets.match,   interests),
    safety:  sortWithInterests(buckets.safety,  interests),
  }

  // ── Step 4: 按名额裁剪（取前 N 位，已按综合得分降序）──────
  const result = {
    stretch: ranked.stretch.slice(0, slots.stretch),
    match:   ranked.match.slice(0,   slots.match),
    safety:  ranked.safety.slice(0,  slots.safety),
  }

  return {
    slots,
    ...result,
    meta: {
      totalSlots,
      userRank,
      interests,
      interestApplied,
    },
  }
}
