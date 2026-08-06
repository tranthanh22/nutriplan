# NutriPlan Backend

NestJS API cho MVP NutriPlan, dùng Supabase Auth và PostgreSQL, đồng thời gọi Gemini để tạo insight sức khỏe từ dữ liệu người dùng.

## Chuẩn bị môi trường

```bash
cp .env.example .env
npm install
```

Điền các biến sau trong `.env`:

- `SUPABASE_URL`: URL project Supabase.
- `SUPABASE_PUBLISHABLE_KEY`: khóa public dùng để xác thực JWT và truy vấn theo RLS.
- `SUPABASE_SECRET_KEY`: khóa server, chỉ dùng ở backend cho AI insight và tác vụ đặc quyền; không đưa vào frontend hay Git.
- `AI_PROVIDER=mock`: sinh insight cục bộ theo schema, không gọi dịch vụ AI.
- `AI_PROVIDER=gemini` và `GEMINI_API_KEY`: gọi Gemini để tạo AI Insight và phản hồi trợ lý ảo.
- `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`: model và giới hạn thời gian phản hồi của Gemini.
- `FRONTEND_URL`: URL frontend dùng làm trang quay lại sau checkout.
- `STRIPE_SECRET_KEY`: secret key Stripe, chỉ đặt ở backend.
- `STRIPE_WEBHOOK_SECRET`: chữ ký webhook Stripe, chỉ đặt ở backend.

Để test thanh toán local, chạy Stripe CLI và chuyển tiếp webhook:

```bash
stripe listen --forward-to localhost:4000/api/v1/subscriptions/webhooks/stripe
```

Sao chép `whsec_...` Stripe CLI trả về vào `STRIPE_WEBHOOK_SECRET`, dùng `sk_test_...` cho `STRIPE_SECRET_KEY`, rồi thanh toán bằng thẻ test `4242 4242 4242 4242`.

Checkout subscription dùng chế độ tự động gia hạn. Trên Stripe Dashboard, webhook production cần đăng ký các event: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated` và `customer.subscription.deleted`.

Hướng dẫn đầy đủ: [`docs/stripe-test-mode.md`](../../docs/stripe-test-mode.md).

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
| AI sức khỏe | `POST /ai-health-insights`, `GET /ai-health-insights/latest` | Sẵn sàng với `mock` hoặc Gemini; có structured output, timeout và chặn request trùng |
| Trợ lý ảo | `POST /assistant/messages`, `GET /assistant/conversations` | Sẵn sàng với Gemini và lưu lịch sử hội thoại |
| Gói thuê bao | `GET /subscriptions/plans`, `GET /subscriptions/current`, `POST /subscriptions/checkout`, `POST /subscriptions/cancel`, `POST /subscriptions/resume`, `POST /subscriptions/webhooks/stripe` | Stripe recurring Checkout, tự động gia hạn, tắt/bật lại gia hạn và đồng bộ webhook |
| Món ăn | `GET /dishes/preview`, `GET /dishes/:id`, `GET /dishes/allergens`, `GET /dishes/:id/recipe` | Preview/chi tiết trả dinh dưỡng và dị ứng; công thức cần subscription |
| Thực đơn | `GET /meal-plans/current` | Sẵn sàng; cần subscription |
| Nhà bếp | `GET /kitchens`, `GET /kitchens/:id/offers` | Sẵn sàng, không cần subscription |
| Đơn hàng | `GET /orders/mine` | Sẵn sàng |
| Checkout/thanh toán | Subscription qua Stripe; đơn bếp và xác nhận thủ công | Subscription sẵn sàng; thanh toán đơn bếp vẫn là khung MVP |

Insight AI chỉ hỗ trợ người dùng hiểu dữ liệu, không thay thế chẩn đoán hoặc tư vấn của bác sĩ. Backend lưu phiên bản prompt/model và hash đầu vào để có thể kiểm tra, tái sử dụng kết quả và kiểm soát chi phí.

## Kiểm tra bảo mật dữ liệu cá nhân

`npm test` có kiểm tra service chỉ truy vấn profile theo id của JWT. Với local Supabase/CI có kết nối Postgres đặc quyền, chạy thêm script RLS sau để xác nhận user A không thể đọc Nutrition Profile của user B. Script dùng transaction và tự rollback.

```bash
psql "$DATABASE_URL" -f ../../supabase/tests/rls-profile-isolation.sql
```
