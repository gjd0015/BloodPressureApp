/**
 * 离线数据导出模块 (支持 CSV / Excel 友好格式)
 * 100% 本地生成，无需服务端介入，携带 UTF-8 BOM 彻底防止 Excel 中文乱码
 */

import { evaluateBloodPressure } from './health_rules.js';
import { getAllRecords } from './storage.js';

/**
 * 生成标准 CSV 文本字符串
 */
export function generateCSVContent(records = null) {
  const list = records || getAllRecords();

  const headers = [
    '测量时间',
    '高压(收缩压/mmHg)',
    '低压(舒张压/mmHg)',
    '脉搏(心率 次/分)',
    '评估等级',
    '测量场景',
    '医生/用药备注'
  ];

  const rows = list.map(item => {
    const evalRes = evaluateBloodPressure(item.sys, item.dia);
    return [
      `"${item.measureTime}"`,
      item.sys,
      item.dia,
      item.pulse,
      `"${evalRes.name}"`,
      `"${item.tag || '无'}"`,
      `"${(item.note || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  // 加入 UTF-8 BOM (\uFEFF) 保证各平台 Excel 打开均不乱码
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * 导出并触发保存/分享
 * @param {Function} onSuccess
 * @param {Function} onFail
 */
export function exportAndShareCSV(onSuccess, onFail) {
  try {
    const csvContent = generateCSVContent();
    const fileName = `血压健康测量记录_${formatDateForFilename(new Date())}.csv`;

    // #ifdef APP-PLUS
    // Android 原生环境：写入本地应用私有目录并调用系统分享
    const filePath = `_doc/${fileName}`;
    plus.io.requestFileSystem(plus.io.PRIVATE_DOC, fs => {
      fs.root.getFile(fileName, { create: true }, fileEntry => {
        fileEntry.createWriter(writer => {
          writer.onwriteend = () => {
            plus.share.sendWithSystem({
              type: 'file',
              title: '分享血压测量记录表',
              content: '血压历史测量健康记录',
              href: fileEntry.toURL()
            }, () => {
              if (onSuccess) onSuccess(fileEntry.toURL());
            }, (e) => {
              uni.showToast({ title: '已保存至文件目录', icon: 'success' });
              if (onSuccess) onSuccess(fileEntry.toURL());
            });
          };
          writer.onerror = (e) => {
            if (onFail) onFail(e);
          };
          writer.write(csvContent);
        }, onFail);
      }, onFail);
    }, onFail);
    // #endif

    // #ifdef H5
    // H5 / 网页环境：直接触发浏览器本地下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onSuccess) onSuccess(fileName);
    // #endif

    // #ifndef APP-PLUS || H5
    // 小程序或其它环境：复制到剪贴板
    uni.setClipboardData({
      data: csvContent,
      success: () => {
        uni.showToast({ title: 'CSV已复制到剪贴板', icon: 'success' });
        if (onSuccess) onSuccess();
      }
    });
    // #endif

  } catch (err) {
    console.error('导出CSV失败:', err);
    if (onFail) onFail(err);
  }
}

function formatDateForFilename(d) {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}${M}${D}_${h}${m}`;
}
