/**
 * 必应高考 — ReportEngine.js
 *
 * 职责：接收 userProfile，输出结构化报告 JSON，供前端直接渲染。
 *
 * 设计原则：
 *   1. 零 AI 调用——所有文案来自 StringLibrary，确保 100% 内容确定性。
 *   2. 纯函数——相同输入永远产生相同输出，无网络请求、无随机数。
 *   3. 防御性编程——每个入参均有类型校验，错误路径返回结构化 Error 对象
 *      而非抛出异常，保证前端不会因数据异常崩溃。
 *   4. 数据与渲染分离——本模块只产出 JSON，不包含任何 JSX/HTML。
 */

import { TIER_LIBRARY, INTEREST_KEY_MAP, POLICY_NOTES } from './StringLibrary.js'
import { generateRecommendations } from './autoPilot.js'
import { rankToPercentile } from './rankEngine.js'
import { PROVINCE_NAMES } from '../data/schemas.js'

// ─────────────────────────────────────────────────────────────
//  § 1. 档位判断（5 档，精度比旧版 3 档提升）
// ─────────────────────────────────────────────────────────────

/**
 * 档位边界表（百分位，闭区间左边界）
 * 说明：percentile = rank / total × 100，数值越小成绩越好
 *   [0,  5)  → S
 *   [5, 20)  → A
 *   [20, 45) → B
 *   [45, 70) → C
 *   [70,100] → D
 */
const TIER_THRESHOLDS = [
  { tier: 'S', maxPct: 5   },
  { tier: 'A', maxPct: 20  },
  { tier: 'B', maxPct: 45  },
  { tier: 'C', maxPct: 70  },
  { tier: 'D', maxPct: 100 },
]

/**
 * 根据百分位计算档位
 * @param {number} percentile - 全省前 x%，数值越小越优
 * @returns {'S'|'A'|'B'|'C'|'D'}
 */
function calcTier(percentile) {
  for (const { tier, maxPct } of TIER_THRESHOLDS) {
    if (percentile < maxPct) return tier
  }
  return 'D'
}

// ─────────────────────────────────────────────────────────────
//  § 2. 兴趣标签解析（interests[] → interestKey）
// ─────────────────────────────────────────────────────────────

/**
 * 从考生的兴趣标签数组中，提取出 StringLibrary 能识别的 interestKey
 * 优先级：精确命中 > 同义词命中 > 'default'
 *
 * @param {string[]} interests
 * @returns {string} interestKey，如 '理工' / '财经' / 'default'
 */
function resolveInterestKey(interests) {
  if (!Array.isArray(interests) || interests.length === 0) return 'default'

  for (const tag of interests) {
    const normalized = tag.trim()
    if (INTEREST_KEY_MAP[normalized]) return INTEREST_KEY_MAP[normalized]
    // 部分匹配（如 "计算机科学" 包含 "工科"）
    for (const [keyword, key] of Object.entries(INTEREST_KEY_MAP)) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) return key
    }
  }
  return 'default'
}

// ─────────────────────────────────────────────────────────────
//  § 3. 模板插值（{{变量名}} 替换）
// ─────────────────────────────────────────────────────────────

/**
 * 将文案模板中的 {{变量名}} 替换为实际值
 * 未找到的变量替换为空字符串（而非显示 [变量名]，保持报告美观）
 *
 * @param {string} template
 * @param {Record<string, string>} vars
 * @returns {string}
 */
function interpolate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined && val !== null ? String(val) : ''
  })
}

// ─────────────────────────────────────────────────────────────
//  § 4. 文案选取（章节 × 兴趣 fallback 链）
// ─────────────────────────────────────────────────────────────

/**
 * 从 StringLibrary 中取出指定 tier + section + interestKey 的文案
 * fallback 链：interestKey → 'default'（保证永不返回 undefined）
 *
 * @param {string} tier           - 'S'|'A'|'B'|'C'|'D'
 * @param {string} section        - 'intro'|'stretch'|'match'|'safety'|'strategy'
 * @param {string} interestKey    - 'default'|'理工'|'财经'|...
 * @returns {string} 原始文案模板（含 {{变量}}）
 */
function pickText(tier, section, interestKey) {
  const tierLib = TIER_LIBRARY[tier]
  if (!tierLib) return ''

  const sectionLib = tierLib[section]
  if (!sectionLib) return ''

  // 精确匹配 → fallback default
  return sectionLib[interestKey] ?? sectionLib['default'] ?? ''
}

// ─────────────────────────────────────────────────────────────
//  § 5. 变量包构建（供 interpolate 使用）
// ─────────────────────────────────────────────────────────────

/**
 * 构建插值变量包
 * 包括考生基本信息、推荐院校信息、位次区间等
 *
 * @param {UserProfile} profile
 * @param {number} percentile
 * @param {object} recs  - generateRecommendations() 的输出
 * @returns {Record<string, string>}
 */
function buildVars(profile, percentile, recs) {
  const { rank, total, score, province, year = 2025 } = profile
  const provinceName = PROVINCE_NAMES[province] ?? province ?? ''

  const getSchool = (arr, idx) => arr[idx]?.name ?? ''
  const getRank   = (arr, idx) => arr[idx]?.smoothedRank?.toLocaleString() ?? '—'

  // 位次区间（供文案中 "你的冲刺区间为 xxx~yyy" 使用）
  const stretchLo = Math.round(rank * 0.85).toLocaleString()
  const stretchHi = Math.round(rank * 0.98).toLocaleString()
  const matchLo   = Math.round(rank * 0.98).toLocaleString()
  const matchHi   = Math.round(rank * 1.15).toLocaleString()
  const safetyLo  = Math.round(rank * 1.15).toLocaleString()
  const safetyHi  = Math.round(rank * 1.50).toLocaleString()

  return {
    province:     provinceName,
    year:         String(year),
    score:        String(score ?? ''),
    rank:         rank?.toLocaleString() ?? '',
    total:        total?.toLocaleString() ?? '',
    percentile:   percentile.toFixed(1),

    // 冲刺区间
    stretchLo, stretchHi,
    stretchSchool1: getSchool(recs.stretch, 0),
    stretchSchool2: getSchool(recs.stretch, 1),
    stretchSchool3: getSchool(recs.stretch, 2),
    stretchRank1:   getRank(recs.stretch, 0),
    stretchRank2:   getRank(recs.stretch, 1),
    stretchRank3:   getRank(recs.stretch, 2),

    // 稳妥区间
    matchLo, matchHi,
    matchSchool1: getSchool(recs.match, 0),
    matchSchool2: getSchool(recs.match, 1),
    matchSchool3: getSchool(recs.match, 2),
    matchRank1:   getRank(recs.match, 0),
    matchRank2:   getRank(recs.match, 1),
    matchRank3:   getRank(recs.match, 2),

    // 保底区间
    safetyLo, safetyHi,
    safetySchool1: getSchool(recs.safety, 0),
    safetySchool2: getSchool(recs.safety, 1),
    safetyRank1:   getRank(recs.safety, 0),
    safetyRank2:   getRank(recs.safety, 1),
  }
}

// ─────────────────────────────────────────────────────────────
//  § 6. 输入校验
// ─────────────────────────────────────────────────────────────

/**
 * 校验 userProfile，返回错误列表（空数组表示校验通过）
 * @param {*} profile
 * @returns {string[]}
 */
function validateProfile(profile) {
  const errors = []
  if (!profile || typeof profile !== 'object') {
    return ['userProfile 必须是一个对象']
  }
  if (typeof profile.rank !== 'number' || profile.rank < 1) {
    errors.push('rank（位次）必须是正整数')
  }
  if (typeof profile.total !== 'number' || profile.total < 1) {
    errors.push('total（全省总人数）必须是正整数')
  }
  if (profile.rank > profile.total) {
    errors.push('rank 不能大于 total')
  }
  if (typeof profile.score !== 'number' || profile.score < 0) {
    errors.push('score（分数）必须是非负数')
  }
  if (!profile.province || typeof profile.province !== 'string') {
    errors.push('province（省份代码）必须是非空字符串')
  }
  return errors
}

// ─────────────────────────────────────────────────────────────
//  § 7. 主入口：generateReport()
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} UserProfile
 * @property {number}   rank        - 考生位次（正整数，1 = 全省第一）
 * @property {number}   total       - 全省参考人数
 * @property {number}   score       - 高考总分
 * @property {string}   province    - 省份代码，如 'JS'
 * @property {string[]} interests   - 兴趣标签，如 ['985', '理工', '北京']
 * @property {number}   [year]      - 考试年份，默认 2025
 * @property {Array}    [volunteers] - 已填志愿表（用于报告摘要章节）
 * @property {string}   [examType]  - 'old' | '3+1+2'
 * @property {string}   [firstSubject] - 首选科目（新高考）
 * @property {string[]} [optionals]    - 再选科目（新高考）
 */

/**
 * @typedef {Object} ReportSection
 * @property {string}   key     - 章节唯一标识
 * @property {string}   title   - 章节标题（用于渲染 <h3>）
 * @property {string}   content - 已插值完毕的正文（纯文字，前端直接渲染）
 * @property {'normal'|'warning'|'policy'} type - 渲染样式提示
 */

/**
 * @typedef {Object} ReportJSON
 * @property {boolean}  ok          - 是否生成成功
 * @property {string[]} errors      - 错误信息列表（ok=false 时非空）
 * @property {object}   meta        - 报告元信息
 * @property {string}   meta.tier           - 档位代码 'S'|'A'|'B'|'C'|'D'
 * @property {string}   meta.tierLabel      - 档位标签，如 '顶尖考生'
 * @property {string}   meta.tierColor      - 档位主题色（CSS hex）
 * @property {string}   meta.badgeText      - 徽章文字，如 'S 档 · 全省前 5%'
 * @property {string}   meta.strategyLine   - 一句话策略摘要
 * @property {string}   meta.interestKey    - 实际使用的兴趣 key
 * @property {string}   meta.generatedAt    - ISO 8601 生成时间
 * @property {string}   meta.province       - 省份名称（中文）
 * @property {number}   meta.score
 * @property {number}   meta.rank
 * @property {number}   meta.total
 * @property {number}   meta.percentile
 * @property {ReportSection[]} sections     - 报告章节列表（有序）
 */

/**
 * 生成结构化报告 JSON
 *
 * @param {UserProfile}  userProfile
 * @param {Array}        universities - 全量院校数据（来自 data/universities.js）
 * @returns {ReportJSON}
 */
export function generateReport(userProfile, universities) {
  // ── 1. 输入校验 ────────────────────────────────────────────
  const errors = validateProfile(userProfile)
  if (errors.length > 0) {
    return { ok: false, errors, meta: {}, sections: [] }
  }

  const {
    rank, total, score, province,
    year = 2025,
    interests = [],
    volunteers = [],
    examType,
    firstSubject,
    optionals = [],
  } = userProfile

  // ── 2. 核心计算 ────────────────────────────────────────────
  const percentile  = rankToPercentile(rank, total)       // 全省前 x%
  const tier        = calcTier(percentile)                 // 'S'|'A'|'B'|'C'|'D'
  const interestKey = resolveInterestKey(interests)        // 兴趣 key
  const tierMeta    = TIER_LIBRARY[tier].meta
  const provinceName = PROVINCE_NAMES[province] ?? province

  // ── 3. 推荐院校（供文案插值用）────────────────────────────
  const recs = generateRecommendations(rank, universities ?? [])
  const vars = buildVars({ rank, total, score, province, year }, percentile, recs)

  // ── 4. 各章节文案组装 ──────────────────────────────────────
  const SECTION_DEFS = [
    { key: 'intro',      title: '综合评估',     type: 'normal'  },
    { key: 'stretch',    title: '冲刺院校建议', type: 'normal'  },
    { key: 'match',      title: '稳妥院校建议', type: 'normal'  },
    { key: 'safety',     title: '保底院校建议', type: 'normal'  },
    { key: 'strategy',   title: '整体策略',     type: 'normal'  },
  ]

  const sections = SECTION_DEFS.map(({ key, title, type }) => {
    const rawText = pickText(tier, key, interestKey)
    const content = interpolate(rawText, vars)
    return { key, title, content, type }
  })

  // ── 5. 政策提示章节（固定文案，不受档位/兴趣影响）─────────
  sections.push({
    key:     'policy_parallel',
    title:   '平行志愿填报规则',
    content: POLICY_NOTES.parallelAdmission,
    type:    'policy',
  })
  sections.push({
    key:     'policy_adjustment',
    title:   '关于专业调剂',
    content: POLICY_NOTES.majorAdjustment,
    type:    'policy',
  })
  if (
    ['医学', '医疗', '临床'].some((t) =>
      interests.map((i) => i.trim()).includes(t)
    )
  ) {
    sections.push({
      key:     'policy_physical',
      title:   '体检限制说明',
      content: POLICY_NOTES.physicalExam,
      type:    'policy',
    })
  }

  // ── 6. 志愿表摘要章节（若考生已填写志愿）─────────────────
  if (Array.isArray(volunteers) && volunteers.length > 0) {
    const volLines = volunteers.map((v, i) => {
      const catLabel = v.category === 'stretch' ? '冲' : v.category === 'match' ? '稳' : '保'
      const majorPart = v.major ? ` — ${v.major.name}` : ''
      return `${i + 1}. [${catLabel}] ${v.university?.name ?? ''}${majorPart}`
    })
    sections.push({
      key:     'volunteer_summary',
      title:   '我的志愿表摘要',
      content: volLines.join('\n'),
      type:    'summary',
    })
  }

  // ── 7. 选科合规提示（新高考考生）─────────────────────────
  if (examType === '3+1+2') {
    const subjectList = [firstSubject, ...optionals].filter(Boolean)
    const subjectStr  = subjectList.length > 0
      ? `你的选科组合为：${subjectList.join(' + ')}。`
      : '你尚未填写选科信息。'
    sections.push({
      key:     'policy_subject',
      title:   '新高考选科说明',
      content:
        subjectStr +
        '院校专业组的选科要求具有强制约束力。' +
        POLICY_NOTES.gaokaoPolicy2025,
      type:    'policy',
    })
  }

  // ── 8. 免责声明（固定末尾）────────────────────────────────
  sections.push({
    key:     'disclaimer',
    title:   '数据声明',
    content: TIER_LIBRARY[tier].disclaimer,
    type:    'warning',
  })

  // ── 9. 组装最终输出 JSON ───────────────────────────────────
  return {
    ok: true,
    errors: [],
    meta: {
      tier,
      tierLabel:    tierMeta.label,
      tierColor:    tierMeta.color,
      badgeText:    tierMeta.badgeText,
      strategyLine: tierMeta.strategyLine,
      interestKey,
      generatedAt:  new Date().toISOString(),
      province:     provinceName,
      score,
      rank,
      total,
      percentile: parseFloat(percentile.toFixed(1)),
      year,
      examType:     examType ?? null,
      firstSubject: firstSubject ?? null,
      optionals,
    },
    sections,

    // 附：推荐院校列表（前端可选用于报告中额外展示）
    recommendations: {
      stretch: recs.stretch.slice(0, 5),
      match:   recs.match.slice(0, 8),
      safety:  recs.safety.slice(0, 5),
    },
  }
}
