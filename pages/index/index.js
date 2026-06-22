Page({
  data: {},

  onLoad() {
    // 启动页展示 1.5 秒后进入彩虹卡 tab
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/rainbow-card/rainbow-card',
        fail(err) {
          console.error('switchTab failed:', err);
        }
      });
    }, 1500);
  }
});
