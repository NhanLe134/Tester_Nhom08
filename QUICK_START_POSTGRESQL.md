# ⚡ Quick Start: PostgreSQL cho Test Nhóm

## 🎯 Mục tiêu
Chuyển từ SQLite (mỗi người 1 database) sang PostgreSQL (test chung 1 database trên server)

---

## 📝 Checklist 5 bước

### ✅ Bước 1: Tạo PostgreSQL trên Render (1 người làm, share cho cả nhóm)

1. Vào https://dashboard.render.com/
2. New + → PostgreSQL
3. Điền:
   - Name: `taphoanga-db`
   - Database: `taphoanga`
   - Region: Singapore
   - Plan: Free
4. Create Database
5. Copy **External Database URL** (dạng `postgresql://user:pass@host/db`)
6. **Share URL này cho cả nhóm qua chat riêng** (KHÔNG post public)

---

### ✅ Bước 2: Cài đặt (Mọi người làm)

```bash
cd backend
npm install
```

---

### ✅ Bước 3: Cấu hình .env (Mọi người làm)

```bash
cd backend
cp .env.example .env
```

Mở file `.env` và điền:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=taphoanga-secret-2024
DATABASE_URL=postgresql://user:pass@host/db  # ← Paste URL từ Render
FRONTEND_URL=http://localhost:5173
```

---

### ✅ Bước 4: Chạy Backend với PostgreSQL (Mọi người làm)

```bash
npm run start:pg
```

Nếu thấy:
```
✅ PostgreSQL connection pool created
✅ PostgreSQL schema initialized
✅ Seeding complete!
✅ Server đang chạy tại http://localhost:5000
```

→ **Thành công!** 🎉

---

### ✅ Bước 5: Test (Mọi người làm)

1. Mở browser: http://localhost:5000/api/health
2. Nếu thấy `{"status":"ok","database":"PostgreSQL"}` → OK!

3. Chạy Frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Mở http://localhost:5173
5. Login: `admin` / `Admin123`

---

## 🔥 Lưu ý quan trọng

### 1. Không commit file .env
File `.env` chứa password database → Đã thêm vào `.gitignore`

### 2. Dữ liệu test chung
- Mọi người dùng chung 1 database
- Thêm/sửa/xóa data sẽ ảnh hưởng đến cả nhóm
- Nếu cần reset data: Xóa database trên Render và tạo lại

### 3. Free tier Render
- 1GB storage
- 97 concurrent connections
- Tự động xóa sau 90 ngày không dùng

### 4. Nếu muốn test local riêng
Vẫn có thể dùng SQLite:
```bash
npm start  # Thay vì npm run start:pg
```

---

## 🆘 Troubleshooting

### Lỗi: "DATABASE_URL environment variable is not set"
→ Chưa tạo file `.env` hoặc chưa điền `DATABASE_URL`

**Fix:**
```bash
cp .env.example .env
# Mở .env và paste DATABASE_URL từ Render
```

---

### Lỗi: "Connection refused" hoặc "timeout"
→ Connection string sai hoặc database chưa sẵn sàng

**Fix:**
1. Check lại DATABASE_URL từ Render
2. Đảm bảo database status = "Available"
3. Thử dùng External Database URL (không phải Internal)

---

### Lỗi: "relation does not exist"
→ Schema chưa được tạo

**Fix:**
```bash
npm run start:pg  # Restart để tự động tạo schema
```

---

### Database đã có data cũ, muốn reset
**Fix:**
```bash
# Trên Render Dashboard:
# 1. Vào database
# 2. Settings → Delete Database
# 3. Tạo database mới
# 4. Update DATABASE_URL trong .env
# 5. npm run start:pg
```

---

## 📚 Tài liệu chi tiết

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Hướng dẫn đầy đủ
- [CONVERT_TO_PG.md](./backend/CONVERT_TO_PG.md) - Hướng dẫn chuyển đổi code

---

## 🎉 Xong!

Giờ cả nhóm có thể test chung trên 1 database. Chúc test vui vẻ! 🚀
