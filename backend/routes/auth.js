const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taphoanga_secret_2024';

// Simulate OTP store (in-memory for demo)
const otpStore = {};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { tendn, matkhau } = req.body;
  if (!tendn || !matkhau) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE TENDN = ?').get(tendn);
  if (!user) return res.status(401).json({ message: 'Tên đăng nhập không tồn tại' });

  const valid = bcrypt.compareSync(matkhau, user.MATKHAU);
  if (!valid) return res.status(401).json({ message: 'Mật khẩu không đúng' });

  const token = jwt.sign(
    { matk: user.MATK, tendn: user.TENDN, tenht: user.TENHT },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { matk: user.MATK, tendn: user.TENDN, tenht: user.TENHT, sdt: user.SDT }
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { sdt } = req.body;
  if (!sdt) return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE SDT = ?').get(sdt);
  if (!user) return res.status(404).json({ message: 'Số điện thoại không tồn tại trong hệ thống' });

  // Generate mock OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[sdt] = { otp, matk: user.MATK, expires: Date.now() + 5 * 60 * 1000 };

  // In production, send SMS. For demo, return OTP in response.
  res.json({ message: 'Mã OTP đã được gửi', otp_demo: otp });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { sdt, otp, matkhau_moi } = req.body;
  if (!sdt || !otp) return res.status(400).json({ message: 'Thiếu thông tin xác thực' });

  const record = otpStore[sdt];
  if (!record) return res.status(400).json({ message: 'OTP không tồn tại, vui lòng thử lại' });
  if (Date.now() > record.expires) {
    delete otpStore[sdt];
    return res.status(400).json({ message: 'OTP đã hết hạn' });
  }
  if (record.otp !== otp) return res.status(400).json({ message: 'OTP không đúng' });

  if (matkhau_moi) {
    const db = getDb();
    const hashed = bcrypt.hashSync(matkhau_moi, 10);
    db.prepare('UPDATE TAIKHOAN SET MATKHAU = ? WHERE MATK = ?').run(hashed, record.matk);
    delete otpStore[sdt];
    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  }

  delete otpStore[sdt];
  res.json({ message: 'Xác thực OTP thành công' });
});

module.exports = router;
