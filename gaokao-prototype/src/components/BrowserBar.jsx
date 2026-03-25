import {
  Lock,
  RefreshCw,
  Star,
  MoreHorizontal,
} from "lucide-react";

export function BrowserBar() {
  return (
    <div className="browser-bar">
      <div className="browser-controls">
        <div className="traffic-lights">
          <span className="light red" />
          <span className="light yellow" />
          <span className="light green" />
        </div>

        <div className="browser-tabs">
          <div className="browser-tab active">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="tab-icon"
            >
              <path
                fill="currentColor"
                d="M8 2L10.5 6.5L15 7L11.5 10.5L12.5 15L8 12.5L3.5 15L4.5 10.5L1 7L5.5 6.5L8 2Z"
              />
            </svg>
            <span>高考 - Bing</span>
          </div>
          <div className="browser-tab">
            <span>+</span>
          </div>
        </div>
      </div>

      <div className="address-bar-container">
        <div className="address-bar">
          <Lock size={14} className="address-icon" />
          <span className="address-text">
            www.bing.com/search?q=高考
          </span>
          <div className="address-actions">
            <Star size={14} className="address-icon" />
            <RefreshCw size={14} className="address-icon" />
            <MoreHorizontal
              size={14}
              className="address-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
