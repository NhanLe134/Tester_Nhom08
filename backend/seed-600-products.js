const { getDb, transaction } = require('./db/database.js');

const categories = [
  'Bánh kẹo', 'Nước giải khát', 'Mì gói', 'Gia vị', 'Dầu ăn',
  'Sữa', 'Đồ uống có cồn', 'Thuốc lá', 'Đồ dùng cá nhân', 'Đồ gia dụng',
  'Rau củ quả', 'Thịt cá', 'Trứng', 'Bánh mì', 'Đồ đông lạnh',
  'Snack', 'Nước ngọt', 'Trà', 'Cà phê', 'Sữa chua'
];

const units = ['Cái', 'Hộp', 'Gói', 'Chai', 'Lon', 'Kg', 'Thùng', 'Bịch', 'Túi', 'Lốc'];

const brands = [
  'Vinamilk', 'TH True Milk', 'Coca Cola', 'Pepsi', 'Nestlé',
  'Unilever', 'P&G', 'Acecook', 'Masan', 'Kinh Đô',
  'Orion', 'Lotte', 'Hảo Hảo', 'Omachi', 'Kokomi',
  'Chinsu', 'Maggi', 'Knorr', 'Aji-ngon', 'Miwon'
];

function generateProducts(count, startIndex) {
  const products = [];
  
  for (let i = startIndex; i < startIndex + count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    
    const gianhap = Math.floor(Math.random() * 90000) + 10000; // 10k - 100k
    const giaban = Math.floor(gianhap * 1.3);
    const slton = Math.floor(Math.random() * 200); // 0 - 200
    const dmuctonmin = Math.floor(Math.random() * 20) + 5; // 5 - 25
    
    const product = {
      MASP: `SP${String(i).padStart(8, '0')}`,
      TENSP: `${brand} ${category} ${i}`,
      DVT: unit,
      GIABAN: giaban,
      GIANHAP: gianhap,
      SL_TON: slton,
      DMUC_TON_MIN: dmuctonmin,
      TRANGTHAI_SP: Math.random() > 0.1 ? 'Đang bán' : 'Ngừng bán',
      HINHANH: null
    };
    
    products.push(product);
  }
  
  return products;
}

async function seedProducts() {
  console.log('🌱 Bắt đầu thêm 600 sản phẩm...');
  
  try {
    const db = getDb();
    
    // Lấy số sản phẩm hiện tại
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM HANGHOA').get();
    const startIndex = (currentCount?.count || 0) + 1;
    
    console.log(`📊 Hiện có ${currentCount?.count || 0} sản phẩm, bắt đầu từ SP${String(startIndex).padStart(8, '0')}`);
    
    const products = generateProducts(600, startIndex);
    
    const stmt = db.prepare(`
      INSERT INTO HANGHOA (MASP, TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP, HINHANH)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let success = 0;
    let failed = 0;
    
    transaction(db, () => {
      for (const p of products) {
        try {
          stmt.run(
            p.MASP, p.TENSP, p.DVT, p.GIABAN, p.GIANHAP,
            p.SL_TON, p.DMUC_TON_MIN, p.TRANGTHAI_SP, p.HINHANH
          );
          success++;
          if (success % 100 === 0) {
            console.log(`✅ Đã thêm ${success} sản phẩm...`);
          }
        } catch (err) {
          failed++;
          console.error(`❌ Lỗi thêm ${p.MASP}:`, err.message);
        }
      }
    });
    
    console.log('\n📊 Kết quả:');
    console.log(`✅ Thành công: ${success} sản phẩm`);
    console.log(`❌ Thất bại: ${failed} sản phẩm`);
    console.log('🎉 Hoàn thành!');
    
  } catch (err) {
    console.error('❌ Lỗi:', err);
  }
}

seedProducts();
