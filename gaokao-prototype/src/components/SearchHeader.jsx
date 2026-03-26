import { Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';

/**
 * SearchHeader — Bing SERP 顶部搜索栏
 *
 * Props:
 *   onOpenScoreModal  — 打开成绩填写弹窗
 *   searchQuery       — 受控搜索框内容（由 Layout 传入，可被 GaokaoSerpContainer 联动更新）
 *   onSearch          — 用户主动搜索时的回调 (query: string) => void
 */
export function SearchHeader({ onOpenScoreModal, searchQuery = '高考', onSearch }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // 当 searchQuery 外部变更时，同步更新输入框显示值
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== searchQuery) {
      inputRef.current.value = searchQuery;
    }
  }, [searchQuery]);

  const handleSearch = () => {
    const query = inputRef.current?.value?.trim() || '';
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

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
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="搜索院校、专业、政策..."
              defaultValue={searchQuery}
              onKeyDown={handleKeyDown}
              aria-label="搜索框"
            />
            <button className="search-button" onClick={handleSearch}>搜索</button>
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
