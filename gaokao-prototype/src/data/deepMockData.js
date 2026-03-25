/**
 * 必应高考 — 深度 Mock 数据（50 所大学 + 100 个专业）
 *
 * 为学校卡 6-Tab 和专业卡 4-Tab 提供完整数据支持
 */

import { mockSchools } from './mockSchools.js'
import { majors } from './majors.js'

// ═══════════════════════════════════════════════════════════════
//  辅助函数
// ═══════════════════════════════════════════════════════════════

/** 生成分省录取线（近3年 × 3个重点省份） */
function generateAdmissionLines(baseRank, provinces = ['BJ', 'JS', 'GD']) {
  const lines = []
  for (const province of provinces) {
    // 各省位次差异：北京 -10%，江苏 +0%，广东 +5%
    const delta = province === 'BJ' ? 0.9 : province === 'GD' ? 1.05 : 1.0
    for (let year = 2023; year <= 2025; year++) {
      const rank = Math.round(baseRank * delta * (year === 2023 ? 1.08 : year === 2024 ? 1.04 : 1.0))
      const score = 750 - Math.round(rank / 100) // 简化分数映射
      const planCount = Math.round(80 + Math.random() * 40)
      lines.push({ year, province, minScore: score, minRank: rank, planCount })
    }
  }
  return lines
}

/** 生成招生计划（近3年 × 3省 × 2专业组） */
function generateEnrollmentPlan(provinces = ['BJ', 'JS', 'GD']) {
  const plan = []
  const groups = ['理工类', '人文社科类']
  for (let year = 2023; year <= 2025; year++) {
    for (const province of provinces) {
      for (const group of groups) {
        const count = Math.round(30 + Math.random() * 50)
        plan.push({ year, province, majorGroup: group, count })
      }
    }
  }
  return plan
}

/** 生成就业去向分布（按院校层次分配） */
function generateCareerOutcome(tier) {
  const base = tier === 'top' ? { employ: 96, study: 38, salary: 14000 } :
               tier === 'mid' ? { employ: 94, study: 25, salary: 10000 } :
               { employ: 92, study: 15, salary: 8000 }

  return {
    employRate: base.employ + (Math.random() - 0.5) * 2,
    furtherStudyRate: base.study + (Math.random() - 0.5) * 5,
    avgSalary: base.salary + Math.round((Math.random() - 0.5) * 2000),
    topEmployers: tier === 'top' ? ['华为', '腾讯', '字节', '阿里'] :
                  tier === 'mid' ? ['中兴', '京东', '美团', '网易'] :
                  ['地方国企', '事业单位', '中小企业'],
    distribution: [
      { name: '互联网', value: tier === 'top' ? 35 : tier === 'mid' ? 28 : 20 },
      { name: '国企/央企', value: tier === 'top' ? 20 : tier === 'mid' ? 30 : 35 },
      { name: '升学', value: Math.round(base.study * 0.6) },
      { name: '政府/事业', value: tier === 'top' ? 8 : tier === 'mid' ? 12 : 18 },
      { name: '其他', value: 10 },
    ],
  }
}

// ═══════════════════════════════════════════════════════════════
//  50 所大学（从 mockSchools 前 50 条扩展）
// ═══════════════════════════════════════════════════════════════

export const deepSchools = mockSchools.slice(0, 50).map((school, idx) => {
  const baseRank = school.rank_history[2].minRank // 2025年位次
  const tier = baseRank < 15000 ? 'top' : baseRank < 40000 ? 'mid' : 'low'

  // 按院校类型分配开设专业
  const offeredMajorIds = []
  if (school.type === '理工' || school.type === '综合') {
    offeredMajorIds.push('CS', 'AI', 'SE', 'EE', 'ME', 'DATASCI', 'MATH', 'PHYS')
  }
  if (school.type === '综合' || school.type === '师范') {
    offeredMajorIds.push('CHINESE', 'EDUC', 'PSYCH', 'LAW')
  }
  if (school.type === '财经' || school.type === '综合') {
    offeredMajorIds.push('FIN', 'ECON', 'ACCT', 'MBA_UG')
  }
  if (school.type === '医学' || school.tags.includes('医学强校')) {
    offeredMajorIds.push('CLINIC', 'PHARM', 'NURS')
  }
  if (tier === 'top') {
    offeredMajorIds.push('INTL_REL', 'JOURNAL', 'ARCH')
  }

  return {
    ...school,

    // Tab 2: 开设专业
    offeredMajorIds,

    // Tab 3: 历年分数线
    admissionLines: generateAdmissionLines(baseRank),

    // Tab 4: 招生计划
    enrollmentPlan: generateEnrollmentPlan(),

    // Tab 5: 招生简章
    admissionBrief: {
      year: 2026,
      highlights: [
        { label: '计划招生', value: `${Math.round(2000 + Math.random() * 2000)}人` },
        { label: '学费/年', value: tier === 'top' ? '5500元' : tier === 'mid' ? '5000元' : '4800元' },
        { label: '奖学金覆盖', value: `${Math.round(30 + Math.random() * 20)}%` },
      ],
      content: `${school.name}创建于20世纪初，是国家重点建设的高水平大学。学校坚持立德树人根本任务，培养德智体美劳全面发展的社会主义建设者和接班人。\n\n2026年本科招生计划面向全国31个省（区、市）及港澳台地区，按大类招生与专业招生相结合。优秀新生可申请转专业、进入荣誉学院或参与拔尖计划。\n\n学校设立完善的奖助学金体系，覆盖面达40%以上，确保每一位学生不因家庭经济困难而失学。`,
      bingSearchUrl: `https://cn.bing.com/search?q=${encodeURIComponent(school.name + ' 2026招生简章')}`,
    },

    // Tab 6: 毕业去向
    careerOutcome: generateCareerOutcome(tier),
  }
})

// ═══════════════════════════════════════════════════════════════
//  100 个专业（扩展现有 majors.js 到 100 个）
// ═══════════════════════════════════════════════════════════════

// 新增 68 个专业（现有 32 + 新增 68 = 100）
const newMajors = [
  // 工学补充
  { id: 'AERO', code: '082001', name: '飞行器设计与工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '航空航天、国防军工，技术壁垒高，薪资待遇优厚。',
    bing_wiki_link: 'https://cn.bing.com/search?q=飞行器设计与工程+专业介绍' },

  { id: 'AUTO', code: '080207', name: '车辆工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '新能源汽车风口，比亚迪/特斯拉等企业需求旺盛。',
    bing_wiki_link: 'https://cn.bing.com/search?q=车辆工程+专业介绍' },

  { id: 'MATERIAL', code: '080401', name: '材料科学与工程', category: '工学',
    subject_requirement: { required: ['physics', 'chemistry'], optional: [] },
    job_prospects: '新材料产业，深造率高，芯片/电池/复合材料方向前景好。',
    bing_wiki_link: 'https://cn.bing.com/search?q=材料科学与工程+专业介绍' },

  { id: 'CHEM_ENG', code: '081301', name: '化学工程与工艺', category: '工学',
    subject_requirement: { required: ['chemistry'], optional: ['physics'] },
    job_prospects: '石化、制药、新能源行业，国企稳定，民企薪资高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=化学工程与工艺+专业介绍' },

  { id: 'NUCLEAR', code: '082201', name: '核工程与核技术', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '核电、核医学，国家战略产业，收入稳定上限高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=核工程与核技术+专业介绍' },

  { id: 'WATER', code: '081101', name: '水利水电工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry', 'geography'] },
    job_prospects: '水利局、电力公司、施工单位，考证后收入可观。',
    bing_wiki_link: 'https://cn.bing.com/search?q=水利水电工程+专业介绍' },

  { id: 'NANO', code: '080710T', name: '集成电路设计与集成系统', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '芯片国产化战略，国家大力扶持，毕业即高薪。',
    bing_wiki_link: 'https://cn.bing.com/search?q=集成电路设计+专业介绍' },

  { id: 'IOT', code: '080905', name: '物联网工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '智能家居/工业互联网，硬件+软件复合型人才需求大。',
    bing_wiki_link: 'https://cn.bing.com/search?q=物联网工程+专业介绍' },

  { id: 'ROBOTICS', code: '080803T', name: '机器人工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '智能制造风口，硕士后进大厂/研究院，本科做集成商。',
    bing_wiki_link: 'https://cn.bing.com/search?q=机器人工程+专业介绍' },

  { id: 'MINING', code: '081501', name: '采矿工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '能源企业，工作环境艰苦但薪资高，国企为主。',
    bing_wiki_link: 'https://cn.bing.com/search?q=采矿工程+专业介绍' },

  // 理学补充
  { id: 'GEO', code: '070501', name: '地理科学', category: '理学',
    subject_requirement: { required: ['geography'], optional: ['biology'] },
    job_prospects: 'GIS/遥感/教师，跨学科应用广，深造转城规/环境。',
    bing_wiki_link: 'https://cn.bing.com/search?q=地理科学+专业介绍' },

  { id: 'ASTRO', code: '070401', name: '天文学', category: '理学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '科研院所/高校，深造率极高，就业面窄但上限高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=天文学+专业介绍' },

  { id: 'ATMOS', code: '070601', name: '大气科学', category: '理学',
    subject_requirement: { required: ['physics'], optional: ['geography'] },
    job_prospects: '气象局/环境监测，事业编制稳定，气候变化热点方向。',
    bing_wiki_link: 'https://cn.bing.com/search?q=大气科学+专业介绍' },

  { id: 'GEOLOGY', code: '070901', name: '地质学', category: '理学',
    subject_requirement: { required: ['geography', 'chemistry'], optional: ['biology'] },
    job_prospects: '能源勘探/矿产企业，野外工作多，薪资可观。',
    bing_wiki_link: 'https://cn.bing.com/search?q=地质学+专业介绍' },

  { id: 'MARINE', code: '070701', name: '海洋科学', category: '理学',
    subject_requirement: { required: ['physics', 'chemistry'], optional: ['biology'] },
    job_prospects: '海洋局/科研院所，深造为主，海洋强国战略支持。',
    bing_wiki_link: 'https://cn.bing.com/search?q=海洋科学+专业介绍' },

  // 经管补充
  { id: 'INTL_BIZ', code: '120205', name: '国际商务', category: '管理学',
    subject_requirement: { required: [], optional: ['history', 'geography'] },
    job_prospects: '外贸公司/跨国企业，英语+商务谈判能力是核心。',
    bing_wiki_link: 'https://cn.bing.com/search?q=国际商务+专业介绍' },

  { id: 'MARKET', code: '120202', name: '市场营销', category: '管理学',
    subject_requirement: { required: [], optional: ['politics', 'geography'] },
    job_prospects: '互联网/快消/广告行业，能力导向强，收入与业绩挂钩。',
    bing_wiki_link: 'https://cn.bing.com/search?q=市场营销+专业介绍' },

  { id: 'HR', code: '120206', name: '人力资源管理', category: '管理学',
    subject_requirement: { required: [], optional: ['politics', 'history'] },
    job_prospects: '企业HR/咨询公司，考证路径清晰，女生就业优势大。',
    bing_wiki_link: 'https://cn.bing.com/search?q=人力资源管理+专业介绍' },

  { id: 'LOGISTICS', code: '120601', name: '物流管理', category: '管理学',
    subject_requirement: { required: [], optional: ['geography'] },
    job_prospects: '电商物流/供应链，京东/菜鸟等企业需求大。',
    bing_wiki_link: 'https://cn.bing.com/search?q=物流管理+专业介绍' },

  { id: 'ECOMMERCE', code: '120801', name: '电子商务', category: '管理学',
    subject_requirement: { required: [], optional: ['geography'] },
    job_prospects: '互联网运营/数据分析，跨境电商是增长点。',
    bing_wiki_link: 'https://cn.bing.com/search?q=电子商务+专业介绍' },

  { id: 'TOURISM', code: '120901K', name: '旅游管理', category: '管理学',
    subject_requirement: { required: [], optional: ['geography', 'history'] },
    job_prospects: '旅游公司/酒店管理，疫后复苏，出境游运营需求增加。',
    bing_wiki_link: 'https://cn.bing.com/search?q=旅游管理+专业介绍' },

  { id: 'INSURANCE', code: '020303', name: '保险学', category: '经济学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '保险公司/精算岗，考精算师证后收入高，稳定性强。',
    bing_wiki_link: 'https://cn.bing.com/search?q=保险学+专业介绍' },

  { id: 'TAX', code: '020202', name: '税收学', category: '经济学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '税务局/会计事务所，考公热门，税务师证书含金量高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=税收学+专业介绍' },

  // 医学补充
  { id: 'DENT', code: '100301K', name: '口腔医学', category: '医学',
    subject_requirement: { required: ['chemistry', 'biology'], optional: [] },
    job_prospects: '口腔医院/私人诊所，收入天花板高，工作压力相对小。',
    bing_wiki_link: 'https://cn.bing.com/search?q=口腔医学+专业介绍' },

  { id: 'MED_IMG', code: '100201TK', name: '医学影像学', category: '医学',
    subject_requirement: { required: ['physics', 'biology'], optional: ['chemistry'] },
    job_prospects: 'CT/MRI医生，医院核心科室，加班少收入稳定。',
    bing_wiki_link: 'https://cn.bing.com/search?q=医学影像学+专业介绍' },

  { id: 'PREV_MED', code: '100401K', name: '预防医学', category: '医学',
    subject_requirement: { required: ['biology', 'chemistry'], optional: [] },
    job_prospects: '疾控中心/卫生监督，事业编制稳定，疫情后重视度提升。',
    bing_wiki_link: 'https://cn.bing.com/search?q=预防医学+专业介绍' },

  { id: 'TCM', code: '100501K', name: '中医学', category: '医学',
    subject_requirement: { required: ['biology'], optional: ['chemistry'] },
    job_prospects: '中医院/养生机构，考取执照后可开诊所，传统文化复兴红利。',
    bing_wiki_link: 'https://cn.bing.com/search?q=中医学+专业介绍' },

  { id: 'ANESTH', code: '100202TK', name: '麻醉学', category: '医学',
    subject_requirement: { required: ['chemistry', 'biology'], optional: ['physics'] },
    job_prospects: '手术室核心岗位，人才稀缺，收入高压力大。',
    bing_wiki_link: 'https://cn.bing.com/search?q=麻醉学+专业介绍' },

  // 文学补充
  { id: 'ENGLISH', code: '050201', name: '英语', category: '文学',
    subject_requirement: { required: [], optional: ['history'] },
    job_prospects: '教师/翻译/外贸，考研考编热门，英语+X复合能力吃香。',
    bing_wiki_link: 'https://cn.bing.com/search?q=英语专业+介绍' },

  { id: 'JAPANESE', code: '050207', name: '日语', category: '文学',
    subject_requirement: { required: [], optional: ['history'] },
    job_prospects: '日企/翻译/旅游，中日贸易需求稳定，小语种竞争小。',
    bing_wiki_link: 'https://cn.bing.com/search?q=日语专业+介绍' },

  { id: 'ADVERT', code: '050303', name: '广告学', category: '文学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '4A广告/互联网运营，创意+数据双驱动，收入差距大。',
    bing_wiki_link: 'https://cn.bing.com/search?q=广告学+专业介绍' },

  { id: 'BROADCAST', code: '130309', name: '播音与主持艺术', category: '艺术学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '电视台/新媒体主播，网红经济红利，颜值+才艺要求高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=播音与主持+专业介绍' },

  { id: 'ANIMATION', code: '130310', name: '动画', category: '艺术学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '游戏公司/影视动画，国漫崛起带动就业，技术型美术吃香。',
    bing_wiki_link: 'https://cn.bing.com/search?q=动画专业+介绍' },

  // 法学补充
  { id: 'SOCIO', code: '030301', name: '社会学', category: '法学',
    subject_requirement: { required: [], optional: ['politics', 'history'] },
    job_prospects: '社会组织/调研公司/政府部门，深造考公路径清晰。',
    bing_wiki_link: 'https://cn.bing.com/search?q=社会学+专业介绍' },

  { id: 'POL_SCI', code: '030201', name: '政治学与行政学', category: '法学',
    subject_requirement: { required: [], optional: ['politics', 'history'] },
    job_prospects: '公务员/事业单位，考公天然优势，理论研究为主。',
    bing_wiki_link: 'https://cn.bing.com/search?q=政治学+专业介绍' },

  { id: 'SOCIAL_WORK', code: '030302', name: '社会工作', category: '法学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '社区工作/NGO/医院社工，考社工证后进事业编。',
    bing_wiki_link: 'https://cn.bing.com/search?q=社会工作+专业介绍' },

  // 教育学补充
  { id: 'PE', code: '040201', name: '体育教育', category: '教育学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '中小学体育教师，编制稳定，体测要求高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=体育教育+专业介绍' },

  { id: 'PRE_EDU', code: '040106', name: '学前教育', category: '教育学',
    subject_requirement: { required: [], optional: ['history'] },
    job_prospects: '幼儿园教师/早教机构，女生占比高，考编竞争激烈。',
    bing_wiki_link: 'https://cn.bing.com/search?q=学前教育+专业介绍' },

  { id: 'SPEC_EDU', code: '040108', name: '特殊教育', category: '教育学',
    subject_requirement: { required: [], optional: ['biology'] },
    job_prospects: '特教学校/康复中心，社会需求增长，编制岗位稳定。',
    bing_wiki_link: 'https://cn.bing.com/search?q=特殊教育+专业介绍' },

  // 农学补充
  { id: 'AGRO', code: '090101', name: '农学', category: '农学',
    subject_requirement: { required: ['biology'], optional: ['chemistry'] },
    job_prospects: '种业公司/农业科研，乡村振兴战略支持，深造率高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=农学+专业介绍' },

  { id: 'HORT', code: '090102', name: '园艺', category: '农学',
    subject_requirement: { required: ['biology'], optional: [] },
    job_prospects: '园林设计/花卉企业，城市绿化需求大，女生适合。',
    bing_wiki_link: 'https://cn.bing.com/search?q=园艺+专业介绍' },

  { id: 'ANIMAL', code: '090301', name: '动物科学', category: '农学',
    subject_requirement: { required: ['biology'], optional: ['chemistry'] },
    job_prospects: '养殖企业/饲料公司，规模化养殖红利，技术岗收入可观。',
    bing_wiki_link: 'https://cn.bing.com/search?q=动物科学+专业介绍' },

  { id: 'FOREST', code: '090501', name: '林学', category: '农学',
    subject_requirement: { required: ['biology'], optional: ['geography'] },
    job_prospects: '林业局/自然保护区，事业编制为主，野外工作多。',
    bing_wiki_link: 'https://cn.bing.com/search?q=林学+专业介绍' },

  { id: 'VET', code: '090401', name: '动物医学', category: '农学',
    subject_requirement: { required: ['biology', 'chemistry'], optional: [] },
    job_prospects: '宠物医院/动物检疫，宠物经济爆发，创业开诊所收入高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=动物医学+专业介绍' },

  // 历史学
  { id: 'HISTORY', code: '060101', name: '历史学', category: '历史学',
    subject_requirement: { required: [], optional: ['history', 'politics'] },
    job_prospects: '教师/博物馆/文物局，考研考编为主，人文素养要求高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=历史学+专业介绍' },

  { id: 'ARCH_MUS', code: '060104', name: '文物与博物馆学', category: '历史学',
    subject_requirement: { required: [], optional: ['history', 'geography'] },
    job_prospects: '博物馆/考古院，文博热带动就业，事业编制稳定。',
    bing_wiki_link: 'https://cn.bing.com/search?q=文物与博物馆学+专业介绍' },

  // 哲学
  { id: 'PHIL', code: '010101', name: '哲学', category: '哲学',
    subject_requirement: { required: [], optional: ['politics', 'history'] },
    job_prospects: '高校教师/公务员，深造率极高，就业面窄但思维训练强。',
    bing_wiki_link: 'https://cn.bing.com/search?q=哲学+专业介绍' },

  { id: 'LOGIC', code: '010102', name: '逻辑学', category: '哲学',
    subject_requirement: { required: [], optional: ['physics'] },
    job_prospects: '计算机/法律/咨询，跨学科应用广，复合型人才吃香。',
    bing_wiki_link: 'https://cn.bing.com/search?q=逻辑学+专业介绍' },

  // 艺术学补充
  { id: 'MUSIC', code: '130201', name: '音乐表演', category: '艺术学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '乐团/音乐教师/自由演出，专业要求极高，就业两极分化。',
    bing_wiki_link: 'https://cn.bing.com/search?q=音乐表演+专业介绍' },

  { id: 'FINE_ART', code: '130401', name: '美术学', category: '艺术学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '美术教师/画廊/自由创作，考编为主，商业插画收入高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=美术学+专业介绍' },

  { id: 'DESIGN', code: '130501', name: '艺术设计学', category: '艺术学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '设计公司/互联网UI，能力导向强，审美+软件技能是核心。',
    bing_wiki_link: 'https://cn.bing.com/search?q=艺术设计学+专业介绍' },

  { id: 'DRAMA', code: '130301', name: '表演', category: '艺术学',
    subject_requirement: { required: [], optional: [] },
    job_prospects: '影视剧/话剧团，成名收入极高，大多数人从事教育/自媒体。',
    bing_wiki_link: 'https://cn.bing.com/search?q=表演专业+介绍' },

  // 交叉学科补充
  { id: 'FINTECH', code: '020310T', name: '金融科技', category: '经济学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '金融机构技术岗，金融+计算机双背景，高薪复合型人才。',
    bing_wiki_link: 'https://cn.bing.com/search?q=金融科技+专业介绍' },

  { id: 'BIOINFO', code: '071003', name: '生物信息学', category: '理学',
    subject_requirement: { required: ['biology'], optional: ['physics', 'chemistry'] },
    job_prospects: '生物医药/科研院所，交叉学科红利，硕博就业优势明显。',
    bing_wiki_link: 'https://cn.bing.com/search?q=生物信息学+专业介绍' },

  { id: 'SMART_CITY', code: '080906T', name: '智慧城市', category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '政府智慧城市项目/科技公司，新基建风口，跨学科要求高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=智慧城市+专业介绍' },

  { id: 'BLOCKCHAIN', code: '080917T', name: '区块链工程', category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '金融科技/Web3.0，技术前沿但就业不稳定，大厂布局少。',
    bing_wiki_link: 'https://cn.bing.com/search?q=区块链工程+专业介绍' },

  { id: 'CARBON', code: '082505T', name: '碳储科学与工程', category: '工学',
    subject_requirement: { required: ['chemistry'], optional: ['physics'] },
    job_prospects: '双碳战略新专业，能源企业/科研院所，政策红利明显。',
    bing_wiki_link: 'https://cn.bing.com/search?q=碳储科学+专业介绍' },

  { id: 'REHAB', code: '101005', name: '康复治疗学', category: '医学',
    subject_requirement: { required: ['biology'], optional: ['chemistry'] },
    job_prospects: '康复医院/养老机构，老龄化+运动医学需求大，编制少但市场化好。',
    bing_wiki_link: 'https://cn.bing.com/search?q=康复治疗学+专业介绍' },

  { id: 'URBAN', code: '082802', name: '城乡规划', category: '工学',
    subject_requirement: { required: ['geography'], optional: ['physics'] },
    job_prospects: '规划院/地产公司，考证路径长但收入可观，设计+政策双能力。',
    bing_wiki_link: 'https://cn.bing.com/search?q=城乡规划+专业介绍' },

  { id: 'GIS_ENG', code: '081003', name: '地理信息科学', category: '工学',
    subject_requirement: { required: ['geography', 'physics'], optional: [] },
    job_prospects: '测绘/自动驾驶/智慧城市，地理+IT复合，需求持续增长。',
    bing_wiki_link: 'https://cn.bing.com/search?q=地理信息科学+专业介绍' },

  { id: 'AVIATION', code: '081805K', name: '飞行技术', category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '民航飞行员，体检+英语严格，成功后收入顶尖，职业天花板高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=飞行技术+专业介绍' },

  { id: 'CUSTOMS', code: '020402T', name: '海关管理', category: '经济学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '海关公务员，考公热门，涉外执法待遇好。',
    bing_wiki_link: 'https://cn.bing.com/search?q=海关管理+专业介绍' },

  { id: 'AUDIT', code: '120207', name: '审计学', category: '管理学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '审计署/四大会计所，CPA+审计师双证路线，加班多收入高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=审计学+专业介绍' },

  { id: 'FOOD_SCI', code: '082701', name: '食品科学与工程', category: '工学',
    subject_requirement: { required: ['chemistry'], optional: ['biology'] },
    job_prospects: '食品企业/质检局，食品安全重视度提升，研发岗深造优先。',
    bing_wiki_link: 'https://cn.bing.com/search?q=食品科学与工程+专业介绍' },

  { id: 'POLICE', code: '030601K', name: '治安学', category: '法学',
    subject_requirement: { required: [], optional: ['politics'] },
    job_prospects: '公安机关，警校定向招录，体能+政审要求高，编制稳定。',
    bing_wiki_link: 'https://cn.bing.com/search?q=治安学+专业介绍' },

  { id: 'FIRE', code: '083102K', name: '消防工程', category: '工学',
    subject_requirement: { required: ['physics', 'chemistry'], optional: [] },
    job_prospects: '消防部队/工程公司，考注册消防工程师证后收入高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=消防工程+专业介绍' },
]

export const deepMajors = [...majors, ...newMajors].map((major, idx) => {
  const tier = ['CS', 'AI', 'FIN', 'CLINIC', 'LAW'].includes(major.id) ? 'top' :
               ['SE', 'EE', 'ECON', 'ACCT'].includes(major.id) ? 'mid' : 'low'

  return {
    ...major,

    // Tab 1: 专业概况
    overview: {
      duration: major.category === '医学' && major.id === 'CLINIC' ? '5年(+3年规培)' : '4年',
      degree: major.category === '工学' ? '工学学士' :
              major.category === '理学' ? '理学学士' :
              major.category === '医学' ? '医学学士' :
              major.category === '管理学' ? '管理学学士' :
              major.category === '经济学' ? '经济学学士' :
              major.category === '法学' ? '法学学士' : '学士',
      description: `${major.name}是${major.category}门类下的重要专业，培养具有扎实理论基础和实践能力的专业人才。毕业生广泛分布于各行各业，就业前景良好。`,
      coreSubjects: tier === 'top' ? ['专业核心课A', '专业核心课B', '专业核心课C', '实践课程'] :
                    ['专业基础', '专业技能', '综合实训'],
      highlights: [
        { label: '开设院校', value: tier === 'top' ? '600+' : tier === 'mid' ? '400+' : '200+' },
        { label: '平均起薪', value: tier === 'top' ? '1.2万/月' : tier === 'mid' ? '0.9万/月' : '0.7万/月' },
      ],
    },

    // Tab 3: 就业前景
    careerDetail: {
      salaryRange: tier === 'top' ? '10k–35k' : tier === 'mid' ? '7k–20k' : '5k–12k',
      topCities: ['北京', '上海', '深圳', '杭州'],
      growthTrend: ['CS', 'AI', 'DATASCI', 'CYBER', 'FINTECH'].includes(major.id) ? 'up' :
                   ['BIOENG', 'ENV', 'CE'].includes(major.id) ? 'stable' : 'stable',
      bingHook: `${major.name} 就业前景 2026`,
      jobDistribution: major.category === '工学' ? [
        { name: '互联网/软件', value: 40 },
        { name: '制造业', value: 25 },
        { name: '国企', value: 20 },
        { name: '其他', value: 15 },
      ] : major.category === '医学' ? [
        { name: '医院', value: 60 },
        { name: '升学', value: 25 },
        { name: '医药企业', value: 10 },
        { name: '其他', value: 5 },
      ] : [
        { name: '企业', value: 50 },
        { name: '事业单位', value: 25 },
        { name: '升学', value: 15 },
        { name: '其他', value: 10 },
      ],
    },

    // Tab 4: 研招信息
    gradInfo: {
      pushRate: tier === 'top' ? '35%' : tier === 'mid' ? '25%' : '15%',
      topGradSchools: tier === 'top' ? ['清华', '北大', '中科院', '复旦'] :
                      ['本校', '211院校', '科研院所'],
      examSubjects: major.category === '工学' ? ['数学一', '英语一', '专业课'] :
                    major.category === '医学' ? ['西医综合/中医综合', '英语一', '政治'] :
                    ['英语一', '政治', '专业课一', '专业课二'],
      bingSearchUrl: `https://cn.bing.com/search?q=${encodeURIComponent(major.name + ' 考研 2026')}`,
    },
  }
})

export default { deepSchools, deepMajors }
