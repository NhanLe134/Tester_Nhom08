# 📋 Changelog: Migration to PostgreSQL

## 🎯 Mục đích
Chuyển từ SQLite (local) sang PostgreSQL (shared) để cả nhóm test chung 1 database trên server.

---

## ✅ Files đã tạo mới

### 1. Database Layer (PostgreSQL)
- `backend/db/database-pg.js` - PostgreSQL connection pool & helpers
- `backend/db/seed-pg.js` - Seed data cho PostgreSQL

### 2. Server
- `backend/server-pg.js` - Server sử dụng PostgreSQL

### 3. Routes (PostgreSQL version)
- `backend/routes/auth-pg.js` - Auth routes với async/await

### 4. Configuration
- `backend/.env.example` - Template cấu hình environment variables

### 5. Documentation
- `MIGRATION_GUIDE.md` - Hướng dẫn chi tiết migration
- `QUICK_START_POSTGRESQL.md` - Hướng dẫn nhanh 5 bước
- `backend/CONVERT_TO_PG.md` - Hướng dẫn chuyển đổi code
- `CHANGELOG_POSTGRESQL.md` - File này

---

## 🔄 Files đã cập nhật

### 1. Package Configuration
**File:** `backend/package.json`
- ✅ Thêm dependency: `pg@^8.11.3`
- ✅ Thêm scripts:
  - `npm run start:pg` - Chạy server với PostgreSQL
  - `npm run dev:pg` - Dev mode với PostgreSQL
  - `npm run seed:pg` - Seed data PostgreSQL

### 2. Documentation
**File:** `README.md`
- ✅ Thêm hướng dẫn chạy với PostgreSQL
- ✅ Cập nhật cấu trúc project
- ✅ Link đến MIGRATION_GUIDE.md

### 3. Git Ignore
**File:** `.gitignore`
- ✅ Đã có `.env` (không cần thay đổi)

---

## 📦 Dependencies mới

```json
{
  "pg": "^8.11.3"  // PostgreSQL client for Node.js
}
```

---

## 🔧 Thay đổi kỹ thuật

### 1. Database Connection
**SQLite (cũ):**
```javascript
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('taphoanga.db');
```

**PostgreSQL (mới):**
```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### 2. Query Syntax
**SQLite (cũ):**
```javascript
const user = db.prepare('SELECT * FROM TAIKHOAN WHERE TENDN = ?').get(tendn);
```

**PostgreSQL (mới):**
```javascript
const result = await pool.query('SELECT * FROM TAIKHOAN WHERE TENDN = $1', [tendn]);
const user = result.rows[0];
```

### 3. Data Types
**SQLite:**
- `REAL` cho số thập phân
- `datetime('now','localtime')` cho timestamp

**PostgreSQL:**
```sql
DECIMAL(15,2)           -- Thay vì REAL
TIMESTAMP               -- Thay vì TEXT
CURRENT_TIMESTAMP       -- Thay vì datetime('now','localtime')
```

### 4. Async/Await
Tất cả database operations giờ là **async**:
```javascript
// Cũ (sync)
router.get('/', (req, res) => {
  const data = db.prepare('SELECT ...').all();
  res.json(data);
});

// Mới (async)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT ...');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi', error: error.message });
  }
});
```

---

## 🚀 Cách sử dụng

### Option 1: SQLite (Local - Không thay đổi)
```bash
npm start
```

### Option 2: PostgreSQL (Shared - Mới)
```bash
# 1. Tạo .env
cp .env.example .env

# 2. Điền DATABASE_URL trong .env
# DATABASE_URL=postgresql://user:pass@host/db

# 3. Chạy
npm run start:pg
```

---

## 📊 So sánh

| Tính năng | SQLite | PostgreSQL |
|-----------|--------|------------|
| **File database** | `backend/db/taphoanga.db` | Server trên Render |
| **Test chung** | ❌ Mỗi người 1 file | ✅ Chung 1 database |
| **Đồng bộ** | ❌ Phải commit file | ✅ Real-time |
| **Production** | ❌ Không phù hợp | ✅ Sẵn sàng |
| **Setup** | ✅ Dễ (không cần config) | ⚠️ Cần DATABASE_URL |
| **Performance** | ✅ Nhanh (local) | ⚠️ Phụ thuộc network |

---

## ⚠️ Breaking Changes

### Không có!
- SQLite version vẫn hoạt động bình thường
- PostgreSQL là **option mới**, không thay thế SQLite
- Có thể chạy cả 2 versions song song

---

## 🔜 TODO (Tùy chọn)

Nếu muốn chuyển hoàn toàn sang PostgreSQL, cần convert thêm:

- [ ] `routes/hanghoa.js` → `routes/hanghoa-pg.js`
- [ ] `routes/hoadonban.js` → `routes/hoadonban-pg.js`
- [ ] `routes/baocao.js` → `routes/baocao-pg.js`
- [ ] `routes/taikhoan.js` → `routes/taikhoan-pg.js`

**Hướng dẫn:** Xem `backend/CONVERT_TO_PG.md`

---

## 📞 Support

Nếu gặp vấn đề:
1. Đọc [QUICK_START_POSTGRESQL.md](./QUICK_START_POSTGRESQL.md)
2. Đọc [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. Check Troubleshooting section
4. Hỏi trong nhóm

---

## 🎉 Kết luận

Migration hoàn tất! Giờ có thể:
- ✅ Test local với SQLite: `npm start`
- ✅ Test nhóm với PostgreSQL: `npm run start:pg`
- ✅ Deploy production với PostgreSQL

**Lưu ý:** Hiện tại chỉ có `auth` route được convert sang PostgreSQL. Các routes khác vẫn dùng SQLite. Nếu muốn convert hết, follow hướng dẫn trong `backend/CONVERT_TO_PG.md`.
