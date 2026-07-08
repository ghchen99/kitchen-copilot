import { HttpAgent } from "@ag-ui/client";

// A single AG-UI agent instance drives the whole conversation. The thread id
// namespaces both the AG-UI run history (LangGraph checkpointer) and the
// uploaded image storage on the backend.
export const threadId =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// `thread_id` is seeded into the shared graph state so the agent's tools know
// where to persist inventory/recipes; `inventory`/`recipes` start empty and are
// streamed back to us via AG-UI STATE_SNAPSHOT events.
export const agent = new HttpAgent({
  url: "/agent",
  threadId,
  initialState: { thread_id: threadId, inventory: null, recipes: null },
});

/** Upload a fridge photo and return the local path the vision tool will read. */
export async function uploadImage(file: File): Promise<{ path: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    `/api/image?thread_id=${encodeURIComponent(threadId)}`,
    { method: "POST", body: fd }
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || res.statusText);
  }
  return res.json() as Promise<{ path: string }>;
}
