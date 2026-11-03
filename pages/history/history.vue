<template>
  <view class="container">
    <!-- 头部操作区 -->
    <view class="header-card">
      <view class="header-title-row">
        <view>
          <text class="page-title">📁 测量历史记录</text>
          <text class="page-count">共 {{ filteredList.length }} 条记录 (本地离线保存)</text>
        </view>

        <!-- 导出 CSV 按钮 (用户选取的重点需求) -->
        <button class="btn-export" @tap="handleExportCSV">
          <text class="export-icon">📥</text>
          <text class="export-text">导出表格</text>
        </button>
      </view>

      <!-- 场景标签筛选器 -->
      <scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
        <view class="filter-row">
          <view
            class="filter-chip"
            :class="{ 'filter-chip-active': selectedTag === '全部' }"
            @tap="selectedTag = '全部'"
          >
            <text class="chip-text">全部</text>
          </view>
          <view
            v-for="t in presetTags"
            :key="t.id"
            class="filter-chip"
            :class="{ 'filter-chip-active': selectedTag === t.label }"
            @tap="selectedTag = t.label"
          >
            <text class="chip-text">{{ t.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 列表展示区 -->
    <view class="list-section">
      <view v-if="filteredList.length">
        <bp-card
          v-for="item in filteredList"
          :key="item.id"
          :record="item"
          @delete="onDeleteRecord"
        ></bp-card>
      </view>
      <view v-else class="empty-wrap">
        <text class="empty-icon">📂</text>
        <text class="empty-tip">未找到符合条件的测量记录</text>
      </view>
    </view>

    <!-- 底部辅助区 -->
    <view class="footer-actions">
      <text class="btn-clear" @tap="handleClearAll">清空全部历史</text>
    </view>
  </view>
</template>

<script>
import BpCard from '@/components/bp-card.vue';
import { getAllRecords, deleteRecord, clearAllRecords, PRESET_TAGS } from '@/common/storage.js';
import { exportAndShareCSV } from '@/common/export_csv.js';

export default {
  components: {
    BpCard
  },
  data() {
    return {
      allRecords: [],
      presetTags: PRESET_TAGS,
      selectedTag: '全部'
    };
  },
  computed: {
    filteredList() {
      if (this.selectedTag === '全部') {
        return this.allRecords;
      }
      return this.allRecords.filter(r => r.tag === this.selectedTag);
    }
  },
  onShow() {
    this.refresh();
  },
  methods: {
    refresh() {
      this.allRecords = getAllRecords();
    },
    onDeleteRecord(id) {
      this.allRecords = deleteRecord(id);
      uni.showToast({ title: '已删除', icon: 'none' });
    },
    handleExportCSV() {
      if (!this.allRecords.length) {
        uni.showToast({ title: '暂无记录可导出', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '正在生成表格...' });
      exportAndShareCSV(
        (target) => {
          uni.hideLoading();
          uni.showModal({
            title: '表格生成成功',
            content: '已成功导出标准 CSV 文件 (UTF-8 编码，Excel 直接打开无乱码)。可通过微信发送给医生或电脑查看！',
            showCancel: false
          });
        },
        (err) => {
          uni.hideLoading();
          uni.showToast({ title: '导出失败，请重试', icon: 'none' });
        }
      );
    },
    handleClearAll() {
      uni.showModal({
        title: '清空警告',
        content: '确定要清空手机上的所有本地血压记录吗？清空后无法恢复。',
        confirmColor: '#ef4444',
        success: (res) => {
          if (res.confirm) {
            clearAllRecords();
            this.allRecords = [];
            uni.showToast({ title: '已清空', icon: 'none' });
          }
        }
      });
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

.header-card {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.04);
}

.header-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #0f172a;
  display: block;
}

.page-count {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
  display: block;
}

.btn-export {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border-radius: 16rpx;
  padding: 0 24rpx;
  height: 68rpx;
  line-height: 68rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin: 0;
  box-shadow: 0 6rpx 16rpx rgba(16, 185, 129, 0.3);
}

.export-icon {
  font-size: 26rpx;
}

.export-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.filter-scroll {
  white-space: nowrap;
  width: 100%;
}

.filter-row {
  display: flex;
  gap: 12rpx;
}

.filter-chip {
  background-color: #f1f5f9;
  padding: 10rpx 24rpx;
  border-radius: 12rpx;
  display: inline-block;
  border: 1rpx solid transparent;
}

.filter-chip-active {
  background-color: #ecfdf5;
  border-color: #10b981;
}

.filter-chip-active .chip-text {
  color: #059669;
  font-weight: 700;
}

.chip-text {
  font-size: 24rpx;
  color: #475569;
}

.list-section {
  display: flex;
  flex-direction: column;
}

.empty-wrap {
  background-color: #ffffff;
  border-radius: 28rpx;
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #94a3b8;
}

.footer-actions {
  margin-top: 40rpx;
  text-align: center;
}

.btn-clear {
  font-size: 24rpx;
  color: #94a3b8;
  text-decoration: underline;
  padding: 12rpx 24rpx;
}
</style>
