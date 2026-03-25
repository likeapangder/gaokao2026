import { ExternalLink } from 'lucide-react'
import { SUBJECT_LABELS } from '../data/schemas.js'

/**
 * 专业详情卡片组件
 * @param {{ major: import('../data/majors').Major }} props
 */
export default function MajorDetailCard({ major }) {
  const { name, category, subject_requirement, job_prospects, bing_wiki_link, code } = major

  const requiredLabels = (subject_requirement.required || []).map((s) => SUBJECT_LABELS[s] || s)
  const optionalLabels = (subject_requirement.optional || []).map((s) => SUBJECT_LABELS[s] || s)

  return (
    <div className="major-card">
      <div className="major-card__header">
        <div>
          <h3 className="major-card__name">{name}</h3>
          <span className="major-card__code">专业代码：{code}</span>
        </div>
        <span className="tag tag--category">{category}</span>
      </div>

      {/* 选科要求 */}
      <div className="major-card__subjects">
        {requiredLabels.length > 0 && (
          <span className="subject-req">
            必选：
            {requiredLabels.map((l) => (
              <span key={l} className="tag tag--required">{l}</span>
            ))}
          </span>
        )}
        {optionalLabels.length > 0 && (
          <span className="subject-req">
            可选：
            {optionalLabels.map((l) => (
              <span key={l} className="tag tag--optional">{l}</span>
            ))}
          </span>
        )}
        {requiredLabels.length === 0 && optionalLabels.length === 0 && (
          <span className="tag tag--any">不限科目</span>
        )}
      </div>

      {/* 就业前景 */}
      <p className="major-card__prospects">{job_prospects}</p>

      {/* 外链 */}
      <a
        href={bing_wiki_link}
        target="_blank"
        rel="noopener noreferrer"
        className="link-external"
      >
        Bing 百科详情 <ExternalLink size={11} />
      </a>
    </div>
  )
}
