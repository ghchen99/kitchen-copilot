"""Centralized configuration and client construction.

Reads credentials from environment variables (loaded from a local ``.env`` file):

- ``OPENAI_ENDPOINT``         Base URL of the OpenAI-compatible endpoint.
- ``OPENAI_DEPLOYMENT_NAME``  Model / deployment name to use.
- ``OPENAI_API_KEY``          API key for the endpoint.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
OPENAI_DEPLOYMENT_NAME = os.getenv("OPENAI_DEPLOYMENT_NAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Directory where per-thread artifacts (images, inventories, recipes) are stored.
DATA_DIR = os.getenv("KITCHEN_DATA_DIR", "data")


@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    """Return a cached OpenAI client for structured vision + recipe calls."""
    return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_ENDPOINT)
