// Ingredients response from the API
export interface IngredientsResponse {
  status?: string;
  result: {
    ingredients: {
      [category: string]: string[];
    };
  };
  summary: {
    total_count: number;
    categories: number;
    by_category: {
      [category: string]: number;
    };
  };
  image_filename?: string;
  request_id?: string;
}

// Dietary restriction interface
export interface DietaryRestriction {
  id: string;
  name: string;
}

// Recipe data interface
export interface Recipe {
  name: string;
  total_ingredients: string[];
  available_ingredients: string[];
  missing_ingredients: string[];
  completeness_score: number;
  instructions: string[];
  cooking_time: string;
  difficulty: string;
}

// Recipe analysis interface
export interface RecipeAnalysis {
  recipe_name: string;
  completeness: number;
  available_count: number;
  missing_count: number;
  total_ingredients: number;
  cooking_time: string;
  difficulty: string;
}

// Recipes response from the API
export interface RecipesResponse {
  items: Recipe[];
  analysis: RecipeAnalysis[];
  ingredient_count: number;
}

// Recipe generation request parameters
export interface GenerateRecipesParams {
  request_id?: string;
  num_recipes?: number;
  dietary_restrictions?: DietaryRestriction[];
}