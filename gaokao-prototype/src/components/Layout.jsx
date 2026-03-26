import { BrowserBar } from './BrowserBar'
import { SearchHeader } from './SearchHeader'
import { useLocation } from 'react-router-dom'
import { UniWikiSidebar } from '../pages/UniWikiPage'
import { MajorWikiSidebar } from '../pages/MajorWikiPage'
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

// Default Home Sidebar
function DefaultSidebar() {
  return (
    <>
      {/* Q&A Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm space-y-6 border border-slate-100">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold">高考问问</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-sm font-medium rounded-full transition-all text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200">
            如何选择学校
          </button>
          <button className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-sm font-medium rounded-full transition-all text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200">
            分数线预测
          </button>
          <button className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-sm font-medium rounded-full transition-all text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200">
            热门专业排名
          </button>
          <button className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-sm font-medium rounded-full transition-all text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200">
            省控线查询
          </button>
          <button className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-sm font-medium rounded-full transition-all text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200">
            滑档怎么办
          </button>
          <button className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-sm font-medium rounded-full transition-all text-slate-600 hover:text-blue-600 border border-transparent hover:border-blue-200">
            填报技巧
          </button>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <p className="text-xs text-slate-600 leading-relaxed italic">
            "AI 正准备为您生成个性化的志愿填报建议，请点击下方输入分数..."
          </p>
        </div>
      </section>

      {/* Recommended Reading Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1 mb-2 border-l-4 border-blue-600 pl-3">
          推荐阅读
        </h3>
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-blue-200 cursor-pointer">
          <div className="aspect-video relative overflow-hidden">
            <img
              alt="填报攻略"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-4 text-white font-bold text-sm">填报攻略</div>
          </div>
          <div className="p-4 space-y-2">
            <h4 className="font-bold text-base leading-tight">2026年高考志愿填报全流程详解</h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              从了解政策、筛选学校到正式提交，带你走好升学每一步，避开高分落榜陷阱...
            </p>
          </div>
        </div>
        <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-blue-200 cursor-pointer">
          <div className="aspect-video relative overflow-hidden">
            <img
              alt="专业分析"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-4 text-white font-bold text-sm">专业分析</div>
          </div>
          <div className="p-4 space-y-2">
            <h4 className="font-bold text-base leading-tight">未来十年就业前景最广阔的十大专业</h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              深入分析人工智能、生物医疗、新能源等领域的人才缺口与职业发展路径...
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Layout({ children, onOpenScoreModal }) {
  const location = useLocation();

  // Determine which sidebar to show based on route
  const getSidebar = () => {
    if (location.pathname.startsWith('/wiki/uni')) {
      return <UniWikiSidebar />;
    }
    if (location.pathname.startsWith('/wiki/major')) {
      return <MajorWikiSidebar />;
    }
    // Add more route-specific sidebars here as needed
    return <DefaultSidebar />;
  };

  // Determine grid columns based on route (Major page uses 7:3, others use 8:4)
  const isMajorPage = location.pathname.startsWith('/wiki/major');
  const mainColSpan = isMajorPage ? 'xl:col-span-7' : 'xl:col-span-8';
  const sidebarColSpan = isMajorPage ? 'xl:col-span-3' : 'xl:col-span-4';

  return (
    <div className="search-page bg-[#F8F9FB] min-h-screen">
      <BrowserBar />
      <SearchHeader navItems={NAV_ITEMS} onOpenScoreModal={onOpenScoreModal} />

      {/* ── 页面内容 ── */}
      <main className={`px-8 py-8 max-w-[1600px] mx-auto grid grid-cols-1 ${isMajorPage ? 'xl:grid-cols-10' : 'xl:grid-cols-12'} gap-8 items-start relative min-h-screen`}>
        {/* Left Column - Main Content */}
        <div className={`${mainColSpan} space-y-6`}>
          {children}
        </div>

        {/* Right Column - Dynamic Sidebar (sticky) */}
        <aside className={`${sidebarColSpan} sticky top-6 space-y-8 hidden xl:block`}>
          {getSidebar()}
        </aside>
      </main>

      {/* ── 底部版权 ── */}
      <footer className="solution-footer" style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px 32px' }}>
        <p className="footer-source">© 2026 必应高考 · 数据仅供参考，请以官方公布为准</p>
      </footer>
    </div>
  )
}
