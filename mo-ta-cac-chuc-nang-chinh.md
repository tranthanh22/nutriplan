# Mô tả các chức năng chính của ứng dụng NutriPlan

## 1. Tổng quan sản phẩm

NutriPlan là web app hỗ trợ người dùng xây dựng kế hoạch ăn uống dựa trên chỉ số cơ thể, mức độ vận động, mục tiêu cân nặng và nhu cầu ăn uống cá nhân. Ứng dụng kết hợp ba nhóm dịch vụ chính:

1. Tính toán và theo dõi nhu cầu dinh dưỡng cá nhân.
2. Cung cấp thực đơn cá nhân, công thức và AI Insight thông qua gói NutriPlan Plus.
3. Cho phép người dùng mua món hoặc gói ăn từ bếp đối tác mà không bắt buộc đăng ký Plus.

NutriPlan cung cấp giao diện riêng cho khách hàng, nhân viên nhà bếp và quản trị viên hệ thống.

## 2. Nhóm người dùng

| Vai trò | Quyền sử dụng chính |
|---|---|
| Khách chưa đăng nhập | Xem trang giới thiệu, quyền lợi, gói dịch vụ và chuyển tới đăng nhập/đăng ký |
| Khách hàng miễn phí | Tạo hồ sơ sức khỏe, xem chỉ số cơ bản, khám phá và mua gói bếp đối tác |
| Khách hàng Plus | Sử dụng thực đơn cá nhân, Recipe, AI Insight, nhật ký dinh dưỡng và trợ lý ảo đầy đủ |
| Nhân viên nhà bếp | Quản lý đơn thuộc nhà bếp được phân quyền, thực đơn giao theo ngày và thông tin dinh dưỡng của món |
| Quản trị viên | Xem thống kê toàn hệ thống và truy cập khu vực quản lý theo quyền admin |

## 3. Các chức năng dành cho khách hàng

### 3.1. Trang giới thiệu

- Giới thiệu vấn đề NutriPlan giải quyết và quy trình sử dụng.
- Trình bày lợi ích của thực đơn cá nhân, AI Insight và bếp đối tác.
- Giới thiệu gói Plus và điều hướng người dùng tới đăng nhập hoặc đăng ký.

### 3.2. Đăng ký, đăng nhập và đăng xuất

- Đăng ký tài khoản bằng email và mật khẩu qua Supabase Auth.
- Đăng nhập và duy trì phiên người dùng bằng cookie bảo mật.
- Đăng xuất trong trang Cài đặt.
- Backend xác thực Supabase JWT trước khi cho phép truy cập API riêng tư.
- Sau đăng nhập, hệ thống điều hướng theo vai trò khách hàng, nhân viên bếp hoặc admin.

### 3.3. Thu thập hồ sơ sức khỏe lần đầu

Khi đăng nhập lần đầu, người dùng được yêu cầu cung cấp:

- Giới tính, ngày sinh, chiều cao và cân nặng.
- Tần suất và mức độ vận động.
- Mục tiêu giảm cân, duy trì hoặc tăng cân ưu tiên cơ nạc.
- Cân nặng muốn đạt và thời gian dự kiến.
- Chế độ ăn ưu tiên.
- Thực phẩm không thích, thực phẩm dị ứng và không dung nạp.
- Thực phẩm không ăn được và ghi chú sức khỏe tùy chọn.

Hệ thống tạo phiên bản mới cho mỗi lần cập nhật hồ sơ, nhắc người dùng kiểm tra lại thông tin sau mỗi 7 ngày và không ghi đè mất lịch sử cũ.

### 3.4. Tính toán chỉ số dinh dưỡng

Backend sử dụng dữ liệu hồ sơ để tính:

- Tuổi hiện tại.
- BMR theo công thức Mifflin–St Jeor.
- TDEE dựa trên BMR và hệ số vận động.
- Mức calorie mục tiêu dựa trên cân nặng đích và thời gian dự kiến.
- Protein, carbohydrate và chất béo mục tiêu mỗi ngày.
- Tốc độ thay đổi cân nặng dự kiến mỗi tuần.

Hệ thống kiểm tra miền tuổi, cân nặng, chiều cao và tính hợp lý giữa mục tiêu hiện tại với cân nặng đích trước khi lưu.

### 3.5. Trang Tổng quan

Trang Tổng quan giúp người dùng xem nhanh:

- Cân nặng hiện tại và cân nặng đích.
- BMR, TDEE và mục tiêu calorie.
- Lượng calorie và các chất đa lượng đã ghi nhận trong ngày.
- Thực đơn hôm nay, hình ảnh món và trạng thái đã ăn.
- Xu hướng cân nặng theo 7 ngày, 1 tháng, 3 tháng, 1 năm hoặc toàn bộ dữ liệu.
- AI Insight mới nhất và nút tạo phân tích khi chưa có dữ liệu.

### 3.6. Check-in sức khỏe hằng ngày

Người dùng có thể thực hiện check-in nhanh về:

- Mức độ vận động trong ngày.
- Thời lượng vận động theo khoảng ước lượng.
- Chất lượng và thời lượng ngủ.
- Lượng nước uống theo khoảng ước lượng.
- Mức năng lượng, căng thẳng, đói và mệt mỏi.
- Ghi chú bổ sung cho AI.

Dữ liệu check-in được kết hợp với Nutrition Profile để tạo AI Insight phù hợp với tình trạng trong ngày.

### 3.7. AI Insight sức khỏe

- Backend tính BMR, TDEE, calorie và macro trước khi gửi dữ liệu tối thiểu tới Gemini.
- AI giải thích các chỉ số bằng ngôn ngữ dễ hiểu và đưa ra gợi ý hành động.
- Insight có thể kết hợp hồ sơ hiện hành và check-in trong ngày.
- Kết quả được kiểm tra schema trước khi lưu dưới dạng JSON.
- Hệ thống lưu model, prompt version, formula version và dữ liệu đầu vào tối thiểu.
- Không gửi trực tiếp tên, số điện thoại hoặc địa chỉ cho AI.
- AI Insight chỉ mang tính tham khảo, không chẩn đoán bệnh và không thay thế bác sĩ hoặc chuyên gia dinh dưỡng.

### 3.8. Trợ lý ảo NutriPlan

- Widget chat xuất hiện ở góc phải trên mọi trang bên trong ứng dụng.
- Người dùng có thể hỏi về nhu cầu dinh dưỡng, thực đơn, mục tiêu và cách sử dụng ứng dụng.
- Tin nhắn người dùng hiển thị bên phải; tin nhắn AI hiển thị bên trái.
- Người dùng có thể đặt tên riêng cho trợ lý trong Cài đặt.
- Trợ lý sử dụng ngữ cảnh hồ sơ dinh dưỡng hiện hành nhưng không được dùng để chẩn đoán bệnh.

### 3.9. Thực đơn cá nhân

Chức năng dành cho người có gói Plus còn hiệu lực:

- Hiển thị thực đơn theo lịch lưới từng tháng.
- Chọn trực tiếp một ngày để xem hoặc điều chỉnh thực đơn.
- Tạo thực đơn cho ngày chưa có kế hoạch.
- Mỗi ngày có thể gồm bữa sáng, trưa, tối, bữa nhẹ và đồ uống.
- Hiển thị hình ảnh, khẩu phần, calorie, protein, carbohydrate và chất béo của từng món.
- Tính tổng dinh dưỡng của ngày và mức cân bằng so với mục tiêu.
- Cho phép thay món bằng các món tương đương dinh dưỡng và an toàn với dị ứng.
- Không cho thay món đã được xác nhận là đã ăn.
- Nút “Đã ăn” ghi món vào Nhật ký dinh dưỡng và không cho bấm lại lần thứ hai.

### 3.10. Recipe chi tiết

- Người dùng Plus có thể mở Recipe từ món trong thực đơn cá nhân.
- Recipe hiển thị nguyên liệu, các bước thực hiện, thời gian chuẩn bị/nấu và mẹo nấu ăn nếu có.
- Backend kiểm tra subscription trước khi trả dữ liệu Recipe; nội dung không chỉ bị ẩn ở frontend.
- Người chưa có Plus được hiển thị lời mời đăng ký hoặc dùng thử.

### 3.11. Khám phá bếp đối tác

- Hiển thị danh sách các bếp và gói mock đa dạng.
- Hỗ trợ món lẻ, gói 7 ngày, 30 ngày và 120 ngày.
- Lọc theo loại gói, vị trí, chế độ ăn và các tiêu chí liên quan.
- Xem thông tin bếp, khoảng cách, vùng giao, đánh giá và bình luận.
- Xem chi tiết gói gồm giá, số bữa mỗi ngày, dinh dưỡng dự kiến, chế độ ăn, món nổi bật và quyền lợi đi kèm.
- Người dùng không cần Plus vẫn có thể mua món hoặc gói của bếp.

### 3.12. Đặt gói ăn từ nhà bếp

Khi đặt gói, người dùng cung cấp:

- Họ tên và số điện thoại người nhận.
- Địa chỉ và ghi chú giao hàng.
- Ngày bắt đầu, khung giờ và số lượng phù hợp với gói.
- Thông tin chế độ ăn, dị ứng, không dung nạp và thực phẩm không thích được lấy từ hồ sơ hiện hành.

Sau khi đặt thành công, hệ thống tạo Kitchen Order và lịch Daily Order cho toàn bộ thời hạn của gói.

### 3.13. Lịch món từ bếp đã đăng ký

- Hiển thị các ngày có lịch ăn từ bếp trên lịch lưới.
- Người dùng bấm trực tiếp vào ngày để xem các món được giao.
- Mỗi món hiển thị:
  - Hình ảnh.
  - Tên món và số khẩu phần.
  - Calorie, protein, carbohydrate và chất béo.
  - Danh sách nguyên liệu bếp sử dụng.
  - Trạng thái: đã lên lịch, đang chuẩn bị, đang giao hoặc đã được giao.
- Sau khi món được giao, người dùng Plus có thể bấm “Đã ăn” cho từng món.
- Mỗi món chỉ được ghi một lần vào Nhật ký dinh dưỡng.

### 3.14. Yêu cầu bếp đổi món

- Người dùng có thể gửi yêu cầu đổi trước khi bếp bắt đầu chuẩn bị.
- Chọn lý do: không thích, lo ngại dị ứng, không phù hợp chế độ ăn hoặc lý do khác.
- Có thể nhập ghi chú tối đa 500 ký tự.
- Hệ thống chặn gửi nhiều yêu cầu đang chờ cho cùng một món.
- Giao diện hiển thị trạng thái yêu cầu: đang chờ, được chấp nhận, bị từ chối hoặc đã hủy.

### 3.15. Nhật ký dinh dưỡng

- Tổng hợp các món người dùng đã xác nhận ăn trong ngày.
- Hỗ trợ nguồn từ thực đơn cá nhân, món bếp, nhập tay hoặc kết quả phân tích ảnh.
- Cập nhật tổng calorie, protein, carbohydrate và chất béo theo thời gian thực.
- Ghi rõ tên món, bữa ăn, thời gian, nguồn dữ liệu và các thành phần dinh dưỡng.
- Món bếp được ghi riêng theo từng Daily Order Item để tránh cộng gộp sai khi một lần giao có nhiều món.

### 3.16. Phân tích hình ảnh món ăn

- Người dùng Plus có thể mở chức năng phân tích ảnh từ Nhật ký dinh dưỡng.
- Ảnh được dùng để ước tính món ăn và thành phần dinh dưỡng.
- Kết quả cần được đánh dấu là ước tính, không thay thế số liệu từ công thức hoặc công bố của bếp.
- Người dùng xác nhận trước khi lưu kết quả vào Nhật ký.

## 4. Subscription và thanh toán

### 4.1. Gói NutriPlan Plus

- Có lựa chọn 7 ngày, 1 tháng và 3 tháng.
- Có gói dùng thử nội bộ 7 ngày cho tài khoản chưa từng dùng thử.
- Plus mở Recipe, thực đơn cá nhân, đổi món, AI Insight đầy đủ, nhật ký nâng cao và phân tích ảnh.
- Khi hủy gia hạn, quyền lợi vẫn tồn tại đến hết kỳ hiện hành.

### 4.2. Thanh toán Stripe Test Mode

- Frontend tạo yêu cầu checkout thông qua backend.
- Backend tạo Stripe Checkout Session bằng secret key phía server.
- Trang xác nhận kiểm tra lại session và trạng thái thanh toán.
- Webhook cập nhật payment và kích hoạt subscription.
- Hỗ trợ Billing Portal để người dùng quản lý phương thức thanh toán và subscription.
- Secret key và webhook secret không được đưa xuống trình duyệt.

### 4.3. Phân biệt hai loại thanh toán

- NutriPlan Subscription dùng để mua quyền truy cập tính năng số.
- Kitchen Order dùng để mua món hoặc gói ăn từ bếp.
- Người dùng có thể mua gói bếp mà không đăng ký Plus.
- Giá gói Plus không bao gồm tiền món và phí giao của bếp.

## 5. Chức năng dành cho nhà bếp

### 5.1. Quản lý đơn hàng

- Chỉ nhân viên thuộc nhà bếp hoặc admin được truy cập.
- Xem mã đơn, thông tin người nhận, địa chỉ, số điện thoại và ghi chú giao hàng.
- Xem gói khách đã mua, số bữa, tiến độ giao và tổng tiền.
- Xem chế độ ăn, dị ứng, không dung nạp và món khách không thích.
- Cập nhật trạng thái đơn: đã thanh toán, xác nhận, hoàn thành hoặc hủy theo luồng cho phép.

### 5.2. Quản lý lịch giao trong gói

- Mở một gói đang hoạt động để xem toàn bộ lịch 7, 30 hoặc 120 ngày.
- Quản lý riêng từng bữa theo ngày và khung giờ.
- Cập nhật trạng thái: đã nhận, đang chuẩn bị, đang giao và đã giao.
- Theo dõi số bữa đã giao và số bữa còn lại.

### 5.3. Quản lý món nhà bếp chuẩn bị

Trước khi bắt đầu chuẩn bị, nhà bếp có thể cập nhật:

- Tên món thực tế.
- Danh sách nguyên liệu.
- Số khẩu phần.
- Calorie, protein, carbohydrate và chất béo.
- Các dị nguyên có trong món.

Backend từ chối lưu món nếu dị nguyên trùng với dị ứng khách đã khai báo.

## 6. Chức năng dành cho quản trị viên

- Chỉ tài khoản có role `admin` được truy cập trang quản trị.
- Xem tổng số khách hàng và nhà bếp.
- Xem số bếp đang hoạt động và subscription đang hoạt động.
- Xem tổng số đơn bếp, doanh thu, Meal Log và AI Insight.
- Xem danh sách đơn gần đây và thông tin tổng quan khách hàng/bếp.
- Admin có thể truy cập chức năng quản lý bếp để hỗ trợ vận hành.

## 7. Cài đặt tài khoản

- Đổi tên hiển thị của trợ lý ảo.
- Xem gói subscription hiện hành và ngày hết hạn.
- Mở trang thay đổi gói hoặc Billing Portal.
- Quản lý phương thức thanh toán thông qua Stripe.
- Cập nhật hồ sơ cá nhân và hồ sơ dinh dưỡng.
- Đăng xuất khỏi tài khoản.

## 8. Phân quyền và bảo mật 

- Supabase Auth quản lý tài khoản và phiên đăng nhập.
- NestJS JWT Guard xác minh access token trước khi xử lý API bảo vệ.
- Roles Guard giới hạn API của nhà bếp và admin.
- Row Level Security giới hạn dữ liệu theo chủ sở hữu đơn, thành viên nhà bếp hoặc admin.
- Service role chỉ tồn tại trong backend và không được gửi xuống frontend.
- Recipe được bảo vệ bằng kiểm tra subscription ở backend.
- Thao tác ghi “Đã ăn” kiểm tra chủ sở hữu, trạng thái đã giao và subscription trước khi tạo Meal Log.
- Các API quan trọng có kiểm tra chống ghi trùng.

## 9. Luồng sử dụng tổng quát

```text
Trang giới thiệu
    ↓
Đăng ký / Đăng nhập
    ↓
Hoàn thành hồ sơ sức khỏe
    ↓
Tổng quan chỉ số và AI Insight
    ↓
Chọn một trong hai hướng
    ├── NutriPlan Plus → Thực đơn cá nhân → Recipe → Đã ăn → Nhật ký
    └── Bếp đối tác → Chọn gói → Đặt hàng → Theo dõi giao → Đã ăn → Nhật ký
```

## 10. Giới hạn và lưu ý

- NutriPlan không chẩn đoán bệnh và không thay thế bác sĩ hoặc chuyên gia dinh dưỡng.
- Các công thức, số liệu món và nguyên liệu mock cần được bếp hoặc chuyên gia xác nhận trước khi sử dụng trong môi trường thật.
- Phân tích ảnh và nội dung AI đều là thông tin hỗ trợ, có thể có sai số.
- Dữ liệu dị ứng cần được kiểm tra lại với người dùng và nhà bếp trước khi chuẩn bị món.
- Các chức năng thanh toán hiện sử dụng Stripe Test Mode trong môi trường thử nghiệm.
