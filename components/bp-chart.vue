<template>
  <view class="chart-container">
    <canvas
      canvas-id="bpTrendCanvas"
      id="bpTrendCanvas"
      class="trend-canvas"
      @touchstart="onTouchCanvas"
    ></canvas>
    <view v-if="activePoint" class="chart-tooltip">
      <text class="tooltip-time">{{ activePoint.measureTime }}</text>
      <text class="tooltip-item sys">高压: {{ activePoint.sys }} mmHg</text>
      <text class="tooltip-item dia">低压: {{ activePoint.dia }} mmHg</text>
      <text class="tooltip-item pulse">脉搏: {{ activePoint.pulse }} bpm</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BpChart',
  props: {
    records: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activePoint: null,
      pointCoordinates: []
    };
  },
  watch: {
    records: {
      handler() {
        this.$nextTick(() => {
          this.drawChart();
        });
      },
      deep: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.drawChart();
    });
  },
  methods: {
    drawChart() {
      // 提取前 15 条记录并按时间升序展示折线
      const data = [...this.records]
        .slice(0, 15)
        .reverse();

      if (!data.length) return;

      const query = uni.createSelectorQuery().in(this);
      query.select('#bpTrendCanvas').boundingClientRect(res => {
        if (!res || !res.width || !res.height) return;

        const width = res.width;
        const height = res.height;
        const ctx = uni.createCanvasContext('bpTrendCanvas', this);

        // 清屏
        ctx.clearRect(0, 0, width, height);

        // 边距
        const padLeft = 40;
        const padRight = 20;
        const padTop = 30;
        const padBottom = 30;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        // 计算 Y 轴范围 (固定 40 ~ 180 mmHg)
        const minY = 40;
        const maxY = 180;

        const getY = (val) => {
          const clamped = Math.max(minY, Math.min(maxY, val));
          return padTop + plotH * (1 - (clamped - minY) / (maxY - minY));
        };

        const getX = (idx) => {
          if (data.length === 1) return padLeft + plotW / 2;
          return padLeft + (plotW / (data.length - 1)) * idx;
        };

        // 1. 绘制参考网格线与 Y 轴刻度
        const yTicks = [60, 90, 120, 140, 180];
        ctx.setLineWidth(1);
        ctx.setFontSize(10);
        ctx.setFillStyle('#94a3b8');

        yTicks.forEach(val => {
          const y = getY(val);
          ctx.setStrokeStyle(val === 140 || val === 90 ? '#fecaca' : '#f1f5f9');
          ctx.beginPath();
          ctx.moveTo(padLeft, y);
          ctx.lineTo(width - padRight, y);
          ctx.stroke();

          ctx.setTextAlign('right');
          ctx.fillText(String(val), padLeft - 6, y + 4);
        });

        // 140 警戒线标注
        ctx.setFillStyle('#ef4444');
        ctx.setTextAlign('left');
        ctx.fillText('高压警戒线 140', padLeft + 6, getY(140) - 4);

        // 2. 计算点坐标
        this.pointCoordinates = data.map((item, idx) => ({
          x: getX(idx),
          ySys: getY(item.sys),
          yDia: getY(item.dia),
          yPulse: getY(item.pulse),
          record: item
        }));

        // 3. 绘制舒张压(低压)折线 (绿色/青色)
        ctx.setStrokeStyle('#059669');
        ctx.setLineWidth(2.5);
        ctx.beginPath();
        this.pointCoordinates.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.yDia);
          else ctx.lineTo(p.x, p.yDia);
        });
        ctx.stroke();

        // 4. 绘制收缩压(高压)折线 (橙红色)
        ctx.setStrokeStyle('#f97316');
        ctx.setLineWidth(2.5);
        ctx.beginPath();
        this.pointCoordinates.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.ySys);
          else ctx.lineTo(p.x, p.ySys);
        });
        ctx.stroke();

        // 5. 绘制数据圆点
        this.pointCoordinates.forEach((p) => {
          // 高压点
          ctx.setFillStyle('#ffffff');
          ctx.setStrokeStyle('#ea580c');
          ctx.setLineWidth(2);
          ctx.beginPath();
          ctx.arc(p.x, p.ySys, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // 低压点
          ctx.setFillStyle('#ffffff');
          ctx.setStrokeStyle('#059669');
          ctx.beginPath();
          ctx.arc(p.x, p.yDia, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });

        // 6. X轴底部日期标签 (取首末与中间点)
        ctx.setFillStyle('#64748b');
        ctx.setFontSize(10);
        ctx.setTextAlign('center');
        const step = Math.max(1, Math.floor(data.length / 4));
        data.forEach((item, idx) => {
          if (idx % step === 0 || idx === data.length - 1) {
            const dateStr = (item.measureTime || '').split(' ')[0] || '';
            const shortDate = dateStr.slice(5); // MM-DD
            ctx.fillText(shortDate, getX(idx), height - 8);
          }
        });

        ctx.draw();
      }).exec();
    },
    onTouchCanvas(e) {
      const touch = e.touches[0];
      if (!touch || !this.pointCoordinates.length) return;

      const query = uni.createSelectorQuery().in(this);
      query.select('#bpTrendCanvas').boundingClientRect(res => {
        if (!res) return;
        const touchX = touch.clientX - res.left;

        // 寻找距离最近的 X 轴数据点
        let closest = this.pointCoordinates[0];
        let minDist = Math.abs(closest.x - touchX);

        for (let i = 1; i < this.pointCoordinates.length; i++) {
          const dist = Math.abs(this.pointCoordinates[i].x - touchX);
          if (dist < minDist) {
            minDist = dist;
            closest = this.pointCoordinates[i];
          }
        }

        if (minDist < 35) {
          this.activePoint = closest.record;
        } else {
          this.activePoint = null;
        }
      }).exec();
    }
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 400rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  box-sizing: border-box;
}

.trend-canvas {
  width: 100%;
  height: 100%;
}

.chart-tooltip {
  position: absolute;
  top: 16rpx;
  right: 24rpx;
  background-color: rgba(15, 23, 42, 0.9);
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  z-index: 10;
}

.tooltip-time {
  font-size: 20rpx;
  color: #94a3b8;
  font-weight: 500;
}

.tooltip-item {
  font-size: 22rpx;
  font-weight: 700;
}

.tooltip-item.sys {
  color: #fb923c;
}

.tooltip-item.dia {
  color: #34d399;
}

.tooltip-item.pulse {
  color: #a78bfa;
}
</style>
