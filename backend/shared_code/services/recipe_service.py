"""
Recipe Service - Service for generating recipe suggestions based on ingredients
"""

import json
import pandas as pd
from ..prompts.recipe_prompt import get_recipe_system_prompt

class RecipeService:
    """Service for generating recipes based on available ingredients"""
    
    def __init__(self, azure_openai_client, azure_blob_service=None):
        """
        Initialize the Recipe Service
        
        Args:
            azure_openai_client: An initialized AzureOpenAIClientService object
            azure_blob_service: An initialized AzureBlobService object
        """
        self.client = azure_openai_client.get_client()
        self.model_name = azure_openai_client.get_model_name()
        self.azure_blob_service = azure_blob_service
    
    def load_ingredients(self, blob_path):
        """
        Load and flatten ingredients from JSON in Azure Blob Storage
        
        Args:
            blob_path: Path to the blob containing ingredients JSON
            
        Returns:
            List of ingredient strings
        """
        try:
            # Download the JSON from Azure Blob Storage
            data = self.azure_blob_service.download_json(blob_path)
            
            # Extract ingredients from the full response
            # Check if it's a full API response or just the ingredients
            if 'result' in data and 'ingredients' in data['result']:
                ingredients_data = data['result']['ingredients']
            elif 'ingredients' in data:
                ingredients_data = data['ingredients']
            else:
                raise ValueError("Could not find ingredients in the JSON file")
            
            # Flatten the ingredients list
            all_ingredients = []
            for category, items in ingredients_data.items():
                all_ingredients.extend(items)
            
            return all_ingredients
        except Exception as e:
            raise Exception(f"Error loading ingredients: {str(e)}")
    
    def generate_recipes(self, ingredients, num_recipes=5, dietary_restrictions=None):
        """
        Generate recipe suggestions using Azure OpenAI API
        
        Args:
            ingredients: List of available ingredients
            num_recipes: Number of recipes to generate
            dietary_restrictions: List of dietary restrictions to consider
            
        Returns:
            Dictionary containing recipe suggestions
        """
        ingredients_str = ", ".join(ingredients)
        
        # Build user prompt with dietary restrictions if provided
        user_prompt = f"""Here are the ingredients I have available: {ingredients_str}. 
Please suggest {num_recipes} diverse recipes that I could make with these ingredients. 
Include some recipes that use most of what I have, and some creative options that might 
require a few additional ingredients. Focus on wholesome, flavorful dishes."""

        # Add dietary restrictions to the prompt if present
        if dietary_restrictions and len(dietary_restrictions) > 0:
            # Extract just the names for a more readable prompt
            restrictions = [restriction.get('name', 'Unknown') for restriction in dietary_restrictions]
            restrictions_str = ", ".join(restrictions)
            
            user_prompt += f"""

IMPORTANT: I have the following dietary restrictions that must be strictly followed: {restrictions_str}.
Make sure ALL recipe suggestions comply with these restrictions.
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": get_recipe_system_prompt()},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"Error generating recipes: {str(e)}")
    
    def save_recipes(self, recipes_data, blob_path):
        """
        Save recipes to Azure Blob Storage
        
        Args:
            recipes_data: Recipe data (complete response)
            blob_path: Path within the container where to save the JSON
            
        Returns:
            URL to the saved JSON file
        """
        return self.azure_blob_service.upload_json(recipes_data, blob_path)
    
    def get_recipes_analysis(self, recipes_data):
        """
        Create a DataFrame with recipe analysis
        
        Args:
            recipes_data: Recipe data from generate_recipes
            
        Returns:
            DataFrame with recipe analysis or None if no recipes
        """
        # Check if recipes_data is already the full response or just the recipes
        if isinstance(recipes_data, dict) and "recipes" in recipes_data:
            recipes_list = recipes_data["recipes"]
        elif isinstance(recipes_data, dict) and "items" in recipes_data:
            recipes_list = recipes_data["items"]
        else:
            recipes_list = []
        
        if not recipes_list:
            return None
        
        return pd.DataFrame([{
            "recipe_name": r["name"],
            "completeness": r["completeness_score"],
            "available_count": len(r["available_ingredients"]),
            "missing_count": len(r["missing_ingredients"]),
            "total_ingredients": len(r["total_ingredients"]),
            "cooking_time": r["cooking_time"],
            "difficulty": r["difficulty"]
        } for r in recipes_list])