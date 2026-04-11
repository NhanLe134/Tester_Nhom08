const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

// GET /api/taikhoan/me
router.get('/me', auth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT MATK, TENDN, SDT, TENHT FROM TAIKHOAN WHERE MATK = ?').get(req.user.matk);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
  res.json(user);
});

// PUT /api/taikhoan/me
router.put('/me', auth, (req, res) => {
  const db = getDb();
  const { tenht, sdt } = req.body;
  db.prepare('UPDATE TAIKHOAN SET TENHT = ?, SDT = ? WHERE MATK = ?').run(tenht, sdt, req.user.matk);
  const updated = db.prepare('SELECT MATK, TENDN, SDT, TENHT FROM TAIKHOAN WHERE MATK = ?').get(req.user.matk);
  res.json(updated);
});

// PUT /api/taikhoan/me/password
router.put('/me/password', auth, (req, res) => {
  const db = getDb();
  const { matkhau_cu, matkhau_moi, xacnhan } = req.body;

  if (!matkhau_cu || !matkhau_moi || !xacnhan) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }
  if (matkhau_moi !== xacnhan) {
    return res.status(400).json({ message: 'Mật khẩu mới và xác nhận không khớp' });
  }
  if (matkhau_moi.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE MATK = ?').get(req.user.matk);
  const valid = bcrypt.compareSync(matkhau_cu, user.MATKHAU);
  if (!valid) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });

  const hashed = bcrypt.hashSync(matkhau_moi, 10);
  db.prepare('UPDATE TAIKHOAN SET MATKHAU = ? WHERE MATK = ?').run(hashed, req.user.matk);
  res.json({ message: 'Đổi mật khẩu thành công' });
});

module.exports = router;
