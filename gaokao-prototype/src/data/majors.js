/**
 * 必应高考 — 专业 Mock 数据（30+ 个）
 */

export const majors = [
  // ── 工学 ──────────────────────────────────────────────────
  {
    id: 'CS', code: '080901', name: '计算机科学与技术',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '就业率极高，互联网/AI/软件行业需求旺盛，薪资领先。',
    bing_wiki_link: 'https://cn.bing.com/search?q=计算机科学与技术+专业介绍',
  },
  {
    id: 'SE', code: '080902', name: '软件工程',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '需求持续增长，工程实践能力强，毕业即可上手工业项目。',
    bing_wiki_link: 'https://cn.bing.com/search?q=软件工程+专业介绍',
  },
  {
    id: 'AI', code: '080717T', name: '人工智能',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '前沿热门方向，大厂/科研院所高薪招募，深造率高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=人工智能+专业介绍',
  },
  {
    id: 'EE', code: '080601', name: '电气工程及其自动化',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '国家电网、新能源、制造业等稳定就业，薪资中上。',
    bing_wiki_link: 'https://cn.bing.com/search?q=电气工程及其自动化+专业介绍',
  },
  {
    id: 'ME', code: '080201', name: '机械工程',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '传统支柱专业，智能制造转型带来新机遇，就业面广。',
    bing_wiki_link: 'https://cn.bing.com/search?q=机械工程+专业介绍',
  },
  {
    id: 'CE', code: '081001', name: '土木工程',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry', 'geography'] },
    job_prospects: '基建领域稳定，考证后薪资高；近年受地产行业影响有所波动。',
    bing_wiki_link: 'https://cn.bing.com/search?q=土木工程+专业介绍',
  },
  {
    id: 'ARCH', code: '082801', name: '建筑学',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['geography'] },
    job_prospects: '具备艺术与工程双重素养，设计院/地产/城规多元就业。',
    bing_wiki_link: 'https://cn.bing.com/search?q=建筑学+专业介绍',
  },
  {
    id: 'COMM', code: '080902', name: '通信工程',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '5G/卫星通信风口，华为中兴等企业大量招募。',
    bing_wiki_link: 'https://cn.bing.com/search?q=通信工程+专业介绍',
  },
  {
    id: 'BIOENG', code: '083001', name: '生物工程',
    category: '工学',
    subject_requirement: { required: ['chemistry'], optional: ['biology', 'physics'] },
    job_prospects: '生物医药/食品行业，深造率高，薪资与学历正相关。',
    bing_wiki_link: 'https://cn.bing.com/search?q=生物工程+专业介绍',
  },
  {
    id: 'ENV', code: '082502', name: '环境工程',
    category: '工学',
    subject_requirement: { required: ['chemistry'], optional: ['biology', 'physics'] },
    job_prospects: '双碳政策推动，环保行业需求持续增长，国企/研究院为主。',
    bing_wiki_link: 'https://cn.bing.com/search?q=环境工程+专业介绍',
  },

  // ── 理学 ──────────────────────────────────────────────────
  {
    id: 'MATH', code: '070101', name: '数学与应用数学',
    category: '理学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '基础学科，深造率极高；应用方向可进金融、数据科学领域。',
    bing_wiki_link: 'https://cn.bing.com/search?q=数学与应用数学+专业介绍',
  },
  {
    id: 'PHYS', code: '070201', name: '物理学',
    category: '理学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '科研路线为主，芯片/量子计算等前沿方向需求增加。',
    bing_wiki_link: 'https://cn.bing.com/search?q=物理学+专业介绍',
  },
  {
    id: 'CHEM', code: '070301', name: '化学',
    category: '理学',
    subject_requirement: { required: ['chemistry'], optional: ['biology', 'physics'] },
    job_prospects: '科研/医药/材料方向深造率高，应用化学就业面更广。',
    bing_wiki_link: 'https://cn.bing.com/search?q=化学+专业介绍',
  },
  {
    id: 'BIO', code: '071001', name: '生物科学',
    category: '理学',
    subject_requirement: { required: ['biology'], optional: ['chemistry'] },
    job_prospects: '建议直接读研，生物医药/基因科技是未来增长点。',
    bing_wiki_link: 'https://cn.bing.com/search?q=生物科学+专业介绍',
  },
  {
    id: 'STAT', code: '071201', name: '统计学',
    category: '理学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '数据时代核心专业，金融/互联网/政府部门均有需求。',
    bing_wiki_link: 'https://cn.bing.com/search?q=统计学+专业介绍',
  },

  // ── 经济/管理 ─────────────────────────────────────────────
  {
    id: 'FIN', code: '020401', name: '金融学',
    category: '经济学',
    subject_requirement: { required: [], optional: ['politics', 'history', 'geography'] },
    job_prospects: '银行/证券/基金行业，竞争激烈，名校背景优势明显。',
    bing_wiki_link: 'https://cn.bing.com/search?q=金融学+专业介绍',
  },
  {
    id: 'ECON', code: '020101', name: '经济学',
    category: '经济学',
    subject_requirement: { required: [], optional: ['politics', 'history', 'geography'] },
    job_prospects: '通用型专业，转型灵活，深造至 MBA/MF 后就业前景佳。',
    bing_wiki_link: 'https://cn.bing.com/search?q=经济学+专业介绍',
  },
  {
    id: 'ACCT', code: '120201K', name: '会计学',
    category: '管理学',
    subject_requirement: { required: [], optional: ['politics', 'geography'] },
    job_prospects: '四大/企业财务/审计，CPA 持证者薪资可观，需求稳定。',
    bing_wiki_link: 'https://cn.bing.com/search?q=会计学+专业介绍',
  },
  {
    id: 'MBA_UG', code: '120201', name: '工商管理',
    category: '管理学',
    subject_requirement: { required: [], optional: ['politics', 'history', 'geography'] },
    job_prospects: '培养管理通才，后续读 MBA 含金量高，就业灵活。',
    bing_wiki_link: 'https://cn.bing.com/search?q=工商管理+专业介绍',
  },
  {
    id: 'INTER_TRADE', code: '020402', name: '国际经济与贸易',
    category: '经济学',
    subject_requirement: { required: [], optional: ['history', 'geography', 'politics'] },
    job_prospects: '跨境电商/外贸公司需求，英语能力是核心竞争力。',
    bing_wiki_link: 'https://cn.bing.com/search?q=国际经济与贸易+专业介绍',
  },

  // ── 医学 ──────────────────────────────────────────────────
  {
    id: 'CLINIC', code: '100201K', name: '临床医学',
    category: '医学',
    subject_requirement: { required: ['chemistry', 'biology'], optional: ['physics'] },
    job_prospects: '社会地位高，执照后收入稳定增长，学制长（5年+3年规培）。',
    bing_wiki_link: 'https://cn.bing.com/search?q=临床医学+专业介绍',
  },
  {
    id: 'PHARM', code: '100701', name: '药学',
    category: '医学',
    subject_requirement: { required: ['chemistry', 'biology'], optional: [] },
    job_prospects: '医药企业/医院药剂科，执业药师证书是重要加分项。',
    bing_wiki_link: 'https://cn.bing.com/search?q=药学+专业介绍',
  },
  {
    id: 'NURS', code: '101101', name: '护理学',
    category: '医学',
    subject_requirement: { required: ['biology'], optional: ['chemistry'] },
    job_prospects: '国内外医院需求旺盛，海外就业选项广（美/澳/英）。',
    bing_wiki_link: 'https://cn.bing.com/search?q=护理学+专业介绍',
  },

  // ── 人文社科 ──────────────────────────────────────────────
  {
    id: 'LAW', code: '030101K', name: '法学',
    category: '法学',
    subject_requirement: { required: [], optional: ['politics', 'history'] },
    job_prospects: '法考通过后进入律所/检察院/法院，竞争激烈但上限高。',
    bing_wiki_link: 'https://cn.bing.com/search?q=法学+专业介绍',
  },
  {
    id: 'PSYCH', code: '071101', name: '心理学',
    category: '理学',
    subject_requirement: { required: [], optional: ['biology', 'chemistry', 'politics'] },
    job_prospects: '咨询/教育/HR 方向，硕士后选择更多，就业市场快速扩大。',
    bing_wiki_link: 'https://cn.bing.com/search?q=心理学+专业介绍',
  },
  {
    id: 'EDUC', code: '040101', name: '教育学',
    category: '教育学',
    subject_requirement: { required: [], optional: ['politics', 'history', 'geography'] },
    job_prospects: '教师编制竞争激烈，教培行业转型，建议结合学科教育方向。',
    bing_wiki_link: 'https://cn.bing.com/search?q=教育学+专业介绍',
  },
  {
    id: 'JOURNAL', code: '050301', name: '新闻学',
    category: '文学',
    subject_requirement: { required: [], optional: ['politics', 'history', 'geography'] },
    job_prospects: '媒体融合时代需要多平台运营能力，自媒体/公关/政府媒体均有机会。',
    bing_wiki_link: 'https://cn.bing.com/search?q=新闻学+专业介绍',
  },
  {
    id: 'CHINESE', code: '050101', name: '汉语言文学',
    category: '文学',
    subject_requirement: { required: [], optional: ['history', 'politics'] },
    job_prospects: '教师/编辑/文案/公务员，考研考编热门路径。',
    bing_wiki_link: 'https://cn.bing.com/search?q=汉语言文学+专业介绍',
  },
  {
    id: 'INTL_REL', code: '030207', name: '国际关系',
    category: '法学',
    subject_requirement: { required: [], optional: ['history', 'politics', 'geography'] },
    job_prospects: '外交部/外资企业/国际组织，英语+小语种组合竞争力强。',
    bing_wiki_link: 'https://cn.bing.com/search?q=国际关系+专业介绍',
  },

  // ── 新兴交叉 ──────────────────────────────────────────────
  {
    id: 'DATASCI', code: '080910T', name: '数据科学与大数据技术',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: ['chemistry'] },
    job_prospects: '数字经济核心专业，各行业数据岗位需求强劲。',
    bing_wiki_link: 'https://cn.bing.com/search?q=数据科学与大数据技术+专业介绍',
  },
  {
    id: 'CYBER', code: '080911T', name: '网络空间安全',
    category: '工学',
    subject_requirement: { required: ['physics'], optional: [] },
    job_prospects: '国家战略性方向，政府/金融/科技公司均高薪招募。',
    bing_wiki_link: 'https://cn.bing.com/search?q=网络空间安全+专业介绍',
  },
]

export default majors
