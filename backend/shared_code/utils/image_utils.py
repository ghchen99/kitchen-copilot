"""
Image Utilities - Functions for handling images with Azure Blob Storage
"""

import base64
from io import BytesIO

def encode_image_from_blob(blob_data):
    """
    Encode a blob image to base64 string
    
    Args:
        blob_data: BytesIO object containing the image data
        
    Returns:
        Base64 encoded string of the image
    """
    blob_data.seek(0)
    return base64.b64encode(blob_data.read()).decode('utf-8')

def encode_image_from_bytes(image_bytes):
    """
    Encode bytes to base64 string
    
    Args:
        image_bytes: Bytes containing the image data
        
    Returns:
        Base64 encoded string of the image
    """
    return base64.b64encode(image_bytes).decode('utf-8')

def find_image_in_container(azure_blob_service, prefix):
    """
    Find the image file in Azure Blob Storage that follows the naming pattern
    
    Args:
        azure_blob_service: Azure Blob Storage service instance
        prefix: Prefix (folder path) to search in
        
    Returns:
        Blob path to the image file or None if not found
    """
    blobs = azure_blob_service.list_blobs(prefix=prefix)
    image_blobs = [blob for blob in blobs if 'image_' in blob]
    return image_blobs[0] if image_blobs else None