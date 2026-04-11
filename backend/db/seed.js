const bcrypt = require('bcryptjs');
const { getDb, transaction } = require('./database');

function seed() {
  const db = getDb();

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM TAIKHOAN').get();
  if (existing.cnt > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  const adminId = 'TK00000001';
  const hashedPw = bcrypt.hashSync('Admin123', 10);

  transaction(db, () => {
    db.prepare(`INSERT INTO TAIKHOAN (MATK, TENDN, MATKHAU, SDT, TENHT) VALUES (?, ?, ?, ?, ?)`)
      .run(adminId, 'admin', hashedPw, '0987654321', 'Chủ Tiệm Nga');

    const products = [
      { MASP: 'SP00000001', TENSP: 'Mì Hảo Hảo Tôm Chua Cay', DVT: 'Gói', GIABAN: 5000, GIANHAP: 3500, SL_TON: 150, DMUC_TON_MIN: 20 },
      { MASP: 'SP00000002', TENSP: 'Nước Ngọt Coca Cola 330ml', DVT: 'Lon', GIABAN: 12000, GIANHAP: 9000, SL_TON: 80, DMUC_TON_MIN: 10 },
      { MASP: 'SP00000003', TENSP: 'Bánh Oreo Vị Vani', DVT: 'Gói', GIABAN: 25000, GIANHAP: 18000, SL_TON: 45, DMUC_TON_MIN: 5 },
      { MASP: 'SP00000004', TENSP: 'Nước Suối Lavie 500ml', DVT: 'Chai', GIABAN: 6000, GIANHAP: 4000, SL_TON: 200, DMUC_TON_MIN: 30 },
      { MASP: 'SP00000005', TENSP: 'Kẹo Dừa Bến Tre', DVT: 'Gói', GIABAN: 15000, GIANHAP: 10000, SL_TON: 60, DMUC_TON_MIN: 10 },
      { MASP: 'SP00000006', TENSP: 'Snack Oishi Tôm', DVT: 'Gói', GIABAN: 10000, GIANHAP: 7000, SL_TON: 90, DMUC_TON_MIN: 15 },
      { MASP: 'SP00000007', TENSP: 'Trà Xanh Không Độ 500ml', DVT: 'Chai', GIABAN: 10000, GIANHAP: 7500, SL_TON: 120, DMUC_TON_MIN: 20 },
      { MASP: 'SP00000008', TENSP: 'Bánh Kinh Đô Trung Thu', DVT: 'Hộp', GIABAN: 85000, GIANHAP: 65000, SL_TON: 15, DMUC_TON_MIN: 3 },
      { MASP: 'SP00000009', TENSP: 'Dầu Ăn Neptune 1L', DVT: 'Chai', GIABAN: 45000, GIANHAP: 38000, SL_TON: 30, DMUC_TON_MIN: 5 },
      { MASP: 'SP00000010', TENSP: 'Nước Mắm Phú Quốc 500ml', DVT: 'Chai', GIABAN: 35000, GIANHAP: 28000, SL_TON: 25, DMUC_TON_MIN: 5 },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO HANGHOA (MASP, TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Đang bán')
    `);
    for (const p of products) {
      insertProduct.run(p.MASP, p.TENSP, p.DVT, p.GIABAN, p.GIANHAP, p.SL_TON, p.DMUC_TON_MIN);
    }

    const invoices = [
      {
        MAHDB: 'HDB0000001', NGAYBAN: '2024-01-15 09:30:00', PTTT: 'Tiền mặt', TRANGTHAI_HDB: 'Hoàn thành',
        items: [{ MASP: 'SP00000001', SOLUONG: 5, GIABAN: 5000 }, { MASP: 'SP00000002', SOLUONG: 3, GIABAN: 12000 }]
      },
      {
        MAHDB: 'HDB0000002', NGAYBAN: '2024-01-16 14:20:00', PTTT: 'Chuyển khoản', TRANGTHAI_HDB: 'Hoàn thành',
        items: [{ MASP: 'SP00000003', SOLUONG: 2, GIABAN: 25000 }, { MASP: 'SP00000007', SOLUONG: 4, GIABAN: 10000 }]
      },
      {
        MAHDB: 'HDB0000003', NGAYBAN: '2024-01-17 10:00:00', PTTT: 'Tiền mặt', TRANGTHAI_HDB: 'Hoàn thành',
        items: [{ MASP: 'SP00000004', SOLUONG: 10, GIABAN: 6000 }, { MASP: 'SP00000006', SOLUONG: 3, GIABAN: 10000 }, { MASP: 'SP00000005', SOLUONG: 2, GIABAN: 15000 }]
      },
      {
        MAHDB: 'HDB0000004', NGAYBAN: '2024-01-18 16:45:00', PTTT: 'Tiền mặt', TRANGTHAI_HDB: 'Đã hủy',
        items: [{ MASP: 'SP00000008', SOLUONG: 1, GIABAN: 85000 }]
      },
      {
        MAHDB: 'HDB0000005', NGAYBAN: new Date().toISOString().replace('T', ' ').substring(0, 19), PTTT: 'Tiền mặt', TRANGTHAI_HDB: 'Hoàn thành',
        items: [{ MASP: 'SP00000001', SOLUONG: 10, GIABAN: 5000 }, { MASP: 'SP00000009', SOLUONG: 2, GIABAN: 45000 }, { MASP: 'SP00000010', SOLUONG: 1, GIABAN: 35000 }]
      },
    ];

    const insertHDB = db.prepare(`
      INSERT INTO HOADONBAN (MAHDB, NGUOITAO, TONGTIENHANG_BAN, NGAYBAN, PTTT, TRANGTHAI_HDB, GHICHU)
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `);
    const insertCT = db.prepare(`INSERT INTO CT_HOADONBAN (MAHDB, MASP, SOLUONG, GIABAN) VALUES (?, ?, ?, ?)`);

    for (const inv of invoices) {
      const total = inv.items.reduce((s, i) => s + i.SOLUONG * i.GIABAN, 0);
      insertHDB.run(inv.MAHDB, adminId, total, inv.NGAYBAN, inv.PTTT, inv.TRANGTHAI_HDB);
      for (const item of inv.items) {
        insertCT.run(inv.MAHDB, item.MASP, item.SOLUONG, item.GIABAN);
      }
    }
  });

  console.log('Seeding complete!');
}

seed();
