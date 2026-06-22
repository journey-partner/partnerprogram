/**
 * 共享任务 API 云函数
 * 同时为小程序端和 Web 端提供任务 CRUD 服务
 * 
 * 小程序调用: wx.cloud.callFunction({ name: 'tasksApi', data: { action: 'list' } })
 * Web 调用:   HTTP API (需配置 HTTP 触发器)
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command; 

exports.main = async (event) => {
  const { action, data } = event;
  const userId = cloud.getWXContext().OPENID || event.userId;

  try {
    switch (action) {
      case 'list':
        return await listTasks(db, userId);
      case 'get':
        return await getTask(db, event.id, userId);
      case 'create':
        return await createTask(db, data, userId);
      case 'update':
        return await updateTask(db, event.id, data, userId);
      case 'checkin':
        return await checkInTask(db, event.id, data, userId);
      case 'stats':
        return await getStats(db, userId);
      default:
        return { code: 400, msg: `未知操作: ${action}` };
    }
  } catch (err) {
    console.error('API Error:', err);
    return { code: 500, msg: err.message || '服务器错误' };
  }
};

// 任务列表
async function listTasks(db, userId) {
  const res = await db.collection('tasks')
    .where({ userId })
    .orderBy('createdAt', 'desc')
    .get();
  return { code: 0, data: res.data };
}

// 单个任务
async function getTask(db, id, userId) {
  const res = await db.collection('tasks')
    .where({ _id: id, userId })
    .get();
  if (res.data.length === 0) {
    return { code: 404, msg: '任务不存在' };
  }
  return { code: 0, data: res.data[0] };
}

// 创建任务
async function createTask(db, taskData, userId) {
  const task = {
    ...taskData,
    userId,
    status: taskData.status || 'in_progress',
    checkInRecords: [],
    createdAt: db.serverDate(),
    updatedAt: db.serverDate()
  };
  const res = await db.collection('tasks').add({ data: task });
  return { code: 0, data: { ...task, _id: res._id } };
}

// 更新任务
async function updateTask(db, id, taskData, userId) {
  delete taskData._id;
  delete taskData.userId;
  taskData.updatedAt = db.serverDate();

  const res = await db.collection('tasks')
    .where({ _id: id, userId })
    .update({ data: taskData });
  return { code: 0, data: { updated: res.stats.updated } };
}

// 打卡
async function checkInTask(db, id, { date, done = true }, userId) {
  const taskRes = await db.collection('tasks')
    .where({ _id: id, userId })
    .get();

  if (taskRes.data.length === 0) {
    return { code: 404, msg: '任务不存在' };
  }

  const task = taskRes.data[0];
  const records = task.checkInRecords || [];
  const idx = records.findIndex(r => r.date === date);

  if (idx === -1) {
    records.push({ date, done });
  } else {
    records[idx].done = done;
  }

  await db.collection('tasks')
    .where({ _id: id, userId })
    .update({
      data: {
        checkInRecords: records,
        lastCheckIn: date,
        updatedAt: db.serverDate()
      }
    });

  return { code: 0, data: { checkInRecords: records } };
}

// 统计
async function getStats(db, userId) {
  const tasks = await db.collection('tasks')
    .where({ userId })
    .field({ status: true, checkinType: true })
    .get();

  const stats = {
    total: tasks.data.length,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    notStarted: 0,
    dailyTasks: 0,
    weeklyTasks: 0
  };

  tasks.data.forEach(t => {
    switch (t.status) {
      case 'in_progress': stats.inProgress++; break;
      case 'completed': stats.completed++; break;
      case 'cancelled': stats.cancelled++; break;
      case 'not_started': stats.notStarted++; break;
    }
    if (t.checkinType === 'daily') stats.dailyTasks++;
    if (t.checkinType === 'weekly') stats.weeklyTasks++;
  });

  return { code: 0, data: stats };
}
