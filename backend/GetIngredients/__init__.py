import logging
import azure.functions as func
import json

from shared_code import config, azure_blob_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function to get ingredients for the specified request ID
    
    Args:
        req: HTTP request object
    
    Returns:
        HTTP response with ingredients data or error message
    """
    logging.info('Python HTTP trigger function processed a get-ingredients request.')
    
    try:
        # Get request ID (folder name) from query parameter
        request_id = req.params.get('request_id')
        
        if not request_id:
            return func.HttpResponse(
                json.dumps({
                    "error": "Missing required parameter: request_id. Please specify a request_id to retrieve ingredients."
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        try:
            # Get paths using the request_id
            paths = config.get_file_paths(request_id=request_id)
            ingredients_blob = paths["vision_output"]
        except ValueError as e:
            return func.HttpResponse(
                json.dumps({"error": str(e)}),
                status_code=404,
                mimetype="application/json"
            )
        
        # Check if blob exists
        if not azure_blob_service.blob_exists(ingredients_blob):
            return func.HttpResponse(
                json.dumps({
                    "error": f"No ingredients file found for request_id: {request_id}"
                }),
                status_code=404,
                mimetype="application/json"
            )
        
        # Load and return the ingredients from Azure Blob Storage
        ingredients_data = azure_blob_service.download_json(ingredients_blob)
        return func.HttpResponse(
            json.dumps(ingredients_data),
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error retrieving ingredients: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )