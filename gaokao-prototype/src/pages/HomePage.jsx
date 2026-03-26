/**
 * HomePage.jsx — SERP 模式首页
 * ─────────────────────────────────────────────────────────────
 * 架构角色：仅作为路由容器，将主体内容委托给 GaokaoSerpContainer。
 *
 * GaokaoSerpContainer 内含：
 *   • 顶部常驻 Quick Links Tabs（6个功能入口）
 *   • 动态内容插槽（原地切换 View）
 *   • 实体下钻联动（onEntityClick → 全局搜索框更新 + 路由跳转）
 *   • Workspace 外链跳转（招生政策 / AI 报告 → 新标签页）
 *
 * 一般性 SERP 结果（新闻流）保留在容器下方，作为普通搜索结果。
 */

import GaokaoSerpContainer from '../components/GaokaoSerpContainer.jsx'
import { useSearchQuery } from '../components/Layout.jsx'

// ── 普通 SERP 结果（静态 mock，模拟 Bing 网页结果流）
const SERP_RESULTS = [
  {
    id: 1,
    favicon: 'G',
    faviconBg: 'bg-slate-100',
    faviconColor: 'text-slate-600',
    siteName: 'Gaokao Direct',
    siteUrl: 'https://www.gaokao.cn › policy › 2026',
    title: '2026年普通高等学校招生工作规定 - 教育部',
    snippet: '... <strong>2026年高考</strong>报名工作即将启动。为做好相关工作，教育部发布《关于做好<strong>2026年</strong>普通高校招生工作的通知》，明确了今年高考招生的各项政策规定 ... 重点关注综合评价招生改革 ...',
    url: '#',
  },
  {
    id: 2,
    favicon: 'Z',
    faviconBg: 'bg-blue-50',
    faviconColor: 'text-blue-600',
    siteName: 'Zhihu Discussions',
    siteUrl: 'https://www.zhihu.com › question',
    title: '如何看待2026年新高考改革对理科生的影响？ - 知乎',
    snippet: '... 随着3+1+2模式的全面铺开，<strong>2026届</strong>理科考生面临着新的机遇与挑战。本文将从选科数据、专业覆盖率以及赋分制等角度进行深度解析 ... 物理类考生的竞争格局发生了显著变化 ...',
    meta: '2.3万 浏览 · 482 个回答',
    url: '#',
  },
  {
    id: 3,
    favicon: 'N',
    faviconBg: 'bg-red-50',
    faviconColor: 'text-red-600',
    siteName: 'NetEase Education',
    siteUrl: 'https://edu.163.com › gaokao › guide',
    title: '【重磅】2026高考备考白皮书发布：十大关键时间点汇总',
    snippet: '... 距离<strong>2026年高考</strong>还有不到100天，网易教育联合多位特级教师发布《<strong>2026高考</strong>备考白皮书》。书中详细梳理了从现在起到高考结束的十大关键节点 ... 志愿填报准备工作应提前至3月启动 ...',
    url: '#',
  },
]

function SerpResultItem({ result }) {
  return (
    <div className="group">
      <a href={result.url} className="text-sm text-slate-800 mb-1 flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full ${result.faviconBg} flex items-center justify-center text-xs font-bold ${result.faviconColor}`}>
          {result.favicon}
        </div>
        <div className="flex flex-col">
          <span className="font-medium">{result.siteName}</span>
          <span className="text-xs text-slate-500">{result.siteUrl}</span>
        </div>
      </a>
      <a
        href={result.url}
        className="block group-hover:underline text-[#1a0dab] text-xl font-medium mb-2"
        dangerouslySetInnerHTML={{ __html: result.title }}
      />
      <p
        className="text-sm text-slate-600 leading-relaxed max-w-3xl"
        dangerouslySetInnerHTML={{ __html: result.snippet }}
      />
      {result.meta && (
        <div className="mt-2 flex gap-3 text-xs text-slate-500">
          {result.meta.split(' · ').map((part, i) => (
            <span key={i}>{part}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  // 通过 Layout 的 SearchQueryContext 获取 setSearchQuery 函数
  // 当 GaokaoSerpContainer 触发实体点击时，通知全局搜索框同步
  let searchQueryCtx = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    searchQueryCtx = useSearchQuery()
  } catch {
    // 在 Storybook 等脱离 Layout 的环境中忽略
  }

  const handleSearchChange = (query) => {
    if (searchQueryCtx?.setSearchQuery) {
      searchQueryCtx.setSearchQuery(query)
    }
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          SERP Feature Card — Gaokao Vertical
          GaokaoSerpContainer 承载全部高考垂类功能
          ══════════════════════════════════════════════════════ */}
      <GaokaoSerpContainer onSearchChange={handleSearchChange} />

      {/* ══════════════════════════════════════════════════════
          普通 SERP 网页结果流
          ══════════════════════════════════════════════════════ */}
      <section className="space-y-8 mt-4 pt-6 border-t border-gray-200/60">
        {SERP_RESULTS.map((result) => (
          <SerpResultItem key={result.id} result={result} />
        ))}
      </section>
    </>
  )
}
