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
 * 计算单所院校对用户偏好的匹配得分
 *
 * 匹配规则：
 * 1. 基础分：0
 * 2. 策略加权：
 *    - location_first: 命中 locations +50
 *    - university_first: 命中 level_tags (985/211/双一流) +40
 *    - major_first: 命中 majorGroups (该校有相关专业) +40
 *    - balanced: 各项权重均衡 (+15~20)
 * 3. 细项加权：
 *    - 院校类型 (理工/综合等) +10
 *    - 具体标签 (985/211) +10
 *
 * @param {import('../data/universities').University} uni
 * @param {import('../context/CandidateContext').Preferences} preferences
 * @returns {number} 兴趣匹配分
 */
function calcInterestScore(uni, preferences) {
  if (!preferences) return 0

  const { locations = [], majorGroups = [], strategy = 'balanced' } = preferences
  let score = 0

  // 1. 地域匹配
  const locSet = new Set(locations)
  const locHit = uni.province && locSet.has(uni.province)

  if (locHit) {
    if (strategy === 'location_first') score += 50
    else score += 20 // balanced 或其他策略下的基础分
  }

  // 2. 院校层级匹配 (985/211/双一流)
  const isTopUni = uni.tags?.some(t => ['985', '211', '双一流'].includes(t)) ||
                   uni.level_tags?.some(t => t.includes('985') || t.includes('211'))

  if (isTopUni) {
    if (strategy === 'university_first') score += 50
    else if (strategy === 'balanced') score += 20
    else score += 10
  }

  // 3. 专业匹配 (检查 uni.majorGroups 是否包含用户偏好的学科门类)
  // 注意：mockSchools.js 中 majorGroups 是对象数组，需检查其 groupName 或 category
  // 这里简化逻辑：如果 preferences.majorGroups 包含 '工学'，且 uni.type 为 '理工' 或 '综合'，加分
  // 更精细的匹配需要遍历 uni.majorGroups (如果数据源提供了)

  const majorSet = new Set(majorGroups)
  let majorHit = false

  // 粗略匹配：根据学校类型和强势专业标签
  if (majorSet.has('工学') && (uni.type === '理工' || uni.tags?.includes('理工'))) majorHit = true
  if (majorSet.has('医学') && (uni.type === '医药' || uni.name.includes('医'))) majorHit = true
  if (majorSet.has('师范') && (uni.type === '师范' || uni.name.includes('师范'))) majorHit = true
  if (majorSet.has('财经') && (uni.type === '财经' || uni.name.includes('财经'))) majorHit = true

  // 精细匹配：检查 majorGroups 数据
  if (uni.majorGroups && uni.majorGroups.length > 0) {
     for (const mg of uni.majorGroups) {
       // 假设 majorGroups 中包含学科门类信息，或者通过 groupName 模糊匹配
       if (majorSet.has('工学') && (mg.groupName.includes('工') || mg.groupName.includes('理'))) majorHit = true
       if (majorSet.has('医学') && mg.groupName.includes('医')) majorHit = true
       // ... 更多匹配逻辑
     }
  }

  if (majorHit) {
    if (strategy === 'major_first') score += 50
    else score += 20
  }

  // 4. 额外标签加分 (balanced 策略下)
  if (strategy === 'balanced') {
     // 略微增加名校权重
     if (uni.level_tags?.includes('C9')) score += 10
  }

  return score
}

/**
 * 对一组院校按「兴趣加权综合得分」降序排列
 *
 * 综合得分公式：
 *   finalScore = interestScore * 权重系数 + rankScore
 *
 * @param {Array} enrichedUnis  - 含 smoothedRank 的院校列表
 * @param {import('../context/CandidateContext').Preferences} preferences
 * @returns {Array} 带 interestScore / finalScore 字段的新数组，按 finalScore 降序
 */
function sortWithInterests(enrichedUnis, preferences) {
  const MAX_RANK = 1_000_000  // 位次上界

  // 如果没有任何偏好，直接按位次排序
  const hasPrefs = preferences && (
    (preferences.locations && preferences.locations.length > 0) ||
    (preferences.majorGroups && preferences.majorGroups.length > 0) ||
    preferences.strategy !== 'balanced'
  )

  return enrichedUnis
    .map((uni) => {
      const interestScore = hasPrefs ? calcInterestScore(uni, preferences) : 0
      const rankScore     = MAX_RANK - uni.smoothedRank

      // 策略影响权重系数
      // location_first / major_first / university_first 策略下，interestScore 影响更大
      let weight = 1.2
      if (preferences?.strategy && preferences.strategy !== 'balanced') {
        weight = 2.0 // 激进策略下，偏好权重翻倍
      }

      const finalScore    = interestScore * weight + rankScore
      return { ...uni, interestScore, finalScore }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
}

// ─────────────────────────────────────────────────────────────
//  § Rule 1: The Subject Guard (Hard Filter)
// ─────────────────────────────────────────────────────────────

/**
 * 严格校验选科匹配 (Rule 1)
 *
 * @param {string[]} majorReqs - 专业要求: ['physics'] 或 ['physics','chemistry']
 * @param {object} candidateSubjects - 考生选科: { first: 'physics', optionals: ['chemistry','biology'] }
 * @returns {boolean} true=匹配, false=淘汰
 */
function checkSubjectMatch(majorReqs, candidateSubjects) {
  // 如果专业无要求，或者数据缺失，默认通过
  if (!majorReqs || majorReqs.length === 0) return true

  // 考生科目集合
  const userSubs = new Set([
    candidateSubjects.first,
    ...(candidateSubjects.optionals || [])
  ].filter(Boolean))

  // 逻辑：专业要求的科目，考生必须全部包含 (AND关系)
  // 注：实际高考中有些是 OR 关系 (选其一)，有些是 AND 关系。
  // 本 Prototype 简化为：majorReqs 中的科目必须全部命中。
  // 生产环境应根据 `reqType` ('and'|'or') 区分。
  for (const req of majorReqs) {
    if (!userSubs.has(req)) return false
  }
  return true
}

/**
 * 梯度志愿表生成器（完整版）
 *
 * 输入:
 *   userRank     — 考生位次
 *   provinceData — 省份数据
 *   preferences  — 用户偏好对象 { locations, majorGroups, strategy }
 *   subjectCtx   — 选科上下文 { first: 'physics', optionals: [] } (New in Phase 3)
 *
 * @param {number}   userRank
 * @param {{ provinceId: string, universities: Array }} provinceData
 * @param {import('../context/CandidateContext').Preferences} preferences
 * @param {{ first: string, optionals: string[] }} subjectCtx
 * @returns {{ slots: object, stretch: Array, match: Array, safety: Array, meta: object }}
 */
export function generateVolunteerSheet(userRank, provinceData, preferences = {}, subjectCtx = {}) {
  const { provinceId, universities } = provinceData

  // ── Step 1: 计算该省名额分配 ──────────────────────────────
  const totalSlots = getProvinceSlots(provinceId)
  const slots      = calcTierSlots(totalSlots)

  // ── Step 2: 对每所院校计算平滑位次，按区间分桶 ───────────
  const buckets = { stretch: [], match: [], safety: [] }

  for (const uni of universities) {
    // [Rule 1 Guard] 选科强校验
    // 检查该校是否有任一专业组符合考生选科。
    // 如果 uni.majorGroups 存在，则必须至少有一个组匹配，否则整校淘汰。
    // 如果没有 majorGroups 数据 (mockSchools 早期数据)，则跳过校验 (fallback allowed)。
    if (uni.majorGroups && uni.majorGroups.length > 0) {
      const hasValidGroup = uni.majorGroups.some(group =>
        checkSubjectMatch(group.subjects, subjectCtx)
      )
      if (!hasValidGroup) continue // ⛔️ DROP: 选科不符
    }

    if (!uni.rank_history || uni.rank_history.length === 0) continue

    const smoothedRank = exponentialSmoothing(uni.rank_history)
    const enriched     = { ...uni, smoothedRank }

    // 筛选区间
    if (smoothedRank >= userRank * 0.85 && smoothedRank < userRank * 0.98) {
      buckets.stretch.push(enriched)
    } else if (smoothedRank >= userRank * 0.98 && smoothedRank <= userRank * 1.15) {
      buckets.match.push(enriched)
    } else if (smoothedRank > userRank * 1.15 && smoothedRank <= userRank * 1.50) {
      buckets.safety.push(enriched)
    }
  }

  // ── Step 3: 兴趣加权排序 (Rule 4) ─────────────────────────
  // 兼容旧版 interests 数组调用
  let prefs = preferences
  if (Array.isArray(preferences)) {
     prefs = { strategy: 'balanced', locations: [], majorGroups: [] }
  }

  const interestApplied = prefs && (
    (prefs.locations?.length > 0) ||
    (prefs.majorGroups?.length > 0) ||
    (prefs.strategy && prefs.strategy !== 'balanced')
  )

  const ranked = {
    stretch: sortWithInterests(buckets.stretch, prefs),
    match:   sortWithInterests(buckets.match,   prefs),
    safety:  sortWithInterests(buckets.safety,  prefs),
  }

  // ── Step 4: 按名额裁剪 ────────────────────────────────────
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
      preferences: prefs,
      interestApplied,
    },
  }
}

// ─────────────────────────────────────────────────────────────
//  § GroupBy 聚合 — 院校视图 & 专业视图
// ─────────────────────────────────────────────────────────────

/**
 * 检查偏好是否是"未自定义"的默认空状态
 * 用于判断用户是否展开并填写了偏好矩阵
 *
 * @param {object} preferences
 * @returns {boolean} true = 偏好为空/默认值
 */
export function isPreferencesEmpty(preferences) {
  if (!preferences) return true
  const { locations = [], majorGroups = [], strategy = 'balanced', tuitionAffordability = 'unlimited' } = preferences
  return (
    locations.length === 0 &&
    majorGroups.length === 0 &&
    strategy === 'balanced' &&
    tuitionAffordability === 'unlimited'
  )
}

/**
 * 按院校聚合：将冲/稳/保三桶中的结果，以院校为主键，
 * 院校下挂载匹配的专业组列表
 *
 * @param {object[]} bucket — enriched 院校列表（含 smoothedRank）
 * @returns {object[]}
 */
export function groupByUniversity(bucket) {
  return bucket.map((uni) => ({
    ...uni,
    matchedMajors: uni.majorGroups ?? [],
  }))
}

/**
 * 按专业聚合：将冲/稳/保三桶中的结果，以专业门类为主键，
 * 专业下挂载来自不同院校的该专业信息
 *
 * @param {object[]} bucket — enriched 院校列表（含 smoothedRank + majorGroups）
 * @returns {object[]}
 */
export function groupByMajor(bucket) {
  const majorMap = new Map()

  for (const uni of bucket) {
    const groups = uni.majorGroups ?? []
    for (const mg of groups) {
      const key = mg.groupName
      if (!majorMap.has(key)) {
        majorMap.set(key, {
          majorName: mg.groupName,
          majorCode: mg.groupCode,
          universities: [],
        })
      }
      majorMap.get(key).universities.push({
        uniId: uni.id,
        uniName: uni.name,
        province: uni.province,
        type: uni.type,
        tags: uni.tags ?? [],
        level_tags: uni.level_tags ?? [],
        smoothedRank: uni.smoothedRank,
        groupCode: mg.groupCode,
        groupName: mg.groupName,
        subjects: mg.subjects ?? [],
      })
    }
  }

  // 按院校数量降序排列（热门专业排前面）
  return Array.from(majorMap.values()).sort(
    (a, b) => b.universities.length - a.universities.length
  )
}
