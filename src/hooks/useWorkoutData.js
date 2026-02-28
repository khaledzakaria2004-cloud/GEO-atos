import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentUser,
  updateUserProfile,
  getWorkoutStats,
  getDailyProgress,
  getAchievementBadges,
  getTodayPlan,
  recordCompletedWorkout,
  markExerciseCompleted,
  addAchievementBadge
} from '../utils/workoutStorage';

export default function useWorkoutData() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);

  // Load initial data
  const loadData = useCallback(() => {
    try {
      setLoading(true);
      setUser(getCurrentUser());
      setWorkoutStats(getWorkoutStats());
      setDailyProgress(getDailyProgress());
      setAchievements(getAchievementBadges());
      setTodayPlan(getTodayPlan());
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data when events occur
  const handleWorkoutCompleted = useCallback(() => {
    setWorkoutStats(getWorkoutStats());
    setDailyProgress(getDailyProgress());
    setUser(getCurrentUser());
    // Trigger a re-render for components using exercise achievements
    window.dispatchEvent(new CustomEvent('exerciseProgressUpdated'));
  }, []);

  const handleAchievementEarned = useCallback(() => {
    setAchievements(getAchievementBadges());
  }, []);

  // Set up event listeners
  useEffect(() => {
    loadData();

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    window.addEventListener('achievementEarned', handleAchievementEarned);

    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
      window.removeEventListener('achievementEarned', handleAchievementEarned);
    };
  }, [loadData, handleWorkoutCompleted, handleAchievementEarned]);

  // Action functions
  const updateProfile = useCallback(async (updates) => {
    try {
      const updatedUser = updateUserProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, []);

  const recordWorkout = useCallback(async (sessionData) => {
    try {
      const result = await recordCompletedWorkout(sessionData);
      if (result.success) {
        // Data will be refreshed by event listeners
        return result;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error('Error recording workout:', error);
      throw error;
    }
  }, []);

  const completeExercise = useCallback(async (exerciseName) => {
    try {
      const result = await markExerciseCompleted(exerciseName);
      if (result.success) {
        return result;
      }
      throw new Error(result.error);
    } catch (error) {
      console.error('Error completing exercise:', error);
      throw error;
    }
  }, []);

  const earnAchievement = useCallback((badge) => {
    try {
      const updatedBadges = addAchievementBadge(badge);
      setAchievements(updatedBadges);
      return updatedBadges;
    } catch (error) {
      console.error('Error earning achievement:', error);
      throw error;
    }
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    // Data
    loading,
    user,
    workoutStats,
    dailyProgress,
    achievements,
    todayPlan,
    
    // Actions
    updateProfile,
    recordWorkout,
    completeExercise,
    earnAchievement,
    refreshData
  };
}