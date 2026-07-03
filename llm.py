from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
from enum import Enum
import base64
import os

from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt

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

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float


class FridgeItem(BaseModel):
    name: str
    classification: Classification
    confidence: float
    bbox: BoundingBox | None = None


class FridgeInventory(BaseModel):
    items: list[FridgeItem]


# -----------------------------
# IMAGE ENCODING
# -----------------------------

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


image_path = "./sample-images/fridge.jpeg"
base64_image = encode_image(image_path)


# -----------------------------
# SYSTEM PROMPT
# -----------------------------

system_prompt = """
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
- 0.9–1.0 clear
- 0.6–0.89 uncertain
- <0.6 ambiguous

Return only final labels.
"""


# -----------------------------
# USER PROMPT
# -----------------------------

user_prompt = "Identify every visible item in this refrigerator."


# -----------------------------
# API CALL
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
    temperature=0,
)

inventory = response.output_parsed

print("\nDetected items:\n")

for item in inventory.items:
    bbox = item.bbox

    bbox_str = (
        f"({bbox.x_min:.2f}, {bbox.y_min:.2f}, "
        f"{bbox.x_max:.2f}, {bbox.y_max:.2f})"
        if bbox else "None"
    )

    print(
        f"{item.name:<25}"
        f"{item.classification.value:<18}"
        f"{item.confidence:.2f}   "
        f"{bbox_str}"
    )


# -----------------------------
# VISUALIZATION (ADDED)
# -----------------------------

img = Image.open(image_path).convert("RGB")
draw = ImageDraw.Draw(img)

width, height = img.size

try:
    font = ImageFont.truetype("arial.ttf", 16)
except:
    font = ImageFont.load_default()

COLOR_MAP = {
    "fruit": "red",
    "vegetable": "green",
    "meat": "blue",
    "dairy": "orange",
    "cheese": "yellow",
    "eggs": "purple",
    "other": "white",
}

for item in inventory.items:
    if not item.bbox:
        continue

    x_min = item.bbox.x_min * width
    y_min = item.bbox.y_min * height
    x_max = item.bbox.x_max * width
    y_max = item.bbox.y_max * height

    color = COLOR_MAP.get(item.classification.value, "lime")

    # box
    draw.rectangle([x_min, y_min, x_max, y_max], outline=color, width=3)

    label = f"{item.name} ({item.confidence:.2f})"

    text_bbox = draw.textbbox((0, 0), label, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]

    # label background
    draw.rectangle(
        [x_min, y_min - text_h - 4, x_min + text_w + 6, y_min],
        fill=color,
    )

    draw.text(
        (x_min + 3, y_min - text_h - 2),
        label,
        fill="black",
        font=font,
    )

# show result
plt.figure(figsize=(10, 8))
plt.imshow(img)
plt.axis("off")
plt.show()

# optional save
img.save(f"{deployment_name}_fridge_annotated.jpg")