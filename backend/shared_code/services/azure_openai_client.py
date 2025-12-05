"""
Azure OpenAI Client Service - Handles Azure OpenAI API client initialization
"""

from openai import AzureOpenAI

class AzureOpenAIClientService:
    """Service for interacting with Azure OpenAI API"""
    
    def __init__(self, config):
        """
        Initialize the Azure OpenAI client
        
        Args:
            config: Configuration object containing Azure OpenAI credentials
        """
        azure_config = config.get_azure_config()
        self.client = AzureOpenAI(
            api_key=azure_config["api_key"],
            api_version=azure_config["api_version"],
            azure_endpoint=azure_config["endpoint"]
        )
        self.model_name = azure_config["model_name"]
        
    def get_client(self):
        """Get the initialized Azure OpenAI client"""
        return self.client
        
    def get_model_name(self):
        """Get the model name to use for API calls"""
        return self.model_name