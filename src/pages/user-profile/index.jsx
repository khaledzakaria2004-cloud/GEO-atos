import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import Icon from '../../components/AppIcon';
import { getUserById, updateUserProfile } from '../../utils/db';
import Button from '../../components/ui/Button';
import ProfileHeader from './components/ProfileHeader';
import PersonalInfoTab from './components/PersonalInfoTab';
import FitnessMetricsTab from './components/FitnessMetricsTab';
import { paymentService } from '../../utils/paymentService';
import { getUserProfile, updateUser, getUserStats } from '../../utils/api/userApi';
// Achievements tab removed per request

const UserProfile = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark'); // Default to dark mode
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
    setCurrentTheme(savedTheme);
    // Use class instead of data attribute for Tailwind dark mode
    if (savedTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
    // Load session user from localStorage (matching onboarding key)
    (async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const u = JSON.parse(userData);
          const principalId = u?.id || u?.principalId || u?.principal;
          
          // Try to load from Supabase first
          let supabaseUser = null;
          let supabaseStats = null;
          
          if (principalId) {
            try {
              console.log('📥 Loading user profile from Supabase:', principalId);
              supabaseUser = await getUserProfile(principalId);
              supabaseStats = await getUserStats(principalId);
              console.log('✅ Supabase user:', supabaseUser);
              console.log('✅ Supabase stats:', supabaseStats);
            } catch (error) {
              console.error('❌ Error loading from Supabase:', error);
            }
          }
          
          // Merge Supabase data with localStorage data
          setUser({
            id: principalId,
            name: supabaseUser?.full_name || u?.name || 'New User',
            email: supabaseUser?.email || u?.email || '',
            phone: u?.phone || '',
            dateOfBirth: u?.dateOfBirth || '',
            location: u?.location || '',
            profilePicture: supabaseUser?.profile_picture || u?.profilePicture || '',
            joinDate: (supabaseUser?.date_joined || u?.createdAt || new Date().toISOString()).slice(0,10),
            totalWorkouts: supabaseStats?.total_workouts || 0,
            currentStreak: supabaseStats?.current_streak || 0,
            longestStreak: supabaseStats?.longest_streak || 0,
            achievements: 0,
            thisWeekWorkouts: 0,
            thisMonthWorkouts: 0,
            age: supabaseUser?.age || u?.age || '',
            height: supabaseUser?.height || u?.height || '',
            weight: supabaseUser?.weight || u?.weight || '',
            fitnessLevel: supabaseUser?.fitness_level || u?.fitnessLevel || 'beginner',
            primaryGoal: u?.primaryGoal || '',
            goals: supabaseUser?.goals || u?.goals || [],
            workoutFrequency: u?.workoutFrequency || '',
            preferredWorkoutTime: u?.preferredWorkoutTime || '',
            availableEquipment: u?.availableEquipment || [],
            totalCaloriesBurned: supabaseStats?.total_calories_burned || '0',
            totalWorkoutTime: supabaseStats?.total_workout_time ? `${Math.round(supabaseStats.total_workout_time / 60)}h` : '0h',
            goalsCompleted: 0
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser(null);
      }
    })();

    // Load subscription data
    const loadSubscription = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const u = JSON.parse(userData);
          const userId = u?.id || u?.principalId;
          
          if (userId) {
            await paymentService.initialize();
            const subscriptionData = await paymentService.getUserSubscription(userId);
            
            if (subscriptionData.success) {
              setSubscription(subscriptionData.subscription);
            }
          }
        }
      } catch (error) {
        console.error('Error loading subscription data:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    loadSubscription();
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

  const handleLogout = () => {
    navigate('/login-screen');
  };

  const handleUpdateUser = async (updatedUser) => {
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    try {
      const { updateUserProfile } = await import('../../utils/db');
      await updateUserProfile(updatedUser.id, updatedUser);
    } catch {}
  };

  const handleUpdateMetrics = async (metrics) => {
    const updatedUser = { ...user, ...metrics };
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update Supabase
    try {
      const supabaseUpdates = {};
      if (metrics.age !== undefined) supabaseUpdates.age = metrics.age;
      if (metrics.height !== undefined) supabaseUpdates.height = metrics.height;
      if (metrics.weight !== undefined) supabaseUpdates.weight = metrics.weight;
      if (metrics.fitnessLevel !== undefined) supabaseUpdates.fitness_level = metrics.fitnessLevel;
      if (metrics.goals !== undefined) supabaseUpdates.goals = metrics.goals;
      
      if (Object.keys(supabaseUpdates).length > 0 && user?.id) {
        console.log('📤 Updating Supabase with metrics:', supabaseUpdates);
        await updateUser(user.id, supabaseUpdates);
        console.log('✅ Supabase updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating Supabase:', error);
    }
  };


  const handleProfilePictureUpdate = async (newPicture) => {
    const updatedUser = { ...user, profilePicture: newPicture };
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    try {
      if (user?.id) await updateUserProfile(user.id, { profilePicture: newPicture });
    } catch {}
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'User' },
    { id: 'metrics', label: 'Fitness Metrics', icon: 'Activity' },
    { id: 'subscription', label: 'Subscription', icon: 'CreditCard' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoTab user={user} onUpdateUser={handleUpdateUser} />;
      case 'metrics':
        return <FitnessMetricsTab user={user} onUpdateMetrics={handleUpdateMetrics} />;
      case 'subscription':
        return renderSubscriptionTab();
      default:
        return <PersonalInfoTab user={user} onUpdateUser={handleUpdateUser} />;
    }
  };

  const renderSubscriptionTab = () => {
    if (isLoadingSubscription) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Loading subscription...</span>
        </div>
      );
    }

    const handleUpgrade = () => {
      navigate('/pricing');
    };

    const handleCancelSubscription = async () => {
      if (!subscription?.id) return;
      
      const confirmed = window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.');
      
      if (confirmed) {
        try {
          const result = await paymentService.cancelSubscription(subscription.id);
          if (result.success) {
            alert('Subscription cancelled successfully.');
            // Reload subscription data
            const subscriptionData = await paymentService.getUserSubscription(user.id);
            if (subscriptionData.success) {
              setSubscription(subscriptionData.subscription);
            }
          } else {
            alert('Failed to cancel subscription: ' + result.error);
          }
        } catch (error) {
          console.error('Error cancelling subscription:', error);
          alert('An error occurred while cancelling your subscription.');
        }
      }
    };

    return (
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-[rgba(255,138,0,0.05)] dark:bg-[#181818] border-2 border-[#FF8A00] rounded-[32px] p-8">
          <h3 className="text-xl font-semibold text-[#232323] dark:text-white mb-4">Current Plan</h3>
          
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-[#232323] dark:text-white">{subscription.plan}</h4>
                  <p className="text-gray-400 capitalize">Status: {subscription.status}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#FF8A00]">
                    ${paymentService.getSubscriptionPlanDetails(subscription.plan)?.price || 'N/A'}/month
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Started:</span>
                  <p className="text-[#232323] dark:text-white">
                    {new Date(Number(subscription.createdAt) / 1000000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Next Billing:</span>
                  <p className="text-[#232323] dark:text-white">
                    {subscription.status === 'Active' ? 'Monthly' : 'N/A'}
                  </p>
                </div>
              </div>

              {subscription.status === 'Active' && (
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CreditCard" className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-[#232323] dark:text-white mb-2">Free Plan</h4>
              <p className="text-[#232323] dark:text-white mb-6">You're currently on the free plan. Upgrade to unlock premium features!</p>
              <button
                disabled
                className="px-6 py-3 bg-gray-400 text-gray-600 font-semibold rounded-xl shadow-lg cursor-not-allowed opacity-50"
              >
                Upgrade to Premium
              </button>
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="bg-[rgba(255,138,0,0.05)] dark:bg-[#181818] border-2 border-[#FF8A00] rounded-[32px] p-8">
          <h3 className="text-xl font-semibold text-[#232323] dark:text-white mb-4">Plan Features</h3>
          
          {subscription ? (
            <div className="space-y-3">
              {paymentService.getSubscriptionPlanDetails(subscription.plan)?.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
                <span className="text-[#232323] dark:text-white">10 hours of workout tracking per month</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
                <span className="text-[#232323] dark:text-white">100 AI chatbot messages per month</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
                <span className="text-[#232323] dark:text-white">50 food scans per month</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
                <span className="text-[#232323] dark:text-white">Basic workout library access</span>
              </div>
            </div>
          )}
        </div>

        {/* Plan Usage & Upgrade Section */}
        <div className="bg-[rgba(255,138,0,0.05)] dark:bg-[#181818] border-2 border-[#FF8A00] rounded-[32px] p-8 mt-6">
          <h3 className="text-xl font-semibold text-[#232323] dark:text-white mb-4 flex items-center">
            <span className="mr-2">Plan Usage</span>
            <span className="w-3 h-3 bg-[#FF8A00] rounded-full animate-pulse"></span>
          </h3>
          {/* Replace with actual tracked usage if you have it, else fallback */}
          <div className="space-y-4">
            {/* Example: For free plan limits + usage for THIS billing period */}
            <div className="flex items-center mb-2">
              <span className="min-w-[120px] font-medium text-[#232323] dark:text-white">Chatbot Messages</span>
              <div className="flex-1 flex items-center">
                <div className="w-full bg-black/20 rounded h-3 mx-3">
                  <div className="bg-gradient-to-r from-[#FFB340] to-[#FF8A00] h-3 rounded" style={{ width: '45%' }}></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">45 / 100</span>
                <span className="text-xs text-[#FF8A00] ml-2">45%</span>
              </div>
            </div>
            <div className="flex items-center mb-2">
              <span className="min-w-[120px] font-medium text-[#232323] dark:text-white">Workout Tracking</span>
              <div className="flex-1 flex items-center">
                <div className="w-full bg-black/20 rounded h-3 mx-3">
                  <div className="bg-gradient-to-r from-[#ffdea9] to-[#FF8A00] h-3 rounded" style={{ width: '70%' }}></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">7 / 10 hrs</span>
                <span className="text-xs text-[#FF8A00] ml-2">70%</span>
              </div>
            </div>
            <div className="flex items-center mb-2">
              <span className="min-w-[120px] font-medium text-[#232323] dark:text-white">Food Scans</span>
              <div className="flex-1 flex items-center">
                <div className="w-full bg-black/20 rounded h-3 mx-3">
                  <div className="bg-gradient-to-r from-[#ffdea9] to-[#FF8A00] h-3 rounded" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">30 / 50</span>
                <span className="text-xs text-[#FF8A00] ml-2">60%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Upgrade Options */}
        {!subscription && (
          <div className="bg-gradient-to-r from-[#FF8A00]/10 to-[#E67B00]/10 border border-[#FF8A00]/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-[#232323] dark:text-white mb-4">Available Upgrades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F3F3F6] dark:bg-[#232323] border-2 border-[#FF8A00] rounded-lg p-4">
                <h4 className="font-semibold text-[#232323] dark:text-white mb-2">Premium</h4>
                <p className="text-2xl font-bold text-[#FF8A00] mb-2">$9.99/month</p>
                <p className="text-[#232323] dark:text-gray-200 text-sm mb-4">Enhanced features for serious fitness enthusiasts</p>
                <button
                  disabled
                  className="w-full py-3 bg-gray-400 text-gray-600 font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-50"
                >
                  Choose Premium
                </button>
              </div>
              <div className="bg-[#F3F3F6] dark:bg-[#232323] border-2 border-[#FF8A00] rounded-lg p-4">
                <h4 className="font-semibold text-[#232323] dark:text-white mb-2">Premium Plus</h4>
                <p className="text-2xl font-bold text-[#FF8A00] mb-2">$19.99/month</p>
                <p className="text-[#232323] dark:text-gray-200 text-sm mb-4">Unlimited access to all features</p>
                <button
                  disabled
                  className="w-full py-3 bg-gray-400 text-gray-600 font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-50"
                >
                  Choose Premium Plus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const safeUser = user || {
    id: 0,
    name: 'New User',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
    profilePicture: '',
    joinDate: new Date().toISOString().slice(0,10),
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: 0,
    thisWeekWorkouts: 0,
    thisMonthWorkouts: 0,
    age: '',
    height: '',
    weight: '',
    fitnessLevel: 'beginner',
    primaryGoal: '',
    totalCaloriesBurned: '0',
    totalWorkoutTime: '0h',
    goalsCompleted: 0
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={handleThemeToggle}
        currentTheme={currentTheme}
         user={user || { name: 'New User', email: '' }}
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
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <Icon name="ChevronRight" size={16} />
            <span className="text-foreground font-medium">Profile</span>
          </nav>
          {/* Profile Header */}
          <ProfileHeader 
            user={safeUser} 
            onProfilePictureUpdate={handleProfilePictureUpdate}
          />

          {/* Tab Navigation */}
          <div className="bg-card border border-border rounded-lg mb-6">
            {/* Mobile Tab Selector */}
            <div className="lg:hidden border-b border-border">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e?.target?.value)}
                className="w-full p-4 bg-transparent text-card-foreground font-medium focus:outline-none"
              >
                {tabs?.map((tab) => (
                  <option key={tab?.id} value={tab?.id}>
                    {tab?.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Tab Navigation */}
            <div className="hidden lg:flex border-b border-border">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === tab?.id
                      ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon name={tab?.icon} size={18} />
                  <span>{tab?.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default UserProfile;