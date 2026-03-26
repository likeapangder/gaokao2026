import { createContext, useContext, useState, useCallback } from 'react'

/**
 * UIContext — 管理全局 UI 状态（如弹窗开关）
 * 与 CandidateContext 分离，避免数据状态与 UI 状态混杂
 *
 * openScoreModal({ expanded: true }) → 打开弹窗时偏好矩阵默认展开
 * openScoreModal()                   → 默认折叠（渐进式折叠交互）
 */
const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [scoreModalOpen, setScoreModalOpen] = useState(false)
  // 当 AI 报告页面等需要完整表单时，传入 { expanded: true }
  const [scoreModalInitialExpanded, setScoreModalInitialExpanded] = useState(false)

  const openScoreModal = useCallback((opts) => {
    setScoreModalInitialExpanded(opts?.expanded === true)
    setScoreModalOpen(true)
  }, [])

  const closeScoreModal = useCallback(() => {
    setScoreModalOpen(false)
    setScoreModalInitialExpanded(false)
  }, [])

  return (
    <UIContext.Provider value={{ scoreModalOpen, scoreModalInitialExpanded, openScoreModal, closeScoreModal }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
