'use client';

import React, { useState } from 'react';
import { IngredientsDisplay } from '@/components/kitchen/IngredientsDisplay';
import { RecipesDisplay } from '@/components/kitchen/RecipesDisplay';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from 'sonner';
import { IngredientsResponse, RecipesResponse, DietaryRestriction } from '@/types';
import { motion } from 'framer-motion';

// Sample data for demo purposes
const sampleIngredientsData: IngredientsResponse = {
  status: "complete",
  result: {
    ingredients: {
      "Dairy": [
        "Hellmann's mayonnaise",
        "Philadelphia cream cheese",
        "Land O Lakes butter"
      ],
      "Produce": [
        "Bananas",
        "Pears",
        "Apples",
        "Mixed bell peppers (red, yellow, green)",
        "Oranges",
        "Lemons",
        "Limes",
        "Cilantro",
        "Fresh basil",
        "Arugula",
        "Red cabbage",
        "Carrots",
        "Zucchini"
      ],
      "Proteins": [
        "Eggs"
      ],
      "Grains": [
        "Tortillas"
      ],
      "Condiments": [
        "Heinz tomato ketchup",
        "Hellmann's mayonnaise",
        "Organic maple syrup",
        "Annies mustard",
        "Soy sauce",
        "Horseradish",
        "Pickled onions"
      ],
      "Beverages": [
        "White wine (visible on the door)"
      ],
      "Snacks": [],
      "Frozen": [],
      "Canned": [],
      "Other": [
        "Pasta sauce",
        "Almonds",
        "Sunflower seeds",
        "Dates",
        "Pickles"
      ]
    }
  },
  summary: {
    total_count: 31,
    categories: 10,
    by_category: {
      "Dairy": 3,
      "Produce": 13,
      "Proteins": 1,
      "Grains": 1,
      "Condiments": 7,
      "Beverages": 1,
      "Snacks": 0,
      "Frozen": 0,
      "Canned": 0,
      "Other": 5
    }
  },
  image_filename: "fridge_069ea673.jpg",
  request_id: "fridge_069ea673"
};

const sampleRecipesData: RecipesResponse = {
  items: [
    {
      "name": "Mediterranean Veggie Tortilla Wrap",
      "total_ingredients": [
        "Tortillas",
        "Mixed bell peppers",
        "Red cabbage",
        "Carrots",
        "Zucchini",
        "Fresh basil",
        "Hellmann's mayonnaise",
        "Philadelphia cream cheese",
        "Annies mustard",
        "Lemons",
        "Cilantro"
      ],
      "available_ingredients": [
        "Tortillas",
        "Mixed bell peppers",
        "Red cabbage",
        "Carrots",
        "Zucchini",
        "Fresh basil",
        "Hellmann's mayonnaise",
        "Philadelphia cream cheese",
        "Annies mustard",
        "Lemons",
        "Cilantro"
      ],
      "missing_ingredients": [],
      "completeness_score": 100,
      "instructions": [
        "Step 1: Thinly slice the mixed bell peppers, red cabbage, carrots, and zucchini.",
        "Step 2: In a bowl, mix Hellmann's mayonnaise, Philadelphia cream cheese, a squeeze of lemon juice, and a teaspoon of Annies mustard.",
        "Step 3: Spread the mixture on tortillas. Layer with sliced vegetables and sprinkle fresh basil and cilantro before rolling the wrap.",
        "Step 4: Roll tightly and serve immediately."
      ],
      "cooking_time": "20 minutes",
      "difficulty": "Easy"
    },
    {
      "name": "Creamy Lemon Cilantro Pasta",
      "total_ingredients": [
        "Pasta",
        "Philadelphia cream cheese",
        "Cilantro",
        "Lemons",
        "White wine",
        "Red bell peppers",
        "Land O Lakes butter",
        "Salt",
        "Pepper"
      ],
      "available_ingredients": [
        "Philadelphia cream cheese",
        "Cilantro",
        "Lemons",
        "White wine",
        "Land O Lakes butter"
      ],
      "missing_ingredients": [
        "Pasta",
        "Red bell peppers",
        "Salt",
        "Pepper"
      ],
      "completeness_score": 62,
      "instructions": [
        "Step 1: Cook pasta according to package instructions, drain and set aside.",
        "Step 2: In a pan, melt butter and sauté diced red bell peppers until soft.",
        "Step 3: Add Philadelphia cream cheese, a splash of white wine, and juice of a lemon, stir to combine.",
        "Step 4: Toss the pasta in the sauce, season with salt and pepper, and sprinkle with chopped cilantro before serving."
      ],
      "cooking_time": "25 minutes",
      "difficulty": "Medium"
    },
    {
      "name": "Zucchini and Bell Pepper Stir Fry",
      "total_ingredients": [
        "Zucchini",
        "Mixed bell peppers",
        "Soy sauce",
        "Garlic",
        "Limes",
        "Cilantro",
        "Sunflower seeds"
      ],
      "available_ingredients": [
        "Zucchini",
        "Mixed bell peppers",
        "Soy sauce",
        "Limes",
        "Cilantro",
        "Sunflower seeds"
      ],
      "missing_ingredients": [
        "Garlic"
      ],
      "completeness_score": 87,
      "instructions": [
        "Step 1: Slice zucchini and bell peppers into strips.",
        "Step 2: Heat a pan and toast sunflower seeds lightly, then set aside.",
        "Step 3: In the same pan, add soy sauce and lime juice, then stir-fry zucchini and bell peppers for 5 minutes.",
        "Step 4: Add minced garlic, continue stirring for 2 more minutes.",
        "Step 5: Garnish with cilantro and toasted sunflower seeds before serving."
      ],
      "cooking_time": "15 minutes",
      "difficulty": "Easy"
    }
  ],
  analysis: [
    {
      "recipe_name": "Mediterranean Veggie Tortilla Wrap",
      "completeness": 100,
      "available_count": 11,
      "missing_count": 0,
      "total_ingredients": 11,
      "cooking_time": "20 minutes",
      "difficulty": "Easy"
    },
    {
      "recipe_name": "Creamy Lemon Cilantro Pasta",
      "completeness": 62,
      "available_count": 5,
      "missing_count": 4,
      "total_ingredients": 9,
      "cooking_time": "25 minutes",
      "difficulty": "Medium"
    },
    {
      "recipe_name": "Zucchini and Bell Pepper Stir Fry",
      "completeness": 87,
      "available_count": 6,
      "missing_count": 1,
      "total_ingredients": 7,
      "cooking_time": "15 minutes",
      "difficulty": "Easy"
    }
  ],
  ingredient_count: 31
};

// Create a vegetarian-friendly version of the sample recipes data
const vegetarianRecipesData: RecipesResponse = {
  items: [
    {
      "name": "Mediterranean Veggie Tortilla Wrap",
      "total_ingredients": [
        "Tortillas",
        "Mixed bell peppers",
        "Red cabbage",
        "Carrots",
        "Zucchini",
        "Fresh basil",
        "Hellmann's mayonnaise",
        "Philadelphia cream cheese",
        "Annies mustard",
        "Lemons",
        "Cilantro"
      ],
      "available_ingredients": [
        "Tortillas",
        "Mixed bell peppers",
        "Red cabbage",
        "Carrots",
        "Zucchini",
        "Fresh basil",
        "Hellmann's mayonnaise",
        "Philadelphia cream cheese",
        "Annies mustard",
        "Lemons",
        "Cilantro"
      ],
      "missing_ingredients": [],
      "completeness_score": 100,
      "instructions": [
        "Step 1: Thinly slice the mixed bell peppers, red cabbage, carrots, and zucchini.",
        "Step 2: In a bowl, mix Hellmann's mayonnaise, Philadelphia cream cheese, a squeeze of lemon juice, and a teaspoon of Annies mustard.",
        "Step 3: Spread the mixture on tortillas. Layer with sliced vegetables and sprinkle fresh basil and cilantro before rolling the wrap.",
        "Step 4: Roll tightly and serve immediately."
      ],
      "cooking_time": "20 minutes",
      "difficulty": "Easy"
    },
    {
      "name": "Veggie Stir Fry with Citrus Soy Glaze",
      "total_ingredients": [
        "Zucchini",
        "Mixed bell peppers",
        "Red cabbage",
        "Carrots",
        "Soy sauce",
        "Limes",
        "Cilantro",
        "Sunflower seeds",
        "Tortillas"
      ],
      "available_ingredients": [
        "Zucchini",
        "Mixed bell peppers",
        "Red cabbage",
        "Carrots",
        "Soy sauce",
        "Limes",
        "Cilantro",
        "Sunflower seeds",
        "Tortillas"
      ],
      "missing_ingredients": [],
      "completeness_score": 100,
      "instructions": [
        "Step 1: Julienne all vegetables into thin strips.",
        "Step 2: Heat a pan and toast sunflower seeds lightly, then set aside.",
        "Step 3: In the same pan, stir-fry vegetables for 5-7 minutes until tender-crisp.",
        "Step 4: Mix soy sauce with lime juice and drizzle over vegetables.",
        "Step 5: Garnish with cilantro and toasted sunflower seeds, serve with warm tortillas."
      ],
      "cooking_time": "15 minutes",
      "difficulty": "Easy"
    },
    {
      "name": "Fruity Breakfast Bowl",
      "total_ingredients": [
        "Bananas",
        "Apples",
        "Pears",
        "Oranges",
        "Almonds", 
        "Sunflower seeds",
        "Organic maple syrup"
      ],
      "available_ingredients": [
        "Bananas",
        "Apples",
        "Pears",
        "Oranges",
        "Almonds", 
        "Sunflower seeds",
        "Organic maple syrup"
      ],
      "missing_ingredients": [],
      "completeness_score": 100,
      "instructions": [
        "Step 1: Dice the bananas, apples, pears, and oranges into bite-sized pieces.",
        "Step 2: Mix the fruit together in a bowl.",
        "Step 3: Top with chopped almonds and sunflower seeds.",
        "Step 4: Drizzle with organic maple syrup and serve immediately."
      ],
      "cooking_time": "10 minutes",
      "difficulty": "Easy"
    }
  ],
  analysis: [
    {
      "recipe_name": "Mediterranean Veggie Tortilla Wrap",
      "completeness": 100,
      "available_count": 11,
      "missing_count": 0,
      "total_ingredients": 11,
      "cooking_time": "20 minutes",
      "difficulty": "Easy"
    },
    {
      "recipe_name": "Veggie Stir Fry with Citrus Soy Glaze",
      "completeness": 100,
      "available_count": 9,
      "missing_count": 0,
      "total_ingredients": 9,
      "cooking_time": "15 minutes",
      "difficulty": "Easy"
    },
    {
      "recipe_name": "Fruity Breakfast Bowl",
      "completeness": 100,
      "available_count": 7,
      "missing_count": 0,
      "total_ingredients": 7,
      "cooking_time": "10 minutes",
      "difficulty": "Easy"
    }
  ],
  ingredient_count: 31
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [loading, setLoading] = useState(false);
  const [currentRecipesData, setCurrentRecipesData] = useState<RecipesResponse>(sampleRecipesData);

  const handleGenerateRecipes = (dietaryRestrictions: DietaryRestriction[]) => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // If vegetarian is selected, use the vegetarian sample data
      if (dietaryRestrictions.some(r => r.id === 'vegetarian')) {
        setCurrentRecipesData(vegetarianRecipesData);
      } else {
        setCurrentRecipesData(sampleRecipesData);
      }
      
      setActiveTab('recipes');
      setLoading(false);
    }, 1500);
  };

  return (
    <motion.main 
      className="flex min-h-screen flex-col light:bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="bg-amber-50 border border-amber-200 dark:bg-gray-800 dark:border-amber-400 rounded-md p-4 mb-6"
          variants={fadeInUp}
        >
          <p className="light:text-amber-800">
            <strong>Demo Mode:</strong> This page shows sample data for development and testing purposes. You can try selecting dietary restrictions to see how it affects recipe suggestions!
          </p>
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="ingredients" 
                disabled={loading}
              >
                Sample Ingredients
              </TabsTrigger>
              <TabsTrigger 
                value="recipes" 
                disabled={loading}
              >
                Sample Recipes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="space-y-8">
              <IngredientsDisplay 
                ingredientsData={sampleIngredientsData} 
                onGenerateRecipes={handleGenerateRecipes}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="recipes" className="space-y-8">
              <RecipesDisplay recipesData={currentRecipesData} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <Toaster position="top-center" />
    </motion.main>
  );
}