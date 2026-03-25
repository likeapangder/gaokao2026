import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, AlertTriangle, ShieldCheck, FileText } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { generateReport } from '../logic/ReportEngine.js'
import { universities } from '../data/universities.js'

// ── 章节类型 → 样式映射 ─────────────────────────────────────
const SECTION_STYLE = {
  normal:  { className: 'report-section',
             iconClass: null },
  policy:  { className: 'report-section report-section--policy',
             iconClass: 'policy' },
  warning: { className: 'report-section report-section--warning',
             iconClass: 'warning' },
  summary: { className: 'report-section report-section--summary',
             iconClass: null },
}

/** 将 \n 换行的纯文本转为多个 <p> */
function MultiLineParagraph({ text }) {
  const lines = text.split('\n').filter(Boolean)
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className="report-section__content">{line}</p>
      ))}
    </>
  )
}

/** 单个报告章节 */
function ReportSection({ section }) {
  const style = SECTION_STYLE[section.type] ?? SECTION_STYLE.normal

  return (
    <div className={style.className}>
      <h3 className="report-section__title">
        {section.type === 'policy' && (
          <ShieldCheck size={15} className="section-icon section-icon--policy" />
        )}
        {section.type === 'warning' && (
          <AlertTriangle size={15} className="section-icon section-icon--warning" />
        )}
        {section.type === 'normal' && (
          <span className="report-section__num">·</span>
        )}
        {section.title}
      </h3>
      <MultiLineParagraph text={section.content} />
    </div>
  )
}

export default function AIReportPage() {
  const candidate = useCandidate()
  const { score, province, rank, total, volunteers,
          interests = [], examType, firstSubject, optionals = [] } = candidate
  const navigate = useNavigate()

  // 调用 ReportEngine，输出结构化 JSON
  const report = useMemo(() => {
    if (!score || !rank || !total) return null

    return generateReport(
      { rank, total, score, province, interests, volunteers, examType, firstSubject, optionals },
      universities,
    )
  }, [score, rank, total, province, interests, volunteers, examType, firstSubject, optionals])

  // ── 未填成绩 ────────────────────────────────────────────────
  if (!score || !rank) {
    return (
      <div className="page-empty">
        <div className="empty-icon">📄</div>
        <h2>请先填写成绩</h2>
        <p>填写省份和高考成绩后，系统将为你生成个性化志愿报告。</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          前往填写 →
        </button>
      </div>
    )
  }

  // ── ReportEngine 报错（参数异常）────────────────────────────
  if (report && !report.ok) {
    return (
      <div className="page-empty">
        <div className="empty-icon">⚠️</div>
        <h2>报告生成失败</h2>
        {report.errors.map((e, i) => <p key={i}>{e}</p>)}
      </div>
    )
  }

  const { meta, sections } = report

  return (
    <div className="ai-report-page page-container">

      {/* ── 页头 ─────────────────────────────────────────────── */}
      <div className="page-header report-header">
        <div>
          <h1 className="page-title">AI 定制志愿报告</h1>
          <p className="page-subtitle">
            确定性模板引擎 · 零 AI 幻觉 ·&nbsp;
            <span
              className="report-tier report-tier--badge"
              style={{ background: meta.tierColor }}
            >
              {meta.badgeText}
            </span>
          </p>
          <p className="report-strategy-line">{meta.strategyLine}</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => window.print()}
          aria-label="打印或保存为 PDF"
        >
          <Printer size={16} /> 打印 / PDF
        </button>
      </div>

      {/* ── 报告正文（可打印区域）────────────────────────────── */}
      <div className="report-body" id="report-print-area">

        {/* 封面信息卡 */}
        <div className="report-cover">
          <div className="report-cover__logo">
            <FileText size={16} style={{ marginRight: 6 }} />
            必应高考 · 个性化志愿填报分析报告
          </div>
          <h2 className="report-cover__title">
            {meta.province} {meta.year} 年 · {meta.tierLabel}档 分析
          </h2>
          <div className="report-cover__meta">
            <span>省份：{meta.province}</span>
            <span>成绩：{meta.score} 分</span>
            <span>位次：{meta.rank?.toLocaleString()} 名</span>
            <span>全省前 {meta.percentile}%</span>
            <span>生成时间：{new Date(meta.generatedAt).toLocaleString('zh-CN')}</span>
          </div>
          {/* 兴趣偏好展示 */}
          {interests.length > 0 && (
            <div className="report-cover__interests">
              兴趣偏好：
              {interests.map((tag) => (
                <span key={tag} className="tag tag--badge">{tag}</span>
              ))}
              &nbsp;→ 匹配文案库：<strong>{meta.interestKey}</strong>
            </div>
          )}
        </div>

        {/* 各章节 */}
        {sections.map((section) => (
          <ReportSection key={section.key} section={section} />
        ))}
      </div>
    </div>
  )
}
