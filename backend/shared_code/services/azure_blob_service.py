"""
Azure Blob Storage Service - Handles operations with Azure Blob Storage
"""

import json
from azure.storage.blob import BlobServiceClient, ContentSettings
from io import BytesIO

class AzureBlobService:
    """Service for interacting with Azure Blob Storage"""
    
    def __init__(self, connection_string, container_name="container01"):
        """
        Initialize the Azure Blob Storage service
        
        Args:
            connection_string: Azure Storage account connection string
            container_name: Name of the blob container (default: container01)
        """
        self.connection_string = connection_string
        self.container_name = container_name
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        
        # Ensure container exists
        container_client = self.blob_service_client.get_container_client(container_name)
        if not container_client.exists():
            self.blob_service_client.create_container(container_name)
    
    def upload_file(self, file_data, blob_path):
        """
        Upload a file to Azure Blob Storage
        
        Args:
            file_data: File data as bytes or BytesIO object
            blob_path: Path within the container where the file should be stored
            
        Returns:
            URL to the uploaded blob
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name, 
            blob=blob_path
        )
        
        # Determine the content type based on file extension
        content_type = 'application/octet-stream'  # Default
        if blob_path.endswith('.jpg') or blob_path.endswith('.jpeg'):
            content_type = 'image/jpeg'
        elif blob_path.endswith('.png'):
            content_type = 'image/png'
        elif blob_path.endswith('.json'):
            content_type = 'application/json'
            
        # Upload the file with appropriate content settings
        content_settings = ContentSettings(content_type=content_type)
        
        # Ensure we have bytes for uploading
        if isinstance(file_data, BytesIO):
            file_data.seek(0)
            data = file_data.read()
        else:
            data = file_data
            
        blob_client.upload_blob(data, content_settings=content_settings, overwrite=True)
        return blob_client.url
    
    def upload_json(self, json_data, blob_path):
        """
        Upload JSON data to Azure Blob Storage
        
        Args:
            json_data: Dictionary to be serialized as JSON
            blob_path: Path within the container where the JSON should be stored
            
        Returns:
            URL to the uploaded blob
        """
        json_str = json.dumps(json_data, indent=2)
        json_bytes = json_str.encode('utf-8')
        return self.upload_file(json_bytes, blob_path)
    
    def download_file(self, blob_path):
        """
        Download a file from Azure Blob Storage
        
        Args:
            blob_path: Path to the blob within the container
            
        Returns:
            BytesIO object containing the file data
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name, 
            blob=blob_path
        )
        
        download_stream = BytesIO()
        download_stream.write(blob_client.download_blob().readall())
        download_stream.seek(0)
        
        return download_stream
    
    def download_json(self, blob_path):
        """
        Download and parse JSON data from Azure Blob Storage
        
        Args:
            blob_path: Path to the JSON blob within the container
            
        Returns:
            Parsed JSON object (dictionary)
        """
        download_stream = self.download_file(blob_path)
        json_str = download_stream.read().decode('utf-8')
        return json.loads(json_str)
    
    def list_blobs(self, prefix=None):
        """
        List blobs in the container, optionally filtered by prefix
        
        Args:
            prefix: Optional prefix to filter blobs
            
        Returns:
            List of blob names
        """
        container_client = self.blob_service_client.get_container_client(self.container_name)
        blobs = container_client.list_blobs(name_starts_with=prefix)
        return [blob.name for blob in blobs]
    
    def blob_exists(self, blob_path):
        """
        Check if a blob exists
        
        Args:
            blob_path: Path to the blob within the container
            
        Returns:
            Boolean indicating if the blob exists
        """
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name, 
            blob=blob_path
        )
        return blob_client.exists()