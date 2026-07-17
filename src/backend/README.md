# NutriPlan Backend

NestJS API cho MVP NutriPlan, dùng Supabase Auth và PostgreSQL, đồng thời gọi OpenAI để tạo insight sức khỏe từ dữ liệu người dùng.

## Chuẩn bị môi trường

```bash
cp .env.example .env
npm install
```

Điền các biến sau trong `.env`:

- `SUPABASE_URL`: URL project Supabase.
- `SUPABASE_PUBLISHABLE_KEY`: khóa public dùng để xác thực JWT và truy vấn theo RLS.
- `SUPABASE_SECRET_KEY`: khóa server, chỉ dùng ở backend cho AI insight và tác vụ đặc quyền; không đưa vào frontend hay Git.
- `OPENAI_API_KEY`: khóa gọi OpenAI API.

## Chạy và kiểm tra

```bash
npm run start:dev
npm run lint
npm test
npm run build
```

- API prefix: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/docs`
- Health check: `GET http://localhost:4000/api/v1/health`

Các API bảo vệ yêu cầu header `Authorization: Bearer <supabase_access_token>`.

## Nhóm API đã tạo

| Nhóm | Endpoint chính | Trạng thái |
|---|---|---|
| Auth | `GET /auth/me` | Sẵn sàng |
| Hồ sơ dinh dưỡng | `POST /nutrition-profiles/calculate`, `POST /nutrition-profiles`, `GET /nutrition-profiles/current` | Sẵn sàng |
| AI sức khỏe | `POST /ai-health-insights`, `GET /ai-health-insights/latest` | Sẵn sàng khi có khóa server và OpenAI |
| Gói thuê bao | `GET /subscriptions/plans`, `GET /subscriptions/current` | Sẵn sàng |
| Món ăn | `GET /dishes/preview`, `GET /dishes/:id/recipe` | Sẵn sàng; công thức cần subscription |
| Thực đơn | `GET /meal-plans/current` | Sẵn sàng; cần subscription |
| Nhà bếp | `GET /kitchens`, `GET /kitchens/:id/offers` | Sẵn sàng, không cần subscription |
| Đơn hàng | `GET /orders/mine` | Sẵn sàng |
| Checkout/thanh toán | `POST /subscriptions/checkout`, `POST /orders`, `PATCH /orders/:id/status`, `POST /payments/manual-confirmation` | Khung API trả `501` cho tới khi chốt nhà cung cấp thanh toán và luồng idempotency |

Insight AI chỉ hỗ trợ người dùng hiểu dữ liệu, không thay thế chẩn đoán hoặc tư vấn của bác sĩ. Backend lưu phiên bản prompt/model và hash đầu vào để có thể kiểm tra, tái sử dụng kết quả và kiểm soát chi phí.
