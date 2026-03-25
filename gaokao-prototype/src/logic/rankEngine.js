/**
 * 必应高考 — Rank-Mapping Engine
 * 根据省份 + 分数 ↔ 位次双向转换
 * 接口设计支持后续替换为真实 API（返回同步结果，外部可包裹 Promise）
 */

import { scoreRankTables } from '../data/scoreRankTable.js'

/**
 * 获取指定省份、年份的一分一段表
 * @param {string} provinceId
 * @param {number} year
 * @returns {import('../data/scoreRankTable.js').ProvinceScoreRankTable | null}
 */
function getTable(provinceId, year) {
  return (
    scoreRankTables.find(
      (t) => t.province_id === provinceId && t.year === year
    ) ?? null
  )
}

/**
 * 获取最新年份的表（若找不到指定年份则降级使用最新）
 * @param {string} provinceId
 * @param {number} [year]
 * @returns {{ table: Array, total: number } | null}
 */
function resolveTable(provinceId, year) {
  // 优先精确匹配
  let found = getTable(provinceId, year)
  if (found) return found

  // 降级：取该省份最近年份
  const provinceTables = scoreRankTables
    .filter((t) => t.province_id === provinceId)
    .sort((a, b) => b.year - a.year)

  return provinceTables[0] ?? null
}

/**
 * 分数 → 位次（二分查找）
 * @param {string} provinceId - 省份代码，如 'BJ'
 * @param {number} score      - 考生分数
 * @param {number} [year]     - 年份，默认 2025
 * @returns {{ rank: number, total: number } | null}
 *   rank: 累计位次；total: 全省参考人数；null: 找不到数据
 */
export function scoreToRank(provinceId, score, year = 2025) {
  const data = resolveTable(provinceId, year)
  if (!data) return null

  const { table, total } = data

  // table 按 score 从高到低排列
  // 二分查找目标分数
  let lo = 0
  let hi = table.length - 1
  let result = null

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (table[mid].score === score) {
      result = table[mid]
      break
    } else if (table[mid].score > score) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  // 精确匹配
  if (result) return { rank: result.rank, total }

  // 未找到精确分数，取最接近的较高分的位次（模拟：该分数人从最近档次末尾算起）
  const closestHigher = table[lo] // lo 是第一个 score < target 的位置
  if (closestHigher) return { rank: closestHigher.rank, total }

  // score 高于所有数据
  return { rank: 1, total }
}

/**
 * 位次 → 分数（反查，二分查找）
 * @param {string} provinceId
 * @param {number} rank
 * @param {number} [year]
 * @returns {{ score: number, total: number } | null}
 */
export function rankToScore(provinceId, rank, year = 2025) {
  const data = resolveTable(provinceId, year)
  if (!data) return null

  const { table, total } = data

  // table 按 score 从高到低，rank 从小到大
  let lo = 0
  let hi = table.length - 1
  let best = null

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (table[mid].rank >= rank) {
      best = table[mid]
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  if (best) return { score: best.score, total }
  return { score: table[table.length - 1].score, total }
}

/**
 * 计算考生位次的百分位（前 x%）
 * @param {number} rank
 * @param {number} total
 * @returns {number} 百分位，如 5.3 表示前 5.3%
 */
export function rankToPercentile(rank, total) {
  if (!total || total === 0) return 0
  return parseFloat(((rank / total) * 100).toFixed(1))
}

/**
 * 获取可用的省份列表
 * @returns {string[]}
 */
export function getAvailableProvinces() {
  const seen = new Set()
  return scoreRankTables
    .filter((t) => {
      if (seen.has(t.province_id)) return false
      seen.add(t.province_id)
      return true
    })
    .map((t) => t.province_id)
}
