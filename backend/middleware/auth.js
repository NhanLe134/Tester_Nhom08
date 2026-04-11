const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'taphoanga_secret_2024';

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Không có token xác thực' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
