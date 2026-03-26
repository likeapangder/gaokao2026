import { useState } from 'react';
import {
  MapPin, Phone, Globe, Mail, Award, Users,
  Utensils, BookOpen, ChevronRight, Sparkles, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UniWikiPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { id: 'info', icon: '📋', label: '基本介绍' },
    { id: 'majors', icon: '🎓', label: '开设专业' },
    { id: 'scores', icon: '📈', label: '分数线' },
    { id: 'admission', icon: '👤', label: '招生计划' },
    { id: 'brochure', icon: '📄', label: '招生简章' },
    { id: 'career', icon: '💼', label: '毕业去向' },
  ];

  const similarSchools = [
    { rank: 1, name: '北京大学', location: '北京市', type: '综合类' },
    { rank: 2, name: '复旦大学', location: '上海市', type: '综合类' },
    { rank: 3, name: '上海交通大学', location: '上海市', type: '综合类' },
  ];

  const faqTags = [
    '如何考上清华？',
    '宿舍条件',
    '男女比例',
    '转专业政策',
    '奖学金',
    '姚班选拔',
  ];

  return (
    <>
      {/* Left Content Area (8 columns) */}
      <div className="space-y-6">
        {/* Entity Header Card */}
        <section className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-2">About 124,000,000 results — Academic Entity</p>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">清华大学</h1>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center p-1 overflow-hidden">
                  <img
                    alt="Tsinghua University Logo"
                    className="w-full h-full object-contain"
                    src="https://images.unsplash.com/photo-1562774053-701939374585?w=80&h=80&fit=crop"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">本科</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">公办</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">四年</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">985 211</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">综合类</span>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="flex overflow-x-auto gap-8 border-b border-slate-100 pb-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-2 pb-3 border-b-4 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-blue-600'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm font-semibold whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Contact Info Content */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">学校地址</p>
                  <p className="text-sm text-slate-900 font-medium leading-relaxed">北京市海淀区清华园1号</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">联系电话</p>
                  <p className="text-sm text-slate-900 font-medium">010-62782744 / 62770334</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Globe size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">官方网站</p>
                  <p className="text-sm text-blue-600 font-semibold truncate">https://www.tsinghua.edu.cn</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">招办邮箱</p>
                  <p className="text-sm text-slate-900 font-medium">zsb@tsinghua.edu.cn</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* University Gallery */}
        <div className="grid grid-cols-3 gap-4 h-64">
          <div className="col-span-2 rounded-2xl overflow-hidden relative group">
            <img
              alt="Tsinghua Campus"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&h=600&fit=crop"
            />
            <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
              校园风光
            </div>
          </div>
          <div className="col-span-1 space-y-4">
            <div className="h-[calc(50%-0.5rem)] rounded-2xl overflow-hidden">
              <img
                alt="Student Life"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop"
              />
            </div>
            <div className="h-[calc(50%-0.5rem)] rounded-2xl overflow-hidden">
              <img
                alt="Research Lab"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop"
              />
            </div>
          </div>
        </div>

        {/* Bento Style Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">学科评估 A+</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                清华大学在教育部全国学科评估中共有21个学科获得A+，位居全国高校前列。
              </p>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold transition-all">
                查看全部学科
              </button>
            </div>
            <Award size={100} className="absolute -bottom-4 -right-4 opacity-10" />
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">校园生活</h3>
            <div className="flex gap-4">
              <div className="flex-1 bg-white p-3 rounded-xl text-center">
                <p className="text-blue-600 text-xl font-bold">200+</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">学生社团</p>
              </div>
              <div className="flex-1 bg-white p-3 rounded-xl text-center">
                <p className="text-blue-600 text-xl font-bold">16</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">食堂餐厅</p>
              </div>
              <div className="flex-1 bg-white p-3 rounded-xl text-center">
                <p className="text-blue-600 text-xl font-bold">4.5M</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">藏书量</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Area (4 columns) - This will be placed in Layout's sidebar */}
    </>
  );
}

// Export sidebar component separately to be used in Layout
export function UniWikiSidebar() {
  const navigate = useNavigate();

  const similarSchools = [
    { rank: 1, name: '北京大学', location: '北京市', type: '综合类' },
    { rank: 2, name: '复旦大学', location: '上海市', type: '综合类' },
    { rank: 3, name: '上海交通大学', location: '上海市', type: '综合类' },
  ];

  const faqTags = [
    '如何考上清华？',
    '宿舍条件',
    '男女比例',
    '转专业政策',
    '奖学金',
    '姚班选拔',
  ];

  return (
    <div className="space-y-6">
      {/* My Gaokao Form Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 shadow-lg text-white group cursor-pointer hover:shadow-xl transition-shadow duration-300">
        {/* Sparkle Icon */}
        <div className="mb-8">
          <Sparkles size={40} className="opacity-50" />
        </div>
        {/* Content */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">我的高考志愿表</h2>
          <p className="text-white/80 text-lg">根据分数, 兴趣一键生成</p>
        </div>
        {/* White Button */}
        <div
          onClick={() => navigate('/volunteers')}
          className="bg-white rounded-full py-4 flex items-center justify-center gap-2 shadow-md group-hover:bg-slate-50 transition-colors"
        >
          <span className="text-blue-700 font-bold text-lg">立即生成</span>
          <ArrowRight size={24} className="text-blue-700 font-bold" />
        </div>
        {/* Decorative Circle Background Element */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* People Also Ask */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">大家都在问 | 清华大学</h2>
        <div className="flex flex-wrap gap-2">
          {faqTags.map((tag, idx) => (
            <button
              key={idx}
              className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-sm rounded-full transition-colors border border-transparent hover:border-blue-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Similar Schools */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">分数相近院校</h2>
        <div className="space-y-4">
          {similarSchools.map((school) => (
            <div
              key={school.rank}
              onClick={() => navigate('/wiki/uni')}
              className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold">
                {school.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {school.name}
                </p>
                <p className="text-xs text-slate-500">{school.location} | {school.type}</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all" />
            </div>
          ))}
        </div>
        <button className="w-full mt-6 py-2 text-blue-600 font-semibold text-sm hover:underline">
          查看更多对比
        </button>
      </div>
    </div>
  );
}
