# Kitchen Copilot — Architecture Overview

This document explains how the **backend** (Python / FastAPI + LangGraph) and the
**frontend** (React + TypeScript) work and how they interact, followed by a set of
suggested design improvements.

---

## 1. High-level picture

```mermaid
flowchart LR
    subgraph Browser["Frontend (React + TS, Vite)"]
        UI[Chat UI]
        MODAL[Ingredient Review Modal<br/>bbox overlay]
    end

    subgraph Server["Backend (FastAPI)"]
        AGUI[/AG-UI endpoint<br/>POST /agent/]
        GRAPH[LangGraph Agent]
        FILES[(Local files<br/>data/&lt;thread_id&gt;/)]
    end

    subgraph AI["OpenAI-compatible endpoint"]
        VISION[Vision model]
        RECIPE[Recipe model]
    end

    UI -- "AG-UI events (SSE stream)" --> AGUI
    MODAL -- "resume via interrupt" --> AGUI
    UI -- "POST /api/image (multipart)" --> FILES
    AGUI --> GRAPH
    GRAPH --> VISION
    GRAPH --> RECIPE
    GRAPH --> FILES
```

The system is a **conversational agent**: the user chats, uploads a fridge photo,
reviews the detected ingredients, and receives recipes. All of it flows through one
LangGraph state machine keyed by a `thread_id`. The frontend and backend talk over
the [**AG-UI protocol**](https://github.com/ag-ui-protocol/ag-ui): the compiled
graph is exposed as a single streaming endpoint via `ag-ui-langgraph`, and the UI
drives it with the standard `@ag-ui/client` `HttpAgent` — no bespoke REST protocol.

---

## 2. Backend

### 2.1 Module layout (`kitchen/`)

| File | Responsibility |
| ---- | -------------- |
| `schemas.py` | Pydantic models + `Classification` enum (single source of truth). |
| `config.py` | Loads env vars, builds the cached OpenAI client, sets `DATA_DIR`. |
| `services.py` | Pure AI calls: `detect_inventory` (vision) and `generate_meal_plan` (recipes). |
| `persistence.py` | Local per-thread file storage (image, inventory, recipes). |
| `agent.py` | The LangGraph state graph, tools, and interrupt (compiled as `agent`). |
| `server.py` | Serves the graph over AG-UI (`ag-ui-langgraph`) + image upload + built frontend. |

### 2.2 The agent graph

```mermaid
flowchart LR
    START([START]) --> LLM[llm_call]
    LLM -->|tool call| TOOLS[tools]
    LLM -->|final reply| END([END])
    TOOLS -->|ingredients detected| REVIEW[review_ingredients<br/>interrupt]
    TOOLS -->|otherwise| LLM
    REVIEW --> LLM
```

- **`llm_call`** — the reasoning node. It runs the chat model with two bound tools and
  a system prompt describing the workflow.
- **Tools the model can call**
  - `identify_ingredients(image_path)` → runs the vision model, saves `inventory.json`,
    sets `pending_review = True`, and returns a `Command` updating graph state.
  - `generate_recipes(allergies, dietary_preferences, skill_level, mode)` → reads the
    reviewed inventory from state (via `InjectedState`), runs the recipe model, saves
    `recipes.json`.
- **`review_ingredients`** — a human-in-the-loop node. It calls `interrupt(...)`, which
  **pauses the whole graph** and surfaces the detected inventory to the caller. When the
  caller resumes with `Command(resume=<edited inventory>)`, that value replaces the
  inventory and the graph continues.
- **State** (`KitchenState`) carries `messages`, `thread_id`, `inventory`, `recipes`,
  `image_path`, and `pending_review`.
- **Checkpointer** — an `InMemorySaver` persists state per `thread_id`, which is what
  makes multi-turn conversation (and pause/resume) possible.

### 2.3 AG-UI endpoint (`server.py`)

`server.py` is now thin. It hands the compiled graph to `ag-ui-langgraph`, which
streams AG-UI events for the whole conversation:

```python
add_langgraph_fastapi_endpoint(
    app, LangGraphAgent(name="kitchen_copilot", graph=agent), path="/agent"
)
```

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/agent` | AG-UI run: streams messages, tool calls, shared state, and the review interrupt (SSE) |
| GET  | `/agent/health` | Health check emitted by the integration |
| POST | `/api/image?thread_id=…` | Upload a fridge image (multipart); returns its local `path` |

The AG-UI run carries everything that used to need bespoke endpoints:

- **Chat** — user messages are sent in the run input; assistant replies stream back
  as `TEXT_MESSAGE_*` events.
- **Inventory / recipes** — the graph's `KitchenState` is synced to the client as
  `STATE_SNAPSHOT` events, so the frontend reads `agent.state.recipes` directly
  instead of polling REST routes.
- **Ingredient review** — the graph's `interrupt(...)` surfaces as an `on_interrupt`
  custom event; the client resumes by starting a run with
  `forwardedProps.command.resume = <edited inventory>`.

Image upload is the only non-AG-UI call: the vision tool needs a file path, so the
photo is saved first and the returned `path` is referenced in the next chat message.
In production the app also serves the Vite `dist/` build at `/`.

### 2.5 Persistence

Artifacts are written under `data/<thread_id>/`:

```
data/<thread_id>/fridge.<ext>     uploaded image
data/<thread_id>/inventory.json   detected / edited ingredients
data/<thread_id>/recipes.json     generated meal plan
```

`thread_id` is sanitized before use to prevent path traversal. This is a deliberate
placeholder for cloud/object storage later.

---

## 3. Frontend

### 3.1 Structure (`frontend/src/`)

| File | Responsibility |
| ---- | -------------- |
| `types.ts` | TypeScript mirrors of the backend schemas + classification colors. |
| `lib/agent.ts` | Constructs the AG-UI `HttpAgent` (points at `/agent`) + `uploadImage` helper. |
| `hooks/useKitchenAgent.ts` | Bridges AG-UI events (messages, state, interrupt) to React state. |
| `App.tsx` | Renders the chat, composer, and review modal off the hook. |
| `components/Composer.tsx` | Text input + 📷 upload button. |
| `components/ChatBubble.tsx` | Renders a text / image / recipes message. |
| `components/ReviewModal.tsx` | Image with editable bounding-box labels + item list. |
| `components/RecipeCards.tsx` | Recipe, snack, and shopping-list rendering. |
| `styles.css` | Dark, single-file theme. |

### 3.2 State model

`useKitchenAgent` subscribes to the AG-UI `HttpAgent` and maps its events onto an
array of `ChatMessage` (a discriminated union of `text`, `image`, and `recipes`
kinds):

1. `TEXT_MESSAGE_*` events stream the assistant's reply token-by-token into one
   bubble,
2. `STATE_SNAPSHOT` updates (`agent.state.recipes`) append a recipe-cards message
   when the plan changes,
3. an `on_interrupt` custom event of type `review_ingredients` opens the review modal.

User text/image bubbles are added locally when sending; the agent keeps the
authoritative message + state history.

### 3.3 The bounding-box review modal

- The uploaded image is shown from a local object URL (instant, no round-trip).
- Each detected item with a `bbox` is drawn as a dashed rectangle positioned from the
  model's **normalized** coordinates (`x_min…y_max` → CSS `%`).
- Labels are **editable inputs** placed over each box (with slight jitter so they sit
  "loosely dotted" around the region). Box fills use `pointer-events: none` so
  overlapping/nested regions never swallow each other's labels.
- Editing a label or a list row updates the same `items` state; "Save & continue"
  resumes the graph with the edited inventory, "Skip edits" resumes as-is.

### 3.4 Dev vs. prod wiring

- **Dev:** `npm run dev` serves the app on `:5173`; Vite proxies `/agent` and
  `/api/*` to the backend on `:8000` (no CORS friction, relative URLs everywhere).
- **Prod:** `npm run build` emits `frontend/dist`, which FastAPI serves directly.

---

## 4. End-to-end flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (HttpAgent)
    participant BE as FastAPI (AG-UI)
    participant AG as LangGraph
    participant AI as Model

    U->>FE: upload fridge photo
    FE->>BE: POST /api/image?thread_id=…
    BE-->>FE: { path }
    FE->>BE: POST /agent (run: "identify … at <path>")
    BE->>AG: run
    AG->>AI: vision detect
    AI-->>AG: inventory
    AG-->>BE: STATE_SNAPSHOT + on_interrupt
    BE-->>FE: SSE events
    FE->>U: open review modal

    U->>FE: edit labels, Save
    FE->>BE: POST /agent (resume = edited inventory)
    BE->>AG: Command(resume=…)
    AG-->>BE: TEXT_MESSAGE_* ("any allergies?")
    BE-->>FE: SSE events

    U->>FE: "vegetarian, no nuts"
    FE->>BE: POST /agent (run: constraints)
    BE->>AG: run
    AG->>AI: generate recipes
    AI-->>AG: meal plan
    AG-->>BE: TEXT_MESSAGE_* + STATE_SNAPSHOT(recipes)
    BE-->>FE: SSE events
    FE->>U: render recipe cards
```

---

## 5. Suggested design improvements

**Reliability & correctness**
- **Durable checkpointing.** Swap `InMemorySaver` for `SqliteSaver`/`PostgresSaver` so
  conversations and paused interrupts survive a server restart.
- **Validate resume payloads.** The AG-UI resume value (edited inventory) is trusted
  as-is; validate it against a Pydantic model in the `review_ingredients` node before
  using it.
- **Idempotency / concurrency.** Guard against two requests resuming the same thread
  simultaneously (e.g. a per-thread lock or optimistic version check).

**Architecture & scale**
- **Streaming responses.** ✅ Done — the AG-UI endpoint streams `TEXT_MESSAGE_*`,
  tool-call, and `STATE_SNAPSHOT` events over SSE, so the UI shows tokens and state
  live. Next: surface tool-call progress ("detecting…", "cooking up recipes…") too.
- **Cloud storage.** Replace the local `data/` folder with blob storage (e.g. Azure Blob
  / S3); `persistence.py` is already the single seam to change.
- **Background jobs.** Vision + recipe calls are slow; move them to a task queue and
  have the frontend poll or subscribe, so HTTP requests don't block.
- **Stateless workers.** With durable checkpoints + object storage, the API can scale
  horizontally behind a load balancer.

**Security & ops**
- **AuthN/AuthZ.** Tie `thread_id`s to authenticated users so one user can't read
  another's threads or images. Tighten CORS from `*` to known origins.
- **Upload limits.** Enforce max image size, content-type sniffing, and virus/size
  checks on `/image`.
- **Observability.** Add structured logging, request tracing, and LangGraph run traces
  (e.g. LangSmith) to debug tool calls and latency.
- **Config hardening.** Fail fast on missing env vars at startup instead of at first call.

**Product & UX**
- **Bounding-box editing.** Let users drag/resize boxes and add new ones, not just edit
  labels — persist the adjusted geometry back to the inventory.
- **Persist chat history to the UI.** Rehydrate messages from the backend on reload
  (currently the transcript lives only in React state).
- **Recipe interactions.** "Regenerate", "make it vegan", save/favorite, and shopping
  list export.
- **Optimistic UI + error toasts.** Replace inline error bubbles with clearer retry
  affordances and distinct failure states.

**Code quality**
- **Shared schema generation.** Generate `types.ts` from the Pydantic models (e.g. via
  OpenAPI) so the frontend and backend can't drift.
- **Tests.** Unit-test `services`/`persistence`, and add a graph test that mocks the
  model to exercise the identify → interrupt → resume → recipes path.
