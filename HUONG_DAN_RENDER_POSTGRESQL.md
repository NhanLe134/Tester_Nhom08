# 🗄️ Hướng dẫn tạo PostgreSQL trên Render (Chi tiết từng bước)

## 👥 Phân công

- **1 người (Team Lead):** Tạo database và share connection string
- **Cả nhóm:** Cấu hình và sử dụng database chung

---

## 📋 Phần 1: Tạo Database (1 người làm)

### Bước 1: Đăng ký/Đăng nhập Render

1. Truy cập: https://render.com/
2. Click **"Get Started"** hoặc **"Sign In"**
3. Đăng nhập bằng:
   - GitHub (Khuyến nghị)
   - GitLab
   - Google
   - Email

**Lưu ý:** Dùng GitHub sẽ dễ deploy code sau này.

---

### Bước 2: Tạo PostgreSQL Database

1. Sau khi đăng nhập, vào Dashboard: https://dashboard.render.com/

2. Click nút **"New +"** (góc trên bên phải)

3. Chọn **"PostgreSQL"**

4. Điền thông tin:

   ```
   Name:           taphoanga-db
   Database:       taphoanga
   User:           taphoanga_user
   Region:         Singapore (gần Việt Nam nhất)
   PostgreSQL Version: 16 (mặc định)
   Datadog API Key: (để trống)
   Plan:           Free
   ```

   **Giải thích:**
   - **Name:** Tên hiển thị của database (có thể đặt tùy ý)
   - **Database:** Tên database thực tế (dùng trong connection string)
   - **User:** Username để connect
   - **Region:** Chọn Singapore để ping thấp từ Việt Nam
   - **Plan:** Free (đủ cho test nhóm)

5. Click **"Create Database"**

6. Đợi 2-3 phút để Render tạo database

---

### Bước 3: Lấy Connection String

1. Sau khi database được tạo, bạn sẽ thấy trang thông tin database

2. Scroll xuống phần **"Connections"**

3. Bạn sẽ thấy 2 loại connection string:

   **a) Internal Database URL** (dùng khi backend cũng deploy trên Render)
   ```
   postgresql://taphoanga_user:xxxxx@dpg-xxxxx/taphoanga
   ```

   **b) External Database URL** (dùng khi test local) ⭐ **Copy cái này**
   ```
   postgresql://taphoanga_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/taphoanga
   ```

4. Click icon **"Copy"** bên cạnh **External Database URL**

5. Lưu connection string này vào notepad tạm thời

---

### Bước 4: Share Connection String cho nhóm

**⚠️ QUAN TRỌNG: Connection string chứa password, KHÔNG post public!**

**Cách share an toàn:**

1. **Telegram/Discord (Private Group):**
   ```
   📢 Database PostgreSQL đã sẵn sàng!
   
   Connection String:
   postgresql://taphoanga_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/taphoanga
   
   Mọi người copy và paste vào file .env nhé!
   ```

2. **Google Docs (Private, chỉ nhóm):**
   - Tạo Google Doc riêng cho nhóm
   - Paste connection string
   - Share link với quyền "View only"

3. **GitHub (KHÔNG khuyến nghị):**
   - ❌ KHÔNG commit vào code
   - ❌ KHÔNG post trong Issues/PR
   - ✅ Có thể dùng GitHub Secrets (nâng cao)

---

### Bước 5: Kiểm tra Database Info

Trong trang database Render, bạn sẽ thấy:

```
Status:         Available ✅
Region:         Singapore
PostgreSQL:     16
Plan:           Free
Storage:        1 GB
Connections:    97 concurrent
Created:        [timestamp]
```

**Free tier limits:**
- ✅ 1 GB storage (đủ cho test)
- ✅ 97 concurrent connections
- ⚠️ Tự động xóa sau 90 ngày không dùng
- ⚠️ Có thể bị suspend nếu vượt quota

---

## 📋 Phần 2: Cấu hình Local (Mọi người làm)

### Bước 1: Pull code mới nhất

```bash
git pull origin main
```

Hoặc nếu chưa clone:
```bash
git clone https://github.com/your-repo/Tester_Nhom08.git
cd Tester_Nhom08-main
```

---

### Bước 2: Cài đặt dependencies

```bash
cd backend
npm install
```

**Lưu ý:** Lệnh này sẽ cài thêm package `pg` (PostgreSQL driver)

---

### Bước 3: Tạo file .env

#### Windows:
```bash
copy .env.example .env
```

#### Linux/Mac:
```bash
cp .env.example .env
```

---

### Bước 4: Cấu hình .env

1. Mở file `backend/.env` bằng text editor (VS Code, Notepad++, v.v.)

2. Paste connection string từ team lead:

   **Trước:**
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=
   FRONTEND_URL=http://localhost:5173
   ```

   **Sau:**
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=taphoanga-secret-2024
   DATABASE_URL=postgresql://taphoanga_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/taphoanga
   FRONTEND_URL=http://localhost:5173
   ```

3. Save file (Ctrl+S)

**⚠️ Lưu ý:**
- Không có dấu cách trước/sau dấu `=`
- Không có dấu ngoặc kép `"` quanh connection string
- Paste đúng connection string từ team lead

---

### Bước 5: Chạy Backend với PostgreSQL

```bash
npm run start:pg
```

**Kết quả mong đợi:**
```
🔄 Initializing PostgreSQL connection...
✅ PostgreSQL connection pool created
🔄 Creating database schema...
✅ PostgreSQL schema initialized
🔄 Seeding database...
Database already seeded.
✅ Database ready!
✅ Server đang chạy tại http://localhost:5000
📊 Database: PostgreSQL
```

**Nếu thấy lỗi, xem phần Troubleshooting bên dưới.**

---

### Bước 6: Chạy Frontend

Mở terminal mới (giữ backend chạy):

```bash
cd frontend
npm install
npm run dev
```

**Kết quả mong đợi:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 📋 Phần 3: Test (Mọi người làm)

### Test 1: Backend Health Check

**Cách 1: Browser**
1. Mở browser
2. Truy cập: http://localhost:5000/api/health
3. Kết quả mong đợi:
   ```json
   {
     "status": "ok",
     "database": "PostgreSQL",
     "time": "2026-04-24T..."
   }
   ```

**Cách 2: Command line**
```bash
curl http://localhost:5000/api/health
```

---

### Test 2: Frontend

1. Mở browser: http://localhost:5173

2. Bạn sẽ thấy trang Login

3. Đăng nhập:
   - **Tên đăng nhập:** `admin`
   - **Mật khẩu:** `Admin123`

4. Nếu login thành công → Vào Dashboard ✅

---

### Test 3: Kiểm tra dữ liệu chung

1. Login vào hệ thống

2. Vào trang **Hàng hóa**

3. Bạn sẽ thấy 20 sản phẩm mẫu (do seed data)

4. Thử thêm 1 sản phẩm mới

5. **Yêu cầu người khác trong nhóm:**
   - Refresh trang Hàng hóa
   - Họ sẽ thấy sản phẩm bạn vừa thêm ✅

**→ Chứng tỏ database đang được share chung!**

---

## 🆘 Troubleshooting

### Lỗi 1: "DATABASE_URL environment variable is not set"

**Nguyên nhân:** Chưa tạo file `.env` hoặc chưa điền `DATABASE_URL`

**Fix:**
```bash
# Kiểm tra file .env có tồn tại không
ls -la .env  # Linux/Mac
dir .env     # Windows

# Nếu không có, tạo mới
cp .env.example .env

# Mở .env và paste DATABASE_URL
```

---

### Lỗi 2: "Connection refused" hoặc "ECONNREFUSED"

**Nguyên nhân:** Connection string sai hoặc database chưa sẵn sàng

**Fix:**
1. Check lại connection string trong `.env`
2. Đảm bảo không có dấu cách thừa
3. Vào Render Dashboard, check database status = "Available"
4. Thử ping database:
   ```bash
   # Extract host từ connection string
   # Ví dụ: dpg-xxxxx.singapore-postgres.render.com
   ping dpg-xxxxx.singapore-postgres.render.com
   ```

---

### Lỗi 3: "password authentication failed"

**Nguyên nhân:** Password trong connection string sai

**Fix:**
1. Yêu cầu team lead gửi lại connection string
2. Copy lại từ Render Dashboard (External Database URL)
3. Paste lại vào `.env`
4. Restart backend

---

### Lỗi 4: "relation does not exist"

**Nguyên nhân:** Schema chưa được tạo

**Fix:**
```bash
# Restart backend để tự động tạo schema
npm run start:pg
```

Nếu vẫn lỗi, có thể database đã có data cũ. Yêu cầu team lead:
1. Vào Render Dashboard
2. Database → Settings → Delete Database
3. Tạo database mới
4. Share connection string mới

---

### Lỗi 5: "too many connections"

**Nguyên nhân:** Quá nhiều người connect cùng lúc (Free tier: 97 connections)

**Fix:**
1. Đóng các backend instances không dùng
2. Restart backend để giải phóng connections
3. Nếu vẫn lỗi, đợi vài phút

---

### Lỗi 6: Backend chạy nhưng không seed data

**Hiện tượng:** Backend start OK nhưng không thấy "Seeding complete"

**Nguyên nhân:** Database đã có data từ lần chạy trước

**Giải thích:** Đây KHÔNG phải lỗi! Seed script tự động skip nếu đã có data:
```
Database already seeded.
```

**Nếu muốn reset data:**
1. Yêu cầu team lead xóa và tạo lại database
2. Hoặc dùng SQL client để xóa data thủ công

---

## 📊 So sánh SQLite vs PostgreSQL

| Tính năng | SQLite (Local) | PostgreSQL (Render) |
|-----------|----------------|---------------------|
| **Setup** | ✅ Dễ (không cần config) | ⚠️ Cần DATABASE_URL |
| **Test chung** | ❌ Mỗi người 1 file | ✅ Chung 1 database |
| **Đồng bộ data** | ❌ Phải commit file | ✅ Real-time |
| **Performance** | ✅ Nhanh (local) | ⚠️ Phụ thuộc network |
| **Storage** | ✅ Không giới hạn | ⚠️ 1GB (Free tier) |
| **Production** | ❌ Không phù hợp | ✅ Sẵn sàng |

---

## 💡 Tips

### 1. Kiểm tra connection string
```bash
# In ra DATABASE_URL (ẩn password)
echo $DATABASE_URL | sed 's/:.*@/:***@/'
```

### 2. Test connection trực tiếp
```bash
# Cài psql (PostgreSQL client)
# Windows: Download từ postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt install postgresql-client

# Connect
psql "postgresql://user:pass@host/db"

# List tables
\dt

# Exit
\q
```

### 3. Monitor database trên Render
1. Vào Render Dashboard
2. Click vào database
3. Tab "Metrics" → Xem CPU, Memory, Connections

### 4. Backup data
Render Free tier không có auto backup. Nếu cần backup:
```bash
# Export data
pg_dump "postgresql://user:pass@host/db" > backup.sql

# Import data
psql "postgresql://user:pass@host/db" < backup.sql
```

---

## 🎯 Checklist

### Team Lead:
- [ ] Đăng ký Render account
- [ ] Tạo PostgreSQL database (Free tier)
- [ ] Copy External Database URL
- [ ] Share connection string cho nhóm (private)
- [ ] Hướng dẫn nhóm setup

### Thành viên:
- [ ] Pull code mới nhất
- [ ] `cd backend && npm install`
- [ ] Tạo file `.env` từ `.env.example`
- [ ] Paste DATABASE_URL vào `.env`
- [ ] `npm run start:pg`
- [ ] Test: http://localhost:5000/api/health
- [ ] `cd frontend && npm install && npm run dev`
- [ ] Test: http://localhost:5173
- [ ] Login: admin / Admin123
- [ ] Thử thêm/sửa data và check với người khác

---

## 📞 Support

Nếu gặp vấn đề:
1. Check lại từng bước trong hướng dẫn
2. Xem phần Troubleshooting
3. Hỏi team lead
4. Hỏi trong group chat

---

## 🎉 Xong!

Giờ cả nhóm đã có database chung để test! 

**Lưu ý quan trọng:**
- ⚠️ Mọi người dùng chung 1 database → Thêm/sửa/xóa data sẽ ảnh hưởng đến cả nhóm
- ⚠️ Không xóa data của người khác khi test
- ⚠️ Free tier có giới hạn 1GB storage
- ⚠️ Database tự động xóa sau 90 ngày không dùng

Happy testing! 🚀
