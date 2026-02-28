import { supabase } from '../supabase';

/**
 * Achievements API - Handles all achievement-related database operations
 * Stores cumulative exercise totals and calculates levels based on progress
 */

// Achievement level configurations for different exercise types
const ACHIEVEMENT_LEVELS = {
  // Push-up variants (rep-based)
  'push-ups': [
    { level: 1, goal: 50 },
    { level: 2, goal: 100 },
    { level: 3, goal: 250 },
    { level: 4, goal: 500 },
    { level: 5, goal: 1000 },
  ],
  'wide push ups': [
    { level: 1, goal: 50 },
    { level: 2, goal: 100 },
    { level: 3, goal: 250 },
    { level: 4, goal: 500 },
    { level: 5, goal: 1000 },
  ],
  'narrow push ups': [
    { level: 1, goal: 50 },
    { level: 2, goal: 100 },
    { level: 3, goal: 250 },
    { level: 4, goal: 500 },
    { level: 5, goal: 1000 },
  ],
  'diamond push ups': [
    { level: 1, goal: 38 },
    { level: 2, goal: 75 },
    { level: 3, goal: 188 },
    { level: 4, goal: 375 },
    { level: 5, goal: 750 },
  ],
  'knee push ups': [
    { level: 1, goal: 100 },
    { level: 2, goal: 200 },
    { level: 3, goal: 500 },
    { level: 4, goal: 1000 },
    { level: 5, goal: 2000 },
  ],
  // Cardio (rep-based)
  'jumping jacks': [
    { level: 1, goal: 1000 },
    { level: 2, goal: 2500 },
    { level: 3, goal: 6000 },
    { level: 4, goal: 8500 },
    { level: 5, goal: 12000 },
  ],
  'burpees': [
    { level: 1, goal: 38 },
    { level: 2, goal: 75 },
    { level: 3, goal: 188 },
    { level: 4, goal: 375 },
    { level: 5, goal: 750 },
  ],
  'high knees': [
    { level: 1, goal: 2000 },
    { level: 2, goal: 5000 },
    { level: 3, goal: 12000 },
    { level: 4, goal: 17000 },
    { level: 5, goal: 24000 },
  ],
  // Lower body (rep-based)
  'squats': [
    { level: 1, goal: 100 },
    { level: 2, goal: 200 },
    { level: 3, goal: 500 },
    { level: 4, goal: 1000 },
    { level: 5, goal: 2000 },
  ],
  'lunges': [
    { level: 1, goal: 200 },
    { level: 2, goal: 400 },
    { level: 3, goal: 1000 },
    { level: 4, goal: 2000 },
    { level: 5, goal: 4000 },
  ],
  // Time-based exercises (in minutes)
  'wall sit': [
    { level: 1, goal: 20 },
    { level: 2, goal: 50 },
    { level: 3, goal: 90 },
    { level: 4, goal: 120 },
    { level: 5, goal: 180 },
  ],
  'knee plank': [
    { level: 1, goal: 20 },
    { level: 2, goal: 50 },
    { level: 3, goal: 90 },
    { level: 4, goal: 120 },
    { level: 5, goal: 180 },
  ],
  'plank': [
    { level: 1, goal: 10 },
    { level: 2, goal: 25 },
    { level: 3, goal: 45 },
    { level: 4, goal: 60 },
    { level: 5, goal: 90 },
  ],
  'side plank': [
    { level: 1, goal: 10 },
    { level: 2, goal: 25 },
    { level: 3, goal: 45 },
    { level: 4, goal: 60 },
    { level: 5, goal: 90 },
  ],
  'reverse plank': [
    { level: 1, goal: 5 },
    { level: 2, goal: 12 },
    { level: 3, goal: 22 },
    { level: 4, goal: 30 },
    { level: 5, goal: 45 },
  ],
  'straight arm plank': [
    { level: 1, goal: 10 },
    { level: 2, goal: 25 },
    { level: 3, goal: 45 },
    { level: 4, goal: 60 },
    { level: 5, goal: 90 },
  ],
  'straight arm reverse plank': [
    { level: 1, goal: 3 },
    { level: 2, goal: 8 },
    { level: 3, goal: 15 },
    { level: 4, goal: 21 },
    { level: 5, goal: 31 },
  ],
  // Core (rep-based)
  'sit-ups': [
    { level: 1, goal: 25 },
    { level: 2, goal: 50 },
    { level: 3, goal: 125 },
    { level: 4, goal: 250 },
    { level: 5, goal: 500 },
  ],
};

// Time-based exercises (progress measured in minutes, not reps)
const TIME_BASED_EXERCISES = [
  'wall sit', 'knee plank', 'plank', 'side plank', 
  'reverse plank', 'straight arm plank', 'straight arm reverse plank'
];

/**
 * Normalize exercise name for consistent matching
 */
function normalizeExerciseName(name) {
  return name.toLowerCase().trim();
}

/**
 * Generate achievement code from exercise name
 */
function generateAchievementCode(exerciseName) {
  return normalizeExerciseName(exerciseName).replace(/\s+/g, '_') + '_achievement';
}

/**
 * Calculate level based on progress and exercise type
 */
export function calculateLevel(progress, exerciseName) {
  const normalized = normalizeExerciseName(exerciseName);
  const levels = ACHIEVEMENT_LEVELS[normalized];
  
  if (!levels) {
    // Default levels for unknown exercises
    return Math.min(5, Math.floor(progress / 100) + 1);
  }
  
  let currentLevel = 0;
  for (const levelConfig of levels) {
    if (progress >= levelConfig.goal) {
      currentLevel = levelConfig.level;
    } else {
      break;
    }
  }
  
  return currentLevel;
}

/**
 * Get target for current level
 */
export function getCurrentTarget(progress, exerciseName) {
  const normalized = normalizeExerciseName(exerciseName);
  const levels = ACHIEVEMENT_LEVELS[normalized];
  
  if (!levels) return 100;
  
  for (const levelConfig of levels) {
    if (progress < levelConfig.goal) {
      return levelConfig.goal;
    }
  }
  
  // Max level reached
  return levels[levels.length - 1].goal;
}

/**
 * Check if exercise is time-based
 */
export function isTimeBased(exerciseName) {
  return TIME_BASED_EXERCISES.includes(normalizeExerciseName(exerciseName));
}

/**
 * Get all achievements for a user
 */
export async function getAchievements(userId) {
  console.log('📊 Getting achievements for user:', userId);
  
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('date_earned', { ascending: false });

  if (error) {
    console.error('❌ Error fetching achievements:', error);
    throw error;
  }
  
  console.log('✅ Achievements fetched:', data?.length || 0);
  return data || [];
}

/**
 * Get a specific achievement for a user
 */
export async function getAchievement(userId, exerciseName) {
  const achievementCode = generateAchievementCode(exerciseName);
  
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_code', achievementCode)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('❌ Error fetching achievement:', error);
    throw error;
  }
  
  return data;
}

/**
 * Update or create achievement with cumulative progress
 * @param {string} userId - User's ICP Principal ID
 * @param {string} exerciseName - Name of the exercise
 * @param {number} repsOrMinutes - Reps completed (or minutes for time-based exercises)
 */
export async function updateAchievement(userId, exerciseName, repsOrMinutes) {
  console.log('🏆 Updating achievement:', { userId, exerciseName, repsOrMinutes });
  
  if (!userId || !exerciseName) {
    console.error('❌ Missing userId or exerciseName');
    return null;
  }
  
  const normalized = normalizeExerciseName(exerciseName);
  const achievementCode = generateAchievementCode(exerciseName);
  const achievementName = exerciseName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Achievement';
  
  // Check if achievement exists
  const existing = await getAchievement(userId, exerciseName);
  
  if (existing) {
    // Update existing achievement
    const newProgress = (existing.progress || 0) + repsOrMinutes;
    const newLevel = calculateLevel(newProgress, exerciseName);
    const newTarget = getCurrentTarget(newProgress, exerciseName);
    
    console.log('📈 Updating existing achievement:', {
      oldProgress: existing.progress,
      newProgress,
      newLevel,
      newTarget
    });
    
    const { data, error } = await supabase
      .from('achievements')
      .update({
        progress: newProgress,
        level: newLevel,
        target: newTarget,
        date_earned: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating achievement:', error);
      throw error;
    }
    
    console.log('✅ Achievement updated:', data);
    return data;
  } else {
    // Create new achievement
    const level = calculateLevel(repsOrMinutes, exerciseName);
    const target = getCurrentTarget(repsOrMinutes, exerciseName);
    
    console.log('🆕 Creating new achievement:', {
      achievementCode,
      achievementName,
      progress: repsOrMinutes,
      level,
      target
    });
    
    const { data, error } = await supabase
      .from('achievements')
      .insert({
        user_id: userId,
        achievement_code: achievementCode,
        achievement_name: achievementName,
        description: `Track your ${exerciseName} progress`,
        progress: repsOrMinutes,
        target: target,
        level: level,
        tokens_earned: level * 10,
        date_earned: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating achievement:', error);
      throw error;
    }
    
    console.log('✅ Achievement created:', data);
    return data;
  }
}

/**
 * Batch update achievements for multiple exercises
 */
export async function updateAchievements(userId, exercises) {
  console.log('🏆 Batch updating achievements for', exercises.length, 'exercises');
  
  const results = [];
  for (const exercise of exercises) {
    try {
      const repsOrMinutes = isTimeBased(exercise.name || exercise.exerciseName)
        ? Math.round((exercise.durationSec || exercise.duration || 0) / 60) // Convert seconds to minutes
        : (exercise.reps || exercise.repetitions || 0) * (exercise.sets || 1);
      
      if (repsOrMinutes > 0) {
        const result = await updateAchievement(
          userId, 
          exercise.name || exercise.exerciseName, 
          repsOrMinutes
        );
        results.push(result);
      }
    } catch (error) {
      console.error('❌ Error updating achievement for', exercise.name, error);
    }
  }
  
  return results;
}

/**
 * Get achievement levels configuration for an exercise
 */
export function getAchievementLevels(exerciseName) {
  const normalized = normalizeExerciseName(exerciseName);
  return ACHIEVEMENT_LEVELS[normalized] || null;
}

/**
 * Get all supported exercises
 */
export function getSupportedExercises() {
  return Object.keys(ACHIEVEMENT_LEVELS);
}

export default {
  getAchievements,
  getAchievement,
  updateAchievement,
  updateAchievements,
  calculateLevel,
  getCurrentTarget,
  isTimeBased,
  getAchievementLevels,
  getSupportedExercises
};
