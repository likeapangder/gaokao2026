import { useNavigate } from 'react-router-dom'
import { Zap, Sparkles } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useRecommendation } from '../hooks/useRecommendation.js'
import UniversityCard from '../components/UniversityCard.jsx'

const COLUMNS = [
  { key: 'stretch', label: '冲', emoji: '🚀', desc: '位次高于你 5%~15%，有挑战性' },
  { key: 'match',   label: '稳', emoji: '🎯', desc: '位次与你接近（±15%），高录取率' },
  { key: 'safety',  label: '保', emoji: '🛡️', desc: '位次低于你 15% 以上，稳妥兜底' },
]

export default function RecommendationPage() {
  const { score, rank, interests } = useCandidate()
  const navigate = useNavigate()

  // ── 核心：调用新 Hook ───────────────────────────────────────
  const { stretch, match, safety, slots, meta, isEmpty } = useRecommendation()
  const recommendations = isEmpty ? null : { stretch, match, safety }

  // 未填写成绩
  if (!score || !rank) {
    return (
      <div className="page-empty">
        <div className="empty-icon">📋</div>
        <h2>请先填写成绩</h2>
        <p>填写省份和高考成绩后，系统将为你生成个性化志愿推荐。</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          前往填写 →
        </button>
      </div>
    )
  }

  return (
    <div className="recommendation-page page-container">
      {/* 页头 */}
      <div className="page-header">
        <h1 className="page-title">志愿推荐</h1>
        <p className="page-subtitle">
          基于你的位次 <strong>#{rank.toLocaleString()}</strong>，
          从 <strong>{Object.values(meta?.rawCounts ?? {}).reduce((a, b) => a + b, 0)}</strong> 所匹配院校中，
          按 2:5:3 策略为你精选 <strong>{slots.stretch + slots.match + slots.safety}</strong> 所
          {meta?.interestApplied && (
            <span className="rec-interest-badge">
              <Sparkles size={12} />
              已按兴趣（{interests.join('·')}）加权排序
            </span>
          )}
        </p>
      </div>

      {/* 推荐列表 — 三栏 */}
      {recommendations && (
        <div className="rec-columns">
          {COLUMNS.map(({ key, label, emoji, desc }) => {
            const list = recommendations[key]
            const rawCount = meta?.rawCounts?.[key] ?? list.length
            return (
              <div key={key} className={`rec-column rec-column--${key}`}>
                <div className="rec-column__header">
                  <span className="rec-column__emoji">{emoji}</span>
                  <div>
                    <h2 className="rec-column__title">{label}</h2>
                    <p className="rec-column__desc">{desc}</p>
                  </div>
                  <div className="rec-column__counts">
                    <span className="rec-column__count">{list.length} 所</span>
                    {rawCount > list.length && (
                      <span className="rec-column__raw-count">
                        共 {rawCount} 所匹配
                      </span>
                    )}
                  </div>
                </div>

                <div className="rec-column__list">
                  {list.length === 0 ? (
                    <div className="rec-column__empty">
                      暂无符合条件的院校
                    </div>
                  ) : (
                    list.map((uni) => (
                      <UniversityCard
                        key={uni.id}
                        university={uni}
                        forcedCategory={key}
                        showAdd
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 一键填充提示 */}
      <div className="autopilot-tip">
        <Zap size={16} />
        <span>
          数据源：<strong>100 所院校</strong> · 指数平滑法（α=0.5）处理近三年位次 ·
          兴趣加权系数 +20% · 按省份志愿名额（{meta?.totalSlots} 个）2:5:3 裁剪。
          点击卡片中的"加入志愿表"按钮，将院校添加至你的志愿表。
        </span>
      </div>
    </div>
  )
}
