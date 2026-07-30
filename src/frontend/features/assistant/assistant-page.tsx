"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  LoaderCircle,
  MessageCircleHeart,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  AssistantApiError,
  getAssistantConversations,
  getAssistantMessages,
  sendAssistantMessage,
  type AssistantConversation,
  type AssistantMessage
} from "./assistant-api";
import { getSettings } from "@/features/settings/settings-api";

const suggestions = [
  "Gợi ý bữa tối phù hợp với mục tiêu hôm nay",
  "Hôm nay tôi còn thiếu bao nhiêu protein?",
  "Tôi muốn giảm mỡ nhưng vẫn giữ cơ, nên chú ý gì?",
  "Gợi ý món ăn ít dầu mỡ và dễ chuẩn bị"
];

function errorMessage(error: unknown) {
  if (error instanceof AssistantApiError) {
    if (error.status === 401) return "Bạn cần đăng nhập để sử dụng trợ lý ảo.";
    if (error.status === 429) return "Gemini free tier đang giới hạn lượt gọi. Vui lòng thử lại sau.";
    return error.message;
  }
  return "Không thể kết nối với trợ lý NutriPlan.";
}

export function AssistantPage() {
  const [assistantName, setAssistantName] = useState("Nutri");
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const openConversation = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await getAssistantMessages(id);
      setConversationId(id);
      setMessages(result.messages);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getAssistantConversations()
      .then((result) => {
        if (!active) return;
        setConversations(result.conversations);
        if (result.conversations[0]) {
          void openConversation(result.conversations[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setError(errorMessage(requestError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [openConversation]);

  useEffect(() => {
    let active = true;
    void getSettings()
      .then((settings) => {
        if (active) setAssistantName(settings.assistantName);
      })
      .catch(() => {
        // Tên mặc định vẫn dùng được khi người dùng chưa đăng nhập.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, sending]);

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
      setConversations((current) => [
        result.conversation,
        ...current.filter((item) => item.id !== result.conversation.id)
      ]);
    } catch (requestError) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
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
    <div className="page-content assistant-page">
      <header className="assistant-hero">
        <div className="assistant-hero__icon"><MessageCircleHeart size={25} /></div>
        <div>
          <span className="section-kicker">TRỢ LÝ {assistantName.toUpperCase()}</span>
          <h1>{assistantName}, trợ lý dinh dưỡng của bạn</h1>
          <p>Trao đổi về mục tiêu, thực đơn và tiến độ dựa trên dữ liệu bạn đã lưu.</p>
        </div>
        <span className="assistant-powered"><Sparkles size={14} /> Gemini</span>
      </header>

      <section className="assistant-shell">
        <aside className="assistant-history">
          <button className="button button--dark assistant-new" onClick={startNewConversation}>
            <Plus size={17} /> Cuộc trò chuyện mới
          </button>
          <div className="assistant-history__label">Gần đây</div>
          <div className="assistant-history__list">
            {conversations.map((conversation) => (
              <button
                className={conversation.id === conversationId ? "is-active" : ""}
                key={conversation.id}
                onClick={() => void openConversation(conversation.id)}
              >
                <MessageCircleHeart size={16} />
                <span>{conversation.title}</span>
              </button>
            ))}
            {!loading && conversations.length === 0 && (
              <p>Chưa có cuộc trò chuyện nào.</p>
            )}
          </div>
        </aside>

        <div className="assistant-chat">
          <div className="assistant-messages" ref={scrollRef}>
            {loading && (
              <div className="assistant-state">
                <LoaderCircle className="spin" size={25} />
                <span>Đang tải cuộc trò chuyện…</span>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="assistant-welcome">
                <span><Bot size={27} /></span>
                <h2>Hôm nay mình có thể giúp gì cho bạn?</h2>
                <p>
                  Mình có thể tham khảo hồ sơ dinh dưỡng, lượng đã ăn hôm nay và
                  AI Insight gần nhất để đưa ra gợi ý phù hợp hơn.
                </p>
                <div className="assistant-suggestions">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => void submitMessage(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && messages.map((message) => (
              <article
                className={`assistant-message assistant-message--${message.role}`}
                key={message.id}
              >
                <span className="assistant-message__avatar">
                  {message.role === "assistant" ? <Bot size={18} /> : <UserRound size={18} />}
                </span>
                <div>
                  <strong>{message.role === "assistant" ? assistantName : "Bạn"}</strong>
                  <p>{message.content}</p>
                </div>
              </article>
            ))}

            {sending && (
              <article className="assistant-message assistant-message--assistant">
                <span className="assistant-message__avatar"><Bot size={18} /></span>
                <div>
                  <strong>{assistantName}</strong>
                  <span className="assistant-typing"><i /><i /><i /></span>
                </div>
              </article>
            )}
          </div>

          <div className="assistant-composer-wrap">
            {error && (
              <div className="assistant-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
                {needsLogin && <Link href="/login?next=/app">Đăng nhập</Link>}
              </div>
            )}
            <form className="assistant-composer" onSubmit={handleSubmit}>
              <textarea
                aria-label="Tin nhắn cho trợ lý"
                maxLength={1500}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Nhắn cho ${assistantName}…`}
                rows={2}
                value={input}
              />
              <button
                aria-label="Gửi tin nhắn"
                disabled={sending || !input.trim()}
                type="submit"
              >
                {sending ? <LoaderCircle className="spin" size={19} /> : <Send size={19} />}
              </button>
            </form>
            <small><ShieldCheck size={13} /> Gợi ý AI không thay thế tư vấn hoặc chẩn đoán y khoa.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
