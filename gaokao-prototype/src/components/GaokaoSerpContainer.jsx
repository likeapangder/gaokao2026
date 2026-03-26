/**
 * GaokaoSerpContainer.jsx
 * ─────────────────────────────────────────────────────────────
 * 高考垂类 SERP 主容器 — "常驻导航 + 原地渲染"架构
 *
 * 架构说明：
 * ┌─────────────────────────────────────────────────────────┐
 * │  Persistent Quick Links Header (6 个常驻 Tab)           │
 * ├─────────────────────────────────────────────────────────┤
 * │  Dynamic Content Slot                                   │
 * │  根据 activeView 原地渲染对应子组件                       │
 * └─────────────────────────────────────────────────────────┘
 *
 * 交互规则：
 * • 招生政策 / AI报告 → window.open 新标签（Workspace 模式）
 * • 智能推荐 / 查学校 / 查专业 / 一分一段 → 原地 DOM 替换
 * • onEntityClick(schoolName) → 触发全局搜索框更新 + 路由跳转
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  GraduationCap,
  BookOpen,
  BarChart3,
  FileText,
  Newspaper,
  ExternalLink,
  Edit2,
  MapPin,
  TrendingUp,
  Calendar,
  Home,
} from 'lucide-react'
// Note: FileText, Newspaper are used by QUICK_LINKS icon definitions

import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { PROVINCE_NAMES } from '../data/schemas.js'

// ─── 子视图懒导入（直接引用，已存在的页面/组件）
import RecommendationPage from '../pages/RecommendationPage.jsx'
import ScoreRankPage from '../pages/ScoreRankPage.jsx'
import SerpHomeDashboard from './SerpHomeDashboard.jsx'
import { deepSchools, deepMajors } from '../data/deepMockData.js'

// ─── 科目代码 → 中文，用于格式化 subject_requirement 对象
const SUBJECT_CN = {
  physics: '物理', chemistry: '化学', biology: '生物',
  history: '历史', geography: '地理', politics: '政治',
}
function formatSubjectReq(req) {
  if (!req) return '不限'
  if (typeof req === 'string') return req
  const { required = [], optional = [] } = req
  const parts = []
  if (required.length) parts.push(`必选：${required.map(s => SUBJECT_CN[s] ?? s).join('、')}`)
  if (optional.length) parts.push(`选考：${optional.map(s => SUBJECT_CN[s] ?? s).join('、')}`)
  return parts.length ? parts.join('；') : '不限'
}

// ═══════════════════════════════════════════════════════════
//  View ID 常量
// ═══════════════════════════════════════════════════════════
const VIEWS = {
  HOME:       'home',       // ← 新增，作为默认首页
  RECOMMEND:  'recommend',
  SCHOOL:     'school',
  MAJOR:      'major',
  SCORE_RANK: 'score_rank',
  // 以下两个是 Workspace 外链，不原地渲染
  POLICY:     'policy',    // 招生政策 → 外链
  AI_REPORT:  'ai_report', // AI报告 → /ai-report 新标签
}

// ═══════════════════════════════════════════════════════════
//  Quick Links Tab 定义
// ═══════════════════════════════════════════════════════════
const QUICK_LINKS = [
  {
    id: VIEWS.HOME,
    label: '首页',
    labelEn: 'Home',
    icon: Home,
    isExternal: false,
  },
  {
    id: VIEWS.POLICY,
    label: '招生政策',
    labelEn: 'Policy',
    icon: Newspaper,
    isExternal: true,
    externalUrl: 'http://www.moe.gov.cn/jyb_xwfb/',
  },
  {
    id: VIEWS.RECOMMEND,
    label: '智能推荐',
    labelEn: 'AI Pick',
    icon: Sparkles,
    isExternal: false,
  },
  {
    id: VIEWS.AI_REPORT,
    label: 'AI 报告',
    labelEn: 'Report',
    icon: FileText,
    isExternal: true,
    externalPath: '/ai-report',
  },
  {
    id: VIEWS.SCHOOL,
    label: '热门学校',
    labelEn: 'Schools',
    icon: GraduationCap,
    isExternal: false,
  },
  {
    id: VIEWS.MAJOR,
    label: '热门专业',
    labelEn: 'Majors',
    icon: BookOpen,
    isExternal: false,
  },
  {
    id: VIEWS.SCORE_RANK,
    label: '一分一段',
    labelEn: 'Rank Table',
    icon: BarChart3,
    isExternal: false,
  },
]

// ═══════════════════════════════════════════════════════════
//  Hero Banner — "微软高考·必赢高考"
//  Tab 导航上方的品牌 + 考生信息区
// ═══════════════════════════════════════════════════════════
function HeroBanner() {
  const { score, province, rank, examType, firstSubject } = useCandidate()
  const { openScoreModal } = useUI()
  const provinceName = PROVINCE_NAMES[province] || ''

  // 推算科类标签
  const subjectLabel = firstSubject === 'history' ? '历史类' : firstSubject === 'physics' ? '物理类' : (examType === 'old' ? '理科' : '—')

  // 距高考倒计时（固定 2026/6/7）
  const daysLeft = Math.ceil((new Date('2026-06-07') - new Date()) / 86400000)

  const hasProfile = !!(score && province)

  return (
    <div className="relative overflow-hidden px-6 pt-6 pb-0 bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0078D4]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-400/5 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        {/* 左侧：品牌标题 */}
        <div className="flex items-baseline gap-3 min-w-0">
          {/* Bing B 徽章 */}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#0078D4] flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-lg leading-none" style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}>B</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
              微软高考，<span className="text-[#0078D4]">必赢高考</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-wide">
              Microsoft Bing · 2026 高考志愿辅助
            </p>
          </div>
        </div>

        {/* 右侧：倒计时 + 考生信息 */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 倒计时胶囊 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/60">
            <Calendar size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">
              距高考 <strong className="text-amber-600">{daysLeft}</strong> 天
            </span>
            <span className="text-[10px] text-amber-400">2026/6/7</span>
          </div>

          {/* 考生档案行 */}
          {hasProfile ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60">
              <MapPin size={12} className="text-slate-400" />
              <span className="text-xs text-slate-600 font-medium">{provinceName} · {subjectLabel}</span>
              <span className="text-slate-300">·</span>
              <TrendingUp size={12} className="text-[#0078D4]" />
              <span className="text-xs font-bold text-slate-800">{score} 分</span>
              {rank && <span className="text-[10px] text-slate-400">#{rank.toLocaleString()}</span>}
            </div>
          ) : null}

          {/* CTA */}
          <button
            onClick={openScoreModal}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95
              ${hasProfile
                ? 'bg-white border border-slate-200 text-slate-600 hover:border-[#0078D4]/40 hover:text-[#0078D4]'
                : 'bg-[#0078D4] text-white hover:bg-blue-700 shadow-blue-200'
              }`}
          >
            <Edit2 size={12} />
            {hasProfile ? '修改档案' : '填入考生信息'}
          </button>
        </div>
      </div>

      {/* 底部渐变分隔（让 Banner 与 Tabs 之间有视觉过渡） */}
      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-gray-200/80 to-transparent" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  查学校 — Browse Shell
//  点击学校名称 → 直接跳转 UniWikiPage（/wiki/uni?q=...）
// ═══════════════════════════════════════════════════════════
function SchoolBrowseView({ onEntityClick }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 px-1">
        共 <strong>{deepSchools.length}</strong> 所院校 · 点击名称跳转院校详情页
      </p>
      <div className="grid grid-cols-1 gap-2">
        {deepSchools.map((school) => (
          <button
            key={school.id}
            onClick={() => onEntityClick(school.name)}
            className="flex items-center gap-3 w-full text-left p-4 bg-white rounded-xl border border-gray-100 hover:border-[#0078D4]/30 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} className="text-[#0078D4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors truncate">
                {school.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-500">{school.province}</span>
                {school.level_tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-blue-50 text-[#0078D4] text-[10px] font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <ExternalLink size={14} className="flex-shrink-0 text-slate-300 group-hover:text-[#0078D4] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  查专业 — Browse Shell
//  点击专业名称 → 直接跳转 MajorWikiPage（/wiki/major?q=...）
// ═══════════════════════════════════════════════════════════
function MajorBrowseView({ onEntityClick }) {
  const navigate = useNavigate()

  const handleMajorClick = (major) => {
    if (onEntityClick) onEntityClick(major.name)
    navigate(`/wiki/major?q=${encodeURIComponent(major.name)}`)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 px-1">
        共 <strong>{deepMajors.length}</strong> 个专业方向 · 点击名称跳转专业详情页
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {deepMajors.map((major) => (
          <button
            key={major.id}
            onClick={() => handleMajorClick(major)}
            className="text-left p-4 bg-white rounded-xl border border-gray-100 hover:border-[#0078D4]/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-900 group-hover:text-[#0078D4] transition-colors truncate">
                  {major.name}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                    {major.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatSubjectReq(major.subject_requirement)}</span>
                </div>
                {major.job_prospects && (
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{major.job_prospects}</div>
                )}
              </div>
              <ExternalLink size={14} className="flex-shrink-0 text-slate-300 group-hover:text-[#0078D4] transition-colors mt-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  智能推荐 Shell — 包裹 RecommendationPage，注入实体点击能力
//  （RecommendationPage 目前没有 onEntityClick，这里通过
//   context 感知 + wrapper 实现 — 未来可扩展）
// ═══════════════════════════════════════════════════════════
function RecommendView({ onEntityClick: _onEntityClick }) {
  // RecommendationPage 是完整的独立页面组件，直接嵌入即可
  // onEntityClick 作为 prop 预留，待 RecommendationPage 的
  // UniCard 发出事件时，通过这里透传到 GaokaoSerpContainer
  return (
    <div className="recommend-serp-shell">
      <RecommendationPage />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  GaokaoSerpContainer — 主容器
// ═══════════════════════════════════════════════════════════
export default function GaokaoSerpContainer({ onSearchChange }) {
  const navigate = useNavigate()

  // ── 当前激活的内容视图（默认：首页）
  const [activeView, setActiveView] = useState(VIEWS.HOME)

  // ── 学校实体点击：更新搜索框 + 跳转 UniWikiPage
  const handleEntityClick = useCallback((entityName) => {
    if (onSearchChange) onSearchChange(entityName)
    navigate(`/wiki/uni?q=${encodeURIComponent(entityName)}`, { replace: false })
  }, [navigate, onSearchChange])

  // ── 仅更新搜索框（供 MajorBrowseView 使用，自己已经 navigate 到 /wiki/major）
  const handleSearchOnly = useCallback((entityName) => {
    if (onSearchChange) onSearchChange(entityName)
  }, [onSearchChange])

  // ── 专业实体点击：更新搜索框 + 跳转 MajorWikiPage
  const handleMajorClick = useCallback((entityName) => {
    if (onSearchChange) onSearchChange(entityName)
    navigate(`/wiki/major?q=${encodeURIComponent(entityName)}`, { replace: false })
  }, [navigate, onSearchChange])

  // ── 渲染当前内容插槽
  const renderContentSlot = () => {
    switch (activeView) {
      case VIEWS.HOME:
        return (
          <SerpHomeDashboard
            onSchoolClick={handleEntityClick}
            onMajorClick={handleMajorClick}
            onNavigateTab={setActiveView}
          />
        )

      case VIEWS.RECOMMEND:
        return <RecommendView onEntityClick={handleEntityClick} />

      case VIEWS.SCHOOL:
        return <SchoolBrowseView onEntityClick={handleEntityClick} />

      case VIEWS.MAJOR:
        return <MajorBrowseView onEntityClick={handleSearchOnly} />

      case VIEWS.SCORE_RANK:
        return (
          <div className="score-rank-serp-shell">
            <ScoreRankPage />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className="gaokao-serp-container bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden"
      style={{ contain: 'layout style' }}
    >
      {/* ══════════════════════════════════════════════════════
          Hero Banner — "微软高考·必赢高考"
          ══════════════════════════════════════════════════════ */}
      <HeroBanner />

      {/* ══════════════════════════════════════════════════════
          顶部常驻快捷导航区 — Persistent Quick Links Header
          ══════════════════════════════════════════════════════ */}
      <div className="serp-container__header border-b border-gray-200/60 bg-white/95 backdrop-blur-sm">
        {/* Tab 行 */}
        <div className="flex items-center gap-0.5 px-4 pt-3 pb-0 overflow-x-auto scrollbar-hide">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            const isActive = activeView === link.id

            // 外链型 Tab（招生政策、AI 报告）→ 渲染为 <a>，新标签打开，不切换 activeView
            if (link.isExternal) {
              const href = link.externalUrl ?? (window.location.origin + link.externalPath)
              return (
                <a
                  key={link.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex-shrink-0 flex flex-col items-center gap-1.5
                    px-4 pt-2.5 pb-2 rounded-t-xl
                    text-xs font-semibold transition-all duration-200 group
                    text-slate-500 hover:text-[#0078D4] hover:bg-blue-50/60"
                  title={`${link.label}（在新标签页打开）`}
                >
                  <div className="relative">
                    <Icon size={18} strokeWidth={1.5} className="text-slate-400 group-hover:text-[#0078D4] transition-colors" />
                    <ExternalLink size={8} className="absolute -top-1 -right-1.5 text-slate-300 group-hover:text-[#0078D4]/50" />
                  </div>
                  <span className="whitespace-nowrap leading-none">{link.label}</span>
                </a>
              )
            }

            // 内部型 Tab → 渲染为 <button>，切换 activeView
            return (
              <button
                key={link.id}
                onClick={() => setActiveView(link.id)}
                className={`
                  relative flex-shrink-0 flex flex-col items-center gap-1.5
                  px-4 pt-2.5 pb-2 rounded-t-xl
                  text-xs font-semibold transition-all duration-200
                  group
                  ${isActive
                    ? 'bg-blue-50/80 text-[#0078D4]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
                  }
                `}
                title={link.label}
              >
                <div className="relative">
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`transition-all ${isActive ? 'text-[#0078D4]' : 'text-slate-400 group-hover:text-slate-600'}`}
                  />
                </div>
                <span className="whitespace-nowrap leading-none">{link.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full bg-[#0078D4]"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          动态内容插槽 — Dynamic Content Slot
          ══════════════════════════════════════════════════════ */}
      <div
        key={activeView}
        className="serp-container__body px-5 py-5 min-h-[320px]
                   animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      >
        {renderContentSlot()}
      </div>
    </div>
  )
}
