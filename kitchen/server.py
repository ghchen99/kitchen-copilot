"""FastAPI backend exposing the Kitchen Copilot agent to a frontend.

Endpoints (all under ``/api``):

    POST   /api/threads                       -> create a new conversation thread
    POST   /api/threads/{thread_id}/image     -> upload a fridge image (multipart)
    POST   /api/threads/{thread_id}/messages  -> send a chat message
    POST   /api/threads/{thread_id}/review    -> resume after ingredient review
    GET    /api/threads/{thread_id}/inventory -> load persisted inventory
    GET    /api/threads/{thread_id}/recipes   -> load persisted recipes

A frontend drives the flow by passing the same ``thread_id`` across calls, which the
agent's checkpointer uses to continue the conversation.
"""

import os
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import agent, persistence

app = FastAPI(title="Kitchen Copilot")

# Allow a separately-hosted frontend to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# REQUEST MODELS
# -----------------------------


class MessageRequest(BaseModel):
    message: str


class ReviewRequest(BaseModel):
    # Edited inventory ({"items": [...]}). Omit / null to accept the detected list.
    inventory: Optional[dict] = None


# -----------------------------
# API ROUTES
# -----------------------------


@app.post("/api/threads")
def create_thread() -> dict:
    """Create a new conversation thread and return its id."""
    return {"thread_id": agent.new_thread_id()}


@app.post("/api/threads/{thread_id}/image")
async def upload_image(thread_id: str, file: UploadFile = File(...)) -> dict:
    """Persist an uploaded fridge image and let the agent identify ingredients."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image upload.")

    ext = (os.path.splitext(file.filename or "")[1].lstrip(".") or "jpg").lower()
    image_path = persistence.save_image(thread_id, data, ext=ext)

    # Kick off identification; the graph will pause for ingredient review.
    return agent.chat(
        thread_id,
        f"I uploaded a photo of my fridge. It is saved at '{image_path}'. "
        "Please identify the ingredients.",
    )


@app.post("/api/threads/{thread_id}/messages")
def send_message(thread_id: str, body: MessageRequest) -> dict:
    """Send a chat message to the agent on this thread."""
    return agent.chat(thread_id, body.message)


@app.post("/api/threads/{thread_id}/review")
def submit_review(thread_id: str, body: ReviewRequest) -> dict:
    """Resume the paused thread with the user's edited (or accepted) inventory."""
    return agent.resume_review(thread_id, body.inventory)


@app.get("/api/threads/{thread_id}/inventory")
def get_inventory(thread_id: str) -> dict:
    """Return the persisted inventory for a thread."""
    inventory = persistence.load_inventory(thread_id)
    if inventory is None:
        raise HTTPException(status_code=404, detail="No inventory for this thread.")
    return inventory


@app.get("/api/threads/{thread_id}/image")
def get_image(thread_id: str) -> FileResponse:
    """Return the uploaded fridge image for a thread."""
    path = persistence.find_image(thread_id)
    if path is None:
        raise HTTPException(status_code=404, detail="No image for this thread.")
    return FileResponse(path)


@app.get("/api/threads/{thread_id}/recipes")
def get_recipes(thread_id: str) -> dict:
    """Return the persisted meal plan for a thread."""
    recipes = persistence.load_recipes(thread_id)
    if recipes is None:
        raise HTTPException(status_code=404, detail="No recipes for this thread.")
    return recipes


# -----------------------------
# STATIC FRONTEND (Vite build)
# -----------------------------

# In development, run the Vite dev server (`npm run dev`) which proxies /api here.
# In production, `npm run build` emits frontend/dist which is served below.
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
