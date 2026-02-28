import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { db, getOrCreateUserByEmail } from '../../../utils/db';
import { getAchievements, getAchievementLevels, calculateLevel, getCurrentTarget } from '../../../utils/api/achievementsApi';

const AchievementsTab = ({ user }) => {
  const badgesFromStorage = JSON.parse(localStorage.getItem('fitcoach_badges') || '[]');
  const [dynamic, setDynamic] = useState([]);
  const [supabaseAchievements, setSupabaseAchievements] = useState([]);
  const [loadingSupabase, setLoadingSupabase] = useState(true);
  
  // Load achievements from Supabase
  useEffect(() => {
    const loadSupabaseAchievements = async () => {
      try {
        const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (sessionUser?.id) {
          console.log('🏆 Loading achievements from Supabase for user:', sessionUser.id);
          const achievements = await getAchievements(sessionUser.id);
          console.log('✅ Loaded Supabase achievements:', achievements);
          setSupabaseAchievements(achievements);
        }
      } catch (error) {
        console.error('❌ Error loading Supabase achievements:', error);
      } finally {
        setLoadingSupabase(false);
      }
    };
    
    loadSupabaseAchievements();
  }, []);
  
  // Achievement configuration factory - makes it easy to add new achievements
  const ACHIEVEMENT_CONFIGS = useMemo(() => ({
    'pushups': {
      name: 'Push-Up Achievement',
      exerciseName: 'push-ups',
      storageKey: 'pushup_achievement_progress_v2',
      levels: [
        { level: 1, goal: 50 },
        { level: 2, goal: 100 },
        { level: 3, goal: 250 },
        { level: 4, goal: 500 },
        { level: 5, goal: 1000 },
      ],
      alt: 'Push-Ups Exercise'
    },
    'wide_pushups': {
      name: 'Wide Push-Up Achievement',
      exerciseName: 'wide push ups',
      storageKey: 'wide_pushup_achievement_progress_v2',
      levels: [
        { level: 1, goal: 50 },
        { level: 2, goal: 100 },
        { level: 3, goal: 250 },
        { level: 4, goal: 500 },
        { level: 5, goal: 1000 },
      ],
      alt: 'Wide Push-Ups Exercise'
    },
    'narrow_pushups': {
      name: 'Narrow Push-Up Achievement',
      exerciseName: 'narrow push ups',
      storageKey: 'narrow_pushup_achievement_progress_v2',
      levels: [
        { level: 1, goal: 50 },
        { level: 2, goal: 100 },
        { level: 3, goal: 250 },
        { level: 4, goal: 500 },
        { level: 5, goal: 1000 },
      ],
      alt: 'Narrow Push-Ups Exercise'
    },
    'diamond_pushups': {
      name: 'Diamond Push-Up Achievement',
      exerciseName: 'diamond push ups',
      storageKey: 'diamond_pushup_achievement_progress_v2',
      levels: [
        { level: 1, goal: 38 },
        { level: 2, goal: 75 },
        { level: 3, goal: 188 },
        { level: 4, goal: 375 },
        { level: 5, goal: 750 },
      ],
      alt: 'Diamond Push-Ups Exercise'
    },
    'knee_pushups': {
      name: 'Knee Push-Up Achievement',
      exerciseName: 'knee push ups',
      storageKey: 'knee_pushup_achievement_progress_v2',
      levels: [
        { level: 1, goal: 100 },
        { level: 2, goal: 200 },
        { level: 3, goal: 500 },
        { level: 4, goal: 1000 },
        { level: 5, goal: 2000 },
      ],
      alt: 'Knee Push-Ups Exercise'
    }
  }), []);

  // Cardio Achievement Configurations
  const CARDIO_ACHIEVEMENT_CONFIGS = useMemo(() => ({
    'jumping_jacks': {
      name: 'Jumping Jacks Achievement',
      exerciseName: 'jumping jacks',
      storageKey: 'jumping_jacks_achievement_progress_v2',
      levels: [
        { level: 1, goal: 1000 },
        { level: 2, goal: 2500 },
        { level: 3, goal: 6000 },
        { level: 4, goal: 8500 },
        { level: 5, goal: 12000 },
      ],
      alt: 'Jumping Jacks Exercise'
    },
    'burpees': {
      name: 'Burpees Achievement',
      exerciseName: 'burpees',
      storageKey: 'burpees_achievement_progress_v2',
      levels: [
        { level: 1, goal: 38 },
        { level: 2, goal: 75 },
        { level: 3, goal: 188 },
        { level: 4, goal: 375 },
        { level: 5, goal: 750 },
      ],
      alt: 'Burpees Exercise'
    },
    'high_knees': {
      name: 'High Knees Achievement',
      exerciseName: 'high knees',
      storageKey: 'high_knees_achievement_progress_v2',
      levels: [
        { level: 1, goal: 2000 },
        { level: 2, goal: 5000 },
        { level: 3, goal: 12000 },
        { level: 4, goal: 17000 },
        { level: 5, goal: 24000 },
      ],
      alt: 'High Knees Exercise'
    }
  }), []);

  // Lower Body Achievement Configurations
  const LOWER_BODY_ACHIEVEMENT_CONFIGS = useMemo(() => ({
    'squats': {
      name: 'Squats Achievement',
      exerciseName: 'squats',
      storageKey: 'squats_achievement_progress_v2',
      levels: [
        { level: 1, goal: 100 },  // Double push-ups: 50 * 2
        { level: 2, goal: 200 },  // Double push-ups: 100 * 2
        { level: 3, goal: 500 },  // Double push-ups: 250 * 2
        { level: 4, goal: 1000 }, // Double push-ups: 500 * 2
        { level: 5, goal: 2000 }, // Double push-ups: 1000 * 2
      ],
      alt: 'Squats Exercise'
    },
    'lunges': {
      name: 'Lunges Achievement',
      exerciseName: 'lunges',
      storageKey: 'lunges_achievement_progress_v2',
      levels: [
        { level: 1, goal: 200 },  // Double squats: 100 * 2
        { level: 2, goal: 400 },  // Double squats: 200 * 2
        { level: 3, goal: 1000 }, // Double squats: 500 * 2
        { level: 4, goal: 2000 }, // Double squats: 1000 * 2
        { level: 5, goal: 4000 }, // Double squats: 2000 * 2
      ],
      alt: 'Lunges Exercise'
    },
    'wall_sit': {
      name: 'Wall Sit Achievement',
      exerciseName: 'wall sit',
      storageKey: 'wall_sit_achievement_progress_v2',
      levels: [
        { level: 1, goal: 20 },   // 20 minutes
        { level: 2, goal: 50 },   // 50 minutes
        { level: 3, goal: 90 },   // 1.5 hours = 90 minutes
        { level: 4, goal: 120 },  // 2 hours = 120 minutes
        { level: 5, goal: 180 },  // 3 hours = 180 minutes
      ],
      alt: 'Wall Sit Exercise',
      unit: 'minutes' // Special unit for wall sits
    }
  }), []);

  const PLANK_CORE_ACHIEVEMENT_CONFIGS = useMemo(() => ({
    'knee_plank': {
      name: 'Knee Plank Achievement',
      exerciseName: 'knee plank',
      storageKey: 'knee_plank_achievement_progress_v2',
      levels: [
        { level: 1, goal: 20 },   // Same as wall sit: 20 minutes
        { level: 2, goal: 50 },   // Same as wall sit: 50 minutes
        { level: 3, goal: 90 },   // Same as wall sit: 90 minutes
        { level: 4, goal: 120 },  // Same as wall sit: 120 minutes
        { level: 5, goal: 180 },  // Same as wall sit: 180 minutes
      ],
      alt: 'Knee Plank Exercise',
      unit: 'minutes'
    },
    'plank': {
      name: 'Plank Achievement',
      exerciseName: 'plank',
      storageKey: 'plank_achievement_progress_v2',
      levels: [
        { level: 1, goal: 10 },   // Half of knee plank: 20 / 2
        { level: 2, goal: 25 },   // Half of knee plank: 50 / 2
        { level: 3, goal: 45 },   // Half of knee plank: 90 / 2
        { level: 4, goal: 60 },   // Half of knee plank: 120 / 2
        { level: 5, goal: 90 },   // Half of knee plank: 180 / 2
      ],
      alt: 'Plank Exercise',
      unit: 'minutes'
    },
    'side_plank': {
      name: 'Side Plank Achievement',
      exerciseName: 'side plank',
      storageKey: 'side_plank_achievement_progress_v2',
      levels: [
        { level: 1, goal: 10 },   // Same as plank: 10 minutes
        { level: 2, goal: 25 },   // Same as plank: 25 minutes
        { level: 3, goal: 45 },   // Same as plank: 45 minutes
        { level: 4, goal: 60 },   // Same as plank: 60 minutes
        { level: 5, goal: 90 },   // Same as plank: 90 minutes
      ],
      alt: 'Side Plank Exercise',
      unit: 'minutes'
    },
    'reverse_plank': {
      name: 'Reverse Plank Achievement',
      exerciseName: 'reverse plank',
      storageKey: 'reverse_plank_achievement_progress_v2',
      levels: [
        { level: 1, goal: 5 },    // Half of plank: 10 / 2
        { level: 2, goal: 12 },   // Half of plank: 25 / 2 (rounded down)
        { level: 3, goal: 22 },   // Half of plank: 45 / 2 (rounded down)
        { level: 4, goal: 30 },   // Half of plank: 60 / 2
        { level: 5, goal: 45 },   // Half of plank: 90 / 2
      ],
      alt: 'Reverse Plank Exercise',
      unit: 'minutes'
    },
    'sit_ups': {
      name: 'Sit-ups Achievement',
      exerciseName: 'sit-ups',
      storageKey: 'sit_ups_achievement_progress_v2',
      levels: [
        { level: 1, goal: 25 },   // Same as push-ups: 25 reps
        { level: 2, goal: 50 },   // Same as push-ups: 50 reps
        { level: 3, goal: 125 },  // Same as push-ups: 125 reps
        { level: 4, goal: 250 },  // Same as push-ups: 250 reps
        { level: 5, goal: 500 },  // Same as push-ups: 500 reps
      ],
      alt: 'Sit-ups Exercise'
    },
    'straight_arm_plank': {
      name: 'Straight Arm Plank Achievement',
      exerciseName: 'straight arm plank',
      storageKey: 'straight_arm_plank_achievement_progress_v2',
      levels: [
        { level: 1, goal: 10 },   // Same as plank: 10 minutes
        { level: 2, goal: 25 },   // Same as plank: 25 minutes
        { level: 3, goal: 45 },   // Same as plank: 45 minutes
        { level: 4, goal: 60 },   // Same as plank: 60 minutes
        { level: 5, goal: 90 },   // Same as plank: 90 minutes
      ],
      alt: 'Straight Arm Plank Exercise',
      unit: 'minutes'
    },
    'straight_arm_reverse_plank': {
      name: 'Straight Arm Reverse Plank Achievement',
      exerciseName: 'straight arm reverse plank',
      storageKey: 'straight_arm_reverse_plank_achievement_progress_v2',
      levels: [
        { level: 1, goal: 3 },    // 30% less than reverse plank: 5 * 0.7 = 3.5 (rounded down)
        { level: 2, goal: 8 },    // 30% less than reverse plank: 12 * 0.7 = 8.4 (rounded down)
        { level: 3, goal: 15 },   // 30% less than reverse plank: 22 * 0.7 = 15.4 (rounded down)
        { level: 4, goal: 21 },   // 30% less than reverse plank: 30 * 0.7 = 21
        { level: 5, goal: 31 },   // 30% less than reverse plank: 45 * 0.7 = 31.5 (rounded down)
      ],
      alt: 'Straight Arm Reverse Plank Exercise',
      unit: 'minutes'
    }
  }), []);

  // Accordion state management
  const [expandedAccordions, setExpandedAccordions] = useState({
    pushups: false,
    wide_pushups: false,
    narrow_pushups: false,
    diamond_pushups: false,
    knee_pushups: false,
    jumping_jacks: false,
    burpees: false,
    high_knees: false,
    squats: false,
    lunges: false,
    wall_sit: false,
    knee_plank: false,
    plank: false,
    side_plank: false,
    reverse_plank: false,
    sit_ups: false,
    straight_arm_plank: false,
    straight_arm_reverse_plank: false
  });

  const toggleAccordion = useCallback((key) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const u = user?.email ? await getOrCreateUserByEmail(user.email, user.name) : null;
        if (u) {
          const list = await db.achievements.where({ userId: u.id }).toArray();
          setDynamic(list);
        }
      } catch {}
    })();
  }, [user?.email]);

  const achievements = [
    // Only dynamic DB-based achievements for the current user
    ...dynamic.map((a, idx) => ({
      id: 100 + idx,
      title: a.title,
      description: a.code,
      icon: a.level === 'gold' ? 'Trophy' : a.level === 'silver' ? 'Award' : 'Star',
      earned: Boolean(a.earnedAt || a.progress >= (a.target || 1)),
      color: a.level === 'gold' ? 'bg-warning' : a.level === 'silver' ? 'bg-accent' : 'bg-success',
      progress: Math.round(((a.progress || 0) / (a.target || 1)) * 100)
    }))
  ];

  const workoutStreaks = [
    { type: "Current Streak", value: user?.currentStreak || 0, unit: "days", icon: "Flame", color: "text-accent" },
    { type: "Longest Streak", value: user?.longestStreak || 0, unit: "days", icon: "Trophy", color: "text-warning" },
    { type: "This Week", value: user?.thisWeekWorkouts || 0, unit: "workouts", icon: "Calendar", color: "text-primary" },
    { type: "This Month", value: user?.thisMonthWorkouts || 0, unit: "workouts", icon: "BarChart3", color: "text-success" }
  ];


  // Memoized Achievement Badge Component to prevent unnecessary re-renders
  const AchievementBadge = React.memo(({ achievement }) => (
    <div className={`bg-card border border-border rounded-lg p-4 ${achievement?.earned ? 'shadow-elevation-2' : 'opacity-75'}`}>
      <div className="flex items-start space-x-3">
        <div className={`w-12 h-12 ${achievement?.color} rounded-full flex items-center justify-center ${achievement?.earned ? '' : 'opacity-50'}`}>
          <Icon name={achievement?.icon} size={20} color="white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-card-foreground">{achievement?.title}</h4>
            {achievement?.earned && (
              <Icon name="CheckCircle" size={16} className="text-success" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{achievement?.description}</p>
          
          {achievement?.earned ? (
            <p className="text-xs text-success font-medium">
              Earned on {new Date(achievement.earnedDate)?.toLocaleDateString()}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {achievement?.current} / {achievement?.target}
                </span>
                <span className="font-medium text-card-foreground">
                  {achievement?.progress}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${achievement?.color}`}
                  style={{ width: `${achievement?.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ));

  // Generic Accordion Achievement Component - Now uses Supabase data
  const AccordionAchievement = React.memo(({ 
    achievementKey, 
    config, 
    state, 
    setState, 
    weeklyCount, 
    currentLevel, 
    started, 
    allCompleted,
    renderLevelCard,
    renderTrophy
  }) => {
    const isExpanded = expandedAccordions[achievementKey];
    
    // Get Supabase achievement data for this exercise
    const supabaseData = supabaseAchievements.find(a => 
      a.achievement_code?.toLowerCase().replace(/_/g, ' ').includes(config.exerciseName?.toLowerCase()) ||
      a.achievement_name?.toLowerCase().includes(config.exerciseName?.toLowerCase())
    );
    
    // Use Supabase level if available, otherwise use local state
    const displayLevel = supabaseData?.level || 0;
    const totalProgress = supabaseData?.progress || 0;
    const progress = Math.min(displayLevel, config.levels.length);
    const isComplete = displayLevel >= config.levels.length;
    const hasStarted = totalProgress > 0 || started;
    
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Accordion Header */}
        <button
          className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
          onClick={() => toggleAccordion(achievementKey)}
        >
          <div className="flex items-center space-x-3">
            <div>
              <h4 className="font-semibold text-card-foreground">{config.name}</h4>
              <p className="text-sm text-muted-foreground">
                Progress: {progress}/{config.levels.length} levels
                {totalProgress > 0 && ` • ${totalProgress} ${config.unit || 'reps'}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Current level display - Now shows actual level from Supabase */}
            <div className="text-right">
              <p className="text-lg font-bold text-card-foreground">Level {displayLevel}</p>
              <p className="text-xs text-muted-foreground">
                {isComplete ? 'Complete!' : hasStarted ? 'In Progress' : 'Not Started'}
              </p>
            </div>
            <Icon 
              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
              size={20} 
              className="text-muted-foreground transition-transform"
            />
          </div>
        </button>

        {/* Accordion Content */}
        {isExpanded && (
          <div className="border-t border-border p-4">
            {!hasStarted ? (
              <div className="text-center py-4">
                <button
                  className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white"
                  style={{ backgroundColor: '#fb923c' }}
                  onClick={() => setState(s => ({ ...s, started: true }))}
                >
                  Start Achievement
                </button>
              </div>
            ) : isComplete ? (
              renderTrophy()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {config.levels.map((levelObj, idx) => {
                  let status = 'Locked';
                  if (displayLevel > idx) status = 'Completed';
                  else if (displayLevel === idx && hasStarted) status = 'In Progress';
                  
                  const levelProgress = Math.min(100, Math.round((totalProgress / levelObj.goal) * 100));
                  
                  return (
                    <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-bold text-lg">Level {levelObj.level}</span>
                        {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
                        {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
                        {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-card-foreground mb-2">
                        Complete <b>{levelObj.goal} {config.unit || 'reps'}</b> total
                      </p>
                      <div className="w-full mb-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{Math.min(totalProgress, levelObj.goal)} / {levelObj.goal}</span>
                          <span className="font-medium text-card-foreground">{levelProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${levelProgress}%` }}></div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  // --- Push-Up Achievement Flow ---
  // Shared logic for all push-up types
  const PUSHUP_LEVELS = [
    { level: 1, goal: 50 },
    { level: 2, goal: 100 },
    { level: 3, goal: 250 },
    { level: 4, goal: 500 },
    { level: 5, goal: 1000 },
  ];
  const KNEE_PUSHUP_LEVELS = [
    { level: 1, goal: 100 },
    { level: 2, goal: 200 },
    { level: 3, goal: 500 },
    { level: 4, goal: 1000 },
    { level: 5, goal: 2000 },
  ];
  const DIAMOND_PUSHUP_LEVELS = [
    { level: 1, goal: 38 },  // 25% less than 50
    { level: 2, goal: 75 },  // 25% less than 100
    { level: 3, goal: 188 }, // 25% less than 250
    { level: 4, goal: 375 }, // 25% less than 500
    { level: 5, goal: 750 }, // 25% less than 1000
  ];
  // --- Knee Push-Ups ---
  const KNEE_STORAGE_KEY = 'knee_pushup_achievement_progress_v2';
  const [kneePushupState, setKneePushupState] = useState(() => {
    try {
      const raw = localStorage.getItem(KNEE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showKneePushupCard, setShowKneePushupCard] = useState(true);
  const [weeklyKneePushups, setWeeklyKneePushups] = useState(0);

  useEffect(() => { localStorage.setItem(KNEE_STORAGE_KEY, JSON.stringify(kneePushupState)); }, [kneePushupState]);

  // Memoize week calculation function to avoid recreating on each render
  const getWeekNumber = useCallback((d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  }, []);

  // Memoize current week key to prevent unnecessary recalculations
  const currentWeekKey = useMemo(() => {
    const now = new Date();
    return Number(`${now.getFullYear()}${String(getWeekNumber(now)).padStart(2, '0')}`);
  }, [getWeekNumber]);

  // Get this week's knee push-up count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      // Use memoized week key
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'knee push ups') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyKneePushups(count);
    })();
  }, [user?.email, kneePushupState, getWeekNumber, currentWeekKey]);

  // Progress logic (knee)
  const kneeCurrentLevel = kneePushupState.currentLevel;
  const kneeStarted = kneePushupState.started;
  const kneeCompleted = kneePushupState.completed;
  const kneeNextLevel = KNEE_PUSHUP_LEVELS[kneeCurrentLevel] || null;
  const kneeAllCompleted = kneeCurrentLevel >= KNEE_PUSHUP_LEVELS.length;

  // Auto-advance level if completed (knee)
  useEffect(() => {
    if (!kneeStarted || kneeAllCompleted) return;
    if (kneeNextLevel && weeklyKneePushups >= kneeNextLevel.goal) {
      if (kneeCurrentLevel + 1 === KNEE_PUSHUP_LEVELS.length) {
        setKneePushupState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setKneePushupState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyKneePushups, kneeStarted, kneeCurrentLevel, kneeNextLevel, kneeAllCompleted]);

  // Handlers (knee)
  const handleKneeStart = () => setKneePushupState(s => ({ ...s, started: true }));
  const handleKneeClose = () => setShowKneePushupCard(false);
  const handleKneeReopen = () => setShowKneePushupCard(true);

  // UI for each level (knee)
  const renderKneeLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (kneeCurrentLevel > idx) status = 'Completed';
    else if (kneeCurrentLevel === idx && kneeStarted && !kneeAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyKneePushups / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} knee push-ups</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyKneePushups, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (knee)
  const renderKneeTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Knee Push-Up Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Main card (knee)
  const KneePushUpAchievement = React.memo(() => {
    if (!showKneePushupCard) {
      // Collapsed state: show only the header, gif, and a button to reopen
      return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center">
          <p className="text-lg font-semibold text-card-foreground mb-1">Knee Push-Up Achievement</p>
          <div className="w-full flex justify-center mt-4">
            <button
              className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleKneeReopen}
            >
              Start
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center relative">
        <p className="text-lg font-semibold text-card-foreground mb-1">Knee Push-Up Achievement</p>
        <p className="text-sm text-muted-foreground mb-2">Progress: {Math.min(kneeCurrentLevel, 5)}/5 levels</p>
        {!kneeStarted ? (
          <button
            className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white mb-2"
            style={{ backgroundColor: '#fb923c' }}
            onClick={handleKneeStart}
          >
            Start Achievement
          </button>
        ) : null}
        {kneeStarted && !kneeAllCompleted && (
          <>
            <button
              className="btn btn-xs font-semibold rounded-full px-3 py-1 shadow-md transition-colors text-white absolute top-2 right-2"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleKneeClose}
            >
              Close
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
              {KNEE_PUSHUP_LEVELS.map(renderKneeLevelCard)}
            </div>
          </>
        )}
        {kneeAllCompleted && renderKneeTrophy()}
      </div>
    );
  });

  // --- Normal Push-Ups ---
  const STORAGE_KEY = 'pushup_achievement_progress_v2';
  const [pushupState, setPushupState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showPushupCard, setShowPushupCard] = useState(true);
  const [weeklyPushups, setWeeklyPushups] = useState(0);

  // --- Wide Push-Ups ---
  const WIDE_STORAGE_KEY = 'wide_pushup_achievement_progress_v2';
  const [widePushupState, setWidePushupState] = useState(() => {
    try {
      const raw = localStorage.getItem(WIDE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showWidePushupCard, setShowWidePushupCard] = useState(true);
  const [weeklyWidePushups, setWeeklyWidePushups] = useState(0);

  // --- Narrow Push-Ups ---
  const NARROW_STORAGE_KEY = 'narrow_pushup_achievement_progress_v2';
  const [narrowPushupState, setNarrowPushupState] = useState(() => {
    try {
      const raw = localStorage.getItem(NARROW_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showNarrowPushupCard, setShowNarrowPushupCard] = useState(true);
  const [weeklyNarrowPushups, setWeeklyNarrowPushups] = useState(0);

  // --- Diamond Push-Ups ---
  const DIAMOND_STORAGE_KEY = 'diamond_pushup_achievement_progress_v2';
  const [diamondPushupState, setDiamondPushupState] = useState(() => {
    try {
      const raw = localStorage.getItem(DIAMOND_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showDiamondPushupCard, setShowDiamondPushupCard] = useState(true);
  const [weeklyDiamondPushups, setWeeklyDiamondPushups] = useState(0);

  // --- Jumping Jacks ---
  const JUMPING_JACKS_STORAGE_KEY = 'jumping_jacks_achievement_progress_v2';
  const [jumpingJacksState, setJumpingJacksState] = useState(() => {
    try {
      const raw = localStorage.getItem(JUMPING_JACKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showJumpingJacksCard, setShowJumpingJacksCard] = useState(true);
  const [weeklyJumpingJacks, setWeeklyJumpingJacks] = useState(0);

  // --- Burpees ---
  const BURPEES_STORAGE_KEY = 'burpees_achievement_progress_v2';
  const [burpeesState, setBurpeesState] = useState(() => {
    try {
      const raw = localStorage.getItem(BURPEES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showBurpeesCard, setShowBurpeesCard] = useState(true);
  const [weeklyBurpees, setWeeklyBurpees] = useState(0);

  // --- High Knees ---
  const HIGH_KNEES_STORAGE_KEY = 'high_knees_achievement_progress_v2';
  const [highKneesState, setHighKneesState] = useState(() => {
    try {
      const raw = localStorage.getItem(HIGH_KNEES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showHighKneesCard, setShowHighKneesCard] = useState(true);
  const [weeklyHighKnees, setWeeklyHighKnees] = useState(0);

  // --- Squats ---
  const SQUATS_STORAGE_KEY = 'squats_achievement_progress_v2';
  const [squatsState, setSquatsState] = useState(() => {
    try {
      const raw = localStorage.getItem(SQUATS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showSquatsCard, setShowSquatsCard] = useState(true);
  const [weeklySquats, setWeeklySquats] = useState(0);

  // --- Lunges ---
  const LUNGES_STORAGE_KEY = 'lunges_achievement_progress_v2';
  const [lungesState, setLungesState] = useState(() => {
    try {
      const raw = localStorage.getItem(LUNGES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showLungesCard, setShowLungesCard] = useState(true);
  const [weeklyLunges, setWeeklyLunges] = useState(0);

  // --- Wall Sit ---
  const WALL_SIT_STORAGE_KEY = 'wall_sit_achievement_progress_v2';
  const [wallSitState, setWallSitState] = useState(() => {
    try {
      const raw = localStorage.getItem(WALL_SIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showWallSitCard, setShowWallSitCard] = useState(true);
  const [weeklyWallSit, setWeeklyWallSit] = useState(0);

  // --- Knee Plank ---
  const KNEE_PLANK_STORAGE_KEY = 'knee_plank_achievement_progress_v2';
  const [kneePlankState, setKneePlankState] = useState(() => {
    try {
      const raw = localStorage.getItem(KNEE_PLANK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showKneePlankCard, setShowKneePlankCard] = useState(true);
  const [weeklyKneePlank, setWeeklyKneePlank] = useState(0);

  // --- Plank ---
  const PLANK_STORAGE_KEY = 'plank_achievement_progress_v2';
  const [plankState, setPlankState] = useState(() => {
    try {
      const raw = localStorage.getItem(PLANK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showPlankCard, setShowPlankCard] = useState(true);
  const [weeklyPlank, setWeeklyPlank] = useState(0);

  // --- Side Plank ---
  const SIDE_PLANK_STORAGE_KEY = 'side_plank_achievement_progress_v2';
  const [sidePlankState, setSidePlankState] = useState(() => {
    try {
      const raw = localStorage.getItem(SIDE_PLANK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showSidePlankCard, setShowSidePlankCard] = useState(true);
  const [weeklySidePlank, setWeeklySidePlank] = useState(0);

  // --- Reverse Plank ---
  const REVERSE_PLANK_STORAGE_KEY = 'reverse_plank_achievement_progress_v2';
  const [reversePlankState, setReversePlankState] = useState(() => {
    try {
      const raw = localStorage.getItem(REVERSE_PLANK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showReversePlankCard, setShowReversePlankCard] = useState(true);
  const [weeklyReversePlank, setWeeklyReversePlank] = useState(0);

  // --- Sit-ups ---
  const SIT_UPS_STORAGE_KEY = 'sit_ups_achievement_progress_v2';
  const [sitUpsState, setSitUpsState] = useState(() => {
    try {
      const raw = localStorage.getItem(SIT_UPS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showSitUpsCard, setShowSitUpsCard] = useState(true);
  const [weeklySitUps, setWeeklySitUps] = useState(0);

  // --- Straight Arm Plank ---
  const STRAIGHT_ARM_PLANK_STORAGE_KEY = 'straight_arm_plank_achievement_progress_v2';
  const [straightArmPlankState, setStraightArmPlankState] = useState(() => {
    try {
      const raw = localStorage.getItem(STRAIGHT_ARM_PLANK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showStraightArmPlankCard, setShowStraightArmPlankCard] = useState(true);
  const [weeklyStraightArmPlank, setWeeklyStraightArmPlank] = useState(0);

  // --- Straight Arm Reverse Plank ---
  const STRAIGHT_ARM_REVERSE_PLANK_STORAGE_KEY = 'straight_arm_reverse_plank_achievement_progress_v2';
  const [straightArmReversePlankState, setStraightArmReversePlankState] = useState(() => {
    try {
      const raw = localStorage.getItem(STRAIGHT_ARM_REVERSE_PLANK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : { started: false, completed: false, currentLevel: 0 };
    } catch {
      return { started: false, completed: false, currentLevel: 0 };
    }
  });
  const [showStraightArmReversePlankCard, setShowStraightArmReversePlankCard] = useState(true);
  const [weeklyStraightArmReversePlank, setWeeklyStraightArmReversePlank] = useState(0);

  // Save state to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pushupState)); }, [pushupState]);
  useEffect(() => { localStorage.setItem(WIDE_STORAGE_KEY, JSON.stringify(widePushupState)); }, [widePushupState]);
  useEffect(() => { localStorage.setItem(NARROW_STORAGE_KEY, JSON.stringify(narrowPushupState)); }, [narrowPushupState]);
  useEffect(() => { localStorage.setItem(DIAMOND_STORAGE_KEY, JSON.stringify(diamondPushupState)); }, [diamondPushupState]);
  useEffect(() => { localStorage.setItem(JUMPING_JACKS_STORAGE_KEY, JSON.stringify(jumpingJacksState)); }, [jumpingJacksState]);
  useEffect(() => { localStorage.setItem(BURPEES_STORAGE_KEY, JSON.stringify(burpeesState)); }, [burpeesState]);
  useEffect(() => { localStorage.setItem(HIGH_KNEES_STORAGE_KEY, JSON.stringify(highKneesState)); }, [highKneesState]);
  useEffect(() => { localStorage.setItem(SQUATS_STORAGE_KEY, JSON.stringify(squatsState)); }, [squatsState]);
  useEffect(() => { localStorage.setItem(LUNGES_STORAGE_KEY, JSON.stringify(lungesState)); }, [lungesState]);
  useEffect(() => { localStorage.setItem(WALL_SIT_STORAGE_KEY, JSON.stringify(wallSitState)); }, [wallSitState]);
  useEffect(() => { localStorage.setItem(KNEE_PLANK_STORAGE_KEY, JSON.stringify(kneePlankState)); }, [kneePlankState]);
  useEffect(() => { localStorage.setItem(PLANK_STORAGE_KEY, JSON.stringify(plankState)); }, [plankState]);
  useEffect(() => { localStorage.setItem(SIDE_PLANK_STORAGE_KEY, JSON.stringify(sidePlankState)); }, [sidePlankState]);
  useEffect(() => { localStorage.setItem(REVERSE_PLANK_STORAGE_KEY, JSON.stringify(reversePlankState)); }, [reversePlankState]);
  useEffect(() => { localStorage.setItem(SIT_UPS_STORAGE_KEY, JSON.stringify(sitUpsState)); }, [sitUpsState]);
  useEffect(() => { localStorage.setItem(STRAIGHT_ARM_PLANK_STORAGE_KEY, JSON.stringify(straightArmPlankState)); }, [straightArmPlankState]);
  useEffect(() => { localStorage.setItem(STRAIGHT_ARM_REVERSE_PLANK_STORAGE_KEY, JSON.stringify(straightArmReversePlankState)); }, [straightArmReversePlankState]);

  // Get this week's push-up count from stats (normal)
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'push-ups') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyPushups(count);
    })();
  }, [user?.email, pushupState, getWeekNumber, currentWeekKey]);

  // Get this week's wide push-up count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'wide push ups') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyWidePushups(count);
    })();
  }, [user?.email, widePushupState, getWeekNumber, currentWeekKey]);

  // Get this week's narrow push-up count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'narrow push ups') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyNarrowPushups(count);
    })();
  }, [user?.email, narrowPushupState, getWeekNumber, currentWeekKey]);

  // Get this week's diamond push-up count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'diamond push ups') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyDiamondPushups(count);
    })();
  }, [user?.email, diamondPushupState, getWeekNumber, currentWeekKey]);

  // Get this week's jumping jacks count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'jumping jacks') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyJumpingJacks(count);
    })();
  }, [user?.email, jumpingJacksState, getWeekNumber, currentWeekKey]);

  // Get this week's burpees count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'burpees') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyBurpees(count);
    })();
  }, [user?.email, burpeesState, getWeekNumber, currentWeekKey]);

  // Get this week's high knees count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'high knees') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyHighKnees(count);
    })();
  }, [user?.email, highKneesState, getWeekNumber, currentWeekKey]);

  // Get this week's squats count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'squats') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklySquats(count);
    })();
  }, [user?.email, squatsState, getWeekNumber, currentWeekKey]);

  // Get this week's lunges count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'lunges') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklyLunges(count);
    })();
  }, [user?.email, lungesState, getWeekNumber, currentWeekKey]);

  // Get this week's wall sit duration from stats (in minutes)
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'wall sit') {
              // Convert duration from seconds to minutes and multiply by sets
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklyWallSit(totalMinutes);
    })();
  }, [user?.email, wallSitState, getWeekNumber, currentWeekKey]);

  // Get this week's knee plank count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'knee plank') {
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklyKneePlank(totalMinutes);
    })();
  }, [user?.email, kneePlankState, getWeekNumber, currentWeekKey]);

  // Get this week's plank count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'plank') {
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklyPlank(totalMinutes);
    })();
  }, [user?.email, plankState, getWeekNumber, currentWeekKey]);

  // Get this week's side plank count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'side plank') {
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklySidePlank(totalMinutes);
    })();
  }, [user?.email, sidePlankState, getWeekNumber, currentWeekKey]);

  // Get this week's reverse plank count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'reverse plank') {
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklyReversePlank(totalMinutes);
    })();
  }, [user?.email, reversePlankState, getWeekNumber, currentWeekKey]);

  // Get this week's sit-ups count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let count = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'sit-ups') {
              count += Number(item.reps || 0) * Number(item.sets || 1);
            }
          }
        }
      }
      setWeeklySitUps(count);
    })();
  }, [user?.email, sitUpsState, getWeekNumber, currentWeekKey]);

  // Get this week's straight arm plank count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'straight arm plank') {
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklyStraightArmPlank(totalMinutes);
    })();
  }, [user?.email, straightArmPlankState, getWeekNumber, currentWeekKey]);

  // Get this week's straight arm reverse plank count from stats
  useEffect(() => {
    (async () => {
      if (!user?.email) return;
      const u = await getOrCreateUserByEmail(user.email, user.name);
      const sessions = await db.sessions.where({ userId: u.id }).toArray();
      let totalMinutes = 0;
      for (const s of sessions) {
        const d = new Date(s.dateISO);
        const wk = Number(`${d.getFullYear()}${String(getWeekNumber(d)).padStart(2, '0')}`);
        if (wk === currentWeekKey) {
          for (const item of s.items) {
            if (item.name && item.name.toLowerCase() === 'straight arm reverse plank') {
              const durationMinutes = Math.round((Number(item.durationSec || 0) / 60) * Number(item.sets || 1));
              totalMinutes += durationMinutes;
            }
          }
        }
      }
      setWeeklyStraightArmReversePlank(totalMinutes);
    })();
  }, [user?.email, straightArmReversePlankState, getWeekNumber, currentWeekKey]);

  // Progress logic (normal)
  const currentLevel = pushupState.currentLevel;
  const started = pushupState.started;
  const completed = pushupState.completed;
  const nextLevel = PUSHUP_LEVELS[currentLevel] || null;
  const allCompleted = currentLevel >= PUSHUP_LEVELS.length;

  // Progress logic (wide)
  const wideCurrentLevel = widePushupState.currentLevel;
  const wideStarted = widePushupState.started;
  const wideCompleted = widePushupState.completed;
  const wideNextLevel = PUSHUP_LEVELS[wideCurrentLevel] || null;
  const wideAllCompleted = wideCurrentLevel >= PUSHUP_LEVELS.length;

  // Progress logic (narrow)
  const narrowCurrentLevel = narrowPushupState.currentLevel;
  const narrowStarted = narrowPushupState.started;
  const narrowCompleted = narrowPushupState.completed;
  const narrowNextLevel = PUSHUP_LEVELS[narrowCurrentLevel] || null;
  const narrowAllCompleted = narrowCurrentLevel >= PUSHUP_LEVELS.length;

  // Progress logic (diamond)
  const diamondCurrentLevel = diamondPushupState.currentLevel;
  const diamondStarted = diamondPushupState.started;
  const diamondCompleted = diamondPushupState.completed;
  const diamondNextLevel = DIAMOND_PUSHUP_LEVELS[diamondCurrentLevel] || null;
  const diamondAllCompleted = diamondCurrentLevel >= DIAMOND_PUSHUP_LEVELS.length;

  // Progress logic (jumping jacks)
  const jumpingJacksCurrentLevel = jumpingJacksState.currentLevel;
  const jumpingJacksStarted = jumpingJacksState.started;
  const jumpingJacksCompleted = jumpingJacksState.completed;
  const jumpingJacksNextLevel = CARDIO_ACHIEVEMENT_CONFIGS.jumping_jacks.levels[jumpingJacksCurrentLevel] || null;
  const jumpingJacksAllCompleted = jumpingJacksCurrentLevel >= CARDIO_ACHIEVEMENT_CONFIGS.jumping_jacks.levels.length;

  // Progress logic (burpees)
  const burpeesCurrentLevel = burpeesState.currentLevel;
  const burpeesStarted = burpeesState.started;
  const burpeesCompleted = burpeesState.completed;
  const burpeesNextLevel = CARDIO_ACHIEVEMENT_CONFIGS.burpees.levels[burpeesCurrentLevel] || null;
  const burpeesAllCompleted = burpeesCurrentLevel >= CARDIO_ACHIEVEMENT_CONFIGS.burpees.levels.length;

  // Progress logic (high knees)
  const highKneesCurrentLevel = highKneesState.currentLevel;
  const highKneesStarted = highKneesState.started;
  const highKneesCompleted = highKneesState.completed;
  const highKneesNextLevel = CARDIO_ACHIEVEMENT_CONFIGS.high_knees.levels[highKneesCurrentLevel] || null;
  const highKneesAllCompleted = highKneesCurrentLevel >= CARDIO_ACHIEVEMENT_CONFIGS.high_knees.levels.length;

  // Progress logic (squats)
  const squatsCurrentLevel = squatsState.currentLevel;
  const squatsStarted = squatsState.started;
  const squatsCompleted = squatsState.completed;
  const squatsNextLevel = LOWER_BODY_ACHIEVEMENT_CONFIGS.squats.levels[squatsCurrentLevel] || null;
  const squatsAllCompleted = squatsCurrentLevel >= LOWER_BODY_ACHIEVEMENT_CONFIGS.squats.levels.length;

  // Progress logic (lunges)
  const lungesCurrentLevel = lungesState.currentLevel;
  const lungesStarted = lungesState.started;
  const lungesCompleted = lungesState.completed;
  const lungesNextLevel = LOWER_BODY_ACHIEVEMENT_CONFIGS.lunges.levels[lungesCurrentLevel] || null;
  const lungesAllCompleted = lungesCurrentLevel >= LOWER_BODY_ACHIEVEMENT_CONFIGS.lunges.levels.length;

  // Progress logic (wall sit)
  const wallSitCurrentLevel = wallSitState.currentLevel;
  const wallSitStarted = wallSitState.started;
  const wallSitCompleted = wallSitState.completed;
  const wallSitNextLevel = LOWER_BODY_ACHIEVEMENT_CONFIGS.wall_sit.levels[wallSitCurrentLevel] || null;
  const wallSitAllCompleted = wallSitCurrentLevel >= LOWER_BODY_ACHIEVEMENT_CONFIGS.wall_sit.levels.length;

  // Progress logic (knee plank)
  const kneePlankCurrentLevel = kneePlankState.currentLevel;
  const kneePlankStarted = kneePlankState.started;
  const kneePlankCompleted = kneePlankState.completed;
  const kneePlankNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.knee_plank.levels[kneePlankCurrentLevel] || null;
  const kneePlankAllCompleted = kneePlankCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.knee_plank.levels.length;

  // Progress logic (plank)
  const plankCurrentLevel = plankState.currentLevel;
  const plankStarted = plankState.started;
  const plankCompleted = plankState.completed;
  const plankNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.plank.levels[plankCurrentLevel] || null;
  const plankAllCompleted = plankCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.plank.levels.length;

  // Progress logic (side plank)
  const sidePlankCurrentLevel = sidePlankState.currentLevel;
  const sidePlankStarted = sidePlankState.started;
  const sidePlankCompleted = sidePlankState.completed;
  const sidePlankNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.side_plank.levels[sidePlankCurrentLevel] || null;
  const sidePlankAllCompleted = sidePlankCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.side_plank.levels.length;

  // Progress logic (reverse plank)
  const reversePlankCurrentLevel = reversePlankState.currentLevel;
  const reversePlankStarted = reversePlankState.started;
  const reversePlankCompleted = reversePlankState.completed;
  const reversePlankNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.reverse_plank.levels[reversePlankCurrentLevel] || null;
  const reversePlankAllCompleted = reversePlankCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.reverse_plank.levels.length;

  // Progress logic (sit-ups)
  const sitUpsCurrentLevel = sitUpsState.currentLevel;
  const sitUpsStarted = sitUpsState.started;
  const sitUpsCompleted = sitUpsState.completed;
  const sitUpsNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.sit_ups.levels[sitUpsCurrentLevel] || null;
  const sitUpsAllCompleted = sitUpsCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.sit_ups.levels.length;

  // Progress logic (straight arm plank)
  const straightArmPlankCurrentLevel = straightArmPlankState.currentLevel;
  const straightArmPlankStarted = straightArmPlankState.started;
  const straightArmPlankCompleted = straightArmPlankState.completed;
  const straightArmPlankNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_plank.levels[straightArmPlankCurrentLevel] || null;
  const straightArmPlankAllCompleted = straightArmPlankCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_plank.levels.length;

  // Progress logic (straight arm reverse plank)
  const straightArmReversePlankCurrentLevel = straightArmReversePlankState.currentLevel;
  const straightArmReversePlankStarted = straightArmReversePlankState.started;
  const straightArmReversePlankCompleted = straightArmReversePlankState.completed;
  const straightArmReversePlankNextLevel = PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_reverse_plank.levels[straightArmReversePlankCurrentLevel] || null;
  const straightArmReversePlankAllCompleted = straightArmReversePlankCurrentLevel >= PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_reverse_plank.levels.length;

  // Auto-advance level if completed (normal)
  useEffect(() => {
    if (!started || allCompleted) return;
    if (nextLevel && weeklyPushups >= nextLevel.goal) {
      if (currentLevel + 1 === PUSHUP_LEVELS.length) {
        setPushupState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setPushupState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyPushups, started, currentLevel, nextLevel, allCompleted]);

  // Auto-advance level if completed (wide)
  useEffect(() => {
    if (!wideStarted || wideAllCompleted) return;
    if (wideNextLevel && weeklyWidePushups >= wideNextLevel.goal) {
      if (wideCurrentLevel + 1 === PUSHUP_LEVELS.length) {
        setWidePushupState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setWidePushupState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyWidePushups, wideStarted, wideCurrentLevel, wideNextLevel, wideAllCompleted]);

  // Auto-advance level if completed (narrow)
  useEffect(() => {
    if (!narrowStarted || narrowAllCompleted) return;
    if (narrowNextLevel && weeklyNarrowPushups >= narrowNextLevel.goal) {
      if (narrowCurrentLevel + 1 === PUSHUP_LEVELS.length) {
        setNarrowPushupState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setNarrowPushupState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyNarrowPushups, narrowStarted, narrowCurrentLevel, narrowNextLevel, narrowAllCompleted]);

  // Auto-advance level if completed (diamond)
  useEffect(() => {
    if (!diamondStarted || diamondAllCompleted) return;
    if (diamondNextLevel && weeklyDiamondPushups >= diamondNextLevel.goal) {
      if (diamondCurrentLevel + 1 === DIAMOND_PUSHUP_LEVELS.length) {
        setDiamondPushupState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setDiamondPushupState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyDiamondPushups, diamondStarted, diamondCurrentLevel, diamondNextLevel, diamondAllCompleted]);

  // Auto-advance level if completed (jumping jacks)
  useEffect(() => {
    if (!jumpingJacksStarted || jumpingJacksAllCompleted) return;
    if (jumpingJacksNextLevel && weeklyJumpingJacks >= jumpingJacksNextLevel.goal) {
      if (jumpingJacksCurrentLevel + 1 === CARDIO_ACHIEVEMENT_CONFIGS.jumping_jacks.levels.length) {
        setJumpingJacksState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setJumpingJacksState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyJumpingJacks, jumpingJacksStarted, jumpingJacksCurrentLevel, jumpingJacksNextLevel, jumpingJacksAllCompleted]);

  // Auto-advance level if completed (burpees)
  useEffect(() => {
    if (!burpeesStarted || burpeesAllCompleted) return;
    if (burpeesNextLevel && weeklyBurpees >= burpeesNextLevel.goal) {
      if (burpeesCurrentLevel + 1 === CARDIO_ACHIEVEMENT_CONFIGS.burpees.levels.length) {
        setBurpeesState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setBurpeesState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyBurpees, burpeesStarted, burpeesCurrentLevel, burpeesNextLevel, burpeesAllCompleted]);

  // Auto-advance level if completed (high knees)
  useEffect(() => {
    if (!highKneesStarted || highKneesAllCompleted) return;
    if (highKneesNextLevel && weeklyHighKnees >= highKneesNextLevel.goal) {
      if (highKneesCurrentLevel + 1 === CARDIO_ACHIEVEMENT_CONFIGS.high_knees.levels.length) {
        setHighKneesState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setHighKneesState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyHighKnees, highKneesStarted, highKneesCurrentLevel, highKneesNextLevel, highKneesAllCompleted]);

  // Auto-advance level if completed (squats)
  useEffect(() => {
    if (!squatsStarted || squatsAllCompleted) return;
    if (squatsNextLevel && weeklySquats >= squatsNextLevel.goal) {
      if (squatsCurrentLevel + 1 === LOWER_BODY_ACHIEVEMENT_CONFIGS.squats.levels.length) {
        setSquatsState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setSquatsState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklySquats, squatsStarted, squatsCurrentLevel, squatsNextLevel, squatsAllCompleted]);

  // Auto-advance level if completed (lunges)
  useEffect(() => {
    if (!lungesStarted || lungesAllCompleted) return;
    if (lungesNextLevel && weeklyLunges >= lungesNextLevel.goal) {
      if (lungesCurrentLevel + 1 === LOWER_BODY_ACHIEVEMENT_CONFIGS.lunges.levels.length) {
        setLungesState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setLungesState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyLunges, lungesStarted, lungesCurrentLevel, lungesNextLevel, lungesAllCompleted]);

  // Auto-advance level if completed (wall sit)
  useEffect(() => {
    if (!wallSitStarted || wallSitAllCompleted) return;
    if (wallSitNextLevel && weeklyWallSit >= wallSitNextLevel.goal) {
      if (wallSitCurrentLevel + 1 === LOWER_BODY_ACHIEVEMENT_CONFIGS.wall_sit.levels.length) {
        setWallSitState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setWallSitState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyWallSit, wallSitStarted, wallSitCurrentLevel, wallSitNextLevel, wallSitAllCompleted]);

  // Auto-advance level if completed (knee plank)
  useEffect(() => {
    if (!kneePlankStarted || kneePlankAllCompleted) return;
    if (kneePlankNextLevel && weeklyKneePlank >= kneePlankNextLevel.goal) {
      if (kneePlankCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.knee_plank.levels.length) {
        setKneePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setKneePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyKneePlank, kneePlankStarted, kneePlankCurrentLevel, kneePlankNextLevel, kneePlankAllCompleted]);

  // Auto-advance level if completed (plank)
  useEffect(() => {
    if (!plankStarted || plankAllCompleted) return;
    if (plankNextLevel && weeklyPlank >= plankNextLevel.goal) {
      if (plankCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.plank.levels.length) {
        setPlankState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setPlankState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyPlank, plankStarted, plankCurrentLevel, plankNextLevel, plankAllCompleted]);

  // Auto-advance level if completed (side plank)
  useEffect(() => {
    if (!sidePlankStarted || sidePlankAllCompleted) return;
    if (sidePlankNextLevel && weeklySidePlank >= sidePlankNextLevel.goal) {
      if (sidePlankCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.side_plank.levels.length) {
        setSidePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setSidePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklySidePlank, sidePlankStarted, sidePlankCurrentLevel, sidePlankNextLevel, sidePlankAllCompleted]);

  // Auto-advance level if completed (reverse plank)
  useEffect(() => {
    if (!reversePlankStarted || reversePlankAllCompleted) return;
    if (reversePlankNextLevel && weeklyReversePlank >= reversePlankNextLevel.goal) {
      if (reversePlankCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.reverse_plank.levels.length) {
        setReversePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setReversePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyReversePlank, reversePlankStarted, reversePlankCurrentLevel, reversePlankNextLevel, reversePlankAllCompleted]);

  // Auto-advance level if completed (sit-ups)
  useEffect(() => {
    if (!sitUpsStarted || sitUpsAllCompleted) return;
    if (sitUpsNextLevel && weeklySitUps >= sitUpsNextLevel.goal) {
      if (sitUpsCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.sit_ups.levels.length) {
        setSitUpsState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setSitUpsState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklySitUps, sitUpsStarted, sitUpsCurrentLevel, sitUpsNextLevel, sitUpsAllCompleted]);

  // Auto-advance level if completed (straight arm plank)
  useEffect(() => {
    if (!straightArmPlankStarted || straightArmPlankAllCompleted) return;
    if (straightArmPlankNextLevel && weeklyStraightArmPlank >= straightArmPlankNextLevel.goal) {
      if (straightArmPlankCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_plank.levels.length) {
        setStraightArmPlankState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setStraightArmPlankState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyStraightArmPlank, straightArmPlankStarted, straightArmPlankCurrentLevel, straightArmPlankNextLevel, straightArmPlankAllCompleted]);

  // Auto-advance level if completed (straight arm reverse plank)
  useEffect(() => {
    if (!straightArmReversePlankStarted || straightArmReversePlankAllCompleted) return;
    if (straightArmReversePlankNextLevel && weeklyStraightArmReversePlank >= straightArmReversePlankNextLevel.goal) {
      if (straightArmReversePlankCurrentLevel + 1 === PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_reverse_plank.levels.length) {
        setStraightArmReversePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1, completed: true }));
      } else {
        setStraightArmReversePlankState(s => ({ ...s, currentLevel: s.currentLevel + 1 }));
      }
    }
  }, [weeklyStraightArmReversePlank, straightArmReversePlankStarted, straightArmReversePlankCurrentLevel, straightArmReversePlankNextLevel, straightArmReversePlankAllCompleted]);

  // Handlers (normal)
  const handleStart = () => setPushupState(s => ({ ...s, started: true }));
  const handleClose = () => setShowPushupCard(false);
  const handleReopen = () => setShowPushupCard(true);

  // Handlers (wide)
  const handleWideStart = () => setWidePushupState(s => ({ ...s, started: true }));
  const handleWideClose = () => setShowWidePushupCard(false);
  const handleWideReopen = () => setShowWidePushupCard(true);

  // Handlers (narrow)
  const handleNarrowStart = () => setNarrowPushupState(s => ({ ...s, started: true }));
  const handleNarrowClose = () => setShowNarrowPushupCard(false);
  const handleNarrowReopen = () => setShowNarrowPushupCard(true);

  // Handlers (diamond)
  const handleDiamondStart = () => setDiamondPushupState(s => ({ ...s, started: true }));
  const handleDiamondClose = () => setShowDiamondPushupCard(false);
  const handleDiamondReopen = () => setShowDiamondPushupCard(true);

  // UI for each level (normal)
  const renderLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (currentLevel > idx) status = 'Completed';
    else if (currentLevel === idx && started && !allCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyPushups / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} push-ups</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyPushups, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // UI for each level (wide)
  const renderWideLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (wideCurrentLevel > idx) status = 'Completed';
    else if (wideCurrentLevel === idx && wideStarted && !wideAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyWidePushups / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} wide push-ups</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyWidePushups, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // UI for each level (narrow)
  const renderNarrowLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (narrowCurrentLevel > idx) status = 'Completed';
    else if (narrowCurrentLevel === idx && narrowStarted && !narrowAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyNarrowPushups / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} narrow push-ups</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyNarrowPushups, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // UI for each level (diamond)
  const renderDiamondLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (diamondCurrentLevel > idx) status = 'Completed';
    else if (diamondCurrentLevel === idx && diamondStarted && !diamondAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyDiamondPushups / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} diamond push-ups</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyDiamondPushups, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (normal)
  const renderTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Push-Up Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Trophy for full completion (wide)
  const renderWideTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Wide Push-Up Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Trophy for full completion (narrow)
  const renderNarrowTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Narrow Push-Up Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Trophy for full completion (diamond)
  const renderDiamondTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Diamond Push-Up Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // UI for each level (jumping jacks)
  const renderJumpingJacksLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (jumpingJacksCurrentLevel > idx) status = 'Completed';
    else if (jumpingJacksCurrentLevel === idx && jumpingJacksStarted && !jumpingJacksAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyJumpingJacks / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} jumping jacks</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyJumpingJacks, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // UI for each level (burpees)
  const renderBurpeesLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (burpeesCurrentLevel > idx) status = 'Completed';
    else if (burpeesCurrentLevel === idx && burpeesStarted && !burpeesAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyBurpees / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} burpees</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyBurpees, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (jumping jacks)
  const renderJumpingJacksTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Jumping Jacks Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Trophy for full completion (burpees)
  const renderBurpeesTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Burpees Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // UI for each level (high knees)
  const renderHighKneesLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (highKneesCurrentLevel > idx) status = 'Completed';
    else if (highKneesCurrentLevel === idx && highKneesStarted && !highKneesAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyHighKnees / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} high knees</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyHighKnees, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (high knees)
  const renderHighKneesTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">High Knees Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // UI for each level (squats)
  const renderSquatsLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (squatsCurrentLevel > idx) status = 'Completed';
    else if (squatsCurrentLevel === idx && squatsStarted && !squatsAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklySquats / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} squats</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklySquats, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // UI for each level (lunges)
  const renderLungesLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (lungesCurrentLevel > idx) status = 'Completed';
    else if (lungesCurrentLevel === idx && lungesStarted && !lungesAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyLunges / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} lunges</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyLunges, levelObj.goal)} / {levelObj.goal}</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // UI for each level (wall sit) - uses minutes instead of reps
  const renderWallSitLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (wallSitCurrentLevel > idx) status = 'Completed';
    else if (wallSitCurrentLevel === idx && wallSitStarted && !wallSitAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyWallSit / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of wall sit in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyWallSit, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (squats)
  const renderSquatsTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Squats Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Trophy for full completion (lunges)
  const renderLungesTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Lunges Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Trophy for full completion (wall sit)
  const renderWallSitTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Wall Sit Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (knee plank)
  const renderKneePlankLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (kneePlankCurrentLevel > idx) status = 'Completed';
    else if (kneePlankCurrentLevel === idx && kneePlankStarted && !kneePlankAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyKneePlank / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of knee plank in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyKneePlank, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (knee plank)
  const renderKneePlankTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Knee Plank Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (plank)
  const renderPlankLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (plankCurrentLevel > idx) status = 'Completed';
    else if (plankCurrentLevel === idx && plankStarted && !plankAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyPlank / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of plank in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyPlank, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (plank)
  const renderPlankTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Plank Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (side plank)
  const renderSidePlankLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (sidePlankCurrentLevel > idx) status = 'Completed';
    else if (sidePlankCurrentLevel === idx && sidePlankStarted && !sidePlankAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklySidePlank / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of side plank in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklySidePlank, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (side plank)
  const renderSidePlankTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Side Plank Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (reverse plank)
  const renderReversePlankLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (reversePlankCurrentLevel > idx) status = 'Completed';
    else if (reversePlankCurrentLevel === idx && reversePlankStarted && !reversePlankAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyReversePlank / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of reverse plank in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyReversePlank, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (reverse plank)
  const renderReversePlankTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Reverse Plank Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (sit-ups)
  const renderSitUpsLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (sitUpsCurrentLevel > idx) status = 'Completed';
    else if (sitUpsCurrentLevel === idx && sitUpsStarted && !sitUpsAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklySitUps / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} sit-ups</b> in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklySitUps, levelObj.goal)} / {levelObj.goal} reps</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (sit-ups)
  const renderSitUpsTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Sit-ups Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (straight arm plank)
  const renderStraightArmPlankLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (straightArmPlankCurrentLevel > idx) status = 'Completed';
    else if (straightArmPlankCurrentLevel === idx && straightArmPlankStarted && !straightArmPlankAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyStraightArmPlank / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of straight arm plank in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyStraightArmPlank, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (straight arm plank)
  const renderStraightArmPlankTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Straight Arm Plank Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Render level card (straight arm reverse plank)
  const renderStraightArmReversePlankLevelCard = (levelObj, idx) => {
    let status = 'Locked';
    if (straightArmReversePlankCurrentLevel > idx) status = 'Completed';
    else if (straightArmReversePlankCurrentLevel === idx && straightArmReversePlankStarted && !straightArmReversePlankAllCompleted) status = 'In Progress';
    const progress = Math.min(100, Math.round((weeklyStraightArmReversePlank / levelObj.goal) * 100));
    return (
      <div key={levelObj.level} className={`bg-card border border-border rounded-lg p-4 flex flex-col items-center ${status === 'Completed' ? 'shadow-elevation-2' : status === 'Locked' ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-lg">Level {levelObj.level}</span>
          {status === 'Completed' && <Icon name="CheckCircle" size={18} className="text-success animate-bounce" />}
          {status === 'In Progress' && <Icon name="Loader" size={18} className="text-primary animate-spin" />}
          {status === 'Locked' && <Icon name="Lock" size={18} className="text-muted-foreground" />}
        </div>
        <p className="text-sm text-card-foreground mb-2">Complete <b>{levelObj.goal} minutes</b> of straight arm reverse plank in one week</p>
        <div className="w-full mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{Math.min(weeklyStraightArmReversePlank, levelObj.goal)} / {levelObj.goal} min</span>
            <span className="font-medium text-card-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-success' : status === 'In Progress' ? 'bg-primary' : 'bg-muted-foreground'}`} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={`text-xs font-semibold ${status === 'Completed' ? 'text-success' : status === 'In Progress' ? 'text-primary' : 'text-muted-foreground'}`}>{status}</span>
      </div>
    );
  };

  // Trophy for full completion (straight arm reverse plank)
  const renderStraightArmReversePlankTrophy = () => (
    <div className="flex flex-col items-center justify-center mt-4">
      <span className="relative inline-block">
        <Icon name="Trophy" size={48} className="text-warning animate-pulse drop-shadow-lg" />
        <span className="absolute -top-2 -right-2 animate-ping inline-flex h-4 w-4 rounded-full bg-warning opacity-75"></span>
      </span>
      <p className="mt-2 text-lg font-bold text-warning">Straight Arm Reverse Plank Achievement Complete!</p>
      <p className="text-sm text-muted-foreground">All 5 levels completed <span role="img" aria-label="trophy">🏆</span></p>
    </div>
  );

  // Memoized achievement components to prevent unnecessary re-renders
  const PushUpAchievement = React.memo(() => {
    if (!showPushupCard) {
      // Collapsed state: show only the header, gif, and a button to reopen
      return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center">
          <p className="text-lg font-semibold text-card-foreground mb-1">Push-Up Achievement</p>
          <div className="w-full flex justify-center mt-4">
            <button
              className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleReopen}
            >
              Start
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center relative">
        <p className="text-lg font-semibold text-card-foreground mb-1">Push-Up Achievement</p>
        <p className="text-sm text-muted-foreground mb-2">Progress: {Math.min(currentLevel, 5)}/5 levels</p>
        {!started ? (
          <button
            className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white mb-2"
            style={{ backgroundColor: '#fb923c' }}
            onClick={handleStart}
          >
            Start Achievement
          </button>
        ) : null}
        {started && !allCompleted && (
          <>
            <button
              className="btn btn-xs font-semibold rounded-full px-3 py-1 shadow-md transition-colors text-white absolute top-2 right-2"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleClose}
            >
              Close
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
              {PUSHUP_LEVELS.map(renderLevelCard)}
            </div>
          </>
        )}
        {allCompleted && renderTrophy()}
      </div>
    );
  });

  // Main card (wide)
  const WidePushUpAchievement = React.memo(() => {
    if (!showWidePushupCard) {
      // Collapsed state: show only the header, gif, and a button to reopen
      return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center">
          <p className="text-lg font-semibold text-card-foreground mb-1">Wide Push-Up Achievement</p>
          <div className="w-full flex justify-center mt-4">
            <button
              className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleWideReopen}
            >
              Start
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center relative">
        <p className="text-lg font-semibold text-card-foreground mb-1">Wide Push-Up Achievement</p>
        <p className="text-sm text-muted-foreground mb-2">Progress: {Math.min(wideCurrentLevel, 5)}/5 levels</p>
        {!wideStarted ? (
          <button
            className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white mb-2"
            style={{ backgroundColor: '#fb923c' }}
            onClick={handleWideStart}
          >
            Start Achievement
          </button>
        ) : null}
        {wideStarted && !wideAllCompleted && (
          <>
            <button
              className="btn btn-xs font-semibold rounded-full px-3 py-1 shadow-md transition-colors text-white absolute top-2 right-2"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleWideClose}
            >
              Close
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
              {PUSHUP_LEVELS.map(renderWideLevelCard)}
            </div>
          </>
        )}
        {wideAllCompleted && renderWideTrophy()}
      </div>
    );
  });

  // Main card (narrow)
  const NarrowPushUpAchievement = React.memo(() => {
    if (!showNarrowPushupCard) {
      // Collapsed state: show only the header, gif, and a button to reopen
      return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center">
          <p className="text-lg font-semibold text-card-foreground mb-1">Narrow Push-Up Achievement</p>
          <div className="w-full flex justify-center mt-4">
            <button
              className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleNarrowReopen}
            >
              Start
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center relative">
        <p className="text-lg font-semibold text-card-foreground mb-1">Narrow Push-Up Achievement</p>
        <p className="text-sm text-muted-foreground mb-2">Progress: {Math.min(narrowCurrentLevel, 5)}/5 levels</p>
        {!narrowStarted ? (
          <button
            className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white mb-2"
            style={{ backgroundColor: '#fb923c' }}
            onClick={handleNarrowStart}
          >
            Start Achievement
          </button>
        ) : null}
        {narrowStarted && !narrowAllCompleted && (
          <>
            <button
              className="btn btn-xs font-semibold rounded-full px-3 py-1 shadow-md transition-colors text-white absolute top-2 right-2"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleNarrowClose}
            >
              Close
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
              {PUSHUP_LEVELS.map(renderNarrowLevelCard)}
            </div>
          </>
        )}
        {narrowAllCompleted && renderNarrowTrophy()}
      </div>
    );
  });

  // Main card (diamond)
  const DiamondPushUpAchievement = React.memo(() => {
    if (!showDiamondPushupCard) {
      // Collapsed state: show only the header, gif, and a button to reopen
      return (
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center">
          <p className="text-lg font-semibold text-card-foreground mb-1">Diamond Push-Up Achievement</p>
          <div className="w-full flex justify-center mt-4">
            <button
              className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleDiamondReopen}
            >
              Start
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center relative">
        <p className="text-lg font-semibold text-card-foreground mb-1">Diamond Push-Up Achievement</p>
        <p className="text-sm text-muted-foreground mb-2">Progress: {Math.min(diamondCurrentLevel, 5)}/5 levels</p>
        {!diamondStarted ? (
          <button
            className="btn btn-sm font-semibold rounded-full px-6 py-2 shadow-md transition-colors text-white mb-2"
            style={{ backgroundColor: '#fb923c' }}
            onClick={handleDiamondStart}
          >
            Start Achievement
          </button>
        ) : null}
        {diamondStarted && !diamondAllCompleted && (
          <>
            <button
              className="btn btn-xs font-semibold rounded-full px-3 py-1 shadow-md transition-colors text-white absolute top-2 right-2"
              style={{ backgroundColor: '#fb923c' }}
              onClick={handleDiamondClose}
            >
              Close
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
              {DIAMOND_PUSHUP_LEVELS.map(renderDiamondLevelCard)}
            </div>
          </>
        )}
        {diamondAllCompleted && renderDiamondTrophy()}
      </div>
    );
  });

  return (
    <div className="space-y-6">
      {/* Achievement Badges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Achievement Badges</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Earned: {achievements.filter(a => a.earned).length}</span>
            <span>•</span>
            <span>Total: {achievements.length}</span>
          </div>
        </div>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements?.map((achievement) => (
              <AchievementBadge key={achievement?.id} achievement={achievement} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Icon name="Trophy" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="text-lg font-semibold text-card-foreground mb-2">No achievements yet</h4>
            <p className="text-muted-foreground">
              Complete workouts and reach milestones to earn achievements
            </p>
          </div>
        )}
      </div>
      
      {/* Supabase Cumulative Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Cumulative Progress (Cloud Synced)</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Cloud" size={16} className="text-primary" />
            <span>Synced to Cloud</span>
          </div>
        </div>
        {loadingSupabase ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Icon name="Loader" size={32} className="mx-auto mb-4 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading achievements...</p>
          </div>
        ) : supabaseAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supabaseAchievements.map((achievement) => (
              <div key={achievement.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    achievement.level >= 5 ? 'bg-warning' : 
                    achievement.level >= 3 ? 'bg-primary' : 'bg-success'
                  }`}>
                    <Icon name={achievement.level >= 5 ? 'Trophy' : achievement.level >= 3 ? 'Award' : 'Star'} size={20} color="white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-card-foreground">{achievement.achievement_name}</h4>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Level {achievement.level}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Total: {achievement.progress} {achievement.achievement_code?.includes('plank') || achievement.achievement_code?.includes('wall_sit') ? 'minutes' : 'reps'}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {achievement.progress} / {achievement.target}
                        </span>
                        <span className="font-medium text-card-foreground">
                          {Math.min(100, Math.round((achievement.progress / achievement.target) * 100))}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            achievement.level >= 5 ? 'bg-warning' : 
                            achievement.level >= 3 ? 'bg-primary' : 'bg-success'
                          }`}
                          style={{ width: `${Math.min(100, Math.round((achievement.progress / achievement.target) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Icon name="Cloud" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="text-lg font-semibold text-card-foreground mb-2">No cloud achievements yet</h4>
            <p className="text-muted-foreground">
              Complete exercises to start tracking your cumulative progress
            </p>
          </div>
        )}
      </div>
      
      {/* Workout Streaks */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Workout Streaks & Stats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workoutStreaks?.map((streak, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
              <Icon name={streak?.icon} size={24} className={`${streak?.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-card-foreground">{streak?.value}</p>
              <p className="text-sm text-muted-foreground">{streak?.unit}</p>
              <p className="text-xs font-medium text-card-foreground mt-1">{streak?.type}</p>
            </div>
          ))}
        </div>
        {/* Push-Up Achievement Cards - Accordion Layout */}
        <div className="space-y-4 mt-4">
          <h4 className="text-md font-medium text-card-foreground">Push-Up Challenges</h4>
          <div className="space-y-3">
            <AccordionAchievement
              achievementKey="pushups"
              config={ACHIEVEMENT_CONFIGS.pushups}
              state={pushupState}
              setState={setPushupState}
              weeklyCount={weeklyPushups}
              currentLevel={currentLevel}
              started={started}
              allCompleted={allCompleted}
              renderLevelCard={renderLevelCard}
              renderTrophy={renderTrophy}
            />
            <AccordionAchievement
              achievementKey="wide_pushups"
              config={ACHIEVEMENT_CONFIGS.wide_pushups}
              state={widePushupState}
              setState={setWidePushupState}
              weeklyCount={weeklyWidePushups}
              currentLevel={wideCurrentLevel}
              started={wideStarted}
              allCompleted={wideAllCompleted}
              renderLevelCard={renderWideLevelCard}
              renderTrophy={renderWideTrophy}
            />
            <AccordionAchievement
              achievementKey="narrow_pushups"
              config={ACHIEVEMENT_CONFIGS.narrow_pushups}
              state={narrowPushupState}
              setState={setNarrowPushupState}
              weeklyCount={weeklyNarrowPushups}
              currentLevel={narrowCurrentLevel}
              started={narrowStarted}
              allCompleted={narrowAllCompleted}
              renderLevelCard={renderNarrowLevelCard}
              renderTrophy={renderNarrowTrophy}
            />
            <AccordionAchievement
              achievementKey="diamond_pushups"
              config={ACHIEVEMENT_CONFIGS.diamond_pushups}
              state={diamondPushupState}
              setState={setDiamondPushupState}
              weeklyCount={weeklyDiamondPushups}
              currentLevel={diamondCurrentLevel}
              started={diamondStarted}
              allCompleted={diamondAllCompleted}
              renderLevelCard={renderDiamondLevelCard}
              renderTrophy={renderDiamondTrophy}
            />
            <AccordionAchievement
              achievementKey="knee_pushups"
              config={ACHIEVEMENT_CONFIGS.knee_pushups}
              state={kneePushupState}
              setState={setKneePushupState}
              weeklyCount={weeklyKneePushups}
              currentLevel={kneeCurrentLevel}
              started={kneeStarted}
              allCompleted={kneeAllCompleted}
              renderLevelCard={renderKneeLevelCard}
              renderTrophy={renderKneeTrophy}
            />
          </div>
        </div>

        {/* Cardio Achievement Cards - Accordion Layout */}
        <div className="space-y-4 mt-4">
          <h4 className="text-md font-medium text-card-foreground">Cardio Challenges</h4>
          <div className="space-y-3">
            <AccordionAchievement
              achievementKey="jumping_jacks"
              config={CARDIO_ACHIEVEMENT_CONFIGS.jumping_jacks}
              state={jumpingJacksState}
              setState={setJumpingJacksState}
              weeklyCount={weeklyJumpingJacks}
              currentLevel={jumpingJacksCurrentLevel}
              started={jumpingJacksStarted}
              allCompleted={jumpingJacksAllCompleted}
              renderLevelCard={renderJumpingJacksLevelCard}
              renderTrophy={renderJumpingJacksTrophy}
            />
            <AccordionAchievement
              achievementKey="burpees"
              config={CARDIO_ACHIEVEMENT_CONFIGS.burpees}
              state={burpeesState}
              setState={setBurpeesState}
              weeklyCount={weeklyBurpees}
              currentLevel={burpeesCurrentLevel}
              started={burpeesStarted}
              allCompleted={burpeesAllCompleted}
              renderLevelCard={renderBurpeesLevelCard}
              renderTrophy={renderBurpeesTrophy}
            />
            <AccordionAchievement
              achievementKey="high_knees"
              config={CARDIO_ACHIEVEMENT_CONFIGS.high_knees}
              state={highKneesState}
              setState={setHighKneesState}
              weeklyCount={weeklyHighKnees}
              currentLevel={highKneesCurrentLevel}
              started={highKneesStarted}
              allCompleted={highKneesAllCompleted}
              renderLevelCard={renderHighKneesLevelCard}
              renderTrophy={renderHighKneesTrophy}
            />
          </div>
        </div>

        {/* Lower Body Achievement Cards - Accordion Layout */}
        <div className="space-y-4 mt-4">
          <h4 className="text-md font-medium text-card-foreground">Lower Body Challenges</h4>
          <div className="space-y-3">
            <AccordionAchievement
              achievementKey="squats"
              config={LOWER_BODY_ACHIEVEMENT_CONFIGS.squats}
              state={squatsState}
              setState={setSquatsState}
              weeklyCount={weeklySquats}
              currentLevel={squatsCurrentLevel}
              started={squatsStarted}
              allCompleted={squatsAllCompleted}
              renderLevelCard={renderSquatsLevelCard}
              renderTrophy={renderSquatsTrophy}
            />
            <AccordionAchievement
              achievementKey="lunges"
              config={LOWER_BODY_ACHIEVEMENT_CONFIGS.lunges}
              state={lungesState}
              setState={setLungesState}
              weeklyCount={weeklyLunges}
              currentLevel={lungesCurrentLevel}
              started={lungesStarted}
              allCompleted={lungesAllCompleted}
              renderLevelCard={renderLungesLevelCard}
              renderTrophy={renderLungesTrophy}
            />
            <AccordionAchievement
              achievementKey="wall_sit"
              config={LOWER_BODY_ACHIEVEMENT_CONFIGS.wall_sit}
              state={wallSitState}
              setState={setWallSitState}
              weeklyCount={weeklyWallSit}
              currentLevel={wallSitCurrentLevel}
              started={wallSitStarted}
              allCompleted={wallSitAllCompleted}
              renderLevelCard={renderWallSitLevelCard}
              renderTrophy={renderWallSitTrophy}
            />
          </div>
        </div>

        {/* Plank & Core Achievement Cards - Accordion Layout */}
        <div className="space-y-4 mt-4">
          <h4 className="text-md font-medium text-card-foreground">Plank & Core Challenges</h4>
          <div className="space-y-3">
            <AccordionAchievement
              achievementKey="knee_plank"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.knee_plank}
              state={kneePlankState}
              setState={setKneePlankState}
              weeklyCount={weeklyKneePlank}
              currentLevel={kneePlankCurrentLevel}
              started={kneePlankStarted}
              allCompleted={kneePlankAllCompleted}
              renderLevelCard={renderKneePlankLevelCard}
              renderTrophy={renderKneePlankTrophy}
            />
            <AccordionAchievement
              achievementKey="plank"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.plank}
              state={plankState}
              setState={setPlankState}
              weeklyCount={weeklyPlank}
              currentLevel={plankCurrentLevel}
              started={plankStarted}
              allCompleted={plankAllCompleted}
              renderLevelCard={renderPlankLevelCard}
              renderTrophy={renderPlankTrophy}
            />
            <AccordionAchievement
              achievementKey="side_plank"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.side_plank}
              state={sidePlankState}
              setState={setSidePlankState}
              weeklyCount={weeklySidePlank}
              currentLevel={sidePlankCurrentLevel}
              started={sidePlankStarted}
              allCompleted={sidePlankAllCompleted}
              renderLevelCard={renderSidePlankLevelCard}
              renderTrophy={renderSidePlankTrophy}
            />
            <AccordionAchievement
              achievementKey="reverse_plank"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.reverse_plank}
              state={reversePlankState}
              setState={setReversePlankState}
              weeklyCount={weeklyReversePlank}
              currentLevel={reversePlankCurrentLevel}
              started={reversePlankStarted}
              allCompleted={reversePlankAllCompleted}
              renderLevelCard={renderReversePlankLevelCard}
              renderTrophy={renderReversePlankTrophy}
            />
            <AccordionAchievement
              achievementKey="sit_ups"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.sit_ups}
              state={sitUpsState}
              setState={setSitUpsState}
              weeklyCount={weeklySitUps}
              currentLevel={sitUpsCurrentLevel}
              started={sitUpsStarted}
              allCompleted={sitUpsAllCompleted}
              renderLevelCard={renderSitUpsLevelCard}
              renderTrophy={renderSitUpsTrophy}
            />
            <AccordionAchievement
              achievementKey="straight_arm_plank"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_plank}
              state={straightArmPlankState}
              setState={setStraightArmPlankState}
              weeklyCount={weeklyStraightArmPlank}
              currentLevel={straightArmPlankCurrentLevel}
              started={straightArmPlankStarted}
              allCompleted={straightArmPlankAllCompleted}
              renderLevelCard={renderStraightArmPlankLevelCard}
              renderTrophy={renderStraightArmPlankTrophy}
            />
            <AccordionAchievement
              achievementKey="straight_arm_reverse_plank"
              config={PLANK_CORE_ACHIEVEMENT_CONFIGS.straight_arm_reverse_plank}
              state={straightArmReversePlankState}
              setState={setStraightArmReversePlankState}
              weeklyCount={weeklyStraightArmReversePlank}
              currentLevel={straightArmReversePlankCurrentLevel}
              started={straightArmReversePlankStarted}
              allCompleted={straightArmReversePlankAllCompleted}
              renderLevelCard={renderStraightArmReversePlankLevelCard}
              renderTrophy={renderStraightArmReversePlankTrophy}
            />
          </div>
        </div>
      </div>
      {/* Removed Form Improvement Scores and Upcoming Milestones per request */}
    </div>
  );
};

export default AchievementsTab;