import logging
import azure.functions as func
import json

from shared_code import config, vision_service, azure_blob_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function to analyze a fridge/food image and identify ingredients
    
    Args:
        req: HTTP request object
    
    Returns:
        HTTP response with analysis result or error message
    """
    logging.info('Python HTTP trigger function processed an analyze-image request.')
    
    try:
        # Check if file was uploaded
        file = req.files.get('file')
        if not file:
            return func.HttpResponse(
                json.dumps({"error": "No file part in the request"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Get file paths for Azure Blob Storage
        paths = config.get_file_paths(file.filename)
        
        # Read the file into memory
        file_bytes = file.read()
        
        # Upload the image to Azure Blob Storage
        azure_blob_service.upload_file(file_bytes, paths["request_image"])
        
        # Process image from the uploaded bytes
        result = vision_service.analyze_image_bytes(file_bytes)
        
        # Save analysis to Azure Blob Storage
        vision_service.save_analysis(result, paths["vision_output"])
        
        # Get a summary
        summary = vision_service.get_ingredients_summary(result)
        
        # Include request_id and just the image filename (not the full path)
        request_id = paths["request_id"]
        image_filename = paths["request_image"].split('/')[-1]
        
        return func.HttpResponse(
            json.dumps({
                "status": "complete",
                "result": result,
                "summary": summary,
                "image_filename": image_filename,
                "request_id": request_id
            }),
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error analyzing image: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )