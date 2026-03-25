import { useNavigate } from 'react-router-dom'
import { Plus, Check, ExternalLink, TrendingDown } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { classifyUniversity, exponentialSmoothing } from '../logic/autoPilot.js'

const CATEGORY_MAP = {
  stretch: { label: '冲', color: 'var(--color-stretch)' },
  match:   { label: '稳', color: 'var(--color-match)' },
  safety:  { label: '保', color: 'var(--color-safety)' },
}

/**
 * 大学卡片组件
 * @param {{ university: import('../data/universities').University, showAdd?: boolean }} props
 */
export default function UniversityCard({ university, showAdd = true, forcedCategory }) {
  const { rank, volunteers, addVolunteer } = useCandidate()
  const navigate = useNavigate()

  const category = forcedCategory ?? (rank ? classifyUniversity(rank, university.rank_history) : 'match')
  const catInfo = CATEGORY_MAP[category] ?? CATEGORY_MAP.match

  // 近3年最低位次，从旧到新
  const history = [...university.rank_history].sort((a, b) => a.year - b.year)
  const smoothedRank = exponentialSmoothing(university.rank_history)

  // 是否已在志愿表中
  const inVolunteers = volunteers.some((v) => v.university.id === university.id)

  function handleAdd() {
    addVolunteer(university, null, category)
    navigate('/volunteers')
  }

  return (
    <div className="uni-card">
      {/* 卡片顶部：院校名 + 分类标签 */}
      <div className="uni-card__header">
        <div>
          <h3 className="uni-card__name">{university.name}</h3>
          <div className="uni-card__tags">
            {university.level_tags.map((t) => (
              <span key={t} className="tag tag--level">{t}</span>
            ))}
            {university.tags.filter((t) => ['985', '211', '双一流'].includes(t)).map((t) => (
              <span key={t} className="tag tag--badge">{t}</span>
            ))}
          </div>
        </div>
        <span
          className="uni-card__category"
          style={{ color: catInfo.color, borderColor: catInfo.color }}
        >
          {catInfo.label}
        </span>
      </div>

      {/* 近3年最低位次趋势 */}
      <div className="uni-card__rank-history">
        <TrendingDown size={13} />
        <span>近三年最低录取位次：</span>
        {history.map((h) => (
          <span key={h.year} className="rank-year">
            {h.year}: <strong>{h.minRank.toLocaleString()}</strong>
          </span>
        ))}
        <span className="rank-smooth">（均值约 {smoothedRank.toLocaleString()}）</span>
      </div>

      {/* 省市 & 类型 */}
      <div className="uni-card__meta">
        <span>{university.province}</span>
        <span>·</span>
        <span>{university.type}</span>
        <span>·</span>
        <a
          href={`https://cn.bing.com/search?q=${encodeURIComponent(university.bing_news_hook)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-external"
        >
          Bing 资讯 <ExternalLink size={11} />
        </a>
      </div>

      {/* 操作区 */}
      {showAdd && (
        <div className="uni-card__actions">
          {inVolunteers ? (
            <span className="btn btn-ghost btn-sm btn--added">
              <Check size={14} /> 已加入志愿表
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              <Plus size={14} /> 加入志愿表
            </button>
          )}
        </div>
      )}
    </div>
  )
}
