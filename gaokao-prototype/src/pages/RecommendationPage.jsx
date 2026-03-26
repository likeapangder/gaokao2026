import { useState, useMemo } from 'react'
import {
  Zap, Sparkles, Building2, BookOpen,
  ChevronDown, ChevronUp, Check,
  TrendingDown,
} from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { useRecommendation } from '../hooks/useRecommendation.js'
import {
  groupByUniversity,
  isPreferencesEmpty,
  exponentialSmoothing,
} from '../logic/autoPilot.js'
import AddToSheetButton from '../components/AddToSheetButton.jsx'

// ─── Tier definitions ─────────────────────────────────────────
const TIERS = [
  { key: 'stretch', label: '冲', emoji: '🚀', color: 'red',   gradient: 'from-red-500 to-orange-400',  bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',   probBg: 'bg-red-500',   probRange: [45, 65] },
  { key: 'match',   label: '稳', emoji: '🎯', color: 'blue',  gradient: 'from-blue-500 to-cyan-400',   bg: 'bg-blue-50',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-500',  probBg: 'bg-blue-500',  probRange: [65, 85] },
  { key: 'safety',  label: '保', emoji: '🛡️', color: 'green', gradient: 'from-green-500 to-emerald-400', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', probBg: 'bg-green-500', probRange: [85, 97] },
]

// ─── Tab definitions ──────────────────────────────────────────
const TABS = [
  { id: 'university', label: '院校推荐', icon: Building2 },
  { id: 'major',      label: '专业推荐', icon: BookOpen  },
]

// ─── 估算录取概率（基于 delta）────────────────────────────────
function estimateProb(smoothedRank, candidateRank, tier) {
  if (!candidateRank || !smoothedRank) return tier.probRange[0]
  const delta = (smoothedRank - candidateRank) / candidateRank
  // delta > 0 → 院校位次更大（更容易进）→ 概率高
  // delta < 0 → 院校位次更小（更难进）→ 概率低
  const [lo, hi] = tier.probRange
  const mid = (lo + hi) / 2
  // 将 delta 从 [-0.15, +0.50] 线性映射到 [lo, hi]
  const clamped = Math.min(0.5, Math.max(-0.15, delta))
  const t = (clamped + 0.15) / 0.65
  return Math.round(lo + t * (hi - lo))
}

// ─── 专业视图扁平化：将 bucket 展开为"院校×专业组"平铺列表 ──
function flattenMajorSlots(bucket) {
  const result = []
  for (const uni of bucket) {
    const groups = uni.majorGroups ?? []
    if (groups.length === 0) {
      result.push({ uni, group: null })
    } else {
      for (const mg of groups) {
        result.push({ uni, group: mg })
      }
    }
  }
  return result
}

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
  const [expanded, setExpanded] = useState(false)

  const history = [...uni.rank_history].sort((a, b) => a.year - b.year)
  const smoothed = uni.smoothedRank ?? exponentialSmoothing(uni.rank_history)
  const majors = uni.matchedMajors ?? uni.majorGroups ?? []

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Header — 院校信息，无加入按钮 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
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
        </div>
      </div>

      {/* Expandable Majors — 展开后每行含"加志愿"按钮 */}
      {majors.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/80 border-t border-slate-100 hover:bg-slate-100 transition-colors"
          >
            <span>
              匹配专业组 ({majors.length})
              {!expanded && (
                <span className="ml-2 text-[#0078D4]">· 展开后可加入志愿表</span>
              )}
            </span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {majors.map((mg) => (
                <div
                  key={mg.groupCode}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-700 block truncate">{mg.groupName}</span>
                    {mg.subjects?.length > 0 && (
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        选科要求: {mg.subjects.join(' + ')}
                      </span>
                    )}
                  </div>
                  <AddToSheetButton
                    universityId={uni.id}
                    universityName={uni.name}
                    majorId={mg.groupCode}
                    majorName={mg.groupName}
                    province={uni.province}
                    type={uni.type}
                    category={tier.key}
                    size="xs"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 无专业数据时：在院校行提供直接加入入口 */}
      {majors.length === 0 && (
        <div className="px-4 pb-3 border-t border-slate-100 pt-2 flex justify-end">
          <AddToSheetButton
            universityId={uni.id}
            universityName={uni.name}
            majorId={null}
            majorName={null}
            province={uni.province}
            type={uni.type}
            category={tier.key}
            size="xs"
          />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Major Slot Card — 参照图设计
//  每张卡片 = 一个院校专业组（院校 + 专业 + 招生信息 + 操作按钮）
// ═══════════════════════════════════════════════════════════════
function MajorSlotCard({ uni, group, tier, candidateRank }) {
  const prob = estimateProb(uni.smoothedRank, candidateRank, tier)

  // 按档位决定概率方块颜色
  const probBgClass =
    tier.key === 'stretch' ? 'bg-red-500' :
    tier.key === 'match'   ? 'bg-[#0078D4]' :
                             'bg-green-500'

  // 院校标签文字
  const uniMeta = [
    uni.code ? `院校代码 ${uni.code}` : null,
    uni.type ?? null,
    uni.tags?.includes('公办') ? '公办' : uni.tags?.includes('民办') ? '民办' : null,
    ...( uni.level_tags?.slice(0, 2) ?? [] ),
  ].filter(Boolean).join(' · ')

  const groupLabel = group?.groupCode ? `[专业组 ${String(group.groupCode).padStart(2, '0')}]` : ''
  const majorName  = group?.groupName ?? '（全部专业）'
  const subjects   = group?.subjects ?? []

  // Mock 招生信息（真实数据中从 admissionLines/enrollmentPlan 取）
  const mockPlanCount  = Math.round(6 + Math.random() * 30)
  const mockMinScore   = Math.round(uni.smoothedRank ? 520 + Math.random() * 80 : 0)
  const mockMinRank    = uni.smoothedRank ? uni.smoothedRank + Math.round(Math.random() * 200 - 100) : null
  const tuition        = '4年/6500元'

  const subjectStr = subjects.length > 0
    ? subjects.join('，')
    : '不限'

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex gap-0">

        {/* ── 左侧概率徽章 ── */}
        <div className={`flex-shrink-0 w-14 flex flex-col items-center justify-center py-5 gap-1 ${probBgClass}`}>
          <span className="text-white font-black text-base leading-none tabular-nums">{prob}%</span>
          <span className="text-white/90 text-[10px] font-bold leading-none">{tier.label}</span>
        </div>

        {/* ── 主体内容 ── */}
        <div className="flex-1 min-w-0 px-4 py-3">

          {/* 院校标题行 */}
          <div className="text-sm font-bold text-slate-900 leading-snug">
            <span className="text-slate-500 font-medium">{groupLabel} </span>
            {uni.name}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{uniMeta}</div>

          {/* 专业名 */}
          <div className="mt-2.5 mb-1">
            <span className="text-[15px] font-extrabold text-slate-900 leading-tight">{majorName}</span>
          </div>

          {/* 属性网格：3列 × 2行 */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2">
            <div className="text-[11px] text-slate-400">
              专业代码 <span className="text-slate-600 font-medium">{group?.groupCode ?? '—'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              学制学费 <span className="text-slate-700 font-bold">{tuition}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              24年历史最低分 <span className="text-slate-700 font-bold">{mockMinScore || '—'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              25年计划 <span className="text-slate-700 font-bold">{mockPlanCount} 人</span>
            </div>
            <div className="text-[11px] text-slate-400">
              选科要求 <span className="text-slate-700 font-bold">{subjectStr}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              24年最低位次 <span className="text-slate-700 font-bold">{mockMinRank ? `${mockMinRank.toLocaleString()}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* ── 右侧操作区 ── */}
        <div className="flex-shrink-0 flex flex-col items-stretch gap-2 px-3 py-4 border-l border-slate-100 min-w-[108px]">
          <AddToSheetButton
            universityId={uni.id}
            universityName={uni.name}
            majorId={group?.groupCode ? String(group.groupCode) : null}
            majorName={group?.groupName ?? null}
            province={uni.province}
            type={uni.type}
            category={tier.key}
            size="sm"
          />
          <button className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all whitespace-nowrap">
            组内其他专业
          </button>
        </div>

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

  // ── 院校视图 ──
  const uniView = useMemo(() => {
    if (isEmpty) return null
    return {
      stretch: groupByUniversity(stretch),
      match:   groupByUniversity(match),
      safety:  groupByUniversity(safety),
    }
  }, [stretch, match, safety, isEmpty])

  // ── 专业视图：扁平化为"院校×专业组"卡片列表 ──
  const majorView = useMemo(() => {
    if (isEmpty) return null
    return {
      stretch: flattenMajorSlots(stretch),
      match:   flattenMajorSlots(match),
      safety:  flattenMajorSlots(safety),
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
                      {tier.key === 'stretch' && '冲刺区 — 有一定挑战，录取概率约 45%~65%'}
                      {tier.key === 'match'   && '匹配区 — 录取概率高，约 65%~85%'}
                      {tier.key === 'safety'  && '保底区 — 安全兜底，录取概率 > 85%'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier.badge}`}>
                    {list.length} 个志愿
                  </span>
                </div>

                {/* Cards — 单列，每张卡片 = 院校×专业组 */}
                {list.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">暂无符合条件的专业</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {list.map(({ uni, group }, idx) => (
                      <MajorSlotCard
                        key={`${uni.id}-${group?.groupCode ?? 'none'}-${idx}`}
                        uni={uni}
                        group={group}
                        tier={tier}
                        candidateRank={rank}
                      />
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
