import { supabase } from '../supabase';

/**
 * Food API - Handles all food log database operations
 */

// Log a food item
export async function logFood(userId, foodData) {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      food_name: foodData.foodName || foodData.name,
      calories: foodData.calories,
      protein: foodData.protein,
      carbs: foodData.carbs,
      fat: foodData.fat,
      portion_size: foodData.portionSize,
      image_url: foodData.imageUrl,
      date_logged: foodData.dateLogged || new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Log multiple food items
export async function logFoods(userId, foods) {
  const foodRecords = foods.map(food => ({
    user_id: userId,
    food_name: food.foodName || food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    portion_size: food.portionSize,
    image_url: food.imageUrl,
    date_logged: food.dateLogged || new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('food_logs')
    .insert(foodRecords)
    .select();

  if (error) throw error;
  return data;
}

// Get all food logs for a user
export async function getFoodLogs(userId, filters = {}) {
  let query = supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date_logged', { ascending: false });

  // Filter by date
  if (filters.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte('date_logged', startOfDay.toISOString())
      .lte('date_logged', endOfDay.toISOString());
  }

  // Filter by date range
  if (filters.startDate) {
    query = query.gte('date_logged', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('date_logged', filters.endDate);
  }

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get food logs for a specific date
export async function getFoodLogsByDate(userId, date) {
  return getFoodLogs(userId, { date });
}

// Get daily calorie total
export async function getDailyCalories(userId, date) {
  const foods = await getFoodLogsByDate(userId, date);
  return foods.reduce((total, food) => total + (food.calories || 0), 0);
}

// Get daily nutrition summary
export async function getDailyNutrition(userId, date) {
  const foods = await getFoodLogsByDate(userId, date);
  
  return {
    totalCalories: foods.reduce((sum, f) => sum + (f.calories || 0), 0),
    totalProtein: foods.reduce((sum, f) => sum + (f.protein || 0), 0),
    totalCarbs: foods.reduce((sum, f) => sum + (f.carbs || 0), 0),
    totalFat: foods.reduce((sum, f) => sum + (f.fat || 0), 0),
    mealCount: foods.length
  };
}

// Get weekly calorie summary
export async function getWeeklyCalories(userId) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const foods = await getFoodLogs(userId, {
    startDate: weekAgo.toISOString(),
    endDate: today.toISOString()
  });

  // Group by date
  const dailyCalories = {};
  foods.forEach(food => {
    const date = food.date_logged.split('T')[0];
    dailyCalories[date] = (dailyCalories[date] || 0) + (food.calories || 0);
  });

  return dailyCalories;
}

// Update a food log
export async function updateFoodLog(foodId, updates) {
  const { data, error } = await supabase
    .from('food_logs')
    .update(updates)
    .eq('id', foodId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a food log (hard delete)
export async function deleteFoodLog(foodId) {
  console.log('🗑️ Deleting food log:', foodId);
  
  const { data, error } = await supabase
    .from('food_logs')
    .delete()
    .eq('id', foodId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error deleting food log:', error);
    throw error;
  }
  
  console.log('✅ Food log deleted:', data);
  return data;
}

// Clear all food logs for a user (hard delete)
export async function clearAllFoodLogs(userId) {
  console.log('🗑️ Clearing all food logs for user:', userId);
  
  const { data, error } = await supabase
    .from('food_logs')
    .delete()
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('❌ Error clearing food logs:', error);
    throw error;
  }
  
  console.log('✅ Cleared food logs:', data?.length || 0, 'items');
  return data;
}

export default {
  logFood,
  logFoods,
  getFoodLogs,
  getFoodLogsByDate,
  getDailyCalories,
  getDailyNutrition,
  getWeeklyCalories,
  updateFoodLog,
  deleteFoodLog,
  clearAllFoodLogs
};
