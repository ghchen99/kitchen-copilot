"""
Prompts package initialization
This makes the prompt functions importable directly from the prompts package
"""

from .recipe_prompt import get_recipe_system_prompt
from .vision_prompt import get_vision_system_prompt

__all__ = ['get_recipe_system_prompt', 'get_vision_system_prompt']