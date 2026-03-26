import { useState, useMemo } from 'react'
import {
  Zap, Sparkles, Building2, BookOpen,
  ChevronDown, ChevronUp, ExternalLink,
  TrendingDown, Plus, Check,
} from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { useRecommendation } from '../hooks/useRecommendation.js'
import {
  groupByUniversity,
  groupByMajor,
  isPreferencesEmpty,
  exponentialSmoothing,
} from '../logic/autoPilot.js'

// ─── Tier definitions ─────────────────────────────────────────
const TIERS = [
  { key: 'stretch', label: '冲', emoji: '🚀', color: 'red',   gradient: 'from-red-500 to-orange-400',  bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500'   },
  { key: 'match',   label: '稳', emoji: '🎯', color: 'blue',  gradient: 'from-blue-500 to-cyan-400',   bg: 'bg-blue-50',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-500'  },
  { key: 'safety',  label: '保', emoji: '🛡️', color: 'green', gradient: 'from-green-500 to-emerald-400', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
]

// ─── Tab definitions ──────────────────────────────────────────
const TABS = [
  { id: 'university', label: '院校推荐', icon: Building2 },
  { id: 'major',      label: '专业推荐', icon: BookOpen  },
]

// ═══════════════════════════════════════════════════════════════
//  Upsell Banner — Task 4
// ═══════════════════════════════════════════════════════════════
function UpsellBanner() {
  const { openScoreModal } = useUI()

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 backdrop-blur-sm">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
          <Sparkles size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-bold text-slate-800">
            当前为基础版推荐
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            完善地域与学费等偏好，即可解锁精确到个人的
            <span className="font-bold text-blue-600"> AI 定制志愿报告</span>
          </p>
        </div>
        <button
          onClick={() => openScoreModal({ expanded: true })}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold
                     hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md
                     flex items-center gap-2 flex-shrink-0"
        >
          👉 去完善偏好
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  University Card (inline — for University View)
// ═══════════════════════════════════════════════════════════════
function UniCard({ uni, tier }) {
  const { rank, volunteers, addVolunteer } = useCandidate()
  const [expanded, setExpanded] = useState(false)
  const inVolunteers = volunteers.some((v) => v.university.id === uni.id)

  const history = [...uni.rank_history].sort((a, b) => a.year - b.year)
  const smoothed = uni.smoothedRank ?? exponentialSmoothing(uni.rank_history)
  const majors = uni.matchedMajors ?? uni.majorGroups ?? []

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 text-sm">{uni.name}</h4>
            {uni.level_tags?.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{t}</span>
            ))}
            {uni.tags?.filter((t) => ['985', '211', '双一流'].includes(t)).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>{uni.province}</span>
            <span>·</span>
            <span>{uni.type}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <TrendingDown size={11} />
              均值约 {smoothed.toLocaleString()} 名
            </span>
          </div>
          {/* Rank mini-chart */}
          <div className="flex gap-3 mt-2">
            {history.map((h) => (
              <span key={h.year} className="text-[10px] text-slate-400">
                {h.year}: <strong className="text-slate-600">{h.minRank.toLocaleString()}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {inVolunteers ? (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-600">
              <Check size={12} /> 已加入
            </span>
          ) : (
            <button
              onClick={() => addVolunteer(uni, null, tier.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={12} /> 加入
            </button>
          )}
        </div>
      </div>

      {/* Expandable Majors */}
      {majors.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/80 border-t border-slate-100 hover:bg-slate-100 transition-colors"
          >
            <span>匹配专业组 ({majors.length})</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <div className="px-4 pb-3 pt-1 border-t border-slate-100 space-y-1">
              {majors.map((mg) => (
                <div key={mg.groupCode} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-semibold text-slate-700">{mg.groupName}</span>
                  {mg.subjects?.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      要求: {mg.subjects.join('+')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Major Card (for Major View)
// ═══════════════════════════════════════════════════════════════
function MajorCard({ majorGroup }) {
  const [expanded, setExpanded] = useState(majorGroup.universities.length <= 5)

  const shown = expanded ? majorGroup.universities : majorGroup.universities.slice(0, 3)

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <BookOpen size={16} className="text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{majorGroup.majorName}</h4>
            <span className="text-[10px] text-slate-500">{majorGroup.universities.length} 所院校可选</span>
          </div>
        </div>
      </div>

      {/* University list */}
      <div className="border-t border-slate-100">
        {shown.map((uniEntry) => (
          <div
            key={`${uniEntry.uniId}-${uniEntry.groupCode}`}
            className="px-4 py-2.5 flex items-center justify-between border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800">{uniEntry.uniName}</span>
                {uniEntry.level_tags?.slice(0, 1).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-600">{t}</span>
                ))}
              </div>
              <span className="text-[10px] text-slate-400">{uniEntry.province} · {uniEntry.type}</span>
            </div>
            <span className="text-xs font-mono text-slate-500 flex-shrink-0">
              ≈ {uniEntry.smoothedRank.toLocaleString()} 名
            </span>
          </div>
        ))}
        {!expanded && majorGroup.universities.length > 3 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            展开全部 {majorGroup.universities.length} 所院校
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════
export default function RecommendationPage() {
  const { score, rank, preferences } = useCandidate()
  const { openScoreModal } = useUI()
  const [activeTab, setActiveTab] = useState('university')

  // ── Data ──
  const { stretch, match, safety, slots, meta, isEmpty } = useRecommendation()

  // ── Derived aggregations ──
  const uniView = useMemo(() => {
    if (isEmpty) return null
    return {
      stretch: groupByUniversity(stretch),
      match:   groupByUniversity(match),
      safety:  groupByUniversity(safety),
    }
  }, [stretch, match, safety, isEmpty])

  const majorView = useMemo(() => {
    if (isEmpty) return null
    return {
      stretch: groupByMajor(stretch),
      match:   groupByMajor(match),
      safety:  groupByMajor(safety),
    }
  }, [stretch, match, safety, isEmpty])

  const showUpsell = isPreferencesEmpty(preferences)

  // ── Empty state ──
  if (!score || !rank) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">请先填写成绩</h2>
        <p className="text-slate-600 mb-6">填写省份和高考成绩后，系统将为你生成个性化志愿推荐。</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          onClick={() => openScoreModal()}
        >
          填写考生信息 →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">志愿推荐</h1>
        <p className="text-sm text-slate-600">
          基于你的位次 <strong className="text-blue-600">#{rank.toLocaleString()}</strong>，
          从 <strong>{Object.values(meta?.rawCounts ?? {}).reduce((a, b) => a + b, 0)}</strong> 所匹配院校中，
          按 2:5:3 策略精选 <strong>{slots.stretch + slots.match + slots.safety}</strong> 所
          {meta?.interestApplied && (
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
              <Sparkles size={10} />
              偏好加权
            </span>
          )}
        </p>
      </div>

      {/* ── Task 4: Upsell Banner ── */}
      {showUpsell && <UpsellBanner />}

      {/* ══════════════════════════════════════════════════════ */}
      {/* Task 2: Fluent Segmented Control (Tab Switcher)      */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm p-2 flex gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* Task 3: Dual View Rendering                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'university' && uniView && (
        <div className="space-y-8">
          {TIERS.map((tier) => {
            const list = uniView[tier.key]
            return (
              <section key={tier.key}>
                {/* Tier Header */}
                <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl ${tier.bg} ${tier.border} border`}>
                  <span className="text-2xl">{tier.emoji}</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-extrabold text-slate-900">{tier.label}档院校</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tier.key === 'stretch' && '位次高于你 5%~15%，有挑战性'}
                      {tier.key === 'match'   && '位次与你接近（±15%），高录取率'}
                      {tier.key === 'safety'  && '位次低于你 15% 以上，稳妥兜底'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier.badge}`}>
                    {list.length} 所
                  </span>
                </div>

                {/* Cards */}
                {list.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">暂无符合条件的院校</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {list.map((uni) => (
                      <UniCard key={uni.id} uni={uni} tier={tier} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {activeTab === 'major' && majorView && (
        <div className="space-y-8">
          {TIERS.map((tier) => {
            const list = majorView[tier.key]
            return (
              <section key={tier.key}>
                {/* Tier Header */}
                <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl ${tier.bg} ${tier.border} border`}>
                  <span className="text-2xl">{tier.emoji}</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-extrabold text-slate-900">{tier.label}档专业</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tier.key === 'stretch' && '冲刺区 — 有一定挑战'}
                      {tier.key === 'match'   && '匹配区 — 录取概率高'}
                      {tier.key === 'safety'  && '保底区 — 安全兜底'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier.badge}`}>
                    {list.length} 个专业
                  </span>
                </div>

                {/* Cards */}
                {list.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">暂无符合条件的专业</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {list.map((mg) => (
                      <MajorCard key={mg.majorCode} majorGroup={mg} />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {/* ── Footer Tip ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        <Zap size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <span>
          数据源：<strong>100 所院校</strong> · 指数平滑法（α=0.5）处理近三年位次 ·
          兴趣加权系数 +20% · 按省份志愿名额（{meta?.totalSlots} 个）2:5:3 裁剪。
          点击卡片中的"加入"按钮，将院校添加至你的志愿表。
        </span>
      </div>
    </div>
  )
}
