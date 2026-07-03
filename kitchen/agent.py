"""LangGraph agent orchestrating the fridge-to-recipe workflow.

Design (built on the ``agent.py`` template's tool-calling loop):

    START -> llm_call -> (tools) -> [review_ingredients] -> llm_call -> ... -> END

Tools the LLM can call:
    * ``identify_ingredients``  -> vision model extracts inventory from a fridge image
    * ``generate_recipes``      -> recipe model turns inventory + constraints into a meal plan

Human-in-the-loop:
    After ``identify_ingredients`` runs, the graph pauses at ``review_ingredients``
    via ``interrupt()`` so a frontend can present an editable ingredient list. The
    resumed value replaces the inventory before recipes are generated.

Persistence:
    A checkpointer keyed by ``thread_id`` keeps conversation state across turns, and
    inventories / recipes are written to local files (see ``kitchen.persistence``).
"""

import uuid
from typing import Annotated, Literal, Optional

from langchain.chat_models import init_chat_model
from langchain_core.messages import AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import InjectedToolCallId, tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import InjectedState, ToolNode
from langgraph.types import Command, interrupt
from typing_extensions import NotRequired, TypedDict

from . import persistence, services
from .config import OPENAI_API_KEY, OPENAI_DEPLOYMENT_NAME, OPENAI_ENDPOINT

# -----------------------------
# STATE
# -----------------------------


class KitchenState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    thread_id: str
    image_path: NotRequired[Optional[str]]
    inventory: NotRequired[Optional[dict]]
    recipes: NotRequired[Optional[dict]]
    pending_review: NotRequired[bool]
    llm_calls: NotRequired[int]


# -----------------------------
# MODEL
# -----------------------------

model = init_chat_model(
    f"azure_ai:{OPENAI_DEPLOYMENT_NAME}",
    base_url=OPENAI_ENDPOINT,
    api_key=OPENAI_API_KEY,
    temperature=0,
    use_responses_api=True,
)


# -----------------------------
# TOOLS
# -----------------------------


@tool
def identify_ingredients(
    image_path: str,
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    """Analyze a fridge image and extract a structured ingredient inventory.

    Call this once the user has uploaded a fridge photo.

    Args:
        image_path: Local filesystem path to the fridge image to analyze.
    """
    import os

    if not image_path or not os.path.exists(image_path):
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        f"No image found at '{image_path}'. Ask the user to upload a "
                        "fridge photo first.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    thread_id = state["thread_id"]
    inventory = services.detect_inventory(image_path).model_dump()
    persistence.save_inventory(thread_id, inventory)

    names = [item["name"] for item in inventory.get("items", [])]
    summary = (
        f"Detected {len(names)} items: {', '.join(names) if names else '(none)'}. "
        "The user will now review and edit this list."
    )

    return Command(
        update={
            "image_path": image_path,
            "inventory": inventory,
            "pending_review": True,
            "messages": [ToolMessage(summary, tool_call_id=tool_call_id)],
        }
    )


@tool
def generate_recipes(
    state: Annotated[dict, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
    allergies: str = "none",
    dietary_preferences: str = "none",
    skill_level: str = "easy",
    mode: str = "quick meals",
) -> Command:
    """Generate recipes, snack ideas, and a shopping list from the current inventory.

    Only call this after the ingredient list has been reviewed. All constraints are
    optional; pass through whatever the user provided (or the defaults).

    Args:
        allergies: Comma-separated allergens to strictly avoid, or "none".
        dietary_preferences: Diet preference (e.g. "vegetarian", "vegan"), or "none".
        skill_level: Cooking skill level (e.g. "easy", "medium", "hard").
        mode: The meal goal or usage context (e.g. "quick meals", "meal prep").
    """
    inventory = state.get("inventory")
    if not inventory or not inventory.get("items"):
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        "No inventory available yet. Identify ingredients from a fridge "
                        "image before generating recipes.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    thread_id = state["thread_id"]
    grouped = services.build_structured_inventory(inventory)
    result = services.generate_meal_plan(
        inventory=grouped,
        allergies=allergies,
        dietary_preferences=dietary_preferences,
        skill_level=skill_level,
        mode=mode,
    ).model_dump()

    persistence.save_recipes(thread_id, result)

    recipe_names = [r["name"] for r in result.get("recipes", [])]
    summary = (
        f"Generated {len(recipe_names)} recipes: {', '.join(recipe_names)}. "
        "Present them to the user and offer to tweak or regenerate."
    )

    return Command(
        update={
            "recipes": result,
            "messages": [ToolMessage(summary, tool_call_id=tool_call_id)],
        }
    )


tools = [identify_ingredients, generate_recipes]
model_with_tools = model.bind_tools(tools)


# -----------------------------
# SYSTEM PROMPT
# -----------------------------

SYSTEM_PROMPT = """
You are Kitchen Copilot, a friendly assistant that turns a photo of someone's fridge
into cookable recipes.

Follow this flow:
1. When the user uploads a fridge photo, call `identify_ingredients` with its path.
2. The ingredient list is then reviewed and edited by the user automatically; do not
   ask them to confirm it in chat.
3. Before generating recipes, make sure you know their constraints. Ask ONE concise
   question covering allergies, dietary preferences, cooking skill, and goal. These are
   all optional, so if the user says "skip" or doesn't care, proceed with sensible
   defaults (allergies: none, diet: none, skill: easy, goal: quick meals).
4. Call `generate_recipes`, then summarize the recipes conversationally.
5. Support follow-ups: regenerating with new constraints, swapping ingredients, etc.

Keep replies short and warm. Never invent ingredients the user doesn't have.
"""


# -----------------------------
# NODES
# -----------------------------


def llm_call(state: KitchenState) -> dict:
    """The LLM decides whether to call a tool or reply to the user."""
    response = model_with_tools.invoke(
        [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    )
    return {"messages": [response], "llm_calls": state.get("llm_calls", 0) + 1}


tool_node = ToolNode(tools)


def review_ingredients(state: KitchenState) -> dict:
    """Pause so the frontend can present an editable ingredient list.

    The value passed to ``Command(resume=...)`` should be either the edited inventory
    dict (``{"items": [...]}``) or ``None`` / falsy to accept the detected list as-is.
    """
    edited = interrupt(
        {
            "type": "review_ingredients",
            "instruction": "Review and edit the detected ingredients, then resume.",
            "inventory": state.get("inventory"),
        }
    )

    inventory = edited if edited else state.get("inventory")
    thread_id = state["thread_id"]
    persistence.save_inventory(thread_id, inventory)

    names = [item.get("name") for item in (inventory or {}).get("items", [])]
    confirmation = (
        "Here is my finalized ingredient list: "
        f"{', '.join(n for n in names if n) or '(empty)'}. Please continue."
    )

    return {
        "inventory": inventory,
        "pending_review": False,
        "messages": [HumanMessage(content=confirmation)],
    }


# -----------------------------
# ROUTING
# -----------------------------


def should_continue(state: KitchenState) -> Literal["tools", END]:  # type: ignore[valid-type]
    """Route to the tool node if the LLM requested a tool call, else stop the turn."""
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END


def route_after_tools(
    state: KitchenState,
) -> Literal["review_ingredients", "llm_call"]:
    """After tools run, pause for human review if new ingredients were detected."""
    if state.get("pending_review"):
        return "review_ingredients"
    return "llm_call"


# -----------------------------
# GRAPH
# -----------------------------


def build_agent():
    """Build and compile the Kitchen Copilot agent with an in-memory checkpointer."""
    builder = StateGraph(KitchenState)

    builder.add_node("llm_call", llm_call)
    builder.add_node("tools", tool_node)
    builder.add_node("review_ingredients", review_ingredients)

    builder.add_edge(START, "llm_call")
    builder.add_conditional_edges("llm_call", should_continue, ["tools", END])
    builder.add_conditional_edges(
        "tools", route_after_tools, ["review_ingredients", "llm_call"]
    )
    builder.add_edge("review_ingredients", "llm_call")

    # InMemorySaver keeps per-thread state alive for the life of the process.
    # Swap for a durable checkpointer (e.g. Sqlite/Postgres) when moving to the cloud.
    return builder.compile(checkpointer=InMemorySaver())


agent = build_agent()


# -----------------------------
# CONVENIENCE API (used by the server)
# -----------------------------


def new_thread_id() -> str:
    """Generate a fresh conversation thread id."""
    return uuid.uuid4().hex


def _extract_interrupt(result: dict) -> Optional[dict]:
    """Return the interrupt payload from an invoke result, if the graph paused."""
    interrupts = result.get("__interrupt__")
    if not interrupts:
        return None
    first = interrupts[0]
    return getattr(first, "value", first)


def _message_text(message) -> str:
    """Flatten a message's content into plain text.

    The Responses API returns ``content`` as a list of blocks such as
    ``[{"type": "text", "text": "..."}]`` rather than a plain string, so we join
    the text blocks instead of ``str()``-ing the whole list.
    """
    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                text = block.get("text")
                if text:
                    parts.append(text)
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)
    return str(content)


def _latest_reply(result: dict) -> Optional[str]:
    """Return the text of the last AI message, if any."""
    for message in reversed(result.get("messages", [])):
        if message.__class__.__name__ == "AIMessage":
            text = _message_text(message)
            if text.strip():
                return text
    return None


def _respond(result: dict, thread_id: str) -> dict:
    """Shape an invoke result into a serializable response for the frontend."""
    return {
        "thread_id": thread_id,
        "reply": _latest_reply(result),
        "interrupt": _extract_interrupt(result),
        "inventory": result.get("inventory"),
        "recipes": result.get("recipes"),
    }


def chat(thread_id: str, message: str) -> dict:
    """Send a user message to the agent on a given thread and return its response."""
    config = {"configurable": {"thread_id": thread_id}}
    result = agent.invoke(
        {"messages": [HumanMessage(content=message)], "thread_id": thread_id},
        config=config,
    )
    return _respond(result, thread_id)


def resume_review(thread_id: str, edited_inventory: Optional[dict]) -> dict:
    """Resume a paused thread with the user's edited (or accepted) inventory."""
    config = {"configurable": {"thread_id": thread_id}}
    result = agent.invoke(Command(resume=edited_inventory), config=config)
    return _respond(result, thread_id)
