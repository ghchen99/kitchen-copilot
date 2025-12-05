import logging
import azure.functions as func
import json

from shared_code import config, azure_blob_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function to get recipes for the specified request ID
    
    Args:
        req: HTTP request object
    
    Returns:
        HTTP response with recipes data or error message
    """
    logging.info('Python HTTP trigger function processed a get-recipes request.')
    
    try:
        # Get request ID (folder name) from query parameter
        request_id = req.params.get('request_id')
        
        if not request_id:
            return func.HttpResponse(
                json.dumps({
                    "error": "Missing required parameter: request_id. Please specify a request_id to retrieve recipes."
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        try:
            # Get paths using the request_id
            paths = config.get_file_paths(request_id=request_id)
            recipes_blob = paths["recipes_output"]
        except ValueError as e:
            return func.HttpResponse(
                json.dumps({"error": str(e)}),
                status_code=404,
                mimetype="application/json"
            )
        
        # Check if blob exists
        if not azure_blob_service.blob_exists(recipes_blob):
            return func.HttpResponse(
                json.dumps({
                    "error": f"No recipes file found for request_id: {request_id}"
                }),
                status_code=404,
                mimetype="application/json"
            )
        
        # Load and return the recipes from Azure Blob Storage
        recipes_data = azure_blob_service.download_json(recipes_blob)
        return func.HttpResponse(
            json.dumps(recipes_data),
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error retrieving recipes: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )