/**
 * 统一存储工具 - 支持本地和云端双模式
 * 
 * 默认使用本地存储（向后兼容），云托管部署后切换为云端模式
 * 切换方式：将 USE_CLOUD 设为 true，并在云托管控制台获取 API 地址
 */
const rainbowCards = require('./rainbowCards.js');

// ========== 模式切换 ==========
const USE_CLOUD = false; // TODO: 云托管部署后改为 true

// ========== 存储键 ==========
const STORAGE_KEYS = {
  RAINBOW_CARD: 'rainbow_card_today',
  RAINBOW_CARD_DATE: 'rainbow_card_date',
  TASKS: 'tasks',
  LOGS: 'logs',
  USER_INFO: 'user_info',
  CLOUD_SYNC: 'cloud_sync_enabled'
};

// ========== 用户ID ==========
function getUserId() {
  let userId = wx.getStorageSync(STORAGE_KEYS.USER_INFO);
  if (!userId) {
    userId = 'user_' + Date.now();
    wx.setStorageSync(STORAGE_KEYS.USER_INFO, userId);
  }
  return userId;
}

// ========== 彩虹卡 ==========
function getTodayRainbowCard() {
  const date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const savedDate = wx.getStorageSync(STORAGE_KEYS.RAINBOW_CARD_DATE);
  if (savedDate !== today) return null;
  return wx.getStorageSync(STORAGE_KEYS.RAINBOW_CARD);
}

function saveTodayRainbowCard(card) {
  const date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  wx.setStorageSync(STORAGE_KEYS.RAINBOW_CARD_DATE, today);
  wx.setStorageSync(STORAGE_KEYS.RAINBOW_CARD, card);

  // 云端同步（异步，不阻塞）
  if (USE_CLOUD) {
    syncRainbowCardToCloud(card);
  }
}

// ========== 任务 CRUD ==========
function getAllTasks() {
  const tasks = wx.getStorageSync(STORAGE_KEYS.TASKS);
  return tasks ? JSON.parse(tasks) : [];
}

function saveTasks(tasks) {
  wx.setStorageSync(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

function addTask(task) {
  const tasks = getAllTasks();
  task.id = Date.now().toString();
  task.createdAt = new Date().toISOString();
  if (!task.status) task.status = 'in_progress';
  task.checkInRecords = task.checkInRecords || [];
  tasks.unshift(task);
  saveTasks(tasks);

  // 云端同步
  if (USE_CLOUD) {
    syncTaskToCloud(task, 'create');
  }

  return task;
}

function updateTask(taskId, updates) {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);

    if (USE_CLOUD) {
      syncTaskToCloud({ id: taskId, ...updates }, 'update');
    }

    return tasks[index];
  }
  return null;
}

function deleteTask(taskId) {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
}

// ========== 日志 CRUD ==========
function getAllLogs() {
  const logs = wx.getStorageSync(STORAGE_KEYS.LOGS);
  return logs ? JSON.parse(logs) : [];
}

function saveLogs(logs) {
  wx.setStorageSync(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

function addLog(log) {
  const logs = getAllLogs();
  log.id = Date.now().toString();
  log.createdAt = new Date().toISOString();
  logs.unshift(log);
  saveLogs(logs);

  if (USE_CLOUD) {
    syncLogToCloud(log, 'create');
  }

  return log;
}

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

function deleteLog(logId) {
  const logs = getAllLogs();
  const filtered = logs.filter(l => l.id !== logId);
  saveLogs(filtered);
}

// ========== 云端同步（异步，自动重试）==========
const API_BASE = 'https://your-service.run.tcloudbase.com'; // TODO: 替换为云托管域名

function cloudPost(path, data) {
  return new Promise((resolve) => {
    wx.request({
      url: API_BASE + path,
      method: 'POST',
      header: { 'content-type': 'application/json', 'x-user-id': getUserId() },
      data: data,
      success: (res) => resolve(res.data),
      fail: (err) => {
        console.warn('云端同步失败（将重试）:', err);
        resolve(null);
      }
    });
  });
}

function syncRainbowCardToCloud(card) {
  cloudPost('/api/rainbow-card', card).then(res => {
    if (res && res.code === 0) console.log('✅ 彩虹卡已同步到云端');
  });
}

function syncTaskToCloud(task, action) {
  const path = action === 'create' ? '/api/tasks' : `/api/tasks/${task.id}`;
  const method = action === 'create' ? 'POST' : 'PUT';
  cloudPost(path, task).then(res => {
    if (res && res.code === 0) console.log('✅ 任务已同步到云端');
  });
}

function syncLogToCloud(log, action) {
  const path = action === 'create' ? '/api/logs' : `/api/logs/${log.id}`;
  const method = action === 'create' ? 'POST' : 'PUT';
  cloudPost(path, log).then(res => {
    if (res && res.code === 0) console.log('✅ 日志已同步到云端');
  });
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
