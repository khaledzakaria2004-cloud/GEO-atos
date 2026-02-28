/**
 * Workout Storage with Supabase Integration
 * This module provides workout storage that syncs with Supabase
 * while maintaining localStorage as fallback for offline support
 */

import * as api from './api';
import syncService from './syncService';
import { calculateSessionCalories } from './calories';

// Storage keys for localStorage (fallback)
export const STORAGE_KEYS = {
  USER: 'user',
  WORKOUT_STATS: 'fitcoach_workout_stats',
  DAILY_PROGRESS: 'fitcoach_daily_progress',
  BADGES: 'fitcoach_badges',
  TODAY_PLAN: 'fitcoach_today_plan'
};

// Get current user ID from Supabase session or localStorage
async function getCurrentUserId() {
  try {
    const user = await api.getCurrentUser();
    return user?.id;
  } catch {
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      const user = JSON.parse(stored);
      return user.id;
    }
    return null;
  }
}

// Record completed workout - syncs with Supabase
export async function recordCompletedWorkout(sessionData, userId = null) {
  const uid = userId || await getCurrentUserId();
  
  if (!uid) {
    console.warn('No user ID available, storing locally only');
    return recordCompletedWorkoutLocal(sessionData);
  }

  const sessionItems = Array.isArray(sessionData) ? sessionData : [sessionData];
  
  // Calculate calories
  const user = await api.getUserProfile(uid).catch(() => null);
  const { total: caloriesBurned } = calculateSessionCalories(sessionItems, user || { weight: 70 });

  // Calculate workout time
  const workoutTime = sessionData.workoutTime || sessionData.durationSec ||
    sessionItems.reduce((total, item) => total + (item.durationSec || 180), 0);

  try {
    if (syncService.isOnline()) {
      // Record exercises to Supabase
      const exercises = sessionItems.map(item => ({
        exerciseName: item.exerciseName || item.name,
        repetitions: item.reps || item.repetitions,
        sets: item.sets || 1,
        durationSec: item.durationSec || item.duration,
        angleAccuracy: item.angleAccuracy,
        caloriesBurned: Math.round(caloriesBurned / sessionItems.length)
      }));

      await api.recordExercises(uid, exercises);

      // Update user stats
      const currentStats = await api.getUserStats(uid);
      if (currentStats) {
        const { currentStreak, longestStreak } = calculateStreak(currentStats);
        
        await api.updateUserStats(uid, {
          total_workouts: (currentStats.total_workouts || 0) + 1,
          total_calories_burned: (currentStats.total_calories_burned || 0) + caloriesBurned,
          total_workout_time: (currentStats.total_workout_time || 0) + workoutTime,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_workout_date: new Date().toISOString()
        });

        // Check for achievements
        await api.checkAndAwardAchievements(uid, {
          ...currentStats,
          total_workouts: (currentStats.total_workouts || 0) + 1,
          total_calories_burned: (currentStats.total_calories_burned || 0) + caloriesBurned,
          current_streak: currentStreak
        });
      }

      // Also update localStorage for offline access
      updateLocalStats(caloriesBurned, workoutTime);

      return {
        success: true,
        caloriesBurned,
        workoutTime,
        synced: true
      };
    } else {
      // Offline - queue for sync
      sessionItems.forEach(item => {
        syncService.addToSyncQueue('exercise', 'create', {
          ...item,
          caloriesBurned: Math.round(caloriesBurned / sessionItems.length)
        });
      });

      // Update localStorage
      updateLocalStats(caloriesBurned, workoutTime);

      return {
        success: true,
        caloriesBurned,
        workoutTime,
        synced: false,
        queued: true
      };
    }
  } catch (error) {
    console.error('Error recording workout:', error);
    
    // Fallback to local storage
    updateLocalStats(caloriesBurned, workoutTime);
    
    // Queue for later sync
    sessionItems.forEach(item => {
      syncService.addToSyncQueue('exercise', 'create', item);
    });

    return {
      success: true,
      caloriesBurned,
      workoutTime,
      synced: false,
      error: error.message
    };
  }
}

// Calculate streak
function calculateStreak(stats) {
  const lastWorkoutDate = stats.last_workout_date;
  if (!lastWorkoutDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, stats.longest_streak || 0) };
  }

  const today = new Date();
  const lastDate = new Date(lastWorkoutDate);
  const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  let currentStreak = stats.current_streak || 0;

  if (daysDiff === 0) {
    currentStreak = Math.max(1, currentStreak);
  } else if (daysDiff === 1) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(currentStreak, stats.longest_streak || 0);
  return { currentStreak, longestStreak };
}

// Update local stats (for offline support)
function updateLocalStats(caloriesBurned, workoutTime) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_STATS);
    const stats = stored ? JSON.parse(stored) : {
      totalWorkouts: 0,
      totalCalories: 0,
      totalWorkoutTime: 0,
      currentStreak: 0,
      longestStreak: 0
    };

    stats.totalWorkouts += 1;
    stats.totalCalories += caloriesBurned;
    stats.totalWorkoutTime += workoutTime;
    stats.lastWorkoutDate = new Date().toISOString();
    stats.lastUpdated = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.WORKOUT_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating local stats:', error);
  }
}

// Fallback local-only recording
function recordCompletedWorkoutLocal(sessionData) {
  const sessionItems = Array.isArray(sessionData) ? sessionData : [sessionData];
  const { total: caloriesBurned } = calculateSessionCalories(sessionItems, { weight: 70 });
  const workoutTime = sessionData.workoutTime || 180;

  updateLocalStats(caloriesBurned, workoutTime);

  return {
    success: true,
    caloriesBurned,
    workoutTime,
    synced: false
  };
}

// Get workout stats - from Supabase or localStorage
export async function getWorkoutStats(userId = null) {
  const uid = userId || await getCurrentUserId();

  if (uid && syncService.isOnline()) {
    try {
      const stats = await api.getUserStats(uid);
      if (stats) {
        return {
          totalWorkouts: stats.total_workouts || 0,
          totalCalories: stats.total_calories_burned || 0,
          totalWorkoutTime: stats.total_workout_time || 0,
          currentStreak: stats.current_streak || 0,
          longestStreak: stats.longest_streak || 0,
          lastWorkoutDate: stats.last_workout_date
        };
      }
    } catch (error) {
      console.error('Error fetching stats from Supabase:', error);
    }
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_STATS);
  return stored ? JSON.parse(stored) : {
    totalWorkouts: 0,
    totalCalories: 0,
    totalWorkoutTime: 0,
    currentStreak: 0,
    longestStreak: 0
  };
}

// Get exercise history - from Supabase or localStorage
export async function getExerciseHistory(userId = null, filters = {}) {
  const uid = userId || await getCurrentUserId();

  if (uid && syncService.isOnline()) {
    try {
      return await api.getExercises(uid, filters);
    } catch (error) {
      console.error('Error fetching exercises from Supabase:', error);
    }
  }

  // No localStorage fallback for detailed history
  return [];
}

// Get daily progress
export async function getDailyProgress(userId = null, date = null) {
  const uid = userId || await getCurrentUserId();
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (uid && syncService.isOnline()) {
    try {
      const exercises = await api.getExercisesByDate(uid, targetDate);
      const totalCalories = exercises.reduce((sum, ex) => sum + (ex.calories_burned || 0), 0);
      const totalTime = exercises.reduce((sum, ex) => sum + (ex.duration_sec || 0), 0);

      return {
        date: targetDate,
        workoutsCompleted: exercises.length,
        caloriesBurned: totalCalories,
        totalWorkoutTime: totalTime,
        exercises: exercises
      };
    } catch (error) {
      console.error('Error fetching daily progress:', error);
    }
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
  const allProgress = stored ? JSON.parse(stored) : {};
  return allProgress[targetDate] || {
    date: targetDate,
    workoutsCompleted: 0,
    caloriesBurned: 0,
    totalWorkoutTime: 0
  };
}

// Sync local data to Supabase
export async function syncToSupabase(userId) {
  return syncService.processSyncQueue(userId);
}

export default {
  recordCompletedWorkout,
  getWorkoutStats,
  getExerciseHistory,
  getDailyProgress,
  syncToSupabase,
  STORAGE_KEYS
};
