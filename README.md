# NutriPlan MVP — Source Code

Mã nguồn MVP của NutriPlan: web app đặt suất ăn healthy theo subscription, tự động cá nhân hóa thực đơn theo TDEE/Macro.

## Cấu trúc

```
src/
├── frontend/   # Web app phía người dùng (UI: hồ sơ dinh dưỡng, thực đơn, đặt gói)
└── backend/    # API server (tính toán TDEE/Macro, quản lý subscription, phân phối đơn)
```

**Trạng thái:** đã có web application MVP bằng Next.js tại `src/frontend`.

Thành viên tham gia phát triển MVP (chốt tại Phân công PA1): Phú, Bảo, Thành, Dũng.

## Hướng dẫn chạy

```bash
# Frontend
cd src/frontend
npm install
npm run dev

# Backend
cd src/backend
# Chưa triển khai — MVP frontend hiện dùng dữ liệu demo và localStorage.
```

Chi tiết chức năng và lệnh kiểm tra xem tại [frontend/README.md](frontend/README.md).

Quy trình đóng góp code: xem [CONTRIBUTING.md](../CONTRIBUTING.md).
