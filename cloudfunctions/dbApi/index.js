/**
 * 数据库 API 云函数
 * 
 * 提供任务、日志、彩虹卡 三大模块的云端 CRUD
 * 自动根据用户 openid 隔离数据
 * 
 * 小程序端调用方式：
 *   wx.cloud.callFunction({ name: 'dbApi', data: { action: 'list', collection: 'tasks' } })
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, collection, data, query, id } = event;

  try {
    switch (action) {
      // ========== 获取列表 ==========
      case 'list': {
        const q = { _openid: openid, ...(query || {}) };
        // 云开发每次最多返回 100 条，用 MAX_LIMIT 逐步拉取
        const MAX_LIMIT = 100;
        const countResult = await db.collection(collection).where(q).count();
        const total = countResult.total;
        if (total === 0) return { code: 0, data: [] };

        const batchTimes = Math.ceil(total / MAX_LIMIT);
        const tasks = [];
        for (let i = 0; i < batchTimes; i++) {
          const res = await db.collection(collection)
            .where(q)
            .orderBy('createdAt', 'desc')
            .skip(i * MAX_LIMIT)
            .limit(MAX_LIMIT)
            .get();
          tasks.push(...res.data);
        }
        return { code: 0, data: tasks };
      }

      // ========== 获取单条 ==========
      case 'get': {
        const res = await db.collection(collection).doc(id).get();
        if (!res.data || res.data._openid !== openid) {
          return { code: 404, msg: '记录不存在' };
        }
        return { code: 0, data: res.data };
      }

      // ========== 新增 ==========
      case 'add': {
        if (!data) return { code: 400, msg: '缺少 data 参数' };
        const doc = {
          ...data,
          _openid: openid,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const res = await db.collection(collection).add({ data: doc });
        return { code: 0, data: { _id: res._id, ...doc } };
      }

      // ========== 更新 ==========
      case 'update': {
        if (!id) return { code: 400, msg: '缺少 id 参数' };
        if (!data) return { code: 400, msg: '缺少 data 参数' };

        // 安全检查：只能更新自己的数据
        const check = await db.collection(collection).doc(id).get();
        if (!check.data || check.data._openid !== openid) {
          return { code: 403, msg: '无权操作' };
        }

        await db.collection(collection).doc(id).update({
          data: { ...data, updatedAt: new Date().toISOString() }
        });
        return { code: 0, msg: '更新成功' };
      }

      // ========== 删除 ==========
      case 'remove': {
        if (!id) return { code: 400, msg: '缺少 id 参数' };
        const check = await db.collection(collection).doc(id).get();
        if (!check.data || check.data._openid !== openid) {
          return { code: 403, msg: '无权操作' };
        }
        await db.collection(collection).doc(id).remove();
        return { code: 0, msg: '删除成功' };
      }

      // ========== 批量同步（首次加载用）==========
      case 'syncAll': {
        const collections = ['tasks', 'logs', 'rainbowCards'];
        const result = {};
        for (const col of collections) {
          const q = { _openid: openid };
          const res = await db.collection(col).where(q).orderBy('createdAt', 'desc').limit(100).get();
          result[col] = res.data;
        }
        return { code: 0, data: result };
      }

      default:
        return { code: 400, msg: `未知 action: ${action}` };
    }

  } catch (err) {
    console.error('dbApi 错误:', err);
    return { code: 500, msg: err.message || '服务器错误' };
  }
};
