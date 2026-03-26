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

import { useState, useCallback, useEffect, useRef } from 'react'
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
  ClipboardList,
  Loader2,
  CheckCircle2,
  Brain,
} from 'lucide-react'
// Note: FileText, Newspaper are used by QUICK_LINKS icon definitions

import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { PROVINCE_NAMES } from '../data/schemas.js'

// ─── 子视图懒导入（直接引用，已存在的页面/组件）
import RecommendationPage from '../pages/RecommendationPage.jsx'
import ScoreRankPage from '../pages/ScoreRankPage.jsx'
import SerpHomeDashboard from './SerpHomeDashboard.jsx'
import VolunteerSheetPage from '../pages/VolunteerSheetPage.jsx'
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
  SHEET:      'sheet',      // 我的志愿表（购物车）
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
    isExternal: false,
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
  {
    id: VIEWS.SHEET,
    label: '我的志愿表',
    labelEn: 'My Sheet',
    icon: ClipboardList,
    isExternal: false,
    isCart: true,  // 特殊标识：渲染购物车角标
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
//  AI 报告 Agentic Loader — 在卡片内原地播放，完成后跳转
// ═══════════════════════════════════════════════════════════
const AI_REPORT_STEPS = [
  { icon: '🧠', label: 'PROFILE',  text: '正在提取考生档案与多维偏好矩阵...' },
  { icon: '🏛️', label: 'SCHOOLS',  text: '检索目标院校历年录取与学费数据...' },
  { icon: '⚙️', label: 'ENGINE',   text: '运用专家引擎组装【冲稳保】策略解析...' },
  { icon: '📄', label: 'RENDER',   text: '正在排版文档并生成可视化图表...' },
]

function AIReportAgenticLoader({ volunteers, onDone }) {
  const [currentStep, setCurrentStep] = useState(0)
  const hasSheet = Array.isArray(volunteers) && volunteers.length > 0

  const steps = hasSheet
    ? [
        ...AI_REPORT_STEPS.slice(0, 3),
        { icon: '📋', label: 'SHEET', text: `正在读取 ${volunteers.length} 条志愿数据，执行全景阵型诊断...` },
        AI_REPORT_STEPS[3],
      ]
    : AI_REPORT_STEPS

  useEffect(() => {
    if (currentStep < steps.length) {
      const t = setTimeout(() => setCurrentStep(s => s + 1), 600)
      return () => clearTimeout(t)
    } else {
      // 所有步骤完成 → 短暂停顿再回调
      const t = setTimeout(onDone, 400)
      return () => clearTimeout(t)
    }
  }, [currentStep, steps.length, onDone])

  const progressPct = Math.min(100, (currentStep / steps.length) * 100)

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[52vh] overflow-hidden select-none">

      {/* 背景光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[420px] h-[420px] rounded-full
          bg-gradient-radial from-blue-100/70 via-indigo-50/30 to-transparent
          blur-3xl animate-pulse" />
        <div className="absolute bottom-8 right-8 w-40 h-40 rounded-full
          bg-gradient-radial from-indigo-200/40 to-transparent blur-2xl opacity-50"
          style={{ animation: 'pulse 3.5s ease-in-out infinite 1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* 品牌标识行 */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full
            bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[#0078D4] animate-pulse" />
            <span className="text-[11px] font-black tracking-[0.16em] text-slate-500 uppercase">
              Bing AI · 正在生成报告
            </span>
          </div>
        </div>

        {/* 轨道动画环 */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-20 h-20">
            <svg className="absolute inset-0 w-full h-full animate-spin"
              style={{ animationDuration: '2.8s' }} viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none"
                stroke="url(#serpRingGrad)" strokeWidth="2.5"
                strokeDasharray="160 66" strokeLinecap="round" />
              <defs>
                <linearGradient id="serpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0078D4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>
            <svg className="absolute inset-2.5 w-[60px] h-[60px]"
              style={{ animation: 'spin 5s linear infinite reverse' }} viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none"
                stroke="#e0e7ff" strokeWidth="1.5"
                strokeDasharray="60 104" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-md shadow-blue-100/60
                flex items-center justify-center border border-slate-100/80">
                <Brain size={20} className="text-[#0078D4]" />
              </div>
            </div>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
            AI 正在生成你的专属报告
          </h3>
          <p className="text-xs text-slate-500">
            {hasSheet
              ? <><span className="font-bold text-indigo-600">{volunteers.length} 条</span> 志愿数据 · 全景诊断已激活</>
              : '综合成绩、位次与偏好，定制你的报考方案'}
          </p>
        </div>

        {/* 步骤列表 */}
        <div className="bg-white/75 backdrop-blur-sm border border-slate-200/60
          rounded-2xl shadow-sm overflow-hidden mb-4">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index
            const isCurrent   = currentStep === index
            const isSheetStep = hasSheet && step.label === 'SHEET'

            return (
              <div
                key={index}
                className={`flex items-center gap-3.5 px-4 py-3 border-b border-slate-100/70 last:border-0
                  transition-all duration-400
                  ${isCurrent
                    ? isSheetStep ? 'bg-indigo-50/70' : 'bg-blue-50/50'
                    : isCompleted ? 'bg-white/30' : 'bg-white/10'
                  }`}
              >
                {/* 状态图标 */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm
                  transition-all duration-300
                  ${isCompleted
                    ? isSheetStep ? 'bg-indigo-100' : 'bg-green-100'
                    : isCurrent
                      ? isSheetStep ? 'bg-indigo-100' : 'bg-blue-100'
                      : 'bg-slate-100'
                  }`}>
                  {isCompleted
                    ? <CheckCircle2 size={14} className={isSheetStep ? 'text-indigo-500' : 'text-green-500'} />
                    : isCurrent
                      ? <Loader2 size={14} className={`animate-spin ${isSheetStep ? 'text-indigo-500' : 'text-[#0078D4]'}`} />
                      : <span className="text-[12px] leading-none opacity-50">{step.icon}</span>
                  }
                </div>

                {/* 文字 */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold leading-snug truncate transition-colors duration-300
                    ${isCompleted
                      ? isSheetStep ? 'text-indigo-600' : 'text-green-600'
                      : isCurrent
                        ? isSheetStep ? 'text-indigo-700' : 'text-[#0078D4]'
                        : 'text-slate-400'
                    }`}>
                    {step.text}
                  </div>
                  {isCurrent && (
                    <div className="text-[9px] font-bold tracking-widest uppercase text-slate-400 animate-pulse mt-0.5">
                      Processing...
                    </div>
                  )}
                </div>

                {/* 标签胶囊 */}
                <div className={`flex-shrink-0 text-[8px] font-black tracking-[0.15em] uppercase
                  px-1.5 py-0.5 rounded-full transition-all duration-300
                  ${isCompleted
                    ? isSheetStep ? 'bg-indigo-100 text-indigo-500' : 'bg-green-100 text-green-500'
                    : isCurrent
                      ? isSheetStep ? 'bg-indigo-100 text-indigo-400' : 'bg-blue-100 text-[#0078D4]'
                      : 'bg-slate-100 text-slate-300'
                  }`}>
                  {isCompleted ? 'OK' : isCurrent ? 'RUN' : step.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* 进度条 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-black tabular-nums text-slate-500">
              {Math.round(progressPct)}<span className="text-slate-400 font-normal">%</span>
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-600 ease-out relative overflow-hidden"
              style={{
                width: `${progressPct}%`,
                background: hasSheet
                  ? 'linear-gradient(90deg, #0078D4, #818cf8)'
                  : 'linear-gradient(90deg, #0078D4, #00BCF2)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                translate-x-[-100%]"
                style={{ animation: 'shimmerSerpLoader 1.4s ease-in-out infinite' }} />
            </div>
          </div>
        </div>

        {/* 志愿表激活徽章 */}
        {hasSheet && (
          <div className="mt-4 flex items-center justify-center gap-2
            px-4 py-2 rounded-xl
            bg-gradient-to-r from-indigo-50 to-purple-50
            border border-indigo-200/60">
            <ClipboardList size={11} className="text-indigo-500" />
            <span className="text-[11px] font-bold text-indigo-600">志愿表深度诊断已激活</span>
            <span className="text-[10px] text-indigo-400">· {volunteers.length} 条真实数据</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmerSerpLoader {
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
  const { volunteerSheet, volunteers } = useCandidate()
  const sheetCount = volunteerSheet?.length ?? 0

  // ── 当前激活的内容视图（默认：首页）
  const [activeView, setActiveView] = useState(VIEWS.HOME)

  // ── AI 报告 loader 状态
  const [showAILoader, setShowAILoader] = useState(false)
  const aiReportUrlRef = useRef(null)

  // ── 点击 AI 报告：先播放 loader，完成后新标签跳转
  const handleAIReportClick = useCallback(() => {
    const url = window.location.origin + '/ai-report'
    aiReportUrlRef.current = url
    setActiveView(VIEWS.AI_REPORT)
    setShowAILoader(true)
  }, [])

  // ── Loader 完成回调：打开新标签，回到首页
  const handleLoaderDone = useCallback(() => {
    setShowAILoader(false)
    if (aiReportUrlRef.current) {
      window.open(aiReportUrlRef.current, '_blank', 'noopener,noreferrer')
    }
    setActiveView(VIEWS.HOME)
  }, [])

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

      case VIEWS.AI_REPORT:
        return (
          <AIReportAgenticLoader
            volunteers={volunteers}
            onDone={handleLoaderDone}
          />
        )

      case VIEWS.SHEET:
        return <VolunteerSheetPage embedded />

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

            // 购物车型 Tab（我的志愿表）→ 有 ml-auto 推到最右侧 + 角标
            if (link.isCart) {
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveView(link.id)}
                  className={`
                    relative flex-shrink-0 flex flex-col items-center gap-1.5
                    px-4 pt-2.5 pb-2 rounded-t-xl ml-auto
                    text-xs font-semibold transition-all duration-200 group
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
                    {/* 数字角标 */}
                    {sheetCount > 0 && (
                      <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1
                        flex items-center justify-center
                        rounded-full bg-[#0078D4] text-white text-[9px] font-black leading-none
                        shadow-sm shadow-blue-300/60">
                        {sheetCount > 99 ? '99+' : sheetCount}
                      </span>
                    )}
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
            }

            // 内部型 Tab → 渲染为 <button>，切换 activeView
            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.id === VIEWS.AI_REPORT) {
                    handleAIReportClick()
                  } else {
                    setActiveView(link.id)
                  }
                }}
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
