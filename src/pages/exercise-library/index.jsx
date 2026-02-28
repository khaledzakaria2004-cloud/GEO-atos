import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import ExerciseCard from '../dashboard/components/ExerciseCard';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import PresetPlans from './components/PresetPlans';
import WorkoutPlanBuilder from './components/WorkoutPlanBuilder';

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark'); // Default to dark mode
  const [filter, setFilter] = useState('all'); // all, beginner, intermediate, advanced
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('exercises'); // exercises, plans, create
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [customPlans, setCustomPlans] = useState([]);

  // Mock exercise data (same as dashboard)
  const exercises = [
    {
      id: 1,
      name: "Push-ups",
      targetMuscles: "Chest, Arms, Core",
      difficulty: "Beginner",
      duration: 8,
      caloriesBurn: 45,
      sets: 3,
      reps: 15,
      description: "Classic upper body exercise targeting chest, shoulders, and triceps with core engagement."
    },
    {
      id: 11,
      name: "Wide Push Ups",
      targetMuscles: "Chest (outer), Shoulders, Triceps",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 50,
      sets: 3,
      reps: 12,
      description: "Wider hand placement variations of push-ups emphasizing outer chest and shoulder engagement."
    },
    {
      id: 16,
      name: "Straight Arm Plank",
      targetMuscles: "Core, Shoulders",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 35,
      sets: 3,
      reps: "30s",
      description: "Isometric plank variation performed on straight arms, targeting core and shoulders."
    },
    {
      id: 17,
      name: "Reverse Straight Arm Plank",
      targetMuscles: "Core, Posterior Chain",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 35,
      sets: 3,
      reps: "30s",
      description: "Isometric plank variation performed on straight arms facing upwards, targeting core and posterior chain."
    },
    {
      id: 18,
      name: "Knee Plank",
      targetMuscles: "Core, Shoulders",
      difficulty: "Beginner",
      duration: 6,
      caloriesBurn: 20,
      sets: 3,
      reps: "20s",
      description: "Modified plank performed with knees on the ground to reduce load while focusing on core engagement."
    },
    {
      id: 12,
      name: "Narrow Push Ups",
      targetMuscles: "Chest (inner), Triceps, Core",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 50,
      sets: 3,
      reps: 12,
      description: "Close-hand push-up variation focusing on triceps and inner chest activation."
    },
    {
      id: 13,
      name: "Diamond Push Ups",
      targetMuscles: "Triceps, Chest, Core",
      difficulty: "Advanced",
      duration: 8,
      caloriesBurn: 55,
      sets: 3,
      reps: 10,
      description: "Hands form a diamond under chest to emphasize triceps and inner chest engagement."
    },
    {
      id: 14,
      name: "Knee Push Ups",
      targetMuscles: "Chest, Arms, Core",
      difficulty: "Beginner",
      duration: 6,
      caloriesBurn: 30,
      sets: 3,
      reps: 12,
      description: "Modified push-up performed from the knees to reduce load and focus on form."
    },
    {
      id: 2,
      name: "Squats",
      targetMuscles: "Legs, Glutes, Core",
      difficulty: "Beginner",
      duration: 10,
      caloriesBurn: 60,
      sets: 3,
      reps: 20,
      description: "Fundamental lower body movement strengthening quadriceps, glutes, and core muscles."
    },
    {
      id: 3,
      name: "Lunges",
      targetMuscles: "Legs, Glutes, Balance",
      difficulty: "Intermediate",
      duration: 12,
      caloriesBurn: 70,
      sets: 3,
      reps: 12,
      description: "Unilateral leg exercise improving balance, strength, and coordination."
    },
    {
      id: 4,
      name: "Burpees",
      targetMuscles: "Full Body, Cardio",
      difficulty: "Advanced",
      duration: 15,
      caloriesBurn: 120,
      sets: 3,
      reps: 10,
      description: "High-intensity full-body exercise combining strength and cardiovascular training."
    },
    {
      id: 5,
      name: "Sit-Ups",
      targetMuscles: "Core, Abs",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 80,
      sets: 3,
      reps: 20,
      description: "Dynamic core exercise with cardiovascular benefits and upper body engagement."
    },
    {
      id: 6,
      name: "Jumping Jacks",
      targetMuscles: "Full Body, Cardio",
      difficulty: "Beginner",
      duration: 6,
      caloriesBurn: 50,
      sets: 3,
      reps: 30,
      description: "Classic cardio exercise improving coordination and cardiovascular endurance."
    },
    {
      id: 7,
      name: "High Knees",
      targetMuscles: "Legs, Core, Cardio",
      difficulty: "Beginner",
      duration: 5,
      caloriesBurn: 40,
      sets: 3,
      reps: 25,
      description: "Running-in-place variation focusing on leg strength and cardiovascular fitness."
    },
    {
      id: 8,
      name: "Plank",
      targetMuscles: "Core, Shoulders, Back",
      difficulty: "Intermediate",
      duration: 10,
      caloriesBurn: 35,
      sets: 3,
      reps: "30s",
      description: "Isometric core exercise building strength and stability throughout the torso."
    },
    {
      id: 9,
      name: "Side Plank",
      targetMuscles: "Core, Obliques, Shoulders",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 30,
      sets: 3,
      reps: "20s",
      description: "Lateral core strengthening exercise targeting obliques and lateral stability."
    },
    {
      id: 18,
      name: "Reverse Plank",
      targetMuscles: "Core, Glutes, Hamstrings",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 40,
      sets: 3,
      reps: "30s",
      description: "An excellent exercise for strengthening the entire posterior chain, including the glutes, hamstrings, and lower back."
    },
    {
      id: 10,
      name: "Wall Sit",
      targetMuscles: "Legs, Glutes, Core",
      difficulty: "Beginner",
      duration: 7,
      caloriesBurn: 25,
      sets: 3,
      reps: "30s",
      description: "Isometric leg exercise building endurance in quadriceps and glutes."
    }
  ];

  // Load theme preference and custom plans
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }

    // Load custom plans from localStorage
    const savedPlans = localStorage.getItem('atos_custom_plans');
    if (savedPlans) {
      setCustomPlans(JSON.parse(savedPlans));
    }
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('theme');
    navigate('/login-screen');
  };

  const handleSavePlan = (plan) => {
    const updatedPlans = [...customPlans, plan];
    setCustomPlans(updatedPlans);
    localStorage.setItem('atos_custom_plans', JSON.stringify(updatedPlans));
  };

  const handleDeletePlan = (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      const updatedPlans = customPlans.filter(plan => plan.id !== planId);
      setCustomPlans(updatedPlans);
      localStorage.setItem('atos_custom_plans', JSON.stringify(updatedPlans));
    }
  };

  const handleStartPlan = (plan) => {
    // Navigate to workout screen with the selected plan
    navigate('/exercise-workout-screen', { 
      state: { 
        selectedPlan: plan,
        todayPlan: {
          name: plan.name,
          exercises: plan.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            duration: ex.duration,
            completed: false
          }))
        }
      }
    });
  };

  // Filter and search exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesFilter = filter === 'all' || exercise.difficulty.toLowerCase() === filter.toLowerCase();
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.targetMuscles.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort exercises by difficulty Beginner -> Intermediate -> Advanced
  const difficultyOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
  const sortedExercises = [...filteredExercises].sort((a, b) => 
    (difficultyOrder[a.difficulty] ?? 3) - (difficultyOrder[b.difficulty] ?? 3)
  );

  const getDifficultyCount = (difficulty) => {
    return exercises.filter(ex => ex.difficulty === difficulty).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={handleThemeToggle}
        currentTheme={currentTheme}
        user={JSON.parse(localStorage.getItem('user') || '{}')}
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Exercise Library</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Browse exercises, preset plans, or create your own workout plans
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              iconName="ArrowLeft"
              iconPosition="left"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="bg-card border border-border rounded-lg p-2 sm:p-1 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('exercises')}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-md text-base sm:text-sm font-medium transition-colors ${
                  activeTab === 'exercises' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="Dumbbell" size={20} className="mr-2 inline" />
                Exercises
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-md text-base sm:text-sm font-medium transition-colors ${
                  activeTab === 'plans' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="Calendar" size={20} className="mr-2 inline" />
                Preset Plans
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-md text-base sm:text-sm font-medium transition-colors ${
                  activeTab === 'create' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name="Plus" size={20} className="mr-2 inline" />
                Create Plan
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'exercises' && (
            <>
              {/* Search and Filter */}
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Icon name="Search" size={22} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search exercises by name, muscles, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-card-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Difficulty Filter */}
                  <div className="flex items-center flex-wrap gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      All ({exercises.length})
                    </Button>
                    <Button
                      variant={filter === 'beginner' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('beginner')}
                    >
                      Beginner ({getDifficultyCount('Beginner')})
                    </Button>
                    <Button
                      variant={filter === 'intermediate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('intermediate')}
                    >
                      Intermediate ({getDifficultyCount('Intermediate')})
                    </Button>
                    <Button
                      variant={filter === 'advanced' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('advanced')}
                    >
                      Advanced ({getDifficultyCount('Advanced')})
                    </Button>
                  </div>
                </div>
              </div>

              {/* Exercise Grid */}
              <div className="mb-6">
                {sortedExercises.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedExercises.map((exercise) => (
                      <ExerciseCard key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">
                      No exercises found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search or filter criteria
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'plans' && (
            <PresetPlans onStartPlan={handleStartPlan} />
          )}

          {activeTab === 'create' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Create Custom Workout Plan</h2>
                <p className="text-muted-foreground mb-6">Build your own personalized workout plan</p>
                <Button
                  onClick={() => setShowPlanBuilder(true)}
                  size="lg"
                  iconName="Plus"
                  iconPosition="left"
                >
                  Start Building Plan
                </Button>
              </div>

              {/* Custom Plans */}
              {customPlans.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">Your Custom Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customPlans.map((plan) => (
                      <div key={plan.id} className="bg-card border border-border rounded-lg p-4 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                          title="Delete Plan"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                        <h4 className="font-semibold text-card-foreground mb-2 pr-8">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                        <div className="text-xs text-muted-foreground mb-3">
                          {plan.exercises.length} exercises
                        </div>
                        <Button
                          onClick={() => handleStartPlan(plan)}
                          size="sm"
                          className="w-full"
                        >
                          Start Plan
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plan Builder Modal */}
          {showPlanBuilder && (
            <WorkoutPlanBuilder
              exercises={exercises}
              onSavePlan={handleSavePlan}
              onClose={() => setShowPlanBuilder(false)}
            />
          )}

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} FitCoach AI. All rights reserved.</p>
              <p className="mt-2">Your AI-powered fitness companion for a healthier lifestyle.</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ExerciseLibrary;
