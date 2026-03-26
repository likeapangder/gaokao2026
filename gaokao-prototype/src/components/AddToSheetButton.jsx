/**
 * AddToSheetButton.jsx — "+ 加志愿" 购物车按钮
 *
 * Props:
 *   universityId   string  院校 ID
 *   universityName string  院校名称
 *   majorId        string  专业 ID（可选）
 *   majorName      string  专业名称（可选）
 *   province       string  院校省份
 *   type           string  院校类型（如"综合类"）
 *   category       string  院校层次/推荐分类（如"稳健"）
 *   onNavigateToSheet  fn  可选：加入后切换至志愿表 Tab
 */
import { useCallback, useMemo } from 'react'
import { Plus, Check } from 'lucide-react'
import { useCandidate } from '../context/CandidateContext.jsx'
import { useUI } from '../context/UIContext.jsx'

export default function AddToSheetButton({
  universityId,
  universityName,
  majorId = null,
  majorName = null,
  province = '',
  type = '',
  category = 'match',
  size = 'sm',      // 'sm' | 'xs'
  onNavigateToSheet,
}) {
  const { volunteerSheet, addToSheet } = useCandidate()
  const { showToast } = useUI()

  // 判断是否已加入
  const isAdded = useMemo(() => {
    return volunteerSheet.some(
      (v) => v.universityId === universityId && v.majorId === majorId
    )
  }, [volunteerSheet, universityId, majorId])

  // 判断是否已满
  const isFull = volunteerSheet.length >= 96

  const handleAdd = useCallback((e) => {
    e.stopPropagation() // 防止触发父级卡片的点击

    if (isAdded) {
      showToast('该志愿已在表中，无需重复添加', 'info')
      return
    }

    if (isFull) {
      showToast('⚠️ 志愿表已满（96/96），请先删除部分志愿后再添加', 'error')
      return
    }

    const item = {
      id: `${universityId}-${majorId ?? 'none'}-${Date.now()}`,
      universityId,
      universityName,
      majorId,
      majorName,
      province,
      type,
      category,
    }

    addToSheet(item)

    const seq = volunteerSheet.length + 1
    const location = majorName
      ? `${universityName} · ${majorName}`
      : universityName

    showToast(
      `✅ 已成功加入第 ${seq} 志愿：${location}。点击【我的志愿表】查看`,
      'success',
      4000
    )

    if (onNavigateToSheet) onNavigateToSheet()
  }, [
    isAdded, isFull, universityId, universityName,
    majorId, majorName, province, type, category,
    addToSheet, showToast, volunteerSheet.length, onNavigateToSheet,
  ])

  const isXs = size === 'xs'

  if (isAdded) {
    return (
      <button
        disabled
        className={`
          inline-flex items-center gap-1 flex-shrink-0
          ${isXs ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'}
          rounded-lg font-semibold cursor-not-allowed
          bg-slate-100 text-slate-400 border border-slate-200
        `}
        title="已加入志愿表"
      >
        <Check size={isXs ? 10 : 12} />
        已加入
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className={`
        inline-flex items-center gap-1 flex-shrink-0
        ${isXs ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'}
        rounded-lg font-semibold transition-all duration-150
        border border-[#0078D4]/30 text-[#0078D4]
        hover:bg-[#0078D4] hover:text-white hover:border-[#0078D4]
        active:scale-95
      `}
      title="加入我的志愿表"
    >
      <Plus size={isXs ? 10 : 12} />
      加志愿
    </button>
  )
}
