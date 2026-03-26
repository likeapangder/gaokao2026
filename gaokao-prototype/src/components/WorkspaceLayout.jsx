/**
 * WorkspaceLayout.jsx — Workspace 模式独立布局
 * ─────────────────────────────────────────────────────────────
 * 此布局用于在 **新标签页** 打开的生产力页面（AI 报告、志愿表）。
 * 不含 Bing SERP 搜索条——这是一个沉浸式的独立 App 视图。
 *
 * Header 设计：
 *   [B] 必应高考  ·  页面标题            [← 返回搜索首页]
 */

import { useLocation } from 'react-router-dom'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import '../styles/search-page.css'

// ── 路由 → 页面标题 映射
const TITLE_MAP = {
  '/sheet':     { label: '我的志愿表',   icon: '📋' },
  '/ai-report': { label: 'AI 定制志愿报告', icon: '📊' },
}

function WorkspaceHeader({ pageLabel, pageIcon }) {
  const handleBack = () => {
    // 新标签页没有历史，直接用 opener 或跳首页
    if (window.opener && !window.opener.closed) {
      window.close()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <header className="workspace-app-header sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* 左侧：Logo + 品牌名 + 分隔 + 页面标题 */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Bing B 徽章 */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0078D4] flex items-center justify-center">
            <span
              className="text-white font-black text-base leading-none select-none"
              style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
            >
              B
            </span>
          </div>

          {/* 品牌名 */}
          <span className="font-bold text-[#0078D4] text-base tracking-tight hidden sm:inline">
            必应高考
          </span>

          {/* 分隔线 */}
          <span className="hidden sm:inline text-slate-300 font-light text-lg select-none">/</span>

          {/* 页面图标 + 标题 */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none">{pageIcon}</span>
            <h1 className="text-sm font-semibold text-slate-800 truncate">{pageLabel}</h1>
          </div>
        </div>

        {/* 右侧：关闭 / 返回 */}
        <button
          onClick={handleBack}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     text-slate-500 hover:text-[#0078D4] hover:bg-blue-50 border border-transparent
                     hover:border-blue-100 transition-all"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">返回搜索首页</span>
          <span className="sm:hidden">返回</span>
        </button>
      </div>
    </header>
  )
}

export default function WorkspaceLayout({ children, onOpenScoreModal }) {
  const location = useLocation()

  const pageInfo = TITLE_MAP[location.pathname] ?? { label: '工作台', icon: '🗂️' }

  return (
    <div className="workspace-page bg-[#F8F9FB] min-h-screen flex flex-col">
      <WorkspaceHeader pageLabel={pageInfo.label} pageIcon={pageInfo.icon} />

      {/* 主内容区 */}
      <main className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">
        {children}
      </main>

      {/* 版权页脚 */}
      <footer className="py-5 px-6 max-w-[1400px] mx-auto w-full border-t border-gray-200/50">
        <p className="text-xs text-slate-400 text-center">
          © 2026 必应高考 · 数据仅供参考，请以各省教育考试院官方发布信息为准
        </p>
      </footer>
    </div>
  )
}
