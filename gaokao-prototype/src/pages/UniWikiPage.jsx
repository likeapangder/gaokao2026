import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { universities } from '../data/universities.js'
import { deepSchools } from '../data/deepMockData.js'
import UniversityCard from '../components/UniversityCard.jsx'
import SerpCardStack from '../components/SerpCardStack.jsx'

const LEVEL_OPTIONS = ['全部', '985', '211', '双一流']
const TYPE_OPTIONS  = ['全部类型', '综合', '理工', '师范', '财经']

export default function UniWikiPage() {
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('全部')
  const [typeFilter, setTypeFilter] = useState('全部类型')

  // 使用 CardStack 管理详情卡片
  const [cardStack, setCardStack] = useState([])

  const filtered = useMemo(() => {
    return universities.filter((u) => {
      const matchQuery = !query ||
        u.name.includes(query) ||
        u.province.includes(query) ||
        u.tags.some((t) => t.includes(query))
      const matchLevel = levelFilter === '全部' || u.tags.includes(levelFilter)
      const matchType  = typeFilter === '全部类型' || u.type === typeFilter
      return matchQuery && matchLevel && matchType
    })
  }, [query, levelFilter, typeFilter])

  const openSchoolCard = (school) => {
    const fullData = deepSchools.find((ds) => ds.id === school.id) ?? school
    setCardStack([{ type: 'school', id: school.id, data: fullData }])
  }

  return (
    <div className="wiki-page page-container">
      <div className="page-header">
        <h1 className="page-title">查大学</h1>
        <p className="page-subtitle">共 {filtered.length} / {universities.length} 所院校</p>
      </div>

      {/* 筛选栏 */}
      <div className="wiki-filters">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索院校名称、省份..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`chip ${levelFilter === opt ? 'chip--active' : ''}`}
              onClick={() => setLevelFilter(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`chip ${typeFilter === opt ? 'chip--active' : ''}`}
              onClick={() => setTypeFilter(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 主体：列表 */}
      <div className="wiki-list" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div className="page-empty">
            <p>未找到匹配院校，请尝试其他关键词。</p>
          </div>
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="wiki-list-item"
              onClick={() => openSchoolCard(u)}
            >
              <UniversityCard university={u} showAdd />
            </div>
          ))
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
