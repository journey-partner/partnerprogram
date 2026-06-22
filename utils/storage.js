// 本地存储工具
const STORAGE_KEYS = {
  RAINBOW_CARD: 'rainbow_card_today', // 今日彩虹卡
  RAINBOW_CARD_DATE: 'rainbow_card_date', // 抽取日期
  TASKS: 'tasks', // 任务列表
  LOGS: 'logs', // 日志列表
  USER_INFO: 'user_info' // 用户信息
};

// 获取今日彩虹卡抽取记录
function getTodayRainbowCard() {
  const date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const savedDate = wx.getStorageSync(STORAGE_KEYS.RAINBOW_CARD_DATE);
  
  if (savedDate !== today) {
    return null; // 新的一天，可以重新抽取
  }
  
  return wx.getStorageSync(STORAGE_KEYS.RAINBOW_CARD);
}

// 保存今日彩虹卡
function saveTodayRainbowCard(card) {
  const date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  
  wx.setStorageSync(STORAGE_KEYS.RAINBOW_CARD_DATE, today);
  wx.setStorageSync(STORAGE_KEYS.RAINBOW_CARD, card);
}

// 获取所有任务
function getAllTasks() {
  const tasks = wx.getStorageSync(STORAGE_KEYS.TASKS);
  return tasks ? JSON.parse(tasks) : [];
}

// 保存任务列表
function saveTasks(tasks) {
  wx.setStorageSync(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

// 添加任务
function addTask(task) {
  const tasks = getAllTasks();
  task.id = Date.now().toString();
  task.createdAt = new Date().toISOString();
  if (!task.status) task.status = 'in_progress';
  task.checkInRecords = task.checkInRecords || [];
  tasks.unshift(task);
  saveTasks(tasks);
  return task;
}

// 更新任务
function updateTask(taskId, updates) {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
    return tasks[index];
  }
  return null;
}

// 删除任务
function deleteTask(taskId) {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
}

// 获取所有日志
function getAllLogs() {
  const logs = wx.getStorageSync(STORAGE_KEYS.LOGS);
  return logs ? JSON.parse(logs) : [];
}

// 保存日志列表
function saveLogs(logs) {
  wx.setStorageSync(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

// 添加日志
function addLog(log) {
  const logs = getAllLogs();
  log.id = Date.now().toString();
  log.createdAt = new Date().toISOString();
  logs.unshift(log);
  saveLogs(logs);
  return log;
}

// 更新日志
function updateLog(logId, updates) {
  const logs = getAllLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index] = { ...logs[index], ...updates };
    saveLogs(logs);
    return logs[index];
  }
  return null;
}

// 删除日志
function deleteLog(logId) {
  const logs = getAllLogs();
  const filtered = logs.filter(l => l.id !== logId);
  saveLogs(filtered);
}

// 获取用户ID（简化版，实际应从登录获取）
function getUserId() {
  let userId = wx.getStorageSync(STORAGE_KEYS.USER_INFO);
  if (!userId) {
    userId = 'user_' + Date.now();
    wx.setStorageSync(STORAGE_KEYS.USER_INFO, userId);
  }
  return userId;
}

module.exports = {
  STORAGE_KEYS,
  getTodayRainbowCard,
  saveTodayRainbowCard,
  getAllTasks,
  saveTasks,
  addTask,
  updateTask,
  deleteTask,
  getAllLogs,
  saveLogs,
  addLog,
  updateLog,
  deleteLog,
  getUserId
};
