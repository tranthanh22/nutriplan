import type { KitchenOffer } from "@/lib/data";

type OfferSeed = Omit<KitchenOffer, "comments">;

const reviewAuthors = ["Minh Anh", "Hoàng Nam", "Thu Hà", "Quốc Bảo", "Ngọc Linh", "Gia Huy"];
const reviewTexts = [
  "Khẩu phần vừa đủ, đóng gói sạch và thông tin dinh dưỡng khá sát với mục tiêu của mình.",
  "Món thay đổi đều, giao đúng khung giờ. Mình thích nhất là bếp ghi rõ calorie và protein.",
  "Vị vừa ăn, rau còn tươi. Bếp hỗ trợ đổi món khi mình báo dị ứng rất nhanh.",
  "Theo gói được vài tuần thấy đỡ phải suy nghĩ ăn gì, cân nặng cũng ổn định hơn.",
  "Chất lượng ổn so với giá, phần đạm nhiều và không bị quá dầu như đồ ăn ngoài.",
  "Có vài hôm giao trễ khoảng 10 phút nhưng bếp chủ động báo, tổng thể vẫn đáng mua."
];

function withComments(seed: OfferSeed, index: number): KitchenOffer {
  return {
    ...seed,
    comments: Array.from({ length: 3 }, (_, commentIndex) => ({
      id: `${seed.id}-review-${commentIndex + 1}`,
      author: reviewAuthors[(index + commentIndex) % reviewAuthors.length],
      rating: commentIndex === 2 && index % 4 === 0 ? 4 : 5,
      date: `${12 + commentIndex}/07/2026`,
      comment: reviewTexts[(index * 2 + commentIndex) % reviewTexts.length],
      verified: true
    }))
  };
}

const offerSeeds: OfferSeed[] = [
  {
    id: "fitbox-balance-7", kitchen: "FitBox Kitchen", title: "Balance Lunch · 7 ngày",
    description: "Bữa trưa cân bằng, đổi món mỗi ngày và định lượng rõ ràng.",
    image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9, reviews: 312, price: 469000, oldPrice: 525000, calories: 580, protein: 42, carbs: 61, fat: 18,
    delivery: "11:00–12:00 · Miễn phí 3 km", badge: "Bán chạy", type: "Gói 7 ngày", durationDays: 7, mealsPerDay: 1,
    location: "Quận 3", distanceKm: 1.8, dietTypes: ["Cân bằng", "Giàu protein"],
    menuHighlights: ["Gà nướng thảo mộc", "Cá basa sốt chanh dây", "Bò xào rau củ"],
    included: ["7 bữa trưa", "Đổi 1 món miễn phí", "Tư vấn khẩu phần"]
  },
  {
    id: "green-bowl-single", kitchen: "Green Bowl", title: "Cơm gà gạo lứt sốt tiêu",
    description: "Ức gà áp chảo, gạo lứt, bông cải và sốt tiêu đen ít đường.",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8, reviews: 186, price: 69000, calories: 605, protein: 46, carbs: 67, fat: 17,
    delivery: "35–45 phút", badge: "Giàu protein", type: "Món lẻ", durationDays: 1, mealsPerDay: 1,
    location: "Quận 1", distanceKm: 2.4, dietTypes: ["Giàu protein", "Ít đường"],
    menuHighlights: ["Ức gà tiêu đen", "Gạo lứt hạt dài", "Bông cải hấp"],
    included: ["1 phần ăn", "Sốt riêng", "Bộ muỗng nĩa"]
  },
  {
    id: "lean-lab-cut-30", kitchen: "Lean Lab", title: "Lean Cut · 30 ngày",
    description: "Hai bữa chính mỗi ngày cho mục tiêu giảm mỡ bền vững.",
    image: "/images/figma/chicken-vegetable-bowl.jpg",
    rating: 4.9, reviews: 248, price: 3290000, oldPrice: 3690000, calories: 1250, protein: 105, carbs: 128, fat: 36,
    delivery: "2 lần/ngày · Miễn phí 5 km", badge: "Giảm mỡ", type: "Gói 30 ngày", durationDays: 30, mealsPerDay: 2,
    location: "Quận Bình Thạnh", distanceKm: 3.2, dietTypes: ["Giảm mỡ", "Giàu protein", "Ít dầu"],
    menuHighlights: ["Cá hồi khoai nghiền", "Bò áp chảo quinoa", "Gà teriyaki ít đường"],
    included: ["60 bữa chính", "Điều chỉnh calorie", "Theo dõi hằng tuần"]
  },
  {
    id: "an-lanh-vegan-7", kitchen: "An Lành Vegan", title: "Plant Power · 7 ngày",
    description: "Thực đơn thuần chay đủ đạm từ đậu, nấm và ngũ cốc nguyên hạt.",
    image: "/images/figma/chicken-salad.jpg",
    rating: 4.7, reviews: 96, price: 799000, calories: 1450, protein: 62, carbs: 188, fat: 48,
    delivery: "06:30–07:30 · 11:00–12:00", badge: "Thuần chay", type: "Gói 7 ngày", durationDays: 7, mealsPerDay: 2,
    location: "Quận 7", distanceKm: 5.1, dietTypes: ["Thuần chay", "Nhiều chất xơ"],
    menuHighlights: ["Đậu hũ quinoa", "Bún nấm rau củ", "Cà ri đậu gà"],
    included: ["14 bữa", "Sữa hạt 3 ngày", "Không dùng bột ngọt"]
  },
  {
    id: "keto-house-30", kitchen: "Keto House", title: "Keto Reset · 30 ngày",
    description: "Thực đơn low-carb kiểm soát tinh bột, ưu tiên chất béo tốt.",
    image: "/images/figma/auth-healthy-food.jpg",
    rating: 4.8, reviews: 175, price: 3890000, oldPrice: 4250000, calories: 1550, protein: 110, carbs: 42, fat: 105,
    delivery: "Giao một lần trước 10:30", badge: "Low-carb", type: "Gói 30 ngày", durationDays: 30, mealsPerDay: 2,
    location: "Quận 2", distanceKm: 4.7, dietTypes: ["Keto", "Low-carb", "Không đường"],
    menuHighlights: ["Cá hồi bơ tỏi", "Gà cuộn phô mai", "Bò nấm sốt kem"],
    included: ["60 bữa", "Snack keto 10 ngày", "Bảng macro hằng ngày"]
  },
  {
    id: "mom-kitchen-single", kitchen: "Mom's Healthy Kitchen", title: "Cá thu Nhật sốt cà & rau luộc",
    description: "Bữa cơm nhà ít muối với cá thu, gạo lứt và rau theo mùa.",
    image: "/images/figma/grilled-salmon.jpg",
    rating: 4.6, reviews: 73, price: 79000, calories: 560, protein: 36, carbs: 58, fat: 21,
    delivery: "40–55 phút", badge: "Cơm nhà", type: "Món lẻ", durationDays: 1, mealsPerDay: 1,
    location: "Quận 5", distanceKm: 3.9, dietTypes: ["Cân bằng", "Ít muối"],
    menuHighlights: ["Cá thu sốt cà", "Gạo lứt", "Rau luộc kho quẹt nhạt"],
    included: ["1 phần ăn", "Canh rau", "Trái cây nhỏ"]
  },
  {
    id: "muscle-fuel-120", kitchen: "Muscle Fuel", title: "Mass Builder · 120 ngày",
    description: "Gói dài hạn ba bữa/ngày dành cho người tập tăng cơ.",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9, reviews: 289, price: 18900000, oldPrice: 21400000, calories: 2450, protein: 175, carbs: 286, fat: 68,
    delivery: "2 chuyến/ngày · Miễn phí 8 km", badge: "Tăng cơ", type: "Gói 120 ngày", durationDays: 120, mealsPerDay: 3,
    location: "Quận 10", distanceKm: 4.2, dietTypes: ["Tăng cơ", "Giàu protein"],
    menuHighlights: ["Bò steak khoai tây", "Gà nướng pasta", "Cá hồi cơm Nhật"],
    included: ["360 bữa", "4 lần điều chỉnh macro", "Snack protein mỗi ngày"]
  },
  {
    id: "medifood-7", kitchen: "MediFood Care", title: "Healthy Heart · 7 ngày",
    description: "Bữa ăn ít muối, ít chất béo bão hòa và giàu rau xanh.",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8, reviews: 114, price: 1190000, calories: 1500, protein: 78, carbs: 174, fat: 52,
    delivery: "07:00–08:00 · 11:00–12:00", badge: "Ít muối", type: "Gói 7 ngày", durationDays: 7, mealsPerDay: 3,
    location: "Quận Phú Nhuận", distanceKm: 2.8, dietTypes: ["Ít muối", "Cân bằng"],
    menuHighlights: ["Cá hấp gừng", "Gà hầm rau củ", "Cháo yến mạch"],
    included: ["21 bữa", "Nhãn sodium mỗi món", "Tùy chọn cháo mềm"]
  },
  {
    id: "office-bite-30", kitchen: "Office Bite", title: "Smart Lunch · 30 ngày",
    description: "Bữa trưa văn phòng gọn nhẹ, giao theo cụm tòa nhà.",
    image: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=85",
    rating: 4.6, reviews: 205, price: 1690000, oldPrice: 1890000, calories: 620, protein: 38, carbs: 72, fat: 20,
    delivery: "10:45–11:45 · Thứ 2–6", badge: "Văn phòng", type: "Gói 30 ngày", durationDays: 30, mealsPerDay: 1,
    location: "Quận 1", distanceKm: 1.2, dietTypes: ["Cân bằng", "Văn phòng"],
    menuHighlights: ["Cơm gà Hội An fit", "Bún bò ít béo", "Mì Ý bò bằm"],
    included: ["22 bữa ngày làm việc", "Giao tận lễ tân", "Đổi lịch trước 20:00"]
  },
  {
    id: "salad-stop-single", kitchen: "Salad Stop Mini", title: "Salad tôm bơ sốt chanh",
    description: "Rau giòn, tôm áp chảo, bơ và sốt chanh tươi đóng riêng.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85",
    rating: 4.7, reviews: 88, price: 89000, calories: 455, protein: 31, carbs: 29, fat: 26,
    delivery: "25–35 phút", badge: "Tươi trong ngày", type: "Món lẻ", durationDays: 1, mealsPerDay: 1,
    location: "Quận 4", distanceKm: 2.9, dietTypes: ["Low-carb", "Pescatarian"],
    menuHighlights: ["Tôm áp chảo", "Bơ sáp", "Rau rocket"],
    included: ["1 salad", "Sốt đóng riêng", "Bánh mì nguyên cám"]
  },
  {
    id: "eat-clean-120", kitchen: "Eat Clean Sài Gòn", title: "Lifestyle 120",
    description: "Gói duy trì thói quen bốn tháng với thực đơn luân phiên 28 ngày.",
    image: "/images/figma/healthy-meal-spread.jpg",
    rating: 4.8, reviews: 267, price: 12900000, oldPrice: 14800000, calories: 1750, protein: 112, carbs: 190, fat: 55,
    delivery: "2 chuyến/ngày · Nghỉ Chủ nhật", badge: "Giá tốt dài hạn", type: "Gói 120 ngày", durationDays: 120, mealsPerDay: 2,
    location: "Quận Tân Bình", distanceKm: 6.2, dietTypes: ["Eat clean", "Cân bằng"],
    menuHighlights: ["Gà cajun gạo lứt", "Cá dory sốt xoài", "Bò nướng bí đỏ"],
    included: ["208 bữa", "Tạm dừng tối đa 14 ngày", "Đánh giá khẩu phần mỗi tháng"]
  },
  {
    id: "bep-nha-minh-7", kitchen: "Bếp Nhà Mình", title: "Cơm nhà lành mạnh · 7 ngày",
    description: "Món Việt quen thuộc, giảm dầu và nêm nhạt vừa phải.",
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=85",
    rating: 4.7, reviews: 142, price: 549000, calories: 650, protein: 35, carbs: 78, fat: 22,
    delivery: "10:30–11:30", badge: "Vị Việt", type: "Gói 7 ngày", durationDays: 7, mealsPerDay: 1,
    location: "Quận Gò Vấp", distanceKm: 7.3, dietTypes: ["Cơm nhà", "Ít dầu"],
    menuHighlights: ["Thịt nạc kho trứng", "Cá diêu hồng hấp", "Canh chua tôm"],
    included: ["7 bữa trưa", "Canh mỗi ngày", "Tráng miệng 3 ngày"]
  },
  {
    id: "macro-lab-30", kitchen: "Macro Lab", title: "Macro Precision · 30 ngày",
    description: "Tùy chỉnh mức 1.500–2.200 kcal và theo dõi macro theo mục tiêu.",
    image: "https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9, reviews: 157, price: 4590000, calories: 1850, protein: 135, carbs: 205, fat: 54,
    delivery: "Giao sáng toàn bộ khẩu phần", badge: "Tùy chỉnh macro", type: "Gói 30 ngày", durationDays: 30, mealsPerDay: 3,
    location: "Quận 7", distanceKm: 5.8, dietTypes: ["Tùy chỉnh macro", "Thể thao"],
    menuHighlights: ["Turkey rice bowl", "Beef burrito fit", "Protein pancake"],
    included: ["90 bữa", "Chọn mức calorie", "Báo cáo macro tuần"]
  },
  {
    id: "paleo-corner-single", kitchen: "Paleo Corner", title: "Bò nướng bí đỏ & hạt",
    description: "Bữa paleo không ngũ cốc, ưu tiên thực phẩm nguyên bản.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
    rating: 4.5, reviews: 48, price: 109000, calories: 610, protein: 44, carbs: 38, fat: 31,
    delivery: "35–50 phút", badge: "Paleo", type: "Món lẻ", durationDays: 1, mealsPerDay: 1,
    location: "Quận 2", distanceKm: 4.1, dietTypes: ["Paleo", "Không gluten"],
    menuHighlights: ["Bò nướng", "Bí đỏ", "Hạt điều rang"],
    included: ["1 phần ăn", "Sốt thảo mộc", "Không ngũ cốc"]
  },
  {
    id: "fresh-day-7", kitchen: "Fresh Day", title: "Detox Balance · 7 ngày",
    description: "Bữa nhẹ giàu rau, trái cây và protein vừa đủ; không ép cân cực đoan.",
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=85",
    rating: 4.6, reviews: 91, price: 1390000, calories: 1350, protein: 72, carbs: 172, fat: 40,
    delivery: "06:00–07:00", badge: "Nhiều rau", type: "Gói 7 ngày", durationDays: 7, mealsPerDay: 3,
    location: "Quận 6", distanceKm: 6.9, dietTypes: ["Nhiều chất xơ", "Ít chế biến"],
    menuHighlights: ["Overnight oat", "Gỏi cuốn tôm", "Soup bí đỏ gà"],
    included: ["21 bữa", "7 chai nước rau quả", "Không đường tinh luyện"]
  },
  {
    id: "homefit-30", kitchen: "HomeFit Meals", title: "Family Fit · 30 ngày",
    description: "Gói hai người với khẩu phần lành mạnh, phù hợp gia đình bận rộn.",
    image: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8, reviews: 133, price: 5490000, oldPrice: 5990000, calories: 1650, protein: 98, carbs: 185, fat: 58,
    delivery: "16:30–18:00", badge: "Cho 2 người", type: "Gói 30 ngày", durationDays: 30, mealsPerDay: 2,
    location: "Thành phố Thủ Đức", distanceKm: 8.4, dietTypes: ["Gia đình", "Cân bằng"],
    menuHighlights: ["Gà quay rau củ", "Cá kho tộ fit", "Mì udon bò"],
    included: ["120 khẩu phần", "Giao một lần buổi chiều", "Tạm dừng 5 ngày"]
  },
  {
    id: "diabetic-friendly-120", kitchen: "Đường Lành", title: "Glycemic Care · 120 ngày",
    description: "Thực đơn kiểm soát tải đường huyết, khẩu phần tinh bột rõ ràng.",
    image: "https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=1200&q=85",
    rating: 4.8, reviews: 102, price: 16800000, calories: 1600, protein: 92, carbs: 145, fat: 62,
    delivery: "2 chuyến/ngày", badge: "Kiểm soát đường", type: "Gói 120 ngày", durationDays: 120, mealsPerDay: 3,
    location: "Quận Phú Nhuận", distanceKm: 3.1, dietTypes: ["Ít đường", "GI thấp"],
    menuHighlights: ["Cá hấp miến dong", "Gà nấm gạo lứt", "Đậu hũ non rau củ"],
    included: ["360 bữa", "Nhãn carb từng bữa", "Điều chỉnh khẩu phần mỗi tháng"]
  },
  {
    id: "bep-bien-single", kitchen: "Bếp Biển Xanh", title: "Cá hồi áp chảo sốt chanh",
    description: "Cá hồi, khoai tây bi và salad theo mùa giàu omega-3.",
    image: "/images/figma/grilled-salmon.jpg",
    rating: 4.7, reviews: 121, price: 119000, calories: 536, protein: 38, carbs: 32, fat: 29,
    delivery: "40–50 phút", badge: "Omega-3", type: "Món lẻ", durationDays: 1, mealsPerDay: 1,
    location: "Quận 8", distanceKm: 7.6, dietTypes: ["Pescatarian", "Low-carb"],
    menuHighlights: ["Cá hồi Na Uy", "Khoai tây bi", "Salad sốt chanh"],
    included: ["1 phần ăn", "Sốt đóng riêng", "Soup trong ngày"]
  },
  {
    id: "gluten-free-7", kitchen: "Free From Kitchen", title: "Gluten-Free Week",
    description: "Gói không gluten với nguyên liệu và khu sơ chế được tách riêng.",
    image: "/images/figma/auth-healthy-food.jpg",
    rating: 4.8, reviews: 79, price: 1690000, calories: 1550, protein: 88, carbs: 166, fat: 59,
    delivery: "07:00–08:00 · 11:00–12:00", badge: "Không gluten", type: "Gói 7 ngày", durationDays: 7, mealsPerDay: 3,
    location: "Quận Bình Thạnh", distanceKm: 3.6, dietTypes: ["Không gluten", "Cân bằng"],
    menuHighlights: ["Bánh kê trứng", "Cơm gà sốt nấm", "Mì gạo cá nướng"],
    included: ["21 bữa", "Khu sơ chế riêng", "Nhãn dị ứng rõ ràng"]
  },
  {
    id: "senior-meal-30", kitchen: "Bếp An Nhiên", title: "Dinh dưỡng tuổi vàng · 30 ngày",
    description: "Món mềm, dễ nhai, nêm nhạt và phân bổ đạm phù hợp người lớn tuổi.",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85",
    rating: 4.9, reviews: 138, price: 4190000, calories: 1500, protein: 82, carbs: 168, fat: 55,
    delivery: "06:30–07:30 · 10:30–11:30", badge: "Món mềm", type: "Gói 30 ngày", durationDays: 30, mealsPerDay: 3,
    location: "Quận Tân Phú", distanceKm: 8.1, dietTypes: ["Món mềm", "Ít muối"],
    menuHighlights: ["Cháo cá hồi", "Gà hầm củ sen", "Cá basa hấp gừng"],
    included: ["90 bữa", "Cháo thay thế theo yêu cầu", "Gọi xác nhận giao mỗi ngày"]
  }
];

export const kitchenOffers = offerSeeds.map(withComments);

export const kitchenLocations = Array.from(
  new Set(kitchenOffers.map((offer) => offer.location)),
).sort();
export const kitchenDietTypes = Array.from(
  new Set(kitchenOffers.flatMap((offer) => offer.dietTypes)),
).sort();
