const storage = require('../../utils/storage.js');

const tagMap = {
  'emotion': { name: '情绪觉察', color: '#f472b6' },
  'energy': { name: '能量记录', color: '#fbbf24' },
  'gratitude': { name: '感恩日记', color: '#34d399' },
  'success': { name: '成功记录', color: '#60a5fa' }
};

Page({
  data: {
    logs: [],
    filteredLogs: [],
    groupedLogs: [],
    filterTags: ['全部类型'],
    filterIndex: 0,
    activeTag: '',
    activeTagName: ''
  },

  onLoad() {
    this.loadLogs();
  },

  onShow() {
    this.loadLogs();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  loadLogs() {
    const logs = storage.getAllLogs();
    const processedLogs = logs.map(log => ({
      ...log,
      tagName: tagMap[log.tag]?.name || log.tag,
      tagColor: tagMap[log.tag]?.color || '#8b5cf6',
      timeStr: this.formatTime(log.createdAt)
    }));
    
    // 动态构建筛选标签列表
    const seenTags = new Set();
    const dynamicTags = ['全部类型'];
    processedLogs.forEach(log => {
      if (!seenTags.has(log.tag)) {
        seenTags.add(log.tag);
        const name = tagMap[log.tag]?.name || log.tag;
        dynamicTags.push(name);
      }
    });
    
    this.setData({ 
      logs: processedLogs,
      filterTags: dynamicTags
    });
    this.doFilter();
  },

  formatTime(dateStr) {
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  formatDateStr(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === yesterday.toDateString()) return '昨天';
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
  },

  doFilter() {
    const { filterIndex, filterTags, logs } = this.data;
    
    let activeTag = '';
    let filteredLogs = logs;
    
    if (filterIndex > 0 && filterIndex < filterTags.length) {
      const selectedName = filterTags[filterIndex];
      // 反向查找 tag key
      for (const [key, val] of Object.entries(tagMap)) {
        if (val.name === selectedName) {
          activeTag = key;
          break;
        }
      }
      // 如果没找到预设映射，说明是自定义标签，直接用名称匹配
      if (!activeTag) {
        activeTag = selectedName;
      }
      filteredLogs = logs.filter(l => l.tagName === selectedName);
    }

    const grouped = {};
    filteredLogs.forEach(log => {
      const dateKey = this.formatDateStr(log.createdAt.split('T')[0]);
      if (!grouped[dateKey]) { grouped[dateKey] = { date: dateKey, logs: [] }; }
      grouped[dateKey].logs.push(log);
    });

    this.setData({
      filteredLogs,
      groupedLogs: Object.values(grouped),
      activeTag,
      activeTagName: activeTag ? (tagMap[activeTag]?.name || activeTag) : ''
    });
  },

  onFilterChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ filterIndex: index });
    this.doFilter();
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/log-create/log-create' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/log-detail/log-detail?id=${id}` });
  }
});
