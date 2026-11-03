<template>
  <view class="bp-card">
    <!-- 顶部状态栏 -->
    <view class="card-top">
      <view class="time-and-tag">
        <text class="time-text">{{ record.measureTime }}</text>
        <text class="tag-pill">{{ record.tag || '日常随测' }}</text>
      </view>
      <view class="level-badge" :style="{ backgroundColor: levelInfo.bg, borderColor: levelInfo.border }">
        <text class="level-text" :style="{ color: levelInfo.color }">{{ levelInfo.name }}</text>
      </view>
    </view>

    <!-- 核心指标大字 -->
    <view class="card-metrics">
      <!-- 血压主数值 -->
      <view class="metric-main">
        <view class="bp-values">
          <text class="num-sys">{{ record.sys }}</text>
          <text class="num-divider">/</text>
          <text class="num-dia">{{ record.dia }}</text>
          <text class="unit-text">mmHg</text>
        </view>
        <text class="sub-label">高压 / 低压</text>
      </view>

      <!-- 脉搏心率 -->
      <view class="metric-pulse">
        <view class="pulse-val-wrap">
          <text class="pulse-icon">❤️</text>
          <text class="pulse-num">{{ record.pulse }}</text>
          <text class="pulse-unit">bpm</text>
        </view>
        <text class="pulse-status" :style="{ color: pulseInfo.color }">{{ pulseInfo.status }}</text>
      </view>
    </view>

    <!-- 备注信息（若有） -->
    <view v-if="record.note" class="card-note">
      <text class="note-label">📝 备注：</text>
      <text class="note-content">{{ record.note }}</text>
    </view>

    <!-- 底部操作与建议 -->
    <view class="card-bottom">
      <text class="advice-text">{{ levelInfo.advice }}</text>
      <view class="action-buttons">
        <text class="btn-action btn-del" @tap.stop="onDelete">删除</text>
      </view>
    </view>
  </view>
</template>

<script>
import { evaluateBloodPressure, evaluatePulse } from '@/common/health_rules.js';

export default {
  name: 'BpCard',
  props: {
    record: {
      type: Object,
      required: true
    }
  },
  computed: {
    levelInfo() {
      return evaluateBloodPressure(this.record.sys, this.record.dia);
    },
    pulseInfo() {
      return evaluatePulse(this.record.pulse);
    }
  },
  methods: {
    onDelete() {
      uni.showModal({
        title: '确认删除',
        content: `确定删除该条记录 (${this.record.sys}/${this.record.dia} mmHg) 吗？`,
        confirmColor: '#ef4444',
        success: (res) => {
          if (res.confirm) {
            this.$emit('delete', this.record.id);
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.bp-card {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  border: 1rpx solid #f1f5f9;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.time-and-tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.time-text {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 500;
}

.tag-pill {
  font-size: 20rpx;
  background-color: #f1f5f9;
  color: #475569;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.level-badge {
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
  border-width: 2rpx;
  border-style: solid;
}

.level-text {
  font-size: 22rpx;
  font-weight: 700;
}

.card-metrics {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 12rpx 0 20rpx;
  border-bottom: 1rpx solid #f8fafc;
}

.metric-main {
  display: flex;
  flex-direction: column;
}

.bp-values {
  display: flex;
  align-items: baseline;
}

.num-sys {
  font-size: 58rpx;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1rpx;
}

.num-divider {
  font-size: 40rpx;
  font-weight: 400;
  color: #cbd5e1;
  margin: 0 8rpx;
}

.num-dia {
  font-size: 52rpx;
  font-weight: 800;
  color: #334155;
}

.unit-text {
  font-size: 22rpx;
  color: #94a3b8;
  margin-left: 10rpx;
  font-weight: 600;
}

.sub-label {
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.metric-pulse {
  text-align: right;
}

.pulse-val-wrap {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.pulse-icon {
  font-size: 24rpx;
  margin-right: 6rpx;
}

.pulse-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #0f172a;
}

.pulse-unit {
  font-size: 20rpx;
  color: #94a3b8;
  margin-left: 6rpx;
}

.pulse-status {
  font-size: 20rpx;
  font-weight: 600;
  margin-top: 4rpx;
  display: block;
}

.card-note {
  background-color: #f8fafc;
  padding: 12rpx 18rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
  display: flex;
  font-size: 22rpx;
  color: #475569;
}

.note-label {
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
}

.note-content {
  flex: 1;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18rpx;
}

.advice-text {
  font-size: 22rpx;
  color: #94a3b8;
  flex: 1;
  margin-right: 20rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  flex-shrink: 0;
}

.btn-action {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.btn-del {
  color: #ef4444;
  background-color: #fef2f2;
}
</style>
