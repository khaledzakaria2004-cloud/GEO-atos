import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const InternetIdentityRegister = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      // Internet Identity handles both login and registration
      await login();
      
      // New user - redirect to onboarding
      if (onSuccess) {
        onSuccess();
      }
      
      navigate('/onboarding', { replace: true });
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loading = authLoading || isLoading;

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
            <p className="text-sm text-muted-foreground">Create your secure digital identity</p>
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
            <span>Fully decentralized & secure</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-foreground text-sm">How it works:</h4>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Click "Create Identity" below</li>
          <li>A popup will open for Internet Identity</li>
          <li>Create your identity using your device</li>
          <li>Complete your fitness profile</li>
        </ol>
      </div>

      {/* Register Button */}
      <Button
        onClick={handleRegister}
        variant="default"
        fullWidth
        loading={loading}
        disabled={loading}
        className="h-12 flex items-center justify-center space-x-2"
      >
        <Icon name="UserPlus" size={18} className="text-[#edad45]" />
        <span>{loading ? 'Creating...' : 'Create Identity'}</span>
      </Button>

      {/* Login Link */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Already have an Internet Identity?{' '}
          <button
            type="button"
            onClick={() => navigate('/login-screen')}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
            disabled={loading}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default InternetIdentityRegister;
