export type AssistantConversation = {
  id: string;
  title: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  provider: string | null;
  model: string | null;
  createdAt: string;
};

export class AssistantApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/assistant/${path}`, {
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
        : "Không thể kết nối với trợ lý NutriPlan.";
    throw new AssistantApiError(message, response.status);
  }
  return payload as T;
}

export function getAssistantConversations() {
  return request<{ conversations: AssistantConversation[] }>("conversations");
}

export function getAssistantMessages(conversationId: string) {
  return request<{
    conversation: AssistantConversation;
    messages: AssistantMessage[];
  }>(`conversations/${encodeURIComponent(conversationId)}/messages`);
}

export function sendAssistantMessage(message: string, conversationId?: string) {
  return request<{
    conversation: AssistantConversation;
    userMessage: AssistantMessage;
    assistantMessage: AssistantMessage;
  }>("messages", {
    method: "POST",
    body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) })
  });
}
