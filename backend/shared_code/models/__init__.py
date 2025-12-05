"""
Models package initialization
This makes the models importable directly from the models package
"""

from .ingredients import IngredientsResult
from .recipes import Recipe, RecipeCollection

__all__ = ['IngredientsResult', 'Recipe', 'RecipeCollection']