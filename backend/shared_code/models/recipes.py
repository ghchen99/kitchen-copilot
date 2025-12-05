"""
Recipe Models - Data models for recipes
"""

from dataclasses import dataclass
from typing import List

@dataclass
class Recipe:
    """Data class representing a single recipe"""
    name: str
    total_ingredients: List[str]
    available_ingredients: List[str]
    missing_ingredients: List[str]
    completeness_score: float
    instructions: List[str]
    cooking_time: str
    difficulty: str
    
    @classmethod
    def from_dict(cls, data):
        """
        Create a Recipe instance from a dictionary
        
        Args:
            data: Dictionary with recipe data
            
        Returns:
            Recipe instance
        """
        return cls(
            name=data["name"],
            total_ingredients=data["total_ingredients"],
            available_ingredients=data["available_ingredients"],
            missing_ingredients=data["missing_ingredients"],
            completeness_score=data["completeness_score"],
            instructions=data["instructions"],
            cooking_time=data["cooking_time"],
            difficulty=data["difficulty"]
        )
    
    def to_dict(self):
        """
        Convert to dictionary representation
        
        Returns:
            Dictionary with recipe data
        """
        return {
            "name": self.name,
            "total_ingredients": self.total_ingredients,
            "available_ingredients": self.available_ingredients,
            "missing_ingredients": self.missing_ingredients,
            "completeness_score": self.completeness_score,
            "instructions": self.instructions,
            "cooking_time": self.cooking_time,
            "difficulty": self.difficulty
        }

@dataclass
class RecipeCollection:
    """Data class representing a collection of recipes"""
    recipes: List[Recipe]
    
    @classmethod
    def from_dict(cls, data):
        """
        Create a RecipeCollection instance from a dictionary
        
        Args:
            data: Dictionary with recipes data
            
        Returns:
            RecipeCollection instance
        """
        if "recipes" not in data:
            raise ValueError("Invalid recipes data: 'recipes' key not found")
            
        recipes = [Recipe.from_dict(r) for r in data["recipes"]]
        return cls(recipes=recipes)
    
    def to_dict(self):
        """
        Convert to dictionary representation
        
        Returns:
            Dictionary with recipes data
        """
        return {
            "recipes": [r.to_dict() for r in self.recipes]
        }