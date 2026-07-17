# NutriPlan MVP — Source Code

Mã nguồn MVP của NutriPlan: web app đặt suất ăn healthy theo subscription, tự động cá nhân hóa thực đơn theo TDEE/Macro.

## Cấu trúc

```
src/
├── frontend/   # Web app phía người dùng (UI: hồ sơ dinh dưỡng, thực đơn, đặt gói)
└── backend/    # API server (tính toán TDEE/Macro, quản lý subscription, phân phối đơn)
```

**Trạng thái:** đã có web application MVP bằng Next.js và khung API NestJS tại `src/backend`.

## Database

- Thiết kế và ERD: [docs/database-design.md](docs/database-design.md)
- Migration Supabase: [supabase/migrations/202607160001_initial_schema.sql](supabase/migrations/202607160001_initial_schema.sql)
- Seed dữ liệu nền: [supabase/seed.sql](supabase/seed.sql)

Thành viên tham gia phát triển MVP (chốt tại Phân công PA1): Phú, Bảo, Thành, Dũng.

## Hướng dẫn chạy

```bash
# Frontend
cd src/frontend
npm install
npm run dev

# Backend
cd src/backend
cp .env.example .env
npm install
npm run start:dev
```

Chi tiết chức năng và lệnh kiểm tra xem tại [frontend/README.md](src/frontend/README.md) và [backend/README.md](src/backend/README.md).

Quy trình đóng góp code: xem [CONTRIBUTING.md](../CONTRIBUTING.md).
