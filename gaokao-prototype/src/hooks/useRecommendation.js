/**
 * useRecommendation —— 2:5:3 志愿推荐 Hook（基于 mockSchools.js）
 *
 * 核心流程：
 *   1. 从 mockSchools 取全量院校数据
 *   2. 对每所院校用指数平滑法（α=0.5）计算近 3 年位次加权均值
 *   3. 根据考生位次按 2:5:3 区间分桶
 *        冲 (stretch) : smoothedRank ∈ [userRank×0.85, userRank×0.98)
 *        稳 (match)   : smoothedRank ∈ [userRank×0.98, userRank×1.15]
 *        保 (safety)  : smoothedRank ∈ (userRank×1.15, userRank×1.50]
 *   4. 桶内按兴趣标签加权排序（复用 autoPilot 算法，兴趣分×1.2 + 位次分）
 *   5. 按省份志愿名额配额（calcTierSlots）裁剪到 2:5:3 上限
 *
 * 返回值：
 *   {
 *     stretch   : School[]   // 冲档院校（已排序+裁剪）
 *     match     : School[]   // 稳档院校
 *     safety    : School[]   // 保档院校
 *     slots     : { stretch, match, safety }  // 各档名额上限
 *     meta      : { totalSlots, userRank, interests, interestApplied }
 *     isEmpty   : boolean    // 全部为空（未填位次）
 *     raw       : { stretch, match, safety }  // 未裁剪原始桶，方便 debug
 *   }
 *
 * 依赖：
 *   - CandidateContext（rank、province、interests）
 *   - mockSchools.js（院校数据源）
 *   - autoPilot.js（exponentialSmoothing / calcTierSlots / getProvinceSlots）
 */

import { useMemo } from 'react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { mockSchools } from '../data/mockSchools.js'
import {
  exponentialSmoothing,
  calcTierSlots,
  getProvinceSlots,
} from '../logic/autoPilot.js'

// ─── 常量 ────────────────────────────────────────────────────────────────────

/** 位次打分上界（将位次转为正向分数） */
const MAX_RANK = 200_000

// ─── 纯函数：兴趣评分 ────────────────────────────────────────────────────────

/**
 * 计算单所院校与兴趣标签的匹配分
 * 匹配字段优先级：type(30) > province(25) > level_tags(20/条) > tags(15/条)
 *
 * @param {object}   school    - 院校对象
 * @param {string[]} interests - 兴趣标签，如 ['985','理工','北京']
 * @returns {number}
 */
function calcInterestScore(school, interests) {
  if (!interests || interests.length === 0) return 0

  const set = new Set(interests.map((s) => s.trim().toLowerCase()))
  let score = 0

  // 院校类型（如 '理工'、'综合'、'财经'）
  if (school.type && set.has(school.type.toLowerCase())) score += 30

  // 院校所在省份（如 '北京'、'上海'）
  if (school.province && set.has(school.province.toLowerCase())) score += 25

  // level_tags（如 '顶尖985'、'建筑名校'）
  for (const tag of school.level_tags ?? []) {
    if (set.has(tag.toLowerCase())) score += 20
  }

  // tags（如 '985'、'211'、'双一流'）
  for (const tag of school.tags ?? []) {
    if (set.has(tag.toLowerCase())) score += 15
  }

  return score
}

// ─── 纯函数：带兴趣加权的综合排序 ───────────────────────────────────────────

/**
 * 对一桶院校按「兴趣加权综合得分」降序排列
 * finalScore = interestScore × 1.2 + (MAX_RANK - smoothedRank)
 *
 * @param {object[]} bucket    - 含 smoothedRank 的院校列表
 * @param {string[]} interests
 * @returns {object[]}         - 新数组，带 interestScore / finalScore 字段
 */
function sortByInterest(bucket, interests) {
  return bucket
    .map((school) => {
      const interestScore = calcInterestScore(school, interests)
      const rankScore     = MAX_RANK - school.smoothedRank
      const finalScore    = interestScore * 1.2 + rankScore
      return { ...school, interestScore, finalScore }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
}

// ─── 核心分桶函数 ────────────────────────────────────────────────────────────

/**
 * 将院校列表按 userRank 分入冲/稳/保三桶
 *
 * @param {number}   userRank
 * @param {object[]} schools
 * @returns {{ stretch: object[], match: object[], safety: object[] }}
 */
function bucketByRank(userRank, schools) {
  const stretch = []
  const match   = []
  const safety  = []

  for (const school of schools) {
    if (!school.rank_history?.length) continue

    const smoothedRank = exponentialSmoothing(school.rank_history)
    const enriched     = { ...school, smoothedRank }

    if (smoothedRank >= userRank * 0.85 && smoothedRank < userRank * 0.98) {
      stretch.push(enriched)
    } else if (smoothedRank >= userRank * 0.98 && smoothedRank <= userRank * 1.15) {
      match.push(enriched)
    } else if (smoothedRank > userRank * 1.15 && smoothedRank <= userRank * 1.50) {
      safety.push(enriched)
    }
    // smoothedRank < userRank×0.85 → 远超实力，排除
    // smoothedRank > userRank×1.50 → 过于保守，排除
  }

  return { stretch, match, safety }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useRecommendation
 *
 * 调用示例：
 *   const { stretch, match, safety, slots, meta, isEmpty } = useRecommendation()
 *
 * 当考生未填位次时，isEmpty === true，三桶均为空数组。
 */
export function useRecommendation() {
  const { rank, province, interests } = useCandidate()

  const result = useMemo(() => {
    // ── 未填位次：返回空结果 ──
    if (!rank) {
      return {
        stretch:  [],
        match:    [],
        safety:   [],
        slots:    { stretch: 0, match: 0, safety: 0 },
        meta:     { totalSlots: 0, userRank: null, interests: [], interestApplied: false },
        isEmpty:  true,
        raw:      { stretch: [], match: [], safety: [] },
      }
    }

    // ── Step 1: 分桶 ──────────────────────────────────────────
    const rawBuckets = bucketByRank(rank, mockSchools)

    // ── Step 2: 兴趣加权排序 ──────────────────────────────────
    const safeInterests = Array.isArray(interests) ? interests : []
    const sorted = {
      stretch: sortByInterest(rawBuckets.stretch, safeInterests),
      match:   sortByInterest(rawBuckets.match,   safeInterests),
      safety:  sortByInterest(rawBuckets.safety,  safeInterests),
    }

    // ── Step 3: 按省份名额配额裁剪（2:5:3）───────────────────
    const totalSlots = getProvinceSlots(province)
    const slots      = calcTierSlots(totalSlots)

    const clipped = {
      stretch: sorted.stretch.slice(0, slots.stretch),
      match:   sorted.match.slice(0,   slots.match),
      safety:  sorted.safety.slice(0,  slots.safety),
    }

    return {
      ...clipped,
      slots,
      meta: {
        totalSlots,
        userRank:        rank,
        interests:       safeInterests,
        interestApplied: safeInterests.length > 0,
        // 各桶原始命中数（裁剪前），方便 UI 展示"共匹配 N 所"
        rawCounts: {
          stretch: rawBuckets.stretch.length,
          match:   rawBuckets.match.length,
          safety:  rawBuckets.safety.length,
        },
      },
      isEmpty: false,
      raw:     rawBuckets,   // 未裁剪的原始桶，供调试/高级筛选
    }
  }, [rank, province, interests])

  return result
}

export default useRecommendation
