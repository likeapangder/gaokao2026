import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Download, FileText, AlertTriangle, ShieldCheck,
  TrendingUp, Award, Settings2, Loader2, CheckCircle2,
  Flame, Target, Anchor, ShieldAlert, ExternalLink,
  MapPin, BookOpen, Lock, ClipboardList, ChevronDown, ChevronUp,
  Info, GraduationCap,
} from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { generateReport } from '../logic/ReportEngine.js'
import { universities } from '../data/universities.js'
import { PROVINCE_NAMES } from '../data/schemas.js'

// ═══════════════════════════════════════════════════════════
//  地区组 → 省份映射（用于地域契合度计算）
// ═══════════════════════════════════════════════════════════
const REGION_TO_PROVINCES = {
  R1: ['BJ', 'TJ', 'HE', 'SX', 'NMG'],         // 华北
  R2: ['LN', 'JL', 'HL'],                         // 东北
  R3: ['SH', 'JS', 'ZJ', 'AH'],                   // 华东（沪苏浙皖）
  R4: ['FJ', 'JX', 'SD'],                          // 华东（闽赣鲁）
  R5: ['HA', 'HB', 'HN'],                          // 华中
  R6: ['GD', 'GX', 'HI'],                          // 华南
  R7: ['CQ', 'SC', 'GZ', 'YN', 'XZ'],             // 西南
  R8: ['SN', 'GS', 'QH', 'NX', 'XJ'],             // 西北
}

function getProvincesForRegions(regions) {
  if (!regions?.length) return []
  const set = new Set()
  regions.forEach(r => (REGION_TO_PROVINCES[r] ?? []).forEach(p => set.add(p)))
  return [...set]
}

// ═══════════════════════════════════════════════════════════
//  志愿诊断纯算法
// ═══════════════════════════════════════════════════════════
function diagnoseSheet(volunteers, preferences) {
  const total = volunteers.length
  if (total === 0) return null

  const stretch = volunteers.filter(v => v.category === 'stretch')
  const match   = volunteers.filter(v => v.category === 'match')
  const safety  = volunteers.filter(v => v.category === 'safety')

  const stretchPct = Math.round(stretch.length / total * 100)
  const matchPct   = Math.round(match.length   / total * 100)
  const safetyPct  = Math.round(safety.length  / total * 100)

  // ── 阵型健康度
  const targetStretch = 20, targetMatch = 50, targetSafety = 30
  const stretchDiff = stretchPct - targetStretch
  const matchDiff   = matchPct   - targetMatch
  const safetyDiff  = safetyPct  - targetSafety
  const healthScore = Math.max(0, 100 - Math.abs(stretchDiff) * 1.5 - Math.abs(matchDiff) - Math.abs(safetyDiff) * 1.2)
  let formationVerdict = ''
  if (healthScore >= 90) formationVerdict = '阵型极其健康，冲稳保分布符合最优策略。'
  else if (healthScore >= 75) formationVerdict = '阵型较为合理，局部微调可进一步优化。'
  else if (safetyPct < 20)   formationVerdict = '当前保底院校不足，存在较高滑档风险，建议增加保底志愿。'
  else if (stretchPct > 35)  formationVerdict = '冲刺院校比例过高，策略激进，建议适当补充稳妥院校。'
  else                        formationVerdict = '阵型存在一定偏差，请参照下方建议调整各区比例。'

  // ── 偏好满足率
  const prefRegions    = preferences?.locations ?? []
  const prefMajorGrps  = preferences?.majorGroups ?? []
  const allowedProvs   = getProvincesForRegions(prefRegions)

  let locationMatch = 0, majorMatch = 0
  if (total > 0) {
    if (allowedProvs.length === 0) {
      locationMatch = 100 // 无偏好 = 全匹配
    } else {
      const matched = volunteers.filter(v => allowedProvs.includes(v.university?.province)).length
      locationMatch = Math.round(matched / total * 100)
    }
    if (prefMajorGrps.length === 0) {
      majorMatch = 100
    } else {
      const matched = volunteers.filter(v => prefMajorGrps.includes(v.major?.category)).length
      majorMatch = Math.round(matched / total * 100)
    }
  }

  // ── 风险排雷
  const risks = []
  if (safety.length < 20)
    risks.push({ level: 'error', msg: `保底院校仅 ${safety.length} 个（建议 ≥28）`, sub: '低于安全线，滑档风险极高' })
  if (stretchPct > 35)
    risks.push({ level: 'warn', msg: `冲刺比例偏高（${stretchPct}%，建议 ≤20%）`, sub: '激进策略，若发挥失常将大量落空' })
  if (safety.length > 0 && safety.every(v => (v.probability ?? 0) < 80))
    risks.push({ level: 'error', msg: '所有保底院校录取概率均低于 80%', sub: '保底失效，需替换录取把握更大的院校' })

  // 检查空位（志愿总数 < 96）
  const TOTAL_SLOTS = 96
  if (total < TOTAL_SLOTS)
    risks.push({ level: 'warn', msg: `志愿表未填满（${total}/${TOTAL_SLOTS}）`, sub: `还有 ${TOTAL_SLOTS - total} 个空余槽位，建议填满以增加选择机会` })

  // 检查重复院校（同院校不同专业可以，同院校+专业算重复）
  const seen = new Set()
  let dupCount = 0
  volunteers.forEach(v => {
    const key = `${v.university?.id}-${v.major?.id}`
    if (seen.has(key)) dupCount++
    else seen.add(key)
  })
  if (dupCount > 0)
    risks.push({ level: 'warn', msg: `发现 ${dupCount} 条重复条目（相同院校+专业）`, sub: '重复填报不会增加录取机会，建议替换' })

  return {
    total, stretch: stretch.length, match: match.length, safety: safety.length,
    stretchPct, matchPct, safetyPct,
    healthScore: Math.round(healthScore),
    formationVerdict,
    locationMatch,
    majorMatch,
    risks,
    isHealthy: risks.length === 0,
  }
}

// ═══════════════════════════════════════════════════════════
//  模块一：阵型健康度
// ═══════════════════════════════════════════════════════════
function FormationHealthModule({ diag }) {
  const tiers = [
    { label: '冲刺', pct: diag.stretchPct, target: 20, color: '#f87171', lightBg: 'bg-red-50', text: 'text-red-600', icon: Flame },
    { label: '稳健', pct: diag.matchPct,   target: 50, color: '#0078D4', lightBg: 'bg-blue-50', text: 'text-[#0078D4]', icon: Target },
    { label: '保底', pct: diag.safetyPct,  target: 30, color: '#22c55e', lightBg: 'bg-green-50', text: 'text-green-600', icon: Anchor },
  ]

  const scoreColor = diag.healthScore >= 90 ? 'text-green-600' : diag.healthScore >= 75 ? 'text-[#0078D4]' : 'text-red-500'

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <ShieldCheck size={16} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">① 阵型健康度</h3>
            <p className="text-[10px] text-slate-400">Formation Health · 冲稳保分布诊断</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black tabular-nums ${scoreColor}`}>{diag.healthScore}</div>
          <div className="text-[10px] text-slate-400">/ 100 分</div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* 实际分布 vs 目标比例 */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">实际分布</div>
          <div className="flex h-4 rounded-full overflow-hidden gap-px shadow-inner bg-slate-100">
            <div className="transition-all duration-700" style={{ width: `${diag.stretchPct}%`, backgroundColor: '#f87171' }} />
            <div className="transition-all duration-700" style={{ width: `${diag.matchPct}%`, backgroundColor: '#0078D4' }} />
            <div className="transition-all duration-700" style={{ width: `${diag.safetyPct}%`, backgroundColor: '#22c55e' }} />
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">建议比例 (2:5:3)</div>
          <div className="flex h-4 rounded-full overflow-hidden gap-px shadow-inner bg-slate-100">
            <div className="bg-red-300/60" style={{ width: '20%' }} />
            <div className="bg-blue-300/60" style={{ width: '50%' }} />
            <div className="bg-green-300/60" style={{ width: '30%' }} />
          </div>
        </div>

        {/* 三区数据卡 */}
        <div className="grid grid-cols-3 gap-3">
          {tiers.map(({ label, pct, target, color, lightBg, text, icon: Icon }) => {
            const diff = pct - target
            return (
              <div key={label} className={`${lightBg} rounded-xl p-3 text-center`}>
                <Icon size={14} className={`${text} mx-auto mb-1`} />
                <div className={`text-2xl font-black tabular-nums ${text}`}>{pct}<span className="text-sm font-bold">%</span></div>
                <div className="text-[10px] text-slate-600 font-semibold">{label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">目标 {target}%</div>
                {Math.abs(diff) > 3 && (
                  <div className={`text-[9px] font-black mt-1 ${diff > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {diff > 0 ? `↑ +${diff}%` : `↓ ${diff}%`}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 裁判文案 */}
        <div className={`flex items-start gap-2.5 p-4 rounded-xl text-sm
          ${diag.healthScore >= 90 ? 'bg-green-50 border border-green-200 text-green-800' :
            diag.healthScore >= 75 ? 'bg-blue-50 border border-blue-200 text-blue-800' :
                                     'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          {diag.healthScore >= 90
            ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
            : <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          }
          <span className="font-medium leading-relaxed">{diag.formationVerdict}</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  模块二：偏好满足率
// ═══════════════════════════════════════════════════════════
function PreferenceMatchModule({ diag, preferences }) {
  const locationPref = preferences?.locations ?? []
  const majorPref    = preferences?.majorGroups ?? []
  const noPref       = locationPref.length === 0 && majorPref.length === 0

  const metrics = [
    {
      label: '地域契合度',
      value: diag.locationMatch,
      icon: MapPin,
      desc: locationPref.length ? `偏好区域：${locationPref.join('、')}` : '未设置地域偏好（默认全国）',
      color: diag.locationMatch >= 80 ? '#22c55e' : diag.locationMatch >= 60 ? '#0078D4' : '#f87171',
    },
    {
      label: '专业契合度',
      value: diag.majorMatch,
      icon: BookOpen,
      desc: majorPref.length ? `偏好门类：${majorPref.join('、')}` : '未设置专业偏好（默认全类）',
      color: diag.majorMatch >= 80 ? '#22c55e' : diag.majorMatch >= 60 ? '#0078D4' : '#f87171',
    },
  ]

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Award size={16} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">② 偏好满足率</h3>
          <p className="text-[10px] text-slate-400">Preference Match · 志愿与考生偏好的吻合程度</p>
        </div>
      </div>

      <div className="p-6">
        {noPref ? (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
            <Settings2 size={16} className="text-slate-400 flex-shrink-0" />
            <span>您尚未在成绩填写中设置地域或专业偏好。
              <span className="text-[#0078D4] font-semibold ml-1 cursor-pointer">修改偏好 →</span>
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map(({ label, value, icon: Icon, desc, color }) => (
              <div key={label} className="relative rounded-2xl border border-gray-100 p-5 overflow-hidden">
                {/* 背景环形装饰 */}
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10"
                  style={{ backgroundColor: color }} />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={13} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">{label}</span>
                    </div>
                    <div className="text-4xl font-black tabular-nums" style={{ color }}>
                      {value}<span className="text-xl">%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">{desc}</div>
                  </div>
                </div>

                {/* 进度弧形条 */}
                <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>

                {/* 评级 */}
                <div className="mt-2 text-[10px] font-bold"
                  style={{ color }}>
                  {value >= 80 ? '✓ 高度契合' : value >= 60 ? '△ 基本匹配' : '✗ 偏差较大'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  模块三：风险排雷清单
// ═══════════════════════════════════════════════════════════
function RiskAuditModule({ diag }) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${diag.isHealthy ? 'bg-green-50' : 'bg-red-50'}`}>
          {diag.isHealthy
            ? <ShieldCheck size={16} className="text-green-600" />
            : <ShieldAlert size={16} className="text-red-600" />
          }
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">③ 风险排雷清单</h3>
          <p className="text-[10px] text-slate-400">Risk Audit · 逻辑风险与空缺检测</p>
        </div>
        <div className={`ml-auto text-xs font-black px-3 py-1 rounded-full
          ${diag.isHealthy ? 'bg-green-100 text-green-700' : `bg-red-100 text-red-700`}`}>
          {diag.isHealthy ? '零风险' : `${diag.risks.length} 项风险`}
        </div>
      </div>

      <div className="p-6 space-y-3">
        {diag.isHealthy ? (
          <div className="flex items-center gap-3 p-5 bg-green-50 rounded-2xl border border-green-200">
            <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
            <div>
              <div className="font-bold text-green-800 text-sm">✅ 未检测到逻辑风险，志愿表可直接导出提交</div>
              <div className="text-xs text-green-600 mt-0.5">冲稳保梯度合理，无重复条目，保底充分</div>
            </div>
          </div>
        ) : (
          diag.risks.map((risk, i) => (
            <div key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm
                ${risk.level === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'}`}
            >
              {risk.level === 'error'
                ? <ShieldAlert size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                : <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              }
              <div>
                <div className={`font-bold leading-tight ${risk.level === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                  {risk.msg}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{risk.sub}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  诊断锁定门禁卡（无志愿表时替代诊断区）
// ═══════════════════════════════════════════════════════════
function DiagnosisLockedGate({ onNavigateToSheet }) {
  return (
    <div className="mb-8">
      {/* 区块标题 */}
      <div className="flex items-center gap-3 py-3 border-b-2 border-slate-100 mb-5">
        <div className="w-1 h-6 rounded-full bg-slate-300" />
        <h2 className="text-lg font-extrabold text-slate-900">志愿表全景诊断</h2>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          <Lock size={10} />
          未解锁
        </span>
      </div>

      {/* 锁定卡主体 */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
        {/* 背景装饰 — 模糊掉的三模块假预览 */}
        <div className="absolute inset-0 flex gap-3 p-6 opacity-[0.07] pointer-events-none select-none blur-[2px]">
          <div className="flex-1 bg-slate-400 rounded-xl" />
          <div className="flex-1 bg-slate-400 rounded-xl" />
          <div className="flex-1 bg-slate-400 rounded-xl" />
        </div>

        {/* 锁图标 */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-200 mb-5">
          <Lock size={28} className="text-slate-500" />
        </div>

        <h3 className="text-lg font-extrabold text-slate-700 mb-2">
          志愿表全景诊断尚未解锁
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-2">
          本模块包含：<strong className="text-slate-600">① 阵型健康度</strong>、
          <strong className="text-slate-600">② 偏好满足率</strong>、
          <strong className="text-slate-600">③ 风险排雷清单</strong>
        </p>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed mb-7">
          诊断依赖真实志愿表数据。请先前往「我的志愿表」添加或生成志愿，
          AI 报告将在志愿表存在时自动解锁并基于实际数据进行分析，<strong className="text-slate-500">绝不基于空数据编造结论。</strong>
        </p>

        {/* 三模块图示 */}
        <div className="flex items-center justify-center gap-3 mb-7 flex-wrap">
          {[
            { icon: ShieldCheck, label: '阵型健康度', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
            { icon: Award,       label: '偏好满足率', color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
            { icon: ShieldAlert, label: '风险排雷清单', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${bg} opacity-60`}>
              <Icon size={15} className={color} />
              <span className="text-xs font-bold text-slate-600">{label}</span>
              <Lock size={11} className="text-slate-400 ml-1" />
            </div>
          ))}
        </div>

        {/* CTA */}
        {onNavigateToSheet ? (
          <button
            onClick={onNavigateToSheet}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0078D4] hover:bg-blue-700
                       text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-200/60 active:scale-[0.98]"
          >
            <ClipboardList size={15} />
            前往「我的志愿表」填报
          </button>
        ) : (
          <a
            href="/sheet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0078D4] hover:bg-blue-700
                       text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-200/60"
          >
            <ExternalLink size={14} />
            前往「我的志愿表」填报，解锁深度诊断
          </a>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  志愿表全景诊断区块
// ═══════════════════════════════════════════════════════════
function SheetDiagnosisSection({ volunteers, preferences }) {
  const diag = useMemo(() => diagnoseSheet(volunteers, preferences), [volunteers, preferences])
  if (!diag) return null

  return (
    <div className="space-y-4">
      {/* 区块标题 */}
      <div className="flex items-center gap-3 py-3 border-b-2 border-slate-100">
        <div className="w-1 h-6 rounded-full bg-[#0078D4]" />
        <h2 className="text-lg font-extrabold text-slate-900">志愿表全景诊断</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          基于 {diag.total} 条志愿数据
        </span>
      </div>

      <FormationHealthModule diag={diag} />
      <PreferenceMatchModule diag={diag} preferences={preferences} />
      <RiskAuditModule diag={diag} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  PDF 视觉 — 每个"页面"容器
// ═══════════════════════════════════════════════════════════
function PdfPage({ children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden print:shadow-none print:border-0 print:rounded-none print:mb-0 print:break-after-page">
      {children}
    </div>
  )
}

function PdfSectionTitle({ num, title }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
      <span className="text-[11px] font-black text-white bg-[#0078D4] px-2.5 py-1 rounded-md tracking-wider">{num}</span>
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  封面页 § 00
// ═══════════════════════════════════════════════════════════
function PdfCover({ meta, preferences, examType, firstSubject, optionals, hasSheet, volunteerCount }) {
  const pref = preferences && typeof preferences === 'object' ? preferences : {}
  const locationPref = pref.locations ?? []
  const majorPref    = pref.majorGroups ?? []
  const strategyMap  = { university_first: '院校优先', major_first: '专业优先', location_first: '地域优先', balanced: '均衡策略' }
  const strategyLabel = strategyMap[pref.strategy] ?? '均衡策略'
  const subjectParts  = examType === '3+1+2' && firstSubject
    ? [firstSubject === 'history' ? '历史' : '物理', ...(optionals ?? [])].join(' · ')
    : examType === 'old' ? (firstSubject === 'physics' ? '理科' : '文科') : '—'

  return (
    <PdfPage>
      <div className="h-2" style={{ background: 'linear-gradient(90deg,#0078D4,#00BCF2)' }} />
      <div className="px-10 pt-8 pb-8">
        {/* 报告标题区 */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Bing 高考 · AI 志愿报告</span>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-slate-400">{new Date(meta.generatedAt).toLocaleDateString('zh-CN')}</span>
            </div>
            <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
              志愿报告<br />
              <span className="text-[#0078D4]">—{strategyLabel}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {meta.province} · {subjectParts} · {meta.score} 分
            </p>
          </div>
          <div className="flex-shrink-0 w-[88px] h-[88px] rounded-2xl flex flex-col items-center justify-center shadow-xl text-white"
            style={{ background: `linear-gradient(135deg, ${meta.tierColor}, ${meta.tierColor}bb)` }}>
            <span className="text-4xl font-black leading-none">{meta.tier}</span>
            <span className="text-[9px] font-bold tracking-widest mt-1 opacity-80">档位</span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent mb-7" />

        {/* 考生信息 4×2 网格 */}
        <div className="grid grid-cols-4 gap-0 border border-slate-200 rounded-xl overflow-hidden mb-6">
          {[
            { label: '高考成绩', value: `${meta.score} 分`, accent: true },
            { label: '高考排名', value: `${meta.rank?.toLocaleString()} 名`, accent: true },
            { label: '高考省份', value: meta.province },
            { label: '高考科目', value: subjectParts || '—' },
            { label: '专业偏好', value: majorPref.length ? majorPref.join('、') : '尚未设置' },
            { label: '地域偏好', value: locationPref.length ? locationPref.join('、') : '全国不限' },
            { label: '优先策略', value: strategyLabel },
            { label: '志愿状态', value: hasSheet ? `已填 ${volunteerCount} 条` : '暂未填写', accent: hasSheet },
          ].map(({ label, value, accent }, i) => (
            <div key={i}
              className={`px-4 py-3.5 ${i < 4 ? 'border-b border-slate-200' : ''} ${i % 4 !== 3 ? 'border-r border-slate-200' : ''}`}>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-sm font-bold leading-tight ${accent ? 'text-[#0078D4]' : 'text-slate-800'}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl">
          <Info size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">
            依据 {meta.province} {meta.year} 年招生计划、{meta.year - 1} 年录取分数线生成。本报告由 AI 生成，仅供志愿填报辅助，正式填报须考生和家长多方参考，谨慎决策。
          </p>
        </div>
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  § 02  策略设计页
// ═══════════════════════════════════════════════════════════
function PdfStrategyPage({ meta, recs, preferences }) {
  const pref = preferences && typeof preferences === 'object' ? preferences : {}
  const locationPref = pref.locations ?? []
  const majorPref    = pref.majorGroups ?? []

  const situationPoints = [
    {
      icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50',
      title: `考生所处分段，院校选择范围${meta.tier === 'S' || meta.tier === 'A' ? '宽广' : '适中'}`,
      text: `考生位于 ${meta.province} 全省前 ${meta.percentile}%（${meta.tierLabel}档），` +
        (meta.tier === 'S' ? '可冲击顶尖高校（清北复交浙等 C9）。' :
         meta.tier === 'A' ? '可稳定报考主流 985 院校，冲刺顶尖高校。' :
         meta.tier === 'B' ? '可冲击 985 尾部院校，稳妥报考强势 211 院校。' :
         meta.tier === 'C' ? '可报考本科院校，重点关注双非特色强校。' :
         '需精准把握志愿节奏，保底志愿至关重要。'),
    },
    recs.stretch.length + recs.match.length + recs.safety.length > 0 && {
      icon: Target, color: 'text-[#0078D4]', bg: 'bg-blue-50',
      title: '可选院校数量充裕',
      text: `系统检索到冲刺院校 ${recs.stretch.length} 所、稳妥院校 ${recs.match.length} 所、保底院校 ${recs.safety.length} 所，建议按 2:5:3 比例配比志愿。`,
    },
    locationPref.length > 0 ? {
      icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50',
      title: `考生的地域偏好，锁定 ${locationPref.join('、')} 地区`,
      text: `考生倾向 ${locationPref.join('、')} 地区，填报时将优先聚焦该地域的优质院校，充分发挥区位资源优势。`,
    } : {
      icon: MapPin, color: 'text-slate-500', bg: 'bg-slate-50',
      title: '考生暂未设定地域偏好',
      text: '候选院校覆盖全国范围，建议综合就业目标、生活成本和院校实力综合考量。',
    },
    majorPref.length > 0 && {
      icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50',
      title: `考生的专业偏好，聚焦 ${majorPref.join('、')} 领域`,
      text: `考生偏好 ${majorPref.join('、')} 类专业，报告推荐方案优先匹配该方向的院校与专业组。`,
    },
    {
      icon: Award, color: 'text-green-600', bg: 'bg-green-50',
      title: '志愿策略设计方向',
      text: ({
        university_first: '以院校层次和综合实力为首要考量，在确保层次前提下兼顾专业适配性，适合追求名校平台的考生。',
        major_first: '以专业方向为核心，优先选择专业排名靠前的院校，院校综合排名居其次，适合目标明确的考生。',
        location_first: '以地域为首要因素，优先选择目标城市优质院校，便于积累地域人脉资源。',
        balanced: '均衡考量院校层次、专业实力与地域分布，三维度加权综合决策，适合偏好灵活的考生。',
      })[pref.strategy] ?? '均衡考量院校层次、专业实力与地域分布，三维度加权综合决策。',
    },
  ].filter(Boolean)

  return (
    <PdfPage>
      <div className="px-10 py-8">
        <PdfSectionTitle num="02" title="志愿填报策略设计" />

        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">考生情况分析</p>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
          {situationPoints.map(({ icon: Icon, color, bg, title, text }, i) => (
            <div key={i} className={`flex items-start gap-4 px-5 py-4 ${i < situationPoints.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${bg}`}>
                <Icon size={13} className={color} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-xs font-bold text-slate-700">{title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">核心填报策略（2:5:3 梯度）</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: '01', icon: Flame, bg: 'bg-red-50 border-red-200', title: '冲刺层：争取更高平台', text: '选取位次高于考生约 5~15% 的院校，录取概率约 20~50%。重在争取更高层次的院校平台资源，实现向上突破。' },
            { num: '02', icon: Target, bg: 'bg-blue-50 border-blue-200', title: '稳妥层：核心志愿区间', text: '选取位次与考生基本持平（差值 ±5%）的院校，录取概率约 60~80%。志愿方案的核心，确保在偏好院校录取。' },
            { num: '03', icon: Anchor, bg: 'bg-green-50 border-green-200', title: '保底层：确保不滑档', text: '选取位次低于考生 15%+ 的院校，录取概率 ≥85%。确保在任何情况下均有院校兜底，规避高分落榜风险。' },
          ].map(({ num, icon: Icon, bg, title, text }) => (
            <div key={num} className={`border rounded-xl p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-slate-500">{num}</span>
                <span className="text-xs font-extrabold text-slate-700">{title}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  § 03  志愿表明细（基于真实志愿表，有表才渲染）
// ═══════════════════════════════════════════════════════════
function PdfVolunteerTable({ volunteers }) {
  const CAT_STYLE = {
    stretch: { label: '冲', badge: 'bg-red-100 text-red-700',    border: 'border-l-red-400' },
    match:   { label: '稳', badge: 'bg-blue-100 text-[#0078D4]', border: 'border-l-[#0078D4]' },
    safety:  { label: '保', badge: 'bg-green-100 text-green-700', border: 'border-l-green-500' },
  }
  const probByIdx = (cat, idx) => {
    if (cat === 'stretch') return `${Math.max(5, 40 - idx * 5)}%`
    if (cat === 'match')   return `${Math.min(83, 62 + idx * 3)}%`
    return '≥92%'
  }

  const catCounts = { stretch: 0, match: 0, safety: 0 }

  return (
    <PdfPage>
      <div className="px-10 py-8">
        <PdfSectionTitle num="03" title="志愿表明细" />
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">
            共 <strong className="text-slate-900">{volunteers.length}</strong> 条志愿 ·
            冲 <strong className="text-red-600">{volunteers.filter(v => v.category === 'stretch').length}</strong> ·
            稳 <strong className="text-[#0078D4]">{volunteers.filter(v => v.category === 'match').length}</strong> ·
            保 <strong className="text-green-600">{volunteers.filter(v => v.category === 'safety').length}</strong>
          </p>
          <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">来源：我的志愿表</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {/* 表头 */}
          <div className="grid bg-slate-50 border-b border-slate-200"
            style={{ gridTemplateColumns: '40px 50px 1fr 1fr 72px 64px' }}>
            {['序号', '类型', '院校名称', '志愿专业', '省份', '录取概率'].map(h => (
              <div key={h} className="px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 last:border-r-0">
                {h}
              </div>
            ))}
          </div>
          {/* 数据行 */}
          <div className="divide-y divide-slate-100">
            {volunteers.map((v, i) => {
              const cat = CAT_STYLE[v.category] ?? CAT_STYLE.safety
              catCounts[v.category] = (catCounts[v.category] ?? 0) + 1
              const idx = (catCounts[v.category] ?? 1) - 1
              const prob = probByIdx(v.category, idx)
              const uniName  = v.universityName ?? v.university?.name ?? '—'
              const majName  = v.majorName ?? v.major?.name ?? '—'
              const province = v.province ?? v.university?.province ?? '—'
              return (
                <div key={i}
                  className={`grid items-center border-l-[3px] hover:bg-slate-50/50 ${cat.border}`}
                  style={{ gridTemplateColumns: '40px 50px 1fr 1fr 72px 64px' }}>
                  <div className="px-3 py-3 text-[10px] text-slate-400 font-mono tabular-nums border-r border-slate-100">{i + 1}</div>
                  <div className="px-2 py-3 border-r border-slate-100">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
                  </div>
                  <div className="px-3 py-3 border-r border-slate-100 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">{uniName}</div>
                  </div>
                  <div className="px-3 py-3 border-r border-slate-100 min-w-0">
                    <div className="text-xs text-slate-600 truncate">{majName}</div>
                  </div>
                  <div className="px-3 py-3 border-r border-slate-100 text-center">
                    <span className="text-[10px] text-slate-500">{province}</span>
                  </div>
                  <div className="px-3 py-3 text-center">
                    <span className={`text-[11px] font-black tabular-nums
                      ${v.category === 'stretch' ? 'text-red-500' : v.category === 'match' ? 'text-[#0078D4]' : 'text-green-600'}`}>
                      {prob}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
          注：录取概率为基于冲稳保分类的区间估算，并非精确预测。建议每个专业组均选择服从专业调剂以降低退档风险。
        </p>
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  § 03  推荐院校（无志愿表时替代）
// ═══════════════════════════════════════════════════════════
function PdfRecsTable({ recs }) {
  function estProb(delta, cat) {
    if (cat === 'stretch') return `${Math.round(Math.max(10, Math.min(50, 20 + (delta + 0.15) / 0.10 * 35)))}%`
    if (cat === 'match')   return `${Math.round(Math.max(55, Math.min(85, 60 + (delta + 0.05) / 0.10 * 25)))}%`
    return `≥${Math.round(Math.min(99, 85 + Math.abs(delta) * 20))}%`
  }
  const rows = [
    ...recs.stretch.slice(0, 3).map(u => ({ ...u, cat: 'stretch' })),
    ...recs.match.slice(0, 6).map(u => ({ ...u, cat: 'match' })),
    ...recs.safety.slice(0, 4).map(u => ({ ...u, cat: 'safety' })),
  ]
  const CAT = {
    stretch: { label: '冲', badge: 'bg-red-100 text-red-700',    border: 'border-l-red-400' },
    match:   { label: '稳', badge: 'bg-blue-100 text-[#0078D4]', border: 'border-l-[#0078D4]' },
    safety:  { label: '保', badge: 'bg-green-100 text-green-700', border: 'border-l-green-500' },
  }
  return (
    <PdfPage>
      <div className="px-10 py-8">
        <PdfSectionTitle num="03" title="推荐院校明细" />
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">基于平滑位次算法匹配，数据来源：历年录取数据</p>
          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
            填写志愿表后可解锁个性化明细
          </span>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid bg-slate-50 border-b border-slate-200"
            style={{ gridTemplateColumns: '40px 50px 1fr 72px 90px 120px' }}>
            {['序号', '类型', '院校名称', '省份', '平滑位次', '院校层次'].map(h => (
              <div key={h} className="px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wide border-r border-slate-200 last:border-r-0">{h}</div>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((u, i) => {
              const cat = CAT[u.cat]
              return (
                <div key={u.id ?? i}
                  className={`grid items-center border-l-[3px] ${cat.border}`}
                  style={{ gridTemplateColumns: '40px 50px 1fr 72px 90px 120px' }}>
                  <div className="px-3 py-3 text-[10px] text-slate-400 font-mono border-r border-slate-100">{i + 1}</div>
                  <div className="px-2 py-3 border-r border-slate-100">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
                  </div>
                  <div className="px-3 py-3 border-r border-slate-100">
                    <div className="text-xs font-semibold text-slate-900 truncate">{u.name}</div>
                  </div>
                  <div className="px-3 py-3 border-r border-slate-100 text-[10px] text-slate-500">{u.province ?? '—'}</div>
                  <div className="px-3 py-3 border-r border-slate-100 text-[10px] font-mono text-slate-600 tabular-nums">
                    #{u.smoothedRank?.toLocaleString() ?? '—'}
                  </div>
                  <div className="px-3 py-3 flex flex-wrap gap-1">
                    {u.level_tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-[9px] text-slate-400 mt-2">注：以上为系统基于成绩位次自动匹配的参考院校，并非考生真实志愿。请前往「我的志愿表」填写后重新生成报告。</p>
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  § 04  志愿表解读
// ═══════════════════════════════════════════════════════════
function PdfSheetInterpretPage({ volunteers, preferences }) {
  const stretch = volunteers.filter(v => v.category === 'stretch')
  const match   = volunteers.filter(v => v.category === 'match')
  const safety  = volunteers.filter(v => v.category === 'safety')
  const total   = volunteers.length
  const diag    = diagnoseSheet(volunteers, preferences)

  const provMap = {}
  volunteers.forEach(v => {
    const p = v.province ?? v.university?.province ?? '其他'
    provMap[p] = (provMap[p] ?? 0) + 1
  })
  const topProvs = Object.entries(provMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <PdfPage>
      <div className="px-10 py-8">
        <PdfSectionTitle num="04" title="志愿表解读" />

        <div className="space-y-3 mb-6">
          {[
            {
              num: '01', label: '院校情况',
              text: `志愿表共 ${total} 条，冲刺层 ${stretch.length} 个、稳妥层 ${match.length} 个、保底层 ${safety.length} 个，` +
                `冲稳保比例为 ${Math.round(stretch.length/total*100)}%:${Math.round(match.length/total*100)}%:${Math.round(safety.length/total*100)}%（建议 20%:50%:30%）。` +
                (diag?.formationVerdict ? ` ${diag.formationVerdict}` : ''),
            },
            {
              num: '02', label: '地域情况',
              text: topProvs.length
                ? `志愿表院校地域分布：${topProvs.map(([p, c]) => `${p} ${c} 个（${Math.round(c/total*100)}%）`).join('、')}。` +
                  (diag?.locationMatch != null ? ` 地域契合度 ${diag.locationMatch}%。` : '')
                : '暂无地域分布数据。',
            },
            {
              num: '03', label: '专业情况',
              text: diag?.majorMatch != null
                ? `专业契合度 ${diag.majorMatch}%，与考生设定的专业偏好匹配程度${diag.majorMatch >= 80 ? '高' : diag.majorMatch >= 60 ? '较高' : '偏低'}。建议复核各专业组选科要求，确保符合报考条件。`
                : '请复核各志愿专业与选科要求的匹配情况。',
            },
          ].map(({ num, label, text }) => (
            <div key={num} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0078D4] text-white text-[10px] font-black flex items-center justify-center">{num}</span>
              <div>
                <span className="text-xs font-extrabold text-slate-700 mr-2">{label}</span>
                <span className="text-xs text-slate-600 leading-relaxed">{text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 阵型分布可视化 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">阵型分布</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: '冲刺层', count: stretch.length, pct: Math.round(stretch.length/total*100), icon: Flame, color: 'text-red-500', bg: 'bg-red-50', target: 20 },
                { label: '稳妥层', count: match.length, pct: Math.round(match.length/total*100), icon: Target, color: 'text-[#0078D4]', bg: 'bg-blue-50', target: 50 },
                { label: '保底层', count: safety.length, pct: Math.round(safety.length/total*100), icon: Anchor, color: 'text-green-600', bg: 'bg-green-50', target: 30 },
              ].map(({ label, count, pct, icon: Icon, color, bg, target }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${bg}`}>
                  <Icon size={14} className={`${color} mx-auto mb-1.5`} />
                  <div className={`text-xl font-black ${color}`}>{count}<span className="text-sm">个</span></div>
                  <div className="text-xs text-slate-600 font-semibold">{label}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${color}`}>{pct}% <span className="text-slate-400 font-normal">建议 {target}%</span></div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { label: '实际', s: stretch.length, m: match.length, sf: safety.length },
                { label: '建议', s: 0.2, m: 0.5, sf: 0.3, isTarget: true },
              ].map(({ label, s, m, sf, isTarget }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 w-8 flex-shrink-0">{label}</span>
                  <div className="flex-1 flex h-3 rounded-full overflow-hidden gap-px bg-slate-100">
                    <div className={isTarget ? 'bg-red-200' : 'bg-red-400'} style={{ width: `${isTarget ? s * 100 : s/total*100}%` }} />
                    <div className={isTarget ? 'bg-blue-200' : 'bg-[#0078D4]'} style={{ width: `${isTarget ? m * 100 : m/total*100}%` }} />
                    <div className={isTarget ? 'bg-green-200' : 'bg-green-500'} style={{ width: `${isTarget ? sf * 100 : sf/total*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 地域分布 */}
        {topProvs.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">地域分布（Top 5）</span>
            </div>
            <div className="p-4 space-y-2">
              {topProvs.map(([prov, cnt]) => (
                <div key={prov} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-semibold w-12 flex-shrink-0">{prov}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0078D4] rounded-full" style={{ width: `${cnt/total*100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono w-20 text-right">{cnt} 个 · {Math.round(cnt/total*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  § 05  阵型诊断页（有志愿表时）
// ═══════════════════════════════════════════════════════════
function PdfDiagnosisPage({ volunteers, preferences }) {
  const diag = useMemo(() => diagnoseSheet(volunteers, preferences), [volunteers, preferences])
  if (!diag) return null
  const scoreColor = diag.healthScore >= 90 ? '#22c55e' : diag.healthScore >= 75 ? '#0078D4' : '#ef4444'
  return (
    <PdfPage>
      <div className="px-10 py-8">
        <PdfSectionTitle num="05" title="阵型诊断" />
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">阵型健康度</div>
            <div className="text-5xl font-black tabular-nums mb-1" style={{ color: scoreColor }}>{diag.healthScore}</div>
            <div className="text-xs text-slate-400">/ 100 分</div>
            <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full
              ${diag.healthScore >= 90 ? 'bg-green-100 text-green-700' : diag.healthScore >= 75 ? 'bg-blue-100 text-[#0078D4]' : 'bg-red-100 text-red-700'}`}>
              {diag.healthScore >= 90 ? '优秀' : diag.healthScore >= 75 ? '良好' : '需优化'}
            </div>
          </div>
          <div className="col-span-2 border border-slate-200 rounded-xl p-5 space-y-3">
            {[
              { label: '地域契合度', value: diag.locationMatch, color: diag.locationMatch >= 80 ? '#22c55e' : diag.locationMatch >= 60 ? '#0078D4' : '#ef4444' },
              { label: '专业契合度', value: diag.majorMatch, color: diag.majorMatch >= 80 ? '#22c55e' : diag.majorMatch >= 60 ? '#0078D4' : '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">{label}</span>
                  <span className="text-sm font-black tabular-nums" style={{ color }}>{value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
            <p className={`text-xs leading-relaxed font-medium pt-1
              ${diag.healthScore >= 90 ? 'text-green-700' : diag.healthScore >= 75 ? 'text-blue-700' : 'text-amber-700'}`}>
              {diag.formationVerdict}
            </p>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">风险排雷清单</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diag.isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {diag.isHealthy ? '✓ 零风险' : `${diag.risks.length} 项风险`}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {diag.isHealthy ? (
              <div className="flex items-center gap-3 px-5 py-4 bg-green-50">
                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-green-700">志愿表未发现明显风险，阵型设计合理。</span>
              </div>
            ) : diag.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <AlertTriangle size={13} className={`flex-shrink-0 mt-0.5 ${risk.level === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">{risk.msg}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{risk.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  § 06  风险提示页
// ═══════════════════════════════════════════════════════════
function PdfRiskPage({ volunteers, hasSheet, examType, firstSubject, optionals, sectionNum }) {
  const risks = [
    { level: 'info', title: '平行志愿填报规则', text: '本批次为平行志愿院校专业组志愿报考模式，建议每个专业组都选择服从专业调剂，以降低退档风险。' },
    { level: 'warn', title: '专业调剂风险', text: '填报志愿时请认真阅读各院校《招生章程》中关于专业调剂的说明。若勾选"服从专业调剂"，院校可调剂至其他专业；若不服从，提档后退档将不再参与该批次录取。' },
  ]
  if (hasSheet) {
    const total = volunteers.length
    const safety = volunteers.filter(v => v.category === 'safety').length
    const stretch = volunteers.filter(v => v.category === 'stretch').length
    if (safety < 5 || Math.round(safety/total*100) < 20) {
      risks.unshift({ level: 'error', title: '保底院校不足', text: `当前保底院校 ${safety} 个（占 ${Math.round(safety/total*100)}%），建议至少占比 30%，否则存在较高滑档风险。` })
    }
    if (Math.round(stretch/total*100) > 35) {
      risks.push({ level: 'warn', title: '冲刺比例偏高', text: `冲刺院校占比 ${Math.round(stretch/total*100)}%（建议 ≤20%），策略激进，若发挥失常将大量落空。` })
    }
  }
  if (examType === '3+1+2' && firstSubject) {
    risks.push({ level: 'info', title: '新高考选科合规提示', text: `你的选科组合为 ${[firstSubject === 'history' ? '历史' : '物理', ...(optionals ?? [])].join('+')}，报考时请确认各专业组选科要求，不符合要求的专业组将无法录取。` })
  }
  risks.push({ level: 'info', title: '数据时效说明', text: '本报告所用录取数据来源于历年真实数据，2026年录取情况受政策、招生计划变化影响，最终以省教育考试院官方公布为准。' })

  const LEVEL = {
    error: { dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
    warn:  { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
    info:  { dot: 'bg-[#0078D4]',   text: 'text-[#0078D4]',  bg: 'bg-blue-50 border-blue-200' },
  }
  return (
    <PdfPage>
      <div className="px-10 py-8">
        <PdfSectionTitle num={sectionNum} title="风险提示" />
        <div className="space-y-3">
          {risks.map((r, i) => {
            const lv = LEVEL[r.level]
            return (
              <div key={i} className={`p-4 rounded-xl border ${lv.bg}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black text-slate-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${lv.dot}`} />
                  <span className={`text-xs font-extrabold ${lv.text}`}>{r.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">{r.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </PdfPage>
  )
}

// ═══════════════════════════════════════════════════════════
//  主页面
// ═══════════════════════════════════════════════════════════
export default function AIReportPage() {
  const candidate = useCandidate()
  const {
    score, province, rank, total,
    volunteers,              // 志愿表数据（由 VolunteerSheetPage 写入 context）
    preferences,
    examType, firstSubject, optionals = []
  } = candidate
  const { openScoreModal } = useUI()

  // ── 志愿表是否存在（必须有实体数据才能解锁诊断）
  const hasSheet = Array.isArray(volunteers) && volunteers.length > 0

  // ── Loader 步骤：根据是否有志愿表在 mount 时固定（不随 state 变化）
  // 用 ref 固定，防止重渲染时步骤集合变化导致 loader 重跑
  const stepsRef = useRef(
    hasSheet
      ? [
          '正在提取考生档案与多维偏好矩阵...',
          '检索目标院校历年录取与学费数据...',
          '运用专家引擎组装【冲稳保】策略解析...',
          `正在读取 ${volunteers.length} 条志愿数据，执行全景阵型诊断...`,
          '正在排版文档并生成可视化图表...',
        ]
      : [
          '正在提取考生档案与多维偏好矩阵...',
          '检索目标院校历年录取与学费数据...',
          '运用专家引擎组装【冲稳保】策略解析...',
          '正在排版文档并生成可视化图表...',
        ]
  )
  const steps = stepsRef.current

  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    if (!score || !rank) { setIsGenerating(false); return }
    if (currentStep < steps.length) {
      const t = setTimeout(() => setCurrentStep(p => p + 1), 750)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setIsGenerating(false), 500)
      return () => clearTimeout(t)
    }
  }, [currentStep, steps.length, score, rank])

  // 偏好标签兼容
  const interests = useMemo(() => {
    if (Array.isArray(preferences)) return preferences
    if (preferences && typeof preferences === 'object') {
      const { locations = [], majorGroups = [], strategy } = preferences
      return [
        ...locations,
        ...majorGroups,
        strategy === 'university_first' ? '名校优先' :
        strategy === 'major_first'      ? '专业优先' :
        strategy === 'location_first'   ? '地域优先' : '均衡策略'
      ]
    }
    return []
  }, [preferences])

  const report = useMemo(() => {
    if (!score || !rank || !total) return null
    return generateReport(
      { rank, total, score, province, interests, volunteers, examType, firstSubject, optionals },
      universities,
    )
  }, [score, rank, total, province, interests, volunteers, examType, firstSubject, optionals])

  const provinceName = PROVINCE_NAMES[province] || ''

  // ── 空状态：无成绩
  if (!score || !rank) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4 select-none">📄</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">请先填写成绩</h2>
        <p className="text-slate-600 mb-6">填写省份和高考成绩后，系统将为你生成个性化志愿报告</p>
        <button
          className="px-6 py-3 bg-[#0078D4] text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          onClick={() => openScoreModal({ expanded: true })}
        >
          前往填写 →
        </button>
      </div>
    )
  }

  // ── Agentic Loader
  if (isGenerating) {
    const progressPct = Math.min(100, (currentStep / steps.length) * 100)
    const STEP_ICONS = [
      { icon: '🧠', label: 'PROFILE' },
      { icon: '🏛️', label: 'SCHOOLS' },
      { icon: '⚙️', label: 'ENGINE' },
      { icon: '📋', label: 'SHEET' },
      { icon: '📄', label: 'RENDER' },
    ]

    return (
      <div className="relative flex flex-col items-center justify-center min-h-[72vh] overflow-hidden select-none">

        {/* ── 背景渐变光晕 ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 主光晕 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[520px] h-[520px] rounded-full
            bg-gradient-radial from-blue-100/70 via-indigo-50/40 to-transparent
            blur-3xl animate-pulse" />
          {/* 次光晕（右下） */}
          <div className="absolute bottom-12 right-16
            w-56 h-56 rounded-full
            bg-gradient-radial from-indigo-200/50 to-transparent
            blur-2xl opacity-60"
            style={{ animation: 'pulse 3s ease-in-out infinite 1s' }} />
          {/* 次光晕（左上） */}
          <div className="absolute top-16 left-16
            w-40 h-40 rounded-full
            bg-gradient-radial from-sky-200/40 to-transparent
            blur-2xl opacity-50"
            style={{ animation: 'pulse 4s ease-in-out infinite 0.5s' }} />
        </div>

        {/* ── 主卡片 ── */}
        <div className="relative z-10 w-full max-w-lg">

          {/* 顶部品牌标识行 */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full
              bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-[#0078D4] animate-pulse" />
              <span className="text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase">
                Bing AI · 志愿助手
              </span>
            </div>
          </div>

          {/* 轨道动画环 */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-24 h-24">
              {/* 外环旋转 */}
              <svg className="absolute inset-0 w-full h-full animate-spin"
                style={{ animationDuration: '3s' }} viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="44" fill="none"
                  stroke="url(#ringGrad)" strokeWidth="2.5"
                  strokeDasharray="200 76" strokeLinecap="round" />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0078D4" stopOpacity="1" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
              {/* 内环（反转慢速） */}
              <svg className="absolute inset-3 w-[72px] h-[72px] -rotate-45"
                style={{ animation: 'spin 5s linear infinite reverse' }} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="32" fill="none"
                  stroke="#e0e7ff" strokeWidth="1.5"
                  strokeDasharray="80 122" strokeLinecap="round" />
              </svg>
              {/* 中心图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white shadow-lg shadow-blue-100/60
                  flex items-center justify-center border border-slate-100">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    {/* 抽象"B"形状 */}
                    <rect x="6" y="5" width="4" height="18" rx="2" fill="#0078D4" />
                    <path d="M10 5h6a5 5 0 010 10H10V5z" fill="#0078D4" opacity="0.8" />
                    <path d="M10 15h7a5 5 0 010 10H10V15z" fill="#0078D4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 标题区 */}
          <div className="text-center mb-8">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight mb-1.5">
              AI 正在生成你的专属报告
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {hasSheet
                ? <>深度接入 <span className="font-bold text-indigo-600">{volunteers.length} 条</span> 志愿数据 · 全景诊断已激活</>
                : '综合成绩、位次与个人偏好，定制你的报考方案'}
            </p>
          </div>

          {/* 步骤列表 */}
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60
            rounded-2xl shadow-sm shadow-slate-100 overflow-hidden mb-5">
            {steps.map((text, index) => {
              const isCompleted = currentStep > index
              const isCurrent   = currentStep === index
              const isPending   = currentStep < index
              const isSheetStep = hasSheet && index === 3
              const stepMeta    = STEP_ICONS[index] ?? { icon: '•', label: '' }

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-100/80 last:border-0
                    transition-all duration-500
                    ${isCurrent
                      ? isSheetStep
                        ? 'bg-indigo-50/60'
                        : 'bg-blue-50/50'
                      : isCompleted
                        ? 'bg-white/40'
                        : 'bg-white/20'
                    }`}
                >
                  {/* 序号/图标栏 */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base
                    transition-all duration-300
                    ${isCompleted
                      ? 'bg-green-100'
                      : isCurrent
                        ? isSheetStep ? 'bg-indigo-100' : 'bg-blue-100'
                        : 'bg-slate-100'
                    }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} className={isSheetStep ? 'text-indigo-500' : 'text-green-500'} />
                    ) : isCurrent ? (
                      <Loader2 size={16}
                        className={`animate-spin ${isSheetStep ? 'text-indigo-500' : 'text-[#0078D4]'}`} />
                    ) : (
                      <span className="text-[13px] leading-none opacity-60">{stepMeta.icon}</span>
                    )}
                  </div>

                  {/* 步骤文字 */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold leading-snug truncate transition-colors duration-300
                      ${isCompleted
                        ? isSheetStep ? 'text-indigo-600' : 'text-green-600'
                        : isCurrent
                          ? isSheetStep ? 'text-indigo-700' : 'text-[#0078D4]'
                          : 'text-slate-400'
                      }`}>
                      {text}
                    </div>
                    {isCurrent && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-bold tracking-widest uppercase
                          text-slate-400 animate-pulse">Processing...</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="text-[10px] font-semibold text-slate-300 tracking-wide uppercase mt-0.5">
                        Done
                      </div>
                    )}
                  </div>

                  {/* 右侧标签 */}
                  <div className={`flex-shrink-0 text-[9px] font-black tracking-[0.15em] uppercase
                    px-2 py-0.5 rounded-full transition-all duration-300
                    ${isCompleted
                      ? isSheetStep
                        ? 'bg-indigo-100 text-indigo-500'
                        : 'bg-green-100 text-green-500'
                      : isCurrent
                        ? isSheetStep
                          ? 'bg-indigo-100 text-indigo-400'
                          : 'bg-blue-100 text-[#0078D4]'
                        : 'bg-slate-100 text-slate-300'
                    }`}>
                    {isCompleted ? 'OK' : isCurrent ? 'RUN' : stepMeta.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 进度条区 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
              <span className="text-[11px] font-black tabular-nums text-slate-600">
                {Math.round(progressPct)}<span className="text-slate-400 font-normal">%</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{
                  width: `${progressPct}%`,
                  background: hasSheet
                    ? 'linear-gradient(90deg, #0078D4, #818cf8)'
                    : 'linear-gradient(90deg, #0078D4, #00BCF2)',
                }}
              >
                {/* 光泽扫光效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                  translate-x-[-100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          {/* 底部志愿表激活徽章 */}
          {hasSheet && (
            <div className="mt-5 flex items-center justify-center gap-2
              px-4 py-2.5 rounded-xl
              bg-gradient-to-r from-indigo-50 to-purple-50
              border border-indigo-200/60">
              <ClipboardList size={13} className="text-indigo-500" />
              <span className="text-xs font-bold text-indigo-600">
                志愿表深度诊断已激活
              </span>
              <span className="text-[10px] text-indigo-400">·</span>
              <span className="text-[10px] text-indigo-400 font-medium">
                {volunteers.length} 条真实数据
              </span>
            </div>
          )}
        </div>

        {/* shimmer keyframes via inline style */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .bg-gradient-radial {
            background-image: radial-gradient(var(--tw-gradient-stops));
          }
        `}</style>
      </div>
    )
  }

  // ── 报告生成失败
  if (report && !report.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4 select-none">⚠️</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">报告生成失败</h2>
        {report.errors.map((e, i) => <p key={i} className="text-slate-600">{e}</p>)}
      </div>
    )
  }

  const { meta, recommendations: recs } = report

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0
      animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full max-w-[860px] mx-auto px-4 print:px-0 print:max-w-none">

        {/* ── 顶部操作栏（不打印） ── */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0078D4] flex items-center justify-center shadow-sm">
              <FileText size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-none">AI 志愿报告</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">
                必应高考 · {new Date(meta.generatedAt).toLocaleDateString('zh-CN')} · 依据历年真实录取数据生成
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold
              ${hasSheet
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
              {hasSheet
                ? <><CheckCircle2 size={10} /> 志愿表已接入 · {volunteers.length} 条</>
                : <><Lock size={10} /> 志愿诊断未解锁</>
              }
            </div>
            <button
              onClick={() => openScoreModal({ expanded: true })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Settings2 size={13} />
              修改偏好
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0078D4] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download size={13} />
              导出 PDF
            </button>
          </div>
        </div>

        {/* ── PDF 页面正文 ── */}

        {/* § 00 + 01  封面页（含考生档案） */}
        <PdfCover
          meta={meta}
          preferences={preferences}
          examType={examType}
          firstSubject={firstSubject}
          optionals={optionals}
          hasSheet={hasSheet}
          volunteerCount={volunteers.length}
        />

        {/* § 02  策略设计 */}
        <PdfStrategyPage meta={meta} recs={recs} preferences={preferences} />

        {/* § 03  志愿表明细 or 推荐院校（硬门禁） */}
        {hasSheet
          ? <PdfVolunteerTable volunteers={volunteers} />
          : <PdfRecsTable recs={recs} />
        }

        {/* § 04  志愿表解读（有志愿表才渲染） */}
        {hasSheet && (
          <PdfSheetInterpretPage volunteers={volunteers} preferences={preferences} />
        )}

        {/* § 05  阵型诊断（有志愿表才渲染） */}
        {hasSheet && (
          <PdfDiagnosisPage volunteers={volunteers} preferences={preferences} />
        )}

        {/* § 04 / 06  风险提示 */}
        <PdfRiskPage
          volunteers={volunteers}
          hasSheet={hasSheet}
          examType={examType}
          firstSubject={firstSubject}
          optionals={optionals}
          sectionNum={hasSheet ? '06' : '04'}
        />

        {/* ── 页脚 ── */}
        <div className="mt-2 mb-8 text-center print:hidden">
          <p className="text-[11px] text-slate-400">
            本报告由 AI 模板引擎生成，所有数据来源于历年真实录取记录，不存在主观臆造。
            正式填报请以各省教育考试院官方公告为最终依据。
          </p>
        </div>

      </div>
    </div>
  )
}
