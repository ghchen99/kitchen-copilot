"""
Configuration module - Handles environment variables and configuration for Azure Functions
"""

import os
import time

class Config:
    """Configuration class that loads and provides access to environment variables"""
    
    def __init__(self):
        """Initialize configuration by loading environment variables"""
        # No need for dotenv in Azure Functions, variables are loaded from local.settings.json
        
        # Azure OpenAI settings
        self.azure_openai_api_key = os.environ.get("AZURE_OPENAI_API_KEY")
        self.azure_openai_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
        self.api_version = os.environ.get("API_VERSION")
        self.model_name = os.environ.get("MODEL_NAME")
        
        # Azure Blob Storage settings
        self.azure_storage_connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
        self.azure_storage_container = os.environ.get("AZURE_STORAGE_CONTAINER")
    
    def get_azure_config(self):
        """Get Azure OpenAI configuration as a dictionary"""
        return {
            "api_key": self.azure_openai_api_key,
            "api_version": self.api_version,
            "endpoint": self.azure_openai_endpoint,
            "model_name": self.model_name
        }
    
    def get_azure_storage_config(self):
        """Get Azure Blob Storage configuration as a dictionary"""
        return {
            "connection_string": self.azure_storage_connection_string,
            "container_name": self.azure_storage_container
        }
    
    def get_file_paths(self, image_filename=None, request_id=None):
        """
        Get file paths for input and output files in Azure Blob Storage
        
        Args:
            image_filename: Optional image filename to create request-specific paths
            request_id: Optional request ID to retrieve existing paths
            
        Returns:
            Dictionary with paths for input and output files within Azure Blob Storage
            
        Raises:
            ValueError: If neither image_filename nor request_id is provided
        """
        if image_filename:
            # Create a timestamp and unique ID for blob naming
            timestamp = int(time.time())
            
            unique_id = os.urandom(4).hex()
                
            # Create a timestamp-based folder name
            folder_name = f"fridge_{timestamp}_{unique_id}"
            
            # Create blob paths
            image_name = f"image_{timestamp}_{unique_id}{os.path.splitext(image_filename)[1]}"
            ingredients_name = f"ingredients_{timestamp}_{unique_id}.json"
            recipes_name = f"recipes_{timestamp}_{unique_id}.json"
            dietary_name = f"dietary_{timestamp}_{unique_id}.json"
            
            paths = {
                "request_dir": folder_name,
                "vision_output": f"{folder_name}/{ingredients_name}",
                "recipes_output": f"{folder_name}/{recipes_name}",
                "dietary_output": f"{folder_name}/{dietary_name}",
                "request_image": f"{folder_name}/{image_name}",
                "request_id": folder_name
            }
        elif request_id:
            # For existing requests, construct the paths based on request_id
            id_part = request_id.split('_', 1)[1] if '_' in request_id else request_id
            
            paths = {
                "request_dir": request_id,
                "vision_output": f"{request_id}/ingredients_{id_part}.json",
                "recipes_output": f"{request_id}/recipes_{id_part}.json",
                "dietary_output": f"{request_id}/dietary_{id_part}.json",
                "request_image": f"{request_id}/image_{id_part}.jpg",  # Default to .jpg
                "request_id": request_id
            }
        else:
            # No filename or request_id provided - this is an error case
            raise ValueError("Either image_filename or request_id must be provided to get file paths")
                
        return paths