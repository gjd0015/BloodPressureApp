<template>
  <view class="container">
    <view class="chart-header">
      <text class="page-title">📈 血压趋势与统计</text>
      <text class="page-desc">基于中国高血压防治指南标准综合评估</text>

      <!-- 时间区间切换 -->
      <view class="range-tabs">
        <view
          v-for="tab in rangeTabs"
          :key="tab.days"
          class="range-tab"
          :class="{ 'range-tab-active': currentDays === tab.days }"
          @tap="switchRange(tab.days)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 趋势折线图卡片 -->
    <view class="chart-card">
      <view class="chart-card-header">
        <text class="chart-card-title">📉 血压双轨走势</text>
        <view class="chart-legend">
          <view class="legend-item"><text class="legend-dot dot-sys"></text><text>高压</text></view>
          <view class="legend-item"><text class="legend-dot dot-dia"></text><text>低压</text></view>
        </view>
      </view>

      <bp-chart :records="filteredRecords"></bp-chart>
      <text class="chart-hint">💡 点击图表任意数据点可查看该次测量的详细数值与时间</text>
    </view>

    <!-- 核心统计大卡 -->
    <view class="stats-card">
      <text class="stats-title">📋 区间健康数据汇总</text>
      <view class="stats-grid">
        <view class="stat-cell">
          <text class="stat-value text-sys">{{ stats.avgSys }}</text>
          <text class="stat-label">平均高压(mmHg)</text>
          <text class="stat-sub">最高 {{ stats.maxSys }} / 最低 {{ stats.minSys }}</text>
        </view>
        <view class="stat-cell">
          <text class="stat-value text-dia">{{ stats.avgDia }}</text>
          <text class="stat-label">平均低压(mmHg)</text>
          <text class="stat-sub">最高 {{ stats.maxDia }} / 最低 {{ stats.minDia }}</text>
        </view>
        <view class="stat-cell">
          <text class="stat-value text-pulse">{{ stats.avgPulse }}</text>
          <text class="stat-label">平均脉搏(次/分)</text>
          <text class="stat-sub">达标率 {{ stats.normalRate }}%</text>
        </view>
      </view>
    </view>

    <!-- 血压等级分布占比 -->
    <view class="distribution-card">
      <text class="dist-title">🌈 血压等级分布占比</text>
      <view class="dist-list">
        <view v-for="d in distributionList" :key="d.key" class="dist-row">
          <view class="dist-left">
            <text class="dist-badge" :style="{ backgroundColor: d.color }">{{ d.name }}</text>
            <text class="dist-count">{{ d.count }} 次 ({{ d.percent }}%)</text>
          </view>
          <view class="dist-bar-wrap">
            <view class="dist-bar-fill" :style="{ width: d.percent + '%', backgroundColor: d.color }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 临床参考标准表 -->
    <view class="guide-card">
      <text class="guide-title">📖 《中国高血压防治指南》标准对照表</text>
      <view class="guide-table">
        <view class="guide-tr guide-th">
          <text class="th-col">等级分类</text>
          <text class="th-col">收缩压(高压)</text>
          <text class="th-col">舒张压(低压)</text>
        </view>
        <view class="guide-tr">
          <text class="td-col text-green font-bold">理想血压</text>
          <text class="td-col">&lt; 120</text>
          <text class="td-col">&lt; 80</text>
        </view>
        <view class="guide-tr">
          <text class="td-col text-emerald">正常高值</text>
          <text class="td-col">120 ~ 139</text>
          <text class="td-col">80 ~ 89</text>
        </view>
        <view class="guide-tr">
          <text class="td-col text-amber">1级高血压(轻度)</text>
          <text class="td-col">140 ~ 159</text>
          <text class="td-col">90 ~ 99</text>
        </view>
        <view class="guide-tr">
          <text class="td-col text-orange">2级高血压(中度)</text>
          <text class="td-col">160 ~ 179</text>
          <text class="td-col">100 ~ 109</text>
        </view>
        <view class="guide-tr">
          <text class="td-col text-red font-bold">3级高血压(重度)</text>
          <text class="td-col">&ge; 180</text>
          <text class="td-col">&ge; 110</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import BpChart from '@/components/bp-chart.vue';
import { getAllRecords, getStatistics } from '@/common/storage.js';
import { evaluateBloodPressure, BP_LEVELS } from '@/common/health_rules.js';

export default {
  components: {
    BpChart
  },
  data() {
    return {
      allRecords: [],
      filteredRecords: [],
      stats: {},
      currentDays: 30,
      rangeTabs: [
        { label: '近 7 天', days: 7 },
        { label: '近 30 天', days: 30 },
        { label: '全部记录', days: 9999 }
      ]
    };
  },
  computed: {
    distributionList() {
      if (!this.filteredRecords.length) return [];
      const total = this.filteredRecords.length;
      const countMap = {};

      this.filteredRecords.forEach(r => {
        const res = evaluateBloodPressure(r.sys, r.dia);
        countMap[res.key] = (countMap[res.key] || 0) + 1;
      });

      return Object.values(BP_LEVELS).map(lvl => {
        const count = countMap[lvl.key] || 0;
        const percent = Math.round((count / total) * 100);
        return {
          key: lvl.key,
          name: lvl.name,
          color: lvl.color,
          count,
          percent
        };
      }).filter(item => item.count > 0);
    }
  },
  onShow() {
    this.refresh();
  },
  methods: {
    refresh() {
      this.allRecords = getAllRecords();
      this.applyFilter();
    },
    switchRange(days) {
      this.currentDays = days;
      this.applyFilter();
    },
    applyFilter() {
      if (this.currentDays === 9999) {
        this.filteredRecords = [...this.allRecords];
      } else {
        const threshold = Date.now() - this.currentDays * 24 * 3600 * 1000;
        this.filteredRecords = this.allRecords.filter(r => (r.createTime || 0) >= threshold);
      }
      this.stats = getStatistics(this.filteredRecords);
    }
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 36rpx;
  padding-bottom: 60rpx;
}

.chart-header {
  margin-bottom: 28rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
}

.page-desc {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 6rpx;
  display: block;
}

.range-tabs {
  display: flex;
  background-color: #e2e8f0;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-top: 24rpx;
}

.range-tab {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 12rpx;
}

.range-tab-active {
  background-color: #ffffff;
  box-shadow: 0 4rpx 10rpx rgba(15, 23, 42, 0.08);
}

.range-tab-active .tab-text {
  color: #0f172a;
  font-weight: 700;
}

.tab-text {
  font-size: 24rpx;
  color: #64748b;
}

.chart-card {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.04);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.chart-card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
}

.chart-legend {
  display: flex;
  gap: 16rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: #64748b;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.dot-sys {
  background-color: #f97316;
}

.dot-dia {
  background-color: #059669;
}

.chart-hint {
  font-size: 20rpx;
  color: #94a3b8;
  display: block;
  margin-top: 16rpx;
  text-align: center;
}

.stats-card {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
}

.stats-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20rpx;
  display: block;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.stat-cell {
  background-color: #f8fafc;
  padding: 20rpx 12rpx;
  border-radius: 20rpx;
  text-align: center;
}

.stat-value {
  font-size: 44rpx;
  font-weight: 900;
  display: block;
}

.text-sys {
  color: #f97316;
}

.text-dia {
  color: #059669;
}

.text-pulse {
  color: #e11d48;
}

.stat-label {
  font-size: 20rpx;
  color: #64748b;
  margin-top: 4rpx;
  display: block;
}

.stat-sub {
  font-size: 18rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.distribution-card {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
}

.dist-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20rpx;
  display: block;
}

.dist-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.dist-row {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dist-left {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dist-badge {
  font-size: 22rpx;
  color: #ffffff;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-weight: 600;
}

.dist-count {
  font-size: 22rpx;
  color: #64748b;
  font-weight: 600;
}

.dist-bar-wrap {
  width: 100%;
  height: 12rpx;
  background-color: #f1f5f9;
  border-radius: 6rpx;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  border-radius: 6rpx;
}

.guide-card {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
}

.guide-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #334155;
  margin-bottom: 20rpx;
  display: block;
}

.guide-table {
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  overflow: hidden;
}

.guide-tr {
  display: flex;
  border-bottom: 1rpx solid #e2e8f0;
}

.guide-tr:last-child {
  border-bottom: none;
}

.guide-th {
  background-color: #f1f5f9;
  font-weight: 700;
  color: #475569;
}

.th-col,
.td-col {
  flex: 1;
  font-size: 22rpx;
  padding: 16rpx 12rpx;
  text-align: center;
}

.text-green {
  color: #10b981;
}

.text-emerald {
  color: #059669;
}

.text-amber {
  color: #d97706;
}

.text-orange {
  color: #ea580c;
}

.text-red {
  color: #dc2626;
}

.font-bold {
  font-weight: 700;
}
</style>
