/**
 * 必应高考 - 志愿表审计 Agent (Volunteer Auditor)
 *
 * 这是一个纯逻辑校验模块，用于对生成的志愿表进行"防呆审计"。
 * 核心职责：
 * 1. The Subject Guard: 选科强校验 (Error 级)
 * 2. The Gradient Guard: 梯度倒挂监测 (Warning 级)
 */

/**
 * 审计结果级别枚举
 */
export const AUDIT_LEVELS = {
  PASS: 'pass',       // 通过
  WARNING: 'warning', // 警告 (建议修改，但允许提交)
  ERROR: 'error'      // 错误 (必须修改，拦截提交)
};

/**
 * 检查选科是否匹配
 * @param {Array<string>} requiredSubjects - 专业要求的科目 (e.g. ['物理'])
 * @param {Object} candidateSubjects - 考生选科 (e.g. { first: '物理', optionals: ['化学', '生物'] })
 * @returns {boolean}
 */
function checkSubjectMatch(requiredSubjects, candidateSubjects) {
  if (!requiredSubjects || requiredSubjects.length === 0) return true;
  if (!candidateSubjects) return false;

  const candidateSet = new Set([
    candidateSubjects.first,
    ...(candidateSubjects.optionals || [])
  ].filter(Boolean));

  // 默认逻辑：专业要求的所有科目考生都必须选 (AND 关系)
  // 实际业务中可能是 OR 关系，此处按最严谨的 AND 处理
  return requiredSubjects.every(sub => candidateSet.has(sub));
}

/**
 * 核心审计函数
 *
 * @param {Array} volunteerList - 扁平化的志愿列表 (按顺序排列)
 * @param {Object} candidate - 考生信息 { subjects: {...}, rank: 1200 }
 * @returns {Array} 审计报告列表 [{ index, level, message, type }]
 */
export function auditVolunteerSheet(volunteerList, candidate) {
  const reports = [];

  if (!volunteerList || volunteerList.length === 0) return reports;

  // ---------------------------------------------------------
  // Check 1: The Subject Guard (选科校验)
  // ---------------------------------------------------------
  volunteerList.forEach((item, index) => {
    // 假设 item 结构包含 major 信息
    // 如果是 mock 数据，可能没有 detailed subjects，需做容错
    const requirements = item.major?.subject_requirement || item.subject_requirement || [];

    if (!checkSubjectMatch(requirements, candidate.subjects)) {
      reports.push({
        index,
        level: AUDIT_LEVELS.ERROR,
        type: 'SUBJECT_MISMATCH',
        message: `第 ${index + 1} 志愿「${item.school_name || item.name} - ${item.major_name || '专业组'}」要求选考 ${requirements.join('+')}，您的选科不符合。`
      });
    }
  });

  // ---------------------------------------------------------
  // Check 2: The Gradient Guard (梯度倒挂监测)
  // ---------------------------------------------------------
  // 梯度应该是：位次要求越来越低 (数字越来越大)，录取概率越来越高
  // 如果 后一个志愿的位次要求 << 前一个志愿 (说明后一个更难考)，则为倒挂

  // 阈值：如果后一个比前一个难考 20% 以上 (位次数值小 20%)
  const INVERSION_THRESHOLD = 0.2;

  for (let i = 0; i < volunteerList.length - 1; i++) {
    const current = volunteerList[i];
    const next = volunteerList[i + 1];

    // 获取位次数据的辅助函数 (优先取平滑位次，降级取最低位次)
    const getRank = (v) => v.smoothedRank || v.min_rank_lowest || (v.rank_history && v.rank_history[0]?.minRank) || 0;

    const currentRank = getRank(current);
    const nextRank = getRank(next);

    // 只有当两个都有有效位次数据时才校验
    if (currentRank > 0 && nextRank > 0) {
      // 正常情况：currentRank < nextRank (前难后易，位次数值递增)
      // 倒挂情况：nextRank < currentRank (后难前易)

      if (nextRank < currentRank) {
        // 计算倒挂程度
        const inversionRatio = (currentRank - nextRank) / currentRank;

        if (inversionRatio > INVERSION_THRESHOLD) {
          reports.push({
            index: i + 1, // 标记在后一个志愿上
            level: AUDIT_LEVELS.WARNING,
            type: 'GRADIENT_INVERSION',
            message: `志愿梯度倒挂风险：第 ${i + 2} 志愿「${next.school_name || next.name}」的历史录取位次(${nextRank})显著高于第 ${i + 1} 志愿(${currentRank})，建议调整顺序以避免浪费志愿名额。`
          });
        }
      }
    }
  }

  return reports;
}

/**
 * 辅助函数：根据审计结果判断是否允许导出
 */
export function canExport(auditReports) {
  return !auditReports.some(r => r.level === AUDIT_LEVELS.ERROR);
}
