"""Shared pydantic schemas and enums for inventory detection and recipe generation.

These are extracted from the original ``identify.py`` / ``generate.py`` scripts so
that both the standalone scripts and the LangGraph agent can reuse a single source
of truth.
"""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


# -----------------------------
# CLASSIFICATION ENUM
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
# INVENTORY SCHEMAS
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
    bbox: Optional[BoundingBox] = None


class FridgeInventory(BaseModel):
    items: List[FridgeItem]


# -----------------------------
# RECIPE SCHEMAS
# -----------------------------


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


class FridgeAssistantResponse(BaseModel):
    recipes: List[Recipe]
    quick_snack_ideas: List[str]
    missing_common_items: List[str]
