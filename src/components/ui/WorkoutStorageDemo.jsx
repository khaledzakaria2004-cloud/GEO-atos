import React, { useState } from 'react';
import useWorkoutData from '../../hooks/useWorkoutData';
import { cleanupOldData, getChatConversations, exportChatData, STORAGE_KEYS } from '../../utils/workoutStorage';
import ChatDataManager from './ChatDataManager';

const WorkoutStorageDemo = () => {
  const {
    loading,
    user,
    workoutStats,
    dailyProgress,
    achievements,
    recordWorkout,
    completeExercise,
    earnAchievement,
    refreshData
  } = useWorkoutData();

  const [testExercise, setTestExercise] = useState('Push-Ups');


  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const testWorkouts = [
    { name: 'Push-Ups', reps: 15, sets: 3, durationSec: 180 },
    { name: 'Squats', reps: 20, sets: 3, durationSec: 240 },
    { name: 'Plank', durationSec: 60, sets: 1 },
    { name: 'Burpees', reps: 10, sets: 2, durationSec: 300 },
    { name: 'Jumping Jacks', reps: 50, sets: 2, durationSec: 120 },
    { name: 'Lunges', reps: 16, sets: 2, durationSec: 150 }
  ];

  const testAchievements = [
    { id: 'first_workout', title: 'Getting Started', description: 'Completed your first workout', icon: '🎯' },
    { id: 'streak_3', title: 'On Fire', description: '3-day workout streak', icon: '🔥' },
    { id: 'calories_100', title: 'Calorie Crusher', description: 'Burned 100+ calories', icon: '💪' }
  ];

  const handleTestWorkout = async (workout) => {
    try {
      await recordWorkout({
        exerciseName: workout.name,
        name: workout.name,
        reps: workout.reps,
        sets: workout.sets,
        durationSec: workout.durationSec,
        workoutTime: workout.durationSec
      });
    } catch (error) {
      console.error('Test workout failed:', error);
    }
  };

  const handleTestAchievement = (achievement) => {
    earnAchievement(achievement);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all workout data?')) {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      refreshData();
    }
  };

  const handleCleanupOldData = () => {
    cleanupOldData(7); // Keep last 7 days
    refreshData();
  };

  const handleShowChatData = () => {
    const conversations = getChatConversations();
    const chatData = exportChatData();
    console.log('Chat Conversations:', conversations);
    console.log('Chat Export Data:', chatData);
    alert(`Found ${conversations.length} chat conversations. Check console for details.`);
  };

  const handleTestChatSave = () => {
    try {
      const { saveChatConversation } = require('../../utils/workoutStorage');
      
      const testConversation = {
        messages: [
          { id: 1, message: 'Hello, this is a test message', isUser: true, timestamp: new Date() },
          { id: 2, message: 'This is a test response from AI', isUser: false, timestamp: new Date() }
        ]
      };
      
      const result = saveChatConversation(testConversation);
      console.log('Test conversation saved:', result);
      
      const allConversations = getChatConversations();
      console.log('All conversations after save:', allConversations);
      
      alert(`Test conversation saved! Total conversations: ${allConversations.length}`);
    } catch (error) {
      console.error('Error testing chat save:', error);
      alert('Error testing chat save: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-lg">Loading workout data...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <h3 className="text-lg font-bold mb-4 text-gray-800">
        🧪 Workout Storage Demo (Dev Only)
      </h3>
      
      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold text-gray-700 mb-2">User Profile</h4>
          <p className="text-sm text-gray-600">Name: {user?.name}</p>
          <p className="text-sm text-gray-600">Total Workouts: {user?.totalWorkouts || 0}</p>
          <p className="text-sm text-gray-600">Streak: {user?.currentStreak || 0} days</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold text-gray-700 mb-2">Workout Stats</h4>
          <p className="text-sm text-gray-600">Total: {workoutStats?.totalWorkouts || 0}</p>
          <p className="text-sm text-gray-600">Calories: {Math.round(workoutStats?.totalCalories || 0)}</p>
          <p className="text-sm text-gray-600">Time: {Math.round((workoutStats?.totalWorkoutTime || 0) / 60)}min</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold text-gray-700 mb-2">Today's Progress</h4>
          <p className="text-sm text-gray-600">Workouts: {dailyProgress?.workoutsCompleted || 0}</p>
          <p className="text-sm text-gray-600">Calories: {Math.round(dailyProgress?.caloriesBurned || 0)}</p>
          <p className="text-sm text-gray-600">Exercises: {dailyProgress?.exercisesCompleted?.length || 0}</p>
        </div>
      </div>

      {/* Test Actions */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Test Workouts</h4>
          <div className="flex flex-wrap gap-2">
            {testWorkouts.map((workout, index) => (
              <button
                key={index}
                onClick={() => handleTestWorkout(workout)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                {workout.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Test Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {testAchievements.map((achievement, index) => (
              <button
                key={index}
                onClick={() => handleTestAchievement(achievement)}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                {achievement.icon} {achievement.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Quick Exercise Complete</h4>
          <div className="flex gap-2 items-center">
            <select
              value={testExercise}
              onChange={(e) => setTestExercise(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="Push-Ups">Push-Ups</option>
              <option value="Squats">Squats</option>
              <option value="Plank">Plank</option>
              <option value="Burpees">Burpees</option>
            </select>
            <button
              onClick={() => completeExercise(testExercise)}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              Complete Exercise
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Data Management</h4>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              Refresh Data
            </button>
            <button
              onClick={handleCleanupOldData}
              className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
            >
              Cleanup Old Data
            </button>
            
            <button
              onClick={handleShowChatData}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
            >
              Show Chat Data
            </button>
            
            <button
              onClick={handleTestChatSave}
              className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 transition-colors"
            >
              Test Chat Save
            </button>

            <button
              onClick={handleClearData}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>



      {/* Chat Data Manager */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-700 mb-2">Chat Data Management</h4>
        <ChatDataManager />
      </div>

      {/* Achievements Display */}
      {achievements.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-2">Current Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm border border-purple-200"
              >
                {achievement.icon} {achievement.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutStorageDemo;