import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { checkEmailExists, getSupabaseUser, updateSupabaseUser } from '../../../utils/icpSupabaseAuth';
import { supabase } from '../../../utils/supabase';

const InternetIdentityLogin = ({ isLoading: parentLoading = false }) => {
  const navigate = useNavigate();
  const { login, loading: authLoading, isAuthenticated, principal, setSupabaseUser } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  const isLoading = parentLoading || authLoading;

  // Handle redirect after authentication
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (isAuthenticated && !authLoading && principal) {
        const principalId = principal.toString();
        console.log('Checking user with Principal ID:', principalId);
        
        // Check if this Principal ID exists in Supabase
        const existingUser = await getSupabaseUser(principalId);
        console.log('Existing user found:', existingUser);
        
        if (existingUser) {
          // User exists - check if profile is complete
          const hasCompletedProfile = existingUser.full_name && 
            existingUser.full_name !== 'ICP User' && 
            existingUser.full_name !== 'New User';
          
          if (hasCompletedProfile) {
            // User exists with completed profile - go to dashboard
            const userData = {
              id: principalId,
              email: existingUser.email,
              name: existingUser.full_name,
              fitnessLevel: existingUser.fitness_level,
              goals: existingUser.goals,
              age: existingUser.age,
              height: existingUser.height,
              weight: existingUser.weight
            };
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('User has completed profile, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
          } else {
            // User exists but hasn't completed onboarding
            console.log('User exists but profile incomplete, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
          }
        } else {
          // Principal not found - go directly to create account (onboarding)
          console.log('Principal not found in DB, redirecting to onboarding');
          navigate('/onboarding', { replace: true });
        }
      }
    };
    
    checkUserAndRedirect();
  }, [isAuthenticated, authLoading, principal, navigate]);

  const handleLogin = async () => {
    try {
      setError('');
      await login();
      // Navigation is handled by useEffect above
    } catch (error) {
      console.error('Login failed:', error);
      setError('Authentication failed. Please try again.');
    }
  };

  const handleShowEmailInput = () => {
    setShowEmailInput(true);
    setError('');
    setSuccessMessage('');
  };

  const handleEmailVerify = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setEmailLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const principalId = principal.toString();
      
      // Check if email exists in database
      const existingUserByEmail = await checkEmailExists(email.trim());
      
      if (!existingUserByEmail) {
        // Email not found
        setError('No account found with this email. Please create a new account.');
        return;
      }

      // Email found - now we need to update the user's principal ID to the new one
      // This handles the case where user logged in with different Internet Identity
      // We'll update the user record with the new principal ID
      
      // First, delete the old record and create new one with new principal
      const oldPrincipalId = existingUserByEmail.id;
      
      // Update the user's ID to the new principal
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: principalId })
        .eq('id', oldPrincipalId);

      if (updateError) {
        // If update fails (maybe due to constraint), try different approach
        // Just log them in with the existing account info
        console.log('Could not update principal, using existing account');
      }

      // Update related tables
      await supabase.from('user_stats').update({ user_id: principalId }).eq('user_id', oldPrincipalId);
      await supabase.from('exercises').update({ user_id: principalId }).eq('user_id', oldPrincipalId);
      await supabase.from('achievements').update({ user_id: principalId }).eq('user_id', oldPrincipalId);
      await supabase.from('food_logs').update({ user_id: principalId }).eq('user_id', oldPrincipalId);
      await supabase.from('chatbot_logs').update({ user_id: principalId }).eq('user_id', oldPrincipalId);

      // Get the updated user
      const updatedUser = await getSupabaseUser(principalId) || existingUserByEmail;
      
      // Login successful
      const userData = {
        id: principalId,
        email: updatedUser.email || existingUserByEmail.email,
        name: updatedUser.full_name || existingUserByEmail.full_name,
        fitnessLevel: updatedUser.fitness_level || existingUserByEmail.fitness_level,
        goals: updatedUser.goals || existingUserByEmail.goals,
        age: updatedUser.age || existingUserByEmail.age,
        height: updatedUser.height || existingUserByEmail.height,
        weight: updatedUser.weight || existingUserByEmail.weight
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (setSupabaseUser) {
        setSupabaseUser(updatedUser || existingUserByEmail);
      }

      setSuccessMessage('Account found! Logging you in...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Email verification failed:', error);
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCreateNewAccount = () => {
    navigate('/onboarding', { replace: true });
  };

  const handleBackToOptions = () => {
    setShowEmailInput(false);
    setEmail('');
    setError('');
    setSuccessMessage('');
  };

  // Show email input for existing account verification
  if (showEmailInput && isAuthenticated) {
    return (
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-error" />
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Icon name="CheckCircle" size={16} className="text-green-500" />
              <p className="text-sm text-green-500">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-4">
          <Icon name="Mail" size={48} className="text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground">Verify Your Account</h3>
          <p className="text-sm text-muted-foreground">Enter the email associated with your account</p>
        </div>

        <div className="bg-card/50 border border-border rounded-lg p-4 space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            onKeyPress={(e) => e.key === 'Enter' && handleEmailVerify()}
          />
          
          <Button
            onClick={handleEmailVerify}
            variant="default"
            fullWidth
            loading={emailLoading}
            disabled={emailLoading}
          >
            <Icon name="Search" size={18} className="mr-2" />
            Verify Email
          </Button>
        </div>

        <Button
          onClick={handleBackToOptions}
          variant="ghost"
          fullWidth
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Back to Options
        </Button>
      </div>
    );
  }

  // Show options after ICP authentication (existing account or create new)
  if (showOptions && isAuthenticated) {
    return (
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-error" />
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-4">
          <Icon name="CheckCircle" size={48} className="text-green-500 mx-auto mb-2" />
          <h3 className="font-semibold text-foreground">Identity Verified!</h3>
          <p className="text-sm text-muted-foreground">This Internet Identity is not linked to any account</p>
        </div>

        {/* Existing Account Option */}
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="User" size={20} className="text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">I have an account</h4>
              <p className="text-sm text-muted-foreground">Link your existing account to this identity</p>
            </div>
          </div>
          
          <Button
            onClick={handleShowEmailInput}
            variant="default"
            fullWidth
          >
            <Icon name="LogIn" size={18} className="mr-2" />
            Login with Email
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>

        {/* New Account Option */}
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Icon name="UserPlus" size={20} className="text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Create New Account</h4>
              <p className="text-sm text-muted-foreground">Set up a new fitness profile</p>
            </div>
          </div>
          
          <Button
            onClick={handleCreateNewAccount}
            variant="outline"
            fullWidth
          >
            <Icon name="UserPlus" size={18} className="mr-2" />
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Internet Identity Info */}
      <div className="bg-card/50 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Internet Identity</h3>
            <p className="text-sm text-muted-foreground">Secure, passwordless authentication</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Icon name="Check" size={14} className="text-green-500" />
            <span>No passwords to remember</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Check" size={14} className="text-green-500" />
            <span>Biometric authentication support</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Check" size={14} className="text-green-500" />
            <span>Hardware security key compatible</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Check" size={14} className="text-green-500" />
            <span>Fully decentralized</span>
          </div>
        </div>
      </div>

      {/* Login Button */}
      <Button
        onClick={handleLogin}
        variant="default"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        className="h-12 flex items-center justify-center space-x-2"
      >
        <Icon name="LogIn" size={18} className="text-[#edad45]" />
        <span>Sign In</span>
      </Button>

      {/* Help Text */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          New to Internet Identity? Don't worry! The system will guide you through creating your secure digital identity.
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="Smartphone" size={12} />
            <span>Mobile</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Monitor" size={12} />
            <span>Desktop</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Key" size={12} />
            <span>Hardware Keys</span>
          </div>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Don't have an Internet Identity?{' '}
          <button
            type="button"
            onClick={() => navigate('/register-screen')}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
            disabled={isLoading}
          >
            Create One
          </button>
        </p>
      </div>
    </div>
  );
};

export default InternetIdentityLogin;