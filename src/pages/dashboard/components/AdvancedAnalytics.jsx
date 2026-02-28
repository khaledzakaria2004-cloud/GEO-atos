import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import useWorkoutData from '../../../hooks/useWorkoutData';
import { getExerciseStats, STORAGE_KEYS } from '../../../utils/workoutStorage';

const AdvancedAnalytics = () => {
  const { workoutStats, dailyProgress, loading } = useWorkoutData();
  const [analytics, setAnalytics] = useState({
    weeklyWorkouts: 0,
    monthlyWorkouts: 0,
    averageWorkoutDuration: 0,
    caloriesThisWeek: 0,
    caloriesThisMonth: 0,
    streakDays: 0,
    bestStreak: 0,
    favoriteExercise: 'Push-ups',
    weeklyGoalProgress: 0,
    monthlyGoalProgress: 0
  });

  useEffect(() => {
    if (!loading && workoutStats) {
      // Calculate analytics from workout storage data
      const loadAnalytics = () => {
        try {
          // Get daily progress data for calculations
          const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
          const allProgress = stored ? JSON.parse(stored) : {};
          
          // Calculate weekly stats
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
          
          let weeklyWorkouts = 0;
          let weeklyCalories = 0;
          let monthlyWorkouts = 0;
          let monthlyCalories = 0;
          
          // Calculate monthly stats
          const oneMonthAgo = new Date();
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          const monthAgoStr = oneMonthAgo.toISOString().split('T')[0];
          
          // Count exercise occurrences for favorite
          const exerciseCounts = {};
          
          Object.entries(allProgress).forEach(([date, dayProgress]) => {
            if (date >= weekAgoStr) {
              weeklyWorkouts += dayProgress.workoutsCompleted || 0;
              weeklyCalories += dayProgress.caloriesBurned || 0;
            }
            if (date >= monthAgoStr) {
              monthlyWorkouts += dayProgress.workoutsCompleted || 0;
              monthlyCalories += dayProgress.caloriesBurned || 0;
            }
            
            // Count exercises for favorite
            if (dayProgress.exercisesCompleted) {
              dayProgress.exercisesCompleted.forEach(exercise => {
                exerciseCounts[exercise] = (exerciseCounts[exercise] || 0) + 1;
              });
            }
          });
          
          // Find favorite exercise
          const favoriteExercise = Object.keys(exerciseCounts).length > 0 
            ? Object.keys(exerciseCounts).reduce((a, b) => 
                exerciseCounts[a] > exerciseCounts[b] ? a : b
              )
            : 'Push-ups';
          
          // Calculate average workout duration
          const avgDuration = workoutStats.totalWorkouts > 0 
            ? Math.round(workoutStats.totalWorkoutTime / workoutStats.totalWorkouts)
            : 0;
          
          setAnalytics({
            weeklyWorkouts: workoutStats.weeklyWorkouts || weeklyWorkouts,
            monthlyWorkouts: workoutStats.monthlyWorkouts || monthlyWorkouts,
            averageWorkoutDuration: avgDuration,
            caloriesThisWeek: Math.round(weeklyCalories),
            caloriesThisMonth: Math.round(monthlyCalories),
            streakDays: workoutStats.currentStreak || 0,
            bestStreak: workoutStats.longestStreak || 0,
            favoriteExercise,
            weeklyGoalProgress: Math.min(100, ((workoutStats.weeklyWorkouts || weeklyWorkouts) / 5) * 100),
            monthlyGoalProgress: Math.min(100, ((workoutStats.monthlyWorkouts || monthlyWorkouts) / 20) * 100)
          });
        } catch (error) {
          console.error('Error loading analytics:', error);
        }
      };

      loadAnalytics();
    }
  }, [workoutStats, dailyProgress, loading]);

  const StatCard = ({ title, value, subtitle, icon, color = 'text-primary' }) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon name={icon} size={18} className={color} />
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-bold text-card-foreground mb-1">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );

  const ProgressBar = ({ label, percentage, color = 'bg-primary' }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-card-foreground font-medium">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
          <Icon name="TrendingUp" size={20} className="mr-2 text-primary" />
          Performance Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="This Week"
            value={analytics.weeklyWorkouts}
            subtitle="workouts"
            icon="Calendar"
            color="text-blue-500"
          />
          <StatCard
            title="This Month"
            value={analytics.monthlyWorkouts}
            subtitle="workouts"
            icon="Calendar"
            color="text-green-500"
          />
          <StatCard
            title="Avg Duration"
            value={`${Math.floor(analytics.averageWorkoutDuration / 60)}m ${analytics.averageWorkoutDuration % 60}s`}
            subtitle="per workout"
            icon="Clock"
            color="text-orange-500"
          />
          <StatCard
            title="Current Streak"
            value={analytics.streakDays}
            subtitle="days"
            icon="Flame"
            color="text-red-500"
          />
        </div>
      </div>

      {/* Calories & Goals */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
          <Icon name="Zap" size={20} className="mr-2 text-yellow-500" />
          Calories & Goals
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-card-foreground">Weekly Calories</span>
              <span className="text-lg font-bold text-yellow-500">{analytics.caloriesThisWeek}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-card-foreground">Monthly Calories</span>
              <span className="text-lg font-bold text-yellow-500">{analytics.caloriesThisMonth}</span>
            </div>
          </div>
          <div>
            <ProgressBar 
              label="Weekly Goal Progress" 
              percentage={analytics.weeklyGoalProgress} 
              color="bg-blue-500"
            />
            <ProgressBar 
              label="Monthly Goal Progress" 
              percentage={analytics.monthlyGoalProgress} 
              color="bg-green-500"
            />
          </div>
        </div>
      </div>

      {/* Achievements & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
            <Icon name="Trophy" size={20} className="mr-2 text-yellow-500" />
            Achievements
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Best Streak</span>
              <span className="font-semibold text-card-foreground">{analytics.bestStreak} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Favorite Exercise</span>
              <span className="font-semibold text-card-foreground">{analytics.favoriteExercise}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Streak</span>
              <span className="font-semibold text-card-foreground">{analytics.streakDays} days</span>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AdvancedAnalytics;
