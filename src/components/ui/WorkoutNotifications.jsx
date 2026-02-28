import React, { useEffect, useState } from 'react';

const WorkoutNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleWorkoutCompleted = (event) => {
      const { exerciseName, caloriesBurned, workoutTime } = event.detail;
      
      const notification = {
        id: Date.now(),
        type: 'workout',
        title: 'Workout Completed! 🎉',
        message: `${exerciseName} - ${Math.round(caloriesBurned)} calories burned in ${Math.round(workoutTime / 60)} minutes`,
        timestamp: new Date().toISOString()
      };
      
      showNotification(notification);
    };

    const handleAchievementEarned = (event) => {
      const { title, description, icon } = event.detail;
      
      const notification = {
        id: Date.now(),
        type: 'achievement',
        title: `Achievement Unlocked! ${icon || '🏆'}`,
        message: `${title} - ${description}`,
        timestamp: new Date().toISOString()
      };
      
      showNotification(notification);
    };

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    window.addEventListener('achievementEarned', handleAchievementEarned);

    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
      window.removeEventListener('achievementEarned', handleAchievementEarned);
    };
  }, []);

  const showNotification = (notification) => {
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out
            ${notification.type === 'workout' 
              ? 'bg-green-500 text-white' 
              : 'bg-yellow-500 text-white'
            }
            animate-slide-in-right
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-xs opacity-90">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutNotifications;