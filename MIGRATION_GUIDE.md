# 🔄 Migration Guide: SQLite → PostgreSQL

## Tại sao chuyển sang PostgreSQL?

✅ **Test chung cho cả nhóm** - Mọi người dùng chung 1 database trên server  
✅ **Dữ liệu đồng bộ real-time** - Không bị conflict khi nhiều người test  
✅ **Sẵn sàng cho production** - PostgreSQL phù hợp deploy lên Render  

---

## 📋 Các bước Migration

### Bước 1: Tạo PostgreSQL Database trên Render

1. Đăng nhập [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **PostgreSQL**
3. Điền thông tin:
   - **Name**: `taphoanga-db` (hoặc tên bạn muốn)
   - **Database**: `taphoanga`
   - **User**: `taphoanga_user`
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Plan**: Free
4. Click **Create Database**
5. Đợi vài phút để database được tạo

### Bước 2: Lấy Connection String

1. Vào database vừa tạo
2. Scroll xuống phần **Connections**
3. Copy **Internal Database URL** (nếu backend cũng deploy trên Render)  
   HOẶC **External Database URL** (nếu test local)
   
   Format: `postgresql://user:password@host:port/database`

### Bước 3: Cấu hình Backend

1. Tạo file `.env` trong thư mục `backend/`:

```bash
cd backend
cp .env.example .env
```

2. Mở file `.env` và điền thông tin:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=http://localhost:5173
```

**Lưu ý**: Thay `DATABASE_URL` bằng connection string từ Render

### Bước 4: Cài đặt Dependencies

```bash
cd backend
npm install
```

Lệnh này sẽ cài thêm package `pg` (PostgreSQL driver)

### Bước 5: Chạy Migration

Có 2 cách:

#### Cách 1: Tự động (Khuyến nghị)

Backend sẽ tự động tạo schema và seed data khi khởi động:

```bash
npm start
```

#### Cách 2: Thủ công

```bash
# Chỉ seed data (schema tự động tạo)
node --no-warnings db/seed-pg.js
```

### Bước 6: Kiểm tra

1. Mở trình duyệt: http://localhost:5000/api/health
2. Nếu thấy `{"status":"ok","time":"..."}` → Thành công! ✅

---

## 🔧 Cấu trúc File Mới

```
backend/
├── db/
│   ├── database.js        # SQLite (cũ - giữ lại để backup)
│   ├── database-pg.js     # PostgreSQL (mới)
│   ├── seed.js            # SQLite seed (cũ)
│   └── seed-pg.js         # PostgreSQL seed (mới)
├── .env.example           # Template cấu hình
└── .env                   # Cấu hình thực tế (không commit)
```

---

## 🚨 Lưu ý quan trọng

### 1. Không commit file .env

File `.env` chứa thông tin nhạy cảm (password database). Đã thêm vào `.gitignore`.

### 2. Chia sẻ DATABASE_URL cho team

- Gửi connection string qua chat riêng (Telegram, Discord...)
- KHÔNG post public trên GitHub Issues/PR

### 3. Free tier Render PostgreSQL

- **Storage**: 1GB
- **Connections**: 97 concurrent
- **Tự động xóa sau 90 ngày không dùng**

Đủ cho test nhóm, nhưng nhớ backup data quan trọng!

---

## 🔄 So sánh SQLite vs PostgreSQL

| Tính năng | SQLite | PostgreSQL |
|-----------|--------|------------|
| File database | `taphoanga.db` (local) | Server trên Render |
| Test chung nhóm | ❌ Mỗi người 1 file | ✅ Chung 1 database |
| Đồng bộ data | ❌ Phải commit file | ✅ Real-time |
| Production ready | ❌ Không phù hợp | ✅ Sẵn sàng |
| Setup | ✅ Dễ | ⚠️ Cần config |

---

## 🆘 Troubleshooting

### Lỗi: "DATABASE_URL environment variable is not set"

**Nguyên nhân**: Chưa tạo file `.env` hoặc chưa điền `DATABASE_URL`

**Giải pháp**:
```bash
cp .env.example .env
# Sau đó mở .env và điền DATABASE_URL
```

### Lỗi: "Connection refused" hoặc "timeout"

**Nguyên nhân**: Connection string sai hoặc database chưa sẵn sàng

**Giải pháp**:
1. Kiểm tra lại connection string từ Render
2. Đảm bảo database status là "Available" trên Render
3. Thử dùng **External Database URL** thay vì Internal

### Lỗi: "relation does not exist"

**Nguyên nhân**: Schema chưa được tạo

**Giải pháp**:
```bash
# Restart server để tự động tạo schema
npm start
```

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, hỏi trong nhóm hoặc tạo issue trên GitHub!
