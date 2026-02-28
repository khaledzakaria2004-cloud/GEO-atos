import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';

const RegistrationForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    fitnessLevel: '',
    workoutDuration: '30',
    goals: [],
    agreeToTerms: false,
    agreeToPrivacy: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const fitnessLevelOptions = [
    { value: 'beginner', label: 'Beginner - New to fitness' },
    { value: 'intermediate', label: 'Intermediate - Some experience' },
    { value: 'advanced', label: 'Advanced - Regular training' }
  ];

  const goalOptions = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'general_fitness', label: 'General Fitness' }
  ];

  const workoutDurations = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' }
  ];

  const validatePassword = (password) => {
    const minLength = password?.length >= 8;
    const hasUpper = /[A-Z]/?.test(password);
    const hasLower = /[a-z]/?.test(password);
    const hasNumber = /\d/?.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/?.test(password);
    
    const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial]?.filter(Boolean)?.length;
    
    return {
      isValid: score >= 3 && minLength,
      strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very-strong',
      score
    };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoalChange = (goalValue, checked) => {
    setFormData(prev => ({
      ...prev,
      goals: checked 
        ? [...prev?.goals, goalValue]
        : prev?.goals?.filter(g => g !== goalValue)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(formData?.password);
    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation?.isValid) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData?.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }

    if (!formData?.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Register with Supabase
      const data = await signUp(formData.email, formData.password, formData.fullName);
      
      if (data?.user) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({ 
          id: data.user.id, 
          email: data.user.email, 
          name: formData.fullName 
        }));
        
        // Clear old data for fresh start
        localStorage.removeItem('fitcoach_badges');
        localStorage.removeItem('fitcoach_today_plan');

        setRegistrationSuccess(true);
        
        if (onSuccess) {
          onSuccess();
        }

        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          // Email confirmation required
          setErrors({ 
            success: 'Registration successful! Please check your email to verify your account.' 
          });
        } else {
          // Auto-confirmed, redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message?.includes('already registered') || error.message === 'DUPLICATE_EMAIL') {
        setErrors({ email: 'This email is already registered. Please sign in instead.' });
      } else {
        setErrors({ submit: error.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData?.password);

  if (registrationSuccess && errors?.success) {
    return (
      <div className="text-center space-y-4 p-6">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
          <Icon name="CheckCircle" size={32} className="text-success" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Check Your Email</h3>
        <p className="text-muted-foreground">{errors.success}</p>
        <Button
          variant="outline"
          onClick={() => navigate('/login-screen')}
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData?.fullName}
          onChange={(e) => handleInputChange('fullName', e?.target?.value)}
          error={errors?.fullName}
          required
          disabled={isLoading}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={formData?.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          required
          disabled={isLoading}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={formData?.password}
            onChange={(e) => handleInputChange('password', e?.target?.value)}
            error={errors?.password}
            required
            disabled={isLoading}
          />
          
          {/* Password Strength Indicator */}
          {formData?.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordValidation?.strength === 'weak' ? 'bg-error w-1/4' :
                      passwordValidation?.strength === 'medium' ? 'bg-warning w-2/4' :
                      passwordValidation?.strength === 'strong'? 'bg-success w-3/4' : 'bg-success w-full'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordValidation?.strength === 'weak' ? 'text-error' :
                  passwordValidation?.strength === 'medium'? 'text-warning' : 'text-success'
                }`}>
                  {passwordValidation?.strength === 'weak' ? 'Weak' :
                   passwordValidation?.strength === 'medium' ? 'Medium' :
                   passwordValidation?.strength === 'strong' ? 'Strong' : 'Very Strong'}
                </span>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData?.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
          error={errors?.confirmPassword}
          required
          disabled={isLoading}
        />
      </div>

      {/* Advanced Preferences */}
      <div className="border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left mb-4"
          disabled={isLoading}
        >
          <span className="text-sm font-medium text-foreground">
            Fitness Preferences (Optional)
          </span>
          <Icon 
            name={showAdvanced ? "ChevronUp" : "ChevronDown"} 
            size={16} 
            className="text-muted-foreground"
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 animate-spring">
            <Select
              label="Fitness Level"
              placeholder="Select your fitness level"
              options={fitnessLevelOptions}
              value={formData?.fitnessLevel}
              onChange={(value) => handleInputChange('fitnessLevel', value)}
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Primary Goals (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {goalOptions?.map((goal) => (
                  <Checkbox
                    key={goal?.value}
                    label={goal?.label}
                    checked={formData?.goals?.includes(goal?.value)}
                    onChange={(e) => handleGoalChange(goal?.value, e?.target?.checked)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terms and Privacy */}
      <div className="space-y-3">
        <Checkbox
          label={
            <span className="text-sm">
              I agree to the{' '}
              <button type="button" className="text-primary hover:underline">
                Terms of Service
              </button>
            </span>
          }
          checked={formData?.agreeToTerms}
          onChange={(e) => handleInputChange('agreeToTerms', e?.target?.checked)}
          error={errors?.agreeToTerms}
          required
          disabled={isLoading}
        />

        <Checkbox
          label={
            <span className="text-sm">
              I agree to the{' '}
              <button type="button" className="text-primary hover:underline">
                Privacy Policy
              </button>
            </span>
          }
          checked={formData?.agreeToPrivacy}
          onChange={(e) => handleInputChange('agreeToPrivacy', e?.target?.checked)}
          error={errors?.agreeToPrivacy}
          required
          disabled={isLoading}
        />
      </div>

      {/* Submit Error */}
      {errors?.submit && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{errors?.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        className="h-12"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login-screen')}
            className="text-primary hover:underline font-medium"
            disabled={isLoading}
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
};

export default RegistrationForm;
