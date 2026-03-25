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

      <div className="search-tabs">
        {navItems.map(({ to, label, enLabel }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `search-tab ${isActive ? 'active' : ''}`
            }
          >
            <span>{label}</span>
            {enLabel && <span className="tab-en">{enLabel}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
