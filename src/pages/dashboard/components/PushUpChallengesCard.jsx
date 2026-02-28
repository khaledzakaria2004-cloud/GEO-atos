import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { getAchievements, getAchievementLevels } from '../../../utils/api/achievementsApi';

// Push-Up Challenges Card - Shows progress from Supabase
const PushUpChallengesCard = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Push-up exercise types to track
  const pushUpTypes = [
    { code: 'push-ups_achievement', name: 'Push-Ups', icon: '💪' },
    { code: 'wide_push_ups_achievement', name: 'Wide Push-Ups', icon: '🔥' },
    { code: 'narrow_push_ups_achievement', name: 'Narrow Push-Ups', icon: '⚡' },
    { code: 'diamond_push_ups_achievement', name: 'Diamond Push-Ups', icon: '💎' },
    { code: 'knee_push_ups_achievement', name: 'Knee Push-Ups', icon: '🏋️' },
  ];

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (sessionUser?.id) {
          const data = await getAchievements(sessionUser.id);
          // Filter only push-up related achievements
          const pushUpAchievements = data?.filter(a => 
            a.achievement_code?.toLowerCase().includes('push')
          ) || [];
          setAchievements(pushUpAchievements);
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAchievements();
  }, []);

  const getAchievementData = (code) => {
    return achievements.find(a => a.achievement_code === code);
  };

  const getLevelColor = (level) => {
    if (level >= 5) return 'text-yellow-500';
    if (level >= 3) return 'text-primary';
    if (level >= 1) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getProgressColor = (level) => {
    if (level >= 5) return 'bg-yellow-500';
    if (level >= 3) return 'bg-primary';
    if (level >= 1) return 'bg-green-500';
    return 'bg-muted';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-elevation-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mr-3">
            <Icon name="Target" size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Push-Up Challenges</h3>
            <p className="text-xs text-muted-foreground">Track your cumulative progress</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/user-profile')}
          className="text-xs text-primary hover:underline flex items-center"
        >
          View All
          <Icon name="ChevronRight" size={14} className="ml-1" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader" size={24} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {pushUpTypes.map((type) => {
            const achievement = getAchievementData(type.code);
            const progress = achievement?.progress || 0;
            const target = achievement?.target || 50;
            const level = achievement?.level || 0;
            const percentage = Math.min(100, Math.round((progress / target) * 100));

            return (
              <div key={type.code} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{type.icon}</span>
                    <span className="text-sm font-medium text-card-foreground">{type.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold ${getLevelColor(level)}`}>
                      Lv.{level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {progress} reps
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(level)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {progress} / {target}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}

          {achievements.length === 0 && (
            <div className="text-center py-4">
              <Icon name="Dumbbell" size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Start doing push-ups to track your progress!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PushUpChallengesCard;
