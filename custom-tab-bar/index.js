Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/rainbow-card/rainbow-card',
        text: '彩虹卡',
        icon: 'sparkle'
      },
      {
        pagePath: '/pages/tasks/tasks',
        text: '任务',
        icon: 'tasks'
      },
      {
        pagePath: '/pages/logs/logs',
        text: '日志',
        icon: 'journal'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      if (item == null) return;

      // 避免重复跳转当前 tab
      if (this.data.selected === index) return;

      // 先更新选中状态，给用户即时视觉反馈
      this.setData({ selected: index });

      wx.switchTab({ url: item.pagePath });
    }
  }
});
