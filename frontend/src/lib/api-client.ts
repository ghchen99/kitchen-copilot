import axios from 'axios';
import { IngredientsResponse, RecipesResponse, DietaryRestriction, GenerateRecipesParams } from '@/types';

// Get the function key from environment variables
const FUNCTION_KEY = process.env.NEXT_PUBLIC_FUNCTION_KEY;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-functions-key': FUNCTION_KEY,
  },
});

export async function analyzeImage(file: File): Promise<IngredientsResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/analyze-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      // Ensure the key is also included in form submissions
      'x-functions-key': FUNCTION_KEY,
    },
  });
  
  return response.data;
}

export async function getIngredients(requestId?: string): Promise<IngredientsResponse> {
  const params = requestId ? { request_id: requestId } : {};
  const response = await apiClient.get('/ingredients', { params });
  return response.data;
}

export async function generateRecipes(
  requestId?: string, 
  numRecipes: number = 5,
  dietaryRestrictions: DietaryRestriction[] = []
): Promise<RecipesResponse> {
  const payload: GenerateRecipesParams = {
    request_id: requestId,
    num_recipes: numRecipes,
  };
  
  // Only add dietary restrictions if there are any selected
  if (dietaryRestrictions.length > 0) {
    payload.dietary_restrictions = dietaryRestrictions;
  }
  
  const response = await apiClient.post('/generate-recipes', payload);
  return response.data;
}

export async function getRecipes(requestId?: string): Promise<RecipesResponse> {
  const params = requestId ? { request_id: requestId } : {};
  const response = await apiClient.get('/recipes', { params });
  return response.data;
}