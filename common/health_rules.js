/**
 * 《中国高血压防治指南》标准评估规则库 (100% 纯本地离线逻辑)
 */

export const BP_LEVELS = {
  OPTIMAL: {
    key: 'optimal',
    name: '理想血压',
    badge: '优',
    color: '#10b981', // 翡翠绿
    bg: '#ecfdf5',
    border: '#a7f3d0',
    desc: '血压非常健康，请继续保持良好的生活作息与饮食习惯。',
    advice: '清淡饮食，适度有氧运动，每年体检复查1次即可。'
  },
  NORMAL: {
    key: 'normal',
    name: '正常血压',
    badge: '正常',
    color: '#059669', // 绿色
    bg: '#ecfdf5',
    border: '#6ee7b7',
    desc: '各项指标在正常范围内，健康状况优良。',
    advice: '保持低盐低脂饮食，控制情绪，定期测量监测。'
  },
  HIGH_NORMAL: {
    key: 'high_normal',
    name: '正常高值',
    badge: '关注',
    color: '#f59e0b', // 琥珀黄
    bg: '#fffbeb',
    border: '#fde68a',
    desc: '处于临界高值，尚未确诊高血压，但需引起警惕。',
    advice: '减少食盐摄入，避免熬夜与久坐，建议每周监测2~3次。'
  },
  STAGE_1: {
    key: 'stage1',
    name: '1级高血压(轻度)',
    badge: '轻度',
    color: '#f97316', // 橙色
    bg: '#fff7ed',
    border: '#fed7aa',
    desc: '轻度高血压，建议非药物干预或遵医嘱管理。',
    advice: '每天早晚各测一次并记录，若持续偏高请咨询心血管医生。'
  },
  STAGE_2: {
    key: 'stage2',
    name: '2级高血压(中度)',
    badge: '中度',
    color: '#ef4444', // 红色
    bg: '#fef2f2',
    border: '#fca5a5',
    desc: '中度偏高，需警惕靶器官损伤风险。',
    advice: '请及时就医由医生制定降压方案，遵医嘱按时规范服药。'
  },
  STAGE_3: {
    key: 'stage3',
    name: '3级高血压(重度)',
    badge: '高危',
    color: '#b91c1c', // 深红色
    bg: '#450a0a',
    border: '#f87171',
    desc: '重度高危状态！极易引发心脑血管急性事件。',
    advice: '请立即卧床休息，静心平息，若出现头晕头痛请紧急就医！'
  },
  ISH: {
    key: 'ish',
    name: '单纯收缩期高血压',
    badge: '收缩高',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fdba74',
    desc: '高压偏高而低压正常，常见于中老年人动脉硬化。',
    advice: '起卧动作宜缓慢，避免体位性低血压，遵医嘱平稳调控。'
  },
  LOW: {
    key: 'low',
    name: '低血压',
    badge: '偏低',
    color: '#3b82f6', // 蓝色
    bg: '#eff6ff',
    border: '#bfdbfe',
    desc: '血压低于标准下限，可能引起头晕、乏力或供血不足。',
    advice: '适当增加水分和盐分摄入，补充营养，避免突然站立。'
  }
};

/**
 * 根据收缩压(高压)与舒张压(低压)计算判定等级
 * @param {number} sys 收缩压 (高压)
 * @param {number} dia 舒张压 (低压)
 * @returns {Object} 评级详情
 */
export function evaluateBloodPressure(sys, dia) {
  sys = Number(sys);
  dia = Number(dia);

  if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
    return BP_LEVELS.NORMAL;
  }

  // 1. 低血压判定
  if (sys < 90 || dia < 60) {
    return BP_LEVELS.LOW;
  }

  // 2. 单纯收缩期高血压 (高压>=140 且 低压<90)
  if (sys >= 140 && dia < 90) {
    return BP_LEVELS.ISH;
  }

  // 3. 3级高血压 (高压>=180 或 低压>=110)
  if (sys >= 180 || dia >= 110) {
    return BP_LEVELS.STAGE_3;
  }

  // 4. 2级高血压 (高压 160~179 或 低压 100~109)
  if (sys >= 160 || dia >= 100) {
    return BP_LEVELS.STAGE_2;
  }

  // 5. 1级高血压 (高压 140~159 或 低压 90~99)
  if (sys >= 140 || dia >= 90) {
    return BP_LEVELS.STAGE_1;
  }

  // 6. 正常高值 (高压 120~139 或 低压 80~89)
  if (sys >= 120 || dia >= 80) {
    return BP_LEVELS.HIGH_NORMAL;
  }

  // 7. 理想血压 (高压 < 120 且 低压 < 80)
  return BP_LEVELS.OPTIMAL;
}

/**
 * 脉搏(心率)健康状态判断
 * @param {number} pulse 次/分
 */
export function evaluatePulse(pulse) {
  pulse = Number(pulse);
  if (isNaN(pulse) || pulse <= 0) {
    return { status: '正常', color: '#10b981', desc: '心率正常' };
  }
  if (pulse < 60) {
    return { status: '心动过缓', color: '#3b82f6', desc: '低于60次/分，常见于运动员或心率偏缓人群' };
  }
  if (pulse > 100) {
    return { status: '心动过速', color: '#ef4444', desc: '高于100次/分，注意静坐放松、避免劳累或浓茶咖啡' };
  }
  return { status: '正常', color: '#10b981', desc: '60~100次/分，心律处于健康标准区间' };
}
