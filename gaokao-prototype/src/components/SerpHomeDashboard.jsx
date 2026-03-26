/**
 * SerpHomeDashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * "首页" Tab 的渲染内容 — Gaokao Vertical SERP 仪表盘
 *
 * 模块：
 *   1. Hero / 状态区 — 未填信息 → CTA 卡；已填 → 分数 + 冲稳保梯度
 *   2. 高考最新资讯   — 3 条 Bing News 风格卡片
 *   3. 热门学校 Top 5 — 横向滚动实体卡，支持 onEntityClick 跳转
 *   4. 热门专业 Top 5 — 横向滚动实体卡，支持 onEntityClick 跳转
 */

import { ChevronRight, TrendingUp, MapPin, Newspaper, ExternalLink, Zap } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { PROVINCE_NAMES } from '../data/schemas.js'
import { deepSchools, deepMajors } from '../data/deepMockData.js'

// ═══════════════════════════════════════════════════════════
//  静态数据
// ═══════════════════════════════════════════════════════════

const NEWS_ITEMS = [
  {
    id: 1,
    tag: '教育部',
    tagColor: 'bg-blue-50 text-[#0078D4]',
    date: '2026-03-25',
    title: '2026年强基计划招生简章陆续公布，36所"双一流"增加招生专业',
    summary: '部分高校强基计划增加了招生专业和计划人数，物理、化学、生物等基础学科方向扩招明显。',
    url: 'https://gaokao.chsi.com.cn/',
    thumb: 'bg-gradient-to-br from-blue-400 to-blue-600',
    thumbIcon: '🏛️',
  },
  {
    id: 2,
    tag: '政策解读',
    tagColor: 'bg-amber-50 text-amber-600',
    date: '2026-03-20',
    title: '教育部部署2026年普通高校招生工作，强调公平公正',
    summary: '教育部近日印发通知，要求各地坚持以人民为中心，全面深化改革，确保高考公平公正。',
    url: 'http://www.moe.gov.cn/jyb_xwfb/',
    thumb: 'bg-gradient-to-br from-amber-400 to-orange-500',
    thumbIcon: '📋',
  },
  {
    id: 3,
    tag: '新高考',
    tagColor: 'bg-purple-50 text-purple-600',
    date: '2026-03-15',
    title: '多省发布新高考3+1+2实施方案解读，选科覆盖率创新高',
    summary: '随着3+1+2模式全面推进，物理类考生竞争格局显著变化，历史类招生比例趋于稳定。',
    url: 'https://www.eol.cn/',
    thumb: 'bg-gradient-to-br from-purple-400 to-indigo-500',
    thumbIcon: '📐',
  },
]

// 从 deepSchools 取前 5 + 补充热度数据
const HOT_SCHOOLS = deepSchools.slice(0, 5).map((s, i) => ({
  ...s,
  hotBadge: ['🔥 最热', '📈 热门', '⭐ 推荐', '🎯 稳妥', '✨ 新晋'][i] ?? '热门',
  heatScore: [9.8, 9.5, 9.2, 8.9, 8.6][i],
}))

// 从 deepMajors 取前 5 + 补充热度数据
const HOT_MAJORS = deepMajors.slice(0, 5).map((m, i) => ({
  ...m,
  hotBadge: ['🔥 最热', '📈 上升', '💰 高薪', '🤖 新兴', '🏆 稳定'][i] ?? '热门',
  heatScore: [9.9, 9.6, 9.3, 9.0, 8.7][i],
  emoji: ['💻', '🤖', '💰', '🧬', '⚙️'][i] ?? '📚',
}))

// ═══════════════════════════════════════════════════════════
//  Section 1 — Hero / 状态区
// ═══════════════════════════════════════════════════════════
function HeroStatusSection() {
  const { score, province, rank, total, firstSubject, examType } = useCandidate()
  const { openScoreModal } = useUI()
  const provinceName = PROVINCE_NAMES[province] || ''
  const subjectLabel = firstSubject === 'history' ? '历史类' : firstSubject === 'physics' ? '物理类' : (examType === 'old' ? '理科' : '物理类')

  // ── 未填信息态
  if (!score || !province) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0078D4] via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 right-16 h-32 w-32 rounded-full bg-white/5 blur-xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
              <Zap size={11} className="text-yellow-300" />
              2026 高考志愿智能参谋
            </div>
            <h2 className="text-xl font-extrabold leading-snug">
              AI 驱动的志愿填报<br />
              <span className="text-blue-200">从这里开始</span>
            </h2>
            <p className="mt-2 text-sm text-blue-100/80 max-w-xs">
              填入省份与成绩，即可解锁 AI 智能推荐、冲稳保分析与定制报告
            </p>
          </div>
          <button
            onClick={openScoreModal}
            className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0078D4] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            👉 填入考生信息，解锁智能推荐
          </button>
        </div>
      </div>
    )
  }

  // ── 已填信息态
  const percentile = total ? ((1 - rank / total) * 100).toFixed(1) : null
  const tiers = [
    { label: '冲', pct: 20, color: 'bg-red-500',   count: Math.round(96 * 0.20) },
    { label: '稳', pct: 50, color: 'bg-[#0078D4]', count: Math.round(96 * 0.50) },
    { label: '保', pct: 30, color: 'bg-slate-400',  count: Math.round(96 * 0.30) },
  ]

  return (
    <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* 左：分数卡 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">考生档案已加载</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-black text-slate-900">{score}</span>
            <span className="text-sm text-slate-500 font-medium">分</span>
            <span className="text-slate-300">·</span>
            <span className="text-xl font-bold text-[#0078D4]">#{rank?.toLocaleString()}</span>
            <span className="text-sm text-slate-500 font-medium">位</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-slate-400" />
              {provinceName} · {subjectLabel}
            </span>
            {percentile && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <TrendingUp size={11} className="text-green-500" />
                  超过全省 <strong className="text-slate-700">{percentile}%</strong> 考生
                </span>
              </>
            )}
          </div>
        </div>

        {/* 右：冲稳保梯度图 */}
        <div className="flex-shrink-0 w-full sm:w-48">
          <div className="text-[11px] font-semibold text-slate-500 mb-2">志愿梯度分布 · 共 96 个</div>
          {/* 色块条 */}
          <div className="flex h-4 w-full rounded-full overflow-hidden gap-px">
            {tiers.map(t => (
              <div
                key={t.label}
                className={`${t.color} flex items-center justify-center`}
                style={{ width: `${t.pct}%` }}
              />
            ))}
          </div>
          {/* 图例 */}
          <div className="mt-2 flex items-center justify-between">
            {tiers.map(t => (
              <div key={t.label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-sm ${t.color}`} />
                <span className="text-[10px] text-slate-600 font-medium">
                  {t.label} <strong>{t.count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Section 2 — 高考最新资讯
// ═══════════════════════════════════════════════════════════
function NewsWidget() {
  return (
    <div>
      <SectionHeader
        icon={<Newspaper size={15} className="text-[#0078D4]" />}
        title="高考最新资讯"
        subtitle="Bing News · 实时更新"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        {NEWS_ITEMS.map(item => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md hover:border-[#0078D4]/20 transition-all overflow-hidden"
          >
            {/* 缩略图色块 */}
            <div className={`${item.thumb} h-20 flex items-center justify-center text-3xl flex-shrink-0`}>
              {item.thumbIcon}
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="text-[10px] text-slate-400">{item.date}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#0078D4] transition-colors">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-auto">
                {item.summary}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#0078D4] font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                阅读全文 <ExternalLink size={9} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Section 3 — 热门学校 Top 5
// ═══════════════════════════════════════════════════════════
function HotSchoolsSection({ onSchoolClick, onNavigateTab }) {
  return (
    <div>
      <SectionHeader
        icon={<span className="text-sm">🏛️</span>}
        title="热门学校 Top 5"
        subtitle="综合热度排行"
        action={
          <button
            onClick={() => onNavigateTab('school')}
            className="flex items-center gap-1 text-[11px] text-[#0078D4] font-semibold hover:underline"
          >
            查看全部 <ChevronRight size={12} />
          </button>
        }
      />
      <div className="mt-3 space-y-2">
        {HOT_SCHOOLS.map((school, idx) => (
          <button
            key={school.id}
            onClick={() => onSchoolClick(school.name)}
            className="group w-full flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md hover:border-[#0078D4]/25 transition-all text-left"
          >
            {/* 排名 */}
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm
              ${idx === 0 ? 'bg-red-500 text-white' : idx === 1 ? 'bg-orange-400 text-white' : idx === 2 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {idx + 1}
            </span>
            {/* 图标 */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-base">
              🏛️
            </div>
            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0078D4] transition-colors">
                {school.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{school.province}</div>
            </div>
            {/* 热度徽章 + 热度条 */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 hidden sm:inline">
                {school.hotBadge}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0078D4] to-blue-400"
                    style={{ width: `${(school.heatScore / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[#0078D4] w-6 text-right">{school.heatScore}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  Section 4 — 热门专业 Top 5
// ═══════════════════════════════════════════════════════════
function HotMajorsSection({ onMajorClick, onNavigateTab }) {
  return (
    <div>
      <SectionHeader
        icon={<span className="text-sm">🔬</span>}
        title="热门专业 Top 5"
        subtitle="就业 · 薪资 · 热度综合"
        action={
          <button
            onClick={() => onNavigateTab('major')}
            className="flex items-center gap-1 text-[11px] text-[#0078D4] font-semibold hover:underline"
          >
            查看全部 <ChevronRight size={12} />
          </button>
        }
      />
      <div className="mt-3 space-y-2">
        {HOT_MAJORS.map((major, idx) => (
          <button
            key={major.id}
            onClick={() => onMajorClick(major.name)}
            className="group w-full flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left"
          >
            {/* 排名 */}
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm
              ${idx === 0 ? 'bg-red-500 text-white' : idx === 1 ? 'bg-orange-400 text-white' : idx === 2 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {idx + 1}
            </span>
            {/* emoji 图标 */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-base">
              {major.emoji}
            </div>
            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {major.name}
              </div>
              <div className="text-[10px] text-indigo-500 font-medium mt-0.5">{major.category}</div>
            </div>
            {/* 热度徽章 + 热度条 */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hidden sm:inline">
                {major.hotBadge}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
                    style={{ width: `${(major.heatScore / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 w-6 text-right">{major.heatScore}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  通用 Section Header
// ═══════════════════════════════════════════════════════════
function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-bold text-slate-800">{title}</span>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">{subtitle}</span>
        )}
      </div>
      {action}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  SerpHomeDashboard — 主导出
// ═══════════════════════════════════════════════════════════
export default function SerpHomeDashboard({ onSchoolClick, onMajorClick, onNavigateTab }) {
  return (
    <div className="space-y-6">
      {/* 1. Hero / 状态区 */}
      <HeroStatusSection />

      {/* 2. 高考最新资讯 */}
      <NewsWidget />

      {/* 3 + 4. 热门实体探索 — 两列并排 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <HotSchoolsSection onSchoolClick={onSchoolClick} onNavigateTab={onNavigateTab} />
        <HotMajorsSection  onMajorClick={onMajorClick}  onNavigateTab={onNavigateTab} />
      </div>
    </div>
  )
}
