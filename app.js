// app.js
const storage = require('./utils/storage.js');

App({
  globalData: {
    userId: ''
  },
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-d0g2f9pho3fc14998'
      });
      console.log('✅ 云开发初始化完成，环境: cloudbase-d0g2f9pho3fc14998');

      // 从云端同步数据到本地缓存（耗时操作，异步执行）
      storage.syncFromCloud();
    } else {
      console.warn('⚠️ wx.cloud 不可用，使用本地存储模式');
    }

    // 获取用户ID
    this.globalData.userId = storage.getUserId();
    
    // 检查今日彩虹卡
    const todayCard = storage.getTodayRainbowCard();
    if (todayCard) {
      console.log('今日已抽取彩虹卡:', todayCard.name);
    }
  }
});
