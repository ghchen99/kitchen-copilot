import logging
import azure.functions as func
import json

from shared_code import config, recipe_service, azure_blob_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function to generate recipe suggestions based on available ingredients
    
    Args:
        req: HTTP request object
    
    Returns:
        HTTP response with generated recipes or error message
    """
    logging.info('Python HTTP trigger function processed a generate-recipes request.')
    
    try:
        # Parse request data
        try:
            req_body = req.get_json()
        except ValueError:
            req_body = {}
        
        num_recipes = req_body.get('num_recipes', 5)
        request_id = req_body.get('request_id')
        dietary_restrictions = req_body.get('dietary_restrictions', [])
        
        if not request_id:
            return func.HttpResponse(
                json.dumps({
                    "error": "Missing required parameter: request_id. Please specify a request_id to generate recipes."
                }),
                status_code=400,
                mimetype="application/json"
            )
        
        try:
            # Get paths using the request_id
            paths = config.get_file_paths(request_id=request_id)
            ingredients_blob = paths["vision_output"]
            recipes_blob = paths["recipes_output"]
            
            # New path for dietary restrictions if any are provided
            dietary_blob = paths.get("dietary_output") if dietary_restrictions else None
        except ValueError as e:
            return func.HttpResponse(
                json.dumps({"error": str(e)}),
                status_code=404,
                mimetype="application/json"
            )
        
        # Check if ingredients blob exists
        if not azure_blob_service.blob_exists(ingredients_blob):
            return func.HttpResponse(
                json.dumps({
                    "error": f"No ingredients file found for request_id: {request_id}"
                }),
                status_code=404,
                mimetype="application/json"
            )
        
        # Load ingredients from Azure Blob Storage
        ingredients = recipe_service.load_ingredients(ingredients_blob)
        
        # Save dietary restrictions if provided
        if dietary_restrictions:
            dietary_blob = f"{paths['request_dir']}/dietary_{request_id.split('_', 1)[1]}.json"
            azure_blob_service.upload_json({"dietary_restrictions": dietary_restrictions}, dietary_blob)
        
        # Generate recipes with dietary restrictions if provided
        recipes_data = recipe_service.generate_recipes(
            ingredients, 
            num_recipes=num_recipes,
            dietary_restrictions=dietary_restrictions
        )
        
        # Get analysis
        analysis = recipe_service.get_recipes_analysis(recipes_data)
        analysis_dict = analysis.to_dict('records') if analysis is not None else []
        
        # Create full response
        full_response = {
            "items": recipes_data["recipes"],
            "analysis": analysis_dict,
            "ingredient_count": len(ingredients),
            "dietary_restrictions": dietary_restrictions if dietary_restrictions else []
        }
        
        # Save the full response to Azure Blob Storage
        recipe_service.save_recipes(full_response, recipes_blob)
        
        return func.HttpResponse(
            json.dumps(full_response),
            mimetype="application/json"
        )
    except Exception as e:
        logging.error(f"Error generating recipes: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json"
        )