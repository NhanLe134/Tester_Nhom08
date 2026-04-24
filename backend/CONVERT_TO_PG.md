# 🔧 Hướng dẫn chuyển đổi Routes sang PostgreSQL

## Tình trạng hiện tại

✅ **Đã chuyển đổi:**
- `db/database-pg.js` - PostgreSQL connection pool
- `db/seed-pg.js` - Seed data cho PostgreSQL
- `routes/auth-pg.js` - Auth routes (async/await)
- `server-pg.js` - Server với PostgreSQL

⏳ **Cần chuyển đổi thủ công:**
- `routes/hanghoa.js`
- `routes/hoadonban.js`
- `routes/baocao.js`
- `routes/taikhoan.js`

---

## Cách chuyển đổi nhanh

### Bước 1: Thay đổi import

**SQLite (cũ):**
```javascript
const { getDb, generateMASP } = require('../db/database');
```

**PostgreSQL (mới):**
```javascript
const { getPool, generateMASP } = require('../db/database-pg');
```

### Bước 2: Chuyển từ sync sang async

**SQLite (cũ):**
```javascript
router.get('/', auth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE TENDN = ?').get(tendn);
  res.json(user);
});
```

**PostgreSQL (mới):**
```javascript
router.get('/', auth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM TAIKHOAN WHERE TENDN = $1', [tendn]);
    const user = result.rows[0];
    res.json(user);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});
```

### Bước 3: Thay đổi placeholder

- SQLite: `?` → PostgreSQL: `$1, $2, $3...`
- SQLite: `.get()` → PostgreSQL: `result.rows[0]`
- SQLite: `.all()` → PostgreSQL: `result.rows`
- SQLite: `.run()` → PostgreSQL: `await pool.query()`

### Bước 4: Chuyển đổi Transaction

**SQLite (cũ):**
```javascript
transaction(db, () => {
  db.prepare('INSERT ...').run(...);
  db.prepare('UPDATE ...').run(...);
});
```

**PostgreSQL (mới):**
```javascript
await transaction(async (client) => {
  await client.query('INSERT ...', [...]);
  await client.query('UPDATE ...', [...]);
});
```

---

## Ví dụ chi tiết: Chuyển đổi GET route

### SQLite (cũ):
```javascript
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { page = 1, limit = 15, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND TENSP LIKE ?';
    params.push(`%${search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM HANGHOA ${where}`).get(...params).cnt;
  const items = db.prepare(`SELECT * FROM HANGHOA ${where} LIMIT ? OFFSET ?`).all(...params, limit, offset);

  res.json({ items, total });
});
```

### PostgreSQL (mới):
```javascript
router.get('/', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { page = 1, limit = 15, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      where += ` AND TENSP LIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM HANGHOA ${where}`, params);
    const total = parseInt(countResult.rows[0].cnt);

    params.push(limit, offset);
    const itemsResult = await pool.query(
      `SELECT * FROM HANGHOA ${where} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    res.json({ items: itemsResult.rows, total });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});
```

---

## Lưu ý quan trọng

### 1. Column names trong PostgreSQL

PostgreSQL trả về column names **lowercase** theo mặc định:
- SQLite: `user.MATK` 
- PostgreSQL: `user.matk`

Nếu muốn giữ uppercase, dùng quotes trong schema:
```sql
CREATE TABLE TAIKHOAN (
  "MATK" TEXT PRIMARY KEY,
  "TENDN" TEXT UNIQUE NOT NULL
);
```

### 2. Parameterized queries

PostgreSQL dùng `$1, $2, $3...` thay vì `?`:
```javascript
// SQLite
db.prepare('SELECT * FROM HANGHOA WHERE MASP = ? AND TENSP = ?').get(masp, tensp);

// PostgreSQL
await pool.query('SELECT * FROM HANGHOA WHERE MASP = $1 AND TENSP = $2', [masp, tensp]);
```

### 3. Error handling

Luôn wrap async code trong try-catch:
```javascript
router.post('/', auth, async (req, res) => {
  try {
    // Your code here
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});
```

---

## Test sau khi chuyển đổi

1. Khởi động server:
```bash
node --no-warnings server-pg.js
```

2. Test health check:
```bash
curl http://localhost:5000/api/health
```

3. Test login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tendn":"admin","matkhau":"Admin123"}'
```

---

## Nếu muốn giữ cả 2 versions

Bạn có thể giữ cả SQLite và PostgreSQL:

1. **SQLite**: `server.js` + `routes/*.js` + `db/database.js`
2. **PostgreSQL**: `server-pg.js` + `routes/*-pg.js` + `db/database-pg.js`

Chạy version nào tùy môi trường:
```bash
# Local development (SQLite)
npm start

# Team testing (PostgreSQL)
node --no-warnings server-pg.js
```

---

## Cần giúp đỡ?

Nếu gặp lỗi khi chuyển đổi, check:
1. Connection string trong `.env` đúng chưa
2. Đã `npm install` để cài `pg` chưa
3. Database trên Render đã sẵn sàng chưa
4. Column names có match với code không (uppercase vs lowercase)
