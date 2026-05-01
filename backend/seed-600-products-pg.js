require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
      masp: `SP${String(i).padStart(8, '0')}`,
      tensp: `${brand} ${category} ${i}`,
      dvt: unit,
      giaban: giaban,
      gianhap: gianhap,
      sl_ton: slton,
      dmuc_ton_min: dmuctonmin,
      trangthai_sp: Math.random() > 0.1 ? 'Đang bán' : 'Ngừng bán',
      hinhanh: null
    };
    
    products.push(product);
  }
  
  return products;
}

async function seedProducts() {
  console.log('🌱 Bắt đầu thêm 600 sản phẩm vào PostgreSQL...');
  
  const client = await pool.connect();
  
  try {
    // Lấy số sản phẩm hiện tại
    const countResult = await client.query('SELECT COUNT(*) as count FROM hanghoa');
    const currentCount = parseInt(countResult.rows[0].count);
    const startIndex = currentCount + 1;
    
    console.log(`📊 Hiện có ${currentCount} sản phẩm, bắt đầu từ SP${String(startIndex).padStart(8, '0')}`);
    
    const products = generateProducts(600, startIndex);
    
    let success = 0;
    let failed = 0;
    
    await client.query('BEGIN');
    
    for (const p of products) {
      try {
        await client.query(`
          INSERT INTO hanghoa (masp, tensp, dvt, giaban, gianhap, sl_ton, dmuc_ton_min, trangthai_sp, hinhanh)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [p.masp, p.tensp, p.dvt, p.giaban, p.gianhap, p.sl_ton, p.dmuc_ton_min, p.trangthai_sp, p.hinhanh]);
        
        success++;
        if (success % 100 === 0) {
          console.log(`✅ Đã thêm ${success} sản phẩm...`);
        }
      } catch (err) {
        failed++;
        console.error(`❌ Lỗi thêm ${p.masp}:`, err.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n📊 Kết quả:');
    console.log(`✅ Thành công: ${success} sản phẩm`);
    console.log(`❌ Thất bại: ${failed} sản phẩm`);
    console.log('🎉 Hoàn thành!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts();
