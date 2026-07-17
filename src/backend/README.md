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
- `AI_PROVIDER=mock`: chế độ miễn phí để phát triển/test; sinh insight cục bộ theo schema, không gọi OpenAI.
- `AI_PROVIDER=openai` và `OPENAI_API_KEY`: gọi OpenAI thật. API key không phải là một loại “free key”; việc gọi API cần tài khoản API có credit/thanh toán hợp lệ.
- `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`: giới hạn thời gian và số retry của SDK.

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

API JWT Guard xác thực token với Supabase và mọi truy vấn dữ liệu cá nhân sử dụng user-scoped client để RLS áp dụng theo `auth.uid()`.

## Nhóm API đã tạo

| Nhóm | Endpoint chính | Trạng thái |
|---|---|---|
| Auth | `GET /auth/me` | Sẵn sàng |
| Hồ sơ người dùng | `GET/PATCH /profiles/me` | Sẵn sàng |
| Hồ sơ dinh dưỡng | `POST /nutrition-profiles/calculate`, `POST /nutrition-profiles`, `GET /nutrition-profiles/current`, `GET /nutrition-profiles/versions` | Sẵn sàng, có phiên bản |
| AI sức khỏe | `POST /ai-health-insights`, `GET /ai-health-insights/latest` | Sẵn sàng với `mock` hoặc OpenAI thật; có timeout, retry SDK và chặn request trùng |
| Gói thuê bao | `GET /subscriptions/plans`, `GET /subscriptions/current` | Sẵn sàng |
| Món ăn | `GET /dishes/preview`, `GET /dishes/:id`, `GET /dishes/allergens`, `GET /dishes/:id/recipe` | Preview/chi tiết trả dinh dưỡng và dị ứng; công thức cần subscription |
| Thực đơn | `GET /meal-plans/current` | Sẵn sàng; cần subscription |
| Nhà bếp | `GET /kitchens`, `GET /kitchens/:id/offers` | Sẵn sàng, không cần subscription |
| Đơn hàng | `GET /orders/mine` | Sẵn sàng |
| Checkout/thanh toán | `POST /subscriptions/checkout`, `POST /orders`, `PATCH /orders/:id/status`, `POST /payments/manual-confirmation` | Khung API trả `501` cho tới khi chốt nhà cung cấp thanh toán và luồng idempotency |

Insight AI chỉ hỗ trợ người dùng hiểu dữ liệu, không thay thế chẩn đoán hoặc tư vấn của bác sĩ. Backend lưu phiên bản prompt/model và hash đầu vào để có thể kiểm tra, tái sử dụng kết quả và kiểm soát chi phí.

## Kiểm tra bảo mật dữ liệu cá nhân

`npm test` có kiểm tra service chỉ truy vấn profile theo id của JWT. Với local Supabase/CI có kết nối Postgres đặc quyền, chạy thêm script RLS sau để xác nhận user A không thể đọc Nutrition Profile của user B. Script dùng transaction và tự rollback.

```bash
psql "$DATABASE_URL" -f ../../supabase/tests/rls-profile-isolation.sql
```
