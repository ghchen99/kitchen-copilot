import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Common dietary restrictions and allergies
const COMMON_ALLERGIES = [
  { id: 'nuts', name: 'Nuts', description: 'Peanuts, tree nuts, etc.' },
  { id: 'dairy', name: 'Dairy', description: 'Milk, cheese, yogurt, etc.' },
  { id: 'gluten', name: 'Gluten', description: 'Wheat, barley, rye, etc.' },
  { id: 'shellfish', name: 'Shellfish', description: 'Shrimp, crab, lobster, etc.' },
  { id: 'eggs', name: 'Eggs', description: 'All egg products' },
  { id: 'soy', name: 'Soy', description: 'Soybeans and soy products' },
  { id: 'fish', name: 'Fish', description: 'All fish' },
  { id: 'sesame', name: 'Sesame', description: 'Sesame seeds and oil' },
];

// Common diets
const COMMON_DIETS = [
  { id: 'vegetarian', name: 'Vegetarian', description: 'No meat or fish' },
  { id: 'vegan', name: 'Vegan', description: 'No animal products' },
  { id: 'keto', name: 'Keto', description: 'Low carb, high fat' },
  { id: 'paleo', name: 'Paleo', description: 'No processed foods, grains, dairy' },
  { id: 'pescatarian', name: 'Pescatarian', description: 'Vegetarian plus fish' },
];

export interface DietaryRestriction {
  id: string;
  name: string;
}

interface DietaryRestrictionsProps {
  selectedRestrictions: DietaryRestriction[];
  onSelectRestriction: (restriction: DietaryRestriction) => void;
  onRemoveRestriction: (restrictionId: string) => void;
}

export function DietaryRestrictions({
  selectedRestrictions,
  onSelectRestriction,
  onRemoveRestriction,
}: DietaryRestrictionsProps) {
  const [open, setOpen] = React.useState(false);
  
  // Get all selected IDs for quick checking
  const selectedIds = selectedRestrictions.map(r => r.id);
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedRestrictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dietary restrictions selected</p>
        ) : (
          selectedRestrictions.map((restriction) => (
            <Badge key={restriction.id} variant="secondary" className="gap-1">
              {restriction.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onRemoveRestriction(restriction.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {restriction.name}</span>
              </Button>
            </Badge>
          ))
        )}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {selectedRestrictions.length === 0 ? 'Add dietary restrictions' : 'Edit'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select dietary restrictions</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Allergies & Intolerances</h4>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_ALLERGIES.map((allergy) => (
                    <Button
                      key={allergy.id}
                      variant={selectedIds.includes(allergy.id) ? "default" : "outline"}
                      className="justify-start h-auto py-2"
                      onClick={() => {
                        if (selectedIds.includes(allergy.id)) {
                          onRemoveRestriction(allergy.id);
                        } else {
                          onSelectRestriction(allergy);
                        }
                      }}
                    >
                      <div className="text-left">
                        <div>{allergy.name}</div>
                        <div className="text-xs text-muted-foreground">{allergy.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Diets</h4>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_DIETS.map((diet) => (
                    <Button
                      key={diet.id}
                      variant={selectedIds.includes(diet.id) ? "default" : "outline"}
                      className="justify-start h-auto py-2"
                      onClick={() => {
                        if (selectedIds.includes(diet.id)) {
                          onRemoveRestriction(diet.id);
                        } else {
                          onSelectRestriction(diet);
                        }
                      }}
                    >
                      <div className="text-left">
                        <div>{diet.name}</div>
                        <div className="text-xs text-muted-foreground">{diet.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button className="w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}