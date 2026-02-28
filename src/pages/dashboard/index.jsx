import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import WelcomeSection from './components/WelcomeSection';
import TodayWorkoutCard from './components/TodayWorkoutCard';
import DailyTipsCard from './components/DailyTipsCard';
import WaterMonitoringCard from './components/WaterMonitoringCard';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import SubscriptionStatusCard from './components/SubscriptionStatusCard';
import { AchievementsCard, CaloriesGoalsCard, PerformanceOverviewCard, DailyMotivationCard } from './components/SquareCards';
import WorkoutNotifications from '../../components/ui/WorkoutNotifications';
import paymentService from '../../utils/paymentService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark'); // Default to dark mode
  const [subscription, setSubscription] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // User data from localStorage
  const [user, setUser] = useState({ name: 'New User', email: '', profilePicture: '', fitnessLevel: 'Beginner', goals: [] });
  // Allow skipping onboarding/login redirects in development by setting
  // localStorage.setItem('SKIP_LOGIN','1') or VITE_SKIP_LOGIN=true in .env
  const skipLoginFlag = (typeof window !== 'undefined' && window.localStorage?.getItem('SKIP_LOGIN') === '1') || import.meta.env.VITE_SKIP_LOGIN === 'true' || import.meta.env.VITE_SKIP_LOGIN === '1';
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          name: parsedUser?.name || 'New User',
          email: parsedUser?.email || '',
          profilePicture: parsedUser?.profilePicture || '',
          fitnessLevel: (parsedUser?.fitnessLevel || 'beginner')?.replace(/\b\w/g, c => c.toUpperCase()),
          goals: parsedUser?.goals || []
        });

        // Load subscription data
        const loadSubscription = async () => {
          try {
            await paymentService.init();
            const subscriptionData = await paymentService.getUserSubscription(parsedUser.id);
            if (subscriptionData.success) {
              setSubscription(subscriptionData.subscription);
            }
          } catch (error) {
            console.error('Error loading subscription:', error);
          } finally {
            setIsLoadingSubscription(false);
          }
        };

        if (parsedUser.id) {
          loadSubscription();
        } else {
          setIsLoadingSubscription(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoadingSubscription(false);
      }
    } else {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Mock progress data
  const [progressData, setProgressData] = useState({
    weeklyGoal: 5,
    completedWorkouts: 0,
    currentStreak: 0,
    totalWorkouts: 0,
    caloriesBurned: 0,
    weeklyCalorieGoal: 2000,
    achievements: []
  });
  useEffect(() => {
    (async () => {
      try {
        const session = JSON.parse(localStorage.getItem('user') || 'null');
        if (session?.id) {
          const { db } = await import('../../utils/db');
          const sessions = await db.sessions.where({ userId: session.id }).toArray();
          const totalWorkouts = sessions.length;
          const calories = 0; // placeholder: in real case compute
          setProgressData(prev => ({ ...prev, totalWorkouts, caloriesBurned: calories, completedWorkouts: 0, currentStreak: 0 }));
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
    // Use class instead of data attribute for Tailwind dark mode
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Use class instead of data attribute for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
      localStorage.removeItem('theme');
      navigate('/login-screen');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login even if logout fails
      navigate('/login-screen');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Workout Notifications */}
      <WorkoutNotifications />

      {/* Header */}
      <AppHeader
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={handleThemeToggle}
        currentTheme={currentTheme}
        user={user}
        onLogout={handleLogout}
      />
      {/* Sidebar */}
      <SidebarNavigation
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {/* Main Content */}
      <main className="pt-16 lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <WelcomeSection user={user} />

          {/* Top Priority Section - Today's Workout and Water Intake */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-6">
            <div className="lg:col-span-5">
              <TodayWorkoutCard workoutData={{
                name: "Full Body Strength",
                scheduledTime: "6:00 PM",
                exercises: [
                  { name: "Push-ups", sets: 3, reps: 15, completed: false },
                  { name: "Wide Push Ups", sets: 3, reps: 12, completed: false },
                  { name: "Squats", sets: 3, reps: 20, completed: false },
                  { name: "Plank", sets: 3, duration: "30s", completed: false },
                  { name: "Lunges", sets: 3, reps: 12, completed: false },
                  { name: "Mountain Climbers", sets: 3, reps: 15, completed: false }
                ],
                estimatedDuration: 30,
                difficulty: "Intermediate"
              }} />
            </div>
            <div className="lg:col-span-2">
              <WaterMonitoringCard />
            </div>
          </div>

          {/* Square Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AchievementsCard />
            <CaloriesGoalsCard />
            <PerformanceOverviewCard />
            <DailyMotivationCard />
          </div>

          {/* Secondary Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DailyTipsCard />
            <SubscriptionStatusCard
              subscription={subscription}
              isLoading={isLoadingSubscription}
            />
          </div>

          {/* Advanced Analytics */}
          <AdvancedAnalytics />



          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              <p>© {new Date()?.getFullYear()} FitCoach AI. All rights reserved.</p>
              <p className="mt-2">Your AI-powered fitness companion for a healthier lifestyle.</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;