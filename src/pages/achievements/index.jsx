import React, { useEffect, useState } from 'react';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import AchievementsTab from '../user-profile/components/AchievementsTab';

const AchievementsPage = () => {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const u = JSON.parse(userData);
        setUser({
          id: u?.id || u?.principalId,
          name: u?.name || 'New User',
          email: u?.email || '',
          phone: u?.phone || '',
          dateOfBirth: u?.dateOfBirth || '',
          location: u?.location || '',
          profilePicture: u?.profilePicture || '',
          joinDate: (u?.createdAt || new Date().toISOString()).slice(0,10),
          totalWorkouts: 0,
          currentStreak: 0,
          longestStreak: 0,
          achievements: 0,
          thisWeekWorkouts: 0,
          thisMonthWorkouts: 0,
          age: u?.age || '',
          height: u?.height || '',
          weight: u?.weight || '',
          fitnessLevel: u?.fitnessLevel || 'beginner',
          primaryGoal: u?.primaryGoal || '',
          goals: u?.goals || [],
          workoutFrequency: u?.workoutFrequency || '',
          preferredWorkoutTime: u?.preferredWorkoutTime || '',
          availableEquipment: u?.availableEquipment || [],
          totalCaloriesBurned: '0',
          totalWorkoutTime: '0h',
          goalsCompleted: 0
        });
      }
    } catch (error) {
      setUser(null);
    }
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={handleThemeToggle}
        currentTheme={currentTheme}
        user={user || { name: 'New User', email: '' }}
        onLogout={()=>{}}
      />
      <SidebarNavigation isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className={"pt-16 lg:pl-72 min-h-screen transition-all duration-300"}>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
              <p className="text-muted-foreground mt-1">View your earned badges and milestones</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <AchievementsTab user={user} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage;
