import { useEffect, useRef, useState } from "react";
import type { AgentSubscriber } from "@ag-ui/client";
import { agent, uploadImage } from "../lib/agent";
import type { ChatMessage, Inventory, MealPlan } from "../types";

interface ReviewState {
  inventory: Inventory;
  imageUrl: string;
}

interface ReviewInterruptValue {
  type: string;
  instruction?: string;
  inventory: Inventory;
}

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/**
 * Bridges the AG-UI `HttpAgent` to React state.
 *
 * All backend interaction flows through the single AG-UI endpoint: assistant
 * text streams in via TEXT_MESSAGE events, recipes arrive as shared-state
 * (STATE_SNAPSHOT) updates, and the ingredient review is an AG-UI interrupt
 * surfaced as an `on_interrupt` custom event.
 */
export function useKitchenAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [busy, setBusy] = useState(false);

  // Object URL of the photo awaiting review (shown in the review modal).
  const pendingImageUrl = useRef<string | null>(null);
  // Id of the assistant bubble currently being streamed into.
  const streamingId = useRef<string | null>(null);
  // Serialized recipes already rendered, so we don't duplicate cards on repeat
  // snapshots but still render a fresh card when the plan actually changes.
  const shownRecipes = useRef<string | null>(null);

  const push = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  useEffect(() => {
    const subscriber: AgentSubscriber = {
      onRunStartedEvent() {
        setBusy(true);
      },
      onRunFinishedEvent() {
        setBusy(false);
        streamingId.current = null;
      },
      onRunFailed({ error }) {
        setBusy(false);
        streamingId.current = null;
        push({ id: uuid(), role: "assistant", kind: "text", text: `Error: ${error.message}` });
      },

      // Stream assistant replies token-by-token into a single bubble.
      onTextMessageStartEvent({ event }) {
        const id = event.messageId ?? uuid();
        streamingId.current = id;
        push({ id, role: "assistant", kind: "text", text: "" });
      },
      onTextMessageContentEvent({ event }) {
        const id = streamingId.current;
        if (!id) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id && m.kind === "text" ? { ...m, text: m.text + event.delta } : m
          )
        );
      },
      onTextMessageEndEvent() {
        streamingId.current = null;
      },

      // Human-in-the-loop: the graph paused for ingredient review. The
      // integration serializes the interrupt payload with dump_json_safe, so
      // `value` may arrive as a JSON string — parse defensively.
      onCustomEvent({ event }) {
        if (event.name !== "on_interrupt") return;
        let value: ReviewInterruptValue | undefined;
        try {
          const raw = event.value;
          value = (typeof raw === "string" ? JSON.parse(raw) : raw) as ReviewInterruptValue;
        } catch {
          return;
        }
        if (value?.type === "review_ingredients" && pendingImageUrl.current) {
          setReview({ inventory: value.inventory, imageUrl: pendingImageUrl.current });
        }
      },

      // Recipes live in shared graph state; render a card when they change.
      onStateChanged({ state }) {
        const recipes = (state as { recipes?: MealPlan | null }).recipes;
        if (!recipes || !recipes.recipes?.length) return;
        const signature = JSON.stringify(recipes);
        if (signature === shownRecipes.current) return;
        shownRecipes.current = signature;
        push({ id: uuid(), role: "assistant", kind: "recipes", plan: recipes });
      },
    };

    const sub = agent.subscribe(subscriber);
    return () => sub.unsubscribe();
  }, []);

  async function runWith(content: string) {
    agent.addMessage({ id: uuid(), role: "user", content });
    await agent.runAgent();
  }

  async function sendMessage(text: string) {
    if (agent.isRunning) return;
    push({ id: uuid(), role: "user", kind: "text", text });
    await runWith(text);
  }

  async function handleUpload(file: File) {
    if (agent.isRunning) return;
    const imageUrl = URL.createObjectURL(file);
    pendingImageUrl.current = imageUrl;
    push({ id: uuid(), role: "user", kind: "image", imageUrl });
    try {
      const { path } = await uploadImage(file);
      await runWith(
        `I uploaded a photo of my fridge. It is saved at '${path}'. ` +
          "Please identify the ingredients."
      );
    } catch (e) {
      push({
        id: uuid(),
        role: "assistant",
        kind: "text",
        text: `Error: ${(e as Error).message}`,
      });
    }
  }

  // Resume the paused graph with the reviewed inventory. A truthy value is
  // required so the integration treats it as a resume (never a fresh run), so
  // "skip edits" resumes with the originally detected list.
  async function submitReview(inventory: Inventory) {
    setReview(null);
    await agent.runAgent({ forwardedProps: { command: { resume: inventory } } });
  }

  return { messages, review, busy, sendMessage, handleUpload, submitReview };
}
