/**
 * 统一存储工具 - 云开发优先 + 本地缓存兜底
 *
 * 设计原则：
 *   1. 所有读取从本地缓存（毫秒级），写入先本地再异步同步到云端
 *   2. 首次打开时从云端拉取数据到本地缓存
 *   3. 云端不可用时自动降级为纯本地模式
 *   4. 对外 API 保持同步（兼容现有页面代码）
 */

const rainbowCards = require('./rainbowCards.js');

// ========== 云函数调用 ==========
function callDbApi(action, collection, data, id, query) {
  return new Promise((resolve) => {
    if (!wx.cloud) {
      console.warn('⚠️ wx.cloud 不可用，跳过云端操作');
      return resolve(null);
    }
    wx.cloud.callFunction({
      name: 'dbApi',
      data: { action, collection, data, id, query },
      success: (res) => resolve(res.result),
      fail: (err) => {
        console.warn('云端调用失败:', err.errMsg || err);
        resolve(null);
      }
    });
  });
}

// ========== 存储键 ==========
const KEYS = {
  RAINBOW_CARD: 'rainbow_card_today',
  RAINBOW_CARD_DATE: 'rainbow_card_date',
  TASKS: 'tasks',
  LOGS: 'logs',
  USER_INFO: 'user_info',
  CLOUD_SYNCED: 'cloud_synced_flag'
};

// ========== 用户ID ==========
function getUserId() {
  let userId = wx.getStorageSync(KEYS.USER_INFO);
  if (!userId) {
    userId = 'user_' + Date.now();
    wx.setStorageSync(KEYS.USER_INFO, userId);
  }
  return userId;
}

// ========== 云端同步（初始化时调用）==========
function syncFromCloud() {
  if (!wx.cloud) return;
  callDbApi('syncAll').then(res => {
    if (!res || res.code !== 0) return;
    const { tasks, logs, rainbowCards: cards } = res.data;

    if (tasks && tasks.length > 0) {
      // 去掉 _id/_openid 等云字段，保持与本地格式一致
      const cleaned = tasks.map(cleanCloudFields);
      if (JSON.stringify(cleaned) !== wx.getStorageSync(KEYS.TASKS)) {
        wx.setStorageSync(KEYS.TASKS, JSON.stringify(cleaned));
      }
    }
    if (logs && logs.length > 0) {
      const cleaned = logs.map(cleanCloudFields);
      if (JSON.stringify(cleaned) !== wx.getStorageSync(KEYS.LOGS)) {
        wx.setStorageSync(KEYS.LOGS, JSON.stringify(cleaned));
      }
    }
    if (cards && cards.length > 0) {
      const latest = cards[0];
      wx.setStorageSync(KEYS.RAINBOW_CARD, cleanCloudFields(latest));
      wx.setStorageSync(KEYS.RAINBOW_CARD_DATE, latest.card_date || '');
    }

    wx.setStorageSync(KEYS.CLOUD_SYNCED, Date.now());
    console.log('✅ 云端数据已同步到本地缓存');
  });
}

function cleanCloudFields(doc) {
  const { _id, _openid, updatedAt, ...rest } = doc;
  return rest;
}

// ========== 彩虹卡 ==========
function getTodayRainbowCard() {
  const date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const savedDate = wx.getStorageSync(KEYS.RAINBOW_CARD_DATE);
  if (savedDate !== today) return null;
  return wx.getStorageSync(KEYS.RAINBOW_CARD);
}

function saveTodayRainbowCard(card) {
  const date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  wx.setStorageSync(KEYS.RAINBOW_CARD_DATE, today);
  wx.setStorageSync(KEYS.RAINBOW_CARD, card);

  // 异步同步到云端
  callDbApi('add', 'rainbowCards', {
    card_date: today,
    card_color: card.color,
    card_name: card.name,
    card_meaning: card.meaning,
    card_affirmation: card.affirmation
  }).then(res => {
    if (res && res.code === 0) console.log('🌈 彩虹卡已同步');
  });
}

// ========== 任务 CRUD ==========
function getAllTasks() {
  const tasks = wx.getStorageSync(KEYS.TASKS);
  return tasks ? JSON.parse(tasks) : [];
}

function saveTasks(tasks) {
  wx.setStorageSync(KEYS.TASKS, JSON.stringify(tasks));
}

function addTask(task) {
  const tasks = getAllTasks();
  task.id = task.id || Date.now().toString();
  task.createdAt = task.createdAt || new Date().toISOString();
  task.status = task.status || 'in_progress';
  task.checkInRecords = task.checkInRecords || [];
  tasks.unshift(task);
  saveTasks(tasks);

  // 异步同步到云端
  callDbApi('add', 'tasks', task).then(res => {
    if (res && res.code === 0) console.log('📋 任务已同步');
  });

  return task;
}

function updateTask(taskId, updates) {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return null;

  tasks[index] = { ...tasks[index], ...updates };
  saveTasks(tasks);

  // 异步同步到云端（用 id 而非 _id 查找）
  _findCloudIdAndUpdate('tasks', taskId, updates);

  return tasks[index];
}

function deleteTask(taskId) {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);

  _findCloudIdAndUpdate('tasks', taskId, { _deleted: true });
}

// ========== 日志 CRUD ==========
function getAllLogs() {
  const logs = wx.getStorageSync(KEYS.LOGS);
  return logs ? JSON.parse(logs) : [];
}

function saveLogs(logs) {
  wx.setStorageSync(KEYS.LOGS, JSON.stringify(logs));
}

function addLog(log) {
  const logs = getAllLogs();
  log.id = log.id || Date.now().toString();
  log.createdAt = log.createdAt || new Date().toISOString();
  logs.unshift(log);
  saveLogs(logs);

  callDbApi('add', 'logs', log).then(res => {
    if (res && res.code === 0) console.log('📝 日志已同步');
  });

  return log;
}

function updateLog(logId, updates) {
  const logs = getAllLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index === -1) return null;

  logs[index] = { ...logs[index], ...updates };
  saveLogs(logs);

  _findCloudIdAndUpdate('logs', logId, updates);
  return logs[index];
}

function deleteLog(logId) {
  const logs = getAllLogs();
  const filtered = logs.filter(l => l.id !== logId);
  saveLogs(filtered);
}

// ========== 云端 ID 查找 & 更新（辅助）==========
function _findCloudIdAndUpdate(collection, localId, updates) {
  // 先查本地缓存的 cloud _id 映射
  const mapKey = `${collection}_id_map`;
  let idMap = {};
  try {
    idMap = JSON.parse(wx.getStorageSync(mapKey) || '{}');
  } catch (e) {}

  if (idMap[localId]) {
    callDbApi('update', collection, updates, idMap[localId]);
    return;
  }

  // 没有映射则从云端查找
  callDbApi('list', collection, null, null, { id: localId }).then(res => {
    if (res && res.code === 0 && res.data.length > 0) {
      const cloudId = res.data[0]._id;
      idMap[localId] = cloudId;
      wx.setStorageSync(mapKey, JSON.stringify(idMap));
      callDbApi('update', collection, updates, cloudId);
    }
  });
}

// ========== 公开 API ==========
module.exports = {
  KEYS,
  getUserId,
  syncFromCloud,

  // 彩虹卡
  getTodayRainbowCard,
  saveTodayRainbowCard,

  // 任务
  getAllTasks,
  saveTasks,
  addTask,
  updateTask,
  deleteTask,

  // 日志
  getAllLogs,
  saveLogs,
  addLog,
  updateLog,
  deleteLog
};
