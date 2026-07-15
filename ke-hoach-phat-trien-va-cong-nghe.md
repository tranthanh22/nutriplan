# Kế hoạch phát triển và lựa chọn công nghệ — NutriPlan MVP

## 1. Mục tiêu tài liệu

Tài liệu này xác định kiến trúc, công nghệ, cấu trúc mã nguồn và lộ trình phát triển NutriPlan dựa trên phạm vi MVP hiện tại. Stack chính được lựa chọn là:

- **Next.js** cho giao diện web.
- **NestJS** cho REST API, nghiệp vụ và tích hợp hệ thống bên ngoài.
- **TypeScript** cho toàn bộ mã nguồn ứng dụng.
- **Supabase PostgreSQL** làm cơ sở dữ liệu.
- **Supabase Auth** quản lý người dùng và phiên đăng nhập.
- **Supabase Storage** lưu ảnh món ăn.

Mục tiêu của giai đoạn MVP là phát hành nhanh cho 10–20 người dùng và 1–2 bếp đối tác, đồng thời vẫn bảo đảm dữ liệu cá nhân, đơn hàng và quyền subscription được kiểm soát đúng.

## 2. Quyết định kiến trúc

### 2.1 Kiến trúc được chọn

NutriPlan sử dụng kiến trúc **frontend–backend tách biệt**, trong đó Next.js là web client và NestJS là backend API dạng modular monolith.

```text
Trình duyệt
    │
    ├── đăng nhập ───────────────► Supabase Auth
    │                                  │
    │                                  └── access token (JWT)
    ▼
Next.js App Router
    ├── Server Components: đọc dữ liệu và dựng trang
    ├── Client Components: form, modal và tương tác UI
    └── API client: Authorization: Bearer <JWT>
            │
            ▼
NestJS REST API (/api/v1)
    ├── Guards: xác thực JWT và role
    ├── Controllers: nhận request/response
    ├── Services: business logic
    ├── DTO + ValidationPipe: kiểm tra dữ liệu đầu vào
    └── Modules: auth, nutrition, meals, subscriptions, kitchens,
                 orders, meal-logs, payments và image-analysis
            │
            ▼
Supabase
    ├── PostgreSQL + Row Level Security
    └── Storage
```

Next.js App Router phụ trách render và trải nghiệm web. NestJS tổ chức backend theo feature module; controller nhận HTTP request còn provider/service đóng gói nghiệp vụ. [Next.js App Router](https://nextjs.org/docs/app), [NestJS Modules](https://docs.nestjs.com/modules), [NestJS Controllers](https://docs.nestjs.com/controllers).

### 2.2 Vì sao dùng backend NestJS riêng

NestJS phù hợp với NutriPlan vì sản phẩm có nhiều luồng nghiệp vụ liên quan đến quyền truy cập và tích hợp bên ngoài:

- Subscription và webhook thanh toán cần xử lý idempotent.
- Kitchen Order có state machine, snapshot giá và phân quyền theo bếp.
- Meal Log có thể được tạo từ thực đơn, đơn bếp hoặc kết quả phân tích ảnh.
- API có thể tái sử dụng cho mobile app và cổng quản trị trong tương lai.
- Module, dependency injection, guard, interceptor và validation giúp ranh giới nghiệp vụ rõ ràng.

Đổi lại, nhóm phải vận hành hai ứng dụng và cấu hình CORS, authentication, logging, deployment riêng. Trong MVP, NestJS vẫn được giữ dưới dạng **một modular monolith**, chưa tách microservice.

### 2.3 Nguyên tắc tổ chức

- Hai ứng dụng trong cùng repository: `src/frontend` và `src/backend`.
- Không viết business logic trong page, component hoặc Next.js Route Handler.
- UI gọi NestJS API; business rule nằm trong NestJS service theo từng module.
- REST API dùng prefix `/api/v1` để có thể version hóa về sau.
- Mọi thay đổi database được lưu bằng SQL migration.
- Authorization được kiểm tra ở NestJS Guard và PostgreSQL RLS.
- Truy vấn theo người dùng phải chuyển JWT vào Supabase client để RLS nhận đúng danh tính.
- Không dùng `service_role` trong trình duyệt.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | Next.js App Router | UI, SSR, Server Components và routing |
| Backend | NestJS | REST API, business logic, webhook và tích hợp ngoài |
| Ngôn ngữ | TypeScript strict mode | Type safety cho frontend, backend và database |
| UI | React, CSS Modules hoặc Tailwind CSS | Xây dựng giao diện responsive |
| Icons | Lucide React | Bộ icon thống nhất |
| Auth | Supabase Auth + `@supabase/ssr` | Đăng nhập phía Next.js và phát JWT cho NestJS API |
| API contract | REST `/api/v1` + Swagger/OpenAPI | Tài liệu và kiểm thử API |
| Backend validation | `class-validator` + `class-transformer` | Validate DTO bằng NestJS ValidationPipe |
| Backend config | `@nestjs/config` | Kiểm tra và quản lý biến môi trường |
| Database | Supabase PostgreSQL | Dữ liệu người dùng, món, kế hoạch, subscription và đơn |
| Database client | `@supabase/supabase-js` | Query type-safe và gọi RPC |
| Authorization | PostgreSQL Row Level Security | Hạn chế dữ liệu theo user, kitchen và admin |
| File storage | Supabase Storage | Ảnh món, ảnh đánh giá và ảnh Meal Scan |
| Schema management | Supabase CLI + SQL migrations | Version hóa database và RLS trong Git |
| Frontend validation | Zod | Kiểm tra form trước khi gọi API |
| Form | React Hook Form + Zod resolver | Quản lý form phức tạp |
| Backend test | Jest + Supertest | Unit test service và integration test API NestJS |
| Frontend test | Vitest | Test component và logic giao diện |
| UI/E2E test | Playwright | Test luồng đăng ký, subscription và đặt món |
| Code quality | ESLint + Prettier | Chuẩn hóa và kiểm tra mã nguồn |
| Deployment | Vercel + Render/Railway/Fly.io + Supabase Cloud | Deploy Next.js, NestJS và dịch vụ dữ liệu |

Supabase cung cấp PostgreSQL đầy đủ cùng Auth, Storage và các khả năng mở rộng khác. [Supabase Database](https://supabase.com/docs/guides/database/overview).

Supabase khuyến nghị `@supabase/ssr` cho Next.js server-side authentication, sử dụng cookie để session có thể dùng ở cả client và server. Package này vẫn được ghi nhận là beta, vì vậy cần khóa phiên bản và kiểm tra migration note trước khi nâng cấp. [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side), [Supabase Next.js guide](https://supabase.com/nextjs).

NestJS cung cấp `ValidationPipe` để validate DTO và hỗ trợ guard toàn cục cho các endpoint cần xác thực. [NestJS Validation](https://docs.nestjs.com/techniques/validation), [NestJS Authentication](https://docs.nestjs.com/security/authentication).

## 4. Cấu trúc thư mục đề xuất

Giữ `src/frontend` làm ứng dụng Next.js và khởi tạo NestJS trong `src/backend`.

```text
nutriplan/
├── src/
│   ├── frontend/
│       ├── app/
│       │   ├── (public)/
│       │   │   ├── login/
│       │   │   └── kitchens/
│       │   ├── (customer)/
│       │   │   ├── dashboard/
│       │   │   ├── nutrition-profile/
│       │   │   ├── meal-plan/
│       │   │   ├── meal-log/
│       │   │   ├── subscription/
│       │   │   └── orders/
│       │   ├── (kitchen)/
│       │   │   └── kitchen-dashboard/
│       │   ├── (admin)/
│       │   │   └── admin/
│       │   ├── auth/callback/route.ts
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── ui/
│       │   └── shared/
│       ├── features/
│       │   ├── nutrition/
│       │   ├── meal-plans/
│       │   ├── subscriptions/
│       │   ├── kitchens/
│       │   ├── orders/
│       │   ├── meal-logs/
│       │   └── image-analysis/
│       ├── lib/
│       │   ├── supabase/
│       │   │   ├── client.ts
│       │   │   ├── server.ts
│       │   │   └── middleware.ts
│       │   ├── api/
│       │   │   ├── client.ts
│       │   │   └── endpoints.ts
│       │   ├── auth/
│       │   ├── validation/
│       │   └── utils/
│       ├── types/
│       │   └── api.types.ts
│       └── tests/
│   └── backend/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   ├── config/
│       │   ├── database/
│       │   │   ├── supabase.module.ts
│       │   │   ├── supabase-user.service.ts
│       │   │   └── supabase-admin.service.ts
│       │   └── modules/
│       │       ├── auth/
│       │       ├── users/
│       │       ├── nutrition/
│       │       ├── meals/
│       │       ├── meal-plans/
│       │       ├── subscriptions/
│       │       ├── kitchens/
│       │       ├── orders/
│       │       ├── meal-logs/
│       │       ├── payments/
│       │       └── image-analysis/
│       ├── test/
│       ├── nest-cli.json
│       ├── package.json
│       └── tsconfig.json
├── supabase/
│   ├── migrations/
│   ├── tests/
│   ├── seed.sql
│   └── config.toml
├── .env.example
└── ke-hoach-phat-trien-va-cong-nghe.md
```

## 5. Thiết kế database tối thiểu

### 5.1 Nhóm người dùng và phân quyền

| Table | Mục đích |
|---|---|
| `profiles` | Thông tin cơ bản và role của tài khoản |
| `nutrition_profiles` | Chỉ số cơ thể, mục tiêu, BMR/TDEE/Macro và dị ứng |
| `kitchens` | Thông tin bếp, trạng thái duyệt và vùng phục vụ |
| `kitchen_members` | Liên kết user với bếp và vai trò tại bếp |

Role MVP:

- `customer`: xem kế hoạch và đặt món.
- `kitchen_staff`: xem/cập nhật đơn thuộc bếp của mình.
- `admin`: quản lý danh mục và xử lý sự cố.

Role có quyền cao không được lấy từ `user_metadata` do người dùng có thể tự cập nhật. Phân quyền nên lưu trong database hoặc `app_metadata` do server kiểm soát.

### 5.2 Nhóm thực đơn

| Table | Mục đích |
|---|---|
| `dishes` | Tên món, hình ảnh, trạng thái và loại món |
| `dish_nutrition` | Khẩu phần, Calorie, Protein, Carb và Fat |
| `ingredients` | Danh mục nguyên liệu |
| `dish_ingredients` | Định lượng nguyên liệu của từng món |
| `allergens` | Danh mục chất gây dị ứng |
| `dish_allergens` | Liên kết món với allergen |
| `recipes` | Cách làm chi tiết; chỉ subscriber được đọc |
| `meal_plans` | Kế hoạch 7 ngày của người dùng |
| `meal_plan_items` | Món theo ngày và bữa trong kế hoạch |

### 5.3 Nhóm subscription

| Table | Mục đích |
|---|---|
| `subscription_plans` | Giá, chu kỳ và quyền lợi gói NutriPlan |
| `subscriptions` | Trạng thái subscription của user |
| `payments` | Giao dịch subscription hoặc Kitchen Order |
| `payment_events` | Lưu webhook để xử lý idempotent |

Các trạng thái subscription:

```text
inactive → pending_payment → active
active → cancel_at_period_end → expired
pending_payment → payment_failed
```

### 5.4 Nhóm bếp và đơn hàng

| Table | Mục đích |
|---|---|
| `kitchen_offers` | Món lẻ hoặc gói 5 ngày do bếp bán |
| `kitchen_offer_items` | Các món/ngày thuộc một gói |
| `kitchen_orders` | Giao dịch mua món hoặc gói bếp |
| `daily_orders` | Đơn giao theo từng ngày/bữa |
| `order_status_history` | Audit lịch sử chuyển trạng thái |
| `reviews` | Đánh giá đơn đã giao |

Kitchen Order và NutriPlan Subscription phải là hai đối tượng độc lập. Người không có subscription vẫn tạo được Kitchen Order.

### 5.5 Nhóm Meal Log và ảnh

| Table | Mục đích |
|---|---|
| `meal_log_entries` | Món thực tế người dùng đã ăn |
| `meal_images` | Metadata ảnh và trạng thái phân tích |
| `image_analysis_results` | Món nhận diện, độ tin cậy và dinh dưỡng ước tính |
| `progress_entries` | Cân nặng và chỉ số cập nhật định kỳ |

`meal_log_entries.source` sử dụng enum:

```text
recipe | kitchen | image_estimate | manual
```

## 6. Row Level Security và bảo mật

Supabase yêu cầu bật RLS cho các table nằm trong schema được expose. RLS kết hợp với Supabase Auth để áp dụng quyền ở mức từng row. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 6.1 Chính sách tối thiểu

| Dữ liệu | Quyền truy cập |
|---|---|
| Nutrition Profile | User chỉ đọc/ghi hồ sơ của chính mình |
| Meal Plan | User chỉ đọc kế hoạch của mình; Recipe chi tiết kiểm tra subscription active |
| Meal Log | User chỉ đọc/ghi nhật ký của mình |
| Kitchen Offer | Public đọc offer đang active; chỉ thành viên bếp được sửa offer của bếp |
| Kitchen Order | Customer đọc đơn của mình; kitchen staff đọc đơn thuộc bếp |
| Daily Order | Customer đọc; kitchen staff được cập nhật theo state transition hợp lệ |
| Payment | User chỉ xem giao dịch của mình; chỉ server/webhook được cập nhật trạng thái |
| Meal Image | Chỉ owner và server xử lý ảnh được truy cập |

### 6.2 Quy tắc bảo mật bắt buộc

1. Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào biến `NEXT_PUBLIC_*`.
2. Service-role client chỉ được khởi tạo trong server-only module.
3. Không tin dữ liệu role hoặc giá tiền gửi từ client.
4. Giá Kitchen Order được lấy lại từ database tại server trước khi thanh toán.
5. Webhook phải kiểm tra chữ ký và lưu event ID duy nhất.
6. Mọi callback thanh toán phải idempotent.
7. Không dùng ảnh Meal Scan để kết luận an toàn dị ứng.
8. Log không được chứa token, mật khẩu, ảnh riêng tư hoặc dữ liệu sức khỏe đầy đủ.

## 7. Supabase Storage

Supabase Storage hỗ trợ access control chi tiết thông qua RLS. [Supabase Storage](https://supabase.com/docs/guides/storage), [Storage ownership](https://supabase.com/docs/guides/storage/security/ownership).

Các bucket đề xuất:

| Bucket | Loại | Nội dung |
|---|---|---|
| `dish-images` | Public | Ảnh món đã được admin/bếp duyệt |
| `review-images` | Private | Ảnh đánh giá, chỉ user/bếp/admin liên quan được xem |
| `meal-scan-images` | Private | Ảnh món ăn dùng cho phân tích |

Quy tắc file Meal Scan:

- Path: `{user_id}/{year}/{month}/{uuid}.jpg`.
- Giới hạn MIME: JPEG, PNG, WebP.
- Giới hạn dung lượng MVP: 5 MB.
- Chỉ owner được upload/xóa.
- Truy cập bằng signed URL ngắn hạn.
- Có lịch xóa ảnh theo chính sách lưu trữ đã công bố.

## 8. Phân chia trách nhiệm giữa Next.js, NestJS và PostgreSQL

### Next.js frontend phụ trách

- Render trang, SEO, loading/error state và tương tác giao diện.
- Đăng nhập qua Supabase Auth và quản lý session cookie.
- Gửi access token trong header `Authorization: Bearer <JWT>` khi gọi NestJS.
- Validate form để phản hồi sớm cho người dùng; backend vẫn phải validate lại.
- `auth/callback` có thể giữ ở Next.js để hoàn tất OAuth/PKCE.

### NestJS backend phụ trách

- Controller REST tại `/api/v1` cho Nutrition Profile, Meal Plan, Subscription, Kitchen Order và Meal Log.
- Guard xác minh chữ ký, issuer, audience và thời hạn Supabase JWT; sau đó kiểm tra role.
- DTO + global `ValidationPipe` với `whitelist`, `forbidNonWhitelisted` và `transform`.
- Service thực thi business rule, transaction/RPC và audit log.
- Webhook thanh toán, adapter phân tích ảnh và tích hợp hệ thống ngoài.
- Swagger/OpenAPI tại môi trường development/staging.
- Global exception filter trả lỗi theo một định dạng thống nhất.

NestJS bật CORS theo allowlist, chỉ cho phép origin frontend đã cấu hình. Production không dùng wildcard `*` khi gửi credential.

### Chiến lược truy cập Supabase từ NestJS

- `SupabaseUserService`: tạo client theo request bằng publishable key và JWT người dùng. Các truy vấn này chịu RLS.
- `SupabaseAdminService`: dùng secret/service-role key cho webhook, job hệ thống và tác vụ quản trị được cho phép rõ ràng.
- Không dùng admin client cho request thông thường vì service role có thể bỏ qua RLS.
- Controller không query database trực tiếp; chỉ service/repository được truy cập Supabase.
- NestJS kiểm tra quyền nghiệp vụ, nhưng RLS vẫn là lớp bảo vệ cuối cùng.

Supabase Auth phát access token dạng JWT. NestJS phải xác minh token theo signing keys/JWKS của project và không chỉ decode payload. [Supabase JWT](https://supabase.com/docs/guides/auth/jwts).

### Sử dụng PostgreSQL function/RPC cho

- Tạo Kitchen Order cùng snapshot giá trong một transaction.
- Chuyển trạng thái đơn có kiểm tra state machine.
- Xác nhận payment và kích hoạt subscription idempotent.
- Khi Daily Order chuyển `delivered`, tạo đúng một Meal Log Entry nếu subscription active.

## 9. Quản lý database và type

Không chỉnh schema production thủ công mà không có migration.

Workflow:

```bash
npx supabase init
npx supabase start
npx supabase migration new create_core_schema
npx supabase db reset
npx supabase db lint
npx supabase test db
npx supabase db push
```

Supabase khuyến nghị phát triển local bằng CLI, lưu migration trong Git và dùng `seed.sql` để tạo dữ liệu kiểm thử lặp lại. [Supabase local development](https://supabase.com/docs/guides/local-development/overview), [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations).

Sau mỗi thay đổi schema, sinh lại TypeScript type:

```bash
npx supabase gen types typescript --local \
  > src/backend/src/database/database.types.ts
```

Backend là nơi truy cập dữ liệu chính nên generated type được đặt tại NestJS. Nếu frontend cần type response, sinh API client/type từ OpenAPI hoặc đặt DTO thuần trong một package `shared-contracts`; không import entity nội bộ của backend. `supabase-js` hỗ trợ type inference và quan hệ giữa các table từ type được generate. [Supabase TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support).

## 10. Biến môi trường

File `.env.example` cần có:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PAYMENT_WEBHOOK_SECRET=
IMAGE_ANALYSIS_API_KEY=
```

Quy tắc:

- Chỉ biến frontend an toàn mới dùng prefix `NEXT_PUBLIC_`.
- Service role, webhook secret và API key chỉ tồn tại trong môi trường NestJS.
- Backend kiểm tra toàn bộ biến môi trường khi khởi động bằng `@nestjs/config` và schema validation.
- Không commit `.env.local`.
- Frontend và backend có file `.env.example` riêng.
- Development, staging và production dùng Supabase project hoặc branch riêng nếu ngân sách cho phép.

## 11. Kế hoạch phát triển

### Phase 0 — Chuẩn hóa nền tảng

**Thời gian:** 2–3 ngày.

**Công việc:**

- Nâng Next.js lên phiên bản stable đã vá các cảnh báo bảo mật hiện tại.
- Khởi tạo NestJS trong `src/backend`, bật TypeScript strict mode cho cả hai ứng dụng.
- Cài Supabase CLI, `@supabase/supabase-js`, `@supabase/ssr`, `@nestjs/config`, validation và test tools.
- Thiết lập prefix `/api/v1`, CORS allowlist, global ValidationPipe, exception filter và Swagger.
- Khởi tạo Supabase local và `.env.example`.
- Tách component frontend thành route/feature và backend thành domain module.

**Hoàn thành khi:** frontend và backend build/lint sạch; `GET /api/v1/health` hoạt động; Supabase local chạy; CI kiểm tra được cả hai ứng dụng.

### Phase 1 — Auth và hồ sơ dinh dưỡng

**Thời gian:** 3–4 ngày.

**Công việc:**

- Đăng ký, đăng nhập, đăng xuất và refresh session.
- Tạo Supabase JWT Guard trong NestJS và bảo vệ API mặc định; chỉ đánh dấu public cho endpoint cần thiết.
- Tạo `profiles`, `nutrition_profiles` và RLS.
- Chuyển BMR/TDEE/Macro từ localStorage sang NestJS service.
- Viết unit test cho công thức và input biên.

**Hoàn thành khi:** user chỉ đọc/sửa được hồ sơ của mình; tính toán có test và lưu phiên bản.

### Phase 2 — Danh mục món và Meal Plan

**Thời gian:** 4–5 ngày.

**Công việc:**

- Tạo schema món, nutrition, allergen và Recipe.
- Seed 20–30 món.
- Sinh Meal Plan 7 ngày bằng rule-based algorithm.
- Preview miễn phí và kiểm tra subscription trước khi đọc Recipe.

**Hoàn thành khi:** allergen bị loại tuyệt đối; API/server không làm lộ Recipe cho user miễn phí.

### Phase 3 — NutriPlan Subscription

**Thời gian:** 3–4 ngày.

**Công việc:**

- Schema plan, subscription, payment và payment event.
- Checkout pilot hoặc sandbox.
- Webhook idempotent.
- Paywall và quyền truy cập dựa trên subscription `active`.
- Hủy gia hạn nhưng giữ quyền đến hết kỳ.

**Hoàn thành khi:** subscription và Kitchen Order không ảnh hưởng trạng thái của nhau.

### Phase 4 — Bếp và Kitchen Order

**Thời gian:** 5–7 ngày.

**Công việc:**

- Schema kitchen, offer, order và Daily Order.
- Marketplace một bếp, món lẻ và gói 5 ngày.
- Checkout không yêu cầu subscription.
- Dashboard bếp tối giản.
- State machine và audit lịch sử trạng thái.

**Hoàn thành khi:** customer tạo đơn; bếp chỉ xem đơn của mình; luồng đến `delivered` chạy end-to-end.

### Phase 5 — Meal Log và báo cáo

**Thời gian:** 3–4 ngày.

**Công việc:**

- Ghi món từ Recipe, manual và Kitchen Order.
- Tạo Meal Log đúng một lần khi đơn subscriber được giao.
- Tổng hợp Calorie/Macro theo ngày.
- Cập nhật cân nặng theo tuần.

**Hoàn thành khi:** mỗi entry ghi rõ nguồn; retry webhook/trạng thái không tạo dữ liệu trùng.

### Phase 6 — Meal Scan Beta

**Thời gian:** 4–6 ngày, thực hiện sau khi Must Have ổn định.

**Công việc:**

- Private Storage bucket và upload policy.
- Upload ảnh, gọi adapter phân tích và lưu kết quả ước tính.
- Hiển thị confidence, cho sửa và bắt buộc xác nhận.
- Xóa ảnh theo yêu cầu và chính sách retention.

**Hoàn thành khi:** ảnh chưa xác nhận không vào Meal Log; lỗi dịch vụ chuyển sang nhập tay.

### Phase 7 — Pilot và ổn định

**Thời gian:** 1 tuần chuẩn bị, sau đó theo dõi 2–4 tuần.

**Công việc:**

- Seed dữ liệu thật đã được duyệt.
- E2E test các luồng quan trọng.
- Logging sự kiện H1–H6.
- Backup, error monitoring và quy trình xử lý sự cố.
- Pilot với 10–20 user và 1–2 bếp.

## 12. Thứ tự ưu tiên backlog

### Must Have

1. Auth và RLS.
2. Nutrition Profile và BMR/TDEE/Macro.
3. Preview, Recipe và Meal Plan.
4. Subscription pilot.
5. Kitchen marketplace và Kitchen Order.
6. Dashboard bếp và Daily Order.
7. Meal Log và báo cáo cơ bản.

### Should Have

1. Đổi món tương đương.
2. Đánh giá đơn bếp.
3. Cập nhật cân nặng.
4. Meal Scan Beta.

### Chưa làm trong MVP

- Microservices.
- GraphQL.
- Redis/BullMQ.
- Marketplace nhiều bếp với tự động phân bổ.
- Gói tháng và hoàn tiền phức tạp.
- AI tự tạo thực đơn hoặc tư vấn bệnh lý.
- Nhận diện chính xác khối lượng thức ăn từ một ảnh.

## 13. Chiến lược kiểm thử

### Unit test

- Công thức BMR/TDEE/Macro.
- Lọc allergen.
- Xếp hạng món theo Macro.
- State transition subscription và order.
- Tính tổng Meal Log.

### Database test

- RLS customer không đọc được dữ liệu user khác.
- Kitchen staff không đọc được đơn bếp khác.
- User miễn phí không đọc được Recipe chi tiết.
- Customer không thể tự sửa `paid`, `active` hoặc giá đơn.
- Webhook/event lặp không tạo Subscription, Daily Order hoặc Meal Log trùng.

### E2E test

1. Đăng ký → tạo hồ sơ → xem preview.
2. Đăng ký subscription → mở Recipe → lưu kế hoạch.
3. User miễn phí → mua món bếp → theo dõi đơn.
4. Subscriber → đơn delivered → Meal Log tự cập nhật.
5. Kitchen staff → nhận đơn → cập nhật trạng thái.
6. Upload ảnh → sửa kết quả → xác nhận Meal Log.

## 14. CI/CD và môi trường

Pipeline cho Pull Request:

```text
frontend: npm ci → lint → typecheck → test → build
backend: npm ci → lint → typecheck → unit/integration test → build
→ supabase db lint
→ supabase test db
→ Playwright smoke test
```

Môi trường:

- `local`: Supabase CLI + Docker.
- `staging`: Vercel cho Next.js, một NestJS service riêng và Supabase staging.
- `production`: chỉ deploy từ branch được bảo vệ.

NestJS phải có health check, structured logging và graceful shutdown. Frontend và backend được deploy độc lập nhưng chỉ phát hành production sau khi database migration hoàn tất.

Database migration phải được review như code. Không dùng Dashboard để thay đổi production rồi bỏ qua migration.

## 15. Rủi ro kỹ thuật

| Rủi ro | Mức độ | Cách giảm thiểu |
|---|---|---|
| RLS sai làm lộ dữ liệu sức khỏe | Rất cao | Database test cho từng role và từng table |
| Service-role key bị đưa ra client | Rất cao | Server-only module, kiểm tra secret trong CI |
| Allergen sai hoặc thiếu | Rất cao | Dữ liệu duyệt thủ công và test loại trừ tuyệt đối |
| Payment callback tạo dữ liệu trùng | Cao | Unique event ID, transaction và idempotency |
| Bếp tự sửa giá/đơn không hợp lệ | Cao | Snapshot giá server-side và state machine RPC |
| Ảnh món ăn bị truy cập công khai | Cao | Private bucket, owner RLS và signed URL |
| Phân tích ảnh không chính xác | Cao | Gắn nhãn ước tính, confidence và user confirmation |
| Next.js/Supabase SSR thay đổi API | Trung bình | Khóa version, Dependabot và kiểm tra migration note |
| CORS hoặc JWT Guard cấu hình sai | Cao | Allowlist origin, bảo vệ mặc định và integration test 401/403 |
| NestJS dùng service role cho mọi request | Rất cao | Tách user client/admin client và test RLS bắt buộc |
| Frontend/backend lệch API contract | Trung bình | Swagger/OpenAPI và kiểm tra contract trong CI |
| MVP quá lớn | Cao | Meal Scan là Should Have; pilot chỉ một bếp |

## 16. Definition of Done

Một tính năng chỉ được coi là hoàn thành khi:

- Có acceptance criteria rõ ràng.
- TypeScript không lỗi và không dùng `any` tùy tiện.
- Input được validate ở server.
- Endpoint và DTO đã cập nhật trong Swagger/OpenAPI.
- Có RLS/database policy tương ứng.
- Có unit/database/E2E test phù hợp với mức rủi ro.
- Loading, empty và error state đã được xử lý.
- Không làm lộ secret hoặc dữ liệu user khác.
- Migration và generated database type đã cập nhật.
- `lint`, `typecheck`, test và production build của cả frontend/backend đều đạt.
- Có demo hoặc bằng chứng chạy end-to-end.

## 17. Kết luận

Stack phù hợp nhất cho NutriPlan MVP là:

> **Next.js App Router + NestJS + TypeScript + Supabase Auth/PostgreSQL/Storage**.

Next.js tập trung vào giao diện và trải nghiệm web; NestJS là REST API modular monolith quản lý nghiệp vụ, webhook và tích hợp. Supabase cung cấp Auth, PostgreSQL và Storage. Kiến trúc này tốn thêm công vận hành so với một ứng dụng duy nhất nhưng tạo ranh giới backend rõ ràng, thuận lợi cho mobile app và mở rộng đội ngũ. Điều kiện quan trọng là giữ RLS khi backend truy vấn bằng JWT người dùng, giới hạn service role, đồng thời thiết kế đúng transaction, idempotency và ranh giới giữa NutriPlan Subscription với Kitchen Order.
