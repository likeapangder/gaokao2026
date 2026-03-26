/**
 * ToastContainer.jsx — 全局 Toast 提示容器
 * 挂载于页面右下角，监听 UIContext.toasts 状态
 * 通过 useUI().showToast(msg, type, duration) 触发
 */
import { useUI } from '../context/UIContext.jsx'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { createPortal } from 'react-dom'

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white',
    border: 'border-green-200',
    iconColor: 'text-green-500',
    bar: 'bg-green-400',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-white',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    bar: 'bg-red-400',
  },
  info: {
    icon: Info,
    bg: 'bg-white',
    border: 'border-blue-200',
    iconColor: 'text-[#0078D4]',
    bar: 'bg-[#0078D4]',
  },
}

function Toast({ toast, onDismiss }) {
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.success
  const Icon = cfg.icon

  return (
    <div
      className={`
        relative flex items-start gap-3 w-[340px] max-w-[90vw]
        ${cfg.bg} ${cfg.border} border rounded-xl shadow-lg shadow-black/10
        px-4 py-3 overflow-hidden
        animate-in slide-in-from-right-8 fade-in-0 duration-300
      `}
    >
      {/* 左侧彩色竖条 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-xl`} />

      {/* 图标 */}
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />

      {/* 文本 */}
      <p className="flex-1 text-sm text-slate-700 leading-snug">{toast.message}</p>

      {/* 关闭按钮 */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-0.5 rounded text-slate-300 hover:text-slate-500 transition-colors"
        aria-label="关闭提示"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useUI()

  if (toasts.length === 0) return null

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body
  )
}
