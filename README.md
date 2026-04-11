# 🛒 Hệ thống Quản lý Tiệm Tạp Hóa

Full-stack web app: Node.js + Express + React + Vite + Tailwind CSS + SQLite (built-in Node.js)

## Yêu cầu
- **Node.js v22.5+** (v24 recommended — uses built-in `node:sqlite`)

## Cài đặt & Chạy

### Backend (port 5000)
```bash
cd backend
npm install
node --no-warnings server.js
```
Database và dữ liệu mẫu được tạo tự động khi khởi động lần đầu.

### Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```

Truy cập: **http://localhost:5173**

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
    db/             # SQLite database (node:sqlite built-in)
    routes/         # API routes
    middleware/     # JWT auth
  frontend/         # React + Vite + Tailwind
    src/
      pages/        # Login, Dashboard, HangHoa, BanHang, HoaDonBan, BaoCao, TaiKhoan
      components/   # Layout, Header
      context/      # AuthContext
      api/          # Axios instance
```
