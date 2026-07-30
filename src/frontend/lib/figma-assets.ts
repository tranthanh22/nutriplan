const FIGMA_MEAL_IMAGES = {
  oatmeal: "/images/figma/oatmeal-fruit.jpg",
  chickenBowl: "/images/figma/chicken-vegetable-bowl.jpg",
  salad: "/images/figma/chicken-salad.jpg",
  pho: "/images/figma/pho-beef.jpg",
  salmon: "/images/figma/grilled-salmon.jpg",
  noodle: "/images/figma/chicken-noodle.jpg",
  spread: "/images/figma/healthy-meal-spread.jpg"
} as const;

export const figmaAssets = {
  ...FIGMA_MEAL_IMAGES,
  auth: "/images/figma/auth-healthy-food.jpg"
} as const;

export function resolveFigmaMealImage(name: string, image?: string | null) {
  const normalized = name.toLocaleLowerCase("vi");

  if (normalized.includes("yến mạch") || normalized.includes("oat")) {
    return FIGMA_MEAL_IMAGES.oatmeal;
  }
  if (
    normalized.includes("cá hồi") ||
    normalized.includes("salmon") ||
    normalized.includes("cá thu")
  ) {
    return FIGMA_MEAL_IMAGES.salmon;
  }
  if (normalized.includes("phở")) {
    return FIGMA_MEAL_IMAGES.pho;
  }
  if (
    normalized.includes("bún") ||
    normalized.includes("mì") ||
    normalized.includes("noodle")
  ) {
    return FIGMA_MEAL_IMAGES.noodle;
  }
  if (
    normalized.includes("salad") ||
    normalized.includes("rau") ||
    normalized.includes("chay") ||
    normalized.includes("đậu")
  ) {
    return FIGMA_MEAL_IMAGES.salad;
  }
  if (normalized.includes("gà")) {
    return FIGMA_MEAL_IMAGES.chickenBowl;
  }

  return image || FIGMA_MEAL_IMAGES.spread;
}
