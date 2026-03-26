import { useState, useMemo } from 'react'
import {
  MapPin,
  BookOpen,
  TrendingUp,
  Users,
  FileText,
  Briefcase,
  ExternalLink,
  Award,
} from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { deepSchools, deepMajors } from '../data/deepMockData.js'
import SerpFeatureCard from './SerpFeatureCard.jsx'
import AddToSheetButton from './AddToSheetButton.jsx'
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { deepSchools, deepMajors } from '../data/deepMockData.js'
import SerpFeatureCard from './SerpFeatureCard.jsx'

const CHART_COLORS = ['#0078D4', '#00BCF2', '#00B7C3', '#8661C5', '#5C2D91']

// 科目代码 → 中文
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

const TABS = [
  { id: 'core', label: '基本介绍', icon: MapPin },
  { id: 'majors', label: '开设专业', icon: BookOpen },
  { id: 'admissionLines', label: '历年分数线', icon: TrendingUp },
  { id: 'enrollment', label: '招生计划', icon: Users },
  { id: 'brief', label: '招生简章', icon: FileText },
  { id: 'career', label: '毕业去向', icon: Briefcase },
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

export default function SerpSchoolCard({
  schoolId,
  school: propSchool,
  onClose,
  onBack,
  showBack,
  isStacked,
  onMajorClick,
}) {
  const [activeTab, setActiveTab] = useState('core')
  const [selectedProvince, setSelectedProvince] = useState('JS')

  const school = useMemo(() => {
    if (propSchool) return propSchool
    if (schoolId) return deepSchools.find((s) => s.id === schoolId)
    return null
  }, [propSchool, schoolId])

  const rankTrendData = useMemo(() => {
    if (!school?.rank_history) return []
    return [...school.rank_history]
      .sort((a, b) => a.year - b.year)
      .map((item) => ({
        year: item.year,
        位次: item.minRank,
        分数: item.minScore,
      }))
  }, [school])

  const smoothedRank = useMemo(() => exponentialSmoothing(school?.rank_history ?? []), [school])

  const offeredMajors = useMemo(() => {
    if (!school?.offeredMajorIds) return []
    return school.offeredMajorIds
      .map((id) => deepMajors.find((m) => m.id === id))
      .filter(Boolean)
  }, [school])

  const admissionLinesFiltered = useMemo(() => {
    if (!school?.admissionLines) return []
    return school.admissionLines
      .filter((line) => line.province === selectedProvince)
      .sort((a, b) => a.year - b.year)
  }, [school, selectedProvince])

  const admissionLinesChartData = useMemo(() => {
    return admissionLinesFiltered.map((item) => ({
      year: item.year,
      分数线: item.minScore,
      最低位次: item.minRank,
    }))
  }, [admissionLinesFiltered])

  const provinces = useMemo(() => {
    if (!school?.admissionLines) return []
    return [...new Set(school.admissionLines.map((l) => l.province))]
  }, [school])

  const enrollmentByYear = useMemo(() => {
    if (!school?.enrollmentPlan) return {}
    return school.enrollmentPlan.reduce((acc, plan) => {
      if (!acc[plan.year]) acc[plan.year] = []
      acc[plan.year].push(plan)
      return acc
    }, {})
  }, [school])

  const brief = school?.admissionBrief
  const career = school?.careerOutcome

  if (!school) return null

  const subtitleNodes = (
    <>
      <span className="chip chip--accent">{school.type}</span>
      <span className="chip chip--secondary">{school.province}</span>
      {school.tags?.map((tag) => (
        <span key={tag} className="chip chip--light">{tag}</span>
      ))}
    </>
  )

  return (
    <SerpFeatureCard
      title={school.name}
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
        {activeTab === 'core' && (
          <div className="detail-tab-pane">
            <div className="stat-card-row">
              <div className="stat-card">
                <div className="stat-card__value">#{smoothedRank.toLocaleString()}</div>
                <div className="stat-card__label">平滑位次（近3年）</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{school.code}</div>
                <div className="stat-card__label">院校代码</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{school.rank_history?.[0]?.minScore ?? '—'}</div>
                <div className="stat-card__label">最低分（2025）</div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-section__title">近3年位次趋势</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={rankTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="year" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="位次" stroke="#0078D4" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="分数" stroke="#00BCF2" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="detail-section">
              <h3 className="detail-section__title">院校层次</h3>
              <div className="chip-list">
                {school.level_tags?.map((tag) => (
                  <span key={tag} className="chip chip--primary">
                    <Award size={14} strokeWidth={1.5} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-section__title">Bing 新闻</h3>
              <a
                href={`https://www.bing.com/search?q=${encodeURIComponent(school.bing_news_hook ?? school.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={14} strokeWidth={1.5} />
                搜索最新新闻
              </a>
            </div>
          </div>
        )}

        {activeTab === 'majors' && (
          <div className="detail-tab-pane">
            <p className="detail-section__intro">该校共开设 <strong>{offeredMajors.length}</strong> 个专业</p>
            <div className="major-list">
              {offeredMajors.map((major) => (
                <div
                  key={major.id}
                  className="major-list-item"
                  onClick={() => onMajorClick && onMajorClick(major)}
                  style={{ cursor: onMajorClick ? 'pointer' : 'default' }}
                >
                  <div className="major-list-item__header">
                    <h4>{major.name}</h4>
                    <span className="chip chip--light">{major.category}</span>
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
                  <div className="major-list-item__meta">
                    <span>选科：{formatSubjectReq(major.subject_requirement)}</span>
                    <span>就业前景：{major.job_prospects}</span>
                  </div>
                </div>
              ))}
              {offeredMajors.length === 0 && <div className="detail-panel__empty">暂无开设专业数据</div>}
            </div>
          </div>
        )}

        {activeTab === 'admissionLines' && (
          <div className="detail-tab-pane">
            <div className="detail-section">
              <h3 className="detail-section__title">省份筛选</h3>
              <div className="chip-list">
                {provinces.map((prov) => (
                  <button
                    key={prov}
                    className={`chip ${selectedProvince === prov ? 'chip--accent' : 'chip--light'}`}
                    onClick={() => setSelectedProvince(prov)}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-section__title">分数线趋势（{selectedProvince}）</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={admissionLinesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="year" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="分数线" stroke="#0078D4" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="detail-section">
              <h3 className="detail-section__title">历年数据表</h3>
              <table className="detail-table">
                <thead>
                  <tr><th>年份</th><th>最低分</th><th>最低位次</th><th>招生计划</th></tr>
                </thead>
                <tbody>
                  {admissionLinesFiltered.map((line) => (
                    <tr key={`${line.year}-${line.province}`}>
                      <td>{line.year}</td>
                      <td>{line.minScore}</td>
                      <td>#{line.minRank.toLocaleString()}</td>
                      <td>{line.planCount} 人</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admissionLinesFiltered.length === 0 && <div className="detail-panel__empty">暂无该省份分数线数据</div>}
            </div>
          </div>
        )}

        {activeTab === 'enrollment' && (
          <div className="detail-tab-pane">
            {Object.keys(enrollmentByYear).sort((a, b) => b - a).map((year) => {
              const plans = enrollmentByYear[year]
              return (
                <div key={year} className="detail-section">
                  <h3 className="detail-section__title">{year} 年招生计划</h3>
                  <table className="detail-table">
                    <thead>
                      <tr><th>省份</th><th>专业组</th><th>计划人数</th><th></th></tr>
                    </thead>
                    <tbody>
                      {plans.map((plan, idx) => (
                        <tr key={idx}>
                          <td>{plan.province}</td>
                          <td>{plan.majorGroup}</td>
                          <td>{plan.count} 人</td>
                          <td>
                            <AddToSheetButton
                              universityId={school.id}
                              universityName={school.name}
                              majorId={`group-${plan.majorGroup}`}
                              majorName={plan.majorGroup}
                              province={school.province}
                              type={school.type}
                              category="match"
                              size="xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
            {Object.keys(enrollmentByYear).length === 0 && <div className="detail-panel__empty">暂无招生计划数据</div>}
          </div>
        )}

        {activeTab === 'brief' && (
          <div className="detail-tab-pane">
            {brief ? (
              <>
                <div className="stat-card-row">
                  {brief.highlights.map((h, idx) => (
                    <div key={idx} className="stat-card">
                      <div className="stat-card__value">{h.value}</div>
                      <div className="stat-card__label">{h.label}</div>
                    </div>
                  ))}
                </div>
                <div className="detail-section">
                  <h3 className="detail-section__title">{brief.year} 招生简章摘要</h3>
                  <div className="detail-section__text">{brief.content}</div>
                </div>
                <a
                  href={brief.bingSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <ExternalLink size={14} strokeWidth={1.5} />
                  查看完整简章（Bing 搜索）
                </a>
              </>
            ) : <div className="detail-panel__empty">暂无招生简章数据</div>}
          </div>
        )}

        {activeTab === 'career' && (
          <div className="detail-tab-pane">
            {career ? (
              <>
                <div className="stat-card-row">
                  <div className="stat-card">
                    <div className="stat-card__value">{career.employRate}%</div>
                    <div className="stat-card__label">就业率</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">{career.furtherStudyRate}%</div>
                    <div className="stat-card__label">深造率</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card__value">¥{career.avgSalary.toLocaleString()}</div>
                    <div className="stat-card__label">平均月薪</div>
                  </div>
                </div>
                <div className="detail-section">
                  <h3 className="detail-section__title">就业去向分布</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={career.distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => `${entry.name} ${entry.value}%`}
                      >
                        {career.distribution.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="detail-section">
                  <h3 className="detail-section__title">主要就业单位（Top3）</h3>
                  <div className="chip-list">
                    {career.topEmployers.map((employer) => (
                      <span key={employer} className="chip chip--primary">{employer}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : <div className="detail-panel__empty">暂无毕业去向数据</div>}
          </div>
        )}
      </div>
    </SerpFeatureCard>
  )
}