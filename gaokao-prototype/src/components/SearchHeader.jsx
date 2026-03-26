import { Search, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export function SearchHeader({ navItems, onOpenScoreModal }) {
  const navigate = useNavigate();

  return (
    <div className="search-header">
      <div className="search-header-content">
        <div className="bing-logo-search" onClick={() => navigate('/')}>
          <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
            <text x="0" y="24" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="600" fill="#0078D4">
              Bing
            </text>
          </svg>
        </div>

        <div className="search-box-container">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="搜索院校、专业、政策..."
              defaultValue="高考"
            />
            <button className="search-button">搜索</button>
          </div>
        </div>

        <button
          className="settings-button"
          onClick={onOpenScoreModal}
          title="设置/修改成绩"
        >
          <Settings size={18} />
        </button>
      </div>

      <nav className="flex items-center gap-6 px-6 max-w-[1600px] mx-auto font-['Plus_Jakarta_Sans'] text-sm font-medium tracking-tight mt-3 border-b border-gray-200/50">
        <a className="text-slate-500 dark:text-slate-400 hover:text-[#0078D4] pb-2 transition-all" href="#">All</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-[#0078D4] pb-2 transition-all" href="#">Images</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-[#0078D4] pb-2 transition-all" href="#">Videos</a>
        <a className="text-[#0078D4] dark:text-[#47A1EB] font-bold border-b-[3px] border-[#0078D4] pb-2 transition-all" href="#">Gaokao</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-[#0078D4] pb-2 transition-all" href="#">News</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-[#0078D4] pb-2 transition-all" href="#">Shopping</a>
        <a className="text-slate-500 dark:text-slate-400 hover:text-[#0078D4] pb-2 transition-all" href="#">More</a>
      </nav>
    </div>
  );
}
