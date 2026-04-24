# ⚡ Bắt đầu nhanh - PostgreSQL cho Test Nhóm

## 🎯 Mục tiêu
Cả nhóm test chung 1 database trên server thay vì mỗi người 1 file SQLite local.

---

## 👤 Dành cho Team Lead (1 người làm)

### 1. Tạo Database trên Render

```
1. Vào: https://dashboard.render.com/
2. Đăng nhập bằng GitHub
3. Click "New +" → "PostgreSQL"
4. Điền:
   - Name: taphoanga-db
   - Database: taphoanga
   - User: taphoanga_user
   - Region: Singapore
   - Plan: Free
5. Click "Create Database"
6. Đợi 2-3 phút
```

### 2. Lấy Connection String

```
1. Vào database vừa tạo
2. Scroll xuống "Connections"
3. Copy "External Database URL"
   
   Dạng: postgresql://user:pass@host/db
```

### 3. Share cho nhóm

```
Gửi connection string qua:
- Telegram/Discord (private group)
- Google Docs (private)

⚠️ KHÔNG post public trên GitHub!
```

---

## 👥 Dành cho Thành viên (Mọi người làm)

### 1. Cài đặt

```bash
# Pull code mới
git pull origin main

# Cài dependencies
cd backend
npm install
```

### 2. Cấu hình

```bash
# Tạo file .env
cp .env.example .env

# Mở .env và paste connection string từ team lead
# DATABASE_URL=postgresql://user:pass@host/db
```

**File `.env` sau khi sửa:**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=taphoanga-secret-2024
DATABASE_URL=postgresql://taphoanga_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/taphoanga
FRONTEND_URL=http://localhost:5173
```

### 3. Chạy Backend

```bash
npm run start:pg
```

**Kết quả mong đợi:**
```
✅ PostgreSQL connection pool created
✅ PostgreSQL schema initialized
✅ Server đang chạy tại http://localhost:5000
```

### 4. Chạy Frontend (Terminal mới)

```bash
cd frontend
npm install
npm run dev
```

### 5. Test

```
1. Mở: http://localhost:5173
2. Login: admin / Admin123
3. Thử thêm sản phẩm
4. Yêu cầu người khác refresh → Thấy sản phẩm bạn vừa thêm ✅
```

---

## 🆘 Gặp lỗi?

### "DATABASE_URL environment variable is not set"
```bash
# Chưa tạo .env hoặc chưa điền DATABASE_URL
cp .env.example .env
# Mở .env và paste DATABASE_URL
```

### "Connection refused"
```
1. Check lại DATABASE_URL trong .env
2. Đảm bảo không có dấu cách thừa
3. Yêu cầu team lead gửi lại connection string
```

### "password authentication failed"
```
Connection string sai → Yêu cầu team lead gửi lại
```

### Backend chạy nhưng không thấy data
```
Đây là bình thường! Database đã có data từ lần chạy trước.
Message "Database already seeded" là OK.
```

---

## 📊 Kiểm tra nhanh

### Backend OK?
```bash
curl http://localhost:5000/api/health
# Kết quả: {"status":"ok","database":"PostgreSQL",...}
```

### Frontend OK?
```
Mở: http://localhost:5173
Thấy trang Login → OK!
```

### Database chung OK?
```
1. Người A thêm sản phẩm
2. Người B refresh trang
3. Người B thấy sản phẩm của A → OK!
```

---

## 💡 Lưu ý

- ✅ Mọi người dùng chung 1 database
- ✅ Thêm/sửa/xóa data sẽ ảnh hưởng đến cả nhóm
- ⚠️ Không xóa data của người khác
- ⚠️ Free tier: 1GB storage, 97 connections
- ⚠️ Tự động xóa sau 90 ngày không dùng

---

## 📚 Đọc thêm

- [HUONG_DAN_RENDER_POSTGRESQL.md](./HUONG_DAN_RENDER_POSTGRESQL.md) - Hướng dẫn chi tiết
- [SETUP_ENVIRONMENT.md](./SETUP_ENVIRONMENT.md) - Setup môi trường
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration guide

---

## 🎉 Xong!

Giờ cả nhóm có thể test chung trên 1 database! 🚀

**Nếu muốn test local riêng (SQLite):**
```bash
npm start  # Thay vì npm run start:pg
```
