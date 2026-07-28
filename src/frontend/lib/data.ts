export type Meal = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
};

export type DayPlan = {
  day: string;
  date: string;
  meals: { slot: "Sáng" | "Trưa" | "Tối"; meal: Meal }[];
};

export type KitchenOffer = {
  id: string;
  kitchen: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  oldPrice?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  delivery: string;
  badge: string;
  type: "Món lẻ" | "Gói 7 ngày" | "Gói 30 ngày" | "Gói 120 ngày";
  durationDays: 1 | 7 | 30 | 120;
  mealsPerDay: number;
  location: string;
  distanceKm: number;
  dietTypes: string[];
  menuHighlights: string[];
  included: string[];
  comments: {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
    verified: boolean;
  }[];
};

export const meals: Meal[] = [
  {
    id: "oat-bowl",
    name: "Yến mạch xoài sữa chua",
    subtitle: "Bữa sáng giàu chất xơ, dễ chuẩn bị",
    image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1200&q=85",
    calories: 428,
    protein: 22,
    carbs: 61,
    fat: 11,
    prepTime: 10,
    ingredients: ["60g yến mạch", "150g sữa chua Hy Lạp", "100g xoài", "10g hạt chia"],
    instructions: ["Ngâm yến mạch với 80ml nước trong 5 phút.", "Thêm sữa chua, xoài cắt nhỏ và hạt chia.", "Trộn đều và dùng lạnh."],
    tags: ["Nhanh", "Nhiều chất xơ"]
  },
  {
    id: "chicken-rice",
    name: "Ức gà áp chảo & cơm gạo lứt",
    subtitle: "Cân bằng đạm nạc và tinh bột chậm",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=85",
    calories: 612,
    protein: 48,
    carbs: 67,
    fat: 17,
    prepTime: 30,
    ingredients: ["170g ức gà", "150g cơm gạo lứt", "120g bông cải", "8g dầu ô-liu"],
    instructions: ["Ướp gà với tiêu, tỏi và một ít muối trong 10 phút.", "Áp chảo mỗi mặt 5–6 phút.", "Luộc bông cải và dùng cùng cơm gạo lứt."],
    tags: ["Giàu protein", "Tăng cơ"]
  },
  {
    id: "salmon-salad",
    name: "Salad cá hồi sốt chanh",
    subtitle: "Omega-3, rau xanh và chất béo tốt",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85",
    calories: 536,
    protein: 38,
    carbs: 32,
    fat: 29,
    prepTime: 25,
    ingredients: ["150g cá hồi", "180g rau xà lách", "80g khoai tây", "10ml sốt chanh"],
    instructions: ["Áp chảo cá hồi 4 phút mỗi mặt.", "Luộc khoai tây và cắt miếng vừa ăn.", "Trộn rau với sốt chanh rồi đặt cá hồi lên trên."],
    tags: ["Omega-3", "Ít tinh bột"]
  },
  {
    id: "avocado-toast",
    name: "Bánh mì bơ & trứng lòng đào",
    subtitle: "Bữa sáng nhẹ, đủ năng lượng",
    image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=1200&q=85",
    calories: 450,
    protein: 21,
    carbs: 41,
    fat: 24,
    prepTime: 15,
    ingredients: ["2 lát bánh mì nguyên cám", "1/2 quả bơ", "2 quả trứng", "50g cà chua bi"],
    instructions: ["Nướng bánh mì đến khi giòn nhẹ.", "Nghiền bơ, nêm tiêu và phết lên bánh.", "Luộc trứng 6 phút rồi dùng cùng cà chua."],
    tags: ["15 phút", "Chất béo tốt"]
  },
  {
    id: "beef-noodle",
    name: "Bún bò rau củ ít béo",
    subtitle: "Phiên bản nhẹ bụng cho ngày bận rộn",
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=85",
    calories: 584,
    protein: 42,
    carbs: 72,
    fat: 15,
    prepTime: 35,
    ingredients: ["140g thịt bò nạc", "160g bún", "150g rau củ", "300ml nước dùng"],
    instructions: ["Nấu nước dùng với hành và gừng nướng.", "Chần thịt bò và rau vừa chín.", "Xếp bún, rau, thịt rồi chan nước dùng."],
    tags: ["No lâu", "Ít dầu"]
  },
  {
    id: "tofu-bowl",
    name: "Đậu hũ teriyaki & quinoa",
    subtitle: "Lựa chọn thực vật giàu đạm",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85",
    calories: 498,
    protein: 28,
    carbs: 58,
    fat: 19,
    prepTime: 25,
    ingredients: ["180g đậu hũ", "120g quinoa chín", "150g rau củ", "15ml sốt teriyaki"],
    instructions: ["Ép ráo và áp chảo đậu hũ.", "Xào nhanh rau củ để giữ độ giòn.", "Dùng cùng quinoa và sốt teriyaki."],
    tags: ["Thuần thực vật", "Giàu đạm"]
  }
];

export const weekPlan: DayPlan[] = [
  { day: "Thứ hai", date: "15/07", meals: [{ slot: "Sáng", meal: meals[0] }, { slot: "Trưa", meal: meals[1] }, { slot: "Tối", meal: meals[2] }] },
  { day: "Thứ ba", date: "16/07", meals: [{ slot: "Sáng", meal: meals[3] }, { slot: "Trưa", meal: meals[4] }, { slot: "Tối", meal: meals[5] }] },
  { day: "Thứ tư", date: "17/07", meals: [{ slot: "Sáng", meal: meals[0] }, { slot: "Trưa", meal: meals[2] }, { slot: "Tối", meal: meals[1] }] },
  { day: "Thứ năm", date: "18/07", meals: [{ slot: "Sáng", meal: meals[3] }, { slot: "Trưa", meal: meals[5] }, { slot: "Tối", meal: meals[4] }] },
  { day: "Thứ sáu", date: "19/07", meals: [{ slot: "Sáng", meal: meals[0] }, { slot: "Trưa", meal: meals[1] }, { slot: "Tối", meal: meals[5] }] },
  { day: "Thứ bảy", date: "20/07", meals: [{ slot: "Sáng", meal: meals[3] }, { slot: "Trưa", meal: meals[4] }, { slot: "Tối", meal: meals[2] }] },
  { day: "Chủ nhật", date: "21/07", meals: [{ slot: "Sáng", meal: meals[0] }, { slot: "Trưa", meal: meals[2] }, { slot: "Tối", meal: meals[5] }] }
];
