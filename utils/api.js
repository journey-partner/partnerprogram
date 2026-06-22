/**
 * API 客户端 - 小程序端
 * 
 * 调用微信云托管后端服务，实现数据云端存储
 * 
 * 部署后需要将 API_BASE 替换为云托管分配的域名
 * 可用方式：
 * 1. 云托管控制台 → 服务详情 → 公网域名
 * 2. 使用 wx.cloud.callContainer() 自动路由（推荐）
 */

// ========== 配置 ==========
// 云托管默认使用微信内网域名，小程序端无需手动配置
// 部署后在云托管控制台开通"微信内网访问"即可

const USE_CONTAINER = true; // true: 用 wx.cloud.callContainer 内部调用（推荐）
const API_BASE = 'https://your-service.run.tcloudbase.com'; // 仅 USE_CONTAINER=false 时需要

const app = getApp();

function getUserId() {
  return app.globalData.userId || '';
}

// ========== 核心请求方法 ==========
function request(path, options = {}) {
  const { method = 'GET', data, isSilent = false } = options;

  if (USE_CONTAINER) {
    // 方式一：wx.cloud.callContainer（推荐，免域名配置）
    return new Promise((resolve, reject) => {
      wx.cloud.callContainer({
        config: { env: 'prod-云托管环境ID' }, // TODO: 替换为实际环境ID
        header: { 'X-WX-SERVICE': 'journey-partner', 'x-user-id': getUserId() },
        path: path,
        method: method,
        data: data,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            resolve(res.data.data);
          } else {
            if (!isSilent) console.error('API 错误:', res.data);
            reject(new Error((res.data && res.data.msg) || '请求失败'));
          }
        },
        fail: (err) => {
          if (!isSilent) console.error('API 请求失败:', err);
          reject(err);
        }
      });
    });
  } else {
    // 方式二：直接 HTTP 请求（开发调试用）
    return new Promise((resolve, reject) => {
      wx.request({
        url: API_BASE + path,
        method: method,
        header: { 'content-type': 'application/json', 'x-user-id': getUserId() },
        data: data,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            resolve(res.data.data);
          } else {
            reject(new Error((res.data && res.data.msg) || '请求失败'));
          }
        },
        fail: (err) => reject(err)
      });
    });
  }
}

// ========== 彩虹卡 API ==========
function getTodayRainbowCard() {
  return request('/api/rainbow-card');
}

// ========== 任务 API ==========
function getTasks(status) {
  let path = '/api/tasks';
  if (status && status !== 'all') path += `?status=${status}`;
  return request(path);
}

function getTask(taskId) {
  return request(`/api/tasks/${taskId}`);
}

function createTask(taskData) {
  return request('/api/tasks', { method: 'POST', data: taskData });
}

function updateTask(taskId, updates) {
  return request(`/api/tasks/${taskId}`, { method: 'PUT', data: updates });
}

function checkInTask(taskId, date, done = true) {
  return request(`/api/tasks/${taskId}/checkin`, {
    method: 'POST',
    data: { date, done }
  });
}

function getTaskStats() {
  return request('/api/tasks/stats');
}

// ========== 日志 API ==========
function getLogs(tag) {
  let path = '/api/logs';
  if (tag && tag !== 'all') path += `?tag=${tag}`;
  return request(path);
}

function getLog(logId) {
  return request(`/api/logs/${logId}`);
}

function createLog(logData) {
  return request('/api/logs', { method: 'POST', data: logData });
}

function updateLog(logId, updates) {
  return request(`/api/logs/${logId}`, { method: 'PUT', data: updates });
}

module.exports = {
  getTodayRainbowCard,
  getTasks,
  getTask,
  createTask,
  updateTask,
  checkInTask,
  getTaskStats,
  getLogs,
  getLog,
  createLog,
  updateLog
};
