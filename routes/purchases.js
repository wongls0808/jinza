import express from 'express';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDb() {
  const dataDir = process.env.DATA_DIR ? process.env.DATA_DIR : join(__dirname, '../data');
  const dbPath = join(dataDir, 'app.db');
  return new sqlite3.Database(dbPath);
}

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '请先登录' });
  }
  next();
};

const router = express.Router();

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// GET /api/purchases?account_set_id=...&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// 汇总：按日期+商品聚合数量合计，均价=加权平均(unit_price*quantity/quantity)
router.get('/', requireAuth, async (req, res) => {
  const { account_set_id, start_date, end_date, product_code, search } = req.query;
  if (!account_set_id) return res.status(400).json({ error: '缺少account_set_id' });

  const db = getDb();
  try {
    let where = 'WHERE pr.account_set_id = ?';
    const params = [account_set_id];
    if (start_date && end_date) {
      where += ' AND pr.record_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    if (product_code) {
      where += ' AND pr.product_code = ?';
      params.push(product_code);
    }
    if (search) {
      where += ' AND (pr.product_code LIKE ? OR pr.product_description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    const sql = `
      SELECT 
        pr.record_date as date,
        COALESCE(p.code, pr.product_code) as product_code,
        COALESCE(p.description, pr.product_description) as product_description,
        COALESCE(p.unit, pr.unit) as unit,
        SUM(pr.quantity) as quantity_total,
        CASE WHEN SUM(pr.quantity) = 0 THEN 0
             ELSE ROUND(SUM(pr.unit_price * pr.quantity) / SUM(pr.quantity), 4)
        END as unit_price_avg
      FROM purchase_records pr
      LEFT JOIN products p ON p.id = pr.product_id
      ${where}
      GROUP BY pr.record_date, COALESCE(p.code, pr.product_code), COALESCE(p.description, pr.product_description), COALESCE(p.unit, pr.unit)
      ORDER BY pr.record_date DESC, product_code ASC
    `;

    const rows = await dbAll(db, sql, params);
    res.json(rows);
  } catch (err) {
    console.error('获取采购库失败:', err);
    res.status(500).json({ error: '获取采购库失败' });
  } finally {
    try { db.close(); } catch(e) {}
  }
});

export default router;
