export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
  id: string;
  name: string;
  barcode?: string;
  brand?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: number;
  servingUnit: string;
  isVerified: boolean;
}

export interface NutritionLog {
  id: string;
  userId: string;
  foodId: string;
  food?: Food;
  foodName?: string;
  loggedAt: string;
  mealType: MealType;
  servings: number;
  calculatedCalories: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedFat: number;
}

export interface NutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  logs: NutritionLog[];
}

export interface WaterLog {
  id: string;
  userId: string;
  loggedAt: string;
  amountMl: number;
}

export interface DailyWaterSummary {
  date: string;
  totalMl: number;
  logs: WaterLog[];
}
