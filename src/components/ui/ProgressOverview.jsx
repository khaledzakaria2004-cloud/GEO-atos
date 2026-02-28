import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import { getWorkoutStats, getAchievementBadges } from '../../utils/workoutStorage';

const ProgressOverview = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = () => {
      try {
        setLoading(true);
        const workoutStats = getWorkoutStats();
        const achievements = getAchievementBadges();
        
        const progressSummary = {
          milestones: {
            totalWorkouts: workoutStats.totalWorkouts || 0,
            totalCalories: Math.round(workoutStats.totalCalories || 0),
            currentStreak: workoutStats.currentStreak || 0,
            longestStreak: workoutStats.longestStreak || 0
          },
          achievements: {
            badges: achievements,
            completionPercentage: achievements.length > 0 ? 100 : 0
          },
          weeklyActivity: {
            workouts: workoutStats.weeklyWorkouts || 0,
            calories: Math.round(workoutStats.totalCalories / Math.max(workoutStats.totalWorkouts, 1) * workoutStats.weeklyWorkouts) || 0
          }
        };
        
        setSummary(progressSummary);
      } catch (error) {
        console.error('Error loading progress summary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();

    // Refresh when workouts are completed
    const handleWorkoutCompleted = () => {
      loadSummary();
    };

    const handleExerciseProgressUpdated = () => {
      loadSummary();
    };

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    window.addEventListener('exerciseProgressUpdated', handleExerciseProgressUpdated);
    
    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
      window.removeEventListener('exerciseProgressUpdated', handleExerciseProgressUpdated);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Icon name="Activity" size={24} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No progress data available</p>
      </div>
    );
  }

  const getStreakColor = (streak) => {
    if (streak === 0) return 'text-gray-500';
    if (streak < 3) return 'text-blue-500';
    if (streak < 7) return 'text-green-500';
    if (streak < 14) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAchievementColor = (percentage) => {
    if (percentage === 0) return 'text-gray-500';
    if (percentage < 25) return 'text-blue-500';
    if (percentage < 50) return 'text-green-500';
    if (percentage < 75) return 'text-orange-500';
    return 'text-purple-500';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Progress Overview</h3>
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="TrendingUp" size={16} className="text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {summary.milestones.totalWorkouts}
          </div>
          <div className="text-xs text-muted-foreground">Total Workouts</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {summary.milestones.totalCalories}
          </div>
          <div className="text-xs text-muted-foreground">Calories Burned</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${getStreakColor(summary.milestones.currentStreak)}`}>
            {summary.milestones.currentStreak}
          </div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${getAchievementColor(summary.achievements.completionPercentage)}`}>
            {summary.achievements.completionPercentage}%
          </div>
          <div className="text-xs text-muted-foreground">Achievements</div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              This Week: {summary.weeklyActivity.workouts} workouts
            </span>
            <span className="text-muted-foreground">
              Badges: {summary.achievements.badges.length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Trophy" size={14} className="text-warning" />
            <span className="text-xs font-medium text-card-foreground">
              {summary.achievements.totalLevelsCompleted}/{summary.achievements.totalLevelsAvailable} levels
            </span>
          </div>
        </div>

        {/* Achievement Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Achievement Progress</span>
            <span className="font-medium text-card-foreground">
              {summary.achievements.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${summary.achievements.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressOverview;