import { supabase } from '../supabase';

/**
 * Achievement API - Handles all achievement database operations
 */

// Earn/update an achievement (upsert)
export async function earnAchievement(userId, achievementData) {
  const { data, error } = await supabase
    .from('achievements')
    .upsert({
      user_id: userId,
      achievement_code: achievementData.code,
      achievement_name: achievementData.name || achievementData.title,
      description: achievementData.description,
      tokens_earned: achievementData.tokensEarned || achievementData.tokens || 0,
      progress: achievementData.progress || 0,
      target: achievementData.target || 100,
      level: achievementData.level || 1,
      date_earned: new Date().toISOString()
    }, {
      onConflict: 'user_id,achievement_code'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all achievements for a user
export async function getAchievements(userId) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('date_earned', { ascending: false });

  if (error) throw error;
  return data;
}

// Get a specific achievement
export async function getAchievement(userId, achievementCode) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_code', achievementCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Achievement not found
    }
    throw error;
  }

  return data;
}

// Update achievement progress
export async function updateAchievementProgress(userId, achievementCode, progress) {
  const existing = await getAchievement(userId, achievementCode);
  
  if (!existing) {
    throw new Error('Achievement not found');
  }

  const { data, error } = await supabase
    .from('achievements')
    .update({
      progress: progress,
      date_earned: progress >= existing.target ? new Date().toISOString() : existing.date_earned
    })
    .eq('user_id', userId)
    .eq('achievement_code', achievementCode)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Increment achievement progress
export async function incrementAchievementProgress(userId, achievementCode, increment = 1) {
  const existing = await getAchievement(userId, achievementCode);
  
  if (!existing) {
    throw new Error('Achievement not found');
  }

  const newProgress = Math.min(existing.progress + increment, existing.target);
  return updateAchievementProgress(userId, achievementCode, newProgress);
}

// Get completed achievements
export async function getCompletedAchievements(userId) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .gte('progress', supabase.raw('target'))
    .order('date_earned', { ascending: false });

  if (error) throw error;
  return data;
}

// Get total tokens earned
export async function getTotalTokens(userId) {
  const { data, error } = await supabase
    .from('achievements')
    .select('tokens_earned')
    .eq('user_id', userId);

  if (error) throw error;
  return data.reduce((total, a) => total + (a.tokens_earned || 0), 0);
}

// Check and award achievements based on stats
export async function checkAndAwardAchievements(userId, stats) {
  const achievementDefinitions = [
    { code: 'first_workout', name: 'First Workout', target: 1, check: s => s.total_workouts >= 1 },
    { code: 'workout_streak_7', name: '7 Day Streak', target: 7, check: s => s.current_streak >= 7 },
    { code: 'workout_streak_30', name: '30 Day Streak', target: 30, check: s => s.current_streak >= 30 },
    { code: 'calories_1000', name: 'Burn 1000 Calories', target: 1000, check: s => s.total_calories_burned >= 1000 },
    { code: 'calories_10000', name: 'Burn 10000 Calories', target: 10000, check: s => s.total_calories_burned >= 10000 },
    { code: 'workouts_10', name: '10 Workouts', target: 10, check: s => s.total_workouts >= 10 },
    { code: 'workouts_50', name: '50 Workouts', target: 50, check: s => s.total_workouts >= 50 },
    { code: 'workouts_100', name: '100 Workouts', target: 100, check: s => s.total_workouts >= 100 }
  ];

  const awarded = [];

  for (const def of achievementDefinitions) {
    if (def.check(stats)) {
      const existing = await getAchievement(userId, def.code);
      if (!existing || existing.progress < def.target) {
        const achievement = await earnAchievement(userId, {
          code: def.code,
          name: def.name,
          progress: def.target,
          target: def.target,
          tokensEarned: def.target
        });
        awarded.push(achievement);
      }
    }
  }

  return awarded;
}

export default {
  earnAchievement,
  getAchievements,
  getAchievement,
  updateAchievementProgress,
  incrementAchievementProgress,
  getCompletedAchievements,
  getTotalTokens,
  checkAndAwardAchievements
};
