import type { AgentResponse, Inventory } from "./types";

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createThread: (): Promise<{ thread_id: string }> =>
    fetch("/api/threads", { method: "POST" }).then((r) =>
      unwrap<{ thread_id: string }>(r)
    ),

  uploadImage: (threadId: string, file: File): Promise<AgentResponse> => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`/api/threads/${threadId}/image`, {
      method: "POST",
      body: fd,
    }).then((r) => unwrap<AgentResponse>(r));
  },

  sendMessage: (threadId: string, message: string): Promise<AgentResponse> =>
    fetch(`/api/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }).then((r) => unwrap<AgentResponse>(r)),

  review: (
    threadId: string,
    inventory: Inventory | null
  ): Promise<AgentResponse> =>
    fetch(`/api/threads/${threadId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory }),
    }).then((r) => unwrap<AgentResponse>(r)),

  imageUrl: (threadId: string): string => `/api/threads/${threadId}/image`,
};
