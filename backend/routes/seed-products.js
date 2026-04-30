const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// API để seed thêm 600 sản phẩm (chỉ chạy 1 lần)
router.post('/seed-600-products', (req, res) => {
  try {
    const db = getDb();
    
    // Kiểm tra đã có 600 sản phẩm chưa
    const count = db.prepare('SELECT COUNT(*) as total FROM HANGHOA').get();
    if (count.total >= 600) {
      return res.json({ message: 'Đã có đủ 600 sản phẩm rồi', total: count.total });
    }

    // Danh mục sản phẩm
    const categories = {
      snacks: ['Bánh snack', 'Kẹo', 'Bánh quy', 'Bánh ngọt', 'Snack khoai tây'],
      beverages: ['Nước ngọt', 'Nước suối', 'Trà', 'Cà phê', 'Nước tăng lực'],
      noodles: ['Mì gói', 'Miến', 'Phở khô', 'Hủ tiếu', 'Bún'],
      condiments: ['Nước mắm', 'Nước tương', 'Dầu ăn', 'Gia vị', 'Bột canh'],
      cleaning: ['Bột giặt', 'Nước rửa chén', 'Nước lau sàn', 'Xà phòng', 'Nước xả vải'],
      personal: ['Dầu gội', 'Sữa tắm', 'Kem đánh răng', 'Bàn chải', 'Khăn giấy'],
      dairy: ['Sữa tươi', 'Sữa đặc', 'Sữa chua', 'Phô mai', 'Bơ'],
      canned: ['Cá hộp', 'Thịt hộp', 'Rau củ hộp', 'Trái cây hộp', 'Súp hộp']
    };

    const brands = ['Vinamilk', 'TH True Milk', 'Milo', 'Nestlé', 'Coca Cola', 'Pepsi', 'Oishi', 'Hảo Hảo', 
                    'Omo', 'Sunlight', 'Clear', 'Dove', 'Lifebuoy', 'P&G', 'Unilever'];

    const units = ['Gói', 'Chai', 'Lon', 'Hộp', 'Túi', 'Cái', 'Kg', 'Lít'];

    // Tạo 580 sản phẩm mới (từ SP00000021 đến SP00000600)
    const products = [];
    for (let i = 21; i <= 600; i++) {
      const masp = `SP${String(i).padStart(8, '0')}`;
      const categoryKeys = Object.keys(categories);
      const category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      const items = categories[category];
      const item = items[Math.floor(Math.random() * items.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const unit = units[Math.floor(Math.random() * units.length)];
      
      // Giá bán từ 5k-70k
      const giaban = Math.floor(Math.random() * 13) * 5000 + 5000;
      const gianhap = Math.floor(giaban * 0.75);
      const slton = Math.floor(Math.random() * 150) + 20;
      const dmuctonmin = Math.floor(Math.random() * 20) + 5;

      products.push({
        MASP: masp,
        TENSP: `${item} ${brand} ${Math.floor(Math.random() * 500) + 100}${unit === 'Kg' || unit === 'Lít' ? 'ml' : 'g'}`,
        DVT: unit,
        GIABAN: giaban,
        GIANHAP: gianhap,
        SL_TON: slton,
        DMUC_TON_MIN: dmuctonmin
      });
    }

    // Insert vào database
    const stmt = db.prepare(`
      INSERT INTO HANGHOA (MASP, TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Đang bán')
    `);

    db.exec('BEGIN');
    try {
      for (const p of products) {
        stmt.run(p.MASP, p.TENSP, p.DVT, p.GIABAN, p.GIANHAP, p.SL_TON, p.DMUC_TON_MIN);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const newCount = db.prepare('SELECT COUNT(*) as total FROM HANGHOA').get();
    res.json({ 
      message: 'Đã thêm 580 sản phẩm thành công!', 
      total: newCount.total,
      added: products.length 
    });
  } catch (error) {
    console.error('Lỗi seed sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm', error: error.message });
  }
});

module.exports = router;
