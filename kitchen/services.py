"""Core AI services: fridge-image inventory detection and recipe generation.

These functions are pure (no module-level side effects) so they can be called from
the LangGraph agent tools, the FastAPI server, or the original CLI scripts.
"""

import base64
from collections import defaultdict
from typing import Dict, List

from .config import OPENAI_DEPLOYMENT_NAME, get_openai_client
from .schemas import Classification, FridgeAssistantResponse, FridgeInventory

# -----------------------------
# PROMPTS
# -----------------------------

VISION_SYSTEM_PROMPT = """
You are a precise computer vision system for refrigerator inventory detection.

TASK:
Identify every visible food item in the refrigerator image.

OUTPUT REQUIREMENTS:
- Return ALL visible items.
- Do NOT invent objects.
- Do NOT merge items unless they are physically the same object.

BOUNDING BOX RULES:
- Normalized coordinates (0.0 to 1.0)
- (x_min, y_min) top-left
- (x_max, y_max) bottom-right

DETERMINISM RULES:
- List items top-to-bottom, left-to-right

CLASSIFICATION RULES:
- Assign exactly one enum class per item

CONFIDENCE RULES:
- 0.9-1.0 clear
- 0.6-0.89 uncertain
- <0.6 ambiguous

Return only final labels.
"""

RECIPE_SYSTEM_PROMPT = """
You are a fridge-to-recipe AI engine.

Rules:
- Use ONLY inventory items + basic pantry staples (salt, pepper, oil, water)
- Do NOT invent ingredients
- Respect allergies and dietary restrictions strictly
- Keep recipes realistic and home-cookable
- Treat item names exactly as provided (do not rename them)
- Output must follow schema exactly
"""


# -----------------------------
# IMAGE ENCODING
# -----------------------------


def encode_image(image_path: str) -> str:
    """Base64-encode an image file for the vision model."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


# -----------------------------
# STAGE 1: IMAGE -> INVENTORY
# -----------------------------


def detect_inventory(image_path: str) -> FridgeInventory:
    """Run the vision model on a fridge image and return structured inventory."""
    client = get_openai_client()
    base64_image = encode_image(image_path)

    response = client.responses.parse(
        model=OPENAI_DEPLOYMENT_NAME,
        input=[
            {
                "role": "system",
                "content": [{"type": "input_text", "text": VISION_SYSTEM_PROMPT}],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "Identify every visible item in this refrigerator.",
                    },
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{base64_image}",
                    },
                ],
            },
        ],
        text_format=FridgeInventory,
        temperature=0,
    )

    return response.output_parsed


# -----------------------------
# INVENTORY GROUPING
# -----------------------------


def build_structured_inventory(detection_json: dict) -> Dict[str, List[str]]:
    """Group item names by classification enum without renaming them."""
    grouped: Dict[str, List[str]] = defaultdict(list)

    for item in detection_json.get("items", []):
        name = item.get("name")
        raw_class = item.get("classification", "other")

        if not name:
            continue

        try:
            cls = Classification(raw_class)
        except ValueError:
            cls = Classification.other

        grouped[cls.value].append(name)

    return dict(grouped)


# -----------------------------
# STAGE 2: INVENTORY -> RECIPES
# -----------------------------


def generate_meal_plan(
    inventory: dict,
    allergies: str,
    dietary_preferences: str,
    skill_level: str,
    mode: str,
) -> FridgeAssistantResponse:
    """Generate recipes, snacks, and shopping suggestions from grouped inventory."""
    client = get_openai_client()

    user_prompt = f"""
Fridge inventory:
{inventory}

User constraints:
- Allergies: {allergies}
- Diet: {dietary_preferences}
- Cooking skill: {skill_level}
- Goal: {mode}

Task:

1. Generate 3 recipes using ONLY items in inventory + pantry staples.

Each recipe must include:
- name
- intro
- ingredients (with optional amounts)
- missing_ingredients
- steps (detailed instructions)
- time_minutes
- difficulty
- nutrition (calories, protein_g, carbs_g, fat_g)
- dietary_tags
- flavor_profile

2. Provide 3 snack ideas using ONLY available items.

3. Provide 5 commonly missing grocery items for better meals.

Constraints:
- no allergens
- no diet violations
- no invented ingredients
- do not rename ingredients
"""

    response = client.responses.parse(
        model=OPENAI_DEPLOYMENT_NAME,
        input=[
            {
                "role": "system",
                "content": [{"type": "input_text", "text": RECIPE_SYSTEM_PROMPT}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": user_prompt}],
            },
        ],
        text_format=FridgeAssistantResponse,
        temperature=0.4,
    )

    return response.output_parsed
