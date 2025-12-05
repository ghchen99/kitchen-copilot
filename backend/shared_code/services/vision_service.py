"""
Vision Service - Service for analyzing fridge/food images
"""

import json
from ..utils.image_utils import encode_image_from_blob, encode_image_from_bytes
from ..prompts.vision_prompt import get_vision_system_prompt

class VisionService:
    """Service for analyzing food/fridge images using Azure OpenAI Vision API"""
    
    def __init__(self, azure_openai_client, azure_blob_service=None):
        """
        Initialize the Vision Service
        
        Args:
            azure_openai_client: An initialized AzureOpenAIClientService object
            azure_blob_service: An initialized AzureBlobService object
        """
        self.client = azure_openai_client.get_client()
        self.model_name = azure_openai_client.get_model_name()
        self.azure_blob_service = azure_blob_service
    
    def analyze_image_bytes(self, image_bytes):
        """
        Analyze the image using Azure OpenAI Vision API
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Dictionary containing the analysis results
            
        Raises:
            Exception: If the API call fails or parsing fails
        """
        try:
            base64_image = encode_image_from_bytes(image_bytes)
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": get_vision_system_prompt()},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Please identify all the food ingredients and items in this refrigerator image. List as many as you can see and be specific about each item."},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"Error analyzing image: {str(e)}")
    
    def analyze_image(self, blob_path):
        """
        Analyze the image from Azure Blob Storage using Azure OpenAI Vision API
        
        This method is provided for cases where you need to analyze an image
        that's already stored in Azure Blob Storage.
        
        Args:
            blob_path: Path to the blob within the container
            
        Returns:
            Dictionary containing the analysis results
            
        Raises:
            Exception: If the API call fails or parsing fails
        """
        try:
            # Download the image from Azure Blob Storage
            image_data = self.azure_blob_service.download_file(blob_path)
            base64_image = encode_image_from_blob(image_data)
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": get_vision_system_prompt()},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Please identify all the food ingredients and items in this refrigerator image. List as many as you can see and be specific about each item."},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"Error analyzing image: {str(e)}")
    
    def save_analysis(self, analysis_data, blob_path):
        """
        Save the analysis result to Azure Blob Storage
        
        Args:
            analysis_data: The complete analysis data to save
            blob_path: Path within the container where to save the JSON
            
        Returns:
            URL to the saved JSON file
        """
        return self.azure_blob_service.upload_json(analysis_data, blob_path)
    
    def get_ingredients_summary(self, analysis_result):
        """
        Generate a summary of the ingredients from the analysis
        
        Args:
            analysis_result: The analysis result from analyze_image
            
        Returns:
            Dictionary with summary statistics
        """
        if "ingredients" not in analysis_result:
            return {
                "total_count": 0,
                "categories": 0,
                "by_category": {}
            }
        
        categories = analysis_result["ingredients"]
        by_category = {category: len(items) for category, items in categories.items()}
        total_count = sum(by_category.values())
        
        return {
            "total_count": total_count,
            "categories": len(categories),
            "by_category": by_category
        }