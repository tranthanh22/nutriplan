export type AiObservation = {
  title: string;
  evidence: string;
  confidence: "low" | "medium" | "high";
};

export type AiHealthInsight = {
  summary: string;
  observations: AiObservation[];
  actionable_suggestions: string[];
  questions_for_user: string[];
  limitations: string[];
  safety_flags: string[];
  recommend_professional_review: boolean;
};

export type AiInsightResponse = {
  id: string;
  status: "processing" | "completed" | "failed";
  generatedAt?: string | null;
  safetyStatus?: string;
  previewSummary?: string | null;
  insight?: AiHealthInsight;
  requiresSubscription?: boolean;
  retryAfterSeconds?: number;
};

export class BackendApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(init?: RequestInit): Promise<T> {
  const response = await fetch("/api/ai-insights", {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers
    },
    cache: "no-store"
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = getErrorMessage(payload) ?? "Không thể kết nối đến NutriPlan API.";
    throw new BackendApiError(message, response.status);
  }
  return payload as T;
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) return null;
  const message = payload.message;
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : null;
}

export function fetchLatestInsight() {
  return request<AiInsightResponse>();
}

export function generateInsight() {
  return request<AiInsightResponse>({ method: "POST" });
}
