import { BrowserBar } from './BrowserBar'
import { SearchHeader } from './SearchHeader'
import '../styles/search-page.css'

const NAV_ITEMS = [
  { to: '/',              label: '首页',       enLabel: 'Home' },
  { to: '/recommendation', label: '志愿推荐',  enLabel: 'Recommend' },
  { to: '/volunteers',    label: '我的志愿表', enLabel: 'My Sheet' },
  { to: '/ai-report',     label: 'AI 报告',   enLabel: 'Report' },
  { to: '/wiki/uni',      label: '查大学',     enLabel: 'University' },
  { to: '/wiki/major',    label: '查专业',     enLabel: 'Major' },
  { to: '/score-rank',    label: '一分一段',   enLabel: 'Rank' },
]

export default function Layout({ children, onOpenScoreModal }) {
  return (
    <div className="search-page">
      <BrowserBar />
      <SearchHeader navItems={NAV_ITEMS} onOpenScoreModal={onOpenScoreModal} />

      {/* ── 页面内容 ── */}
      <main className="search-content">
        <div className="search-main">
          {children}
        </div>

        <aside className="search-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">高考相关</h3>
            <div className="sidebar-links">
              <a href="#" className="sidebar-link">高考倒计时</a>
              <a href="#" className="sidebar-link">历年真题</a>
              <a href="#" className="sidebar-link">考试大纲</a>
              <a href="#" className="sidebar-link">招生简章</a>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">热门话题</h3>
            <div className="sidebar-links">
              <a href="#" className="sidebar-link">新高考改革</a>
              <a href="#" className="sidebar-link">强基计划</a>
              <a href="#" className="sidebar-link">综合评价</a>
            </div>
          </div>
        </aside>
      </main>

      {/* ── 底部版权 ── */}
      <footer className="solution-footer" style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px 32px' }}>
        <p className="footer-source">© 2026 必应高考 · 数据仅供参考，请以官方公布为准</p>
      </footer>
    </div>
  )
}
