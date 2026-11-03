<template>
  <view v-if="visible" class="modal-mask" @tap.self="close">
    <view class="modal-box">
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">{{ isFromOCR ? '📸 识别结果确认' : '➕ 手动记录血压' }}</text>
        <view class="close-btn" @tap="close">✕</view>
      </view>

      <scroll-view scroll-y class="modal-body">
        <!-- 照片预览卡片 (若是拍照上传) -->
        <view v-if="formData.imageThumb" class="photo-preview-card">
          <image :src="formData.imageThumb" mode="aspectFit" class="photo-img"></image>
          <view class="photo-badge">
            <text class="photo-badge-text">✓ 屏幕已自动对准解析</text>
          </view>
        </view>

        <!-- 实时健康等级预判条 -->
        <view class="health-preview-bar" :style="{ backgroundColor: currentEval.bg, borderColor: currentEval.border }">
          <view class="health-preview-left">
            <text class="health-badge" :style="{ backgroundColor: currentEval.color }">{{ currentEval.name }}</text>
            <text class="health-desc" :style="{ color: currentEval.color }">{{ currentEval.desc }}</text>
          </view>
        </view>

        <!-- 三项核心指标输入 -->
        <view class="inputs-grid">
          <!-- 高压 / 收缩压 -->
          <view class="metric-card sys-card">
            <text class="metric-label">收缩压 (高压)</text>
            <view class="input-wrap">
              <input
                type="number"
                v-model.number="formData.sys"
                class="metric-input"
                placeholder="100"
                maxlength="3"
              />
              <text class="metric-unit">mmHg</text>
            </view>
            <text class="metric-hint">标准 < 120</text>
          </view>

          <!-- 低压 / 舒张压 -->
          <view class="metric-card dia-card">
            <text class="metric-label">舒张压 (低压)</text>
            <view class="input-wrap">
              <input
                type="number"
                v-model.number="formData.dia"
                class="metric-input"
                placeholder="73"
                maxlength="3"
              />
              <text class="metric-unit">mmHg</text>
            </view>
            <text class="metric-hint">标准 < 80</text>
          </view>

          <!-- 脉搏 / 心率 -->
          <view class="metric-card pulse-card">
            <text class="metric-label">脉搏 (心率)</text>
            <view class="input-wrap">
              <input
                type="number"
                v-model.number="formData.pulse"
                class="metric-input"
                placeholder="84"
                maxlength="3"
              />
              <text class="metric-unit">次/分</text>
            </view>
            <text class="metric-hint">正常 60~100</text>
          </view>
        </view>

        <!-- 测量时间 (根据拍照上传时间自动填充，亦可自由修改) -->
        <view class="form-item">
          <text class="item-label">⏱️ 测量时间 (自动提取)</text>
          <view class="picker-row">
            <picker mode="date" :value="datePart" @change="onDateChange">
              <view class="picker-btn">{{ datePart }}</view>
            </picker>
            <picker mode="time" :value="timePart" @change="onTimeChange">
              <view class="picker-btn">{{ timePart }}</view>
            </picker>
          </view>
        </view>

        <!-- 测量场景快捷标签 -->
        <view class="form-item">
          <text class="item-label">🏷️ 测量场景与时段</text>
          <view class="tag-selector">
            <view
              v-for="item in tagsList"
              :key="item.id"
              class="tag-item"
              :class="{ 'tag-item-active': formData.tag === item.label }"
              @tap="formData.tag = item.label"
            >
              <text class="tag-text">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <!-- 医生/生活备注 -->
        <view class="form-item">
          <text class="item-label">📝 备注 (可选，如服药/身体感受)</text>
          <input
            type="text"
            v-model="formData.note"
            class="note-input"
            placeholder="例：服药后半小时复测、晨起微晕等"
            maxlength="50"
          />
        </view>
      </scroll-view>

      <!-- 底部操作按钮 -->
      <view class="modal-footer">
        <button class="btn btn-cancel" @tap="close">取消</button>
        <button class="btn btn-save" @tap="save">确认保存</button>
      </view>
    </view>
  </view>
</template>

<script>
import { evaluateBloodPressure } from '@/common/health_rules.js';
import { PRESET_TAGS, formatDateTime } from '@/common/storage.js';

export default {
  name: 'BpRecordModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Object,
      default: () => ({})
    },
    isFromOCR: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tagsList: PRESET_TAGS,
      formData: {
        sys: 100,
        dia: 73,
        pulse: 84,
        measureTime: '',
        tag: '🌅 晨起静息',
        note: '',
        imageThumb: ''
      },
      datePart: '',
      timePart: ''
    };
  },
  computed: {
    currentEval() {
      return evaluateBloodPressure(this.formData.sys, this.formData.dia);
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm();
      }
    }
  },
  methods: {
    initForm() {
      const now = new Date();
      const defaultTime = this.initialData.measureTime || formatDateTime(now);
      this.formData = {
        sys: this.initialData.sys !== undefined ? this.initialData.sys : 100,
        dia: this.initialData.dia !== undefined ? this.initialData.dia : 73,
        pulse: this.initialData.pulse !== undefined ? this.initialData.pulse : 84,
        measureTime: defaultTime,
        tag: this.initialData.tag || '🌅 晨起静息',
        note: this.initialData.note || (this.isFromOCR ? '鱼跃血压计智能识别录入' : ''),
        imageThumb: this.initialData.imageThumb || ''
      };

      const parts = defaultTime.split(' ');
      this.datePart = parts[0] || defaultTime;
      this.timePart = parts[1] || '08:00';
    },
    onDateChange(e) {
      this.datePart = e.detail.value;
      this.syncMeasureTime();
    },
    onTimeChange(e) {
      this.timePart = e.detail.value;
      this.syncMeasureTime();
    },
    syncMeasureTime() {
      this.formData.measureTime = `${this.datePart} ${this.timePart}`;
    },
    close() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    save() {
      const sys = Number(this.formData.sys);
      const dia = Number(this.formData.dia);
      const pulse = Number(this.formData.pulse);

      if (!sys || sys < 50 || sys > 280) {
        uni.showToast({ title: '请输入合理的高压(50~280)', icon: 'none' });
        return;
      }
      if (!dia || dia < 30 || dia > 200) {
        uni.showToast({ title: '请输入合理的低压(30~200)', icon: 'none' });
        return;
      }
      if (dia >= sys) {
        uni.showToast({ title: '高压数值必须大于低压', icon: 'none' });
        return;
      }
      if (!pulse || pulse < 30 || pulse > 240) {
        uni.showToast({ title: '请输入合理的脉搏心率(30~240)', icon: 'none' });
        return;
      }

      this.$emit('save', {
        ...this.formData,
        sys,
        dia,
        pulse
      });
      this.close();
    }
  }
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 999;
}

.modal-box {
  width: 100%;
  max-height: 88vh;
  background-color: #ffffff;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.28s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  padding: 32rpx 36rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f1f5f9;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #0f172a;
}

.close-btn {
  font-size: 36rpx;
  color: #94a3b8;
  padding: 8rpx 16rpx;
}

.modal-body {
  padding: 24rpx 36rpx;
  max-height: calc(88vh - 240rpx);
}

.photo-preview-card {
  position: relative;
  width: 100%;
  height: 240rpx;
  background-color: #0f172a;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.photo-img {
  width: 100%;
  height: 100%;
}

.photo-badge {
  position: absolute;
  bottom: 12rpx;
  left: 12rpx;
  background-color: rgba(16, 185, 129, 0.85);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.photo-badge-text {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 600;
}

.health-preview-bar {
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  border-width: 2rpx;
  border-style: solid;
  margin-bottom: 28rpx;
}

.health-preview-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.health-badge {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  padding: 6rpx 16rpx;
  border-radius: 10rpx;
}

.health-desc {
  font-size: 24rpx;
  font-weight: 500;
  flex: 1;
}

.inputs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.metric-card {
  padding: 20rpx 12rpx;
  border-radius: 20rpx;
  background-color: #f8fafc;
  border: 2rpx solid #e2e8f0;
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8rpx;
}

.input-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.metric-input {
  font-size: 44rpx;
  font-weight: 800;
  color: #0f172a;
  width: 120rpx;
  text-align: center;
  height: 60rpx;
  line-height: 60rpx;
}

.metric-unit {
  font-size: 20rpx;
  color: #94a3b8;
  margin-left: 4rpx;
}

.metric-hint {
  display: block;
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 6rpx;
}

.form-item {
  margin-bottom: 28rpx;
}

.item-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #334155;
  margin-bottom: 14rpx;
}

.picker-row {
  display: flex;
  gap: 16rpx;
}

.picker-btn {
  background-color: #f1f5f9;
  padding: 18rpx 32rpx;
  border-radius: 14rpx;
  font-size: 28rpx;
  color: #0f172a;
  font-weight: 600;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  background-color: #f1f5f9;
  padding: 12rpx 22rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.tag-item-active {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

.tag-item-active .tag-text {
  color: #2563eb;
  font-weight: 700;
}

.tag-text {
  font-size: 24rpx;
  color: #475569;
}

.note-input {
  background-color: #f8fafc;
  border: 1rpx solid #cbd5e1;
  padding: 18rpx 24rpx;
  border-radius: 14rpx;
  font-size: 26rpx;
  color: #0f172a;
}

.modal-footer {
  padding: 24rpx 36rpx 44rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1rpx solid #f1f5f9;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  text-align: center;
}

.btn-cancel {
  background-color: #f1f5f9;
  color: #64748b;
}

.btn-save {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.35);
}
</style>
