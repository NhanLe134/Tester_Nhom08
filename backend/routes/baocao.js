const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDb } = require('../db/database');

// GET /api/baocao/doanhthu?tungay=&denngay=
router.get('/doanhthu', auth, (req, res) => {
  const db = getDb();
  let { tungay, denngay, loai = 'ngay' } = req.query;

  if (!tungay) {
    const now = new Date();
    tungay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    denngay = now.toISOString().split('T')[0];
  }
  if (!denngay) denngay = tungay;

  const rows = db.prepare(`
    SELECT
      DATE(NGAYBAN) as thoigian,
      SUM(CASE WHEN TRANGTHAI_HDB = 'Hoàn thành' THEN TONGTIENHANG_BAN ELSE 0 END) as doanhthu,
      SUM(CASE WHEN TRANGTHAI_HDB = 'Đã hủy' THEN TONGTIENHANG_BAN ELSE 0 END) as giatri_tra,
      COUNT(CASE WHEN TRANGTHAI_HDB = 'Hoàn thành' THEN 1 END) as so_don
    FROM HOADONBAN
    WHERE DATE(NGAYBAN) BETWEEN ? AND ?
    GROUP BY DATE(NGAYBAN)
    ORDER BY thoigian ASC
  `).all(tungay, denngay);

  const result = rows.map(r => ({
    ...r,
    doanhthu_thuan: r.doanhthu - r.giatri_tra
  }));

  const totals = {
    doanhthu: result.reduce((s, r) => s + r.doanhthu, 0),
    giatri_tra: result.reduce((s, r) => s + r.giatri_tra, 0),
    doanhthu_thuan: result.reduce((s, r) => s + r.doanhthu_thuan, 0),
    so_don: result.reduce((s, r) => s + r.so_don, 0),
  };

  res.json({ rows: result, totals, tungay, denngay });
});

// GET /api/baocao/hanghoa?tungay=&denngay=
router.get('/hanghoa', auth, (req, res) => {
  const db = getDb();
  let { tungay, denngay } = req.query;

  if (!tungay) {
    const now = new Date();
    tungay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    denngay = now.toISOString().split('T')[0];
  }
  if (!denngay) denngay = tungay;

  const rows = db.prepare(`
    SELECT
      ct.MASP,
      hh.TENSP,
      hh.DVT,
      SUM(ct.SOLUONG) as sl_ban,
      SUM(ct.SOLUONG * ct.GIABAN) as doanhthu,
      SUM(ct.SOLUONG * (ct.GIABAN - hh.GIANHAP)) as loinhuanthu
    FROM CT_HOADONBAN ct
    JOIN HANGHOA hh ON ct.MASP = hh.MASP
    JOIN HOADONBAN h ON ct.MAHDB = h.MAHDB
    WHERE DATE(h.NGAYBAN) BETWEEN ? AND ?
      AND h.TRANGTHAI_HDB = 'Hoàn thành'
    GROUP BY ct.MASP
    ORDER BY doanhthu DESC
  `).all(tungay, denngay);

  const totals = {
    sl_ban: rows.reduce((s, r) => s + r.sl_ban, 0),
    doanhthu: rows.reduce((s, r) => s + r.doanhthu, 0),
    loinhuanthu: rows.reduce((s, r) => s + r.loinhuanthu, 0),
  };

  res.json({ rows, totals, tungay, denngay });
});

module.exports = router;
