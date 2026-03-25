/**
 * 必应高考 — AI 报告文案模板（三档：高/中/低位次）
 * 模板变量使用 {{变量名}} 占位符
 *
 * tier 判断逻辑（在 AIReportPage 中执行）：
 *   high  → 位次排名 ≤ 全省前 30%
 *   mid   → 位次排名在 30% ~ 70%
 *   low   → 位次排名 > 70%
 */

export const reportTemplates = {
  high: {
    tier: 'high',
    tierLabel: '优势考生',
    tierColor: '#0078d4',
    sections: [
      {
        key: 'intro',
        title: '综合评估',
        template:
          '恭喜你！你的{{province}}省{{year}}年高考成绩为 {{score}} 分，' +
          '全省位次约 {{rank}} 名，处于全省前 {{percentile}}%。' +
          '你的成绩具备竞争国内顶尖高校的实力，制定科学的志愿策略将帮助你实现最优匹配。',
      },
      {
        key: 'stretch',
        title: '冲刺院校建议',
        template:
          '【冲】以你的位次，建议冲刺 {{stretchSchool1}}、{{stretchSchool2}} 等顶尖院校。' +
          '这些院校近三年最低录取位次均值约为 {{stretchRank}}，与你的位次差距在 5%~15% 区间，' +
          '属于"跳一跳够得到"的合理冲刺目标。建议选择你最感兴趣的优势专业冲刺。',
      },
      {
        key: 'match',
        title: '稳妥院校建议',
        template:
          '【稳】建议稳定选择 {{matchSchool1}}、{{matchSchool2}} 等名校。' +
          '这些院校近三年最低录取位次均值约为 {{matchRank}}，与你的位次相近（±5%），' +
          '录取概率较高，是你志愿表的核心压舱石。',
      },
      {
        key: 'safety',
        title: '保底院校建议',
        template:
          '【保】建议将 {{safetySchool1}}、{{safetySchool2}} 作为兜底选择。' +
          '这些院校录取位次明显低于你的位次（15%以上），在保证"稳上好大学"的同时，' +
          '可以选择你更感兴趣的专业方向，实现专业与院校的双重保障。',
      },
      {
        key: 'closing',
        title: '总结建议',
        template:
          '综上，建议你的志愿表按照 2:5:3 结构（冲2所：稳5所：保3所）配置。' +
          '发挥你的高分优势，在稳定部分重点关注 985/211 名校的核心专业，' +
          '切勿因过度保守而浪费优质资源。祝高考顺利，金榜题名！',
      },
    ],
  },

  mid: {
    tier: 'mid',
    tierLabel: '均衡考生',
    tierColor: '#107c10',
    sections: [
      {
        key: 'intro',
        title: '综合评估',
        template:
          '你的{{province}}省{{year}}年高考成绩为 {{score}} 分，' +
          '全省位次约 {{rank}} 名，处于全省前 {{percentile}}%。' +
          '你的成绩属于中等偏上水平，可以选择众多优质 211 高校及特色专业高校，' +
          '策略制定的关键在于"选好专业"与"选好城市"的平衡。',
      },
      {
        key: 'stretch',
        title: '冲刺院校建议',
        template:
          '【冲】以你的位次，可以尝试冲刺 {{stretchSchool1}}、{{stretchSchool2}} 等院校。' +
          '这些院校近三年录取位次均值约为 {{stretchRank}}，略高于你的位次，' +
          '有一定录取风险，建议选择志愿总量的 20% 作为冲刺志愿。',
      },
      {
        key: 'match',
        title: '稳妥院校建议',
        template:
          '【稳】建议重点布局 {{matchSchool1}}、{{matchSchool2}} 等优质高校。' +
          '这些院校与你的位次高度匹配（±5%），是录取概率最高的目标。' +
          '建议在专业选择上优先考虑就业前景好、城市地理位置优越的选项。',
      },
      {
        key: 'safety',
        title: '保底院校建议',
        template:
          '【保】建议将 {{safetySchool1}}、{{safetySchool2}} 列为保底选项。' +
          '这些院校虽排名略低，但在特定专业领域或地区具有较强优势，' +
          '确保在稳妥录取的基础上获得相对满意的专业方向。',
      },
      {
        key: 'closing',
        title: '总结建议',
        template:
          '你的分数段竞争激烈，院校选择尤为重要。建议优先考虑"城市 > 院校 > 专业"原则，' +
          '选择北京、上海、广州等一线城市的优质高校，能够最大化你未来的发展资源。' +
          '志愿表按 2:5:3 配置，冲名校、稳211、保特色高校。加油！',
      },
    ],
  },

  low: {
    tier: 'low',
    tierLabel: '稳健考生',
    tierColor: '#ca5010',
    sections: [
      {
        key: 'intro',
        title: '综合评估',
        template:
          '你的{{province}}省{{year}}年高考成绩为 {{score}} 分，' +
          '全省位次约 {{rank}} 名，位于全省前 {{percentile}}%。' +
          '虽然分数与顶尖院校有一定差距，但本科阶段仍有大量优质选择。' +
          '建议以"专业优先"为核心策略，选择就业前景明确的优势专业。',
      },
      {
        key: 'stretch',
        title: '冲刺院校建议',
        template:
          '【冲】以你的位次，建议小幅冲刺 {{stretchSchool1}}、{{stretchSchool2}} 等院校。' +
          '这些院校与你的位次差距约 5%~15%，冲刺风险适中，' +
          '录取成功则可以获得超出预期的院校资源。',
      },
      {
        key: 'match',
        title: '稳妥院校建议',
        template:
          '【稳】建议将志愿表重心放在 {{matchSchool1}}、{{matchSchool2}} 等院校。' +
          '这些院校与你的位次高度匹配，录取稳定性强。' +
          '在专业选择上，建议优先计算机、财经、医学等就业导向明确的方向。',
      },
      {
        key: 'safety',
        title: '保底院校建议',
        template:
          '【保】务必将 {{safetySchool1}}、{{safetySchool2}} 列为兜底选择。' +
          '这些院校录取把握大，确保你顺利入读本科。' +
          '同时可以关注双非院校中的王牌专业，往往比普通院校的热门专业更具竞争力。',
      },
      {
        key: 'closing',
        title: '总结建议',
        template:
          '建议你采用"专业优先"策略：宁可进入知名度略低的院校读好专业，' +
          '也不要进名校选冷门专业。职业规划和实习积累同样重要，' +
          '大学四年的努力完全可以弥补起跑线的差距。志愿表按 2:5:3 配置，祝录取顺利！',
      },
    ],
  },
}

export default reportTemplates
