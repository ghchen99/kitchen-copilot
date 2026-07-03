import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { AgentResponse, ChatMessage, Inventory } from "./types";
import ChatBubble from "./components/ChatBubble";
import Composer from "./components/Composer";
import ReviewModal from "./components/ReviewModal";

interface ReviewState {
  inventory: Inventory;
  imageUrl: string;
}

export default function App() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .createThread()
      .then((t) => setThreadId(t.thread_id))
      .catch((e) => addText("assistant", `Failed to start session: ${e.message}`));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const push = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  const addText = (role: "user" | "assistant", text: string) =>
    push({ id: crypto.randomUUID(), role, kind: "text", text });

  function applyResponse(res: AgentResponse, imageUrl?: string) {
    if (res.reply) addText("assistant", res.reply);
    if (res.recipes) {
      push({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "recipes",
        plan: res.recipes,
      });
    }
    if (res.interrupt?.type === "review_ingredients" && imageUrl) {
      setReview({ inventory: res.interrupt.inventory, imageUrl });
    }
  }

  async function handleSend(text: string) {
    if (!threadId || busy) return;
    addText("user", text);
    setBusy(true);
    try {
      const res = await api.sendMessage(threadId, text);
      applyResponse(res);
    } catch (e) {
      addText("assistant", `Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File) {
    if (!threadId || busy) return;
    const imageUrl = URL.createObjectURL(file);
    push({ id: crypto.randomUUID(), role: "user", kind: "image", imageUrl });
    setBusy(true);
    try {
      const res = await api.uploadImage(threadId, file);
      applyResponse(res, imageUrl);
    } catch (e) {
      addText("assistant", `Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function resumeReview(inventory: Inventory | null) {
    if (!threadId) return;
    setReview(null);
    setBusy(true);
    try {
      const res = await api.review(threadId, inventory);
      applyResponse(res);
    } catch (e) {
      addText("assistant", `Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">🧊</span>
        <div>
          <h1>Kitchen Copilot</h1>
          <p className="tagline">Snap your fridge, get recipes.</p>
        </div>
      </header>

      <main className="chat" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>👋 Upload a photo of your fridge to get started.</p>
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {busy && (
          <div className="bubble assistant">
            <span className="typing">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </main>

      <Composer disabled={!threadId || busy} onSend={handleSend} onUpload={handleUpload} />

      {review && (
        <ReviewModal
          imageUrl={review.imageUrl}
          inventory={review.inventory}
          busy={busy}
          onSubmit={(inv) => resumeReview(inv)}
          onSkip={() => resumeReview(null)}
        />
      )}
    </div>
  );
}
