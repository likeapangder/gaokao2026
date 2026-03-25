import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ClipboardList, FileText, BarChart3,
  MapPin, TrendingUp, Calendar, CheckCircle2,
  GraduationCap, Briefcase, Edit2, ChevronRight
} from 'lucide-react';
import { SerpFeatureCard } from './SerpFeatureCard';
import { useCandidate } from '../context/CandidateContext';
import { useUI } from '../context/UIContext';
import { PROVINCE_NAMES } from '../data/schemas';

// Mock data imports would go here, simplified for this component
const schools = [
  { name: '清华大学', logo: 'https://images.unsplash.com/photo-1703957752319-cb405c4cc860?w=80&h=80&fit=crop', tags: ['985', '211', '双一流'], bingDataTag: '2026招生简章上线' },
  { name: '北京大学', logo: 'https://images.unsplash.com/photo-1691758070205-ce12c9f6d6ed?w=80&h=80&fit=crop', tags: ['985', '211', '双一流'], bingDataTag: '就业概况图表已就绪' },
  { name: '复旦大学', logo: 'https://images.unsplash.com/photo-1719704964785-64cc5da1812c?w=80&h=80&fit=crop', tags: ['985', '211', '双一流'], bingDataTag: '2026招生简章上线' },
];

const majors = [
  { name: '计算机科学与技术', nameEn: 'Computer Science', logo: 'https://images.unsplash.com/photo-1614081989290-bcdba07cd9d3?w=80&h=80&fit=crop', prospects: '就业率 98.5%', salary: '平均薪资 ¥15,000', salaryTrend: [12000, 13500, 15000, 16200, 17800] },
  { name: '人工智能', nameEn: 'Artificial Intelligence', logo: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=80&h=80&fit=crop', prospects: '就业率 97.8%', salary: '平均薪资 ¥16,500', salaryTrend: [13000, 14800, 16500, 18000, 19500] },
  { name: '金融学', nameEn: 'Finance', logo: 'https://images.unsplash.com/photo-1632385820049-dd831eb2f41a?w=80&h=80&fit=crop', prospects: '就业率 96.2%', salary: '平均薪资 ¥13,800', salaryTrend: [11000, 12200, 13800, 14500, 15200] },
  { name: '临床医学', nameEn: 'Clinical Medicine', logo: 'https://images.unsplash.com/photo-1646913508331-5ef3f22ba677?w=80&h=80&fit=crop', prospects: '就业率 99.1%', salary: '平均薪资 ¥12,000', salaryTrend: [9500, 10500, 12000, 13000, 14200] },
];

export function SerpHomeCard() {
  const { score, province, rank, interests, setInterests } = useCandidate();
  const { openScoreModal } = useUI();
  const navigate = useNavigate();
  const [gradientRatio, setGradientRatio] = useState({ stretch: 20, match: 50, safety: 30 });
  const [activeTab, setActiveTab] = useState('dashboard');

  const provinceName = PROVINCE_NAMES[province] || '';

  const interestTags = ['科技硬核', '考公稳健', '数理基础', '人文社科', '医学方向', '艺术设计', '商科管理'];

  const toggleInterest = (tag) => {
    setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const tabs = [
    { id: 'dashboard', label: '核心面板' },
    { id: 'recommendations', label: '智能推荐' },
  ];

  return (
    <SerpFeatureCard
      title="高考志愿·全能方案"
      subtitle="Gaokao Volunteer Plan"
      onBack={null} // Hide back button on home card
      headerAction={
        <div className="solution-badge">
          <Sparkles size={16} />
          <span>Bing 高考助手</span>
        </div>
      }
      className="serp-home-card"
    >
      <div className="serp-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`serp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="serp-tab-content">
        {activeTab === 'dashboard' && (
          <div className="home-dashboard">
            <div className="solution-info">
              <div className="countdown-section">
                <Calendar size={16} className="info-icon" />
                <div className="countdown-content">
                  <span className="countdown-label">距离高考</span>
                  <span className="countdown-value">74天</span>
                </div>
                <div className="countdown-date">2026/6/7</div>
              </div>

              <div className="user-info-section">
                <MapPin size={14} className="user-info-icon" />
                <span className="user-info-text">{provinceName || '江苏'} · 物理类</span>
                <span className="user-info-divider">·</span>
                <TrendingUp size={14} className="user-info-icon score-icon" />
                <span className="user-info-score">{score || '597'}分</span>
                <span className="user-info-divider">·</span>
                <span className="user-info-rank">排名 {rank ? rank.toLocaleString() : '6,526'}</span>
                <button className="refine-profile-button" onClick={openScoreModal}>
                  <Edit2 size={12} />
                  修改档案
                </button>
              </div>
            </div>

            <div className="solution-modules">
              <div className="module-card primary" onClick={() => navigate('/recommendation')}>
                <div className="module-icon-wrapper"><Sparkles size={28} /></div>
                <div className="module-content">
                  <h3 className="module-title">智能选志愿</h3>
                  <p className="module-subtitle">Smart Selection</p>
                  <p className="module-description">AI 推荐最适合您的院校和专业</p>
                </div>
                <div className="module-badge">推荐</div>
              </div>
              <div className="module-card" onClick={() => navigate('/volunteers')}>
                <div className="module-icon-wrapper"><ClipboardList size={28} /></div>
                <div className="module-content">
                  <h3 className="module-title">我的志愿表</h3>
                  <p className="module-subtitle">Volunteer Sheet</p>
                  <p className="module-description">管理您的96个志愿填报</p>
                </div>
              </div>
              <div className="module-card" onClick={() => navigate('/ai-report')}>
                <div className="module-icon-wrapper"><FileText size={28} /></div>
                <div className="module-content">
                  <h3 className="module-title">AI志愿报告</h3>
                  <p className="module-subtitle">AI Report</p>
                  <p className="module-description">详细分析您的录取概率</p>
                </div>
              </div>
              <div className="module-card" onClick={() => navigate('/score-rank')}>
                <div className="module-icon-wrapper"><BarChart3 size={28} /></div>
                <div className="module-content">
                  <h3 className="module-title">一分一段</h3>
                  <p className="module-subtitle">Rank Table</p>
                  <p className="module-description">查询各分数段人数分布</p>
                </div>
              </div>
            </div>

            <div className="profile-controls-section">
              <div className="controls-header">
                <h3 className="controls-title">个性化配置</h3>
                <p className="controls-subtitle">Preferences</p>
              </div>
              <div className="interest-tags-section">
                <label className="control-label">兴趣方向</label>
                <div className="interest-tags">
                  {interestTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleInterest(tag)}
                      className={`interest-tag ${interests.includes(tag) ? 'active' : ''}`}
                    >
                      {interests.includes(tag) && <CheckCircle2 size={14} />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gradient-control-section">
                <div className="gradient-label-row">
                  <label className="control-label">志愿梯度配置</label>
                  <span className="gradient-subtitle">2:5:3 算法推荐</span>
                </div>
                <div className="gradient-visual">
                  <div className="gradient-bar">
                    <div className="gradient-segment stretch" style={{ width: `${gradientRatio.stretch}%` }}>
                      <span className="segment-label">冲 {gradientRatio.stretch}%</span>
                    </div>
                    <div className="gradient-segment match" style={{ width: `${gradientRatio.match}%` }}>
                      <span className="segment-label">稳 {gradientRatio.match}%</span>
                    </div>
                    <div className="gradient-segment safety" style={{ width: `${gradientRatio.safety}%` }}>
                      <span className="segment-label">保 {gradientRatio.safety}%</span>
                    </div>
                  </div>
                </div>
                <div className="gradient-presets">
                  <button onClick={() => setGradientRatio({ stretch: 20, match: 50, safety: 30 })} className={`preset-button ${gradientRatio.stretch === 20 ? 'active' : ''}`}>稳健型 2:5:3</button>
                  <button onClick={() => setGradientRatio({ stretch: 30, match: 50, safety: 20 })} className={`preset-button ${gradientRatio.stretch === 30 ? 'active' : ''}`}>进取型 3:5:2</button>
                  <button onClick={() => setGradientRatio({ stretch: 15, match: 50, safety: 35 })} className={`preset-button ${gradientRatio.stretch === 15 ? 'active' : ''}`}>保守型 1.5:5:3.5</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div className="recommendation-column">
              <div className="recommendation-header">
                <GraduationCap size={20} className="rec-icon" />
                <h3 className="recommendation-title">热门学校推荐</h3>
                <span className="recommendation-count">{schools.length}</span>
              </div>
              <div className="recommendation-list">
                {schools.map((school, index) => (
                  <div key={index} className="school-item" onClick={() => navigate('/school/1')}>
                    <div className="school-item-logo">
                      <img src={school.logo} alt={school.name} />
                    </div>
                    <div className="school-item-content">
                      <div className="school-item-name clickable">
                        {school.name}
                        <ChevronRight size={14} className="chevron-icon" />
                      </div>
                      <div className="school-item-tags">
                        {school.tags.map((tag, i) => <span key={i} className="school-tag">{tag}</span>)}
                      </div>
                      {school.bingDataTag && (
                        <div className="bing-data-tag"><CheckCircle2 size={12} />{school.bingDataTag}</div>
                      )}
                    </div>
                    <button className="item-action">查看</button>
                  </div>
                ))}
              </div>
              <button className="view-more-button" onClick={() => navigate('/wiki/uni')}>查看全部学校推荐 <TrendingUp size={14} /></button>
            </div>

            <div className="recommendation-column">
              <div className="recommendation-header">
                <Briefcase size={20} className="rec-icon" />
                <h3 className="recommendation-title">热门专业推荐</h3>
                <span className="recommendation-count">{majors.length}</span>
              </div>
              <div className="recommendation-list">
                {majors.map((major, index) => (
                  <div key={index} className="major-item" onClick={() => navigate('/major/1')}>
                    <div className="major-item-logo">
                      <img src={major.logo} alt={major.name} />
                    </div>
                    <div className="major-item-content">
                      <div className="major-item-name clickable">{major.name}</div>
                      <p className="major-item-name-en">{major.nameEn}</p>
                      <div className="major-item-stats">
                        <span className="major-stat">{major.prospects}</span>
                        <span className="major-stat-divider">·</span>
                        <span className="major-stat salary">{major.salary}</span>
                      </div>
                      <div className="salary-trend-mini">
                        {major.salaryTrend.map((value, i) => {
                          const maxValue = Math.max(...major.salaryTrend);
                          const height = (value / maxValue) * 100;
                          return <div key={i} className="trend-bar-mini" style={{ height: `${height}%` }} />;
                        })}
                      </div>
                    </div>
                    <button className="item-action">查看</button>
                  </div>
                ))}
              </div>
              <button className="view-more-button" onClick={() => navigate('/wiki/major')}>查看全部专业推荐 <TrendingUp size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </SerpFeatureCard>
  );
}
