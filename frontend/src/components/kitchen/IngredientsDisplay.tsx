import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IngredientsResponse, DietaryRestriction } from '@/types';
import { 
  Milk, Apple, Egg, Wheat, FlaskRound, Coffee, Cookie, 
  Snowflake, Archive, UtensilsCrossed, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { DietaryRestrictions } from '@/components/kitchen/DietaryRestrictions';

interface IngredientsDisplayProps {
  ingredientsData: IngredientsResponse;
  onGenerateRecipes: (dietaryRestrictions: DietaryRestriction[]) => void;
  loading: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  }
};

const CardInView = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        type: "spring", 
        stiffness: 100, 
        damping: 20 
      }}
    >
      {children}
    </motion.div>
  );
};

export function IngredientsDisplay({ 
  ingredientsData, 
  onGenerateRecipes,
  loading 
}: IngredientsDisplayProps) {
  const { result, summary } = ingredientsData;
  const categories = Object.keys(result.ingredients);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);

  // Helper function to add a dietary restriction
  const handleAddRestriction = (restriction: DietaryRestriction) => {
    setDietaryRestrictions(prev => [...prev, restriction]);
  };

  // Helper function to remove a dietary restriction
  const handleRemoveRestriction = (restrictionId: string) => {
    setDietaryRestrictions(prev => prev.filter(r => r.id !== restrictionId));
  };

  // Helper function to get an appropriate icon for each category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Dairy': return <Milk className="size-5" />;
      case 'Produce': return <Apple className="size-5" />;
      case 'Proteins': return <Egg className="size-5" />;
      case 'Grains': return <Wheat className="size-5" />;
      case 'Condiments': return <FlaskRound className="size-5" />;
      case 'Beverages': return <Coffee className="size-5" />;
      case 'Snacks': return <Cookie className="size-5" />;
      case 'Frozen': return <Snowflake className="size-5" />;
      case 'Canned': return <Archive className="size-5" />;
      default: return <UtensilsCrossed className="size-5" />;
    }
  };

  // Helper function to get ingredient emoji with enhanced matching and fallbacks
  const getIngredientEmoji = (ingredient: string): string => {
    // Normalize the input for better matching
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Categorized ingredient emoji map for better organization and expansion
    const ingredientEmojiMap: { [category: string]: { [key: string]: string } } = {
      // Dairy & Eggs
      dairy: {
        'milk': '🥛',
        'cream': '🥛',
        'yogurt': '🥄',
        'cheese': '🧀',
        'cream cheese': '🧀',
        'butter': '🧈',
        'margarine': '🧈',
        'sour cream': '🥄',
        'mayonnaise': '🥄',
        'egg': '🥚',
      },
      
      // Fruits
      fruits: {
        'apple': '🍎',
        'green apple': '🍏',
        'banana': '🍌',
        'orange': '🍊',
        'lemon': '🍋',
        'lime': '🍈',
        'pear': '🍐',
        'peach': '🍑',
        'strawberry': '🍓',
        'blueberry': '🫐',
        'grape': '🍇',
        'watermelon': '🍉',
        'melon': '🍈',
        'pineapple': '🍍',
        'mango': '🥭',
        'coconut': '🥥',
        'avocado': '🥑',
        'kiwi': '🥝',
        'tomato': '🍅',
        'cherry': '🍒',
        'berry': '🍓',
      },
      
      // Vegetables
      vegetables: {
        'pepper': '🫑',
        'chili': '🌶️',
        'hot pepper': '🌶️',
        'broccoli': '🥦',
        'lettuce': '🥬',
        'arugula': '🥬',
        'spinach': '🥬',
        'kale': '🥬',
        'cabbage': '🥬',
        'carrot': '🥕',
        'potato': '🥔',
        'sweet potato': '🍠',
        'cucumber': '🥒',
        'zucchini': '🥒',
        'squash': '🎃',
        'pumpkin': '🎃',
        'corn': '🌽',
        'mushroom': '🍄',
        'onion': '🧅',
        'garlic': '🧄',
        'eggplant': '🍆',
        'olive': '🫒',
        'celery': '🥬',
        'radish': '🥕',
        'turnip': '🥕',
        'pickled': '🥒',
        'pickle': '🥒',
      },
      
      // Herbs & Spices
      herbs: {
        'basil': '🌿',
        'cilantro': '🌿',
        'coriander': '🌿',
        'mint': '🌿',
        'parsley': '🌿',
        'thyme': '🌿',
        'rosemary': '🌿',
        'dill': '🌿',
        'oregano': '🌿',
        'sage': '🌿',
        'chives': '🌱',
        'bay leaf': '🍃',
        'spice': '🧂',
        'salt': '🧂',
        'pepper': '🧂',
        'cinnamon': '🌰',
        'nutmeg': '🌰',
        'paprika': '🌶️',
        'cayenne': '🌶️',
        'cumin': '🌱',
        'turmeric': '🟡',
        'ginger': '🫚',
        'lemongrass': '🌿',
      },
      
      // Proteins
      proteins: {
        'chicken': '🍗',
        'turkey': '🦃',
        'beef': '🥩',
        'steak': '🥩',
        'pork': '🥓',
        'bacon': '🥓',
        'ham': '🍖',
        'sausage': '🌭',
        'hot dog': '🌭',
        'fish': '🐟',
        'salmon': '🐟',
        'tuna': '🐟',
        'shrimp': '🦐',
        'prawn': '🦐',
        'crab': '🦀',
        'lobster': '🦞',
        'tofu': '🧊',
        'tempeh': '🧱',
        'seitan': '🍞',
      },
      
      // Nuts & Seeds
      nuts: {
        'peanut': '🥜',
        'almond': '🥜',
        'cashew': '🥜',
        'walnut': '🌰',
        'pecan': '🌰',
        'pistachio': '🥜',
        'hazelnut': '🌰',
        'nut': '🥜',
        'seed': '🌱',
        'sesame': '🌱',
        'sunflower': '🌻',
        'pumpkin seed': '🌱',
        'chia': '🌱',
        'flax': '🌱',
        'hemp': '🌱',
      },
      
      // Grains & Breads
      grains: {
        'rice': '🍚',
        'bread': '🍞',
        'toast': '🍞',
        'bun': '🥯',
        'roll': '🥐',
        'bagel': '🥯',
        'croissant': '🥐',
        'pretzel': '🥨',
        'pancake': '🥞',
        'waffle': '🧇',
        'tortilla': '🫓',
        'taco': '🌮',
        'burrito': '🌯',
        'pasta': '🍝',
        'noodle': '🍜',
        'ramen': '🍜',
        'spaghetti': '🍝',
        'macaroni': '🍝',
        'cereal': '🥣',
        'oat': '🌾',
        'quinoa': '🌾',
        'flour': '🌾',
        'wheat': '🌾',
        'barley': '🌾',
        'corn': '🌽',
      },
      
      // Condiments & Sauces
      condiments: {
        'ketchup': '🍅',
        'mustard': '🟡',
        'mayonnaise': '🥄',
        'sauce': '🥫',
        'hot sauce': '🌶️',
        'salsa': '🍅',
        'guacamole': '🥑',
        'hummus': '🫘',
        'dressing': '🫗',
        'vinegar': '🫗',
        'oil': '🫗',
        'olive oil': '🫒',
        'syrup': '🍯',
        'honey': '🍯',
        'maple': '🍁',
        'jam': '🍓',
        'jelly': '🍇',
        'peanut butter': '🥜',
        'nutella': '🍫',
        'soy sauce': '🍶',
        'fish sauce': '🐟',
        'teriyaki': '🍶',
        'sriracha': '🌶️',
        'tabasco': '🌶️',
        'worcestershire': '🫗',
        'horseradish': '🌱',
        'wasabi': '🍱',
        'pickled': '🥒',
      },
      
      // Beverages
      beverages: {
        'water': '💧',
        'sparkling water': '🫧',
        'milk': '🥛',
        'juice': '🧃',
        'orange juice': '🍊',
        'apple juice': '🍎',
        'coffee': '☕',
        'tea': '🍵',
        'wine': '🍷',
        'red wine': '🍷',
        'white wine': '🥂',
        'beer': '🍺',
        'cocktail': '🍸',
        'whiskey': '🥃',
        'vodka': '🥃',
        'rum': '🥃',
        'tequila': '🥃',
        'gin': '🥃',
        'liquor': '🥃',
        'smoothie': '🥤',
        'soda': '🥤',
        'coke': '🥤',
        'lemonade': '🍋',
      },
      
      // Desserts & Sweets
      desserts: {
        'chocolate': '🍫',
        'cake': '🍰',
        'pie': '🥧',
        'cookie': '🍪',
        'ice cream': '🍦',
        'gelato': '🍨',
        'candy': '🍬',
        'sweet': '🍭',
        'sugar': '🧂',
        'caramel': '🍯',
        'donut': '🍩',
        'cupcake': '🧁',
        'muffin': '🧁',
        'brownie': '🍫',
        'pudding': '🍮',
        'custard': '🍮',
      },
      
      // Misc & Other
      other: {
        'date': '🌴', // Not the calendar date but the fruit
        'salt': '🧂',
        'ice': '🧊',
        'water': '💧',
      }
    };

    // First, try exact match within categories
    for (const category in ingredientEmojiMap) {
      if (ingredientEmojiMap[category][normalizedIngredient]) {
        return ingredientEmojiMap[category][normalizedIngredient];
      }
    }

    // Next, try substring match within categories
    // Find the longest matching substring for more accurate results
    let bestMatch = '';
    let bestMatchEmoji = '';
    
    for (const category in ingredientEmojiMap) {
      for (const [key, emoji] of Object.entries(ingredientEmojiMap[category])) {
        // If key is contained in the ingredient and it's longer than our current best match
        if (normalizedIngredient.includes(key) && key.length > bestMatch.length) {
          bestMatch = key;
          bestMatchEmoji = emoji;
        }
      }
    }
    
    if (bestMatchEmoji) {
      return bestMatchEmoji;
    }
    
    // If no match found, use category-based fallbacks
    
    // Check for general categories
    if (/\b(fruit|berry|melon)\b/.test(normalizedIngredient)) return '🍎';
    if (/\b(vegetable|veg|veggie)\b/.test(normalizedIngredient)) return '🥦';
    if (/\b(herb|spice)\b/.test(normalizedIngredient)) return '🌿';
    if (/\b(meat|protein|beef|chicken|pork|fish)\b/.test(normalizedIngredient)) return '🍖';
    if (/\b(nut|seed)\b/.test(normalizedIngredient)) return '🥜';
    if (/\b(grain|wheat|cereal|rice|bread)\b/.test(normalizedIngredient)) return '🌾';
    if (/\b(sauce|dressing|oil)\b/.test(normalizedIngredient)) return '🫗';
    if (/\b(drink|beverage|alcohol|wine|beer)\b/.test(normalizedIngredient)) return '🥤';
    if (/\b(sweet|dessert|cake|candy)\b/.test(normalizedIngredient)) return '🍬';
    if (/\b(dairy|milk|cheese)\b/.test(normalizedIngredient)) return '🥛';
    
    // Default emoji using food-related emojis instead of a bullet point
    // Cycling through these will give visual variety
    const foodEmojis = ['🍲', '🥘', '🍱', '🥣', '🍳'];
    const hashCode = normalizedIngredient
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return foodEmojis[hashCode % foodEmojis.length];
  };

  // Calculate if we need to show in one or two columns
  const nonEmptyCategories = categories.filter(category => 
    result.ingredients[category].length > 0
  );
  const useOneColumn = nonEmptyCategories.length <= 3;

  // Check if any selected dietary restrictions match detected ingredients
  const getDietaryWarnings = (): string[] => {
    if (dietaryRestrictions.length === 0) return [];
    
    const warnings: string[] = [];
    const allergensMap: Record<string, string[]> = {
      'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'nuts': ['almond', 'walnut', 'peanut', 'cashew', 'hazelnut', 'pecan', 'pistachio'],
      'gluten': ['wheat', 'bread', 'pasta', 'flour', 'cereal', 'oats'],
      'eggs': ['egg'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'crawfish', 'prawn'],
      'soy': ['soy', 'tofu', 'edamame'],
      'fish': ['fish', 'salmon', 'tuna', 'cod', 'tilapia'],
      'sesame': ['sesame']
    };
    
    // Flatten all ingredients
    const allIngredients: string[] = [];
    for (const category in result.ingredients) {
      allIngredients.push(...result.ingredients[category]);
    }
    
    // Check each dietary restriction against ingredients
    dietaryRestrictions.forEach(restriction => {
      if (restriction.id in allergensMap) {
        const allergens = allergensMap[restriction.id];
        const found = allIngredients.some(ingredient => 
          allergens.some(allergen => ingredient.toLowerCase().includes(allergen.toLowerCase()))
        );
        
        if (found) {
          warnings.push(`Your fridge contains ingredients that may conflict with your ${restriction.name} restriction.`);
        }
      }
    });
    
    return warnings;
  };
  
  const warnings = getDietaryWarnings();

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="flex justify-between items-center" 
        variants={itemVariants}
      >
        <h2 className="text-2xl font-bold">Your Ingredients</h2>
        <Badge variant="outline" className="px-3 py-1">
          {summary.total_count} items found
        </Badge>
      </motion.div>

      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium">Dietary Restrictions</h3>
          <DietaryRestrictions
            selectedRestrictions={dietaryRestrictions}
            onSelectRestriction={handleAddRestriction}
            onRemoveRestriction={handleRemoveRestriction}
          />
          
          {warnings.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 flex gap-2">
              <AlertCircle className="size-5 flex-shrink-0" />
              <div className="text-sm">
                {warnings.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className={`grid gap-4 ${useOneColumn ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
        {categories.map((category, categoryIndex) => {
          const ingredients = result.ingredients[category];
          if (ingredients.length === 0) return null;

          return (
            <CardInView key={category} delay={categoryIndex * 0.05}>
              <Card className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-2 border-b bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span>{category}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {ingredients.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {ingredients.map((ingredient, index) => (
                      <motion.li 
                        key={index} 
                        className="p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: 0.2 + (index * 0.03),
                          duration: 0.2
                        }}
                      >
                        <span className="text-lg w-6 text-center">{getIngredientEmoji(ingredient)}</span>
                        <span className="text-sm flex-1">{ingredient}</span>
                        <ChevronRight className="size-4 text-muted-foreground opacity-50" />
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </CardInView>
          );
        })}
      </div>

      <motion.div variants={itemVariants}>
        <Button 
          onClick={() => onGenerateRecipes(dietaryRestrictions)} 
          className="w-full" 
          size="lg" 
          disabled={loading}
        >
          {loading ? 'Generating Recipes...' : 'Generate Recipe Suggestions'}
        </Button>
      </motion.div>
    </motion.div>
  );
}