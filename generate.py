import os
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum
from collections import defaultdict
import json

# ----------------------------
# ENV
# ----------------------------

load_dotenv()

endpoint = os.getenv("OPENAI_ENDPOINT")
deployment_name = os.getenv("OPENAI_DEPLOYMENT_NAME")
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    api_key=api_key,
    base_url=endpoint,
)

# ----------------------------
# CLASSIFICATION ENUM
# ----------------------------

class Classification(str, Enum):
    fruit = "fruit"
    vegetable = "vegetable"
    herb = "herb"

    dairy = "dairy"
    cheese = "cheese"
    eggs = "eggs"

    meat = "meat"
    seafood = "seafood"
    plant_protein = "plant_protein"

    condiment = "condiment"
    sauce = "sauce"
    grain = "grain"
    bread = "bread"

    prepared_food = "prepared_food"
    beverage = "beverage"
    dessert = "dessert"

    other = "other"


# ----------------------------
# INVENTORY BUILDER (ENUM-BASED)
# ----------------------------

def build_structured_inventory(detection_json: dict) -> Dict[str, List[str]]:
    """
    Groups items by Classification enum.
    Does NOT modify item names.
    """

    grouped = defaultdict(list)

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


# ----------------------------
# PYDANTIC SCHEMAS
# ----------------------------

class Nutrition(BaseModel):
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None


class Ingredient(BaseModel):
    name: str
    amount: Optional[str] = None
    optional: bool = False
    note: Optional[str] = None


class Recipe(BaseModel):
    name: str
    intro: str

    ingredients: List[Ingredient]
    missing_ingredients: List[str]

    steps: List[str]

    time_minutes: int
    difficulty: str  # easy | medium | hard

    nutrition: Optional[Nutrition] = None

    dietary_tags: List[str]
    flavor_profile: List[str]

    confidence_score: Optional[float] = None


class FridgeAssistantResponse(BaseModel):
    recipes: List[Recipe]
    quick_snack_ideas: List[str]
    missing_common_items: List[str]


# ----------------------------
# SYSTEM PROMPT
# ----------------------------

system_prompt = """
You are a fridge-to-recipe AI engine.

Rules:
- Use ONLY inventory items + basic pantry staples (salt, pepper, oil, water)
- Do NOT invent ingredients
- Respect allergies and dietary restrictions strictly
- Keep recipes realistic and home-cookable
- Treat item names exactly as provided (do not rename them)
- Output must follow schema exactly
"""


# ----------------------------
# LLM CALL
# ----------------------------

def generate_meal_plan(
    inventory: dict,
    allergies: str,
    dietary_preferences: str,
    skill_level: str,
    mode: str,
):
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
        model=deployment_name,
        input=[
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
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


# ----------------------------
# EXAMPLE RUN
# ----------------------------

if __name__ == "__main__":

    with open("gpt-5.4-mini_fridge_inventory.json", "r", encoding="utf-8") as f:
        raw_detection = json.load(f)

    inventory = build_structured_inventory(raw_detection)

    result = generate_meal_plan(
        inventory=inventory,
        allergies="none",
        dietary_preferences="vegetarian",
        skill_level="easy",
        mode="quick meals",
    )

    print(result.model_dump_json(indent=2))

    # convert pydantic model → dict
    data = result.model_dump()

    # write to file
    with open("fridge_meal_plan.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Saved to fridge_meal_plan.json")