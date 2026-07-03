// Shared types mirroring the FastAPI / pydantic schemas.

export type Classification =
  | "fruit"
  | "vegetable"
  | "herb"
  | "dairy"
  | "cheese"
  | "eggs"
  | "meat"
  | "seafood"
  | "plant_protein"
  | "condiment"
  | "sauce"
  | "grain"
  | "bread"
  | "prepared_food"
  | "beverage"
  | "dessert"
  | "other";

export const CLASSIFICATIONS: Classification[] = [
  "fruit",
  "vegetable",
  "herb",
  "dairy",
  "cheese",
  "eggs",
  "meat",
  "seafood",
  "plant_protein",
  "condiment",
  "sauce",
  "grain",
  "bread",
  "prepared_food",
  "beverage",
  "dessert",
  "other",
];

// Loose accent colors per classification, used for bbox chips/dots.
export const CLASS_COLORS: Record<Classification, string> = {
  fruit: "#ff6b6b",
  vegetable: "#51cf66",
  herb: "#94d82d",
  dairy: "#ffd43b",
  cheese: "#fcc419",
  eggs: "#ffa94d",
  meat: "#ff8787",
  seafood: "#4dabf7",
  plant_protein: "#38d9a9",
  condiment: "#da77f2",
  sauce: "#e599f7",
  grain: "#d8b384",
  bread: "#e8a87c",
  prepared_food: "#63e6be",
  beverage: "#74c0fc",
  dessert: "#faa2c1",
  other: "#adb5bd",
};

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface FridgeItem {
  name: string;
  classification: Classification;
  confidence: number;
  bbox: BoundingBox | null;
}

export interface Inventory {
  items: FridgeItem[];
}

export interface Ingredient {
  name: string;
  amount?: string | null;
  optional?: boolean;
  note?: string | null;
}

export interface Nutrition {
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

export interface Recipe {
  name: string;
  intro: string;
  ingredients: Ingredient[];
  missing_ingredients: string[];
  steps: string[];
  time_minutes: number;
  difficulty: string;
  nutrition?: Nutrition | null;
  dietary_tags: string[];
  flavor_profile: string[];
}

export interface MealPlan {
  recipes: Recipe[];
  quick_snack_ideas: string[];
  missing_common_items: string[];
}

export interface ReviewInterrupt {
  type: "review_ingredients";
  instruction: string;
  inventory: Inventory;
}

export interface AgentResponse {
  thread_id: string;
  reply: string | null;
  interrupt: ReviewInterrupt | null;
  inventory: Inventory | null;
  recipes: MealPlan | null;
}

export type ChatMessage =
  | { id: string; role: "user" | "assistant"; kind: "text"; text: string }
  | { id: string; role: "user"; kind: "image"; imageUrl: string }
  | { id: string; role: "assistant"; kind: "recipes"; plan: MealPlan };
