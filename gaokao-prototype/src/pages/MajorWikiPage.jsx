import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { majors } from '../data/majors.js'
import { deepMajors } from '../data/deepMockData.js'
import MajorDetailCard from '../components/MajorDetailCard.jsx'
import SerpCardStack from '../components/SerpCardStack.jsx'
import { SUBJECT_LABELS } from '../data/schemas.js'
import { useCandidate } from '../context/CandidateContext.jsx'

const CATEGORY_OPTIONS = ['全部', '工学', '理学', '经济学', '管理学', '医学', '法学', '文学', '教育学']
const SUBJECT_OPTIONS   = Object.entries(SUBJECT_LABELS).map(([v, l]) => ({ value: v, label: l }))

export default function MajorWikiPage() {
  const { firstSubject, optionals } = useCandidate()
  const [query, setQuery]           = useState('')
  const [category, setCategory]     = useState('全部')
  const [subjectFilter, setSubject] = useState('')
  const [mySubjectsOnly, setMySubjectsOnly] = useState(false)

  // 使用 CardStack 管理详情卡片
  const [cardStack, setCardStack] = useState([])

  const mySubjects = useMemo(
    () => [firstSubject, ...optionals].filter(Boolean),
    [firstSubject, optionals]
  )

  const filtered = useMemo(() => {
    return majors.filter((m) => {
      const matchQuery = !query ||
        m.name.includes(query) ||
        m.category.includes(query) ||
        m.code.includes(query)
      const matchCat  = category === '全部' || m.category === category
      const matchSub  = !subjectFilter || (
        m.subject_requirement.required.includes(subjectFilter) ||
        m.subject_requirement.optional.includes(subjectFilter)
      )
      const matchMine = !mySubjectsOnly || mySubjects.length === 0 || (
        m.subject_requirement.required.every((s) => mySubjects.includes(s))
      )
      return matchQuery && matchCat && matchSub && matchMine
    })
  }, [query, category, subjectFilter, mySubjectsOnly, mySubjects])

  const openMajorCard = (major) => {
    const fullData = deepMajors.find((dm) => dm.id === major.id) ?? major
    setCardStack([{ type: 'major', id: major.id, data: fullData }])
  }

  return (
    <div className="wiki-page page-container">
      <div className="page-header">
        <h1 className="page-title">查专业</h1>
        <p className="page-subtitle">共 {filtered.length} / {majors.length} 个专业</p>
      </div>

      {/* 筛选栏 */}
      <div className="wiki-filters">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索专业名称、代码..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* 学科门类 */}
        <div className="filter-chips">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`chip ${category === opt ? 'chip--active' : ''}`}
              onClick={() => setCategory(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* 选科过滤 */}
        <div className="filter-row">
          <select
            value={subjectFilter}
            onChange={(e) => setSubject(e.target.value)}
            className="select-sm"
          >
            <option value="">不限科目</option>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {mySubjects.length > 0 && (
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={mySubjectsOnly}
                onChange={(e) => setMySubjectsOnly(e.target.checked)}
              />
              只看匹配我选科的专业
            </label>
          )}
        </div>
      </div>

      {/* 主体：专业卡片网格 */}
      <div className="major-grid-wrapper">
        {filtered.length === 0 ? (
          <div className="page-empty">
            <p>未找到匹配专业，请尝试调整筛选条件。</p>
          </div>
        ) : (
          <div className="major-grid">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="major-grid-item"
                onClick={() => openMajorCard(m)}
              >
                <MajorDetailCard major={m} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 沉浸式详情卡片堆叠区 */}
      {cardStack.length > 0 && (
        <SerpCardStack
          initialStack={cardStack}
          onClose={() => setCardStack([])}
        />
      )}
    </div>
  )
}
