export type UserSettings = {
  assistantName: string;
  updatedAt: string | null;
};

export type CurrentSubscription = {
  id: string;
  status: string;
  provider: string | null;
  provider_subscription_id: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  subscription_plans: {
    name: string;
    description?: string | null;
    price_amount: number | string;
    currency: string;
    features?: string[];
  } | null;
} | null;

export class SettingsApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    },
    cache: "no-store"
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const raw =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : null;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : typeof raw === "string"
        ? raw
        : "Không thể tải cài đặt.";
    throw new SettingsApiError(message, response.status);
  }
  return payload as T;
}

export function getSettings() {
  return request<UserSettings>("/api/settings");
}

export function updateSettings(assistantName: string) {
  return request<UserSettings>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({ assistantName })
  });
}

export function getCurrentSubscription() {
  return request<CurrentSubscription>("/api/subscriptions/current");
}

export function createBillingPortal() {
  return request<{ url: string; testMode: boolean }>(
    "/api/subscriptions/billing-portal",
    { method: "POST" }
  );
}

export function cancelCurrentSubscription() {
  return request<NonNullable<CurrentSubscription>>("/api/subscriptions/cancel", {
    method: "POST"
  });
}

export function resumeCurrentSubscription() {
  return request<NonNullable<CurrentSubscription>>("/api/subscriptions/resume", {
    method: "POST"
  });
}
