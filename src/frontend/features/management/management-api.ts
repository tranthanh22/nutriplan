export type KitchenOrderStatus =
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded";

export type DailyOrderStatus =
  | "scheduled"
  | "accepted"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "cancelled";

export type ManagedDailyOrderItem = {
  id: string;
  dish_name: string;
  ingredient_snapshot: string[];
  servings: number | string;
  calories_kcal: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  allergen_snapshot: string[];
};

export type ManagedDailyOrder = {
  id: string;
  kitchen_order_id: string;
  delivery_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  status: DailyOrderStatus;
  accepted_at: string | null;
  preparing_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  failure_reason: string | null;
  updated_at: string;
  daily_order_items: ManagedDailyOrderItem[];
};

export type ManagedKitchen = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type ManagedOrder = {
  id: string;
  order_number: string;
  kitchen_id: string;
  status: KitchenOrderStatus;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: Record<string, unknown>;
  delivery_note: string | null;
  allergen_snapshot: string[];
  policy_snapshot: Record<string, unknown>;
  total_amount: number | string;
  currency: string;
  created_at: string;
  kitchens: { id: string; name: string } | null;
  kitchen_offers: {
    id: string;
    name: string;
    type: "single_meal" | "package";
    package_days: number | null;
    meals_per_day: number;
    description: string | null;
  } | null;
  kitchen_order_items: Array<{
    id: string;
    item_name: string;
    quantity: number | string;
    item_snapshot: Record<string, unknown>;
  }>;
  daily_orders: ManagedDailyOrder[];
  fulfillment: {
    total_meals: number;
    delivered_meals: number;
    remaining_meals: number;
    start_date: string | null;
    end_date: string | null;
    status: "not_scheduled" | "active" | "completed" | "cancelled";
  };
  customer: { id: string; full_name: string | null; phone: string | null } | null;
  nutrition_requirements: {
    dietary_preferences: string[];
    food_allergies: string[];
    food_intolerances: string[];
    disliked_ingredients: string[];
    source: "order_snapshot" | "current_profile";
  };
};

export type KitchenDashboardResponse = {
  kitchens: ManagedKitchen[];
  summary: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  orders: ManagedOrder[];
};

export type AdminDashboardResponse = {
  generatedAt: string;
  metrics: {
    customers: number;
    kitchens: number;
    activeKitchens: number;
    activeSubscriptions: number;
    kitchenOrders: number;
    kitchenRevenue: number;
    mealLogs: number;
    aiInsights: number;
  };
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: KitchenOrderStatus;
    total_amount: number | string;
    currency: string;
    created_at: string;
    customerName: string;
    kitchens: { id: string; name: string } | null;
  }>;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload
      ? String(payload.message)
      : "Không thể tải dữ liệu quản lý.";
    throw new Error(message);
  }
  return payload as T;
}

export async function getKitchenDashboard() {
  return parseResponse<KitchenDashboardResponse>(
    await fetch("/api/kitchen-management", { cache: "no-store" })
  );
}

export async function updateManagedOrderStatus(
  orderId: string,
  status: "confirmed" | "completed" | "cancelled"
) {
  return parseResponse<{ id: string; status: KitchenOrderStatus }>(
    await fetch(`/api/kitchen-management/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
  );
}

export async function updateManagedDailyOrderStatus(
  orderId: string,
  dailyOrderId: string,
  status: Exclude<DailyOrderStatus, "scheduled">
) {
  return parseResponse<ManagedDailyOrder>(
    await fetch(
      `/api/kitchen-management/orders/${encodeURIComponent(orderId)}/daily-orders/${encodeURIComponent(dailyOrderId)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }
    )
  );
}

export type UpdateManagedDailyOrderItemInput = {
  dishName: string;
  ingredients: string[];
  servings: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  allergens: string[];
};

export async function updateManagedDailyOrderItem(
  orderId: string,
  dailyOrderId: string,
  itemId: string,
  input: UpdateManagedDailyOrderItemInput
) {
  return parseResponse<ManagedDailyOrderItem>(
    await fetch(
      `/api/kitchen-management/orders/${encodeURIComponent(orderId)}/daily-orders/${encodeURIComponent(dailyOrderId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      }
    )
  );
}

export async function getAdminDashboard() {
  return parseResponse<AdminDashboardResponse>(
    await fetch("/api/admin/dashboard", { cache: "no-store" })
  );
}
