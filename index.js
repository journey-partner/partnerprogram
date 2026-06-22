/**
 * Journey Partner 后端服务 - 完整版
 *
 * 为小程序和 Web 端提供：彩虹卡、任务管理、日志记录 三大模块 API
 * 数据库：MySQL（微信云托管自动提供，需在控制台开通）
 * 
 * ========== 架构 ==========
 * 小程序 ──▶ wx.cloud.callContainer() ──▶ Cloud Hosting ──▶ MySQL
 * Web   ──▶ fetch(HTTPS)               ──▶ Cloud Hosting ──▶ MySQL
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 80;

// ========== 中间件 ==========
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========== 数据库连接池 ==========
// 云托管会自动注入 MYSQL_HOST/MYSQL_PORT/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'journey_partner',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

// ========== 数据库初始化 ==========
async function initDB() {
  const conn = await pool.getConnection();
  try {
    // 任务表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT '',
        name VARCHAR(200) NOT NULL,
        description TEXT,
        checkin_type VARCHAR(20) DEFAULT 'none',
        weekly_days JSON,
        status VARCHAR(20) DEFAULT 'in_progress',
        has_reminder TINYINT DEFAULT 0,
        reminder_time VARCHAR(10) DEFAULT '09:00',
        encourage_text VARCHAR(200) DEFAULT '',
        plan_start_date VARCHAR(20) DEFAULT '',
        plan_end_date VARCHAR(20) DEFAULT '',
        checkin_records JSON,
        last_checkin VARCHAR(20) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 日志表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT '',
        tag VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        images JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_tag (tag)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 彩虹卡抽卡记录
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS rainbow_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT '',
        card_date DATE NOT NULL,
        card_color VARCHAR(20) NOT NULL,
        card_name VARCHAR(50) NOT NULL,
        card_meaning TEXT NOT NULL,
        card_affirmation TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_date (user_id, card_date),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ 数据库表初始化完成');
  } finally {
    conn.release();
  }
}

// ========== 辅助函数 ==========
function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function getUserId(req) {
  return (req.headers['x-user-id'] || '').toString().slice(0, 64);
}

// ========== API 路由 ==========

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, msg: 'ok', time: new Date().toISOString() });
});

// ========== 彩虹卡 API ==========

// 彩虹卡数据（与小程序端 utils/rainbowCards.js 完全一致）
const rainbowCardsData = [
  { color: "red", name: "活力红", meaning: "你拥有强大的生命力和行动力，今天是采取行动的好日子。", affirmation: "我充满活力，我的身体充满能量。" },
  { color: "red", name: "热情红", meaning: "热情是你最好的武器，用它去感染身边的每一个人。", affirmation: "我以热情和积极的态度面对生活。" },
  { color: "red", name: "勇气红", meaning: "勇气不是没有恐惧，而是带着恐惧依然前行。", affirmation: "我有勇气面对一切挑战。" },
  { color: "orange", name: "创造橙", meaning: "你的创造力正在流动，让新的想法自然涌现。", affirmation: "我是一个充满创造力的人。" },
  { color: "orange", name: "喜悦橙", meaning: "快乐是一种选择，今天选择让自己开心吧。", affirmation: "我选择让喜悦充满我的生活。" },
  { color: "orange", name: "情感橙", meaning: "感受是真实的，拥抱你内心的情感流动。", affirmation: "我允许自己感受一切美好的情感。" },
  { color: "yellow", name: "自信黄", meaning: "你本自具足，相信自己的能力和价值。", affirmation: "我相信自己，我值得被爱。" },
  { color: "yellow", name: "阳光黄", meaning: "像太阳一样照亮自己，也照亮他人。", affirmation: "我散发着温暖和光芒。" },
  { color: "yellow", name: "力量黄", meaning: "内在的力量比你想象的更强大。", affirmation: "我拥有无限的力量和潜能。" },
  { color: "green", name: "治愈绿", meaning: "给自己一个拥抱，伤口正在愈合。", affirmation: "我值得被治愈，我正在愈合。" },
  { color: "green", name: "爱之绿", meaning: "爱从心开始，你值得被爱，也值得爱人。", affirmation: "我充满爱，我传递爱。" },
  { color: "green", name: "平衡绿", meaning: "在给予与接受之间找到平衡。", affirmation: "我在生活中找到了平衡与和谐。" },
  { color: "blue", name: "沟通蓝", meaning: "你的声音很重要，勇敢表达真实的自己。", affirmation: "我能够清晰真实地表达自己。" },
  { color: "blue", name: "宁静蓝", meaning: "静默也是一种力量，给自己片刻宁静。", affirmation: "我在宁静中找到力量。" },
  { color: "blue", name: "智慧蓝", meaning: "倾听内心的声音，智慧就在其中。", affirmation: "我相信自己的直觉和智慧。" },
  { color: "indigo", name: "直觉靛", meaning: "相信你的直觉，它是你最真实的指南针。", affirmation: "我相信自己的直觉和洞察力。" },
  { color: "indigo", name: "洞察靛", meaning: "看清事物的本质，你拥有穿透迷雾的智慧。", affirmation: "我拥有清晰的洞察力。" },
  { color: "indigo", name: "梦想靛", meaning: "梦想是未来的种子，今天开始浇灌它。", affirmation: "我敢想敢做，我的梦想正在实现。" },
  { color: "purple", name: "灵性紫", meaning: "你与宇宙相连，一切都在对的时间发生。", affirmation: "我与宇宙的能量相连。" },
  { color: "purple", name: "和平紫", meaning: "内心和平是一切的根源。", affirmation: "我的内心充满了平静与和平。" },
  { color: "purple", name: "觉醒紫", meaning: "觉醒的路上，你已经很棒了。", affirmation: "我在成长的道路上不断前进。" },
  { color: "pink", name: "自爱粉", meaning: "先学会爱自己，才能更好地爱他人。", affirmation: "我无条件地爱和接纳自己。" },
  { color: "pink", name: "接纳粉", meaning: "接纳自己的不完美，那是独特的美。", affirmation: "我接纳自己的全部，包括优点和不足。" },
  { color: "pink", name: "温柔粉", meaning: "对自己温柔一点，你已经很努力了。", affirmation: "我对自己温柔，我值得被温柔对待。" },
  { color: "gold", name: "智慧金", meaning: "内在的智慧正在觉醒，指引你前行。", affirmation: "我拥有无限的智慧和知识。" },
  { color: "gold", name: "丰盛金", meaning: "宇宙的丰盛正在流向你，你值得拥有美好的一切。", affirmation: "我敞开接受宇宙的丰盛。" },
  { color: "gold", name: "神圣金", meaning: "你是独一无二的存在，有自己的使命。", affirmation: "我认识到自己的神圣价值。" },
  { color: "white", name: "纯净白", meaning: "让心灵得到净化，轻装前行。", affirmation: "我让负面能量流走，接受纯净。" },
  { color: "white", name: "合一白", meaning: "万物一体，你与自然、与他人相连。", affirmation: "我与一切生命和谐相连。" },
  { color: "white", name: "新生白", meaning: "每一天都是新的开始，拥抱当下的美好。", affirmation: "我拥抱每一个新的开始。" }
];

// 根据日期和用户ID获取当日卡片（与小程序算法一致）
function getTodayCard(userId) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const code = userId ? userId.charCodeAt(0) || 0 : 0;
  const index = (seed + code) % rainbowCardsData.length;
  return rainbowCardsData[index];
}

// 获取今日彩虹卡
app.get('/api/rainbow-card', async (req, res) => {
  const userId = getUserId(req);
  const today = new Date().toISOString().split('T')[0];

  try {
    // 查询今日是否已抽卡
    const [rows] = await pool.execute(
      'SELECT * FROM rainbow_cards WHERE user_id = ? AND card_date = ?',
      [userId, today]
    );

    if (rows.length > 0) {
      return res.json({ code: 0, data: { card: rows[0], isNew: false } });
    }

    // 新抽卡
    const card = getTodayCard(userId);
    await pool.execute(
      'INSERT INTO rainbow_cards (user_id, card_date, card_color, card_name, card_meaning, card_affirmation) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, today, card.color, card.name, card.meaning, card.affirmation]
    );

    res.json({ code: 0, data: { card, isNew: true } });

  } catch (err) {
    console.error('彩虹卡错误:', err);
    // 降级：直接返回卡片数据（不依赖DB）
    const card = getTodayCard(userId);
    res.json({ code: 0, data: { card, isNew: true, fallback: true } });
  }
});

// ========== 任务 API ==========

// 获取任务列表
app.get('/api/tasks', async (req, res) => {
  const userId = getUserId(req);
  const { status } = req.query;

  try {
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql, params);

    // JSON 字段解析
    const tasks = rows.map(row => ({
      ...row,
      checkin_records: parseJSON(row.checkin_records, []),
      weekly_days: parseJSON(row.weekly_days, []),
      has_reminder: !!row.has_reminder
    }));

    res.json({ code: 0, data: tasks });
  } catch (err) {
    console.error('获取任务失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 任务统计
app.get('/api/tasks/stats', async (req, res) => {
  const userId = getUserId(req);
  try {
    const [rows] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status',
      [userId]
    );
    const stats = { total: 0, in_progress: 0, completed: 0, cancelled: 0, not_started: 0 };
    rows.forEach(r => {
      stats.total += r.count;
      if (r.status === 'in_progress') stats.in_progress = r.count;
      else if (r.status === 'completed') stats.completed = r.count;
      else if (r.status === 'cancelled') stats.cancelled = r.count;
      else if (r.status === 'not_started') stats.not_started = r.count;
    });
    res.json({ code: 0, data: stats });
  } catch (err) {
    console.error('统计失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 获取单个任务
app.get('/api/tasks/:id', async (req, res) => {
  const userId = getUserId(req);
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '任务不存在' });
    const task = {
      ...rows[0],
      checkin_records: parseJSON(rows[0].checkin_records, []),
      weekly_days: parseJSON(rows[0].weekly_days, []),
      has_reminder: !!rows[0].has_reminder
    };
    res.json({ code: 0, data: task });
  } catch (err) {
    console.error('获取任务失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 创建任务
app.post('/api/tasks', async (req, res) => {
  const userId = getUserId(req);
  const { name, description, checkinType, weeklyDays, status,
          planStartDate, planEndDate, hasReminder, reminderTime, encourageText } = req.body;

  if (!name || !name.trim()) {
    return res.json({ code: 400, msg: '任务名称不能为空' });
  }

  const id = generateId('task');
  try {
    await pool.execute(
      `INSERT INTO tasks (id, user_id, name, description, checkin_type, weekly_days, status,
        plan_start_date, plan_end_date, has_reminder, reminder_time, encourage_text, checkin_records)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, name.trim(), description || '',
        checkinType || 'daily', JSON.stringify(weeklyDays || []),
        status || 'in_progress', planStartDate || '', planEndDate || '',
        hasReminder ? 1 : 0, reminderTime || '09:00',
        encourageText || '', JSON.stringify([])
      ]
    );

    res.json({
      code: 0,
      data: { id, name: name.trim(), status: status || 'in_progress', checkin_records: [] }
    });
  } catch (err) {
    console.error('创建任务失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 更新任务
app.put('/api/tasks/:id', async (req, res) => {
  const userId = getUserId(req);
  const id = req.params.id;

  const allowedFields = ['name', 'description', 'checkin_type', 'weekly_days',
    'status', 'plan_start_date', 'plan_end_date', 'has_reminder',
    'reminder_time', 'encourage_text'];

  const updates = {};
  const values = [];

  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates[f] = req.body[f];
      if (f === 'weekly_days') {
        values.push(JSON.stringify(req.body[f]));
      } else if (f === 'has_reminder') {
        values.push(req.body[f] ? 1 : 0);
      } else {
        values.push(req.body[f]);
      }
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.json({ code: 400, msg: '没有可更新的字段' });
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  values.push(id, userId);

  try {
    const [result] = await pool.execute(
      `UPDATE tasks SET ${setClauses} WHERE id = ? AND user_id = ?`,
      values
    );
    res.json({ code: 0, data: { updated: result.affectedRows } });
  } catch (err) {
    console.error('更新任务失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 打卡
app.post('/api/tasks/:id/checkin', async (req, res) => {
  const userId = getUserId(req);
  const id = req.params.id;
  const { date, done = true } = req.body;
  const checkDate = date || new Date().toISOString().split('T')[0];

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '任务不存在' });

    const task = rows[0];
    const records = parseJSON(task.checkin_records, []);
    const rIdx = records.findIndex(r => r.date === checkDate);

    if (rIdx === -1) {
      records.push({ date: checkDate, done });
    } else {
      records[rIdx].done = done;
    }

    await pool.execute(
      'UPDATE tasks SET checkin_records = ?, last_checkin = ? WHERE id = ?',
      [JSON.stringify(records), checkDate, id]
    );

    res.json({ code: 0, data: { checkin_records: records } });
  } catch (err) {
    console.error('打卡失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ========== 日志 API ==========

// 获取日志列表
app.get('/api/logs', async (req, res) => {
  const userId = getUserId(req);
  const { tag } = req.query;

  try {
    let sql = 'SELECT * FROM logs WHERE user_id = ?';
    const params = [userId];

    if (tag && tag !== 'all') {
      sql += ' AND tag = ?';
      params.push(tag);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql, params);
    const logs = rows.map(row => ({
      ...row,
      images: parseJSON(row.images, [])
    }));

    res.json({ code: 0, data: logs });
  } catch (err) {
    console.error('获取日志失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 获取单个日志
app.get('/api/logs/:id', async (req, res) => {
  const userId = getUserId(req);
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM logs WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.json({ code: 404, msg: '日志不存在' });
    res.json({
      code: 0,
      data: { ...rows[0], images: parseJSON(rows[0].images, []) }
    });
  } catch (err) {
    console.error('获取日志失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 创建日志
app.post('/api/logs', async (req, res) => {
  const userId = getUserId(req);
  const { tag, content, images } = req.body;

  if (!content || !content.trim()) {
    return res.json({ code: 400, msg: '内容不能为空' });
  }

  const id = generateId('log');
  try {
    await pool.execute(
      'INSERT INTO logs (id, user_id, tag, content, images) VALUES (?, ?, ?, ?, ?)',
      [id, userId, tag || 'custom', content.trim(), JSON.stringify(images || [])]
    );

    res.json({ code: 0, data: { id, tag: tag || 'custom', content: content.trim() } });
  } catch (err) {
    console.error('创建日志失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// 更新日志
app.put('/api/logs/:id', async (req, res) => {
  const userId = getUserId(req);
  const { content, tag, images } = req.body;

  try {
    const updates = [];
    const values = [];

    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (tag !== undefined) { updates.push('tag = ?'); values.push(tag); }
    if (images !== undefined) { updates.push('images = ?'); values.push(JSON.stringify(images)); }

    if (updates.length === 0) return res.json({ code: 400, msg: '无更新内容' });

    values.push(req.params.id, userId);
    await pool.execute(
      `UPDATE logs SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    console.error('更新日志失败:', err);
    res.json({ code: 500, msg: '服务器错误' });
  }
});

// ========== JSON 解析辅助 ==========
function parseJSON(str, fallback) {
  if (!str) return fallback;
  try {
    if (typeof str === 'string') return JSON.parse(str);
    return str;
  } catch {
    return fallback;
  }
}

// ========== 启动 ==========
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Journey Partner API 已启动，端口: ${PORT}`);
    console.log(`   🌈 彩虹卡: GET  /api/rainbow-card`);
    console.log(`   📋 任务:   CRUD /api/tasks`);
    console.log(`   📝 日志:   CRUD /api/logs`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  // 仍启动服务（无数据库时降级运行）
  app.listen(PORT, () => {
    console.warn(`⚠️ 数据库不可用，服务降级运行中，端口: ${PORT}`);
  });
});
