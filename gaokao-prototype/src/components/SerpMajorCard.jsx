import { useState, useMemo } from 'react'
import {
  Info,
  School,
  TrendingUp,
  GraduationCap,
  ExternalLink,
  Award,
  MapPin,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { deepSchools, deepMajors } from '../data/deepMockData.js'
import SerpFeatureCard from './SerpFeatureCard.jsx'
import AddToSheetButton from './AddToSheetButton.jsx'

const CHART_COLORS = ['#0078D4', '#00BCF2', '#00B7C3', '#8661C5', '#5C2D91']

// 科目代码 → 中文
const SUBJECT_CN = {
  physics: '物理', chemistry: '化学', biology: '生物',
  history: '历史', geography: '地理', politics: '政治',
}

/**
 * 将 subject_requirement 对象 { required: [...], optional: [...] }
 * 转换为可读字符串，如 "必选：物理；选考：化学"
 * 若传入的已经是字符串则直接返回。
 */
function formatSubjectReq(req) {
  if (!req) return '不限'
  if (typeof req === 'string') return req
  const { required = [], optional = [] } = req
  const parts = []
  if (required.length) {
    parts.push(`必选：${required.map(s => SUBJECT_CN[s] ?? s).join('、')}`)
  }
  if (optional.length) {
    parts.push(`选考：${optional.map(s => SUBJECT_CN[s] ?? s).join('、')}`)
  }
  return parts.length ? parts.join('；') : '不限'
}

const TABS = [
  { id: 'overview', label: '专业概况', icon: Info },
  { id: 'schools', label: '开设院校', icon: School },
  { id: 'career', label: '就业前景', icon: TrendingUp },
  { id: 'grad', label: '研招信息', icon: GraduationCap },
]

function exponentialSmoothing(rankHistory, alpha = 0.5) {
  if (!rankHistory || rankHistory.length === 0) return 0
  const sorted = [...rankHistory].sort((a, b) => a.year - b.year)
  let smoothed = sorted[0].minRank
  for (let i = 1; i < sorted.length; i++) {
    smoothed = alpha * sorted[i].minRank + (1 - alpha) * smoothed
  }
  return Math.round(smoothed)
}

export default function SerpMajorCard({
  majorId,
  major: propMajor,
  onClose,
  onBack,
  showBack,
  isStacked,
  onSchoolClick,
}) {
  const [activeTab, setActiveTab] = useState('overview')

  const major = useMemo(() => {
    if (propMajor) return propMajor
    if (majorId) return deepMajors.find((m) => m.id === majorId)
    return null
  }, [propMajor, majorId])

  const offeringSchools = useMemo(() => {
    if (!major?.id) return []
    return deepSchools
      .filter((school) => school.offeredMajorIds?.includes(major.id))
      .map((school) => ({
        ...school,
        smoothedRank: exponentialSmoothing(school.rank_history ?? []),
      }))
      .sort((a, b) => a.smoothedRank - b.smoothedRank)
  }, [major])

  if (!major) return null

  const { careerDetail, gradInfo } = major

  const subtitleNodes = (
    <>
      <span className="chip chip--accent">{major.category}</span>
      <span className="chip chip--secondary">{formatSubjectReq(major.subject_requirement)}</span>
    </>
  )

  return (
    <SerpFeatureCard
      title={major.name}
      subtitleNodes={subtitleNodes}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onClose}
      onBack={onBack}
      showBack={showBack}
      isStacked={isStacked}
    >
      <div className="serp-tab-content">
        {activeTab === 'overview' && (
          <div className="detail-tab-pane">
            {major.overview ? (
              <>
                <div className="stat-card-row">
                  {major.overview.highlights.map((h, idx) => (
                    <div key={idx} className="stat-card">
                      <div className="stat-card__value">{h.value}</div>
                      <div className="stat-card__label">{h.label}</div>
                    </div>
                  ))}
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">基本信息</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-item__label">学制</span>
                      <span className="info-item__value">{major.overview.duration}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-item__label">学位</span>
                      <span className="info-item__value">{major.overview.degree}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-item__label">选科要求</span>
                      <span className="info-item__value">{formatSubjectReq(major.subject_requirement)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">专业简介</h3>
                  <div className="detail-section__text">{major.overview.description}</div>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">核心课程</h3>
                  <div className="chip-list">
                    {major.overview.coreSubjects.map((subject) => (
                      <span key={subject} className="chip chip--primary">{subject}</span>
                    ))}
                  </div>
                </div>

                <a href={major.bing_wiki_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={14} strokeWidth={1.5} />
                  查看 Bing 百科
                </a>
              </>
            ) : <div className="detail-panel__empty">暂无专业概况数据</div>}
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="detail-tab-pane">
            <p className="detail-section__intro">共有 <strong>{offeringSchools.length}</strong> 所院校开设该专业</p>
            <div className="school-list">
              {offeringSchools.map((school) => (
                <div
                  key={school.id}
                  className="school-list-item"
                  onClick={() => onSchoolClick && onSchoolClick(school)}
                  style={{ cursor: onSchoolClick ? 'pointer' : 'default' }}
                >
                  <div className="school-list-item__header">
                    <h4>{school.name}</h4>
                    <span className="chip chip--light">{school.type}</span>
                    <AddToSheetButton
                      universityId={school.id}
                      universityName={school.name}
                      majorId={major.id}
                      majorName={major.name}
                      province={school.province}
                      type={school.type}
                      category="match"
                      size="xs"
                    />
                  </div>
                  <div className="school-list-item__meta">
                    <MapPin size={14} strokeWidth={1.5} />
                    <span>{school.province}</span>
                    <span className="separator">•</span>
                    <span>平滑位次 #{school.smoothedRank.toLocaleString()}</span>
                  </div>
                  <div className="chip-list">
                    {school.level_tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="chip chip--accent-light">
                        <Award size={12} strokeWidth={1.5} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {offeringSchools.length === 0 && <div className="detail-panel__empty">暂无开设院校数据</div>}
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div className="detail-tab-pane">
            {careerDetail ? (
              <>
                <div className="stat-card-row">
                  <div className="stat-card">
                    <div className="stat-card__value">{careerDetail.salaryRange}</div>
                    <div className="stat-card__label">薪资范围</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">
                      {careerDetail.growthTrend === 'up' ? '↑' : careerDetail.growthTrend === 'down' ? '↓' : '→'}
                    </div>
                    <div className="stat-card__label">
                      行业趋势
                      {careerDetail.growthTrend === 'up' && '（上升）'}
                      {careerDetail.growthTrend === 'stable' && '（稳定）'}
                      {careerDetail.growthTrend === 'down' && '（下行）'}
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">就业岗位分布</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={careerDetail.jobDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => `${entry.name} ${entry.value}%`}
                      >
                        {careerDetail.jobDistribution.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">主要就业城市（Top3）</h3>
                  <div className="chip-list">
                    {careerDetail.topCities.map((city) => (
                      <span key={city} className="chip chip--primary">
                        <MapPin size={12} strokeWidth={1.5} />
                        {city}
                      </span>
                    ))}
                  </div>
                </div>

                <a href={careerDetail.bingHook} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={14} strokeWidth={1.5} />
                  深入了解就业前景（Bing 搜索）
                </a>
              </>
            ) : <div className="detail-panel__empty">暂无就业前景数据</div>}
          </div>
        )}

        {activeTab === 'grad' && (
          <div className="detail-tab-pane">
            {gradInfo ? (
              <>
                <div className="stat-card-row">
                  <div className="stat-card">
                    <div className="stat-card__value">{gradInfo.pushRate}</div>
                    <div className="stat-card__label">推免率</div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">考研科目</h3>
                  <div className="chip-list">
                    {gradInfo.examSubjects.map((subject) => (
                      <span key={subject} className="chip chip--primary">{subject}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section__title">热门深造院校（Top3）</h3>
                  <div className="chip-list">
                    {gradInfo.topGradSchools.map((school) => (
                      <span key={school} className="chip chip--accent">
                        <GraduationCap size={12} strokeWidth={1.5} />
                        {school}
                      </span>
                    ))}
                  </div>
                </div>

                <a href={gradInfo.bingSearchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={14} strokeWidth={1.5} />
                  查看研招信息（Bing 搜索）
                </a>
              </>
            ) : <div className="detail-panel__empty">暂无研招信息数据</div>}
          </div>
        )}
      </div>
    </SerpFeatureCard>
  )
}