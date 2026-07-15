# NutriPlan MVP — Next.js

Web application demo cho MVP NutriPlan. Ứng dụng sử dụng Next.js App Router, TypeScript và localStorage để mô phỏng các luồng nghiệp vụ mà chưa cần backend.

## Chức năng đã có

- Hồ sơ dinh dưỡng và tính BMR/TDEE/Macro.
- Preview thực đơn và paywall NutriPlan Plus.
- Kích hoạt subscription dùng thử 7 ngày.
- Thực đơn 7 ngày, Recipe và ghi bữa ăn vào Meal Log.
- Marketplace bếp không bắt buộc subscription.
- Đặt món/gói bếp và thanh toán mô phỏng.
- Nhật ký dinh dưỡng và báo cáo tuân thủ cơ bản.
- Meal Scan Beta: tải ảnh, mô phỏng nhận diện, sửa khẩu phần và xác nhận.
- Giao diện responsive cho desktop, tablet và mobile.

## Chạy ứng dụng

Yêu cầu Node.js 20 trở lên.

```bash
cd start-up_nutriplan/src/frontend
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm tra production build

```bash
npm run lint
npm run build
npm start
```

## Lưu ý về MVP

- Thanh toán và trạng thái giao hàng hiện được mô phỏng, không phát sinh giao dịch thật.
- Dữ liệu được lưu trong localStorage của trình duyệt.
- Meal Scan trả kết quả demo có gắn nhãn ước tính và bắt buộc người dùng xác nhận.
- Công thức dinh dưỡng cần được chuyên gia kiểm chứng trước khi triển khai thật.
- Ảnh món ăn sử dụng từ Unsplash cho mục đích prototype.
