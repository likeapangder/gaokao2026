/**
 * 必应高考 — 一分一段 Mock 数据
 * 覆盖北京(BJ)、上海(SH)、天津(TJ)、江苏(JS)、山东(SD) 五省市
 * 数据结构: { province_id, year, total, table: [{score, rank, count}] }
 * score 从高到低排列，rank 为累计位次（从 1 开始）
 */

/**
 * 生成线性分布的一分一段表（辅助函数，仅用于生成 Mock 数据）
 * @param {number} maxScore - 满分
 * @param {number} minScore - 最低有效分
 * @param {number} total    - 总参考人数
 * @param {number} peakScore - 人数高峰分数
 */
function generateTable(maxScore, minScore, total, peakScore) {
  const table = []
  let cumulativeRank = 0
  for (let s = maxScore; s >= minScore; s--) {
    // 用正态分布近似模拟人数分布
    const z = (s - peakScore) / 40
    const density = Math.exp(-0.5 * z * z)
    // 归一化后乘以总人数，每分段人数
    const count = Math.max(1, Math.round(density * (total / (Math.sqrt(2 * Math.PI) * 40))))
    cumulativeRank += count
    table.push({ score: s, rank: cumulativeRank, count })
  }
  return table
}

export const scoreRankTables = [
  // ─── 北京 (老高考，满分750) ───────────────────────────────
  {
    province_id: 'BJ',
    year: 2025,
    total: 68000,
    table: generateTable(750, 400, 68000, 530),
  },
  {
    province_id: 'BJ',
    year: 2024,
    total: 66000,
    table: generateTable(750, 400, 66000, 528),
  },
  {
    province_id: 'BJ',
    year: 2023,
    total: 63000,
    table: generateTable(750, 400, 63000, 525),
  },

  // ─── 上海 (老高考，满分660) ───────────────────────────────
  {
    province_id: 'SH',
    year: 2025,
    total: 52000,
    table: generateTable(660, 350, 52000, 490),
  },
  {
    province_id: 'SH',
    year: 2024,
    total: 51000,
    table: generateTable(660, 350, 51000, 488),
  },
  {
    province_id: 'SH',
    year: 2023,
    total: 49000,
    table: generateTable(660, 350, 49000, 485),
  },

  // ─── 天津 (老高考，满分750) ───────────────────────────────
  {
    province_id: 'TJ',
    year: 2025,
    total: 62000,
    table: generateTable(750, 380, 62000, 535),
  },
  {
    province_id: 'TJ',
    year: 2024,
    total: 60000,
    table: generateTable(750, 380, 60000, 532),
  },
  {
    province_id: 'TJ',
    year: 2023,
    total: 58000,
    table: generateTable(750, 380, 58000, 528),
  },

  // ─── 江苏 (3+1+2 新高考，满分750) ────────────────────────
  {
    province_id: 'JS',
    year: 2025,
    total: 395000,
    table: generateTable(750, 360, 395000, 555),
  },
  {
    province_id: 'JS',
    year: 2024,
    total: 383000,
    table: generateTable(750, 360, 383000, 552),
  },
  {
    province_id: 'JS',
    year: 2023,
    total: 371000,
    table: generateTable(750, 360, 371000, 548),
  },

  // ─── 山东 (3+1+2 新高考，满分750) ────────────────────────
  {
    province_id: 'SD',
    year: 2025,
    total: 820000,
    table: generateTable(750, 350, 820000, 548),
  },
  {
    province_id: 'SD',
    year: 2024,
    total: 808000,
    table: generateTable(750, 350, 808000, 545),
  },
  {
    province_id: 'SD',
    year: 2023,
    total: 795000,
    table: generateTable(750, 350, 795000, 542),
  },
]

export default scoreRankTables
