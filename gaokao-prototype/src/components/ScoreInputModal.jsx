import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, TrendingUp, MapPin, Calculator, Target, DollarSign, ChevronDown, Sparkles } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { ALL_PROVINCES, FIRST_SUBJECT_OPTIONS, OPTIONAL_SUBJECT_OPTIONS } from '../hooks/useProvinceLayout.js'
import { scoreToRank } from '../logic/rankEngine.js'
import { MAJOR_GROUPS, REGION_GROUPS, STRATEGIES } from '../data/constants.js'

// Tuition options
const TUITION_OPTIONS = [
  { id: '3k_limit', label: '3千以内' },
  { id: '8k_limit', label: '8千以内' },
  { id: 'unlimited', label: '不限' },
]

// Default preferences (used when submitting with collapsed state)
const DEFAULT_PREFERENCES = {
  locations: [],
  majorGroups: [],
  strategy: 'balanced',
  tuitionAffordability: 'unlimited',
}

export default function ScoreInputModal({ onClose, initialExpanded = false }) {
  const navigate = useNavigate()
  const {
    province,
    score,
    firstSubject,
    optionals,
    preferences: savedPreferences,
    setCandidate,
  } = useCandidate()

  // ── Progressive Disclosure State ──
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(initialExpanded)
  const prefPanelRef = useRef(null)
  const [prefPanelHeight, setPrefPanelHeight] = useState(0)

  // Initialize form state
  const [form, setForm] = useState({
    province: province || '',
    examType: 'physics', // physics or history for 3+1+2
    score: score ?? '',
    firstSubject: firstSubject || '',
    optionals: optionals || [],
    preferences: {
      locations: savedPreferences?.locations || [],
      majorGroups: savedPreferences?.majorGroups || [],
      strategy: savedPreferences?.strategy || 'balanced',
      tuitionAffordability: savedPreferences?.tuitionAffordability || 'unlimited',
    },
  })

  // Real-time rank preview
  const [rankPreview, setRankPreview] = useState(null)

  // ── Measure preference panel height for smooth animation ──
  const measurePrefHeight = useCallback(() => {
    if (prefPanelRef.current) {
      setPrefPanelHeight(prefPanelRef.current.scrollHeight)
    }
  }, [])

  useEffect(() => {
    measurePrefHeight()
    // Re-measure when form changes (content may resize)
    const timer = setTimeout(measurePrefHeight, 50)
    return () => clearTimeout(timer)
  }, [form.preferences, measurePrefHeight])

  // Auto-calculate rank when province or score changes
  useEffect(() => {
    const s = Number(form.score)
    if (form.province && s > 0 && s <= 750) {
      const result = scoreToRank(form.province, s)
      setRankPreview(result)
    } else {
      setRankPreview(null)
    }
  }, [form.province, form.score])

  // Province change handler
  function handleProvinceChange(e) {
    const newProvince = e.target.value
    setForm((f) => ({
      ...f,
      province: newProvince,
      firstSubject: '',
      optionals: [],
    }))
  }

  // Optional subject toggle
  function handleOptionalToggle(val) {
    setForm((f) => {
      const has = f.optionals.includes(val)
      if (has) return { ...f, optionals: f.optionals.filter((o) => o !== val) }
      if (f.optionals.length >= 2) return f // max 2
      return { ...f, optionals: [...f.optionals, val] }
    })
  }

  // Preference handlers
  function handleLocationToggle(locId) {
    setForm((f) => {
      const current = f.preferences.locations
      const next = current.includes(locId)
        ? current.filter((x) => x !== locId)
        : [...current, locId]
      return { ...f, preferences: { ...f.preferences, locations: next } }
    })
  }

  function handleMajorGroupToggle(groupName) {
    setForm((f) => {
      const current = f.preferences.majorGroups
      const next = current.includes(groupName)
        ? current.filter((x) => x !== groupName)
        : [...current, groupName]
      return { ...f, preferences: { ...f.preferences, majorGroups: next } }
    })
  }

  function handleStrategySelect(id) {
    setForm((f) => ({
      ...f,
      preferences: {
        ...f.preferences,
        strategy: id,
      },
    }))
  }

  function handleTuitionSelect(id) {
    setForm((f) => ({
      ...f,
      preferences: {
        ...f.preferences,
        tuitionAffordability: id,
      },
    }))
  }

  // Submit handler — tolerates collapsed (empty) preferences
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.province || !form.score) return

    const newLayout = ALL_PROVINCES.find((p) => p.id === form.province)

    // When preferences section is collapsed, use defaults so the 2:5:3
    // recommendation engine always receives a well-formed preferences object
    const effectivePreferences = isPreferencesExpanded
      ? form.preferences
      : {
          ...DEFAULT_PREFERENCES,
          // Preserve any defaults that may have been pre-populated
          strategy: form.preferences.strategy || DEFAULT_PREFERENCES.strategy,
          tuitionAffordability:
            form.preferences.tuitionAffordability || DEFAULT_PREFERENCES.tuitionAffordability,
        }

    setCandidate({
      province: form.province,
      examType: newLayout?.examType ?? '3+1+2',
      score: Number(form.score),
      firstSubject: form.firstSubject,
      optionals: form.optionals,
      preferences: effectivePreferences,
    })
    onClose()
    if (isPreferencesExpanded) {
      navigate('/ai-report')
    } else {
      navigate('/recommendation')
    }
  }

  // Province layout mode
  const currentLayout = (() => {
    if (!form.province) return { mode: 'none', maxScore: 750 }
    if (form.province === 'SH') return { mode: 'shanghai', maxScore: 660 }
    if (['BJ', 'TJ'].includes(form.province)) return { mode: 'old', maxScore: 750 }
    return { mode: 'new', maxScore: 750 }
  })()

  const showSubjects = currentLayout.mode === 'new'
  const scoreNum = Number(form.score)
  const scoreValid = form.score !== '' && scoreNum >= 0 && scoreNum <= currentLayout.maxScore

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* ═══════════════════════════════════════════════════ */}
          {/* PART 1: Score Hero Card (Bing Blue Gradient) */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">考生成绩速览</h2>
                <p className="text-blue-100 text-sm">Score Hero Card</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Province */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-100">
                  <MapPin size={14} className="inline mr-1" />
                  所在省份
                </label>
                <select
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-semibold placeholder-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  value={form.province}
                  onChange={handleProvinceChange}
                  required
                >
                  <option value="" className="text-slate-900">
                    请选择省份
                  </option>
                  {ALL_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-900">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Type (Physics/History) */}
              {showSubjects && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-blue-100">科类选择</label>
                  <div className="flex gap-2">
                    {FIRST_SUBJECT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, firstSubject: opt.value }))}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                          form.firstSubject === opt.value
                            ? 'bg-white text-blue-600 shadow-lg'
                            : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Input */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-100">
                  <Calculator size={14} className="inline mr-1" />
                  高考总分
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-bold text-lg placeholder-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  min={0}
                  max={currentLayout.maxScore}
                  value={form.score}
                  onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                  placeholder={`0 - ${currentLayout.maxScore}`}
                  required
                />
              </div>

              {/* Rank Preview (Read-only) */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-blue-100">
                  省排名/位次 (只读)
                </label>
                <div
                  className={`px-4 py-3 rounded-xl font-bold text-lg ${
                    rankPreview
                      ? 'bg-white/30 text-white border-2 border-white/50'
                      : 'bg-white/10 text-white/50 border border-white/20'
                  }`}
                >
                  {rankPreview ? (
                    <div className="flex items-center justify-between">
                      <span>第 {rankPreview.rank?.toLocaleString() || '---'} 名</span>
                      {rankPreview.percentile != null && (
                        <span className="text-sm">前 {rankPreview.percentile.toFixed(1)}%</span>
                      )}
                    </div>
                  ) : (
                    <span>请先输入分数</span>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Subjects (if 3+1+2) */}
            {showSubjects && (
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2 text-blue-100">
                  再选科目 (选 {form.optionals.length}/2 门)
                </label>
                <div className="flex flex-wrap gap-2">
                  {OPTIONAL_SUBJECT_OPTIONS.map((opt) => {
                    const checked = form.optionals.includes(opt.value)
                    const disabled = !checked && form.optionals.length >= 2
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleOptionalToggle(opt.value)}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          checked
                            ? 'bg-white text-blue-600'
                            : disabled
                            ? 'bg-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* Expand Trigger — Secondary CTA (visible only when collapsed) */}
          {/* ═══════════════════════════════════════════════════ */}
          {!isPreferencesExpanded && (
            <div className="px-8 pt-6 pb-2">
              <button
                type="button"
                onClick={() => setIsPreferencesExpanded(true)}
                className="group w-full flex items-center justify-center gap-2.5 px-5 py-3.5
                           rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60
                           text-blue-600 font-semibold text-sm
                           hover:border-blue-400 hover:bg-blue-50
                           active:scale-[0.98] transition-all duration-200"
              >
                <Sparkles size={16} className="text-blue-500 group-hover:text-blue-600 transition-colors" />
                <span>继续填写偏好，领 AI 定制报告</span>
                <ChevronDown
                  size={16}
                  className="text-blue-400 group-hover:translate-y-0.5 transition-transform duration-200"
                />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* PART 2: Preference Matrix — collapsible with smooth animation */}
          {/* ═══════════════════════════════════════════════════ */}
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: isPreferencesExpanded ? `${prefPanelHeight}px` : '0px',
              opacity: isPreferencesExpanded ? 1 : 0,
            }}
          >
            <div ref={prefPanelRef} className="p-8 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">多维偏好矩阵</h3>
                <span className="text-sm text-slate-500">Preference Form</span>
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">地域偏好 (多选)</label>
                <div className="flex flex-wrap gap-2">
                  {REGION_GROUPS.map((region) => {
                    const checked = form.preferences.locations.includes(region.id)
                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => handleLocationToggle(region.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                          checked
                            ? 'bg-blue-50 text-blue-700 border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {region.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Major Groups */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">学科偏好 (多选)</label>
                <div className="flex flex-wrap gap-2">
                  {MAJOR_GROUPS.map((group) => {
                    const checked = form.preferences.majorGroups.includes(group.name)
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleMajorGroupToggle(group.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          checked
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {group.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Strategy */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">优先策略 (单选)</label>
                <div className="grid grid-cols-2 gap-3">
                  {STRATEGIES.map((strategy) => {
                    const isSelected = form.preferences.strategy === strategy.id
                    return (
                      <div
                        key={strategy.id}
                        onClick={() => handleStrategySelect(strategy.id)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 shadow-md'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-slate-900 mb-1">{strategy.label}</div>
                        <div className="text-xs text-slate-600">{strategy.desc}</div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tuition Affordability */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  <DollarSign size={14} className="inline mr-1" />
                  学费倾向 (单选)
                </label>
                <div className="flex gap-2">
                  {TUITION_OPTIONS.map((option) => {
                    const isSelected = form.preferences.tuitionAffordability === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleTuitionSelect(option.id)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                          isSelected
                            ? 'bg-green-50 border-green-600 text-green-700 shadow-md'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-green-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!form.province || !form.score || !scoreValid}
              className={`px-6 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 ${
                form.province && form.score && scoreValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <TrendingUp size={18} />
              {isPreferencesExpanded ? '生成 AI 报告' : '查看智能推荐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
