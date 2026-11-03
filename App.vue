<script>
export default {
  onLaunch: function() {
    console.log('App Launch - 血压健康管家启动 (100% 本地离线模式)');
  },
  onShow: function() {
    console.log('App Show');
  },
  onHide: function() {
    console.log('App Hide');
  }
};
</script>

<style>
/* 每个页面公共css */
page {
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
}

view, text, scroll-view {
  box-sizing: border-box;
}

button::after {
  border: none;
}
</style>
