"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  LoaderCircle,
  MessageCircleHeart,
  Minus,
  Plus,
  Send,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";
import { getSettings } from "@/features/settings/settings-api";
import {
  AssistantApiError,
  getAssistantConversations,
  getAssistantMessages,
  sendAssistantMessage,
  type AssistantMessage
} from "./assistant-api";

function errorMessage(error: unknown) {
  if (error instanceof AssistantApiError) {
    if (error.status === 401) return "Bạn cần đăng nhập để trò chuyện.";
    if (error.status === 429) return "Gemini đang giới hạn lượt gọi. Hãy thử lại sau.";
    return error.message;
  }
  return "Không thể kết nối với trợ lý.";
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [assistantName, setAssistantName] = useState("Nutri");
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateName(event: Event) {
      const detail = (event as CustomEvent<{ assistantName?: string }>).detail;
      if (detail?.assistantName) setAssistantName(detail.assistantName);
    }
    window.addEventListener("nutriplan:assistant-name", updateName);
    return () => {
      window.removeEventListener("nutriplan:assistant-name", updateName);
    };
  }, []);

  useEffect(() => {
    if (!open || initialized) return;
    let active = true;
    setLoading(true);
    setError("");

    void Promise.allSettled([getSettings(), getAssistantConversations()])
      .then(async ([settingsResult, conversationsResult]) => {
        if (!active) return;
        if (settingsResult.status === "fulfilled") {
          setAssistantName(settingsResult.value.assistantName);
        }
        if (conversationsResult.status === "rejected") {
          throw conversationsResult.reason;
        }
        const latest = conversationsResult.value.conversations[0];
        if (!latest) return;
        const result = await getAssistantMessages(latest.id);
        if (!active) return;
        setConversationId(latest.id);
        setMessages(result.messages);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setInitialized(true);
      });

    return () => {
      active = false;
    };
  }, [initialized, open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, open, sending]);

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
    setInput("");
    setError("");
  }

  async function submitMessage(value = input) {
    const content = value.trim();
    if (!content || sending) return;
    const optimistic: AssistantMessage = {
      id: `pending-${Date.now()}`,
      conversationId: conversationId ?? "",
      role: "user",
      content,
      provider: null,
      model: null,
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, optimistic]);
    setInput("");
    setError("");
    setSending(true);
    try {
      const result = await sendAssistantMessage(content, conversationId);
      setConversationId(result.conversation.id);
      setMessages((current) => [
        ...current.filter((item) => item.id !== optimistic.id),
        result.userMessage,
        result.assistantMessage
      ]);
    } catch (requestError) {
      setMessages((current) =>
        current.filter((item) => item.id !== optimistic.id)
      );
      setInput(content);
      setError(errorMessage(requestError));
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  const needsLogin = error.includes("đăng nhập");

  return (
    <div className={`assistant-widget ${open ? "is-open" : ""}`}>
      {open && (
        <section
          aria-label={`Trò chuyện với ${assistantName}`}
          className="assistant-widget__panel"
        >
          <header className="assistant-widget__header">
            <span className="assistant-widget__avatar"><Bot size={19} /></span>
            <div>
              <strong>{assistantName}</strong>
              <small><span /> Trợ lý dinh dưỡng · Gemini</small>
            </div>
            <button
              aria-label="Bắt đầu cuộc trò chuyện mới"
              onClick={startNewConversation}
              title="Cuộc trò chuyện mới"
            >
              <Plus size={18} />
            </button>
            <button
              aria-label="Thu nhỏ trợ lý"
              onClick={() => setOpen(false)}
              title="Thu nhỏ"
            >
              <Minus size={18} />
            </button>
          </header>

          <div className="assistant-widget__messages" ref={scrollRef}>
            {loading && (
              <div className="assistant-widget__state">
                <LoaderCircle className="spin" size={22} />
                <span>Đang tải cuộc trò chuyện…</span>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="assistant-widget__welcome">
                <span><MessageCircleHeart size={23} /></span>
                <h2>Xin chào, mình là {assistantName}</h2>
                <p>Hỏi mình về thực đơn, mục tiêu hoặc dinh dưỡng hôm nay.</p>
                <button onClick={() => void submitMessage("Hôm nay tôi nên ăn gì?")}>
                  <Sparkles size={14} /> Hôm nay tôi nên ăn gì?
                </button>
              </div>
            )}

            {!loading &&
              messages.map((message) => (
                <article
                  className={`assistant-widget__message is-${message.role}`}
                  key={message.id}
                >
                  <span>
                    {message.role === "assistant" ? (
                      <Bot size={15} />
                    ) : (
                      <UserRound size={15} />
                    )}
                  </span>
                  <div>
                    <strong>
                      {message.role === "assistant" ? assistantName : "Bạn"}
                    </strong>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}

            {sending && (
              <article className="assistant-widget__message is-assistant">
                <span><Bot size={15} /></span>
                <div>
                  <strong>{assistantName}</strong>
                  <span className="assistant-typing"><i /><i /><i /></span>
                </div>
              </article>
            )}
          </div>

          <footer className="assistant-widget__footer">
            {error && (
              <div className="assistant-widget__error">
                <AlertTriangle size={15} />
                <span>{error}</span>
                {needsLogin && <Link href="/login?next=/app">Đăng nhập</Link>}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <textarea
                aria-label={`Nhắn cho ${assistantName}`}
                maxLength={1500}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Nhắn cho ${assistantName}…`}
                rows={1}
                value={input}
              />
              <button
                aria-label="Gửi tin nhắn"
                disabled={sending || !input.trim()}
                type="submit"
              >
                {sending ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
            <small>AI có thể sai. Không thay thế tư vấn y khoa.</small>
          </footer>
        </section>
      )}

      <button
        aria-expanded={open}
        aria-label={open ? "Đóng trợ lý ảo" : `Mở trợ lý ${assistantName}`}
        className="assistant-widget__launcher"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={23} /> : <Bot size={24} />}
        {!open && <span />}
      </button>
    </div>
  );
}
