const storage = require('../../utils/storage.js');

// 安全的回退方法：navigateBack 失败时 fallback 到任务列表
function safeBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack();
  } else {
    wx.reLaunch({ url: '/pages/tasks/tasks' });
  }
}

const STATUS_LABELS = {
  'not_started': '未开始',
  'in_progress': '进行中',
  'completed': '已完成',
  'cancelled': '已取消'
};

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

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
    taskId: '',
    task: {},
    statusLabel: '',
    weekDays: [],
    weekDoneCount: 0,
    weekTotal: 7,
    weekDayNames: '',
    calendarDays: [],
    currentMonth: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六']
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ taskId: id });
    this.loadTask();
  },

  onShow() {
    this.loadTask();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  loadTask() {
    const tasks = storage.getAllTasks();
    let task = tasks.find(t => t.id === this.data.taskId);
    
    if (!task) {
      wx.showToast({ title: '任务不存在', icon: 'error' });
      setTimeout(() => safeBack(), 1500);
      return;
    }

    task = migrateTask({ ...task });

    const todayStr = new Date().toISOString().split('T')[0];
    const checkInToday = task.checkInRecords && 
                        task.checkInRecords.some(r => r.date === todayStr && r.done);
    
    let currentStreak = 0;
    let bestStreak = 0;
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

      const sortedRecords = [...task.checkInRecords].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
      let tempStreak = 0;
      for (const record of sortedRecords) {
        if (record.done) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
    }

    const weekDays = this.generateWeekDays(task);
    const weekDoneCount = weekDays.filter(d => d.done).length;
    const { calendarDays, currentMonth } = this.generateCalendar(task.checkInRecords || []);
    const weekDayNames = task.weeklyDays
      ? task.weeklyDays.map(d => DAY_NAMES[d]).join('、')
      : '';

    this.setData({
      task: {
        ...task,
        checkInToday,
        currentStreak,
        bestStreak,
        totalDays: task.checkInRecords ? task.checkInRecords.filter(r => r.done).length : 0
      },
      statusLabel: STATUS_LABELS[task.status] || task.status,
      weekDays,
      weekDoneCount,
      weekTotal: task.checkinType === 'weekly' ? (task.weeklyDays ? task.weeklyDays.length : 0) : 7,
      weekDayNames,
      calendarDays,
      currentMonth
    });
  },

  generateWeekDays(task) {
    const days = [];
    const today = new Date();
    const checkInRecords = task.checkInRecords || [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isToday = i === 0;

      // For weekly check-in, only show target days
      if (task.checkinType === 'weekly' && task.weeklyDays && !task.weeklyDays.includes(dayOfWeek)) {
        days.push({
          label: DAY_NAMES[dayOfWeek],
          date: dateStr,
          done: false,
          isToday,
          isEmpty: true
        });
      } else {
        const done = checkInRecords.some(r => r.date === dateStr && r.done);
        days.push({
          label: DAY_NAMES[dayOfWeek],
          date: dateStr,
          done,
          isToday,
          isEmpty: false
        });
      }
    }
    
    return days;
  },

  generateCalendar(checkInRecords) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeek = firstDay.getDay();
    
    const currentMonth = `${year}年${month + 1}月`;
    const calendarDays = [];
    
    for (let i = 0; i < startWeek; i++) {
      calendarDays.push({ day: '', empty: true });
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const done = checkInRecords.some(r => r.date === dateStr && r.done);
      const isToday = dateStr === today.toISOString().split('T')[0];
      calendarDays.push({ day, date: dateStr, done, isToday });
    }
    
    return { calendarDays, currentMonth };
  },

  goBack() {
    safeBack();
  },

  changeStatus(e) {
    const newStatus = e.currentTarget.dataset.status;
    const oldStatus = this.data.task.status;
    
    if (newStatus === oldStatus) return;

    wx.showModal({
      title: '更新状态',
      content: `确定将任务状态改为「${STATUS_LABELS[newStatus]}」吗？`,
      confirmColor: '#059669',
      success: (res) => {
        if (res.confirm) {
          storage.updateTask(this.data.taskId, { status: newStatus });
          this.loadTask();
          wx.vibrateShort();
          wx.showToast({ title: '状态已更新', icon: 'success' });
        }
      }
    });
  },

  doCheckin() {
    if (this.data.task.checkInToday) {
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }

    if (this.data.task.checkinType === 'weekly') {
      const todayDay = new Date().getDay();
      if (!this.data.task.weeklyDays || !this.data.task.weeklyDays.includes(todayDay)) {
        wx.showToast({ title: '今天不是打卡日', icon: 'none' });
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const checkInRecords = this.data.task.checkInRecords || [];
    const todayIndex = checkInRecords.findIndex(r => r.date === todayStr);
    
    if (todayIndex === -1) {
      checkInRecords.push({ date: todayStr, done: true });
    } else {
      checkInRecords[todayIndex].done = true;
    }
    
    // 打卡不改变任务状态（requirement 5）
    storage.updateTask(this.data.taskId, { 
      checkInRecords,
      lastCheckIn: todayStr
    });
    
    this.loadTask();
    wx.vibrateShort();
    
    wx.showToast({ 
      title: '打卡成功 🎉', 
      icon: 'none',
      duration: 2000
    });
  },
});
