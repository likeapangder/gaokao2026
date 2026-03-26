/**
 * 必应高考 - 核心常量配置表 (Constants)
 */

// 1. 教育部 12 大本科学科门类 (用于专业偏好筛选)
export const MAJOR_GROUPS = [
  { id: '01', name: '哲学', tags: ['文科', '基础学科', '考编'] },
  { id: '02', name: '经济学', tags: ['金融', '高薪', '数学要求'] },
  { id: '03', name: '法学', tags: ['考公', '律师', '背诵'] },
  { id: '04', name: '教育学', tags: ['师范', '稳定', '寒暑假'] },
  { id: '05', name: '文学', tags: ['外语', '中文', '媒体'] },
  { id: '06', name: '历史学', tags: ['文科', '考古', '研究'] },
  { id: '07', name: '理学', tags: ['数学', '物理', '基础科学'] },
  { id: '08', name: '工学', tags: ['计算机', '电子', '好就业', '高薪'] },
  { id: '09', name: '农学', tags: ['冷门', '生物', '考研跳板'] },
  { id: '10', name: '医学', tags: ['临床', '长学制', '越老越吃香'] },
  { id: '12', name: '管理学', tags: ['会计', '工商', '万金油'] },
  { id: '13', name: '艺术学', tags: ['设计', '艺考', '创意'] }
];

// 2. 高频热门地域大区 (用于地域偏好映射)
export const REGION_GROUPS = [
  { id: 'R1', label: '京津冀', provinces: ['北京', '天津', '河北'] },
  { id: 'R2', label: '江浙沪', provinces: ['江苏', '浙江', '上海'] },
  { id: 'R3', label: '大湾区', provinces: ['广东'] }, // 针对内地高考通常指广东
  { id: 'R4', label: '川渝圈', provinces: ['四川', '重庆'] },
  { id: 'R5', label: '华中', provinces: ['湖北', '湖南', '河南'] },
  { id: 'R6', label: '东北', provinces: ['辽宁', '吉林', '黑龙江'] }
];

// 3. 填报优先策略枚举
export const STRATEGIES = [
  { id: 'university_first', label: '院校优先', desc: '保牌子，优先冲击 985/211/双一流' },
  { id: 'major_first', label: '专业优先', desc: '保就业，宁去双非好专业，不去名校冷门' },
  { id: 'location_first', label: '地域优先', desc: '保城市，优先选择发达经济圈的高校' },
  { id: 'balanced', label: '综合均衡', desc: '不偏科，位次最大化利用' }
];
