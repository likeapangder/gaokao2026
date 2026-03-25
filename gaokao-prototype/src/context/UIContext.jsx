import { createContext, useContext, useState, useCallback } from 'react'

/**
 * UIContext — 管理全局 UI 状态（如弹窗开关）
 * 与 CandidateContext 分离，避免数据状态与 UI 状态混杂
 */
const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [scoreModalOpen, setScoreModalOpen] = useState(false)

  const openScoreModal  = useCallback(() => setScoreModalOpen(true),  [])
  const closeScoreModal = useCallback(() => setScoreModalOpen(false), [])

  return (
    <UIContext.Provider value={{ scoreModalOpen, openScoreModal, closeScoreModal }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
