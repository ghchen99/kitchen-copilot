import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Recipe, RecipesResponse } from '@/types';

interface RecipesDisplayProps {
  recipesData: RecipesResponse;
}

export function RecipesDisplay({ recipesData }: RecipesDisplayProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-amber-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCompletenessColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recipe Suggestions</h2>
        <div className="text-sm text-muted-foreground">
          {recipesData.items.length} recipes using {recipesData.ingredient_count} ingredients
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Recipes</TabsTrigger>
          <TabsTrigger value="complete">Complete (100%)</TabsTrigger>
          <TabsTrigger value="quick">Quick Meals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {recipesData.items.map((recipe, index) => (
              <RecipeCard 
                key={index} 
                recipe={recipe} 
                onViewRecipe={handleViewRecipe} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="complete" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {recipesData.items
              .filter(recipe => recipe.completeness_score === 100)
              .map((recipe, index) => (
                <RecipeCard 
                  key={index} 
                  recipe={recipe} 
                  onViewRecipe={handleViewRecipe} 
                />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="quick" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {recipesData.items
              .filter(recipe => {
                const minutes = parseInt(recipe.cooking_time.split(' ')[0]);
                return !isNaN(minutes) && minutes <= 20;
              })
              .map((recipe, index) => (
                <RecipeCard 
                  key={index} 
                  recipe={recipe} 
                  onViewRecipe={handleViewRecipe} 
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedRecipe && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedRecipe.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedRecipe.cooking_time}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                  {selectedRecipe.difficulty}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {selectedRecipe.completeness_score}% Complete
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <div>
                <h3 className="font-medium mb-2">Ingredients</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-1">Available Ingredients</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.available_ingredients.map((ingredient, idx) => (
                        <li key={idx} className="text-sm flex items-center">
                          <span className="mr-2 text-green-500">✓</span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedRecipe.missing_ingredients.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-1">Missing Ingredients</h4>
                      <ul className="space-y-1">
                        {selectedRecipe.missing_ingredients.map((ingredient, idx) => (
                          <li key={idx} className="text-sm flex items-center">
                            <span className="mr-2 text-red-500">✗</span>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Instructions</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-bold mr-2">{idx + 1}.</span>
                      {step.replace(/^Step \d+: /, '')}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}

function RecipeCard({ recipe, onViewRecipe }: RecipeCardProps) {
  const totalIngredients = recipe.total_ingredients.length;
  const availableIngredients = recipe.available_ingredients.length;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{recipe.name}</CardTitle>
        <CardDescription className="flex flex-wrap gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {recipe.cooking_time}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {recipe.difficulty}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Ingredients</span>
              <span>{availableIngredients}/{totalIngredients}</span>
            </div>
            <Progress 
              className="h-1.5" 
              value={recipe.completeness_score} 
            />
          </div>
          
          <div className="text-sm space-y-1">
            <p className="font-medium">
              {recipe.missing_ingredients.length === 0 
                ? "You have everything you need!" 
                : `Missing ${recipe.missing_ingredients.length} ingredient${recipe.missing_ingredients.length === 1 ? '' : 's'}`
              }
            </p>
            {recipe.missing_ingredients.length > 0 && (
              <p className="text-muted-foreground truncate">
                {recipe.missing_ingredients.join(', ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => onViewRecipe(recipe)}>
          View Recipe
        </Button>
      </CardFooter>
    </Card>
  );
}