import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { getAchievements } from '../../../utils/api/achievementsApi';

// Achievements Card - Now loads from Supabase
export const AchievementsCard = () => {
  const [analytics, setAnalytics] = useState({
    bestStreak: 0,
    favoriteExercise: 'Push-ups',
    streakDays: 0
  });
  const [topAchievement, setTopAchievement] = useState(null);
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    // Load analytics data from localStorage
    const loadAnalytics = () => {
      try {
        const stored = localStorage.getItem('workoutAnalytics');
        if (stored) {
          const data = JSON.parse(stored);
          setAnalytics(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };
    loadAnalytics();

    // Load achievements from Supabase
    const loadSupabaseAchievements = async () => {
      try {
        const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (sessionUser?.id) {
          const achievements = await getAchievements(sessionUser.id);
          if (achievements && achievements.length > 0) {
            // Find the achievement with highest progress
            const sorted = [...achievements].sort((a, b) => b.progress - a.progress);
            setTopAchievement(sorted[0]);
            
            // Calculate total progress across all achievements
            const total = achievements.reduce((sum, a) => sum + (a.progress || 0), 0);
            setTotalProgress(total);
            
            // Find favorite exercise (most progress)
            if (sorted[0]) {
              const exerciseName = sorted[0].achievement_name?.replace(' Achievement', '') || 'Push-ups';
              setAnalytics(prev => ({ ...prev, favoriteExercise: exerciseName }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading Supabase achievements:', error);
      }
    };
    loadSupabaseAchievements();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-elevation-2 aspect-square flex flex-col">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center mr-3">
          <Icon name="Trophy" size={16} className="text-yellow-500" />
        </div>
        <h3 className="font-semibold text-card-foreground text-sm">Achievements</h3>
      </div>
      <div className="flex-1 space-y-3">
        {topAchievement ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Top Exercise</span>
              <span className="font-semibold text-card-foreground text-sm truncate ml-2">
                {topAchievement.achievement_name?.replace(' Achievement', '')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Reps</span>
              <span className="font-semibold text-yellow-500 text-sm">{topAchievement.progress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Level</span>
              <span className="font-semibold text-primary text-sm">Level {topAchievement.level}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Best Streak</span>
              <span className="font-semibold text-card-foreground text-sm">{analytics.bestStreak} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Current Streak</span>
              <span className="font-semibold text-card-foreground text-sm">{analytics.streakDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Favorite</span>
              <span className="font-semibold text-card-foreground text-sm truncate ml-2">{analytics.favoriteExercise}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Calories & Goals Card
export const CaloriesGoalsCard = () => {
  const [analytics, setAnalytics] = useState({
    caloriesThisWeek: 0,
    weeklyGoalProgress: 0
  });

  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const stored = localStorage.getItem('workoutAnalytics');
        if (stored) {
          const data = JSON.parse(stored);
          setAnalytics(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };
    loadAnalytics();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-elevation-2 aspect-square flex flex-col">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center mr-3">
          <Icon name="Zap" size={16} className="text-yellow-500" />
        </div>
        <h3 className="font-semibold text-card-foreground text-sm">Calories & Goals</h3>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{analytics.caloriesThisWeek}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Weekly Goal</span>
              <span className="text-card-foreground font-medium">{Math.round(analytics.weeklyGoalProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, analytics.weeklyGoalProgress)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Overview Card
export const PerformanceOverviewCard = () => {
  const [analytics, setAnalytics] = useState({
    weeklyWorkouts: 0,
    averageWorkoutDuration: 0,
    streakDays: 0
  });

  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const stored = localStorage.getItem('workoutAnalytics');
        if (stored) {
          const data = JSON.parse(stored);
          setAnalytics(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };
    loadAnalytics();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-elevation-2 aspect-square flex flex-col">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
          <Icon name="TrendingUp" size={16} className="text-primary" />
        </div>
        <h3 className="font-semibold text-card-foreground text-sm">Performance</h3>
      </div>
      <div className="flex-1 grid grid-cols-1 gap-3">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-500">{analytics.weeklyWorkouts}</div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-500">
            {Math.floor(analytics.averageWorkoutDuration / 60)}m
          </div>
          <div className="text-xs text-muted-foreground">Avg Duration</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-500">{analytics.streakDays}</div>
          <div className="text-xs text-muted-foreground">Streak Days</div>
        </div>
      </div>
    </div>
  );
};

// Daily Motivation Card
export const DailyMotivationCard = () => {
  const [currentTip, setCurrentTip] = useState(null);

  const motivationTips = [
    {
      icon: 'Heart',
      title: 'Daily Motivation',
      content: 'Every workout is a step closer to your goals. Progress, not perfection!',
      category: 'Mindset'
    },
    {
      icon: 'Trophy',
      title: 'Achievement Mindset',
      content: 'Celebrate small wins! Each completed workout is a victory.',
      category: 'Success'
    },
    {
      icon: 'Target',
      title: 'Stay Focused',
      content: 'Quality over quantity! Focus on proper form for better results.',
      category: 'Technique'
    },
    {
      icon: 'Flame',
      title: 'Keep Going',
      content: 'Your consistency today builds the strength of tomorrow.',
      category: 'Persistence'
    }
  ];

  useEffect(() => {
    // Set a random motivation tip
    const randomTip = motivationTips[Math.floor(Math.random() * motivationTips.length)];
    setCurrentTip(randomTip);
  }, []);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Mindset': return 'bg-primary/10 text-primary';
      case 'Success': return 'bg-accent/10 text-accent';
      case 'Technique': return 'bg-warning/10 text-warning';
      case 'Persistence': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  if (!currentTip) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-elevation-2 aspect-square flex flex-col">
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
          <Icon name={currentTip.icon} size={16} className="text-primary" />
        </div>
        <h3 className="font-semibold text-card-foreground text-sm">Daily Motivation</h3>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-medium text-card-foreground text-sm mb-2">
            {currentTip.title}
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {currentTip.content}
          </p>
        </div>
        <div className="mt-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(currentTip.category)}`}>
            {currentTip.category}
          </span>
        </div>
      </div>
    </div>
  );
};