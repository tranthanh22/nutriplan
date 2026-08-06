# Bảng danh sách chức năng và phân công công việc NutriPlan

## 1. Quy ước phân công

| Ký hiệu | Vai trò gợi ý | Phạm vi chính |
|---|---|---|
| Bảo | Frontend, UI/UX và kiểm thử giao diện | Next.js, TypeScript, responsive, trải nghiệm người dùng và tích hợp API |
| Thành | Backend, database, AI và triển khai | NestJS, Supabase PostgreSQL, Auth, Gemini, Stripe và deploy |
| Cả hai | Công việc cần thống nhất nghiệp vụ | Phân tích yêu cầu, kiểm thử luồng hoàn chỉnh, viết báo cáo và demo |

> Phân công hiện tại: Bảo phụ trách Frontend/UI/UX; Thành phụ trách Backend/Database/AI/DevOps.

## 2. Bảng phân công chức năng

| Mã | Nhóm chức năng | Công việc cần thực hiện | Kết quả bàn giao | Ưu tiên | Phân công gợi ý | Người phụ trách thực tế | Trạng thái |
|---|---|---|---|---|---|---|---|
| FN-01 | Trang giới thiệu | Thiết kế landing page giới thiệu NutriPlan, lợi ích, quy trình và nút đăng nhập | Landing page responsive | Cao | Bảo |  | Hoàn thành |
| FN-02 | Xác thực | Xây dựng giao diện đăng ký, đăng nhập và thông báo lỗi | Trang đăng ký/đăng nhập | Cao | Bảo |  | Hoàn thành |
| FN-03 | Xác thực | Tích hợp Supabase Auth, cookie phiên đăng nhập và đăng xuất | Luồng xác thực hoàn chỉnh | Cao | Thành |  | Hoàn thành |
| FN-04 | Phân quyền | Xây dựng JWT Guard và Roles Guard cho customer, kitchen staff và admin | API được bảo vệ theo vai trò | Cao | Thành |  | Hoàn thành |
| FN-05 | Điều hướng | Điều hướng theo trạng thái đăng nhập và vai trò người dùng | Luồng landing → auth → app | Cao | Bảo |  | Hoàn thành |
| FN-06 | Onboarding | Thiết kế form thu thập giới tính, tuổi, chiều cao và cân nặng | Form hồ sơ sức khỏe | Cao | Bảo |  | Hoàn thành |
| FN-07 | Onboarding | Thu thập mức vận động, mục tiêu, cân nặng đích và thời gian dự kiến | Form mục tiêu định lượng | Cao | Bảo |  | Hoàn thành |
| FN-08 | Onboarding | Thu thập sở thích ăn uống, dị ứng, không dung nạp và món không thích | Form ràng buộc thực phẩm | Cao | Bảo |  | Hoàn thành |
| FN-09 | Hồ sơ dinh dưỡng | Thiết kế API lưu hồ sơ dinh dưỡng theo phiên bản | API Nutrition Profile | Cao | Thành |  | Hoàn thành |
| FN-10 | Hồ sơ dinh dưỡng | Thiết kế bảng dữ liệu và RLS bảo vệ hồ sơ người dùng | Migration và RLS Supabase | Cao | Thành |  | Hoàn thành |
| FN-11 | Tính toán | Cài đặt công thức tuổi, BMR và TDEE | Nutrition Calculator Service | Cao | Thành |  | Hoàn thành |
| FN-12 | Tính toán | Tính calorie và macro theo mục tiêu cân nặng/thời gian | Kết quả calorie, P/C/F | Cao | Thành |  | Hoàn thành |
| FN-13 | Tính toán | Validate dữ liệu và mục tiêu tăng/giảm/duy trì cân nặng | Bộ quy tắc kiểm tra dữ liệu | Cao | Thành |  | Hoàn thành |
| FN-14 | Tổng quan | Thiết kế các card cân nặng, BMR, TDEE và cân nặng đích | Dashboard chỉ số | Cao | Bảo |  | Hoàn thành |
| FN-15 | Tổng quan | Hiển thị calorie và macro đã ăn trong ngày | Khu vực tiến độ dinh dưỡng | Cao | Bảo |  | Hoàn thành |
| FN-16 | Tổng quan | Hiển thị thực đơn hôm nay, ảnh món và trạng thái đã ăn | Danh sách món hôm nay | Cao | Bảo |  | Hoàn thành |
| FN-17 | Theo dõi cân nặng | Xây dựng API lịch sử cân nặng theo khoảng thời gian | API Weight History | Trung bình | Thành |  | Hoàn thành |
| FN-18 | Theo dõi cân nặng | Thiết kế biểu đồ 7 ngày, 1 tháng, 3 tháng, 1 năm và tất cả | Biểu đồ xu hướng cân nặng | Trung bình | Bảo |  | Hoàn thành |
| FN-19 | Check-in | Thiết kế form check-in nhanh bằng lựa chọn theo khoảng | Form wellness check-in | Cao | Bảo |  | Hoàn thành |
| FN-20 | Check-in | Xây dựng API lưu và đọc check-in trong ngày | Wellness API và bảng dữ liệu | Cao | Thành |  | Hoàn thành |
| FN-21 | AI Insight | Chuẩn hóa dữ liệu hồ sơ và check-in trước khi gửi AI | AI input schema an toàn | Cao | Thành |  | Hoàn thành |
| FN-22 | AI Insight | Tích hợp Gemini và kiểm tra JSON output | Gemini Insight Provider | Cao | Thành |  | Hoàn thành |
| FN-23 | AI Insight | Thiết kế khu vực hiển thị tóm tắt, quan sát và gợi ý | Giao diện AI Insight | Cao | Bảo |  | Hoàn thành |
| FN-24 | AI Insight | Lưu model, prompt version, formula version và kết quả AI | Lịch sử AI Insight | Cao | Thành |  | Hoàn thành |
| FN-25 | Trợ lý ảo | Tích hợp Gemini cho hội thoại theo ngữ cảnh dinh dưỡng | Assistant API | Trung bình | Thành |  | Hoàn thành |
| FN-26 | Trợ lý ảo | Thiết kế widget chat hiển thị trên mọi trang | Floating chat widget | Trung bình | Bảo |  | Hoàn thành |
| FN-27 | Trợ lý ảo | Thiết kế bong bóng chat riêng cho người dùng và AI | Giao diện hội thoại dễ phân biệt | Trung bình | Bảo |  | Hoàn thành |
| FN-28 | Thực đơn cá nhân | Thiết kế lịch thực đơn dạng lưới theo tháng | Menu Calendar | Cao | Bảo |  | Hoàn thành |
| FN-29 | Thực đơn cá nhân | Tạo thực đơn cho ngày chưa có kế hoạch | API Generate Menu Day | Cao | Thành |  | Hoàn thành |
| FN-30 | Thực đơn cá nhân | Tạo ba bữa chính, bữa nhẹ và đồ uống phù hợp mục tiêu | Logic ghép món theo dinh dưỡng | Cao | Thành |  | Hoàn thành |
| FN-31 | Thực đơn cá nhân | Hiển thị ảnh, dinh dưỡng, khẩu phần và tổng ngày | Giao diện chi tiết ngày | Cao | Bảo |  | Hoàn thành |
| FN-32 | Đổi món cá nhân | Tìm món thay thế tương đương dinh dưỡng | Replacement API | Cao | Thành |  | Hoàn thành |
| FN-33 | Đổi món cá nhân | Thiết kế modal lựa chọn và xác nhận món thay thế | Replacement Modal | Cao | Bảo |  | Hoàn thành |
| FN-34 | Recipe | Xây dựng API Recipe chỉ dành cho người có Plus | Recipe API có kiểm tra quyền | Cao | Thành |  | Hoàn thành |
| FN-35 | Recipe | Hiển thị nguyên liệu, cách làm, thời gian và mẹo nấu | Recipe Modal | Cao | Bảo |  | Hoàn thành |
| FN-36 | Nhật ký | Ghi món cá nhân đã ăn và chống ghi trùng | Meal Log API cá nhân | Cao | Thành |  | Hoàn thành |
| FN-37 | Nhật ký | Ghi từng món bếp đã ăn vào nhật ký | Meal Log API món bếp | Cao | Thành |  | Hoàn thành |
| FN-38 | Nhật ký | Thiết kế trang nhật ký và tổng calorie/macro theo ngày | Journal Page | Cao | Bảo |  | Hoàn thành |
| FN-39 | Realtime | Đồng bộ Meal Log theo thời gian thực qua Supabase Realtime | Nhật ký tự cập nhật | Trung bình | Thành |  | Hoàn thành |
| FN-40 | Phân tích ảnh | Thiết kế modal tải/chụp ảnh món ăn và xem kết quả | Image Analysis UI | Trung bình | Bảo |  | Hoàn thành một phần |
| FN-41 | Phân tích ảnh | Xây dựng AI phân tích ảnh và lưu kết quả ước tính | Image Analysis API | Trung bình | Thành |  | Cần hoàn thiện |
| FN-42 | Bếp đối tác | Chuẩn bị dữ liệu mock khoảng 20 bếp và nhiều loại gói | Bộ dữ liệu bếp/gói | Cao | Thành |  | Hoàn thành |
| FN-43 | Bếp đối tác | Thiết kế danh sách, bộ lọc và card bếp/gói | Kitchen Marketplace | Cao | Bảo |  | Hoàn thành |
| FN-44 | Bếp đối tác | Thiết kế trang/modal chi tiết gói, dinh dưỡng và đánh giá | Kitchen Offer Detail | Cao | Bảo |  | Hoàn thành |
| FN-45 | Đặt gói bếp | Xây dựng form thông tin nhận hàng và xác nhận gói | Order Modal | Cao | Bảo |  | Hoàn thành |
| FN-46 | Đặt gói bếp | Tạo Kitchen Order và lịch Daily Order theo thời hạn gói | Orders API và lịch giao | Cao | Thành |  | Hoàn thành |
| FN-47 | Lịch bếp đã mua | Hiển thị ngày có lịch ăn từ bếp trên calendar | Lịch món bếp | Cao | Bảo |  | Hoàn thành |
| FN-48 | Món bếp | Hiển thị ảnh, khẩu phần, calorie, macro và nguyên liệu | Card chi tiết món bếp | Cao | Bảo |  | Hoàn thành |
| FN-49 | Món bếp | Lưu snapshot ảnh, dinh dưỡng, nguyên liệu và dị nguyên | Cấu trúc Daily Order Item | Cao | Thành |  | Hoàn thành |
| FN-50 | Trạng thái món bếp | Hiển thị đã lên lịch, đang chuẩn bị, đang giao và đã giao | Status UI | Cao | Bảo |  | Hoàn thành |
| FN-51 | Yêu cầu đổi món bếp | Thiết kế form lý do và ghi chú yêu cầu đổi món | Change Request Modal | Trung bình | Bảo |  | Hoàn thành |
| FN-52 | Yêu cầu đổi món bếp | Lưu yêu cầu, kiểm tra chủ đơn và chống gửi trùng | Change Request API/DB | Trung bình | Thành |  | Hoàn thành |
| FN-53 | Subscription | Thiết kế giao diện gói 7 ngày, 1 tháng và 3 tháng | Subscription Modal | Cao | Bảo |  | Hoàn thành |
| FN-54 | Subscription | Xây dựng gói dùng thử 7 ngày và kiểm tra quyền Plus | Trial/Access API | Cao | Thành |  | Hoàn thành |
| FN-55 | Thanh toán | Tích hợp Stripe Checkout Test Mode | Checkout API và trang Stripe | Cao | Thành |  | Hoàn thành |
| FN-56 | Thanh toán | Xử lý webhook và kích hoạt subscription | Stripe Webhook | Cao | Thành |  | Hoàn thành |
| FN-57 | Thanh toán | Thiết kế trang xác nhận thanh toán thành công | Checkout Success Page | Cao | Bảo |  | Hoàn thành |
| FN-58 | Thanh toán | Tích hợp Billing Portal quản lý phương thức thanh toán | Billing Portal API | Trung bình | Thành |  | Hoàn thành |
| FN-59 | Cài đặt | Thiết kế trang cài đặt, gói hiện tại và phương thức thanh toán | Settings Page | Trung bình | Bảo |  | Hoàn thành |
| FN-60 | Cài đặt | Lưu tên trợ lý và các thiết lập tài khoản | Settings API | Trung bình | Thành |  | Hoàn thành |
| FN-61 | Quản lý bếp | Thiết kế dashboard đơn hàng của từng nhà bếp | Kitchen Management Page | Cao | Bảo |  | Hoàn thành |
| FN-62 | Quản lý bếp | Trả dữ liệu đúng nhà bếp theo Kitchen Membership | Kitchen Dashboard API | Cao | Thành |  | Hoàn thành |
| FN-63 | Quản lý bếp | Quản lý gói đang hoạt động và lịch từng ngày | Package Manager | Cao | Bảo |  | Hoàn thành |
| FN-64 | Quản lý bếp | Cập nhật món, nguyên liệu, dinh dưỡng và dị nguyên | Daily Order Item API | Cao | Thành |  | Hoàn thành |
| FN-65 | Quản lý bếp | Cập nhật trạng thái nhận, chuẩn bị, giao và hoàn thành | Daily Order Status API | Cao | Thành |  | Hoàn thành |
| FN-66 | Quản trị | Thiết kế trang thống kê khách hàng, bếp, đơn và doanh thu | Admin Dashboard UI | Trung bình | Bảo |  | Hoàn thành |
| FN-67 | Quản trị | Tổng hợp chỉ số hệ thống và bảo vệ bằng role admin | Admin Dashboard API | Trung bình | Thành |  | Hoàn thành |
| FN-68 | Kiểm thử | Viết unit test cho calculator, AI, order, subscription và quyền | Bộ test backend | Cao | Thành |  | Hoàn thành |
| FN-69 | Kiểm thử | Kiểm thử responsive, trạng thái loading/error và luồng UI | Biên bản kiểm thử frontend | Cao | Bảo |  | Đang thực hiện |
| FN-70 | Kiểm thử tích hợp | Kiểm thử đăng nhập → hồ sơ → thực đơn → đã ăn → nhật ký | Kịch bản E2E chính | Cao | Cả hai |  | Cần hoàn thiện |
| FN-71 | Kiểm thử tích hợp | Kiểm thử chọn gói → thanh toán → kích hoạt Plus | Kịch bản Stripe E2E | Cao | Cả hai |  | Cần hoàn thiện |
| FN-72 | Kiểm thử tích hợp | Kiểm thử mua gói bếp → lịch giao → đã ăn → nhật ký | Kịch bản Kitchen Order E2E | Cao | Cả hai |  | Cần hoàn thiện |
| FN-73 | Triển khai | Cấu hình biến môi trường frontend/backend | Danh sách env cho production | Cao | Thành |  | Đang thực hiện |
| FN-74 | Triển khai | Deploy frontend Next.js lên Vercel | URL frontend production | Cao | Bảo |  | Đang thực hiện |
| FN-75 | Triển khai | Deploy backend NestJS và cấu hình URL API | URL backend production | Cao | Thành |  | Cần hoàn thiện |
| FN-76 | Database | Quản lý migration, seed và kiểm tra RLS/Security Advisor | Database production an toàn | Cao | Thành |  | Đang thực hiện |
| FN-77 | Tài liệu | Viết mô tả chức năng, kiến trúc, database và API | Bộ tài liệu kỹ thuật | Trung bình | Cả hai |  | Đang thực hiện |
| FN-78 | Báo cáo | Tổng hợp công việc, hình ảnh demo và kết quả kiểm thử | Báo cáo dự án | Cao | Cả hai |  | Cần thực hiện |

## 3. Bảng phân công rút gọn theo thành viên

| Thành viên | Công việc chính | Các mã chức năng tiêu biểu |
|---|---|---|
| Bảo — Frontend/UI/UX | Landing, Auth UI, onboarding, dashboard, lịch thực đơn, Recipe UI, marketplace, journal, trang bếp/admin và responsive | FN-01, FN-02, FN-05–08, FN-14–16, FN-18–19, FN-23, FN-26–28, FN-31, FN-33, FN-35, FN-38, FN-40, FN-43–45, FN-47–48, FN-50–51, FN-53, FN-57, FN-59, FN-61, FN-63, FN-66, FN-69, FN-74 |
| Thành — Backend/DB/AI/DevOps | Auth, phân quyền, tính dinh dưỡng, Gemini, thực đơn, order, subscription, Stripe, Supabase và deploy backend | FN-03–04, FN-09–13, FN-17, FN-20–22, FN-24–25, FN-29–30, FN-32, FN-34, FN-36–37, FN-39, FN-41–42, FN-46, FN-49, FN-52, FN-54–56, FN-58, FN-60, FN-62, FN-64–65, FN-67–68, FN-73, FN-75–76 |
| Cả hai | Phân tích nghiệp vụ, test E2E, tài liệu, báo cáo và demo | FN-70–72, FN-77–78 |

## 4. Mẫu tổng hợp tiến độ để đưa vào báo cáo

| Thành viên | Số công việc được giao | Đã hoàn thành | Đang thực hiện | Chưa thực hiện | Tỷ lệ hoàn thành |
|---|---:|---:|---:|---:|---:|
| Bảo |  |  |  |  |  |
| Thành |  |  |  |  |  |
| Công việc chung |  |  |  |  |  |

## 5. Mẫu ghi nhận công việc chi tiết

| Ngày | Thành viên | Mã công việc | Nội dung đã làm | Kết quả/Minh chứng | Vấn đề gặp phải | Hướng xử lý tiếp theo |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## 6. Lưu ý khi đưa vào báo cáo

- Bổ sung họ tên đầy đủ hoặc mã sinh viên của Bảo và Thành nếu biểu mẫu báo cáo yêu cầu.
- Chỉ đánh dấu “Hoàn thành” khi chức năng đã chạy được và có minh chứng.
- Với chức năng hoàn thành một phần, ghi rõ phần đã làm và phần còn thiếu.
- Minh chứng nên gồm đường dẫn file, ảnh chụp giao diện, API Swagger, kết quả test hoặc URL triển khai.
- Các chức năng AI, phân tích ảnh, dinh dưỡng và dị ứng cần ghi rõ giới hạn an toàn trong báo cáo.
