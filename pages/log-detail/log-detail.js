const storage = require('../../utils/storage.js');

// 安全的回退方法
function safeBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack();
  } else {
    wx.reLaunch({ url: '/pages/logs/logs' });
  }
}

// 标签映射
const tagMap = {
  'emotion': { name: '情绪觉察', color: '#ec4899' },
  'energy': { name: '能量记录', color: '#f59e0b' },
  'gratitude': { name: '感恩日记', color: '#10b981' },
  'success': { name: '成功记录', color: '#3b82f6' }
};

Page({
  data: {
    logId: '',
    log: {}
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'error' });
      setTimeout(() => safeBack(), 1000);
      return;
    }

    this.setData({ logId: id });
    this.loadLog();
  },

  onShow() {
    // 每次显示时刷新数据（从其他页面返回时可能有变更）
    if (this.data.logId) {
      this.loadLog();
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  loadLog() {
    const logs = storage.getAllLogs();
    const log = logs.find(l => l.id === this.data.logId);
    
    if (!log) {
      wx.showToast({ title: '日志不存在', icon: 'error' });
      setTimeout(() => safeBack(), 1500);
      return;
    }

    const tagInfo = tagMap[log.tag] || { name: log.tag || '未分类', color: '#8b5cf6' };
    
    // 安全格式化日期
    let fullDateStr = '';
    let timeStr = '';
    try {
      const date = new Date(log.createdAt);
      if (!isNaN(date.getTime())) {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        fullDateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
        timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
    } catch (e) {
      console.warn('日期解析失败:', log.createdAt);
    }

    // 给图片数组加标记，用于错误处理
    const images = (log.images || []).map(url => ({ _url: url, _error: false }));

    this.setData({
      log: {
        ...log,
        tagName: tagInfo.name,
        tagColor: tagInfo.color,
        dateStr: fullDateStr,
        timeStr,
        images
      }
    });
  },

  goBack() {
    safeBack();
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    // 只预览有效的图片
    const validImages = this.data.log.images
      .filter(img => !img._error)
      .map(img => img._url);
    if (validImages.length === 0) return;
    wx.previewImage({
      current: url,
      urls: validImages
    });
  },

  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const log = this.data.log;
    if (log.images && log.images[index]) {
      log.images[index]._error = true;
      this.setData({ log });
    }
  },

  shareLog() {
    const { tagName, content } = this.data.log;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // 实际分享逻辑
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },

  copyLog() {
    const { tagName, content } = this.data.log;
    wx.setClipboardData({
      data: `【${tagName}】\n${content}`,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },
});
