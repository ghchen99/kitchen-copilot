"""
Shared module initialization - Initializes services used across functions
"""

from .config import Config
from .services.azure_openai_client import AzureOpenAIClientService
from .services.azure_blob_service import AzureBlobService
from .services.vision_service import VisionService
from .services.recipe_service import RecipeService

# Initialize shared services (done once per instance)
config = Config()

# Initialize Azure OpenAI client
azure_openai_client = AzureOpenAIClientService(config)

# Initialize Azure Blob Storage service
storage_config = config.get_azure_storage_config()
azure_blob_service = AzureBlobService(
    connection_string=storage_config["connection_string"],
    container_name=storage_config["container_name"]
)

# Initialize vision and recipe services
vision_service = VisionService(azure_openai_client, azure_blob_service)
recipe_service = RecipeService(azure_openai_client, azure_blob_service)