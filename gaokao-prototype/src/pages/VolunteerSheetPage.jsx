/**
 * VolunteerSheetPage.jsx — 我的志愿表 (宽屏工作台布局)
 * ─────────────────────────────────────────────────────────────
 * 架构：左侧主表格区 (flex-1) + 右侧 Agent 侧边栏 (w-80 sticky)
 *
 * 核心功能：
 *   • 一键智能生成 96 个志愿（2:5:3 冲稳保分布）
 *   • AgenticLoader 全屏思考动画
 *   • 拖拽排序（@dnd-kit）+ 可折叠区块
 *   • 区块划分：冲刺 / 稳健 / 保底 视觉色带
 *   • 志愿护航 Agent 实时风险审计侧边栏
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Sparkles, GripVertical, Trash2, Download, AlertTriangle,
  CheckCircle2, ShieldAlert, Info, RotateCcw,
  TrendingUp, ChevronDown, ChevronUp,
  Flame, Target, Anchor,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import AgenticLoader from '../components/AgenticLoader.jsx'
import { deepSchools, deepMajors } from '../data/deepMockData.js'
import { PROVINCE_NAMES } from '../data/schemas.js'

// ═══════════════════════════════════════════════════════════
//  常量 & Tier 配置
// ═══════════════════════════════════════════════════════════

const TOTAL_SLOTS = 96

const TIER = {
  stretch: {
    key: 'stretch',
    label: '冲刺',
    labelShort: '冲',
    count: Math.round(TOTAL_SLOTS * 0.20),   // 19
    icon: Flame,
    rowBg: 'bg-red-50/60',
    rowBorder: 'border-l-[3px] border-red-300',
    badgeBg: 'bg-red-100 text-red-700',
    sectionBg: 'bg-gradient-to-r from-red-50/90 to-transparent',
    sectionBorder: 'border-l-4 border-red-400',
    sectionText: 'text-red-600',
    barColor: '#f87171',
    dot: 'bg-red-400',
    prob: [40, 65],
  },
  match: {
    key: 'match',
    label: '稳健',
    labelShort: '稳',
    count: Math.round(TOTAL_SLOTS * 0.50),   // 48
    icon: Target,
    rowBg: 'bg-blue-50/30',
    rowBorder: 'border-l-[3px] border-[#0078D4]/40',
    badgeBg: 'bg-blue-100 text-[#0078D4]',
    sectionBg: 'bg-gradient-to-r from-blue-50/90 to-transparent',
    sectionBorder: 'border-l-4 border-[#0078D4]',
    sectionText: 'text-[#0078D4]',
    barColor: '#0078D4',
    dot: 'bg-[#0078D4]',
    prob: [65, 85],
  },
  safety: {
    key: 'safety',
    label: '保底',
    labelShort: '保',
    count: TOTAL_SLOTS - Math.round(TOTAL_SLOTS * 0.20) - Math.round(TOTAL_SLOTS * 0.50), // 29
    icon: Anchor,
    rowBg: 'bg-green-50/50',
    rowBorder: 'border-l-[3px] border-green-400',
    badgeBg: 'bg-green-100 text-green-700',
    sectionBg: 'bg-gradient-to-r from-green-50/90 to-transparent',
    sectionBorder: 'border-l-4 border-green-500',
    sectionText: 'text-green-700',
    barColor: '#22c55e',
    dot: 'bg-green-500',
    prob: [85, 98],
  },
}

const TIER_ORDER = ['stretch', 'match', 'safety']

// ═══════════════════════════════════════════════════════════
//  Mock 数据生成器 — 96 条志愿（2:5:3 分布）
// ═══════════════════════════════════════════════════════════

function generateMockVolunteers(candidateRank) {
  const baseRank = candidateRank || 50000
  const schools = [...deepSchools]
  const majorPool = deepMajors.slice(0, 20)
  const volunteers = []

  TIER_ORDER.forEach((tierKey) => {
    const cfg = TIER[tierKey]
    const factor = tierKey === 'stretch' ? 0.7 : tierKey === 'match' ? 1.0 : 1.4
    const [probMin, probMax] = cfg.prob

    for (let i = 0; i < cfg.count; i++) {
      const gi = volunteers.length
      const school = schools[(gi * 7 + i * 3) % schools.length]
      const major  = majorPool[(gi + i * 5) % majorPool.length]
      const probability = Math.round(probMin + Math.random() * (probMax - probMin))

      volunteers.push({
        id: `${tierKey}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        university: school,
        major,
        category: tierKey,
        order: gi,
        probability,
        rankRef: Math.round(baseRank * factor * (0.9 + Math.random() * 0.2)),
        isGenerated: true,
      })
    }
  })

  return volunteers
}

// ═══════════════════════════════════════════════════════════
//  Sortable Row
// ═══════════════════════════════════════════════════════════

function SortableRow({ vol, globalIndex, tierCfg, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: vol.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const prob = vol.probability ?? 70
  const probColor = prob >= 85 ? 'text-green-600' : prob >= 65 ? 'text-[#0078D4]' : 'text-red-500'
  const probBarColor = prob >= 85 ? '#22c55e' : prob >= 65 ? '#0078D4' : '#f87171'

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${tierCfg.rowBg} ${tierCfg.rowBorder} border-b border-gray-100/80 ${isDragging ? 'opacity-40' : 'hover:brightness-[0.97]'} transition-all duration-100`}
    >
      {/* Handle */}
      <td className="px-2 py-2 w-8 text-center">
        <button {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors touch-none"
          tabIndex={-1}
        >
          <GripVertical size={15} />
        </button>
      </td>

      {/* 序号 */}
      <td className="px-2 py-2 w-10 text-center">
        <span className="text-xs font-bold text-slate-400 tabular-nums">{globalIndex + 1}</span>
      </td>

      {/* 类型 */}
      <td className="px-2 py-2 w-12 text-center">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${tierCfg.badgeBg}`}>
          {tierCfg.labelShort}
        </span>
      </td>

      {/* 院校 */}
      <td className="px-3 py-2 min-w-[160px] max-w-[220px]">
        <div className="font-semibold text-sm text-slate-900 truncate leading-tight">
          {vol.university?.name ?? '—'}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
          {vol.university?.province && <span>{vol.university.province}</span>}
          {vol.university?.type && <><span className="text-slate-300">·</span><span>{vol.university.type}</span></>}
        </div>
      </td>

      {/* 专业 */}
      <td className="px-3 py-2 min-w-[140px] max-w-[190px]">
        <div className="text-sm text-slate-700 truncate">
          {vol.major?.name ?? <span className="text-slate-400 italic text-xs">未指定专业</span>}
        </div>
        {vol.major?.category && (
          <div className="text-[10px] text-indigo-500 mt-0.5">{vol.major.category}</div>
        )}
      </td>

      {/* 标签 */}
      <td className="px-3 py-2 w-36">
        <div className="flex flex-wrap gap-1">
          {vol.university?.level_tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">
              {tag}
            </span>
          ))}
        </div>
      </td>

      {/* 录取概率 */}
      <td className="px-3 py-2 w-24 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-sm font-black tabular-nums ${probColor}`}>{prob}%</span>
          <div className="w-12 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${prob}%`, backgroundColor: probBarColor }} />
          </div>
        </div>
      </td>

      {/* 删除 */}
      <td className="px-2 py-2 w-10 text-center">
        <button onClick={() => onRemove(vol.id)}
          className="text-slate-300 hover:text-red-500 transition-colors"
          aria-label={`删除 ${vol.university?.name}`}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}

// ═══════════════════════════════════════════════════════════
//  Section Header Row
// ═══════════════════════════════════════════════════════════

function SectionHeaderRow({ tierCfg, count, startIndex, isCollapsed, onToggle }) {
  const Icon = tierCfg.icon
  return (
    <tr className={`${tierCfg.sectionBg} ${tierCfg.sectionBorder} select-none`}>
      <td colSpan={8} className="py-2 px-4">
        <button onClick={onToggle} className="flex items-center gap-2 w-full text-left group">
          <Icon size={13} className={tierCfg.sectionText} />
          <span className={`text-[11px] font-black uppercase tracking-widest ${tierCfg.sectionText}`}>
            {tierCfg.label}区
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            #{startIndex + 1}–#{startIndex + count} · {count} 个志愿
          </span>
          <span className="ml-auto text-slate-400 group-hover:text-slate-600 transition-colors">
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </span>
        </button>
      </td>
    </tr>
  )
}

// ═══════════════════════════════════════════════════════════
//  空状态
// ═══════════════════════════════════════════════════════════

function EmptyState({ onGenerate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-inner">
          <span className="text-5xl select-none">📋</span>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-[#0078D4] flex items-center justify-center shadow-md">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      <h2 className="text-xl font-extrabold text-slate-900 mb-2">您还没有添加任何志愿</h2>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
        点击「✨ 一键生成」，AI 将根据您的成绩与偏好，<br />
        自动生成符合 <strong className="text-slate-700">2:5:3 冲稳保</strong> 策略的 96 个志愿
      </p>

      {/* 策略示意条 */}
      <div className="flex w-60 h-2.5 rounded-full overflow-hidden mb-2 shadow-sm">
        <div className="bg-red-400" style={{ width: '20%' }} />
        <div className="bg-[#0078D4]" style={{ width: '50%' }} />
        <div className="bg-green-500" style={{ width: '30%' }} />
      </div>
      <div className="flex justify-between w-60 text-[10px] font-bold mb-8">
        <span className="text-red-500">冲刺 20%</span>
        <span className="text-[#0078D4]">稳健 50%</span>
        <span className="text-green-600">保底 30%</span>
      </div>

      <button
        onClick={onGenerate}
        className="flex items-center gap-2 px-8 py-3.5 bg-[#0078D4] text-white font-bold text-sm rounded-2xl
                   hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
      >
        <Sparkles size={16} />
        一键智能生成 96 个志愿
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Agent 审计侧边栏
// ═══════════════════════════════════════════════════════════

function AuditorPanel({ volunteers }) {
  const grouped = useMemo(() => ({
    stretch: volunteers.filter(v => v.category === 'stretch'),
    match:   volunteers.filter(v => v.category === 'match'),
    safety:  volunteers.filter(v => v.category === 'safety'),
  }), [volunteers])

  const total = volunteers.length
  const stretchPct = total ? Math.round(grouped.stretch.length / total * 100) : 0
  const matchPct   = total ? Math.round(grouped.match.length   / total * 100) : 0
  const safetyPct  = total ? Math.round(grouped.safety.length  / total * 100) : 0

  const issues = useMemo(() => {
    if (total === 0) return []
    const list = []
    if (stretchPct > 30)
      list.push({ level: 'warn', msg: '冲刺比例偏高', sub: `当前 ${stretchPct}%，建议 ≤20%，注意滑档风险` })
    if (grouped.safety.length < 20)
      list.push({ level: 'warn', msg: '保底志愿数不足', sub: `当前 ${grouped.safety.length} 个，建议 ≥28 个` })
    if (grouped.safety.length > 0 && grouped.safety.every(v => (v.probability ?? 0) < 80))
      list.push({ level: 'error', msg: '保底录取率偏低', sub: '建议确保保底院校录取概率 > 85%' })
    if (list.length === 0)
      list.push({ level: 'ok', msg: '梯度配置合理', sub: `冲 ${stretchPct}% · 稳 ${matchPct}% · 保 ${safetyPct}%` })
    return list
  }, [grouped, stretchPct, matchPct, safetyPct, total])

  return (
    <aside className="w-80 flex-shrink-0">
      <div className="sticky top-6 space-y-4">

        {/* Agent 标题卡 */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0078D4] to-indigo-600 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg select-none">🛡️</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white leading-tight">志愿护航 Agent</h3>
                <p className="text-[10px] text-blue-200 mt-0.5">实时逻辑审计 · 已开启</p>
              </div>
              <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-300 font-semibold">运行中</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-2.5">
            {total === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                已开启实时逻辑审计，为您监测
                <strong className="text-slate-700">倒挂</strong>与
                <strong className="text-slate-700">选科风险</strong>。
                生成志愿后将自动开始分析。
              </p>
            ) : (
              issues.map((issue, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl text-xs
                  ${issue.level === 'error' ? 'bg-red-50 border border-red-100' :
                    issue.level === 'warn'  ? 'bg-amber-50 border border-amber-100' :
                                              'bg-green-50 border border-green-100'}`}
                >
                  {issue.level === 'error'
                    ? <ShieldAlert size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                    : issue.level === 'warn'
                    ? <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    : <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <div className={`font-bold leading-tight
                      ${issue.level === 'error' ? 'text-red-700' : issue.level === 'warn' ? 'text-amber-700' : 'text-green-700'}`}>
                      {issue.msg}
                    </div>
                    <div className="text-slate-500 mt-0.5 leading-relaxed">{issue.sub}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 梯度统计卡 */}
        {total > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">梯度分布</h4>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px shadow-sm">
              <div className="transition-all duration-500" style={{ width: `${stretchPct}%`, backgroundColor: '#f87171' }} />
              <div className="transition-all duration-500" style={{ width: `${matchPct}%`, backgroundColor: '#0078D4' }} />
              <div className="transition-all duration-500" style={{ width: `${safetyPct}%`, backgroundColor: '#22c55e' }} />
            </div>
            <div className="space-y-2.5">
              {TIER_ORDER.map(key => {
                const cfg = TIER[key]
                const cnt = grouped[key].length
                const pct = total ? Math.round(cnt / total * 100) : 0
                const target = key === 'stretch' ? 20 : key === 'match' ? 50 : 30
                const diff = pct - target
                const Icon = cfg.icon
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <Icon size={11} className={cfg.sectionText} />
                    <span className="text-slate-600 font-medium flex-1">{cfg.label}</span>
                    <span className="font-black text-slate-800 tabular-nums">{cnt}</span>
                    <span className="text-slate-400 tabular-nums w-7 text-right">{pct}%</span>
                    {Math.abs(diff) > 2 && (
                      <span className={`text-[9px] font-bold w-8 text-right tabular-nums ${diff > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                        {diff > 0 ? `+${diff}` : diff}%
                      </span>
                    )}
                  </div>
                )
              })}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">合计</span>
                <span className="font-black text-slate-900">{total} / {TOTAL_SLOTS}</span>
              </div>
            </div>
          </div>
        )}

        {/* 填报提示 */}
        <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Info size={12} className="text-[#0078D4]" />
            <h4 className="text-[10px] font-bold text-[#0078D4] uppercase tracking-wider">填报策略提示</h4>
          </div>
          {[
            '拖拽每行可调整志愿填报顺序',
            '冲刺志愿录取概率建议 40–65%',
            '保底志愿录取概率须 > 85%',
            '同一学校不同专业组可重复填报',
            '注意选科要求须与您的选考科目匹配',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-blue-800/80">
              <span className="mt-0.5 flex-shrink-0 text-blue-400">·</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>

      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════
//  主页面
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  主页面
// ═══════════════════════════════════════════════════════════

export default function VolunteerSheetPage({ embedded = false }) {
  const {
    score, province, rank,
    volunteers,          // ← 单一数据源，持久化于 CandidateContext
    reorderVolunteers,
    volunteerSheet,
    removeFromSheet,
  } = useCandidate()
  const { openScoreModal } = useUI()

  const [isLoading, setIsLoading]   = useState(false)
  const [collapsed, setCollapsed]   = useState({})
  const [activeId, setActiveId]     = useState(null)

  // 监听 volunteerSheet 变化：将新增的购物车条目合并进 volunteers（context）
  useEffect(() => {
    if (volunteerSheet.length === 0) return
    const existingIds = new Set(volunteers.map(v => v.id))
    const newItems = volunteerSheet
      .filter(item => !existingIds.has(item.id))
      .map((item, i) => ({
        id: item.id,
        university: { id: item.universityId, name: item.universityName, province: item.province, type: item.type },
        major: item.majorId ? { id: item.majorId, name: item.majorName } : null,
        category: item.category ?? 'match',
        order: volunteers.length + i,
        probability: 70,
        isFromCart: true,
      }))
    if (newItems.length > 0) {
      reorderVolunteers([...volunteers, ...newItems])
    }
  }, [volunteerSheet]) // eslint-disable-line react-hooks/exhaustive-deps

  const provinceName = PROVINCE_NAMES[province] || ''

  const handleGenerate = useCallback(() => setIsLoading(true), [])

  const handleLoaderComplete = useCallback(() => {
    const generated = generateMockVolunteers(rank)
    reorderVolunteers(generated) // 写入 context，作为唯一数据源
    setIsLoading(false)
  }, [rank, reorderVolunteers])

  const handleReset = useCallback(() => {
    if (window.confirm('确认清空所有志愿？此操作不可撤销。')) {
      reorderVolunteers([])   // 清空 context
      setCollapsed({})
    }
  }, [reorderVolunteers])

  const handleRemove = useCallback((id) => {
    reorderVolunteers(volunteers.filter(v => v.id !== id))
    removeFromSheet(id) // 同步从购物车移除（如果是购物车条目）
  }, [volunteers, reorderVolunteers, removeFromSheet])

  const handleExport = useCallback(() => {
    const header = ['序号', '类型', '院校', '专业', '省份', '院校类型', '录取概率']
    const rows = volunteers.map((v, i) => [
      i + 1,
      TIER[v.category]?.labelShort ?? v.category,
      v.university?.name ?? '',
      v.major?.name ?? '',
      v.university?.province ?? '',
      v.university?.type ?? '',
      `${v.probability ?? ''}%`,
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '我的志愿表_必应高考.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [volunteers])

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oi = volunteers.findIndex(v => v.id === active.id)
    const ni = volunteers.findIndex(v => v.id === over.id)
    if (oi === -1 || ni === -1) return
    reorderVolunteers(arrayMove(volunteers, oi, ni).map((v, i) => ({ ...v, order: i })))
  }, [volunteers, reorderVolunteers])

  // 按 Tier 分组
  const sections = useMemo(() => (
    TIER_ORDER.map(key => ({
      key,
      cfg: TIER[key],
      rows: volunteers.filter(v => v.category === key),
    }))
  ), [volunteers])

  // 全局连续序号
  const globalIndexMap = useMemo(() => {
    const map = {}
    let idx = 0
    TIER_ORDER.forEach(key => {
      volunteers.filter(v => v.category === key).forEach(v => { map[v.id] = idx++ })
    })
    return map
  }, [volunteers])

  const hasData = volunteers.length > 0
  const activeVol = activeId ? volunteers.find(v => v.id === activeId) : null

  return (
    <>
      <AgenticLoader isOpen={isLoading} onComplete={handleLoaderComplete} />

      <div className="flex gap-6 items-start">

        {/* ══════════ 左侧主区域 ══════════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Header — 嵌入模式下隐藏大标题，保留操作按钮行 */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {!embedded && (
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900">我的志愿表</h1>
                  <span className="text-sm text-slate-400 font-normal">({TOTAL_SLOTS} 个槽位)</span>
                </div>
                {score ? (
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                    <TrendingUp size={11} className="text-[#0078D4]" />
                    <span>{provinceName} · <strong className="text-slate-700">{score} 分</strong></span>
                    {rank && <span>· 位次 <strong className="text-slate-700">#{rank.toLocaleString()}</strong></span>}
                    <span className="text-slate-300">·</span>
                    <span className="tabular-nums">{volunteers.length}/{TOTAL_SLOTS} 已填</span>
                  </div>
                ) : (
                  <button onClick={() => openScoreModal()}
                    className="mt-1 text-xs text-[#0078D4] hover:underline font-semibold">
                    ⚠ 未填写考生信息，点击填入 →
                  </button>
                )}
              </div>
            )}

            {/* 嵌入模式：显示简化的状态行 */}
            {embedded && (
              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <TrendingUp size={11} className="text-[#0078D4]" />
                {score
                  ? <><span>{provinceName} · <strong className="text-slate-700">{score} 分</strong></span>
                    {rank && <span>· #{rank.toLocaleString()}</span>}
                    <span className="text-slate-300">·</span></>
                  : null}
                <span className="tabular-nums font-semibold text-slate-700">{volunteers.length}/{TOTAL_SLOTS} 已填</span>
                {volunteers.length === 0 && !score && (
                  <button onClick={() => openScoreModal()}
                    className="text-[#0078D4] hover:underline font-semibold">
                    ⚠ 点击填入考生信息 →
                  </button>
                )}
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex items-center gap-2 flex-wrap">
              {hasData && (
                <>
                  <button onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                               text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent
                               hover:border-red-100 transition-all">
                    <RotateCcw size={13} /> 清空重来
                  </button>
                  <button onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                               text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                    <Download size={13} /> 导出 CSV
                  </button>
                </>
              )}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0078D4] text-white text-sm font-bold rounded-xl
                           hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-200/60
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles size={15} />
                {hasData ? '重新生成' : '✨ 一键生成'}
              </button>
            </div>
          </div>

          {/* 空状态 or 数据表格 */}
          {!hasData ? (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
              <EmptyState onGenerate={handleGenerate} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">

              {/* 顶部分布色条 */}
              <div className="flex h-1.5">
                {sections.map(({ key, cfg, rows }) => (
                  <div key={key} className="transition-all duration-500" style={{
                    width: `${(rows.length / TOTAL_SLOTS) * 100}%`,
                    backgroundColor: cfg.barColor,
                  }} />
                ))}
                <div className="flex-1 bg-slate-100" />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={({ active }) => setActiveId(active.id)}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
              >
                <SortableContext items={volunteers.map(v => v.id)} strategy={verticalListSortingStrategy}>
                  <div className={`overflow-x-auto overflow-y-auto ${embedded ? 'max-h-[calc(100vh-340px)]' : 'max-h-[calc(100vh-220px)]'}`}>
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-2 py-2.5 w-8" />
                          <th className="px-2 py-2.5 w-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">No.</th>
                          <th className="px-2 py-2.5 w-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">类型</th>
                          <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">院校</th>
                          <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">专业</th>
                          <th className="px-3 py-2.5 w-36 text-[10px] font-bold text-slate-500 uppercase tracking-wider">标签</th>
                          <th className="px-3 py-2.5 w-24 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">录取概率</th>
                          <th className="px-2 py-2.5 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map(({ key, cfg, rows }) => {
                          const isCollapsed = !!collapsed[key]
                          const sectionStart = TIER_ORDER
                            .slice(0, TIER_ORDER.indexOf(key))
                            .reduce((acc, k) => acc + (sections.find(s => s.key === k)?.rows.length ?? 0), 0)
                          return (
                            <>
                              <SectionHeaderRow
                                key={`hdr-${key}`}
                                tierCfg={cfg}
                                count={rows.length}
                                startIndex={sectionStart}
                                isCollapsed={isCollapsed}
                                onToggle={() => setCollapsed(p => ({ ...p, [key]: !p[key] }))}
                              />
                              {!isCollapsed && rows.map(vol => (
                                <SortableRow
                                  key={vol.id}
                                  vol={vol}
                                  globalIndex={globalIndexMap[vol.id] ?? 0}
                                  tierCfg={cfg}
                                  onRemove={handleRemove}
                                />
                              ))}
                            </>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </SortableContext>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={null}>
                  {activeVol ? (() => {
                    const cfg = TIER[activeVol.category] ?? TIER.match
                    return (
                      <div className={`${cfg.rowBg} ${cfg.rowBorder} border border-gray-200 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 opacity-95`}>
                        <GripVertical size={15} className="text-slate-400" />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.badgeBg}`}>
                          {cfg.labelShort}
                        </span>
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[140px]">
                          {activeVol.university?.name}
                        </span>
                        <span className="text-xs text-slate-500 truncate max-w-[100px]">
                          {activeVol.major?.name}
                        </span>
                        <span className={`ml-auto text-sm font-black tabular-nums
                          ${(activeVol.probability ?? 0) >= 85 ? 'text-green-600' : (activeVol.probability ?? 0) >= 65 ? 'text-[#0078D4]' : 'text-red-500'}`}>
                          {activeVol.probability}%
                        </span>
                      </div>
                    )
                  })() : null}
                </DragOverlay>
              </DndContext>

              {/* 底部汇总 */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  {sections.map(({ key, cfg, rows }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className="text-slate-600">{cfg.label} <strong className="text-slate-800">{rows.length}</strong></span>
                    </div>
                  ))}
                </div>
                <span>剩余 <strong className="text-slate-700">{Math.max(0, TOTAL_SLOTS - volunteers.length)}</strong> 个槽位</span>
              </div>
            </div>
          )}
        </div>

        {/* ══════════ 右侧 Agent 侧边栏 ══════════ */}
        <AuditorPanel volunteers={volunteers} />

      </div>
    </>
  )
}
