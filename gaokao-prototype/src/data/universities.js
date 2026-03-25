/**
 * 必应高考 — 大学 Mock 数据（20+ 所）
 * rank_history 包含 2023/2024/2025 三年最低录取位次，供算法使用
 */

export const universities = [
  // ── 顶尖 985 ──────────────────────────────────────────────
  {
    id: 'PKU', code: '10001', name: '北京大学',
    province: '北京', type: '综合',
    rank_history: [
      { year: 2023, minScore: 688, minRank: 412 },
      { year: 2024, minScore: 690, minRank: 398 },
      { year: 2025, minScore: 691, minRank: 385 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '全国前2'],
    bing_news_hook: '北京大学 招生 2026',
  },
  {
    id: 'THU', code: '10003', name: '清华大学',
    province: '北京', type: '理工',
    rank_history: [
      { year: 2023, minScore: 690, minRank: 387 },
      { year: 2024, minScore: 692, minRank: 371 },
      { year: 2025, minScore: 693, minRank: 360 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '全国前2'],
    bing_news_hook: '清华大学 招生 2026',
  },
  {
    id: 'FDU', code: '10246', name: '复旦大学',
    province: '上海', type: '综合',
    rank_history: [
      { year: 2023, minScore: 672, minRank: 1820 },
      { year: 2024, minScore: 675, minRank: 1750 },
      { year: 2025, minScore: 676, minRank: 1680 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '华东五校'],
    bing_news_hook: '复旦大学 招生 2026',
  },
  {
    id: 'SJTU', code: '10248', name: '上海交通大学',
    province: '上海', type: '理工',
    rank_history: [
      { year: 2023, minScore: 670, minRank: 2100 },
      { year: 2024, minScore: 673, minRank: 1980 },
      { year: 2025, minScore: 674, minRank: 1890 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '华东五校'],
    bing_news_hook: '上海交通大学 招生 2026',
  },
  {
    id: 'ZJU', code: '10335', name: '浙江大学',
    province: '浙江', type: '综合',
    rank_history: [
      { year: 2023, minScore: 664, minRank: 3200 },
      { year: 2024, minScore: 667, minRank: 3050 },
      { year: 2025, minScore: 668, minRank: 2920 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '华东五校'],
    bing_news_hook: '浙江大学 招生 2026',
  },
  {
    id: 'NJU', code: '10284', name: '南京大学',
    province: '江苏', type: '综合',
    rank_history: [
      { year: 2023, minScore: 658, minRank: 5100 },
      { year: 2024, minScore: 660, minRank: 4900 },
      { year: 2025, minScore: 661, minRank: 4750 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '华东五校'],
    bing_news_hook: '南京大学 招生 2026',
  },

  // ── 强势 985 ──────────────────────────────────────────────
  {
    id: 'USTC', code: '10358', name: '中国科学技术大学',
    province: '安徽', type: '理工',
    rank_history: [
      { year: 2023, minScore: 655, minRank: 6200 },
      { year: 2024, minScore: 658, minRank: 5950 },
      { year: 2025, minScore: 659, minRank: 5720 },
    ],
    tags: ['985', '211', '双一流', 'C9'],
    level_tags: ['顶尖985', '强势理工'],
    bing_news_hook: '中国科学技术大学 招生 2026',
  },
  {
    id: 'WUHAN', code: '10486', name: '武汉大学',
    province: '湖北', type: '综合',
    rank_history: [
      { year: 2023, minScore: 648, minRank: 9800 },
      { year: 2024, minScore: 651, minRank: 9400 },
      { year: 2025, minScore: 652, minRank: 9050 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['强势985'],
    bing_news_hook: '武汉大学 招生 2026',
  },
  {
    id: 'HIT', code: '10213', name: '哈尔滨工业大学',
    province: '黑龙江', type: '理工',
    rank_history: [
      { year: 2023, minScore: 645, minRank: 11200 },
      { year: 2024, minScore: 648, minRank: 10700 },
      { year: 2025, minScore: 649, minRank: 10300 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['强势985', '顶尖理工'],
    bing_news_hook: '哈尔滨工业大学 招生 2026',
  },
  {
    id: 'SYSU', code: '10558', name: '中山大学',
    province: '广东', type: '综合',
    rank_history: [
      { year: 2023, minScore: 641, minRank: 14300 },
      { year: 2024, minScore: 644, minRank: 13700 },
      { year: 2025, minScore: 645, minRank: 13200 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['强势985'],
    bing_news_hook: '中山大学 招生 2026',
  },
  {
    id: 'TONGJI', code: '10247', name: '同济大学',
    province: '上海', type: '理工',
    rank_history: [
      { year: 2023, minScore: 638, minRank: 17500 },
      { year: 2024, minScore: 641, minRank: 16800 },
      { year: 2025, minScore: 642, minRank: 16200 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['强势985', '建筑名校'],
    bing_news_hook: '同济大学 招生 2026',
  },
  {
    id: 'BIT', code: '10007', name: '北京理工大学',
    province: '北京', type: '理工',
    rank_history: [
      { year: 2023, minScore: 630, minRank: 23100 },
      { year: 2024, minScore: 633, minRank: 22300 },
      { year: 2025, minScore: 634, minRank: 21600 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['强势985', '国防特色'],
    bing_news_hook: '北京理工大学 招生 2026',
  },

  // ── 优质 211 ──────────────────────────────────────────────
  {
    id: 'BNU', code: '10027', name: '北京师范大学',
    province: '北京', type: '师范',
    rank_history: [
      { year: 2023, minScore: 625, minRank: 28500 },
      { year: 2024, minScore: 628, minRank: 27600 },
      { year: 2025, minScore: 629, minRank: 26800 },
    ],
    tags: ['211', '双一流'],
    level_tags: ['顶尖211', '师范名校'],
    bing_news_hook: '北京师范大学 招生 2026',
  },
  {
    id: 'WHU_TECH', code: '10497', name: '武汉理工大学',
    province: '湖北', type: '理工',
    rank_history: [
      { year: 2023, minScore: 598, minRank: 52000 },
      { year: 2024, minScore: 601, minRank: 50200 },
      { year: 2025, minScore: 602, minRank: 48700 },
    ],
    tags: ['211', '双一流'],
    level_tags: ['211'],
    bing_news_hook: '武汉理工大学 招生 2026',
  },
  {
    id: 'ECNU', code: '10269', name: '华东师范大学',
    province: '上海', type: '师范',
    rank_history: [
      { year: 2023, minScore: 618, minRank: 33400 },
      { year: 2024, minScore: 621, minRank: 32100 },
      { year: 2025, minScore: 622, minRank: 31000 },
    ],
    tags: ['211', '双一流'],
    level_tags: ['优质211', '华东名校'],
    bing_news_hook: '华东师范大学 招生 2026',
  },
  {
    id: 'DLUT', code: '10141', name: '大连理工大学',
    province: '辽宁', type: '理工',
    rank_history: [
      { year: 2023, minScore: 612, minRank: 38200 },
      { year: 2024, minScore: 615, minRank: 36900 },
      { year: 2025, minScore: 616, minRank: 35700 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['985'],
    bing_news_hook: '大连理工大学 招生 2026',
  },
  {
    id: 'SCUEC', code: '10531', name: '湖南大学',
    province: '湖南', type: '综合',
    rank_history: [
      { year: 2023, minScore: 620, minRank: 31800 },
      { year: 2024, minScore: 623, minRank: 30700 },
      { year: 2025, minScore: 624, minRank: 29700 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['985'],
    bing_news_hook: '湖南大学 招生 2026',
  },

  // ── 双非特色 ──────────────────────────────────────────────
  {
    id: 'SWUFE', code: '10651', name: '西南财经大学',
    province: '四川', type: '财经',
    rank_history: [
      { year: 2023, minScore: 595, minRank: 55500 },
      { year: 2024, minScore: 598, minRank: 53700 },
      { year: 2025, minScore: 599, minRank: 52100 },
    ],
    tags: ['211', '双一流'],
    level_tags: ['211', '财经特色'],
    bing_news_hook: '西南财经大学 招生 2026',
  },
  {
    id: 'SHUFE', code: '10272', name: '上海财经大学',
    province: '上海', type: '财经',
    rank_history: [
      { year: 2023, minScore: 630, minRank: 22700 },
      { year: 2024, minScore: 633, minRank: 21900 },
      { year: 2025, minScore: 634, minRank: 21200 },
    ],
    tags: ['211', '双一流'],
    level_tags: ['211', '财经顶尖'],
    bing_news_hook: '上海财经大学 招生 2026',
  },
  {
    id: 'BJTU', code: '10004', name: '北京交通大学',
    province: '北京', type: '理工',
    rank_history: [
      { year: 2023, minScore: 608, minRank: 41200 },
      { year: 2024, minScore: 611, minRank: 39800 },
      { year: 2025, minScore: 612, minRank: 38500 },
    ],
    tags: ['211', '双一流'],
    level_tags: ['211', '交通特色'],
    bing_news_hook: '北京交通大学 招生 2026',
  },
  {
    id: 'NWPU', code: '10699', name: '西北工业大学',
    province: '陕西', type: '理工',
    rank_history: [
      { year: 2023, minScore: 622, minRank: 30100 },
      { year: 2024, minScore: 625, minRank: 29000 },
      { year: 2025, minScore: 626, minRank: 28100 },
    ],
    tags: ['985', '211', '双一流'],
    level_tags: ['985', '航空航天'],
    bing_news_hook: '西北工业大学 招生 2026',
  },
]

export default universities
