/**
 * 本地离线持久化数据管理模块
 * 100% 本地存储于手机 SQLite / Storage，不发起任何网络请求，保护绝对隐私
 */

import { evaluateBloodPressure, evaluatePulse } from './health_rules.js';

const STORAGE_KEY = 'LOCAL_BLOOD_PRESSURE_RECORDS_V1';

// 预设测量标签库
export const PRESET_TAGS = [
  { id: 'morning', label: '🌅 晨起静息', color: '#3b82f6' },
  { id: 'before_sleep', label: '🌙 睡前测量', color: '#6366f1' },
  { id: 'before_meal', label: '🥗 饭前', color: '#10b981' },
  { id: 'after_meal', label: '🍱 饭后', color: '#f59e0b' },
  { id: 'after_med', label: '💊 服药后', color: '#ec4899' },
  { id: 'after_sport', label: '🏃 运动后', color: '#8b5cf6' },
  { id: 'normal', label: '📋 日常随测', color: '#64748b' }
];

/**
 * 格式化时间为 YYYY-MM-DD HH:mm
 */
export function formatDateTime(date = new Date()) {
  const d = new Date(date);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}`;
}

/**
 * 初始化模拟示例数据（仅在用户首次打开App且无数据时生成）
 */
function initDemoDataIfEmpty() {
  const now = new Date();
  const demoList = [
    {
      id: 'demo_1',
      sys: 100,
      dia: 73,
      pulse: 84,
      measureTime: formatDateTime(now),
      tag: '🌅 晨起静息',
      note: '图像智能识别录入 (鱼跃血压计)',
      imageThumb: '',
      createTime: now.getTime()
    },
    {
      id: 'demo_2',
      sys: 118,
      dia: 78,
      pulse: 76,
      measureTime: formatDateTime(new Date(now.getTime() - 24 * 3600 * 1000)),
      tag: '🌙 睡前测量',
      note: '状态良好，作息规律',
      imageThumb: '',
      createTime: now.getTime() - 24 * 3600 * 1000
    },
    {
      id: 'demo_3',
      sys: 126,
      dia: 82,
      pulse: 80,
      measureTime: formatDateTime(new Date(now.getTime() - 48 * 3600 * 1000)),
      tag: '🍱 饭后',
      note: '聚餐偏油腻，高压略升',
      imageThumb: '',
      createTime: now.getTime() - 48 * 3600 * 1000
    },
    {
      id: 'demo_4',
      sys: 115,
      dia: 75,
      pulse: 72,
      measureTime: formatDateTime(new Date(now.getTime() - 72 * 3600 * 1000)),
      tag: '🌅 晨起静息',
      note: '晨起排空后静坐5分钟测量',
      imageThumb: '',
      createTime: now.getTime() - 72 * 3600 * 1000
    },
    {
      id: 'demo_5',
      sys: 122,
      dia: 80,
      pulse: 78,
      measureTime: formatDateTime(new Date(now.getTime() - 96 * 3600 * 1000)),
      tag: '📋 日常随测',
      note: '日常健康追踪',
      imageThumb: '',
      createTime: now.getTime() - 96 * 3600 * 1000
    }
  ];

  uni.setStorageSync(STORAGE_KEY, JSON.stringify(demoList));
  return demoList;
}

/**
 * 获取所有本地记录（按测量时间倒序）
 */
export function getAllRecords() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (!raw) {
      return initDemoDataIfEmpty();
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) {
      return initDemoDataIfEmpty();
    }
    // 按测量时间字符串倒序
    return list.sort((a, b) => (b.measureTime > a.measureTime ? 1 : -1));
  } catch (e) {
    console.error('读取本地血压数据失败:', e);
    return [];
  }
}

/**
 * 新增一条测量记录
 * @param {Object} item { sys, dia, pulse, measureTime, tag, note, imageThumb }
 */
export function addRecord(item) {
  const list = getAllRecords();
  const newRecord = {
    id: 'bp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    sys: Number(item.sys),
    dia: Number(item.dia),
    pulse: Number(item.pulse),
    measureTime: item.measureTime || formatDateTime(),
    tag: item.tag || '📋 日常随测',
    note: item.note || '',
    imageThumb: item.imageThumb || '',
    createTime: Date.now()
  };

  list.unshift(newRecord);
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list));
  return newRecord;
}

/**
 * 更新记录
 */
export function updateRecord(id, updatedFields) {
  const list = getAllRecords();
  const index = list.findIndex(r => r.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updatedFields };
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(list));
    return true;
  }
  return false;
}

/**
 * 删除记录
 */
export function deleteRecord(id) {
  const list = getAllRecords();
  const filtered = list.filter(r => r.id !== id);
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

/**
 * 清空所有数据
 */
export function clearAllRecords() {
  uni.removeStorageSync(STORAGE_KEY);
}

/**
 * 统计分析计算（平均收缩压、平均舒张压、平均脉搏、最高/最低）
 */
export function getStatistics(records = null) {
  const list = records || getAllRecords();
  if (!list.length) {
    return {
      count: 0,
      avgSys: 0,
      avgDia: 0,
      avgPulse: 0,
      maxSys: 0,
      minSys: 0,
      maxDia: 0,
      minDia: 0,
      optimalCount: 0,
      abnormalCount: 0
    };
  }

  let totalSys = 0;
  let totalDia = 0;
  let totalPulse = 0;
  let maxSys = -Infinity;
  let minSys = Infinity;
  let maxDia = -Infinity;
  let minDia = Infinity;
  let optimalCount = 0;
  let abnormalCount = 0;

  list.forEach(r => {
    const s = Number(r.sys);
    const d = Number(r.dia);
    const p = Number(r.pulse);

    totalSys += s;
    totalDia += d;
    totalPulse += p;

    if (s > maxSys) maxSys = s;
    if (s < minSys) minSys = s;
    if (d > maxDia) maxDia = d;
    if (d < minDia) minDia = d;

    const evalResult = evaluateBloodPressure(s, d);
    if (evalResult.key === 'optimal' || evalResult.key === 'normal') {
      optimalCount++;
    } else {
      abnormalCount++;
    }
  });

  const count = list.length;
  return {
    count,
    avgSys: Math.round(totalSys / count),
    avgDia: Math.round(totalDia / count),
    avgPulse: Math.round(totalPulse / count),
    maxSys: maxSys === -Infinity ? 0 : maxSys,
    minSys: minSys === Infinity ? 0 : minSys,
    maxDia: maxDia === -Infinity ? 0 : maxDia,
    minDia: minDia === Infinity ? 0 : minDia,
    optimalCount,
    abnormalCount,
    normalRate: Math.round((optimalCount / count) * 100)
  };
}
