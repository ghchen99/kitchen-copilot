"""Local filesystem persistence for per-thread artifacts.

Layout (relative to ``KITCHEN_DATA_DIR``, default ``data/``)::

    data/<thread_id>/fridge.<ext>     uploaded fridge image
    data/<thread_id>/inventory.json   detected / edited ingredient inventory
    data/<thread_id>/recipes.json     generated meal plan

This is a placeholder for cloud storage; the interface intentionally stays small
so it can be swapped for a blob store later.
"""

import glob
import json
import os
import re
from typing import Optional

from .config import DATA_DIR

_SAFE_ID = re.compile(r"[^A-Za-z0-9_-]")


def _safe_thread_id(thread_id: str) -> str:
    """Sanitize a thread id so it can never escape the data directory."""
    cleaned = _SAFE_ID.sub("_", thread_id or "")
    if not cleaned:
        raise ValueError("thread_id must contain at least one safe character")
    return cleaned


def thread_dir(thread_id: str) -> str:
    """Return (creating if needed) the directory for a thread's artifacts."""
    path = os.path.join(DATA_DIR, _safe_thread_id(thread_id))
    os.makedirs(path, exist_ok=True)
    return path


def save_image(thread_id: str, data: bytes, ext: str = "jpg") -> str:
    """Persist raw uploaded image bytes and return the saved path."""
    safe_ext = _SAFE_ID.sub("", ext).lower() or "jpg"
    path = os.path.join(thread_dir(thread_id), f"fridge.{safe_ext}")
    with open(path, "wb") as f:
        f.write(data)
    return path


def find_image(thread_id: str) -> Optional[str]:
    """Return the path to a thread's saved fridge image, or ``None`` if absent."""
    matches = glob.glob(os.path.join(thread_dir(thread_id), "fridge.*"))
    return matches[0] if matches else None


def save_inventory(thread_id: str, inventory: dict) -> str:
    """Persist the inventory dict and return the saved path."""
    path = os.path.join(thread_dir(thread_id), "inventory.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2, ensure_ascii=False)
    return path


def load_inventory(thread_id: str) -> Optional[dict]:
    """Load a previously saved inventory dict, or ``None`` if absent."""
    path = os.path.join(thread_dir(thread_id), "inventory.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_recipes(thread_id: str, recipes: dict) -> str:
    """Persist the generated meal plan and return the saved path."""
    path = os.path.join(thread_dir(thread_id), "recipes.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    return path


def load_recipes(thread_id: str) -> Optional[dict]:
    """Load a previously saved meal plan, or ``None`` if absent."""
    path = os.path.join(thread_dir(thread_id), "recipes.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
