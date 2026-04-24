require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',           // Local development
    'https://tester-nhom08.vercel.app' // Production
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize DB and seed on startup
const { getDb } = require('./db/database');
getDb(); // Initialize schema

// Auto-seed
try {
  require('./db/seed');
} catch (e) {
  console.log('Seed skipped:', e.message);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hanghoa', require('./routes/hanghoa'));
app.use('/api/hoadonban', require('./routes/hoadonban'));
app.use('/api/baocao', require('./routes/baocao'));
app.use('/api/taikhoan', require('./routes/taikhoan'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Root route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Tạp Hóa Nga API',
    status: 'running',
    database: 'SQLite',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/hanghoa',
      invoices: '/api/hoadonban',
      reports: '/api/baocao',
      accounts: '/api/taikhoan'
    },
    docs: 'https://github.com/NhanLe134/Tester_Nhom08'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
