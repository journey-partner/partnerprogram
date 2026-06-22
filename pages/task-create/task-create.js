const storage = require('../../utils/storage.js');

// 安全的回退方法
function safeBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack();
  } else {
    wx.reLaunch({ url: '/pages/tasks/tasks' });
  }
}

// 建议的鼓励语
const suggestEncourages = [
  '今天也要加油哦～',
  '坚持就是胜利！',
  '小小的进步，大大的骄傲',
  '你比自己想象的更棒',
  '陪伴你成长的每一天'
];

Page({
  data: {
    taskName: '',
    taskDesc: '',
    planStartDate: '',
    planEndDate: '',
    checkinType: 'none',
    weeklyDays: [],
    weekdayFlags: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
    hasReminder: false,
    reminderTime: '09:00',
    encourageText: '',
    suggestEncourages,
    canSave: false
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel && eventChannel.onData) {
      eventChannel.onData((data) => {
        if (data.name) {
          this.setData({ taskName: data.name });
          this.checkCanSave();
        }
      });
    }
  },

  onNameInput(e) {
    this.setData({ taskName: e.detail.value });
    this.checkCanSave();
  },

  onDescInput(e) {
    this.setData({ taskDesc: e.detail.value });
  },

  onStartDateChange(e) {
    this.setData({ planStartDate: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ planEndDate: e.detail.value });
  },

  onCheckinType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      checkinType: type,
      weeklyDays: type === 'weekly' ? this.data.weeklyDays : [],
      weekdayFlags: this.computeWeekdayFlags(type === 'weekly' ? this.data.weeklyDays : [])
    });
  },

  onWeekdayToggle(e) {
    const day = parseInt(e.currentTarget.dataset.day);
    let weeklyDays = [...this.data.weeklyDays];
    const idx = weeklyDays.indexOf(day);
    if (idx === -1) {
      weeklyDays.push(day);
    } else {
      weeklyDays.splice(idx, 1);
    }
    this.setData({
      weeklyDays,
      weekdayFlags: this.computeWeekdayFlags(weeklyDays)
    });
  },

  computeWeekdayFlags(days) {
    const flags = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
    (days || []).forEach(d => { flags[d] = true; });
    return flags;
  },

  onReminderChange(e) {
    this.setData({ hasReminder: e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ reminderTime: e.detail.value });
  },

  onEncourageInput(e) {
    this.setData({ encourageText: e.detail.value });
  },

  useEncourage(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ encourageText: text });
  },

  checkCanSave() {
    this.setData({
      canSave: this.data.taskName.trim().length > 0
    });
  },

  goBack() {
    safeBack();
  },

  saveTask() {
    if (!this.data.canSave) return;

    const task = {
      name: this.data.taskName.trim(),
      description: this.data.taskDesc.trim(),
      planStartDate: this.data.planStartDate,
      planEndDate: this.data.planEndDate,
      checkinType: this.data.checkinType,
      weeklyDays: this.data.checkinType === 'weekly' ? this.data.weeklyDays : [],
      hasReminder: this.data.hasReminder,
      reminderTime: this.data.reminderTime,
      encourageText: this.data.encourageText.trim() || '今天也要加油哦～',
      status: 'in_progress',
      checkInRecords: []
    };

    storage.addTask(task);

    if (this.data.hasReminder) {
      this.setReminder(task);
    }

    wx.showToast({
      title: '任务创建成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      safeBack();
    }, 1500);
  },

  setReminder(task) {
    console.log(`已设置提醒: ${task.name} - ${task.reminderTime}`);
  }
});
