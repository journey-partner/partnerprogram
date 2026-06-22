const storage = require('../../utils/storage.js');
const rainbowCards = require('../../utils/rainbowCards.js');

// 根据颜色获取背景渐变
function getCardBgColor(color) {
  const colors = {
    red: '#ee5a24',
    orange: '#ff7f50',
    yellow: '#f9ca24',
    green: '#2ed573',
    blue: '#1e90ff',
    indigo: '#3742fa',
    purple: '#8e44ad',
    pink: '#ff4081',
    gold: '#f1c40f',
    white: '#e8e8e8'
  };
  return colors[color] || colors.green;
}

// 根据颜色获取图标
function getCardIcon(color) {
  const icons = {
    red: '💪',
    orange: '🎨',
    yellow: '☀️',
    green: '🌿',
    blue: '💙',
    indigo: '🔮',
    purple: '✨',
    pink: '💕',
    gold: '🌟',
    white: '🕊️'
  };
  return icons[color] || '✨';
}

// 获取行动建议
function getActions(card) {
  const allActions = [
    '今天尝试对身边的人微笑，让自己和他人都感受到温暖',
    '给自己一个拥抱，告诉自己"你已经做得很好了"',
    '写下今天让你感恩的三件事',
    '花5分钟静心呼吸，感受当下的美好',
    '做一些让自己开心的小事，哪怕只是听一首喜欢的歌',
    '给好久没联系的朋友发一条问候消息',
    '今天尝试学习一项新技能或了解一个新知识',
    '做一件帮助他人的小事，传递正能量',
    '今天对自己说三句肯定的话',
    '安排一段独处的时间，好好陪伴自己',
    '整理一下自己的空间，让环境更加舒适',
    '今天多喝水，照顾好身体这件"神殿"',
    '尝试用左手做一些日常事务，激活新的脑细胞',
    '给未来的自己写一封信',
    '今天说一句平时不好意思说出口的赞美'
  ];
  
  // 根据卡片颜色选择相关行动
  const colorActions = {
    red: ['今天充满活力地行动吧', '给自己安排一些运动', '展现你的热情和勇气'],
    orange: ['发挥你的创造力', '尝试艺术表达', '感受情感的流动'],
    yellow: ['建立自信', '相信自己', '展现你的光芒'],
    green: ['关爱自己', '让自己平静下来', '感受治愈的力量'],
    blue: ['清晰表达', '静心倾听', '感受宁静'],
    indigo: ['相信直觉', '探索内在', '照见真实'],
    purple: ['连接内在智慧', '冥想静心', '感受合一'],
    pink: ['爱自己', '接纳自己', '温柔对待'],
    gold: ['接受丰盛', '展现智慧', '认识价值'],
    white: ['净化心灵', '感受新生', '拥抱当下']
  };

  const specific = colorActions[card.color] || [];
  const shuffled = [...allActions].sort(() => Math.random() - 0.5);
  
  return [...specific, ...shuffled].slice(0, 3);
}

Page({
  data: {
    hasDrawn: false,
    isAnimating: false,
    showCard: false,
    flipClass: '',
    cardName: '',
    cardIcon: '',
    cardBgColor: '',
    cardMeaning: '',
    cardAffirmation: '',
    actions: []
  },

  onLoad() {
    // 检查今日是否已抽取
    const todayCard = storage.getTodayRainbowCard();
    if (todayCard) {
      this.setData({
        hasDrawn: true,
        showCard: true,
        cardName: todayCard.name,
        cardIcon: getCardIcon(todayCard.color),
        cardBgColor: getCardBgColor(todayCard.color),
        cardMeaning: todayCard.meaning,
        cardAffirmation: todayCard.affirmation,
        actions: getActions(todayCard)
      });
    }
  },

  onShow() {
    // 通知 tab bar 当前选中项
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  drawCard() {
    if (this.data.isAnimating) return;

    this.setData({ isAnimating: true });

    // 动画效果
    setTimeout(() => {
      this.setData({ flipClass: 'flip' });
    }, 500);

    // 抽取卡片
    setTimeout(() => {
      const userId = storage.getUserId();
      const card = rainbowCards.getTodayCard(userId);
      
      storage.saveTodayRainbowCard(card);

      this.setData({
        isAnimating: false,
        hasDrawn: true,
        showCard: true,
        cardName: card.name,
        cardIcon: getCardIcon(card.color),
        cardBgColor: getCardBgColor(card.color),
        cardMeaning: card.meaning,
        cardAffirmation: card.affirmation,
        actions: getActions(card)
      });

      // 振动反馈
      wx.vibrateShort();
    }, 2000);
  }
});
