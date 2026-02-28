import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import * as userApi from '../utils/api/userApi';
import syncService from '../utils/syncService';

const SupabaseAuthContext = createContext(null);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);

        if (session?.user) {
          await loadUserData(session.user.id);
          // Setup sync listeners
          syncService.setupSyncListeners(session.user.id, (result) => {
            console.log('Sync completed:', result);
          });
        } else {
          setProfile(null);
          setStats(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);

      if (session?.user) {
        await loadUserData(session.user.id);
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      const [userProfile, userStats] = await Promise.all([
        userApi.getUserProfile(userId),
        userApi.getUserStats(userId)
      ]);
      setProfile(userProfile);
      setStats(userStats);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.signUp(email, password, fullName);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.signIn(email, password);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await userApi.signOut();
      setUser(null);
      setProfile(null);
      setStats(null);
      setSession(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      const updated = await userApi.updateUser(user.id, updates);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const refreshStats = async () => {
    if (!user) return;
    
    try {
      const userStats = await userApi.getUserStats(user.id);
      setStats(userStats);
      return userStats;
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  const value = {
    // State
    user,
    profile,
    stats,
    session,
    isAuthenticated,
    loading,
    error,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    
    // Profile methods
    updateProfile,
    refreshStats,
    
    // Utility
    userId: user?.id,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthProvider;
