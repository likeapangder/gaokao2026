import { BrowserBar } from './BrowserBar'
import { SearchHeader } from './SearchHeader'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import '../styles/search-page.css'

const NAV_ITEMS = [
  { to: '/',              label: '首页',       enLabel: 'Home' },
  { to: '/recommendation', label: '志愿推荐',  enLabel: 'Recommend' },
  { to: '/sheet',         label: '我的志愿表', enLabel: 'My Sheet' },
  { to: '/ai-report',     label: 'AI 报告',   enLabel: 'Report' },
  { to: '/wiki/uni',      label: '查大学',     enLabel: 'University' },
  { to: '/wiki/major',    label: '查专业',     enLabel: 'Major' },
  { to: '/score-rank',    label: '一分一段',   enLabel: 'Rank' },
]

export default function WorkspaceLayout({ children, onOpenScoreModal }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine page title based on route
  const getPageTitle = () => {
    if (location.pathname.startsWith('/sheet')) return '我的志愿表';
    if (location.pathname.startsWith('/ai-report')) return 'AI 定制报告';
    return '工作台';
  };

  return (
    <div className="search-page bg-[#F8F9FB] min-h-screen">
      <BrowserBar />
      <SearchHeader navItems={NAV_ITEMS} onOpenScoreModal={onOpenScoreModal} />

      {/* Breadcrumb Navigation */}
      <div className="max-w-[1400px] mx-auto px-8 pt-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          返回搜索首页
        </button>
      </div>

      {/* Main Workspace Content - Full Width Layout */}
      <main className="px-8 py-6 max-w-[1400px] mx-auto min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{getPageTitle()}</h1>
        </div>
        {children}
      </main>

      {/* Footer */}
      <footer className="solution-footer" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 32px' }}>
        <p className="footer-source">© 2026 必应高考 · 数据仅供参考，请以官方公布为准</p>
      </footer>
    </div>
  )
}
