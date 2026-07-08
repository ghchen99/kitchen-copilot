import { useEffect, useRef } from "react";
import { useKitchenAgent } from "./hooks/useKitchenAgent";
import ChatBubble from "./components/ChatBubble";
import Composer from "./components/Composer";
import ReviewModal from "./components/ReviewModal";

export default function App() {
  const { messages, review, busy, sendMessage, handleUpload, submitReview } =
    useKitchenAgent();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

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

      <Composer disabled={busy} onSend={sendMessage} onUpload={handleUpload} />

      {review && (
        <ReviewModal
          imageUrl={review.imageUrl}
          inventory={review.inventory}
          busy={busy}
          onSubmit={(inv) => submitReview(inv)}
          onSkip={() => submitReview(review.inventory)}
        />
      )}
    </div>
  );
}

