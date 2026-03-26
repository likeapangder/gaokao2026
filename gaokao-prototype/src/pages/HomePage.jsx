import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidate } from '../context/CandidateContext';
import { useUI } from '../context/UIContext';
import { Sparkles, GraduationCap, ChevronRight, Newspaper, ExternalLink } from 'lucide-react';
import AgenticLoader from '../components/AgenticLoader';

export default function HomePage() {
  const navigate = useNavigate();
  const { openScoreModal } = useUI();
  const { score } = useCandidate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateVolunteers = () => {
    setIsGenerating(true);
  };

  const handleAgenticComplete = () => {
    setIsGenerating(false);
    navigate('/sheet');
  };

  const quickLinks = [
    { icon: '📋', label: '招生政策', color: 'blue', path: '/wiki/uni' },
    { icon: '🧠', label: '智能志愿填报', color: 'indigo', path: '/recommendation' },
    { icon: '📊', label: 'AI 志愿报告', color: 'purple', path: '/ai-report' },
    { icon: '🏛️', label: 'School', color: 'orange', path: '/wiki/uni' },
    { icon: '🔬', label: 'Major', color: 'emerald', path: '/wiki/major' },
    { icon: '📈', label: '一分一段', color: 'rose', path: '/score-rank' },
  ];

  const schools = [
    {
      name: '清华大学',
      logo: 'https://images.unsplash.com/photo-1703957752319-cb405c4cc860?w=80&h=80&fit=crop',
      tags: ['双一流', '985', '211'],
      score: '685+',
      location: '北京',
    },
    {
      name: '复旦大学',
      logo: 'https://images.unsplash.com/photo-1691758070205-ce12c9f6d6ed?w=80&h=80&fit=crop',
      tags: ['双一流', '985', '211'],
      score: '672+',
      location: '上海',
    },
    {
      name: '浙江大学',
      logo: 'https://images.unsplash.com/photo-1719704964785-64cc5da1812c?w=80&h=80&fit=crop',
      tags: ['双一流', '985', '211'],
      score: '668+',
      location: '杭州',
    },
  ];

  const majors = [
    { name: '人工智能 (AI)', category: '计算机科学与技术类' },
    { name: '临床医学', category: '医学类 / 八年制' },
    { name: '金融科技', category: '经济学类 / 复合型' },
  ];

  const newsItems = [
    {
      title: '教育部部署2026年普通高校招生工作',
      source: '教育部官网',
      date: '2026-03-20',
      summary: '教育部近日印发通知，部署做好2026年普通高校招生工作。通知要求，各地各校要坚持以人民为中心，全面深化改革，确保高考公平公正。',
      url: 'http://www.moe.gov.cn/jyb_xwfb/'
    },
    {
      title: '多省发布2026新高考改革实施方案解读',
      source: '中国教育在线',
      date: '2026-03-15',
      summary: '随着新高考改革的深入推进，多个省份发布了针对2026年高考的实施方案解读，重点关注选科要求和志愿填报模式的变化。',
      url: 'https://www.eol.cn/'
    },
    {
      title: '2026年强基计划招生简章陆续公布',
      source: '阳光高考平台',
      date: '2026-03-25',
      summary: '36所“双一流”建设高校的2026年强基计划招生简章已开始陆续发布，部分高校增加了招生专业和计划人数。',
      url: 'https://gaokao.chsi.com.cn/'
    },
    {
      title: '高考倒计时74天：备考策略与心理调节',
      source: '新浪教育',
      date: '2026-03-24',
      summary: '专家建议考生在最后冲刺阶段要回归课本，查漏补缺，同时注意调整作息，保持良好的心理状态。',
      url: 'https://edu.sina.com.cn/gaokao/'
    }
  ];

  return (
    <>
      {/* Hero Header Section */}
      <section className="bg-white p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              微软高考, <span className="text-blue-600">必赢高考</span>
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={openScoreModal}
                className="flex items-center gap-2 px-6 py-3 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all font-semibold shadow-sm active:scale-95"
              >
                <Sparkles size={20} />
                填入考生信息
              </button>
              <GraduationCap size={40} className="text-blue-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickLinks.map((link, idx) => (
          <div
            key={idx}
            onClick={() => navigate(link.path)}
            className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className={`text-4xl group-hover:scale-110 transition-transform`}>
              {link.icon}
            </div>
            <span className="text-sm font-semibold text-slate-700">{link.label}</span>
          </div>
        ))}
      </section>

      {/* Admissions Probability Bar */}
      <section className="bg-white p-8 rounded-2xl shadow-sm">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">录取概率阶梯</h3>
            <p className="text-xs text-slate-500 font-medium">根据您的预估分数进行科学分配</p>
          </div>
          <div className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-slate-600">
            志愿梯度分布分配
          </div>
        </div>
        <div className="h-6 w-full flex rounded-full overflow-hidden shadow-inner bg-slate-100">
          <div className="h-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all w-[20%] relative group">
            冲 20%
            <div className="absolute -top-10 bg-slate-800 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              高风险高收益
            </div>
          </div>
          <div className="h-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white transition-all w-[50%] relative group">
            稳 50%
            <div className="absolute -top-10 bg-slate-800 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              匹配意向院校
            </div>
          </div>
          <div className="h-full bg-slate-500 flex items-center justify-center text-[10px] font-bold text-white transition-all w-[30%] relative group">
            保 30%
            <div className="absolute -top-10 bg-slate-800 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              兜底安全策略
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs font-medium text-slate-700">激进型</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-xs font-medium text-slate-700">稳健型</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-xs font-medium text-slate-700">保守型</span>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Schools */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <GraduationCap size={20} className="text-blue-600" />
              推荐热门学校
            </h3>
            <button
              onClick={() => navigate('/wiki/uni')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {schools.map((school, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/wiki/uni')}
                className="flex items-center justify-between p-4 rounded-xl bg-white hover:bg-slate-50 transition-colors group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img alt={school.name} className="w-full h-full object-cover" src={school.logo} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{school.name}</div>
                    <div className="text-[10px] text-slate-500">{school.tags.join(' / ')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-600 font-bold text-sm">{school.score}</div>
                  <div className="text-[10px] text-slate-500">{school.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Majors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-orange-600">🔬</span>
              推荐热门专业
            </h3>
            <button
              onClick={() => navigate('/wiki/major')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {majors.map((major, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/wiki/major')}
                className="p-4 rounded-xl bg-white hover:bg-slate-50 transition-colors group cursor-pointer flex justify-between items-center shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900">{major.name}</span>
                  <span className="text-[10px] text-slate-500">{major.category}</span>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Newspaper size={20} className="text-blue-600" />
            最新高考资讯
          </h3>
          <span className="text-xs text-slate-500">
            来自 Bing Search · 实时更新
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsItems.map((news, idx) => (
            <a
              key={idx}
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-200 border border-transparent group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">
                  {news.source}
                </span>
                <span className="text-[10px] text-slate-400">{news.date}</span>
              </div>
              <h4 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                {news.title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {news.summary}
              </p>
              <div className="mt-3 flex items-center text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                阅读全文 <ExternalLink size={10} className="ml-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* General Search Results Section (SERP Style) */}
      <section className="space-y-8 mt-12 pt-8 border-t border-gray-200">
        {/* <h3 className="text-xl font-medium text-slate-800 mb-6">全网搜索结果</h3> */}

        {/* Result 1 */}
        <div className="group">
          <a href="#" className="text-sm text-slate-800 mb-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
              G
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Gaokao Direct</span>
              <span className="text-xs text-slate-500">https://www.gaokao.cn › policy › 2026</span>
            </div>
          </a>
          <a href="#" className="block group-hover:underline text-[#1a0dab] text-xl font-medium mb-2">
            2026年普通高等学校招生工作规定 - 教育部
          </a>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            ... <strong>2026年高考</strong>报名工作即将启动。为做好相关工作，教育部发布《关于做好<strong>2026年</strong>普通高校招生工作的通知》，明确了今年高考招生的各项政策规定 ... 重点关注综合评价招生改革 ...
          </p>
        </div>

        {/* Result 2 */}
        <div className="group">
          <a href="#" className="text-sm text-slate-800 mb-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
              Z
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Zhihu Discussions</span>
              <span className="text-xs text-slate-500">https://www.zhihu.com › question</span>
            </div>
          </a>
          <a href="#" className="block group-hover:underline text-[#1a0dab] text-xl font-medium mb-2">
            如何看待2026年新高考改革对理科生的影响？ - 知乎
          </a>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            ... 随着3+1+2模式的全面铺开，<strong>2026届</strong>理科考生面临着新的机遇与挑战。本文将从选科数据、专业覆盖率以及赋分制等角度进行深度解析 ... 物理类考生的竞争格局发生了显著变化 ...
          </p>
          <div className="mt-2 flex gap-3 text-xs text-slate-500">
            <span>2.3万 浏览</span>
            <span>·</span>
            <span>482 个回答</span>
          </div>
        </div>

        {/* Result 3 */}
        <div className="group">
          <a href="#" className="text-sm text-slate-800 mb-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-600">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-medium">NetEase Education</span>
              <span className="text-xs text-slate-500">https://edu.163.com › gaokao › guide</span>
            </div>
          </a>
          <a href="#" className="block group-hover:underline text-[#1a0dab] text-xl font-medium mb-2">
            【重磅】2026高考备考白皮书发布：十大关键时间点汇总
          </a>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            ... 距离<strong>2026年高考</strong>还有不到100天，网易教育联合多位特级教师发布《<strong>2026高考</strong>备考白皮书》。书中详细梳理了从现在起到高考结束的十大关键时间节点 ... 志愿填报准备工作应提前至3月启动 ...
          </p>
        </div>
      </section>

      {/* AgenticLoader */}
      <AgenticLoader isOpen={isGenerating} onComplete={handleAgenticComplete} />
    </>
  );
}
