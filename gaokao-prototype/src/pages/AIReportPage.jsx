import { useState, useEffect, useMemo } from 'react'
import {
  Download, FileText, AlertTriangle, ShieldCheck,
  TrendingUp, Award, Settings2, Loader2, CheckCircle2, Circle
} from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'
import { generateReport } from '../logic/ReportEngine.js'
import { universities } from '../data/universities.js'

/** Multi-line paragraph helper */
function MultiLineParagraph({ text }) {
  const lines = text.split('\n').filter(Boolean)
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className="mb-4 text-slate-700 leading-relaxed">{line}</p>
      ))}
    </>
  )
}

/** Report Section Component */
function ReportSection({ section, index }) {
  const getIcon = () => {
    switch (section.type) {
      case 'policy': return <ShieldCheck size={20} className="text-blue-600" />;
      case 'warning': return <AlertTriangle size={20} className="text-orange-600" />;
      case 'summary': return <Award size={20} className="text-green-600" />;
      default: return <FileText size={20} className="text-slate-600" />;
    }
  }

  const getBgColor = () => {
    switch (section.type) {
      case 'policy': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'summary': return 'bg-green-50 border-green-200';
      default: return 'bg-white';
    }
  }

  return (
    <section className={`mb-8 p-6 rounded-xl border ${getBgColor()}`}>
      <div className="flex items-center gap-3 mb-4">
        {getIcon()}
        <h2 className="text-xl font-bold text-slate-900">
          {index + 1}. {section.title}
        </h2>
      </div>
      <div className="prose prose-slate max-w-none">
        <MultiLineParagraph text={section.content} />
      </div>
    </section>
  )
}

export default function AIReportPage() {
  const candidate = useCandidate()
  const { score, province, rank, total, volunteers, preferences, examType, firstSubject, optionals = [] } = candidate
  const { openScoreModal } = useUI()

  // --- Agentic Loader State ---
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(true)

  const steps = [
    "正在提取考生档案与多维偏好矩阵...",
    "检索目标院校历年录取与学费数据...",
    "正在运用专家引擎组装【冲稳保】策略解析...",
    "正在排版文档并生成可视化数据图表..."
  ]

  useEffect(() => {
    // Only start animation if we have valid data
    if (!score || !rank) {
      setIsGenerating(false)
      return
    }

    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 800)
      return () => clearTimeout(timer)
    } else {
      // All steps done, wait a bit then show report
      const timer = setTimeout(() => {
        setIsGenerating(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, steps.length, score, rank])

  // Compatibility layer for interests
  const interests = useMemo(() => {
    if (Array.isArray(preferences)) return preferences
    if (preferences && typeof preferences === 'object') {
      const { locations = [], majorGroups = [], strategy } = preferences
      return [
        ...locations,
        ...majorGroups,
        strategy === 'university_first' ? '名校优先' :
        strategy === 'major_first'      ? '专业优先' :
        strategy === 'location_first'   ? '地域优先' : '均衡策略'
      ]
    }
    return []
  }, [preferences])

  // Generate report
  const report = useMemo(() => {
    if (!score || !rank || !total) return null
    return generateReport(
      { rank, total, score, province, interests, volunteers, examType, firstSubject, optionals },
      universities,
    )
  }, [score, rank, total, province, interests, volunteers, examType, firstSubject, optionals])

  // Empty state - no score
  if (!score || !rank) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">请先填写成绩</h2>
        <p className="text-slate-600 mb-6">填写省份和高考成绩后，系统将为你生成个性化志愿报告</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          onClick={() => openScoreModal({ expanded: true })}
        >
          前往填写 →
        </button>
      </div>
    )
  }

  // --- Render: Agentic Loader ---
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-white border border-gray-100 shadow-sm rounded-2xl p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4 animate-pulse">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">AI 志愿助手思考中</h3>
            <p className="text-sm text-slate-500">为您定制专属报考方案</p>
          </div>

          <div className="space-y-4">
            {steps.map((text, index) => {
              // Status logic
              const isCompleted = currentStep > index
              const isCurrent = currentStep === index

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                     // Only show if it's current or previous (or pending but we show all slots for stability)
                     // Actually requirement says "Task List... fade in"
                     // Let's just always render them but animate appearance?
                     // Or just render normally. The user said "fade in effect for appearance".
                     // Since we map all of them, let's just apply styles based on state.
                     'animate-in fade-in slide-in-from-bottom-2'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-green-600 transition-all duration-300" />
                    ) : isCurrent ? (
                      <Loader2 size={20} className="text-blue-600 animate-spin" />
                    ) : (
                      <Circle size={20} className="text-slate-300" />
                    )}
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isCompleted ? 'text-green-600' :
                    isCurrent ? 'text-blue-600' :
                    'text-slate-400'
                  }`}>
                    {text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Error state (check after loading finishes)
  if (report && !report.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">报告生成失败</h2>
        {report.errors.map((e, i) => <p key={i} className="text-slate-600">{e}</p>)}
      </div>
    )
  }

  const { meta, sections } = report

  // Export to PDF handler
  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
      {/* Document Container - Notion/Word Style */}
      <div className="w-full max-w-[900px] bg-white shadow-lg rounded-2xl p-12 mb-12">

        {/* Document Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <FileText size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">AI 定制志愿报告</h1>
              <p className="text-sm text-slate-500 mt-1">必应高考 · 个性化分析</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openScoreModal({ expanded: true })}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Settings2 size={18} />
              修改成绩与偏好
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
            >
              <Download size={18} />
              导出 PDF
            </button>
          </div>
        </div>

        {/* Report Cover / Metadata */}
        <div className="mb-10 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {meta.province} {meta.year} 年 · {meta.tierLabel}档分析
              </h2>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-2"
                style={{ background: meta.tierColor, color: '#fff' }}
              >
                {meta.badgeText}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/80 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-slate-600 font-semibold mb-1">省份</div>
              <div className="text-lg font-bold text-slate-900">{meta.province}</div>
            </div>
            <div className="bg-white/80 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-slate-600 font-semibold mb-1">成绩</div>
              <div className="text-lg font-bold text-blue-600">{meta.score} 分</div>
            </div>
            <div className="bg-white/80 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-slate-600 font-semibold mb-1">位次</div>
              <div className="text-lg font-bold text-slate-900">{meta.rank?.toLocaleString()}</div>
            </div>
            <div className="bg-white/80 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-slate-600 font-semibold mb-1">排名</div>
              <div className="text-lg font-bold text-green-600">前 {meta.percentile}%</div>
            </div>
          </div>

          {interests.length > 0 && (
            <div className="mt-6 p-4 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="text-xs text-slate-600 font-semibold mb-2">兴趣偏好</div>
              <div className="flex flex-wrap gap-2">
                {interests.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500">
            生成时间：{new Date(meta.generatedAt).toLocaleString('zh-CN')}
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <ReportSection key={section.key} section={section} index={index} />
          ))}
        </div>

        {/* Document Footer */}
        <div className="mt-12 pt-6 border-t-2 border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            © 2026 必应高考 · 本报告由 AI 模板引擎生成，数据仅供参考
          </p>
          <p className="text-xs text-slate-400 mt-2">
            请以各省教育考试院官方发布的信息为准
          </p>
        </div>
      </div>
    </div>
  )
}
