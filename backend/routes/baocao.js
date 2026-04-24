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

// GET /api/baocao/hanghoa?tungay=&denngay=&search=
router.get('/hanghoa', auth, (req, res) => {
  const db = getDb();
  let { tungay, denngay, search = '' } = req.query;

  if (!tungay) {
    const now = new Date();
    tungay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    denngay = now.toISOString().split('T')[0];
  }
  if (!denngay) denngay = tungay;

  const searchParam = `%${search}%`;

  const rows = db.prepare(`
    SELECT
      ct.MASP,
      hh.TENSP,
      hh.DVT,
      SUM(CASE WHEN h.TRANGTHAI_HDB = 'Hoàn thành' THEN ct.SOLUONG ELSE 0 END) as sl_ban,
      SUM(CASE WHEN h.TRANGTHAI_HDB = 'Hoàn thành' THEN ct.SOLUONG * ct.GIABAN ELSE 0 END) as doanhthu,
      SUM(CASE WHEN h.TRANGTHAI_HDB = 'Đã hủy' THEN ct.SOLUONG ELSE 0 END) as sl_tra,
      SUM(CASE WHEN h.TRANGTHAI_HDB = 'Đã hủy' THEN ct.SOLUONG * ct.GIABAN ELSE 0 END) as giatri_tra,
      SUM(CASE WHEN h.TRANGTHAI_HDB = 'Hoàn thành' THEN ct.SOLUONG * ct.GIABAN ELSE 0 END)
        - SUM(CASE WHEN h.TRANGTHAI_HDB = 'Đã hủy' THEN ct.SOLUONG * ct.GIABAN ELSE 0 END) as doanhthu_thuan
    FROM CT_HOADONBAN ct
    JOIN HANGHOA hh ON ct.MASP = hh.MASP
    JOIN HOADONBAN h ON ct.MAHDB = h.MAHDB
    WHERE DATE(h.NGAYBAN) BETWEEN ? AND ?
      AND (hh.TENSP LIKE ? OR hh.MASP LIKE ?)
    GROUP BY ct.MASP
    ORDER BY doanhthu DESC
  `).all(tungay, denngay, searchParam, searchParam);

  const totals = {
    sl_ban: rows.reduce((s, r) => s + r.sl_ban, 0),
    doanhthu: rows.reduce((s, r) => s + r.doanhthu, 0),
    sl_tra: rows.reduce((s, r) => s + r.sl_tra, 0),
    giatri_tra: rows.reduce((s, r) => s + r.giatri_tra, 0),
    doanhthu_thuan: rows.reduce((s, r) => s + r.doanhthu_thuan, 0),
    sl_mat_hang: rows.length,
  };

  res.json({ rows, totals, tungay, denngay });
});

// GET /api/baocao/doanhthu/detail?ngay=2025-11-14
router.get('/doanhthu/detail', auth, (req, res) => {
  const db = getDb();
  const { ngay } = req.query;
  if (!ngay) return res.json({ rows: [] });
  const rows = db.prepare(`
    SELECT MAHDB, TONGTIENHANG_BAN as doanhthu, TRANGTHAI_HDB
    FROM HOADONBAN
    WHERE DATE(NGAYBAN) = ?
    ORDER BY NGAYBAN ASC
  `).all(ngay);
  res.json({ rows });
});

// GET /api/baocao/hanghoa/detail?masp=SP00000001&tungay=&denngay=
router.get('/hanghoa/detail', auth, (req, res) => {
  const db = getDb();
  const { masp, tungay, denngay } = req.query;
  if (!masp) return res.json({ rows: [] });
  const rows = db.prepare(`
    SELECT ct.MAHDB, ct.SOLUONG, ct.SOLUONG * ct.GIABAN as doanhthu, h.TRANGTHAI_HDB
    FROM CT_HOADONBAN ct
    JOIN HOADONBAN h ON ct.MAHDB = h.MAHDB
    WHERE ct.MASP = ?
      AND DATE(h.NGAYBAN) BETWEEN ? AND ?
    ORDER BY h.NGAYBAN ASC
  `).all(masp, tungay || '2000-01-01', denngay || '2099-12-31');
  res.json({ rows });
});

module.exports = router;
