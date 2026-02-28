import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import { getExerciseStats, getWeeklyExerciseStats } from '../../utils/workoutStorage';

const ExerciseProgressCards = () => {
  const [exerciseData, setExerciseData] = useState([]);
  const [loading, setLoading] = useState(true);

  const commonExercises = [
    'Push-Ups',
    'Squats', 
    'Plank',
    'Burpees',
    'Jumping Jacks',
    'Lunges'
  ];

  useEffect(() => {
    const loadExerciseData = async () => {
      try {
        setLoading(true);
        const data = await Promise.all(
          commonExercises.map(async (exercise) => {
            const stats = getExerciseStats(exercise);
            const weeklyStats = getWeeklyExerciseStats(exercise);
            
            return {
              name: exercise,
              totalSessions: stats.totalSessions,
              totalCalories: stats.totalCalories,
              lastCompleted: stats.lastCompleted,
              weeklySessions: weeklyStats.weeklySessions,
              weeklyCalories: weeklyStats.weeklyCalories,
              icon: getExerciseIcon(exercise)
            };
          })
        );
        
        // Sort by total sessions (most active first)
        setExerciseData(data.sort((a, b) => b.totalSessions - a.totalSessions));
      } catch (error) {
        console.error('Error loading exercise data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExerciseData();
    
    // Refresh when workouts are completed
    const handleWorkoutCompleted = () => {
      loadExerciseData();
    };

    const handleExerciseProgressUpdated = () => {
      loadExerciseData();
    };

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    window.addEventListener('exerciseProgressUpdated', handleExerciseProgressUpdated);
    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
      window.removeEventListener('exerciseProgressUpdated', handleExerciseProgressUpdated);
    };
  }, []);

  const getExerciseIcon = (exerciseName) => {
    const iconMap = {
      'Push-Ups': 'Zap',
      'Squats': 'ArrowDown',
      'Plank': 'Clock',
      'Burpees': 'Activity',
      'Jumping Jacks': 'Heart',
      'Lunges': 'ArrowUpDown'
    };
    return iconMap[exerciseName] || 'Dumbbell';
  };

  const getProgressLevel = (sessions) => {
    if (sessions === 0) return { level: 'Beginner', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    if (sessions < 5) return { level: 'Novice', color: 'text-blue-500', bgColor: 'bg-blue-100' };
    if (sessions < 15) return { level: 'Intermediate', color: 'text-green-500', bgColor: 'bg-green-100' };
    if (sessions < 30) return { level: 'Advanced', color: 'text-orange-500', bgColor: 'bg-orange-100' };
    return { level: 'Expert', color: 'text-purple-500', bgColor: 'bg-purple-100' };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Exercise Progress</h3>
        <div className="text-sm text-muted-foreground">
          Track your progress across different exercises
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exerciseData.map((exercise) => {
          const progressLevel = getProgressLevel(exercise.totalSessions);
          
          return (
            <div
              key={exercise.name}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 ${progressLevel.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon name={exercise.icon} size={16} className={progressLevel.color} />
                  </div>
                  <h4 className="font-medium text-card-foreground">{exercise.name}</h4>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${progressLevel.bgColor} ${progressLevel.color} font-medium`}>
                  {progressLevel.level}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="font-medium text-card-foreground">{exercise.totalSessions}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Calories</span>
                  <span className="font-medium text-card-foreground">{Math.round(exercise.totalCalories)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="font-medium text-card-foreground">{exercise.weeklySessions} sessions</span>
                </div>

                {exercise.lastCompleted && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Done</span>
                    <span className="font-medium text-card-foreground">
                      {new Date(exercise.lastCompleted).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {exercise.totalSessions === 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Complete your first {exercise.name} session to start tracking progress!
                  </p>
                </div>
              )}

              {exercise.weeklySessions > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Weekly Progress</span>
                    <span className="text-green-600 font-medium">
                      +{Math.round(exercise.weeklyCalories)} cal this week
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {exerciseData.every(ex => ex.totalSessions === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Activity" size={24} className="text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium text-card-foreground mb-2">Start Your Fitness Journey</h4>
          <p className="text-muted-foreground">
            Complete your first workout to see your exercise progress here!
          </p>
        </div>
      )}
    </div>
  );
};

export default ExerciseProgressCards;