import { useEffect, useState } from 'react'
import { X, ArrowLeft } from 'lucide-react'

export default function SerpFeatureCard({
  title,
  subtitleNodes,
  tabs,
  activeTab,
  onTabChange,
  children,
  onClose,
  onBack,
  showBack = false,
  isStacked = false, // 是否被压在底层
}) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 280)
  }

  const handleBack = () => {
    setIsClosing(true)
    setTimeout(onBack, 280)
  }

  return (
    <div
      className={`serp-card-overlay ${isClosing ? 'serp-card-closing' : ''} ${isStacked ? 'serp-card-stacked' : ''}`}
      onClick={handleClose}
    >
      <div
        className="serp-card-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部操作区 */}
        <div className="serp-card__actions">
          {showBack && (
            <button className="icon-btn" onClick={handleBack} aria-label="返回">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="spacer" />
          <button className="icon-btn" onClick={handleClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        {/* Header区 */}
        <div className="serp-card__header">
          <h2 className="serp-card__title">{title}</h2>
          {subtitleNodes && (
            <div className="serp-card__subtitle">{subtitleNodes}</div>
          )}
        </div>

        {/* Tab 栏 */}
        {tabs && tabs.length > 0 && (
          <div className="serp-card__tabs">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`serp-tab ${activeTab === id ? 'serp-tab--active' : ''}`}
                onClick={() => onTabChange && onTabChange(id)}
              >
                {Icon && <Icon size={16} strokeWidth={1.5} />}
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 内容渲染区 */}
        <div className="serp-card__body">
          {children}
        </div>
      </div>
    </div>
  )
}
