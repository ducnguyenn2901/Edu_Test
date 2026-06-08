# EduTest Pro

## Yêu cầu

- Node.js LTS
- MongoDB (local hoặc Atlas)

## Cấu hình môi trường

Frontend:

```bash
copy .env.example .env
```

`VITE_API_URL` trỏ tới backend (kèm `/api`), ví dụ:

- Local: `http://localhost:5000/api`
- Prod: `https://your-backend-domain/api`

Backend:

```bash
copy server\.env.example server\.env
```

Các biến quan trọng:

- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN` (danh sách origin, phân tách bằng dấu phẩy; local thường là `http://localhost:5173`)

## Chạy local

1. Backend

```bash
cd server
npm install
npm run dev
```

2. Frontend

```bash
cd ..
npm install
npm run dev
```
