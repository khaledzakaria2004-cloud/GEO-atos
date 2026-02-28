import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { getOrCreateSupabaseUser, getSupabaseUserStats } from '../utils/icpSupabaseAuth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Internet Identity URL - Always use mainnet for simplicity
  // This works for both local development and production
  const II_URL = 'https://identity.ic0.app';
  const isProduction = window.location.hostname.includes('ic0.app') || window.location.hostname.includes('icp0.io');

  // Development-only fake auth: enabled by default in development to bypass login
  // - To explicitly disable, set VITE_DISABLE_FAKE_AUTH=true
  // - Or remove localStorage flag FAKE_AUTH
  // You can also force-enable via VITE_FAKE_AUTH=true or localStorage 'FAKE_AUTH' = '1'.
  const envFake = import.meta.env.VITE_FAKE_AUTH === 'true' || import.meta.env.VITE_FAKE_AUTH === '1';
  const envDisable = import.meta.env.VITE_DISABLE_FAKE_AUTH === 'true' || import.meta.env.VITE_DISABLE_FAKE_AUTH === '1';
  const lsFake = typeof window !== 'undefined' && window.localStorage?.getItem('FAKE_AUTH') === '1';
  const FAKE_AUTH = false;

  useEffect(() => {
    if (FAKE_AUTH) {
      console.warn('FAKE_AUTH enabled (dev only) - providing a fake identity. Do not commit this to production.');
      const fakePrincipal = Principal.fromText(import.meta.env.VITE_FAKE_PRINCIPAL || '2vxsx-fae');
      const fakeIdentity = { getPrincipal: () => fakePrincipal };
      setIdentity(fakeIdentity);
      setPrincipal(fakePrincipal);
      setIsAuthenticated(true);
      setAuthClient(null);
      setLoading(false);
    } else {
      initAuth();
    }
  }, []);

  const initAuth = async () => {
    try {
      console.log('Initializing auth with II_URL:', II_URL);
      console.log('Is production:', isProduction);
      console.log('Current hostname:', window.location.hostname);
      
      const client = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          disableDefaultIdleCallback: true,
        },
      });

      setAuthClient(client);

      const isAuth = await client.isAuthenticated();
      console.log('Is authenticated:', isAuth);
      
      if (isAuth) {
        handleAuthenticated(client);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = async (client) => {
    const identity = client.getIdentity();
    const principal = identity.getPrincipal();
    const principalId = principal.toString();

    setIdentity(identity);
    setPrincipal(principal);
    setIsAuthenticated(true);

    console.log('Authenticated as:', principalId);

    // Check if user exists in Supabase (don't auto-create)
    try {
      const { getSupabaseUser } = await import('../utils/icpSupabaseAuth');
      const existingUser = await getSupabaseUser(principalId);
      
      if (existingUser) {
        // User exists - update last login and load data
        const { updateSupabaseUser, getSupabaseUserStats } = await import('../utils/icpSupabaseAuth');
        await updateSupabaseUser(principalId, { last_login: new Date().toISOString() });
        
        setSupabaseUser(existingUser);
        setIsNewUser(false);
        
        const stats = await getSupabaseUserStats(principalId);
        setUserStats(stats);

        // Store in localStorage for compatibility
        localStorage.setItem('user', JSON.stringify({
          id: principalId,
          email: existingUser.email,
          name: existingUser.full_name,
          fitnessLevel: existingUser.fitness_level,
          goals: existingUser.goals
        }));
        
        console.log('Existing user loaded:', existingUser);
      } else {
        // New user - needs to complete onboarding
        setSupabaseUser(null);
        setIsNewUser(true);
        console.log('New user - needs onboarding');
      }
    } catch (error) {
      console.error('Failed to check Supabase user:', error);
      setIsNewUser(true); // Assume new user on error
    }
  };

  const login = async () => {
    // TEMPORARY BYPASS: Simulate successful login without Internet Identity because ICP is stopped
    const fakePrincipal = Principal.fromText('2vxsx-fae');
    const fakeIdentity = { getPrincipal: () => fakePrincipal };
    
    setIdentity(fakeIdentity);
    setPrincipal(fakePrincipal);
    setIsAuthenticated(true);
    setLoading(false);
    setSupabaseUser(null);
    setIsNewUser(true);
    
    console.log('Bypassing ICP login: simulated successful authentication with fake principal');
    
    return;
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      setLoading(true);
      await authClient.logout();
      
      setIdentity(null);
      setPrincipal(null);
      setIsAuthenticated(false);
      setSupabaseUser(null);
      setUserStats(null);
      
      // Clear localStorage
      localStorage.removeItem('user');
      
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      identity,
      principal,
      authClient,
      login,
      logout,
      loading,
      supabaseUser,
      userStats,
      isNewUser,
      setSupabaseUser,
      setIsNewUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};