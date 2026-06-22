const storage = require('../../utils/storage.js');

const encouragements = [
  { emoji: '🌟', text: '太棒了！', tip: '完成就是进步', streak: 0 },
  { emoji: '💪', text: '坚持就是胜利！', tip: '你已经很有毅力了', streak: 0 },
  { emoji: '🎉', text: '庆祝一下！', tip: '每一小步都是成功', streak: 0 },
  { emoji: '✨', text: '闪闪发光！', tip: '你真的很棒', streak: 0 },
  { emoji: '🌈', text: '彩虹在等你！', tip: '继续保持', streak: 0 },
  { emoji: '💝', text: '为你骄傲！', tip: '自律让你自由', streak: 0 },
  { emoji: '🏆', text: '冠军风范！', tip: '超越昨天的自己', streak: 0 },
  { emoji: '🌺', text: '绽放吧！', tip: '你比想象中更强大', streak: 0 }
];

const streakEncourages = {
  3: { emoji: '🌱', text: '3天突破！', tip: '小习惯开始发芽', streak: 3 },
  7: { emoji: '🌿', text: '一周坚持！', tip: '你比80%的人更棒', streak: 7 },
  14: { emoji: '🌳', text: '两周成就！', tip: '习惯已初步养成', streak: 14 },
  21: { emoji: '🦋', text: '21天！', tip: '新习惯已形成', streak: 21 },
  30: { emoji: '🏆', text: '月度冠军！', tip: '你是真正的赢家', streak: 30 }
};

const STATUS_LABELS = {
  'not_started': '未开始',
  'in_progress': '进行中',
  'completed': '已完成',
  'cancelled': '已取消'
};

const FILTER_LABELS = {
  'not_started': '未开始',
  'in_progress': '进行中',
  'completed': '已完成',
  'cancelled': '已取消',
  'all': '全部任务'
};

// 迁移旧数据格式
function migrateTask(task) {
  if (!task.checkinType) {
    task.checkinType = task.isDaily ? 'daily' : 'none';
  }
  if (task.status === 'pending') task.status = 'in_progress';
  if (task.status === 'done') task.status = 'completed';
  return task;
}

Page({
  data: {
    activeStatus: 'in_progress',
    statusLabel: '进行中',
    showFilter: false,
    allTasks: [],
    filteredTasks: [],
    taskCounts: { all: 0, notStarted: 0, inProgress: 0, completed: 0, cancelled: 0 },
    showEncourage: false,
    encourageData: { emoji: '🌟', text: '', tip: '', streak: 0 }
  },

  onLoad() {
    this.loadTasks();
  },

  onShow() {
    this.loadTasks();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  loadTasks() {
    const tasks = storage.getAllTasks().map(migrateTask);
    const todayStr = new Date().toISOString().split('T')[0];

    const processedTasks = tasks.map(task => {
      const checkInToday = task.checkInRecords &&
                          task.checkInRecords.some(r => r.date === todayStr && r.done);

      let currentStreak = 0;
      if (task.checkInRecords && task.checkInRecords.length > 0) {
        // 逐日倒退检查日期连续性
        const checkDate = new Date(todayStr);
        for (let i = 0; i < 365; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const done = task.checkInRecords.some(r => r.date === dateStr && r.done);
          if (!done) break;
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      let weekProgress = [];
      let weekDone = 0;
      let weekTotal = 7;

      if (task.checkinType === 'daily') {
        weekTotal = 7;
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          const done = task.checkInRecords && task.checkInRecords.some(r => r.date === ds && r.done);
          weekProgress.push(done);
          if (done) weekDone++;
        }
      } else if (task.checkinType === 'weekly') {
        weekTotal = task.weeklyDays ? task.weeklyDays.length : 0;
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayOfWeek = d.getDay();
          if (task.weeklyDays && task.weeklyDays.includes(dayOfWeek)) {
            const ds = d.toISOString().split('T')[0];
            const done = task.checkInRecords && task.checkInRecords.some(r => r.date === ds && r.done);
            weekProgress.push(done);
            if (done) weekDone++;
          } else {
            weekProgress.push(null); // 不是打卡日
          }
        }
      }

      return {
        ...task,
        checkInToday,
        currentStreak,
        weekProgress,
        weekDone,
        weekTotal,
        statusLabel: STATUS_LABELS[task.status] || task.status
      };
    });

    this.setData({ allTasks: processedTasks });
    this.doFilter();
  },

  doFilter() {
    const { activeStatus, allTasks } = this.data;
    let filteredTasks = allTasks;

    if (activeStatus === 'not_started') {
      filteredTasks = allTasks.filter(t => t.status === 'not_started');
    } else if (activeStatus === 'in_progress') {
      filteredTasks = allTasks.filter(t => t.status === 'in_progress');
    } else if (activeStatus === 'completed') {
      filteredTasks = allTasks.filter(t => t.status === 'completed');
    } else if (activeStatus === 'cancelled') {
      filteredTasks = allTasks.filter(t => t.status === 'cancelled');
    }

    this.setData({
      filteredTasks,
      taskCounts: {
        all: allTasks.length,
        notStarted: allTasks.filter(t => t.status === 'not_started').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length
      }
    });
  },

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter });
  },

  closeFilter() {
    this.setData({ showFilter: false });
  },

  onStatusFilter(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      activeStatus: status,
      statusLabel: FILTER_LABELS[status] || status,
      showFilter: false
    });
    this.doFilter();
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/task-create/task-create' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/task-detail/task-detail?id=${id}` });
  },

  doCheckin(e) {
    const id = e.currentTarget.dataset.id;
    const task = this.data.allTasks.find(t => t.id === id);
    if (!task) return;
    if (task.checkinType === 'none') return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (task.checkInToday) {
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }

    // 检查是否在打卡日
    if (task.checkinType === 'weekly') {
      const todayDay = new Date().getDay();
      if (!task.weeklyDays || !task.weeklyDays.includes(todayDay)) {
        wx.showToast({ title: '今天不是打卡日', icon: 'none' });
        return;
      }
    }

    const checkInRecords = task.checkInRecords || [];
    const todayIndex = checkInRecords.findIndex(r => r.date === todayStr);
    if (todayIndex === -1) {
      checkInRecords.push({ date: todayStr, done: true });
    } else {
      checkInRecords[todayIndex].done = true;
    }

    // 打卡不改变任务状态（requirement 5）
    storage.updateTask(id, { checkInRecords, lastCheckIn: todayStr });
    this.showEncourageModal(task, checkInRecords);
    this.loadTasks();
    wx.vibrateShort();
  },

  editTask(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/task-create/task-create?id=${id}` });
  },

  showEncourageModal(task, records) {
    let streak = 0;
    const sortedRecords = [...records].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    for (let i = 0; i < sortedRecords.length; i++) {
      if (sortedRecords[i].done) { streak++; } else { break; }
    }

    const milestone = streakEncourages[streak];
    if (milestone) {
      this.setData({ showEncourage: true, encourageData: milestone });
    } else {
      const random = encouragements[Math.floor(Math.random() * encouragements.length)];
      this.setData({ showEncourage: true, encourageData: { ...random, streak } });
    }
  },

  closeEncourage() {
    this.setData({ showEncourage: false });
  }
});
