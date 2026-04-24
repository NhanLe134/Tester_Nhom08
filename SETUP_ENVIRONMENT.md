# 🔧 Hướng dẫn Setup Môi trường Frontend + Backend

## 🎯 Kiến trúc

```
Frontend (React + Vite)          Backend (Express)
Port: 5173                       Port: 5000
├─ http://localhost:5173    ──►  http://localhost:5000/api
└─ Proxy /api → :5000            └─ SQLite hoặc PostgreSQL
```

---

## ⚙️ Cấu hình hiện tại

### Frontend (Vite Proxy)
**File:** `frontend/vite.config.js`

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // Backend URL
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:5000',  // Static files
      changeOrigin: true,
    }
  }
}
```

**Cách hoạt động:**
- Frontend gọi: `axios.get('/api/auth/login')`
- Vite proxy chuyển thành: `http://localhost:5000/api/auth/login`

### Backend (CORS)
**File:** `backend/server.js` và `backend/server-pg.js`

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',           // Local development
    'https://tester-nhom08.vercel.app' // Production
  ],
  credentials: true
}));
```

**Cách hoạt động:**
- Cho phép frontend từ localhost:5173 gọi API
- Cho phép cookies/credentials

---

## 🚀 Cách chạy

### Option 1: SQLite (Local - Đơn giản nhất)

#### Terminal 1 - Backend:
```bash
cd backend
npm install
npm start
```

Kết quả:
```
Server đang chạy tại http://localhost:5000
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

Kết quả:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

#### Test:
1. Mở browser: http://localhost:5173
2. Login: `admin` / `Admin123`

---

### Option 2: PostgreSQL (Test chung nhóm)

#### Terminal 1 - Backend:
```bash
cd backend
npm install

# Tạo .env nếu chưa có
cp .env.example .env

# Mở .env và điền DATABASE_URL từ Render
# DATABASE_URL=postgresql://user:pass@host/db

npm run start:pg
```

Kết quả:
```
✅ PostgreSQL connection pool created
✅ PostgreSQL schema initialized
✅ Server đang chạy tại http://localhost:5000
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

#### Test:
1. Mở browser: http://localhost:5173
2. Login: `admin` / `Admin123`

---

## 🔍 Kiểm tra kết nối

### 1. Test Backend
```bash
curl http://localhost:5000/api/health
```

Kết quả mong đợi:
```json
{"status":"ok","time":"2026-04-24T..."}
```

### 2. Test Frontend → Backend
1. Mở browser: http://localhost:5173
2. Mở DevTools (F12) → Network tab
3. Thử login
4. Xem request đến `/api/auth/login`

---

## 🆘 Troubleshooting

### Lỗi: "Network Error" hoặc "ERR_CONNECTION_REFUSED"

**Nguyên nhân:** Backend chưa chạy hoặc chạy sai port

**Fix:**
```bash
# Check backend có chạy không
curl http://localhost:5000/api/health

# Nếu không, start backend
cd backend
npm start  # hoặc npm run start:pg
```

---

### Lỗi: "CORS policy: No 'Access-Control-Allow-Origin'"

**Nguyên nhân:** Backend không cho phép frontend gọi API

**Fix:**
1. Check CORS config trong `backend/server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',  // ← Phải có dòng này
    'https://tester-nhom08.vercel.app'
  ],
  credentials: true
}));
```

2. Restart backend:
```bash
cd backend
npm start
```

---

### Lỗi: "404 Not Found" khi gọi API

**Nguyên nhân:** Route không tồn tại hoặc proxy sai

**Fix:**
1. Check proxy trong `frontend/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // ← Phải đúng port backend
    changeOrigin: true,
  }
}
```

2. Restart frontend:
```bash
cd frontend
npm run dev
```

---

### Lỗi: "Proxy error" trong console

**Nguyên nhân:** Backend chưa chạy khi frontend đã start

**Fix:**
1. Stop frontend (Ctrl+C)
2. Start backend trước:
```bash
cd backend
npm start
```
3. Đợi backend ready
4. Start frontend:
```bash
cd frontend
npm run dev
```

---

### Frontend không load được hình ảnh từ /uploads

**Nguyên nhân:** Proxy chưa cấu hình cho /uploads

**Fix:**
Đã cấu hình sẵn trong `vite.config.js`:
```javascript
proxy: {
  '/uploads': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
}
```

Nếu vẫn lỗi, restart frontend.

---

## 🌐 Deploy Production

### Backend (Render)
1. Push code lên GitHub
2. Render → New Web Service
3. Connect GitHub repo
4. Build Command: `cd backend && npm install`
5. Start Command: `npm run start:pg`
6. Environment Variables:
   - `DATABASE_URL` = PostgreSQL connection string
   - `JWT_SECRET` = random secret key
   - `FRONTEND_URL` = https://tester-nhom08.vercel.app
   - `NODE_ENV` = production

### Frontend (Vercel)
1. Push code lên GitHub
2. Vercel → Import Project
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL` = https://your-backend.onrender.com

**Lưu ý:** Khi deploy, cần update `frontend/src/api/axios.js`:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});
```

---

## 📝 Checklist Setup

### Backend:
- [ ] `cd backend`
- [ ] `npm install`
- [ ] Tạo `.env` (nếu dùng PostgreSQL)
- [ ] `npm start` hoặc `npm run start:pg`
- [ ] Test: `curl http://localhost:5000/api/health`

### Frontend:
- [ ] `cd frontend`
- [ ] `npm install`
- [ ] `npm run dev`
- [ ] Mở http://localhost:5173
- [ ] Test login: `admin` / `Admin123`

---

## 🎉 Xong!

Giờ frontend và backend đã connect được với nhau. Happy coding! 🚀
