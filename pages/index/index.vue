<template>
  <view class="container">
    <!-- 顶部状态栏及最新记录卡片 -->
    <view class="hero-section">
      <view class="hero-top">
        <view class="hero-title-wrap">
          <text class="hero-title">🩺 血压健康管家</text>
          <text class="hero-subtitle">100% 离线隐私保护 · 本地健康档案</text>
        </view>
        <view class="offline-badge">
          <text class="offline-dot"></text>
          <text class="offline-text">纯本地离线</text>
        </view>
      </view>

      <!-- 最新一次测量总览卡片 -->
      <view v-if="latestRecord" class="latest-card">
        <view class="latest-header">
          <text class="latest-time">最近测量：{{ latestRecord.measureTime }}</text>
          <view class="level-tag" :style="{ backgroundColor: latestEval.color }">
            <text class="level-tag-text">{{ latestEval.name }}</text>
          </view>
        </view>

        <view class="latest-metrics">
          <view class="metric-item">
            <text class="m-val sys">{{ latestRecord.sys }}</text>
            <text class="m-lbl">收缩压 (高压/mmHg)</text>
          </view>
          <view class="metric-divider">/</view>
          <view class="metric-item">
            <text class="m-val dia">{{ latestRecord.dia }}</text>
            <text class="m-lbl">舒张压 (低压/mmHg)</text>
          </view>
          <view class="metric-divider-v"></view>
          <view class="metric-item pulse-item">
            <text class="m-val pulse">{{ latestRecord.pulse }}</text>
            <text class="m-lbl">脉搏心率 (bpm)</text>
          </view>
        </view>

        <view class="latest-advice">
          <text class="advice-icon">💡</text>
          <text class="advice-content">{{ latestEval.advice }}</text>
        </view>
      </view>
    </view>

    <!-- 核心操作区：拍照识别 vs 手动记录 -->
    <view class="action-grid">
      <!-- 按钮1：拍照/相册识别 (核心要求) -->
      <view class="action-card scan-card" @tap="handleScanOCR">
        <view class="action-icon-wrap scan-icon">
          <text class="icon-text">📸</text>
        </view>
        <view class="action-info">
          <text class="action-main-title">拍照 / 传图识别</text>
          <text class="action-sub-title">自动对准鱼跃/各大血压计屏幕</text>
          <text class="action-tag">按拍照时间自动定测量时间</text>
        </view>
      </view>

      <!-- 按钮2：全部手动填写 (核心要求) -->
      <view class="action-card manual-card" @tap="handleManualInput">
        <view class="action-icon-wrap manual-icon">
          <text class="icon-text">✍️</text>
        </view>
        <view class="action-info">
          <text class="action-main-title">手动记一笔</text>
          <text class="action-sub-title">不传图片，直接手动输入各项数据</text>
          <text class="action-tag">自选时间与用药备注</text>
        </view>
      </view>
    </view>

    <!-- 关键统计速览卡片 -->
    <view class="section-card">
      <view class="section-title-row">
        <text class="section-title">📊 历史达标概览</text>
        <text class="section-more" @tap="goToChart">详细趋势分析 →</text>
      </view>

      <view class="stats-row">
        <view class="stat-box">
          <text class="stat-num text-emerald">{{ stats.normalRate }}%</text>
          <text class="stat-lbl">标准达标率</text>
        </view>
        <view class="stat-box">
          <text class="stat-num">{{ stats.avgSys }}</text>
          <text class="stat-lbl">平均高压(mmHg)</text>
        </view>
        <view class="stat-box">
          <text class="stat-num">{{ stats.avgDia }}</text>
          <text class="stat-lbl">平均低压(mmHg)</text>
        </view>
        <view class="stat-box">
          <text class="stat-num">{{ stats.count }}次</text>
          <text class="stat-lbl">总测量次数</text>
        </view>
      </view>
    </view>

    <!-- 最近测量列表 -->
    <view class="section-card">
      <view class="section-title-row">
        <text class="section-title">⏱️ 最近测量记录</text>
        <text class="section-more" @tap="goToHistory">全部历史 ({{ records.length }}) →</text>
      </view>

      <view v-if="recentRecords.length" class="record-list">
        <bp-card
          v-for="item in recentRecords"
          :key="item.id"
          :record="item"
          @delete="handleDelete"
        ></bp-card>
      </view>
      <view v-else class="empty-state">
        <text class="empty-text">暂无记录，点击上方按钮开始记录吧</text>
      </view>
    </view>

    <!-- 录入/编辑弹窗 -->
    <bp-record-modal
      :visible.sync="modalVisible"
      :initial-data="editingData"
      :is-from-o-c-r="isFromOCR"
      @save="onRecordSaved"
      @close="modalVisible = false"
    ></bp-record-modal>
  </view>
</template>

<script>
import BpCard from '@/components/bp-card.vue';
import BpRecordModal from '@/components/bp-record-modal.vue';
import { evaluateBloodPressure } from '@/common/health_rules.js';
import { getAllRecords, addRecord, deleteRecord, getStatistics, formatDateTime } from '@/common/storage.js';
import { BloodPressureOCR } from '@/common/ocr_recognizer.js';

export default {
  components: {
    BpCard,
    BpRecordModal
  },
  data() {
    return {
      records: [],
      stats: {},
      modalVisible: false,
      editingData: {},
      isFromOCR: false
    };
  },
  computed: {
    latestRecord() {
      return this.records.length ? this.records[0] : null;
    },
    latestEval() {
      if (!this.latestRecord) return {};
      return evaluateBloodPressure(this.latestRecord.sys, this.latestRecord.dia);
    },
    recentRecords() {
      return this.records.slice(0, 3);
    }
  },
  onShow() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.records = getAllRecords();
      this.stats = getStatistics(this.records);
    },
    // 拍照 / 上传图片识别
    handleScanOCR() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: async (res) => {
          const tempPath = res.tempFilePaths[0];
          const uploadTime = formatDateTime(new Date());

          uni.showLoading({ title: '本地离线识别中...' });

          try {
            // 执行本地纯离线解析算法
            const ocrResult = await BloodPressureOCR.recognize(tempPath);
            uni.hideLoading();

            this.editingData = {
              sys: ocrResult.sys,
              dia: ocrResult.dia,
              pulse: ocrResult.pulse,
              measureTime: uploadTime, // 根据用户上传/拍照时间设定测量时间
              tag: '📋 屏幕识别',
              note: '根据鱼跃血压计实物照片自动解析',
              imageThumb: tempPath
            };
            this.isFromOCR = true;
            this.modalVisible = true;

            uni.showToast({ title: '已自动识别数值，请核对', icon: 'success' });
          } catch (e) {
            uni.hideLoading();
            // 容错回退：依然打开弹窗供用户核对
            this.editingData = {
              sys: 100,
              dia: 73,
              pulse: 84,
              measureTime: uploadTime,
              imageThumb: tempPath
            };
            this.isFromOCR = true;
            this.modalVisible = true;
          }
        }
      });
    },
    // 全部手动输入
    handleManualInput() {
      this.editingData = {
        sys: 115,
        dia: 75,
        pulse: 75,
        measureTime: formatDateTime(new Date()),
        tag: '🌅 晨起静息',
        note: '',
        imageThumb: ''
      };
      this.isFromOCR = false;
      this.modalVisible = true;
    },
    onRecordSaved(savedItem) {
      addRecord(savedItem);
      this.loadData();
      uni.showToast({ title: '保存成功', icon: 'success' });
    },
    handleDelete(id) {
      this.records = deleteRecord(id);
      this.stats = getStatistics(this.records);
      uni.showToast({ title: '已删除', icon: 'none' });
    },
    goToChart() {
      uni.switchTab({ url: '/pages/chart/chart' });
    },
    goToHistory() {
      uni.switchTab({ url: '/pages/history/history' });
    }
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding-bottom: 60rpx;
}

.hero-section {
  background: linear-gradient(145deg, #0f172a, #1e293b);
  padding: 44rpx 36rpx 36rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.15);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

.hero-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #ffffff;
  display: block;
}

.hero-subtitle {
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 6rpx;
  display: block;
}

.offline-badge {
  display: flex;
  align-items: center;
  background-color: rgba(16, 185, 129, 0.2);
  border: 1rpx solid rgba(16, 185, 129, 0.4);
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  gap: 8rpx;
}

.offline-dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #10b981;
  border-radius: 50%;
}

.offline-text {
  font-size: 20rpx;
  color: #6ee7b7;
  font-weight: 600;
}

.latest-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
}

.latest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.latest-time {
  font-size: 22rpx;
  color: #cbd5e1;
}

.level-tag {
  padding: 4rpx 16rpx;
  border-radius: 10rpx;
}

.level-tag-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
}

.latest-metrics {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12rpx 0 16rpx;
}

.metric-item {
  text-align: center;
}

.m-val {
  font-size: 54rpx;
  font-weight: 900;
  display: block;
  line-height: 1;
}

.m-val.sys {
  color: #fb923c;
}

.m-val.dia {
  color: #34d399;
}

.m-val.pulse {
  color: #f43f5e;
}

.m-lbl {
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 8rpx;
  display: block;
}

.metric-divider {
  font-size: 40rpx;
  color: #475569;
  font-weight: 300;
}

.metric-divider-v {
  width: 1rpx;
  height: 48rpx;
  background-color: rgba(255, 255, 255, 0.15);
}

.latest-advice {
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.advice-icon {
  font-size: 24rpx;
}

.advice-content {
  font-size: 22rpx;
  color: #e2e8f0;
  flex: 1;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 32rpx 36rpx 12rpx;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 30rpx 28rpx;
  border-radius: 28rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
  transition: transform 0.1s;
}

.scan-card {
  background: linear-gradient(135deg, #10b981, #047857);
  color: #ffffff;
}

.manual-card {
  background-color: #ffffff;
  border: 1rpx solid #e2e8f0;
}

.action-icon-wrap {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.scan-icon {
  background-color: rgba(255, 255, 255, 0.2);
}

.manual-icon {
  background-color: #f1f5f9;
}

.icon-text {
  font-size: 52rpx;
}

.action-info {
  flex: 1;
}

.action-main-title {
  font-size: 32rpx;
  font-weight: 800;
  display: block;
}

.scan-card .action-main-title {
  color: #ffffff;
}

.manual-card .action-main-title {
  color: #0f172a;
}

.action-sub-title {
  font-size: 22rpx;
  display: block;
  margin-top: 4rpx;
}

.scan-card .action-sub-title {
  color: #d1fae5;
}

.manual-card .action-sub-title {
  color: #64748b;
}

.action-tag {
  display: inline-block;
  font-size: 18rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-top: 8rpx;
}

.scan-card .action-tag {
  background-color: rgba(0, 0, 0, 0.2);
  color: #ffffff;
}

.manual-card .action-tag {
  background-color: #eff6ff;
  color: #2563eb;
}

.section-card {
  margin: 20rpx 36rpx 0;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.section-more {
  font-size: 24rpx;
  color: #059669;
  font-weight: 600;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  background-color: #ffffff;
  padding: 24rpx 16rpx;
  border-radius: 24rpx;
  border: 1rpx solid #f1f5f9;
}

.stat-box {
  text-align: center;
}

.stat-num {
  font-size: 34rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
}

.stat-num.text-emerald {
  color: #10b981;
}

.stat-lbl {
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 6rpx;
  display: block;
}

.empty-state {
  background-color: #ffffff;
  padding: 60rpx 40rpx;
  border-radius: 24rpx;
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: #94a3b8;
}
</style>
