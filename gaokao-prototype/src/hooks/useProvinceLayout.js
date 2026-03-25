/**
 * 必应高考 — useProvinceLayout Hook
 * 根据考生选定的省份，返回表单渲染配置
 */

/** 全国高考改革省份配置表 */
const PROVINCE_CONFIG = {
  // ── 老高考（总分750，不分首选/再选） ──
  BJ: { examType: 'old', showSubjects: false, maxScore: 750, label: '北京' },
  TJ: { examType: 'old', showSubjects: false, maxScore: 750, label: '天津' },
  // 上海满分660（150*3+150+60+60 = 150语数外 + 3门选考各70）实际为660
  SH: { examType: 'old', showSubjects: false, maxScore: 660, label: '上海' },

  // ── 3+1+2 新高考省份 ──
  JS: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '江苏' },
  SD: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '山东' },
  GD: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '广东' },
  HB: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '湖北' },
  HN: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '湖南' },
  FJ: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '福建' },
  CQ: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '重庆' },
  LN: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '辽宁' },
  ZJ: { examType: '3+1+2', showSubjects: true, maxScore: 750, label: '浙江' },
}

/** 3+1+2 首选科目选项 */
export const FIRST_SUBJECT_OPTIONS = [
  { value: 'physics', label: '物理' },
  { value: 'history', label: '历史' },
]

/** 3+1+2 再选科目选项（从 4 门中选 2 门） */
export const OPTIONAL_SUBJECT_OPTIONS = [
  { value: 'chemistry', label: '化学' },
  { value: 'biology',   label: '生物' },
  { value: 'geography', label: '地理' },
  { value: 'politics',  label: '政治' },
]

/** 所有省份列表（含有数据的省份） */
export const ALL_PROVINCES = Object.entries(PROVINCE_CONFIG).map(([id, cfg]) => ({
  id,
  label: cfg.label,
  examType: cfg.examType,
}))

/**
 * 根据省份代码返回表单布局配置
 * @param {string} provinceId
 * @returns {{
 *   examType: 'old' | '3+1+2',
 *   showSubjects: boolean,
 *   maxScore: number,
 *   label: string,
 *   firstSubjectOptions: Array,
 *   optionalSubjectOptions: Array,
 * }}
 */
export function useProvinceLayout(provinceId) {
  const config = PROVINCE_CONFIG[provinceId] ?? {
    examType: '3+1+2',
    showSubjects: true,
    maxScore: 750,
    label: provinceId,
  }

  return {
    ...config,
    firstSubjectOptions: config.showSubjects ? FIRST_SUBJECT_OPTIONS : [],
    optionalSubjectOptions: config.showSubjects ? OPTIONAL_SUBJECT_OPTIONS : [],
  }
}

export default useProvinceLayout
