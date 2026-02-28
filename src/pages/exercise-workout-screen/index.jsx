import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import CameraFeed from './components/CameraFeed';
import ExerciseControls from './components/ExerciseControls';
import VideoUpload from './components/VideoUpload';
import WorkoutStats from './components/WorkoutStats';

// Import database modules normally - let React handle errors
import { db, recordWorkoutSession, updateAggregateStats } from '../../utils/db';
import { evaluateAchievements } from '../../utils/achievements';
import { recordCompletedWorkout } from '../../utils/workoutStorage';
import { recordExercise, recordExercises } from '../../utils/api/exerciseApi';
import { updateSupabaseUserStats, getSupabaseUserStats } from '../../utils/icpSupabaseAuth';
import { updateAchievements } from '../../utils/api/achievementsApi';

const ExerciseWorkoutScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize theme on component mount - ensure dark mode is applied
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    // Force re-render to ensure styles are applied
    document.body.style.backgroundColor = '';
  }, []);
  
  // Check authentication on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.id) {
      navigate('/login-screen', { replace: true });
      return;
    }
  }, [navigate]);
  
  // Error handling state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'upload'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showPoseOverlay, setShowPoseOverlay] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [todayPlan, setTodayPlan] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [aiPushupCount, setAiPushupCount] = useState(0);
  const [postureStatus, setPostureStatus] = useState('unknown');
  const PLAN_KEY = 'fitcoach_today_plan';

  // Mock exercises data
  const exercises = [
    { id: 1, name: "Push-Ups", category: "Upper Body", difficulty: "Beginner", duration: "3-5 min" },
  { id: 6, name: "Wide Push Ups", category: "Upper Body", difficulty: "Intermediate", duration: "3-5 min" },
  { id: 12, name: "Narrow Push Ups", category: "Upper Body", difficulty: "Intermediate", duration: "3-5 min" },
  { id: 13, name: "Diamond Push Ups", category: "Upper Body", difficulty: "Advanced", duration: "3-5 min" },
  { id: 14, name: "Knee Push Ups", category: "Upper Body", difficulty: "Beginner", duration: "3-5 min" },
    { id: 2, name: "Squats", category: "Lower Body", difficulty: "Beginner", duration: "4-6 min" },
    { id: 3, name: "Lunges", category: "Lower Body", difficulty: "Intermediate", duration: "5-7 min" },
    { id: 4, name: "Burpees", category: "Full Body", difficulty: "Advanced", duration: "6-8 min" },
    { id: 5, name: "Side Plank", category: "Core", difficulty: "Intermediate", duration: "2-4 min" },
    { id: 8, name: "Sit-Ups", category: "Core", difficulty: "Beginner", duration: "3-5 min" },
    { id: 7, name: "Reverse Plank", category: "Core", difficulty: "Intermediate", duration: "2-4 min" },
    { id: 9, name: "Jumping Jacks", category: "Full Body", difficulty: "Beginner", duration: "3-5 min" },
    { id: 10, name: "Wall Sit", category: "Lower Body", difficulty: "Intermediate", duration: "2-4 min" }
  ];

  // Timer effect for active workout
  useEffect(() => {
    let interval = null;
    // Determine which exercise to evaluate for time-based exercises: prefer selectedExercise, fall back to first static exercise
    const effectiveExerciseName = String((selectedExercise || exercises?.[0])?.name || '').toLowerCase();
    const isTimeBasedExercise = effectiveExerciseName.includes('plank') || effectiveExerciseName.includes('wall sit');
    // For time-based exercises we rely on pose-detection's onTimeUpdate callback which sets workoutTime directly.
    const shouldIncrementTimer = isWorkoutActive && !isPaused && !isTimeBasedExercise;

    if (shouldIncrementTimer) {
      interval = setInterval(() => {
        setWorkoutTime(time => time + 1);
        // Mock data updates during workout
        setCaloriesBurned(prev => prev + Math.random() * 0.5);
        setHeartRate(prev => {
          const baseRate = 120;
          const variation = Math.sin(Date.now() / 10000) * 20;
          return Math.round(baseRate + variation + Math.random() * 10);
        });
        setFormScore(prev => Math.min(100, prev + Math.random() * 2));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isWorkoutActive, isPaused, postureStatus, selectedExercise?.name]);

  // If resuming with a stored plan, select first incomplete
  useEffect(() => {
    if (todayPlan && !selectedExercise) {
      const firstIncomplete = todayPlan.items?.find(e => !e.completed);
      if (firstIncomplete) setSelectedExercise(firstIncomplete);
    }
  }, [todayPlan, selectedExercise]);

  // Define currentExercise early to avoid initialization errors
  const currentExercise = selectedExercise || (todayPlan?.items?.find(e => !e.completed) || todayPlan?.items?.[0]) || exercises?.[0];
  
  // Get plan-specific configuration for current exercise
  const planExercise = todayPlan?.items?.find(e => 
    e.name === currentExercise?.name || 
    e.name?.toLowerCase() === currentExercise?.name?.toLowerCase()
  );

  // Use AI counting for Push-Ups and Squats, mock counting for other exercises
  // Add Burpees detection
  const isBurpeesSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('burpee');
  })();

  useEffect(() => {
    if (isWorkoutActive && !isPaused) {
      const name = (currentExercise?.name || '').toLowerCase();
      if (name.includes('push') || name.includes('squat') || name.includes('lunge') || name.includes('burpee') || name.includes('jumping')) {
        // For Push-Ups, Squats, Lunges, Burpees: use AI detection count provided by CameraFeed
        setCurrentRep(aiPushupCount);
        setRepsCompleted(aiPushupCount);
      } else {
        // For other exercises, use mock counting
        const repInterval = setInterval(() => {
          if (Math.random() > 0.7) {
            setCurrentRep(prev => {
              const newRep = prev + 1;
              setRepsCompleted(total => total + 1);
              return newRep;
            });
          }
        }, 3000);
        return () => clearInterval(repInterval);
      }
    }
  }, [isWorkoutActive, isPaused, aiPushupCount, currentExercise]);

  const handleWorkoutStart = () => {
    if (!isCameraActive && activeTab === 'live') {
      setIsCameraActive(true);
    }
    setIsWorkoutActive(true);
    setIsPaused(false);
    if (workoutTime === 0) {
      // Reset stats for new workout
      setCurrentSet(1);
      setCurrentRep(0);
      setCaloriesBurned(0);
      setFormScore(0);
      setRepsCompleted(0);
    }
  };

  const handleWorkoutPause = () => {
    setIsPaused(true);
  };

  const handleWorkoutStop = () => {
    setIsWorkoutActive(false);
    setIsPaused(false);
    setIsCameraActive(false);
    // Keep stats for review
    // If today's plan exists and all items completed, award achievement flag in localStorage
    if (todayPlan?.items && selectedExercise) {
      // Mark current exercise as completed on manual stop
      const idx = todayPlan.items.findIndex(e => normalizeName(e.name) === normalizeName(selectedExercise.name));
      if (idx >= 0) {
        const updatedItems = todayPlan.items.map((e, i) => i === idx ? { ...e, completed: true } : e);
        const updated = { ...todayPlan, items: updatedItems };
        setTodayPlan(updated);
        try {
          const stored = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
          if (stored?.exercises) {
            stored.exercises = stored.exercises.map((e) => normalizeName(e.name) === normalizeName(selectedExercise.name) ? { ...e, completed: true } : e);
            localStorage.setItem(PLAN_KEY, JSON.stringify(stored));
          }
        } catch {}
      }
    }
  };

  const handleExerciseComplete = () => {
    setShowCelebration(true);
    setTimeout(async () => {
      setShowCelebration(false);
      if (todayPlan && selectedExercise) {
        // mark current as completed in todayPlan
        const idx = todayPlan.items.findIndex(e => normalizeName(e.name) === normalizeName(selectedExercise.name));
        if (idx >= 0) {
          const updatedItems = todayPlan.items.map((e, i) => i === idx ? { ...e, completed: true } : e);
          const updated = { ...todayPlan, items: updatedItems };
          setTodayPlan(updated);
          // persist back to dashboard storage
          try {
            const stored = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
            if (stored?.exercises) {
              // find by name match to be robust
              stored.exercises = stored.exercises.map((e) => normalizeName(e.name) === normalizeName(selectedExercise.name) ? { ...e, completed: true } : e);
              localStorage.setItem(PLAN_KEY, JSON.stringify(stored));
            }
          } catch {}
        }
        // persist session update for stats
        const completedItems = updated.items.filter(i => i.completed);
        const sessionItems = completedItems.map(i => ({
          name: i.name,
          reps: i.reps,
          sets: i.sets,
          durationSec: i.duration ? parseInt(String(i.duration).replace(/\D/g, ''), 10) : null,
          completed: i.completed
        }));
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user?.id) {
            await recordWorkoutSession(user.id, sessionItems);
            const stats = await updateAggregateStats(user.id, sessionItems);
            await evaluateAchievements(user.id, stats);
          }
        } catch {}

        // advance to next exercise if any
        handleNextExercise();
      }
    }, 2000);
    // Stop current workout loop
    setIsWorkoutActive(false);
    setIsPaused(false);
  };

  const handleCameraToggle = () => {
    console.log('🎬 Camera toggle clicked! Current state:', isCameraActive, '-> New state:', !isCameraActive);
    setIsCameraActive(!isCameraActive);
  };

  const handleFormFeedback = (feedback) => {
    // Handle real-time form feedback
    console.log('Form feedback:', feedback);
    
    // Update form score based on feedback
    if (feedback.type === 'success') {
      setFormScore(prev => Math.min(100, prev + 2));
    } else if (feedback.type === 'warning') {
      setFormScore(prev => Math.max(0, prev - 1));
    }
  };

  const handlePushupCount = (count) => {
    setAiPushupCount(count);
    console.log('AI Push-up count:', count);
  };

  const handlePlankTimeUpdate = (seconds) => {
    // Replace workoutTime with the accumulated correct-seconds reported by pose detection
    setWorkoutTime(seconds);
  };

  const handlePostureChange = (status, landmarks) => {
    setPostureStatus(status);
    console.log('Posture status:', status);
    
    // Update form score based on posture
    if (status === 'correct') {
      setFormScore(prev => Math.min(100, prev + 1));
    } else if (status === 'incorrect') {
      setFormScore(prev => Math.max(0, prev - 2));
    }
  };

  const handleVideoAnalysis = (results) => {
    setIsAnalyzing(false);
    console.log('Video analysis results:', results);
  };

  const handleExerciseChange = (exercise) => {
    // Reset counters when switching exercise
    setWorkoutTime(0);
    setCurrentSet(1);
    setCurrentRep(0);
    setSelectedExercise(exercise);
  };

  const sortedExercises = [...exercises].sort((a, b) => {
    const order = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
    return (order[a.difficulty] ?? 3) - (order[b.difficulty] ?? 3);
  });

  const normalizeName = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '');

  const handleNextExercise = () => {
    if (!todayPlan || !todayPlan.items?.length) return;
    
    // Find current exercise index
    const currentIdx = todayPlan.items.findIndex((e) => 
      normalizeName(e.name) === normalizeName(currentExercise?.name)
    );
    
    // Find next incomplete exercise
    const nextExercise = todayPlan.items.find((e, i) => i > currentIdx && !e.completed);
    
    if (nextExercise) {
      // Reset counters for next exercise
      setWorkoutTime(0);
      setCurrentSet(1);
      setCurrentRep(0);
      setRepsCompleted(0);
      setCaloriesBurned(0);
      setFormScore(0);
      setSelectedExercise(nextExercise);
      
      // Stop current workout if active
      if (isWorkoutActive) {
        setIsWorkoutActive(false);
        setIsPaused(false);
        setIsCameraActive(false);
      }
    } else {
      // No more exercises - check if all are completed
      const allCompleted = todayPlan.items.every(e => e.completed);
      if (allCompleted) {
        // Award completion badge
        const badges = JSON.parse(localStorage.getItem('fitcoach_badges') || '[]');
        badges.push({ id: 'consistency_star', date: new Date().toISOString() });
        localStorage.setItem('fitcoach_badges', JSON.stringify(badges));
        
        // Show completion message
        alert('🎉 Congratulations! You have completed all exercises in this plan!');
      } else {
        alert('No more exercises in this plan.');
      }
    }
  };

  // Initialize selected exercise from navigation state or persisted plan
  useEffect(() => {
    const passed = location?.state?.selectedExercise;
    const plan = location?.state?.todayPlan;
    if (plan) {
      const items = plan.exercises || [];
      setTodayPlan({ name: plan.name, items });
      const firstIncomplete = items.find(e => !e.completed);
      const initial = passed || firstIncomplete || items[0];
      if (initial) setSelectedExercise(initial);
    } else if (passed) {
      setSelectedExercise(passed);
    } else {
      // Fallback: load from localStorage
      try {
        const raw = localStorage.getItem(PLAN_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (stored?.exercises?.length) {
            const items = stored.exercises;
            setTodayPlan({ name: stored.name, items });
            const firstIncomplete = items.find(e => !e.completed);
            setSelectedExercise(firstIncomplete || items[0]);
          }
        }
      } catch {}
    }
  }, [location?.state]);

  // Track live session items for calorie calculation
  const [sessionItems, setSessionItems] = useState([]); // { name, reps, sets, durationSec, completed }

  useEffect(() => {
    // Keep a running caloriesBurned based on sessionItems and user weight
    let mounted = true;
    (async () => {
      try {
        const { calculateSessionCalories } = await import('../../utils/calories');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const { total } = calculateSessionCalories(sessionItems, user);
        if (mounted) setCaloriesBurned(total);
      } catch (error) {
        console.error('Failed calculating calories:', error);
      }
    })();
    return () => { mounted = false; };
  }, [sessionItems]);

  // Update sessionItems as reps/time update
  useEffect(() => {
    if (!currentExercise) return;
    const name = currentExercise?.name || '';
    const isTimeBasedExercise = String(name).toLowerCase().includes('plank') || String(name).toLowerCase().includes('wall sit');

    // For rep-based exercises we map aiPushupCount -> reps
    if (isWorkoutActive && !isPaused && (name.toLowerCase().includes('push') || name.toLowerCase().includes('squat') || name.toLowerCase().includes('lunge') || name.toLowerCase().includes('burpee') || name.toLowerCase().includes('mountain') || name.toLowerCase().includes('jumping')) ) {
      // Update or create session item for this exercise
      setSessionItems(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(s => normalizeName(s.name) === normalizeName(name));
        const reps = aiPushupCount;
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], reps, completed: false };
        } else {
          copy.push({ name, reps, sets: 1, completed: false });
        }
        return copy;
      });
    }

    // For time-based exercises (plank, wall sit), use posture-correct seconds from poseDetection onTimeUpdate via props
    // We'll rely on workoutTime state for the UI but need to store durationSec for the time-based item
    if (isTimeBasedExercise) {
      setSessionItems(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(s => normalizeName(s.name) === normalizeName(name));
        const durationSec = workoutTime; // workoutTime now reflects accumulated correct seconds for plank
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], durationSec, completed: false };
        } else {
          copy.push({ name, durationSec, sets: 1, completed: false });
        }
        return copy;
      });
    }
  }, [aiPushupCount, workoutTime, isWorkoutActive, isPaused, currentExercise]);

  // When workout stops/completes, persist session and update aggregate stats including calories
  const persistSessionAndStats = async () => {
    console.log('🏋️ persistSessionAndStats called');
    console.log('📊 Session items:', sessionItems);
    console.log('📊 Current exercise:', currentExercise);
    console.log('📊 Reps completed:', repsCompleted, 'Workout time:', workoutTime);
    
    try {
      const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('👤 User from localStorage:', sessionUser);
      
      if (!sessionUser?.id) {
        console.error('❌ No user ID found in localStorage!');
        return;
      }
      
      // Build session items - if empty, create from current exercise
      let sessionItemsToSave = sessionItems.map(i => ({ ...i }));
      
      // If no session items but we have exercise data, create one
      if (sessionItemsToSave.length === 0 && currentExercise) {
        console.log('📝 Creating session item from current exercise');
        sessionItemsToSave = [{
          name: currentExercise.name,
          reps: repsCompleted || currentRep || aiPushupCount,
          sets: currentSet || 1,
          durationSec: workoutTime,
          completed: true
        }];
      }
      
      console.log('💾 Session items to save:', sessionItemsToSave);
      
      if (sessionItemsToSave.length === 0) {
        console.warn('⚠️ No session items to save');
        return;
      }
      
      // Use the new centralized workout storage system
      const sessionData = {
        exerciseName: currentExercise?.name || 'Workout',
        name: currentExercise?.name || 'Workout',
        reps: repsCompleted || currentRep,
        sets: currentSet,
        durationSec: workoutTime,
        workoutTime: workoutTime,
        sessionItems: sessionItemsToSave
      };

      // Record workout using centralized system (handles localStorage, IndexedDB, events, notifications)
      const result = await recordCompletedWorkout(sessionData);
      
      if (result.success) {
        console.log('✅ Workout recorded to localStorage:', result);
        setShowCelebration(true);
        
        // Auto-hide celebration after 3 seconds
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      } else {
        console.error('❌ Failed to record workout:', result.error);
      }

      // Save to Supabase database
      console.log('🔄 Saving to Supabase...');
      try {
        // Record each exercise to Supabase
        for (const item of sessionItemsToSave) {
          console.log('📤 Saving exercise to Supabase:', item);
          await recordExercise(sessionUser.id, {
            exerciseName: item.name,
            repetitions: item.reps || 0,
            sets: item.sets || 1,
            durationSec: item.durationSec || workoutTime,
            caloriesBurned: Math.round(caloriesBurned / sessionItemsToSave.length),
            angleAccuracy: formScore,
            datePerformed: new Date().toISOString()
          });
        }
        console.log('✅ Exercises saved to Supabase');

        // Update achievements in Supabase
        console.log('🏆 Updating achievements in Supabase...');
        try {
          await updateAchievements(sessionUser.id, sessionItemsToSave);
          console.log('✅ Achievements updated in Supabase');
        } catch (achievementError) {
          console.error('❌ Achievement update failed:', achievementError);
        }

        // Update user stats in Supabase
        console.log('🔄 Updating user stats in Supabase...');
        const currentStats = await getSupabaseUserStats(sessionUser.id);
        console.log('📊 Current stats from Supabase:', currentStats);
          if (currentStats) {
            const totalWorkouts = (currentStats.total_workouts || 0) + 1;
            const totalCalories = (currentStats.total_calories_burned || 0) + Math.round(caloriesBurned);
            const totalTime = (currentStats.total_workout_time || 0) + workoutTime;
            
            // Calculate streak
            const lastWorkout = currentStats.last_workout_date ? new Date(currentStats.last_workout_date) : null;
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let currentStreak = currentStats.current_streak || 0;
            if (lastWorkout) {
              const lastWorkoutDate = lastWorkout.toDateString();
              const yesterdayDate = yesterday.toDateString();
              const todayDate = today.toDateString();
              
              if (lastWorkoutDate === todayDate) {
                // Already worked out today, keep streak
              } else if (lastWorkoutDate === yesterdayDate) {
                // Worked out yesterday, increment streak
                currentStreak += 1;
              } else {
                // Missed days, reset streak
                currentStreak = 1;
              }
            } else {
              currentStreak = 1;
            }
            
            const longestStreak = Math.max(currentStats.longest_streak || 0, currentStreak);

            await updateSupabaseUserStats(sessionUser.id, {
              total_workouts: totalWorkouts,
              total_calories_burned: totalCalories,
              total_workout_time: totalTime,
              current_streak: currentStreak,
              longest_streak: longestStreak,
              last_workout_date: new Date().toISOString()
            });
            console.log('✅ User stats updated in Supabase');
          }
        } catch (supabaseError) {
          console.error('❌ Supabase storage failed:', supabaseError);
          console.error('Error details:', supabaseError.message, supabaseError.code);
        }

        // Also persist to IndexedDB for detailed tracking (fallback)
        try {
          const { recordWorkoutSession, updateAggregateStats } = await import('../../utils/db');
          const sessionId = await recordWorkoutSession(sessionUser.id, sessionItemsToSave);
          await updateAggregateStats(sessionUser.id, sessionItemsToSave);
          console.log('✅ Session also saved to IndexedDB:', sessionId);
        } catch (dbError) {
          console.warn('⚠️ IndexedDB storage failed:', dbError);
        }
    } catch (error) {
      console.error('❌ Error persisting session:', error);
    }
  };

  // Call persist when stopping or completing workout
  useEffect(() => {
    if (!isWorkoutActive && workoutTime > 5) { // Only persist if workout was at least 5 seconds
      // Persist session on stop
      persistSessionAndStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkoutActive]);

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-error mb-4">Exercise Screen Error</h2>
          <p className="text-muted-foreground mb-4">{errorMessage || 'Something went wrong'}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              navigate('/dashboard');
            }}
            className="bg-primary text-primary-foreground px-6 py-2 rounded hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-background">
      {/* Header with Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="w-8 h-8 sm:w-10 sm:h-10"
              >
                <Icon name="ArrowLeft" size={18} className="sm:w-5 sm:h-5" />
              </Button>
              {/* Hide breadcrumb on mobile */}
              <nav className="hidden sm:flex items-center space-x-2 text-sm">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </button>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                <span className="text-foreground font-medium">Exercise Workout</span>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                <span className="text-primary font-medium">{currentExercise?.name}</span>
              </nav>
              {/* Mobile title */}
              <div className="sm:hidden">
                <h1 className="text-lg font-semibold text-foreground">{currentExercise?.name || 'Exercise Workout'}</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
                <Icon name="Settings" size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
                <Icon name="HelpCircle" size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="bg-muted rounded-lg p-1 flex w-full max-w-sm sm:max-w-none sm:w-auto">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'live' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Camera" size={14} className="mr-1 sm:mr-2 inline w-3 h-3 sm:w-4 sm:h-4" />
              Live Workout
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Upload" size={14} className="mr-1 sm:mr-2 inline w-3 h-3 sm:w-4 sm:h-4" />
              Video Analysis
            </button>
          </div>
        </div>

        {activeTab === 'live' ? (
          /* Live Workout Layout - Unified Responsive Design */
          (<div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0">
            {/* Camera Feed - Full width on mobile, 2 columns on desktop */}
            <div className="lg:col-span-2">
              <div className="aspect-[4/3] sm:aspect-video bg-black rounded-lg overflow-hidden">
                <CameraFeed
                  isActive={isCameraActive}
                  onToggleCamera={handleCameraToggle}
                  showPoseOverlay={showPoseOverlay}
                  setShowPoseOverlay={setShowPoseOverlay}
                  onFormFeedback={handleFormFeedback}
                  onPushupCount={handlePushupCount}
                  onPostureChange={handlePostureChange}
                  onPlankTimeUpdate={handlePlankTimeUpdate}
                  selectedExercise={currentExercise}
                />
              </div>
              
              {/* Mobile Stats - Visible on mobile only */}
              <div className="lg:hidden mt-4">
                <WorkoutStats
                  workoutTime={workoutTime}
                  caloriesBurned={Math.round(caloriesBurned)}
                  heartRate={heartRate}
                  formScore={Math.round(formScore)}
                  repsCompleted={repsCompleted}
                  isActive={isWorkoutActive && !isPaused}
                />
              </div>
            </div>
            
            {/* Controls Sidebar - Desktop only */}
            <div className="hidden lg:block space-y-6">
              <ExerciseControls
                selectedExercise={currentExercise}
                onExerciseChange={handleExerciseChange}
                onWorkoutStart={handleWorkoutStart}
                onWorkoutPause={handleWorkoutPause}
                onWorkoutStop={handleWorkoutStop}
                onNextExercise={handleNextExercise}
                onExerciseComplete={handleExerciseComplete}
                hasNextExercise={Boolean(todayPlan?.items && (() => {
                  const currentIdx = todayPlan.items.findIndex((e) => 
                    normalizeName(e.name) === normalizeName(currentExercise?.name)
                  );
                  return currentIdx >= 0 && currentIdx < todayPlan.items.length - 1;
                })())}
                isWorkoutActive={isWorkoutActive}
                isPaused={isPaused}
                currentSet={currentSet}
                currentRep={currentRep}
                workoutTime={workoutTime}
                planExercise={planExercise}
              />
              
              {/* Desktop Stats */}
              <WorkoutStats
                workoutTime={workoutTime}
                caloriesBurned={Math.round(caloriesBurned)}
                heartRate={heartRate}
                formScore={Math.round(formScore)}
                repsCompleted={repsCompleted}
                isActive={isWorkoutActive && !isPaused}
              />
            </div>

            {/* Mobile Controls - Bottom section for mobile */}
            <div className="lg:hidden">
              <ExerciseControls
                selectedExercise={currentExercise}
                onExerciseChange={handleExerciseChange}
                onWorkoutStart={handleWorkoutStart}
                onWorkoutPause={handleWorkoutPause}
                onWorkoutStop={handleWorkoutStop}
                onNextExercise={handleNextExercise}
                onExerciseComplete={handleExerciseComplete}
                hasNextExercise={Boolean(todayPlan?.items && (() => {
                  const currentIdx = todayPlan.items.findIndex((e) => 
                    normalizeName(e.name) === normalizeName(currentExercise?.name)
                  );
                  return currentIdx >= 0 && currentIdx < todayPlan.items.length - 1;
                })())}
                isWorkoutActive={isWorkoutActive}
                isPaused={isPaused}
                currentSet={currentSet}
                currentRep={currentRep}
                workoutTime={workoutTime}
                planExercise={planExercise}
              />
            </div>
          </div>)
        ) : (
          /* Video Upload Layout */
          (<div className="max-w-4xl mx-auto">
            <VideoUpload
              onVideoAnalysis={handleVideoAnalysis}
              isAnalyzing={isAnalyzing}
              selectedExercise={currentExercise}
              onPlankTimeUpdate={handlePlankTimeUpdate}
            />
          </div>)
        )}

        {/* Workout Summary Modal - Shows after workout completion */}
        {!isWorkoutActive && workoutTime > 5 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-elevation-3 w-full max-w-md">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="CheckCircle" size={32} className="text-success" />
                  </div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Workout Complete!</h2>
                  <p className="text-muted-foreground">Great job on your {currentExercise?.name} session</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">{Math.floor(workoutTime / 60)}m {workoutTime % 60}s</p>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-2xl font-bold text-success">{repsCompleted}</p>
                      <p className="text-sm text-muted-foreground">Total Reps</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-2xl font-bold text-accent">{Math.round(caloriesBurned)}</p>
                      <p className="text-sm text-muted-foreground">Calories</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-2xl font-bold text-warning">{Math.round(formScore)}%</p>
                      <p className="text-sm text-muted-foreground">Form Score</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setWorkoutTime(0);
                      setRepsCompleted(0);
                      setCaloriesBurned(0);
                      setFormScore(0);
                    }}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-modal flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <div className="w-64 h-64 rounded-full bg-primary/20 animate-ping absolute" />
            <div className="w-48 h-48 rounded-full bg-success/20 animate-ping absolute delay-150" />
            <div className="relative bg-card border border-border rounded-2xl shadow-elevation-3 px-8 py-6 text-center">
              <div className="w-14 h-14 bg-success rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="Trophy" size={28} color="white" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground">Great Job!</h3>
              <p className="text-sm text-muted-foreground mt-1">Exercise completed</p>
              <p className="text-xs text-muted-foreground mt-2">Moving to the next exercise...</p>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('ExerciseWorkoutScreen error:', error);
    setHasError(true);
    setErrorMessage(error.message || 'Unknown error occurred');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-error mb-4">Loading Error</h2>
          <p className="text-muted-foreground mb-4">Failed to load exercise screen</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-primary-foreground px-6 py-2 rounded hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
};

export default ExerciseWorkoutScreen;