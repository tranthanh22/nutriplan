# Kiểm thử Stripe Test Mode

Luồng thanh toán subscription:

```text
Frontend chọn gói
  → Next.js POST /api/subscriptions/checkout
  → NestJS tạo payment pending và Stripe Checkout Session
  → trình duyệt chuyển sang Stripe Checkout
  → Stripe gửi webhook checkout.session.completed
  → NestJS gọi RPC idempotent để kích hoạt subscription
  → Stripe chuyển về /checkout/success
  → trang thành công đối soát session và cập nhật trạng thái Plus
```

NutriPlan sử dụng Stripe Checkout `mode=payment`: người dùng thanh toán một lần
để mua quyền truy cập trong 7, 30 hoặc 90 ngày. Đây không phải gói tự động gia
hạn.

## 1. Lấy khóa Test Mode

Trong Stripe Dashboard, bật **Test mode** rồi lấy:

- Secret key bắt đầu bằng `sk_test_`.
- Không dùng `sk_live_` khi test.

Điền `src/backend/.env`:

```dotenv
FRONTEND_URL=http://localhost:3000
STRIPE_TEST_MODE=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Frontend chỉ cần:

```dotenv
NEXT_PUBLIC_STRIPE_TEST_MODE=true
NUTRIPLAN_API_BASE_URL=http://localhost:4000/api/v1
```

Không đưa `STRIPE_SECRET_KEY` hoặc `STRIPE_WEBHOOK_SECRET` vào frontend hay
biến `NEXT_PUBLIC_*`.

## 2. Cài và đăng nhập Stripe CLI

Sau khi cài Stripe CLI:

```bash
stripe login
stripe listen \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired \
  --forward-to localhost:4000/api/v1/subscriptions/webhooks/stripe
```

Lệnh `stripe listen` in ra signing secret bắt đầu bằng `whsec_`. Sao chép giá
trị này vào `STRIPE_WEBHOOK_SECRET`, sau đó khởi động lại backend.

## 3. Chạy ứng dụng

Terminal 1:

```bash
cd src/backend
npm run start:dev
```

Terminal 2:

```bash
cd src/frontend
npm run dev
```

Terminal 3 giữ `stripe listen` tiếp tục chạy.

Đăng nhập tại `http://localhost:3000/login`, mở phần mua NutriPlan Plus, chọn
gói và bấm thanh toán.

## 4. Thẻ test

Thanh toán thành công:

```text
Số thẻ: 4242 4242 4242 4242
Ngày hết hạn: bất kỳ ngày tương lai
CVC: 3 chữ số bất kỳ
Tên và địa chỉ: dữ liệu test bất kỳ
```

Thẻ bị từ chối:

```text
4000 0000 0000 0002
```

Không nhập thông tin thẻ thật trong Test Mode.

## 5. Kết quả mong đợi

Sau khi thanh toán thành công:

1. Stripe CLI nhận `checkout.session.completed`.
2. Trang `/checkout/success` hiển thị thanh toán thành công.
3. Bảng `payments` có trạng thái `succeeded`.
4. Bảng `subscriptions` có trạng thái `active`.
5. `current_period_end` bằng thời điểm kích hoạt cộng số ngày của gói.
6. Trang tổng quan hiển thị trạng thái NutriPlan Plus.

Nếu webhook đến chậm, trang thành công sẽ lấy Checkout Session trực tiếp từ
Stripe và chạy đối soát. RPC database khóa payment và kiểm tra trạng thái nên
webhook và đối soát không kích hoạt gói hai lần.

## 6. Test webhook không qua giao diện

Có thể phát sự kiện mẫu:

```bash
stripe trigger checkout.session.completed
```

Sự kiện mẫu này không chứa metadata của payment NutriPlan nên chỉ phù hợp để
kiểm tra kết nối và chữ ký webhook. Muốn kiểm tra kích hoạt subscription đầy đủ,
hãy tạo Checkout Session từ giao diện.

## 7. Deploy

Trên môi trường backend đã deploy, cấu hình:

- `FRONTEND_URL` bằng URL production của frontend.
- `STRIPE_TEST_MODE=true`.
- `STRIPE_SECRET_KEY=sk_test_...`.
- `STRIPE_WEBHOOK_SECRET` lấy từ webhook endpoint trong Stripe Dashboard.

Webhook URL:

```text
https://<backend-domain>/api/v1/subscriptions/webhooks/stripe
```

Chỉ chuyển sang live mode sau khi đã kiểm tra đầy đủ và đổi đồng thời secret
key, webhook secret và `STRIPE_TEST_MODE=false`.
