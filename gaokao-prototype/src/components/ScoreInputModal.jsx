import { useState, useEffect } from 'react'
import { X, MapPin, Hash, BookOpen, Sparkles } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { ALL_PROVINCES, FIRST_SUBJECT_OPTIONS, OPTIONAL_SUBJECT_OPTIONS } from '../hooks/useProvinceLayout.js'
import scoreRankMapping from '../data/scoreRankMapping.json'

// 兴趣标签候选项（对应 StringLibrary 中的 INTEREST_KEY_MAP）
const INTEREST_OPTIONS = [
  '985', '211', '双一流',
  '理工', '综合', '财经', '医学', '师范', '法学', '艺术',
  '北京', '上海', '广东',
]

/**
 * 从 scoreRankMapping.json 快速查询分数对应的位次（就近插值）
 * @param {string} provinceId
 * @param {number} score
 * @returns {{ rank: number, total: number, percentile: number } | null}
 */
function quickLookup(provinceId, score) {
  const mapping = scoreRankMapping[provinceId]
  if (!mapping || !score) return null
  const { table, total } = mapping
  if (!table || table.length === 0) return null

  // 在档位表中找最近的分数段（向下取最近的档位）
  let best = null
  for (const row of table) {
    if (row.score <= score) {
      best = row
      break
    }
  }
  // 如果分数超过最高档，取第一行
  if (!best) best = table[0]

  return {
    rank: best.rank,
    total,
    percentile: best.percentile,
  }
}

export default function ScoreInputModal({ onClose }) {
  const {
    province,
    score,
    firstSubject,
    optionals,
    interests: savedInterests,
    setCandidate,
  } = useCandidate()

  const [form, setForm] = useState({
    province:     province || '',
    score:        score ?? '',
    firstSubject: firstSubject || '',
    optionals:    optionals || [],
    interests:    savedInterests || [],
  })

  // 实时位次预览
  const [rankPreview, setRankPreview] = useState(null)

  // 当省份或分数变化时，实时查表
  useEffect(() => {
    const s = Number(form.score)
    if (form.province && s > 0) {
      const result = quickLookup(form.province, s)
      setRankPreview(result)
    } else {
      setRankPreview(null)
    }
  }, [form.province, form.score])

  // 省份切换时重置科目选择
  function handleProvinceChange(e) {
    const newProvince = e.target.value
    setForm((f) => ({
      ...f,
      province: newProvince,
      firstSubject: '',
      optionals: [],
    }))
  }

  function handleOptionalToggle(val) {
    setForm((f) => {
      const has = f.optionals.includes(val)
      if (has) return { ...f, optionals: f.optionals.filter((o) => o !== val) }
      if (f.optionals.length >= 2) return f // 最多选 2 门
      return { ...f, optionals: [...f.optionals, val] }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.province || !form.score) return
    const newLayout = ALL_PROVINCES.find((p) => p.id === form.province)
    setCandidate({
      province:     form.province,
      examType:     newLayout?.examType ?? '3+1+2',
      score:        Number(form.score),
      firstSubject: form.firstSubject,
      optionals:    form.optionals,
      interests:    form.interests,
    })
    onClose()
  }

  // 根据省份确定模式
  const currentLayout = (() => {
    if (!form.province) return { mode: 'none', maxScore: 750 }
    if (form.province === 'SH') return { mode: 'shanghai', maxScore: 660 }
    if (['BJ', 'TJ'].includes(form.province)) return { mode: 'old', maxScore: 750 }
    return { mode: 'new', maxScore: 750 }
  })()

  const isShanghai = currentLayout.mode === 'shanghai'
  const showSubjects = currentLayout.mode === 'new'

  // 分数有效性校验
  const scoreNum = Number(form.score)
  const scoreValid = form.score !== '' && scoreNum >= 0 && scoreNum <= currentLayout.maxScore

  // 模式标签
  const modeLabel = {
    none:     null,
    shanghai: '上海模式（满分 660，赋分制）',
    old:      '老高考（满分 750，文理分科）',
    new:      '新高考 3+1+2（满分 750，选科）',
  }[currentLayout.mode]

  return (
    <div className="mica-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mica-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* ── Mica 标题栏 ── */}
        <div className="mica-header">
          <div className="mica-header__icon">
            <Sparkles size={18} />
          </div>
          <div className="mica-header__text">
            <h2 id="modal-title">填写成绩信息</h2>
            <p className="mica-header__subtitle">输入后自动计算全省位次</p>
          </div>
          <button className="mica-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mica-body">

          {/* ① 省份选择 */}
          <div className="mica-field">
            <label className="mica-label" htmlFor="province">
              <MapPin size={14} />
              所在省份
            </label>
            <select
              id="province"
              className="mica-select"
              value={form.province}
              onChange={handleProvinceChange}
              required
            >
              <option value="">请选择省份 →</option>
              {ALL_PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {/* 模式说明标签 */}
            {modeLabel && (
              <span className={`mica-mode-badge mica-mode-badge--${currentLayout.mode}`}>
                {modeLabel}
              </span>
            )}
          </div>

          {/* ② 总分输入 + 实时位次预览 */}
          <div className="mica-field">
            <label className="mica-label" htmlFor="score">
              <Hash size={14} />
              高考总分
              <span className="mica-hint">0 – {currentLayout.maxScore}</span>
            </label>
            <div className="mica-score-row">
              <input
                id="score"
                type="number"
                className={`mica-input mica-input--score ${!scoreValid && form.score !== '' ? 'mica-input--error' : ''}`}
                min={0}
                max={currentLayout.maxScore}
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                placeholder={`请输入（0 – ${currentLayout.maxScore}）`}
                required
              />
              {/* 实时位次预览气泡 */}
              {rankPreview && scoreValid && (
                <div className="mica-rank-preview">
                  <span className="mica-rank-preview__rank">
                    第 <strong>{rankPreview.rank.toLocaleString()}</strong> 名
                  </span>
                  <span className="mica-rank-preview__pct">
                    超过 {(100 - rankPreview.percentile).toFixed(1)}%
                  </span>
                  <span className="mica-rank-preview__hint">（速查估算）</span>
                </div>
              )}
              {!form.province && form.score && (
                <div className="mica-rank-preview mica-rank-preview--warn">
                  请先选择省份
                </div>
              )}
            </div>
          </div>

          {/* ③ 新高考：首选科目（3+1+2 模式专属） */}
          {showSubjects && (
            <div className="mica-field mica-field--animated">
              <label className="mica-label">
                <BookOpen size={14} />
                首选科目
                <span className="mica-badge-required">必填</span>
              </label>
              <div className="mica-radio-group">
                {FIRST_SUBJECT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`mica-radio-card ${form.firstSubject === opt.value ? 'mica-radio-card--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="firstSubject"
                      value={opt.value}
                      checked={form.firstSubject === opt.value}
                      onChange={(e) => setForm((f) => ({ ...f, firstSubject: e.target.value }))}
                      required={showSubjects}
                    />
                    <span className="mica-radio-card__icon">
                      {opt.value === 'physics' ? '⚗️' : '📜'}
                    </span>
                    <span className="mica-radio-card__label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ④ 新高考：再选科目 */}
          {showSubjects && (
            <div className="mica-field mica-field--animated">
              <label className="mica-label">
                <BookOpen size={14} />
                再选科目
                <span className="mica-hint">选 {form.optionals.length}/2 门</span>
              </label>
              <div className="mica-checkbox-group">
                {OPTIONAL_SUBJECT_OPTIONS.map((opt) => {
                  const checked = form.optionals.includes(opt.value)
                  const disabled = !checked && form.optionals.length >= 2
                  return (
                    <label
                      key={opt.value}
                      className={`mica-check-chip ${checked ? 'mica-check-chip--active' : ''} ${disabled ? 'mica-check-chip--disabled' : ''}`}
                    >
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={checked}
                        onChange={() => handleOptionalToggle(opt.value)}
                        disabled={disabled}
                      />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* ⑤ 上海模式提示 */}
          {isShanghai && (
            <div className="mica-info-box">
              <span>ℹ️</span>
              <span>上海采用赋分制，无物理/历史首选区分，请直接填写总分（满分 660）。</span>
            </div>
          )}

          {/* ⑥ 兴趣偏好 */}
          <div className="mica-field">
            <label className="mica-label">
              ✨ 兴趣偏好
              <span className="mica-hint">影响 AI 报告风格</span>
            </label>
            <div className="mica-tag-group">
              {INTEREST_OPTIONS.map((tag) => {
                const active = form.interests.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`mica-tag-pill ${active ? 'mica-tag-pill--active' : ''}`}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        interests: active
                          ? f.interests.filter((t) => t !== tag)
                          : [...f.interests, tag],
                      }))
                    }
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── 底部按钮区 ── */}
          <div className="mica-footer">
            <button type="button" className="mica-btn mica-btn--ghost" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="mica-btn mica-btn--primary"
              disabled={!form.province || !form.score || !scoreValid}
            >
              <Sparkles size={14} />
              确认并计算位次
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
