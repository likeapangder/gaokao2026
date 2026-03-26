import { useState } from 'react';
import { FileText, Building, TrendingUp, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MajorWikiPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schools');

  const tabs = [
    { id: 'overview', icon: FileText, label: '专业概况' },
    { id: 'schools', icon: Building, label: '开设院校' },
    { id: 'career', icon: TrendingUp, label: '就业前景' },
    { id: 'graduate', icon: GraduationCap, label: '研招信息' },
  ];

  const universities = [
    {
      name: '上海交通大学',
      logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=80&h=80&fit=crop',
      location: '上海',
      level: '本科',
      type: '公办',
      category: '综合类',
      rating: 'A+',
    },
    {
      name: '华中科技大学',
      logo: 'https://images.unsplash.com/photo-1703957752319-cb405c4cc860?w=80&h=80&fit=crop',
      location: '武汉',
      level: '本科',
      type: '公办',
      category: '理工类',
      rating: 'A+',
    },
    {
      name: '电子科技大学',
      logo: 'https://images.unsplash.com/photo-1691758070205-ce12c9f6d6ed?w=80&h=80&fit=crop',
      location: '成都',
      level: '本科',
      type: '公办',
      category: '理工类',
      rating: 'A+',
    },
  ];

  return (
    <>
      {/* Left Content Area (7 columns) */}
      <div className="space-y-8">
        {/* Meta Info */}
        <div className="flex items-center text-xs text-slate-500 font-medium">
          <span>About 1,240,000 results — (0.42 seconds)</span>
        </div>

        {/* Entity Header */}
        <header className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">计算机科学与技术</h1>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>本科</span>
            <div className="w-px h-4 bg-slate-300"></div>
            <span>四年</span>
            <div className="w-px h-4 bg-slate-300"></div>
            <span>理科学士</span>
          </div>
        </header>

        {/* Major Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-4 border-blue-600 font-bold'
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Universities List */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 tracking-wider uppercase">
            <span>院校</span>
            <span>专业评级</span>
          </div>

          {/* University Cards */}
          {universities.map((uni, idx) => (
            <div
              key={idx}
              onClick={() => navigate('/wiki/uni')}
              className="group p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                  <img alt={`${uni.name} Logo`} className="w-12 h-12 object-contain" src={uni.logo} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {uni.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-tight">
                      {uni.location}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-tight">
                      {uni.level}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-tight">
                      {uni.type}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-tight">
                      {uni.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-orange-600">{uni.rating}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Pagination */}
        <nav className="flex items-center justify-center gap-2 pt-8">
          <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            Last
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20">
            1
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors font-medium">
            2
          </button>
          <span className="px-2 text-slate-500">...</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors font-medium">
            94
          </button>
          <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            Next
          </button>
        </nav>
      </div>
    </>
  );
}

// Export sidebar component for Major page
export function MajorWikiSidebar() {
  const navigate = useNavigate();

  const faqTags = ['就业方向', '薪资待遇', '大学排名', '考研难度', '男女比例', '课程设置'];

  return (
    <div className="space-y-8">
      {/* CTA Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <Sparkles size={40} className="opacity-50" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">我的高考志愿表</h2>
            <p className="text-white/80 text-sm">根据分数, 兴趣一键生成</p>
          </div>
          <button
            onClick={() => navigate('/volunteers')}
            className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <span>立即生成</span>
            <ArrowRight size={20} />
          </button>
        </div>
        {/* Decorative Circle */}
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* People Also Ask */}
      <div className="space-y-6 p-6 bg-slate-50 rounded-2xl">
        <div className="flex items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2 break-words">
            大家都在问 <span className="text-slate-300 font-light text-2xl mx-1">|</span> 计算机科学与技术
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {faqTags.map((tag, idx) => (
            <button
              key={idx}
              className="px-4 py-2 bg-white text-slate-600 text-sm font-medium rounded-full border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Image Card */}
      <div className="relative group cursor-pointer overflow-hidden rounded-2xl">
        <img
          alt="Campus Life"
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <div className="text-white space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Featured</span>
            <h4 className="font-bold">探索你的学术潜力</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
