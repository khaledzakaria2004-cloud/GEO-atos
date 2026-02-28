import { supabase } from '../supabase';

/**
 * Exercise API - Handles all exercise-related database operations
 */

// Record a new exercise session
export async function recordExercise(userId, exerciseData) {
  console.log('📝 recordExercise called with:', { userId, exerciseData });
  
  if (!userId) {
    console.error('❌ recordExercise: No userId provided!');
    throw new Error('User ID is required');
  }
  
  const insertData = {
    user_id: userId,
    exercise_name: exerciseData.exerciseName || exerciseData.name,
    repetitions: exerciseData.repetitions || exerciseData.reps || 0,
    sets: exerciseData.sets || 1,
    duration_sec: exerciseData.durationSec || exerciseData.duration || 0,
    angle_accuracy: exerciseData.angleAccuracy || 0,
    calories_burned: exerciseData.caloriesBurned || 0,
    date_performed: exerciseData.datePerformed || new Date().toISOString()
  };
  
  console.log('📤 Inserting to Supabase:', insertData);
  
  const { data, error } = await supabase
    .from('exercises')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase insert error:', error);
    throw error;
  }
  
  console.log('✅ Exercise saved to Supabase:', data);
  return data;
}

// Record multiple exercises at once
export async function recordExercises(userId, exercises) {
  const exerciseRecords = exercises.map(ex => ({
    user_id: userId,
    exercise_name: ex.exerciseName || ex.name,
    repetitions: ex.repetitions || ex.reps,
    sets: ex.sets || 1,
    duration_sec: ex.durationSec || ex.duration,
    angle_accuracy: ex.angleAccuracy,
    calories_burned: ex.caloriesBurned,
    date_performed: ex.datePerformed || new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('exercises')
    .insert(exerciseRecords)
    .select();

  if (error) throw error;
  return data;
}

// Get all exercises for a user
export async function getExercises(userId, filters = {}) {
  let query = supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('date_performed', { ascending: false });

  // Filter by date range
  if (filters.startDate) {
    query = query.gte('date_performed', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('date_performed', filters.endDate);
  }

  // Filter by exercise name
  if (filters.exerciseName) {
    query = query.ilike('exercise_name', `%${filters.exerciseName}%`);
  }

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get exercises for a specific date
export async function getExercisesByDate(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getExercises(userId, {
    startDate: startOfDay.toISOString(),
    endDate: endOfDay.toISOString()
  });
}

// Get exercise statistics
export async function getExerciseStats(userId, exerciseName = null) {
  let query = supabase
    .from('exercises')
    .select('exercise_name, repetitions, sets, duration_sec, calories_burned')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (exerciseName) {
    query = query.ilike('exercise_name', `%${exerciseName}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aggregate stats
  const stats = {};
  data.forEach(ex => {
    const name = ex.exercise_name.toLowerCase();
    if (!stats[name]) {
      stats[name] = {
        totalReps: 0,
        totalSets: 0,
        totalDuration: 0,
        totalCalories: 0,
        sessionCount: 0
      };
    }
    stats[name].totalReps += (ex.repetitions || 0) * (ex.sets || 1);
    stats[name].totalSets += ex.sets || 1;
    stats[name].totalDuration += ex.duration_sec || 0;
    stats[name].totalCalories += ex.calories_burned || 0;
    stats[name].sessionCount += 1;
  });

  return stats;
}

// Update an exercise record
export async function updateExercise(exerciseId, updates) {
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Soft delete an exercise
export async function deleteExercise(exerciseId) {
  const { data, error } = await supabase
    .from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default {
  recordExercise,
  recordExercises,
  getExercises,
  getExercisesByDate,
  getExerciseStats,
  updateExercise,
  deleteExercise
};
