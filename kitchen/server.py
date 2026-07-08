"""FastAPI backend exposing the Kitchen Copilot agent over the AG-UI protocol.

The whole conversation is served by a single AG-UI endpoint (``POST /agent``)
via the ``ag-ui-langgraph`` integration. It streams AG-UI events (assistant
messages, tool calls, shared state, and the human-in-the-loop review interrupt)
straight from the compiled LangGraph agent, so the frontend can drive everything
with the standard ``@ag-ui/client`` ``HttpAgent`` — no bespoke REST protocol or
response shaping required.

The only non-conversational endpoint is ``POST /api/image``: it persists an
uploaded fridge photo and returns its local path so the agent's vision tool can
read it. The frontend then sends a normal chat message referencing that path.
"""

import os

from ag_ui_langgraph import LangGraphAgent, add_langgraph_fastapi_endpoint
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import agent as kitchen_agent
from . import persistence

app = FastAPI(title="Kitchen Copilot")

# Allow a separately-hosted frontend to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# AG-UI AGENT ENDPOINT
# -----------------------------

# One streaming endpoint speaks the AG-UI protocol for the entire conversation:
# chat, tool calls, shared state (inventory/recipes), and the review interrupt.
# LangGraph's checkpointer (keyed by the AG-UI thread id) keeps multi-turn state
# and pause/resume working across requests.
add_langgraph_fastapi_endpoint(
    app,
    LangGraphAgent(name="kitchen_copilot", graph=kitchen_agent.agent),
    path="/agent",
)


# -----------------------------
# IMAGE UPLOAD
# -----------------------------


@app.post("/api/image")
async def upload_image(thread_id: str, file: UploadFile = File(...)) -> dict:
    """Persist an uploaded fridge image and return its local path.

    The frontend then sends a chat message referencing this path, which the
    agent's ``identify_ingredients`` tool reads.
    """
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image upload.")

    ext = (os.path.splitext(file.filename or "")[1].lstrip(".") or "jpg").lower()
    return {"path": persistence.save_image(thread_id, data, ext=ext)}


# -----------------------------
# STATIC FRONTEND (Vite build)
# -----------------------------

# In development, run the Vite dev server (`npm run dev`) which proxies /agent
# and /api here. In production, `npm run build` emits frontend/dist served below.
_FRONTEND_DIST = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "frontend", "dist"
)


@app.get("/")
def index() -> FileResponse:
    """Serve the built single-page frontend (run `npm run build` first)."""
    index_path = os.path.join(_FRONTEND_DIST, "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(
            status_code=404,
            detail="Frontend not built. Run `npm run dev` (dev) or `npm run build`.",
        )
    return FileResponse(index_path)


if os.path.isdir(os.path.join(_FRONTEND_DIST, "assets")):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(_FRONTEND_DIST, "assets")),
        name="assets",
    )
