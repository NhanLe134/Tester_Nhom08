const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDb, generateMAHDB, transaction } = require('../db/database');

// GET /api/hoadonban
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { page = 1, limit = 15, search = '', trangthai = '', pttt = '', tungay = '', denngay = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ` AND (MAHDB LIKE ? OR EXISTS (
      SELECT 1 FROM CT_HOADONBAN ct 
      JOIN HANGHOA hh ON ct.MASP = hh.MASP 
      WHERE ct.MAHDB = HOADONBAN.MAHDB 
      AND (hh.TENSP LIKE ? OR hh.MASP LIKE ?)
    ))`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (trangthai) {
    const statuses = trangthai.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      where += ` AND TRANGTHAI_HDB IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
  }
  if (pttt) {
    const methods = pttt.split(',').map(s => s.trim()).filter(Boolean);
    if (methods.length > 0) {
      where += ` AND PTTT IN (${methods.map(() => '?').join(',')})`;
      params.push(...methods);
    }
  }
  if (tungay) {
    where += ' AND DATE(NGAYBAN) >= ?';
    params.push(tungay);
  }
  if (denngay) {
    where += ' AND DATE(NGAYBAN) <= ?';
    params.push(denngay);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM HOADONBAN ${where}`).get(...params).cnt;
  const items = db.prepare(`SELECT * FROM HOADONBAN ${where} ORDER BY NGAYBAN DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({ items, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/hoadonban/:mahdb
router.get('/:mahdb', auth, (req, res) => {
  const db = getDb();
  const hdb = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(req.params.mahdb);
  if (!hdb) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

  const items = db.prepare(`
    SELECT ct.*, hh.TENSP, hh.DVT
    FROM CT_HOADONBAN ct
    JOIN HANGHOA hh ON ct.MASP = hh.MASP
    WHERE ct.MAHDB = ?
  `).all(req.params.mahdb);

  res.json({ ...hdb, items });
});

// POST /api/hoadonban
router.post('/', auth, (req, res) => {
  const db = getDb();
  const { items, pttt, ghichu } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ message: 'Hóa đơn phải có ít nhất 1 sản phẩm' });

  // Validate stock
  for (const item of items) {
    const product = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ? AND TRANGTHAI_SP = ?').get(item.MASP, 'Đang bán');
    if (!product) return res.status(400).json({ message: `Sản phẩm ${item.MASP} không tồn tại hoặc đã ngừng bán` });
    if (product.SL_TON <= 0) {
      return res.status(400).json({ message: `Sản phẩm "${product.TENSP}" đã hết hàng (tồn kho = 0)` });
    }
    if (product.SL_TON < item.SOLUONG) {
      return res.status(400).json({ message: `Sản phẩm "${product.TENSP}" không đủ tồn kho (còn ${product.SL_TON})` });
    }
  }

  const MAHDB = generateMAHDB();
  const total = items.reduce((s, i) => s + i.SOLUONG * i.GIABAN, 0);
  const NGAYBAN = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const insertHDB = db.prepare(`
    INSERT INTO HOADONBAN (MAHDB, NGUOITAO, TONGTIENHANG_BAN, NGAYBAN, PTTT, TRANGTHAI_HDB, GHICHU)
    VALUES (?, ?, ?, ?, ?, 'Hoàn thành', ?)
  `);
  const insertCT = db.prepare(`INSERT INTO CT_HOADONBAN (MAHDB, MASP, SOLUONG, GIABAN) VALUES (?, ?, ?, ?)`);
  const deductStock = db.prepare(`UPDATE HANGHOA SET SL_TON = SL_TON - ? WHERE MASP = ?`);

  try {
    transaction(db, () => {
      insertHDB.run(MAHDB, req.user.matk, total, NGAYBAN, pttt || 'Tiền mặt', ghichu || null);
      for (const item of items) {
        insertCT.run(MAHDB, item.MASP, item.SOLUONG, item.GIABAN);
        deductStock.run(item.SOLUONG, item.MASP);
      }
    });
  } catch (err) {
    return res.status(500).json({ message: `Lưu hóa đơn ${MAHDB} thất bại` });
  }

  const created = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(MAHDB);
  const createdItems = db.prepare(`
    SELECT ct.*, hh.TENSP, hh.DVT, hh.SL_TON, hh.DMUC_TON_MIN 
    FROM CT_HOADONBAN ct 
    JOIN HANGHOA hh ON ct.MASP = hh.MASP 
    WHERE ct.MAHDB = ?
  `).all(MAHDB);

  // Check for low inventory warning
  const warnings = createdItems
    .filter(i => i.SL_TON < i.DMUC_TON_MIN)
    .map(i => `Cảnh báo tồn kho dưới định mức tồn: ${i.TENSP} (Còn ${i.SL_TON})`);

  res.status(201).json({ ...created, items: createdItems, warnings });
});

// PUT /api/hoadonban/:mahdb/ghichu
router.put('/:mahdb/ghichu', auth, (req, res) => {
  const db = getDb();
  const hdb = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(req.params.mahdb);
  if (!hdb) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

  db.prepare('UPDATE HOADONBAN SET GHICHU = ? WHERE MAHDB = ?').run(req.body.ghichu || null, req.params.mahdb);
  res.json({ message: 'Đã cập nhật ghi chú' });
});

// PUT /api/hoadonban/:mahdb/huy
router.put('/:mahdb/huy', auth, (req, res) => {
  const db = getDb();
  const hdb = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(req.params.mahdb);
  if (!hdb) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
  if (hdb.TRANGTHAI_HDB === 'Đã hủy') return res.status(400).json({ message: 'Hóa đơn đã được hủy trước đó' });

  const items = db.prepare('SELECT * FROM CT_HOADONBAN WHERE MAHDB = ?').all(req.params.mahdb);
  const restoreStock = db.prepare('UPDATE HANGHOA SET SL_TON = SL_TON + ? WHERE MASP = ?');

  const cancelInvoice = () => transaction(db, () => {
    db.prepare(`UPDATE HOADONBAN SET TRANGTHAI_HDB = 'Đã hủy' WHERE MAHDB = ?`).run(req.params.mahdb);
    for (const item of items) {
      restoreStock.run(item.SOLUONG, item.MASP);
    }
  });

  cancelInvoice();
  res.json({ message: 'Đã hủy hóa đơn và hoàn trả tồn kho' });
});

module.exports = router;
