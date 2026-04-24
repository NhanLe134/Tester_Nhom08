# 🛒 Hệ thống Quản lý Tiệm Tạp Hóa

Full-stack web app: Node.js + Express + React + Vite + Tailwind CSS + SQLite/PostgreSQL

## Yêu cầu
- **Node.js v22.5+** (v24 recommended)
- **PostgreSQL** (nếu dùng database chung cho nhóm)

## Cài đặt & Chạy

### Backend (port 5000)

#### Option 1: SQLite (Local - Mỗi người 1 database)
```bash
cd backend
npm install
npm start
```

#### Option 2: PostgreSQL (Shared - Test chung nhóm) ⭐ Khuyến nghị
```bash
cd backend
npm install
cp .env.example .env
# Mở .env và điền DATABASE_URL từ Render
npm run start:pg
```

Database và dữ liệu mẫu được tạo tự động khi khởi động lần đầu.

📖 **Hướng dẫn:**
- [🇻🇳 Bắt đầu nhanh (Tiếng Việt)](./BAT_DAU_NHANH.md) ⭐ Đọc cái này trước!
- [🇻🇳 Hướng dẫn chi tiết Render PostgreSQL](./HUONG_DAN_RENDER_POSTGRESQL.md)
- [🇬🇧 Migration Guide (English)](./MIGRATION_GUIDE.md)
- [🇬🇧 Setup Environment (English)](./SETUP_ENVIRONMENT.md)

### Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```

Truy cập: **http://localhost:5173**

📖 **Hướng dẫn chi tiết setup môi trường:** [SETUP_ENVIRONMENT.md](./SETUP_ENVIRONMENT.md)

## Tài khoản demo
| Tên đăng nhập | Mật khẩu |
|---|---|
| admin | Admin123 |

## Tính năng
- 🔐 Đăng nhập / Quên mật khẩu (OTP demo)
- 📦 Quản lý hàng hóa (CRUD, tìm kiếm, lọc, tồn kho)
- 🛒 Bán hàng (đa hóa đơn, thanh toán, in hóa đơn)
- 🧾 Hóa đơn bán hàng (xem, hủy, ghi chú)
- 📊 Báo cáo doanh thu & hàng hóa
- 👤 Quản lý tài khoản & đổi mật khẩu

## Cấu trúc
```
taphoanga/
  backend/          # Express REST API
    db/             
      database.js       # SQLite (local)
      database-pg.js    # PostgreSQL (shared)
      seed.js           # SQLite seed
      seed-pg.js        # PostgreSQL seed
    routes/         # API routes
    middleware/     # JWT auth
    server.js       # SQLite server
    server-pg.js    # PostgreSQL server
  frontend/         # React + Vite + Tailwind
    src/
      pages/        # Login, Dashboard, HangHoa, BanHang, HoaDonBan, BaoCao, TaiKhoan
      components/   # Layout, Header
      context/      # AuthContext
      api/          # Axios instance
  MIGRATION_GUIDE.md  # Hướng dẫn chuyển sang PostgreSQL
```
