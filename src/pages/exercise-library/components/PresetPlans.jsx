import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PresetPlans = ({ onStartPlan }) => {
  const presetPlans = [
    {
      id: 'lower-body',
      name: 'Lower Body Strength',
      description: 'Build strong legs and glutes with this comprehensive lower body workout',
      difficulty: 'Intermediate',
      duration: '45 minutes',
      exercises: [
        { name: 'Squats', sets: 4, reps: 15, rest: '60s' },
        { name: 'Lunges', sets: 3, reps: 12, rest: '45s' },
        { name: 'Wall Sit', sets: 3, reps: '45s', rest: '60s' },
        { name: 'Jumping Jacks', sets: 3, reps: 30, rest: '30s' },
        { name: 'High Knees', sets: 3, reps: 25, rest: '30s' }
      ],
      targetMuscles: 'Legs, Glutes, Core',
      calories: 350,
      color: 'bg-green-500'
    },
    {
      id: 'upper-body',
      name: 'Upper Body Power',
      description: 'Develop chest, arms, and shoulders with this upper body focused routine',
      difficulty: 'Intermediate',
      duration: '40 minutes',
      exercises: [
        { name: 'Push-ups', sets: 4, reps: 15, rest: '60s' },
        { name: 'Wide Push Ups', sets: 3, reps: 12, rest: '45s' },
        { name: 'Narrow Push Ups', sets: 3, reps: 10, rest: '45s' },
        { name: 'Diamond Push Ups', sets: 3, reps: 8, rest: '60s' },
        { name: 'Plank', sets: 3, reps: '45s', rest: '60s' }
      ],
      targetMuscles: 'Chest, Arms, Shoulders, Core',
      calories: 300,
      color: 'bg-blue-500'
    },
    {
      id: 'core-focused',
      name: 'Core Crusher',
      description: 'Strengthen your entire core with this intensive ab and stability workout',
      difficulty: 'Advanced',
      duration: '35 minutes',
      exercises: [
        { name: 'Plank', sets: 4, reps: '60s', rest: '45s' },
        { name: 'Side Plank', sets: 3, reps: '30s each', rest: '30s' },
        { name: 'Sit-Ups', sets: 4, reps: 20, rest: '45s' },
        { name: 'Straight Arm Plank', sets: 3, reps: '45s', rest: '60s' },
        { name: 'Reverse Plank', sets: 3, reps: '30s', rest: '45s' }
      ],
      targetMuscles: 'Core, Abs, Obliques',
      calories: 280,
      color: 'bg-purple-500'
    },
    {
      id: 'full-body',
      name: 'Full Body Blast',
      description: 'Complete full-body workout targeting all major muscle groups',
      difficulty: 'Advanced',
      duration: '50 minutes',
      exercises: [
        { name: 'Burpees', sets: 4, reps: 12, rest: '90s' },
        { name: 'Squats', sets: 3, reps: 20, rest: '60s' },
        { name: 'Push-ups', sets: 3, reps: 15, rest: '60s' },
        { name: 'Lunges', sets: 3, reps: 12, rest: '45s' },
        { name: 'Plank', sets: 3, reps: '45s', rest: '60s' },
        { name: 'Jumping Jacks', sets: 3, reps: 30, rest: '30s' }
      ],
      targetMuscles: 'Full Body',
      calories: 450,
      color: 'bg-red-500'
    },
    {
      id: 'beginner-friendly',
      name: 'Beginner Foundation',
      description: 'Perfect starting point for fitness beginners with modified exercises',
      difficulty: 'Beginner',
      duration: '30 minutes',
      exercises: [
        { name: 'Knee Push Ups', sets: 3, reps: 10, rest: '60s' },
        { name: 'Wall Sit', sets: 3, reps: '30s', rest: '60s' },
        { name: 'Knee Plank', sets: 3, reps: '20s', rest: '45s' },
        { name: 'Jumping Jacks', sets: 3, reps: 20, rest: '30s' },
        { name: 'High Knees', sets: 3, reps: 15, rest: '30s' }
      ],
      targetMuscles: 'Full Body (Beginner)',
      calories: 200,
      color: 'bg-green-400'
    },
    {
      id: 'cardio-intense',
      name: 'Cardio Challenge',
      description: 'High-intensity cardio workout to boost endurance and burn calories',
      difficulty: 'Advanced',
      duration: '25 minutes',
      exercises: [
        { name: 'Burpees', sets: 5, reps: 15, rest: '60s' },
        { name: 'Jumping Jacks', sets: 4, reps: 40, rest: '30s' },
        { name: 'High Knees', sets: 4, reps: 30, rest: '30s' },
        { name: 'Mountain Climbers', sets: 3, reps: 20, rest: '45s' }
      ],
      targetMuscles: 'Cardio, Full Body',
      calories: 400,
      color: 'bg-orange-500'
    }
  ];

  const PlanCard = ({ plan }) => (
    <div className="bg-card border border-border rounded-lg p-5 sm:p-6 hover:shadow-elevation-2 transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${plan.color}`}></div>
            <h3 className="text-lg font-semibold text-card-foreground">{plan.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
          <div className="flex items-center flex-wrap gap-3 text-xs sm:text-xs text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Icon name="Clock" size={18} />
              <span>{plan.duration}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="Zap" size={18} />
              <span>{plan.calories} cal</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="Target" size={18} />
              <span>{plan.targetMuscles}</span>
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          plan.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
          plan.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {plan.difficulty}
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-card-foreground mb-2">Exercises ({plan.exercises.length})</h4>
        <div className="space-y-1">
          {plan.exercises.slice(0, 3).map((exercise, index) => (
            <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{exercise.name}</span>
              <span>{exercise.sets} sets × {exercise.reps}</span>
            </div>
          ))}
          {plan.exercises.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{plan.exercises.length - 3} more exercises
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={() => onStartPlan(plan)}
        className="w-full"
        iconName="Play"
        iconPosition="left"
      >
        Start Plan
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Preset Workout Plans</h2>
        <p className="text-muted-foreground">Choose from our professionally designed workout plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presetPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
};

export default PresetPlans;
