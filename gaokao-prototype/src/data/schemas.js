/**
 * 必应高考 — 数据模型定义 (JSDoc Schema)
 *
 * @typedef {Object} RankEntry
 * @property {number} year        - 年份，如 2023
 * @property {number} minScore    - 该年最低录取分数
 * @property {number} minRank     - 该年最低录取位次
 *
 * @typedef {Object} University
 * @property {string}       id              - 唯一标识，如 "PKU"
 * @property {string}       code            - 院校代码，如 "10001"
 * @property {string}       name            - 院校全称
 * @property {RankEntry[]}  rank_history    - 近3年最低录取位次历史
 * @property {string[]}     tags            - 标签，如 ["985","211","双一流"]
 * @property {string}       bing_news_hook  - Bing 新闻搜索关键词（外链锚）
 * @property {string[]}     level_tags      - 院校层次，如 ["顶尖985","强势理工"]
 * @property {string}       province        - 所在省份
 * @property {string}       type            - 院校类型，如 "综合","理工","师范"
 *
 * @typedef {Object} SubjectRequirement
 * @property {string[]} required  - 必选科目，如 ["physics"]
 * @property {string[]} optional  - 可选科目（至少选1门），如 ["chemistry","biology"]
 *
 * @typedef {Object} Major
 * @property {string}             id                  - 唯一标识
 * @property {string}             code                - 专业代码，如 "080901"
 * @property {string}             name                - 专业名称
 * @property {string}             category            - 学科门类，如 "工学"
 * @property {SubjectRequirement} subject_requirement - 选科要求
 * @property {string}             job_prospects       - 就业前景描述
 * @property {string}             bing_wiki_link      - Bing 百科搜索链接
 *
 * @typedef {Object} ScoreRankRow
 * @property {number} score  - 分数
 * @property {number} rank   - 位次（累计人数）
 * @property {number} count  - 该分数人数
 *
 * @typedef {Object} ProvinceScoreRankTable
 * @property {string}         province_id  - 省份代码，如 "BJ"
 * @property {number}         year         - 年份
 * @property {number}         total        - 该省参考人数
 * @property {ScoreRankRow[]} table        - 一分一段数据
 *
 * @typedef {Object} ReportSection
 * @property {string} key       - 章节标识，如 "intro"
 * @property {string} title     - 章节标题
 * @property {string} template  - 含 {{变量}} 占位符的文案模板
 *
 * @typedef {Object} ReportTemplate
 * @property {'high'|'mid'|'low'} tier      - 位次段：high=前30%，mid=30%-70%，low=后30%
 * @property {ReportSection[]}    sections  - 章节列表
 *
 * @typedef {Object} Volunteer
 * @property {string}     id          - 志愿唯一ID
 * @property {University} university  - 院校
 * @property {Major}      major       - 专业
 * @property {'stretch'|'match'|'safety'} category - 冲/稳/保
 * @property {number}     order       - 排序序号
 */

export const EXAM_TYPES = {
  OLD: 'old',       // 老高考（北京/上海/天津）
  NEW312: '3+1+2',  // 新高考 3+1+2 模式
}

export const SUBJECT_LABELS = {
  physics:   '物理',
  history:   '历史',
  chemistry: '化学',
  biology:   '生物',
  geography: '地理',
  politics:  '政治',
}

export const CATEGORY_LABELS = {
  stretch: '冲',
  match:   '稳',
  safety:  '保',
}

export const PROVINCE_NAMES = {
  BJ: '北京', SH: '上海', TJ: '天津',
  JS: '江苏', SD: '山东', GD: '广东',
  HB: '湖北', HN: '湖南', ZJ: '浙江',
  FJ: '福建', CQ: '重庆', LN: '辽宁',
}
