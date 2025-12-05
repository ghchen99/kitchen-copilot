"""
Ingredients Models - Data models for ingredients
"""

from dataclasses import dataclass
from typing import Dict, List

@dataclass
class IngredientsResult:
    """Data class representing ingredients analysis result"""
    ingredients: Dict[str, List[str]]
    
    @classmethod
    def from_dict(cls, data):
        """
        Create an IngredientsResult instance from a dictionary
        
        Args:
            data: Dictionary with ingredients by category
            
        Returns:
            IngredientsResult instance
        """
        if "ingredients" not in data:
            raise ValueError("Invalid ingredients data: 'ingredients' key not found")
        return cls(ingredients=data["ingredients"])
    
    def to_dict(self):
        """
        Convert to dictionary representation
        
        Returns:
            Dictionary with ingredients data
        """
        return {
            "ingredients": self.ingredients
        }
    
    def get_all_ingredients(self):
        """
        Get a flattened list of all ingredients
        
        Returns:
            List of all ingredients across categories
        """
        result = []
        for category_items in self.ingredients.values():
            result.extend(category_items)
        return result