/**
 * 云端存储工具 - 共享 API 层
 * 
 * 同时支持小程序和 Web 端调用，实现数据多端同步。
 * 
 * 小程序端: wx.cloud.callFunction('tasksApi', { action, data })
 * Web 端:   通过 HTTP API 调用同样的云函数（需开启 HTTP 触发器）
 * 
 * 使用方式:
 *   const cloudStore = require('./utils/cloudStore.js');
 *   const tasks = await cloudStore.getTasks();
 */

const API_NAME = 'tasksApi';

/**
 * 核心调用方法 - 小程序端
 */
function callApi(action, params = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: API_NAME,
      data: { action, ...params }
    }).then(res => {
      const result = res.result;
      if (result.code === 0) {
        resolve(result.data);
      } else {
        reject(new Error(result.msg || '请求失败'));
      }
    }).catch(err => {
      console.error(`❌ API [${action}] 失败:`, err);
      reject(err);
    });
  });
}

// ========== 任务 CRUD ==========

/** 获取用户所有任务 */
function getTasks() {
  return callApi('list');
}

/** 获取单个任务 */
function getTask(taskId) {
  return callApi('get', { id: taskId });
}

/** 创建任务 */
function createTask(taskData) {
  return callApi('create', { data: taskData });
}

/** 更新任务 */
function updateTask(taskId, updates) {
  return callApi('update', { id: taskId, data: updates });
}

/** 打卡 */
function checkInTask(taskId, date, done = true) {
  return callApi('checkin', { id: taskId, data: { date, done } });
}

/** 获取任务统计 */
function getTaskStats() {
  return callApi('stats');
}

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  checkInTask,
  getTaskStats
};
