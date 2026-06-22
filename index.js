/**
 * Journey Partner 后端服务
 * 
 * 微信云托管入口文件
 * 为小程序和 Web 端提供统一的 RESTful API
 * 
 * ========== 架构说明 ==========
 * 
 * 微信云托管是一个容器化部署平台，会自动：
 * 1. 根据 Dockerfile 构建镜像
 * 2. 部署到容器集群
 * 3. 分配 HTTPS 域名（xxx.ap-shanghai.run.tcloudbase.com）
 * 4. 自动扩缩容、灰度发布
 * 
 * 小程序端通过 wx.cloud.callContainer() 调用
 * Web 端通过 fetch() 直接调用 HTTPS 域名
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 80;

// ========== 中间件 ==========
app.use(cors());
app.use(express.json());

// ========== 内存存储（演示用，生产环境替换为 MySQL） ==========
let tasks = [];
let taskIdCounter = 0;

function generateId() {
  return 'task_' + (++taskIdCounter) + '_' + Date.now();
}

// ========== API 路由 ==========

// 健康检查（云托管自动调用）
app.get('/api/health', (req, res) => {
  res.json({ code: 0, msg: 'ok', timestamp: new Date().toISOString() });
});

// ========== 任务 API ==========

// 获取任务列表
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;
  let result = [...tasks];

  if (status && status !== 'all') {
    result = result.filter(t => t.status === status);
  }

  // 按创建时间倒序
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ code: 0, data: result });
});

// 获取任务统计
app.get('/api/tasks/stats', (req, res) => {
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
    notStarted: tasks.filter(t => t.status === 'not_started').length
  };
  res.json({ code: 0, data: stats });
});

// 获取单个任务
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.json({ code: 404, msg: '任务不存在' });
  }
  res.json({ code: 0, data: task });
});

// 创建任务
app.post('/api/tasks', (req, res) => {
  const { name, checkinType, status, tags } = req.body;

  if (!name || !name.trim()) {
    return res.json({ code: 400, msg: '任务名称不能为空' });
  }

  const task = {
    id: generateId(),
    name: name.trim(),
    checkinType: checkinType || 'daily',
    status: status || 'in_progress',
    tags: tags || [],
    checkInRecords: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.unshift(task);
  res.json({ code: 0, data: task });
});

// 更新任务
app.put('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.json({ code: 404, msg: '任务不存在' });
  }

  const allowedFields = ['name', 'checkinType', 'status', 'tags'];
  const updates = {};
  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  updates.updatedAt = new Date().toISOString();

  tasks[idx] = { ...tasks[idx], ...updates };
  res.json({ code: 0, data: tasks[idx] });
});

// 打卡
app.post('/api/tasks/:id/checkin', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.json({ code: 404, msg: '任务不存在' });
  }

  const { date, done = true } = req.body;
  const checkDate = date || new Date().toISOString().split('T')[0];

  const records = task.checkInRecords || [];
  const rIdx = records.findIndex(r => r.date === checkDate);

  if (rIdx === -1) {
    records.push({ date: checkDate, done });
  } else {
    records[rIdx].done = done;
  }

  task.checkInRecords = records;
  task.lastCheckIn = checkDate;
  task.updatedAt = new Date().toISOString();

  res.json({ code: 0, data: { checkInRecords: records } });
});

// ========== 启动服务 ==========
app.listen(PORT, () => {
  console.log(`✅ Journey Partner API 服务已启动，端口: ${PORT}`);
  console.log(`   📋 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`   📋 任务列表: http://localhost:${PORT}/api/tasks`);
});
