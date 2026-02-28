import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthenticationLayout from '../../components/ui/AuthenticationLayout';
import InternetIdentityLogin from './components/InternetIdentityLogin';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, supabaseUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Check if user has completed onboarding
      if (supabaseUser?.full_name && supabaseUser.full_name !== 'ICP User') {
        navigate('/dashboard', { replace: true });
      } else {
        // Check localStorage as fallback
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.name && user.name !== 'ICP User') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    }
  }, [isAuthenticated, loading, supabaseUser, navigate]);

  // Enforce dark mode on the login screen only
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    return () => {
      root.classList.remove('dark');
    };
  }, []);

  return (
    <AuthenticationLayout>
      <div className={`w-full max-w-md mx-auto p-6 bg-card rounded-xl shadow-lg transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-2xl font-bold mb-6 text-center">Sign in to ATOS fit</h2>
        <InternetIdentityLogin />
      </div>
    </AuthenticationLayout>
  );
};

export default LoginScreen;
