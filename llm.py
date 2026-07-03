from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
from enum import Enum
import base64
import os

load_dotenv()

endpoint = os.getenv("OPENAI_ENDPOINT")
deployment_name = os.getenv("OPENAI_DEPLOYMENT_NAME")
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    api_key=api_key,
    base_url=endpoint,
)


# -----------------------------
# ENUMS
# -----------------------------

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


# -----------------------------
# OUTPUT SCHEMA
# -----------------------------

class FridgeItem(BaseModel):
    name: str
    classification: Classification
    confidence: float
    clarification: str | None = None


class FridgeInventory(BaseModel):
    items: list[FridgeItem]


# -----------------------------
# IMAGE ENCODING
# -----------------------------

def encode_image(image_path: str) -> str:
    """Encode image as Base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


# -----------------------------
# LOAD IMAGE
# -----------------------------

image_path = "fridge.jpeg"
base64_image = encode_image(image_path)


# -----------------------------
# SYSTEM PROMPT (IMPORTANT PART)
# -----------------------------

system_prompt = """
You are an expert computer vision assistant specialising in household inventory extraction.

Your task is to identify every visible item inside a refrigerator.

For each item you MUST:
- Provide the most specific common food name possible.
- Assign exactly one classification from the allowed enum.
- Provide a confidence score from 0.0 to 1.0.

Clarification rules (based on ambiguity, not thresholds):
- Add a clarification ONLY when the item is visually or semantically ambiguous.
- Do NOT add clarification if the object is clearly identifiable and visually unambiguous.

Trigger clarification when ANY of the following applies:
- The item could reasonably belong to two or more distinct food categories (e.g. condiment vs dessert spread, dairy vs sauce).
- The item is partially occluded, blurry, or too small to distinguish key features.
- The packaging is generic or unreadable (no label, or label not visible).
- Multiple plausible interpretations exist that would change the label meaningfully.

Do NOT add clarification when:
- The item is clearly identifiable even if confidence is moderate.
- Only minor uncertainty exists that does not affect naming (e.g. "apple" vs "green apple").

Clarification style:
- Must be short (1 sentence max)
- Must present 2 plausible interpretations OR ask a focused question
- Must be helpful for human verification
- Can be slightly playful but must remain professional

Examples:
- "Is this Greek yogurt or sour cream?"
- "Could this be cheddar cheese or butter?"
- "I might be wrong—tomato sauce or curry paste in this jar?"

Rules:
- Do not invent objects.
- If partially visible, reduce confidence accordingly.
- If contents are unknown, use 'prepared_food'.
- Return ONLY data matching the schema.
"""


# -----------------------------
# USER PROMPT
# -----------------------------

user_prompt = "Identify every visible item in this refrigerator."


# -----------------------------
# API CALL (SINGLE PASS)
# -----------------------------

response = client.responses.parse(
    model=deployment_name,
    input=[
        {
            "role": "system",
            "content": [{"type": "input_text", "text": system_prompt}],
        },
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": user_prompt},
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{base64_image}",
                },
            ],
        },
    ],
    text_format=FridgeInventory,
)


# -----------------------------
# OUTPUT
# -----------------------------

inventory = response.output_parsed

print("\nDetected items:\n")

for item in inventory.items:
    print(
        f"{item.name:<25}"
        f"{item.classification.value:<18}"
        f"{item.confidence:.2f}"
    )

    if item.clarification:
        print(f"  ↳ Clarification: {item.clarification}")