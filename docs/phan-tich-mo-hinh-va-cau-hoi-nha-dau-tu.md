# Phân tích mô hình NutriPlan và bộ câu hỏi nhà đầu tư

## 1. Mô hình NutriPlan trong một câu

NutriPlan biến dữ liệu cơ thể, mục tiêu và thói quen của người dùng thành kế hoạch ăn có thể thực hiện theo hai cách: **tự chuẩn bị với NutriPlan Plus** hoặc **mua món/gói từ bếp đối tác**, sau đó ghi nhận bữa ăn để tiếp tục điều chỉnh kế hoạch.

Chu trình giá trị cốt lõi:

`Hồ sơ → Tính nhu cầu → AI giải thích → Chọn thực đơn/bếp → Ăn và ghi nhận → Đánh giá kết quả → Điều chỉnh`

Hai nguồn doanh thu dự kiến:

1. Phí subscription từ người dùng cá nhân.
2. Hoa hồng hoặc phí nền tảng trên đơn của bếp; về sau có thể thu phí phần mềm quản lý từ bếp.

## 2. Điểm mạnh

### 2.1. Giải quyết trọn vẹn từ “biết” đến “làm”

Nhiều sản phẩm chỉ tính calorie hoặc ghi nhật ký. NutriPlan nối kết phân tích, kế hoạch, công thức, mua món và theo dõi thực tế. Người không có thời gian nấu vẫn có một hành động cụ thể là đặt món phù hợp.

### 2.2. Có hai lựa chọn sử dụng thay vì ép một mô hình

- Người muốn tiết kiệm có thể tự chuẩn bị.
- Người bận có thể mua từ bếp.
- Người mua bếp không bị buộc đăng ký Plus.
- Subscriber nhận thêm giá trị khi bữa ăn từ bếp đi thẳng vào nhật ký.

Thiết kế này mở rộng tệp khách hàng và tạo hai giả thuyết doanh thu có thể kiểm chứng độc lập.

### 2.3. Cá nhân hóa dựa trên dữ liệu có cấu trúc

BMR, TDEE, calorie và macro được tính bằng công thức xác định; AI có vai trò giải thích và đưa insight, không tự bịa toàn bộ số liệu nền. Hệ thống còn lọc theo mục tiêu, dị ứng, không dung nạp và chế độ ăn trước khi đề xuất gói bếp.

### 2.4. Có vòng lặp dữ liệu dài hạn

Nếu người dùng cập nhật cân nặng, check-in, món đã ăn và phản hồi đổi món, NutriPlan có thể học được:

- Kế hoạch nào dễ tuân thủ.
- Món nào phù hợp từng phân khúc.
- Bếp nào giao đúng và đáp ứng yêu cầu.
- Mức calorie/macro nào gắn với kết quả thực tế.

Đây là nền tảng để hình thành lợi thế dữ liệu, nhưng chỉ có giá trị khi dữ liệu thật đủ lớn, có sự đồng ý của người dùng và được kiểm soát chất lượng.

### 2.5. Có công cụ cho cả ba phía

NutriPlan không chỉ có ứng dụng khách hàng mà còn có dashboard bếp và admin. Việc quản lý gói nhiều ngày, dị ứng, món từng ngày và trạng thái giao giúp sản phẩm tiến gần một hệ điều hành vận hành bữa ăn, thay vì chỉ là giao diện AI.

### 2.6. Kiến trúc kỹ thuật đã tách miền nghiệp vụ

Next.js, NestJS, Supabase/Postgres, RLS, JWT, Stripe và Gemini được tách theo module. Giá và quyền subscription được kiểm tra phía server; lịch sử đơn có snapshot; webhook và thao tác nhạy cảm có cơ chế idempotency. Đây là nền tảng tốt để pilot và nâng cấp dần.

## 3. Điểm yếu và rủi ro

### 3.1. Phạm vi quá rộng đối với đội hai người

NutriPlan đang đồng thời làm ứng dụng dinh dưỡng, AI coach, meal planner, marketplace, quản lý bếp, thanh toán và giao nhận. Mỗi phần đều có thể là một startup riêng. Nếu triển khai dàn trải, chất lượng và tốc độ kiểm chứng thị trường đều giảm.

**Cách xử lý:** chọn một phân khúc, một khu vực, một mục tiêu và 3–5 bếp pilot; tạm hoãn tính năng không trực tiếp tạo retention hoặc doanh thu.

### 3.2. Bài toán hai phía của marketplace

Không có khách thì bếp không muốn duy trì menu chuẩn hóa; ít bếp thì khách không có đủ lựa chọn. Thêm vào đó, chất lượng món, đúng giờ và khiếu nại nằm một phần ngoài khả năng kiểm soát của phần mềm.

**Cách xử lý:** khởi đầu theo mô hình managed marketplace, tuyển ít bếp nhưng kiểm soát SLA, vùng giao và dữ liệu món chặt chẽ.

### 3.3. Niềm tin và trách nhiệm trong lĩnh vực sức khỏe

Insight sai, calorie sai hoặc bỏ sót dị ứng có thể gây hậu quả lớn hơn một lỗi thương mại điện tử thông thường. Dòng “không thay thế bác sĩ” không đủ để giải quyết mọi trách nhiệm.

**Cách xử lý:** không chẩn đoán bệnh; có ngưỡng cảnh báo; yêu cầu chuyên gia xác minh công thức/dữ liệu món; hiển thị độ bất định; lưu phiên bản công thức, model và nguồn dữ liệu; có quy trình xử lý sự cố.

### 3.4. Dữ liệu dinh dưỡng và hình ảnh khó chính xác

Ảnh không cho biết chắc khối lượng, dầu, gia vị hoặc cách chế biến. Ngay cả món cùng tên ở hai bếp cũng có thể khác đáng kể. Đối thủ lớn như MyFitnessPal đã dùng mô hình và kho thực phẩm quy mô lớn cho Meal Scan, nên đây không phải lợi thế dễ giành được.

**Cách xử lý:** coi kết quả ảnh là ước tính, yêu cầu người dùng xác nhận khẩu phần, ưu tiên dữ liệu công thức từ bếp và đo sai số bằng bộ dữ liệu có ground truth.

### 3.5. Ma sát nhập liệu và retention

Người dùng thường hào hứng vài ngày rồi ngừng ghi món, cân nặng hoặc check-in. Khi dữ liệu thiếu, cá nhân hóa giảm chất lượng, tạo vòng lặp tiêu cực.

**Cách xử lý:** giảm số câu hỏi, dùng khoảng ước lượng, tự ghi món từ đơn bếp, nhắc đúng thời điểm và đo “số ngày có dữ liệu hữu ích” thay vì chỉ đo đăng nhập.

### 3.6. Unit economics chưa được chứng minh

Subscription phải gánh chi phí AI, hỗ trợ và nội dung. Marketplace phải gánh thanh toán, hoàn tiền, chăm sóc khách hàng và có thể cả giao hàng. Nếu giá trị đơn thấp hoặc tần suất mua thấp, hoa hồng không đủ bù chi phí vận hành.

**Cách xử lý:** tách contribution margin của subscription và kitchen order; không gộp GMV với doanh thu; đo chi phí AI/user, take rate, tỷ lệ hoàn/hủy và hỗ trợ trên mỗi đơn.

### 3.7. Nguy cơ người dùng và bếp giao dịch ngoài nền tảng

Sau lần đầu kết nối, hai bên có thể trao đổi trực tiếp để tránh phí.

**Cách xử lý:** giữ giá trị chỉ có trên nền tảng như lịch nhiều ngày, đổi món có kiểm soát dị ứng, nhật ký tự động, bảo vệ thanh toán, hỗ trợ khiếu nại, báo cáo và công cụ vận hành cho bếp.

### 3.8. Hiện trạng chưa phải sản phẩm thương mại hoàn chỉnh

Tại thời điểm viết tài liệu:

- Subscription đang dùng Stripe Test Mode.
- Thanh toán đơn bếp còn là luồng mô phỏng.
- Nhiều bếp, món, đánh giá và dinh dưỡng là seed/mock.
- Meal Scan còn mô phỏng.
- Chưa có số liệu traction, retention và doanh thu thật được cung cấp.

Khi pitching phải gọi đây là **MVP kỹ thuật đang chuẩn bị pilot**, không trình bày như một marketplace đã vận hành thật.

## 4. Có thể chống sao chép không?

Không thể ngăn đối thủ sao chép màn hình, calorie calculator, chatbot hoặc luồng subscription. Mục tiêu thực tế là làm cho việc sao chép **kết quả, dữ liệu và năng lực vận hành** trở nên tốn kém.

### 4.1. Những phần dễ bị sao chép

| Thành phần | Mức phòng thủ |
|---|---|
| Giao diện dashboard, lịch, chat | Thấp |
| Công thức BMR/TDEE phổ biến | Rất thấp |
| Gọi Gemini và tạo insight | Thấp |
| Paywall và subscription | Thấp |
| Danh sách bếp thông thường | Thấp |

### 4.2. Các lớp lợi thế nên xây dựng

#### A. Dữ liệu món Việt đã kiểm chứng

Xây kho dữ liệu theo **công thức và khẩu phần thực tế**, không chỉ tên món: nguyên liệu, khối lượng, cách chế biến, dầu/gia vị, allergen, macro, vi chất và lịch sử thay đổi. Có chuyên gia hoặc quy trình kiểm định.

#### B. Dữ liệu kết quả theo thời gian

Với sự đồng ý của người dùng, liên kết kế hoạch → món thực tế → mức tuân thủ → thay đổi cân nặng/năng lượng. Phần có giá trị không phải thông tin định danh mà là tập mẫu đã làm sạch, ẩn danh và có nhãn chất lượng.

#### C. Hệ thống matching và evaluation

Giữ bí mật trọng số xếp hạng, pipeline kiểm tra dị ứng, bộ ca đánh giá, sai số dinh dưỡng và quy trình kiểm soát AI. Prompt riêng lẻ không phải moat; bộ dữ liệu đánh giá và phản hồi thật mới đáng giá.

#### D. Quan hệ và tích hợp độc quyền với bếp

Ký thỏa thuận về vùng phục vụ, menu độc quyền, SLA, dữ liệu dinh dưỡng, quyền sử dụng hình ảnh và chính sách đổi món. Tích hợp quy trình vận hành sâu khiến bếp khó rời bỏ hơn một listing đơn giản.

#### E. Network effect cục bộ

Nhiều người dùng trong một khu vực tạo nhu cầu ổn định cho bếp; nhiều đơn giúp chuẩn hóa món và đánh giá; dữ liệu tốt làm đề xuất chính xác hơn; đề xuất tốt lại tăng đơn. Network effect này phải được chứng minh theo từng quận, không nên tuyên bố trên phạm vi toàn quốc quá sớm.

#### F. Switching cost có lợi cho người dùng

Lịch sử dinh dưỡng, mục tiêu, món yêu thích, dị ứng, kế hoạch thích nghi và mối quan hệ với bếp tạo lý do ở lại. Cho phép xuất dữ liệu để duy trì niềm tin, nhưng khiến trải nghiệm tích lũy trên NutriPlan ngày càng tốt hơn.

#### G. Thương hiệu và độ tin cậy

Xây hội đồng cố vấn dinh dưỡng, quy chuẩn an toàn, minh bạch nguồn dữ liệu và công bố cách đo sai số. Trong sức khỏe, niềm tin và hồ sơ vận hành an toàn thường phòng thủ tốt hơn một tính năng AI mới.

#### H. Bảo vệ pháp lý và kỹ thuật

- Đăng ký nhãn hiệu NutriPlan và bảo vệ bộ nhận diện.
- Bản quyền cho nội dung, hình ảnh và phần mềm do đội tạo.
- Hợp đồng quy định quyền dữ liệu, bảo mật, không lôi kéo và SLA với bếp/đối tác.
- Dùng trade secret cho scoring, bộ đánh giá và quy trình vận hành.
- Chỉ cân nhắc bằng sáng chế nếu thật sự có giải pháp kỹ thuật mới; không kỳ vọng patent cho ý tưởng “AI đề xuất thực đơn”.
- Không đưa secret key, service role, prompt hệ thống hoặc logic đặc quyền xuống frontend.

## 5. Kế hoạch tạo lợi thế trong 90 ngày

1. Chọn một ICP, ví dụ nhân viên văn phòng 22–35 tuổi tại 1–2 quận, có mục tiêu giảm cân an toàn và thiếu thời gian nấu.
2. Tuyển 3–5 bếp, chuẩn hóa 30–50 món thật và ký quyền sử dụng dữ liệu/hình ảnh.
3. Nhờ chuyên gia kiểm tra nutrition, allergen và biên độ sai số của các món pilot.
4. Chạy pilot có thanh toán thật với 50–100 người; không tính tài khoản test.
5. Đo activation, D7/D30 retention, trial-to-paid, churn, số ngày ghi nhật ký và repeat kitchen order.
6. Tính contribution margin riêng cho Plus và đơn bếp.
7. Xây bộ evaluation AI/Meal Scan bằng dữ liệu có ground truth và lưu phiên bản kết quả.
8. Chốt SLA giao hàng, đổi món, hoàn tiền và xử lý dị ứng với bếp.
9. Xin consent dữ liệu rõ ràng, cho phép xuất/xóa và chỉ dùng dữ liệu ẩn danh cho cải thiện mô hình.
10. Ra quyết định sau pilot: ưu tiên subscription, marketplace hoặc mô hình kết hợp dựa trên doanh thu và retention thật.

## 6. Bộ câu hỏi nhà đầu tư thường hỏi

### A. Vấn đề và khách hàng

1. Khách hàng đầu tiên cụ thể của NutriPlan là ai?
2. Vấn đề đau nhất của họ là không biết ăn gì, không có thời gian nấu hay không duy trì được kế hoạch?
3. Họ đang giải quyết vấn đề bằng cách nào trước NutriPlan?
4. Vì sao các giải pháp hiện tại chưa đủ tốt?
5. Bạn đã phỏng vấn bao nhiêu khách hàng và hành vi nào chứng minh vấn đề có thật?
6. Người dùng cần sản phẩm này hằng ngày, hằng tuần hay chỉ khi muốn giảm cân?
7. “Khoảnh khắc nhận ra giá trị” đầu tiên xảy ra sau bao lâu?

### B. Thị trường và cạnh tranh

8. TAM, SAM và SOM của bạn được tính từ số người trả tiền nào, không phải từ tổng dân số?
9. Vì sao bắt đầu ở khu vực/phân khúc này?
10. Đối thủ trực tiếp và gián tiếp là ai?
11. Vì sao người dùng không dùng MyFitnessPal/Noom rồi đặt đồ ăn trên ứng dụng giao đồ ăn?
12. Vì sao bếp không tự làm website hoặc bán qua nền tảng giao đồ ăn hiện có?
13. Xu hướng nào khiến thời điểm hiện tại phù hợp?
14. Mở rộng sang quận hoặc thành phố mới cần những gì?

### C. Sản phẩm và giá trị

15. Tính năng nào là lý do chính khiến người dùng trả tiền?
16. AI làm phần nào và công thức xác định làm phần nào?
17. Điều gì xảy ra khi người dùng nhập thiếu hoặc nhập sai dữ liệu?
18. Làm sao đảm bảo thực đơn vẫn đủ dinh dưỡng khi đổi món?
19. Làm sao kiểm soát dị ứng và không dung nạp?
20. Meal Scan chính xác bao nhiêu và được đo trên bộ dữ liệu nào?
21. Insight có làm thay đổi hành vi hay chỉ tạo nội dung thú vị?
22. Tại sao cần cả subscription và marketplace trong cùng sản phẩm?
23. Nếu chỉ được giữ lại một chức năng, bạn giữ chức năng nào?

### D. Traction và hành vi

24. Có bao nhiêu người dùng thật, người dùng hoạt động tuần/tháng?
25. Tỷ lệ hoàn thành onboarding và tạo insight đầu tiên là bao nhiêu?
26. D1, D7 và D30 retention là bao nhiêu?
27. Bao nhiêu phần trăm trial chuyển thành trả phí?
28. Churn theo tháng và lý do hủy chính là gì?
29. Người dùng ghi nhật ký bao nhiêu ngày mỗi tuần?
30. Bao nhiêu khách đặt lại gói bếp trong 30 ngày?
31. Có bao nhiêu bếp thật, bao nhiêu bếp đang nhận đơn và bao nhiêu bếp chỉ là dữ liệu mẫu?
32. GMV, doanh thu thuần và số giao dịch thật là bao nhiêu?

### E. Mô hình kinh doanh và unit economics

33. Giá Plus được xác định như thế nào?
34. Take rate trên đơn bếp là bao nhiêu?
35. Gross margin của subscription và contribution margin của đơn bếp là bao nhiêu?
36. Chi phí Gemini/AI trung bình trên một user trả phí là bao nhiêu?
37. CAC theo từng kênh và thời gian hoàn vốn là bao lâu?
38. LTV dựa trên dữ liệu cohort thật hay giả định?
39. Ai chịu phí giao, hoàn tiền, khuyến mãi và đơn thất bại?
40. Khi không còn trợ giá, người dùng còn mua không?
41. Subscription có làm tăng tần suất mua bếp hay hai luồng không liên quan?
42. Doanh thu marketplace có đủ bù chi phí hỗ trợ và vận hành không?

### F. Bếp và vận hành

43. Tiêu chí tuyển và xác minh bếp là gì?
44. Ai chịu trách nhiệm nếu món sai dị ứng hoặc dinh dưỡng?
45. Làm sao biết bếp thực sự nấu đúng công thức đã khai báo?
46. SLA giao hàng và tỷ lệ giao đúng giờ mục tiêu là bao nhiêu?
47. Bếp xử lý đổi món, tạm dừng, hoàn tiền và khiếu nại thế nào?
48. Một nhân sự vận hành có thể quản lý bao nhiêu bếp/đơn?
49. Làm sao ngăn người dùng và bếp giao dịch ngoài nền tảng?
50. Nếu một bếp ngừng hoạt động giữa gói 30/120 ngày thì xử lý ra sao?

### G. Moat và khả năng sao chép

51. Đối thủ có thể sao chép phần nào trong ba tháng?
52. Tài sản nào của NutriPlan sẽ khó sao chép sau hai năm?
53. Dữ liệu độc quyền đến từ đâu và NutriPlan có quyền sử dụng dữ liệu đó không?
54. Có hợp đồng độc quyền hoặc SLA với bếp không?
55. Network effect có thật hay mới là giả thuyết?
56. Tại sao một nền tảng giao đồ ăn lớn không thêm bộ lọc dinh dưỡng và đánh bại bạn?

### H. Công nghệ, AI và dữ liệu

57. Hệ thống xử lý một yêu cầu insight như thế nào?
58. Làm sao phát hiện hallucination hoặc output nguy hiểm?
59. Có bao nhiêu ca evaluation và tiêu chí pass/fail là gì?
60. Nếu Gemini ngừng hoạt động hoặc tăng giá thì sao?
61. Chi phí và độ trễ khi số người dùng tăng 100 lần là bao nhiêu?
62. Dữ liệu sức khỏe được mã hóa, phân quyền, sao lưu và xóa như thế nào?
63. Làm sao ngăn người dùng đọc hồ sơ hoặc đơn của người khác?
64. Những phần nào còn mock, test mode hoặc chưa nối end-to-end?
65. Khi nào hệ thống sẵn sàng xử lý tiền thật cho đơn bếp?

### I. Pháp lý và an toàn

66. NutriPlan là sản phẩm wellness hay sản phẩm y tế?
67. Những tuyên bố nào NutriPlan tuyệt đối không đưa ra?
68. Bạn xử lý người có thai, bệnh nền, rối loạn ăn uống hoặc mục tiêu cực đoan thế nào?
69. Ai sở hữu dữ liệu sức khỏe và dữ liệu món ăn?
70. Người dùng có thể rút consent, tải xuống và xóa dữ liệu không?
71. Có bảo hiểm hoặc cơ chế phân bổ trách nhiệm với bếp không?

### J. Đội ngũ và gọi vốn

72. Vì sao hai nhà sáng lập là đội phù hợp để giải bài toán này?
73. Năng lực còn thiếu lớn nhất là dinh dưỡng, growth hay vận hành bếp?
74. Ai chịu trách nhiệm sản phẩm, kỹ thuật, bán hàng và vận hành?
75. Bạn muốn gọi bao nhiêu vốn và runway bao lâu?
76. Tiền sẽ được dùng cho những mốc đo lường nào?
77. Ba chỉ số nào phải đạt trước vòng gọi vốn tiếp theo?
78. Giả thuyết nào nếu sai sẽ khiến bạn dừng hoặc đổi hướng?
79. Nếu marketplace tăng trưởng nhưng subscription không tăng, bạn sẽ làm gì?
80. Nếu subscription tốt nhưng bếp gây lỗ, bạn có sẵn sàng bỏ marketplace không?

## 7. Những câu hỏi khó và khung trả lời đề xuất

### “Đây có phải chỉ là calorie calculator + ChatGPT + giao đồ ăn không?”

> Từng thành phần riêng lẻ không mới. Giá trị NutriPlan nằm ở việc kết nối hồ sơ dinh dưỡng với cả kế hoạch tự nấu và năng lực thực tế của bếp, rồi đưa món đã ăn trở lại cùng một vòng theo dõi. Điều chúng tôi cần chứng minh trong pilot không phải số lượng tính năng, mà là việc vòng lặp này tạo retention, kết quả và giao dịch tốt hơn dùng ba công cụ rời rạc.

### “Điều gì ngăn Grab, MyFitnessPal hoặc một đối thủ khác sao chép?”

> Không có gì ngăn họ sao chép giao diện. Lợi thế chúng tôi đang xây là dữ liệu món Việt theo công thức/khẩu phần thật, tích hợp vận hành với bếp, lịch sử kết quả có consent và hệ thống matching được đánh giá bằng dữ liệu thật. Chúng tôi bắt đầu theo một khu vực hẹp để tạo mật độ và chất lượng trước khi mở rộng.

### “Bạn là SaaS hay marketplace?”

> Hiện tại chúng tôi đang kiểm chứng hai giả thuyết độc lập. Subscription bán giá trị số; marketplace giải quyết hành động thực tế. Sau pilot, retention và contribution margin sẽ quyết định mô hình nào là mũi nhọn. Chúng tôi không giả định trước rằng cả hai đều phải tồn tại ở quy mô lớn.

### “AI có thực sự cần thiết không?”

> Công thức xác định tạo ra số liệu nền; AI chuyển dữ liệu thành giải thích và câu hỏi dễ hành động. Chúng tôi đo AI bằng tỷ lệ người dùng hiểu insight, thực hiện hành động và quay lại, không bằng độ dài câu trả lời. Nếu AI không cải thiện các chỉ số đó, chúng tôi sẽ giảm vai trò hoặc chi phí của nó.

### “Bạn đã có doanh thu chưa?”

Khung trả lời hiện tại phải trung thực:

> Chúng tôi đã hoàn thành MVP kỹ thuật và luồng Stripe ở Test Mode; thanh toán bếp còn mô phỏng. Chúng tôi chưa gọi test transaction hoặc seed data là doanh thu. Mốc tiếp theo là pilot có thanh toán thật với một nhóm khách và bếp giới hạn để đo conversion, retention và contribution margin.

### “Số liệu dinh dưỡng sai thì sao?”

> Chúng tôi tách công thức xác định khỏi AI, lưu phiên bản dữ liệu, hiển thị giới hạn của kết quả và không chẩn đoán. Trong pilot, món bếp phải có công thức/khẩu phần được kiểm tra; Meal Scan chỉ là ước tính có xác nhận. Các trường hợp rủi ro được chặn hoặc chuyển sang khuyến nghị gặp chuyên gia.

## 8. Các số liệu phải chuẩn bị trước khi gặp nhà đầu tư

Không nên đi pitching chính thức nếu chưa có tối thiểu:

- Số người được phỏng vấn và ba vấn đề xuất hiện nhiều nhất.
- Funnel: truy cập → đăng ký → hoàn thành hồ sơ → nhận insight → trial → trả phí.
- D1/D7/D30 retention theo cohort.
- Trial-to-paid, churn và lý do hủy.
- Số bếp thật/active, số đơn thật, repeat order và giao đúng giờ.
- Giá trị đơn trung bình, take rate, hoàn/hủy và contribution margin.
- CAC thử nghiệm theo từng kênh.
- Chi phí AI trên mỗi active/paid user.
- Kết quả bộ evaluation về nutrition, allergen và AI safety.
- Phân biệt rõ dữ liệu thật, seed/mock, test payment và doanh thu thật.

## 9. Tài liệu tham khảo

- WHO nhấn mạnh chế độ ăn cần phù hợp đặc điểm cá nhân, mức vận động, bối cảnh và thực phẩm địa phương: <https://www.who.int/vietnam/news/fact-sheets/detail/healthy-diet>
- WHO/MOH Viet Nam STEPS 2021 theo dõi các rủi ro gồm chế độ ăn, thiếu vận động, thừa cân, huyết áp, đường huyết và lipid: <https://www.who.int/westernpacific/publications/i/item/9789290620266>
- MyFitnessPal Meal Scan sử dụng computer vision và kho thực phẩm của họ, cho thấy bản thân tính năng quét ảnh không phải moat riêng: <https://support.myfitnesspal.com/hc/en-us/articles/360045761612-Meal-Scan-FAQ>
- Stripe Connect hỗ trợ mô hình marketplace thu phí theo giao dịch và subscription độc lập: <https://docs.stripe.com/connect/saas-platforms-and-marketplaces>

