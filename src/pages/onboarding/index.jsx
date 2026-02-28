import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import { updateUserProfile } from '../../utils/db';
import fullBodyImg from './full body.png';
import shouldersImg from './shoulders.png';
import bicepsImg from './biceps.png';
import backImg from './back.png';
import chestImg from './chest.png';
import coreImg from './core.png';
import glutesImg from './glutes.png';
import legsImg from './legs.png';
import veryThinImg from './رفيع.webp';
import slightlyThinImg from './زياده بسيطه.webp';
import normalImg from './معتدل.webp';
import overweightImg from './وزن زائد.webp';
import fatImg from './سمين.webp';
import highObesityImg from './سمنه عاليه.webp';
import extremeObesityImg from './سمنه مفرطه.webp';

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, principal } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '', // New field for gender selection
    bodyWeight: 70, // New field for body weight in kg (default 70 kg)
    alignmentScore: 0, // New field for alignment with service (1-5 scale)
    physique: '', // New field for physique goal (lean, muscular, ripped)
    successMetrics: [], // New field for fitness success metrics (can select multiple)
    focusAreas: [], // New field for body focus areas (can select multiple)
    workoutTime: '', // New field for preferred workout time
    age: 30,
    height: 175,
    weight: 70,
    fitnessLevel: 'intermediate',
    goals: [],
  });

  const totalSteps = 11; // Updated: Name, Gender, Body Weight, Physique, Measurements, Focus Areas, Workout Time, Fitness Level, Alignment Score, Success Metrics, Benefits & Chart

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Check if user already completed onboarding
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.name && user.email && !user.skippedOnboarding) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setFormData(prev => ({ ...prev, ...user }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const userProfile = {
        ...formData,
        principalId: principal?.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('user', JSON.stringify({ id: principal?.toString(), ...userProfile }));
      await updateUserProfile(principal?.toString(), userProfile);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to save user profile:', error);
      navigate('/dashboard', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const fitnessLevelOptions = [
    { value: 'beginner', label: 'Beginner - New to fitness' },
    { value: 'intermediate', label: 'Intermediate - Some experience' },
    { value: 'advanced', label: 'Advanced - Regular exerciser' },
  ];

  const goalOptions = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'endurance', label: 'Build Endurance' },
    { value: 'strength', label: 'Increase Strength' },
    { value: 'general_fitness', label: 'General Fitness' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to ATOS-fit!</h2>
              <p className="text-muted-foreground">Let's get to know you.</p>
            </div>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
              <Input
                label="Email Address (Optional)"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email (optional)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Gender</h2>
              <p className="text-muted-foreground">Help us personalize your experience</p>
            </div>
            <div className="flex gap-6 justify-center">
              {/* Male Option */}
              <button
                onClick={() => handleInputChange('gender', 'male')}
                className={`flex flex-col items-center space-y-3 p-6 rounded-xl border-2 transition-all ${formData.gender === 'male'
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                  }`}
              >
                <div
                  className="w-32 h-32 rounded-lg overflow-hidden bg-cover bg-center"
                  style={{
                    backgroundImage: 'url(https://media.craiyon.com/2025-04-08/ZNEwVZXCQWWnQsrUfh71tA.webp)',
                  }}
                />
                <div className="flex items-center space-x-2">
                  <Icon name="User" size={24} />
                  <span className="text-lg font-medium">Male</span>
                </div>
              </button>

              {/* Female Option */}
              <button
                onClick={() => handleInputChange('gender', 'female')}
                className={`flex flex-col items-center space-y-3 p-6 rounded-xl border-2 transition-all ${formData.gender === 'female'
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                  }`}
              >
                <div
                  className="w-32 h-32 rounded-lg overflow-hidden bg-cover bg-center"
                  style={{
                    backgroundImage: 'url(https://tse1.mm.bing.net/th/id/OIP.RYspvTcnmOVdsdMZFSnWOQHaE7?rs=1&pid=ImgDetMain&o=7&rm=3)',
                  }}
                />
                <div className="flex items-center space-x-2">
                  <Icon name="User" size={24} />
                  <span className="text-lg font-medium">Female</span>
                </div>
              </button>
            </div>
          </div>
        );

      case 3:
        // Determine weight category and image based on current weight
        let weightCategory = '';
        let categoryImage = veryThinImg;

        if (formData.bodyWeight < 50) {
          weightCategory = 'Very Thin';
          categoryImage = veryThinImg;
        } else if (formData.bodyWeight < 65) {
          weightCategory = 'Normal';
          categoryImage = normalImg;
        } else if (formData.bodyWeight < 80) {
          weightCategory = 'Slightly Thin';
          categoryImage = slightlyThinImg;
        } else if (formData.bodyWeight < 95) {
          weightCategory = 'Overweight';
          categoryImage = overweightImg;
        } else if (formData.bodyWeight < 110) {
          weightCategory = 'Fat';
          categoryImage = fatImg;
        } else if (formData.bodyWeight < 130) {
          weightCategory = 'High Obesity';
          categoryImage = highObesityImg;
        } else {
          weightCategory = 'Extreme Obesity';
          categoryImage = extremeObesityImg;
        }

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">What's your current body weight?</h2>
              <p className="text-muted-foreground">Help us understand your starting point</p>
            </div>
            <div className="flex flex-col items-center space-y-6">
              {/* Current Image and Weight Display */}
              <div className="w-full">
                <div className="mx-auto w-40 h-40 rounded-lg overflow-hidden bg-cover bg-center border-2 border-primary">
                  <img
                    src={categoryImage}
                    alt={weightCategory}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-3xl font-bold text-primary">{Math.round(formData.bodyWeight)} kg</p>
                  <p className="text-lg font-semibold text-foreground mt-2">{weightCategory}</p>
                </div>
              </div>

              {/* Weight Input Slider - Continuous */}
              <div className="w-full space-y-4">
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="1"
                  value={formData.bodyWeight}
                  onChange={(e) => handleInputChange('bodyWeight', parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #3b82f6 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>30 kg</span>
                  <span>80 kg</span>
                  <span>130 kg</span>
                  <span>200 kg</span>
                </div>
              </div>

              {/* Weight Range Labels */}
              <div className="grid grid-cols-4 gap-2 text-center w-full">
                <div className="text-xs">
                  <p className="font-semibold text-red-500">Very Thin</p>
                  <p className="text-xs text-muted-foreground">&lt;50 kg</p>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-yellow-500">Slightly Thin</p>
                  <p className="text-xs text-muted-foreground">50-65 kg</p>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-green-500">Normal</p>
                  <p className="text-xs text-muted-foreground">65-80 kg</p>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-blue-500">Overweight+</p>
                  <p className="text-xs text-muted-foreground">&gt;80 kg</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">What type of physique are you aiming for?</h2>
              <p className="text-muted-foreground">Choose your fitness goal</p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              {[
                {
                  id: 'lean',
                  label: 'Lean',
                  description: 'Visible musculature, some lean mass',
                  image: 'https://zing-gym.coach/0.113.0/lean-052083f9.webp'
                },
                {
                  id: 'muscular',
                  label: 'Muscular',
                  description: 'Prominent musculature and lean mass',
                  image: 'https://zing-gym.coach/0.113.0/muscular-19e61397.webp'
                },
                {
                  id: 'ripped',
                  label: 'Ripped',
                  description: 'Extensive musculature, high lean mass',
                  image: 'https://zing-gym.coach/0.113.0/ripped-c8a533a3.webp'
                }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleInputChange('physique', type.id)}
                  className={`flex flex-col items-center space-y-3 p-6 rounded-xl border-2 transition-all max-w-xs ${formData.physique === type.id
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div
                    className="w-40 h-48 rounded-lg overflow-hidden bg-cover bg-center border border-primary/30"
                    style={{
                      backgroundImage: `url(${type.image})`,
                    }}
                  />
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-foreground mb-1">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  {formData.physique === type.id && (
                    <Icon name="Check" size={24} className="text-primary absolute top-4 right-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Which areas would you like to focus on?</h2>
              <p className="text-muted-foreground">Select one or more areas</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'fullbody', label: 'Full Body', image: fullBodyImg },
                { id: 'shoulders', label: 'Shoulders', image: shouldersImg },
                { id: 'biceps', label: 'Biceps', image: bicepsImg },
                { id: 'back', label: 'Back', image: backImg },
                { id: 'chest', label: 'Chest', image: chestImg },
                { id: 'core', label: 'Core', image: coreImg },
                { id: 'glutes', label: 'Glutes', image: glutesImg },
                { id: 'legs', label: 'Legs', image: legsImg },
              ].map((area) => (
                <button
                  key={area.id}
                  onClick={() => {
                    const newFocusAreas = formData.focusAreas.includes(area.id)
                      ? formData.focusAreas.filter(f => f !== area.id)
                      : [...formData.focusAreas, area.id];
                    handleInputChange('focusAreas', newFocusAreas);
                  }}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-all ${formData.focusAreas.includes(area.id)
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div
                    className="w-24 h-24 rounded-lg overflow-hidden bg-cover bg-center border border-primary/30"
                    style={{
                      backgroundImage: `url(${area.image})`,
                    }}
                  />
                  <span className="text-sm font-semibold text-foreground text-center">{area.label}</span>
                  {formData.focusAreas.includes(area.id) && (
                    <Icon name="Check" size={16} className="text-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Info Card */}
            <div className="bg-muted rounded-lg p-4 mt-6">
              <p className="text-sm text-muted-foreground mb-2">💡 You can select multiple areas</p>
              <p className="text-xs text-muted-foreground">We'll personalize your workouts to focus on these areas.</p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Tell us about yourself</h2>
              <p className="text-muted-foreground">Help us personalize your fitness plan</p>
            </div>
            <div className="space-y-6">
              {/* Height Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Height</label>
                  <span className="text-2xl font-bold text-primary">{formData.height} cm</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="220"
                  step="1"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #06b6d4 50%, #10b981 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>140 cm</span>
                  <span>180 cm</span>
                  <span>220 cm</span>
                </div>
              </div>

              {/* Age Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Age</label>
                  <span className="text-2xl font-bold text-primary">{formData.age} years</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="80"
                  step="1"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #f97316 50%, #ef4444 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 years</span>
                  <span>48 years</span>
                  <span>80 years</span>
                </div>
              </div>

              {/* Target Weight Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Target Weight</label>
                  <span className="text-2xl font-bold text-primary">{formData.weight} kg</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #ec4899 0%, #f97316 33%, #eab308 66%, #22c55e 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30 kg</span>
                  <span>115 kg</span>
                  <span>200 kg</span>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-muted rounded-lg p-4 mt-6">
                <p className="text-sm text-muted-foreground mb-2">Your Profile Summary:</p>
                <div className="space-y-1 text-foreground">
                  <p className="text-sm">📏 Height: <span className="font-semibold">{formData.height} cm</span></p>
                  <p className="text-sm">🎂 Age: <span className="font-semibold">{formData.age} years</span></p>
                  <p className="text-sm">🎯 Target Weight: <span className="font-semibold">{formData.weight} kg</span></p>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">When do you prefer to work out?</h2>
              <p className="text-muted-foreground">Choose your ideal workout time</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: 'early_morning',
                  label: '🌅 Early Morning',
                  time: '5:00 - 7:00 AM',
                  description: 'Start your day with energy and focus'
                },
                {
                  id: 'morning',
                  label: '☀️ Morning',
                  time: '7:00 - 10:00 AM',
                  description: 'Energize before your day begins'
                },
                {
                  id: 'midday',
                  label: '🌞 Midday',
                  time: '12:00 - 2:00 PM',
                  description: 'Break up your day with a workout'
                },
                {
                  id: 'afternoon',
                  label: '🌤️ Afternoon',
                  time: '3:00 - 5:00 PM',
                  description: 'Boost energy before evening'
                },
                {
                  id: 'evening',
                  label: '🌆 Evening',
                  time: '5:00 - 7:00 PM',
                  description: 'Wind down after work'
                },
                {
                  id: 'night',
                  label: '🌙 Night',
                  time: '7:00 - 9:00 PM',
                  description: 'Late night training session'
                },
              ].map((timeSlot) => (
                <button
                  key={timeSlot.id}
                  onClick={() => handleInputChange('workoutTime', timeSlot.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${formData.workoutTime === timeSlot.id
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{timeSlot.label}</h3>
                    {formData.workoutTime === timeSlot.id && (
                      <Icon name="Check" size={20} className="text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{timeSlot.time}</p>
                  <p className="text-sm text-foreground">{timeSlot.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">What's your fitness level?</h2>
              <p className="text-muted-foreground">Help us create the perfect plan for you</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: 'beginner',
                  label: '🟢 Beginner',
                  description: 'New to fitness or haven\'t exercised regularly',
                  details: 'Little to no experience with structured training'
                },
                {
                  id: 'intermediate',
                  label: '🟡 Intermediate',
                  description: 'Some exercise experience, training regularly',
                  details: 'Can perform basic exercises with proper form'
                },
                {
                  id: 'advanced',
                  label: '🔴 Advanced',
                  description: 'Regular training, familiar with complex movements',
                  details: 'Consistent training experience, good muscle control'
                },
              ].map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleInputChange('fitnessLevel', level.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${formData.fitnessLevel === level.id
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-lg">{level.label}</h3>
                    {formData.fitnessLevel === level.id && (
                      <Icon name="Check" size={20} className="text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-foreground font-medium mb-1">{level.description}</p>
                  <p className="text-xs text-muted-foreground">{level.details}</p>
                </button>
              ))}
            </div>

            {/* Info Card */}
            <div className="bg-muted rounded-lg p-4 mt-6">
              <p className="text-sm text-muted-foreground mb-2">💡 We'll adjust exercises based on your level</p>
              <p className="text-xs text-muted-foreground">You can change this anytime in your profile settings.</p>
            </div>
          </div>
        );

      case 9:
        const alignmentMessage = formData.alignmentScore >= 4
          ? "You're in the right place! ATOS-fit is designed exactly for people like you who want expert guidance without the guesswork."
          : "ATOS-fit will help you! Our personalized approach eliminates the confusion and gives you a clear, science-backed path forward.";

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">How true is this for you?</h2>
              <p className="text-muted-foreground">Rate your agreement with the statement below</p>
            </div>

            {/* Statement Card */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 mb-6">
              <p className="text-lg font-semibold text-foreground italic">
                "I want someone to just tell me exactly what exercises to do - I'm tired of guessing what's right."
              </p>
            </div>

            {/* Rating Scale */}
            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleInputChange('alignmentScore', rating)}
                    className={`w-12 h-12 rounded-lg font-bold text-lg transition-all border-2 ${formData.alignmentScore === rating
                        ? 'border-primary bg-primary text-white scale-110'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>Not at all</span>
                <span>Completely true</span>
              </div>
            </div>

            {/* Feedback Message */}
            {formData.alignmentScore > 0 && (
              <div className={`rounded-lg p-4 ${formData.alignmentScore >= 4
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-blue-500/10 border border-blue-500/30'
                }`}>
                <p className={`text-sm font-semibold ${formData.alignmentScore >= 4
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-blue-700 dark:text-blue-400'
                  }`}>
                  {alignmentMessage}
                </p>
              </div>
            )}
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Which of these is the best measure of fitness success?</h2>
              <p className="text-muted-foreground">Select what matters most to you</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: 'clothes_fit',
                  icon: '👕',
                  label: 'My clothes finally fit comfortably!',
                  description: 'Achieving your ideal fit and appearance'
                },
                {
                  id: 'two_weeks',
                  icon: '📅',
                  label: 'Completed a two weeks of workouts!',
                  description: 'Building consistency and discipline'
                },
                {
                  id: 'stairs',
                  icon: '🪜',
                  label: 'Climbed a flight of stairs without getting winded!',
                  description: 'Improving cardiovascular endurance'
                },
                {
                  id: 'sleep',
                  icon: '😴',
                  label: 'Got my best sleep in months last night!',
                  description: 'Better sleep quality and recovery'
                },
                {
                  id: 'focus',
                  icon: '🧠',
                  label: 'Actually feel focused and productive at work!',
                  description: 'Mental clarity and energy levels'
                },
                {
                  id: 'noticed_changes',
                  icon: '💬',
                  label: 'Someone just noticed changes in my body!',
                  description: 'Visible physical transformation'
                },
                {
                  id: 'energetic',
                  icon: '⚡',
                  label: 'Feel more energetic throughout the day!',
                  description: 'Sustained energy and vitality'
                },
              ].map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => {
                    const newMetrics = formData.successMetrics.includes(metric.id)
                      ? formData.successMetrics.filter(m => m !== metric.id)
                      : [...formData.successMetrics, metric.id];
                    handleInputChange('successMetrics', newMetrics);
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${formData.successMetrics.includes(metric.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <h3 className="font-semibold text-foreground">{metric.label}</h3>
                    </div>
                    {formData.successMetrics.includes(metric.id) && (
                      <Icon name="Check" size={20} className="text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground ml-11">{metric.description}</p>
                </button>
              ))}
            </div>

            {/* Info Card */}
            <div className="bg-muted rounded-lg p-4 mt-6">
              <p className="text-sm text-muted-foreground mb-2">💡 You can select multiple options</p>
              <p className="text-xs text-muted-foreground">These help us understand what success looks like for you.</p>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to Your Transformation</h2>
              <p className="text-muted-foreground">Discover what ATOS-fit will do for you</p>
            </div>

            {/* Benefits Section */}
            <div className="space-y-4">
              {/* Hormone Chart - FIRST */}
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-foreground mb-4 text-center">📊 Hormone Optimization</h3>
                <div className="w-full h-80 bg-gradient-to-br from-muted to-muted/50 rounded-lg p-6 flex items-center justify-center">
                  {/* Chart Container with Animation */}
                  <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      {/* Gradient for Testosterone */}
                      <linearGradient id="testosteroneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                      </linearGradient>

                      {/* Gradient for Cortisol */}
                      <linearGradient id="cortisolGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
                      </linearGradient>

                      {/* Animation Styles */}
                      <style>{`
                        @keyframes drawLine {
                          from {
                            stroke-dasharray: 1000;
                            stroke-dashoffset: 1000;
                          }
                          to {
                            stroke-dasharray: 1000;
                            stroke-dashoffset: 0;
                          }
                        }

                        @keyframes pulse {
                          0%, 100% {
                            opacity: 1;
                          }
                          50% {
                            opacity: 0.6;
                          }
                        }

                        @keyframes slideDown {
                          from {
                            opacity: 0;
                            transform: translateY(-20px);
                          }
                          to {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }

                        .testosterone-line {
                          animation: drawLine 2s ease-in-out forwards;
                          filter: drop-shadow(0 0 4px #3b82f6);
                        }

                        .cortisol-line {
                          animation: drawLine 2s ease-in-out forwards;
                          animation-delay: 0.3s;
                          filter: drop-shadow(0 0 4px #ef4444);
                        }

                        .chart-label {
                          animation: slideDown 1.5s ease-out forwards;
                          animation-delay: 1.5s;
                          opacity: 0;
                        }

                        .legend-dot {
                          animation: pulse 2s ease-in-out infinite;
                          animation-delay: 2s;
                        }

                        .axis-line {
                          opacity: 0.5;
                        }
                      `}</style>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="50" y1="250" x2="380" y2="250" stroke="currentColor" strokeWidth="2" className="axis-line text-muted-foreground" />
                    <line x1="50" y1="50" x2="50" y2="250" stroke="currentColor" strokeWidth="2" className="axis-line text-muted-foreground" />

                    {/* Grid Background Squares */}
                    <rect x="50" y="50" width="330" height="200" fill="currentColor" opacity="0.02" className="text-foreground" />

                    {/* Testosterone Line (Ascending - Blue) with Fill */}
                    <defs>
                      <path id="testPath" d="M 50 220 Q 120 180 190 150 T 330 60" />
                    </defs>
                    <path
                      d="M 50 220 Q 120 180 190 150 T 330 60 L 330 250 L 50 250 Z"
                      fill="url(#testosteroneGradient)"
                      opacity="0.2"
                    />
                    <path
                      d="M 50 220 Q 120 180 190 150 T 330 60"
                      fill="none"
                      stroke="url(#testosteroneGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="testosterone-line"
                    />

                    {/* Cortisol Line (Descending - Red) with Fill */}
                    <path
                      d="M 50 80 Q 120 120 190 150 T 330 220 L 330 250 L 50 250 Z"
                      fill="url(#cortisolGradient)"
                      opacity="0.1"
                    />
                    <path
                      d="M 50 80 Q 120 120 190 150 T 330 220"
                      fill="none"
                      stroke="url(#cortisolGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cortisol-line"
                    />

                    {/* End Point Circles */}
                    <circle cx="330" cy="60" r="6" fill="#3b82f6" className="legend-dot" style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }} />
                    <circle cx="330" cy="220" r="6" fill="#ef4444" className="legend-dot" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }} />

                    {/* Labels */}
                    <text x="15" y="65" fontSize="13" fontWeight="600" fill="currentColor" className="chart-label text-foreground">High</text>
                    <text x="10" y="260" fontSize="13" fontWeight="600" fill="currentColor" className="chart-label text-foreground">Low</text>
                    <text x="160" y="285" fontSize="13" fontWeight="600" fill="currentColor" className="chart-label text-foreground">Time</text>

                    {/* Legend */}
                    <g className="chart-label">
                      <circle cx="70" cy="30" r="6" fill="#3b82f6" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                      <text x="85" y="36" fontSize="13" fontWeight="600" fill="currentColor" className="text-foreground">Testosterone ↑</text>
                    </g>

                    <g className="chart-label">
                      <circle cx="70" cy="270" r="6" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
                      <text x="85" y="276" fontSize="13" fontWeight="600" fill="currentColor" className="text-foreground">Cortisol ↓</text>
                    </g>
                  </svg>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">↑ Testosterone</p>
                    <p className="text-xs text-muted-foreground mt-1">Strength, vitality & muscle growth</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">↓ Cortisol</p>
                    <p className="text-xs text-muted-foreground mt-1">Better recovery & mental health</p>
                  </div>
                </div>
              </div>

              {/* Benefits Section - BELOW CHART */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-4">🎯 What ATOS-fit Will Do For You</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircle" size={20} className="text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground"><span className="font-semibold">Balance Your Hormones</span> - Regulate testosterone and cortisol levels through scientifically-designed workouts</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircle" size={20} className="text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground"><span className="font-semibold">Improve Overall Health</span> - Reduce stress, increase energy, and enhance your well-being</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircle" size={20} className="text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground"><span className="font-semibold">Transform Your Body</span> - Achieve your fitness goals with personalized guidance</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Icon name="CheckCircle" size={20} className="text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground"><span className="font-semibold">Expert Direction</span> - No more guessing - we tell you exactly what to do</p>
                  </div>
                </div>
              </div>

              {/* Power Message */}
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-center">
                <p className="text-lg font-bold text-white mb-2">✨ The Power of Personalized Training</p>
                <p className="text-white/90">Every workout is designed specifically for YOUR body, YOUR goals, and YOUR lifestyle. No generic plans. Just results.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim(); // Only name is required, email is optional
      case 2:
        return formData.gender; // Gender must be selected
      case 3:
        return true; // Body weight always has a default value
      case 4:
        return formData.physique; // Physique must be selected
      case 5:
        return formData.focusAreas.length > 0; // At least one focus area must be selected
      case 6:
        return formData.height > 0 && formData.age > 0 && formData.weight > 0; // All measurements required
      case 7:
        return formData.workoutTime; // Workout time must be selected
      case 8:
        return formData.fitnessLevel; // Fitness level must be selected
      case 9:
        return formData.alignmentScore > 0; // Alignment score must be selected
      case 10:
        return formData.successMetrics.length > 0; // At least one success metric must be selected
      case 11:
        return true; // Benefits page - always valid, proceed to dashboard
      default:
        return false;
    }
  };

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${currentTheme === 'dark' ? 'dark' : ''
      }`}>
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <Icon name="ChevronLeft" size={16} />
              <span>Previous</span>
            </Button>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid() || isLoading}
                loading={isLoading}
                className="flex items-center space-x-2"
              >
                <Icon name="Check" size={16} />
                <span>Complete Setup</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <Icon name="ChevronRight" size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              // Save minimal user data when skipping
              const minimalUserData = {
                id: principal?.toString(),
                principalId: principal?.toString(),
                name: formData.name || 'New User',
                email: formData.email || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                skippedOnboarding: true
              };
              localStorage.setItem('user', JSON.stringify(minimalUserData));
              navigate('/dashboard');
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;