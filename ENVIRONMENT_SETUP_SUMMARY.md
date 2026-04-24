# 📋 Tóm tắt: Cấu hình môi trường Frontend + Backend

## ✅ Đã sửa

### 1. Backend CORS Configuration
**Files:** `backend/server.js`, `backend/server-pg.js`

**Trước:**
```javascript
app.use(cors({
  origin: 'https://tester-nhom08.vercel.app',
  credentials: true
}));
```

**Sau:**
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',           // ← Thêm local development
    'https://tester-nhom08.vercel.app' // Production
  ],
  credentials: true
}));
```

**Lý do:** Cho phép frontend local (port 5173) gọi API backend (port 5000)

---

### 2. Frontend Proxy (Đã có sẵn - Không cần sửa)
**File:** `frontend/vite.config.js`

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

**Cách hoạt động:**
- Frontend gọi: `/api/auth/login`
- Vite tự động chuyển thành: `http://localhost:5000/api/auth/login`

---

### 3. Environment Variables
**File:** `backend/.env.example`

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=                           # PostgreSQL connection string
FRONTEND_URL=http://localhost:5173      # Frontend URL for CORS
```

---

## 📁 Files mới tạo

1. **SETUP_ENVIRONMENT.md** - Hướng dẫn chi tiết setup môi trường
2. **test-connection.sh** - Script test connection (Linux/Mac)
3. **test-connection.bat** - Script test connection (Windows)
4. **ENVIRONMENT_SETUP_SUMMARY.md** - File này

---

## 🚀 Cách chạy (Quick Start)

### Terminal 1 - Backend:
```bash
cd backend
npm install
npm start              # SQLite
# hoặc
npm run start:pg       # PostgreSQL
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Test:
```bash
# Linux/Mac
./test-connection.sh

# Windows
test-connection.bat
```

Hoặc mở browser: http://localhost:5173

---

## 🔧 Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser                                   │
│                http://localhost:5173                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ User opens page
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                         │
│                   Port: 5173                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  axios.get('/api/auth/login')                        │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     │ Vite Proxy                             │
│                     │ /api → http://localhost:5000/api       │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ HTTP Request
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Express)                               │
│                   Port: 5000                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CORS: Allow origin http://localhost:5173            │   │
│  │  Route: /api/auth/login                              │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database (SQLite or PostgreSQL)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Flow Request

1. **User login** trên http://localhost:5173
2. **Frontend** gọi: `axios.post('/api/auth/login', { tendn, matkhau })`
3. **Vite Proxy** chuyển thành: `http://localhost:5000/api/auth/login`
4. **Backend** nhận request:
   - Check CORS: `http://localhost:5173` ✅ Allowed
   - Process login
   - Query database
   - Return JWT token
5. **Frontend** nhận response và lưu token vào localStorage

---

## 🆘 Common Issues

### Issue 1: "Network Error"
**Nguyên nhân:** Backend chưa chạy

**Fix:**
```bash
cd backend
npm start
```

---

### Issue 2: "CORS Error"
**Nguyên nhân:** Backend không cho phép localhost:5173

**Fix:** Đã sửa trong `server.js` và `server-pg.js`:
```javascript
origin: [
  'http://localhost:5173',  // ← Phải có dòng này
  'https://tester-nhom08.vercel.app'
]
```

---

### Issue 3: "404 Not Found"
**Nguyên nhân:** Route không tồn tại hoặc proxy sai

**Fix:** Check `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // ← Đúng port backend
    changeOrigin: true,
  }
}
```

---

### Issue 4: "Proxy error"
**Nguyên nhân:** Backend chưa chạy khi frontend start

**Fix:**
1. Stop frontend (Ctrl+C)
2. Start backend trước
3. Đợi backend ready
4. Start frontend

---

## 📊 Port Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 5000 | http://localhost:5000 |
| API Endpoint | - | http://localhost:5000/api |
| Health Check | - | http://localhost:5000/api/health |

---

## 🎯 Checklist

### Backend:
- [x] CORS cho phép localhost:5173
- [x] Routes: /api/auth, /api/hanghoa, /api/hoadonban, /api/baocao, /api/taikhoan
- [x] Static files: /uploads
- [x] Health check: /api/health

### Frontend:
- [x] Vite proxy: /api → localhost:5000
- [x] Vite proxy: /uploads → localhost:5000
- [x] Axios baseURL: /api
- [x] Port: 5173

### Environment:
- [x] .env.example template
- [x] .gitignore có .env
- [x] Documentation đầy đủ

---

## 📚 Related Docs

- [SETUP_ENVIRONMENT.md](./SETUP_ENVIRONMENT.md) - Hướng dẫn chi tiết
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration PostgreSQL
- [QUICK_START_POSTGRESQL.md](./QUICK_START_POSTGRESQL.md) - Quick start PostgreSQL
- [README.md](./README.md) - Overview

---

## 🎉 Kết luận

Môi trường đã được cấu hình đúng để:
- ✅ Frontend (5173) connect được Backend (5000)
- ✅ CORS cho phép local development
- ✅ Proxy tự động chuyển /api requests
- ✅ Support cả SQLite và PostgreSQL
- ✅ Ready cho development và testing

**Next:** Chạy backend + frontend và test login!
