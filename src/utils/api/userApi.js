import { supabase } from '../supabase';

/**
 * User API - Handles all user-related database operations
 * Supports both ICP Auth (Principal ID) and Supabase Auth
 */

// Create user with ICP Principal ID
export async function createUserWithPrincipal(principalId, userData = {}) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: principalId,
      email: userData.email || `${principalId.substring(0, 10)}@icp.user`,
      full_name: userData.name || userData.fullName || 'ICP User',
      role: 'user',
      fitness_level: userData.fitnessLevel || 'beginner',
      goals: userData.goals || [],
      date_joined: new Date().toISOString(),
      last_login: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // User already exists, return existing
      return getUserProfile(principalId);
    }
    throw error;
  }

  // Create user_stats entry
  await supabase
    .from('user_stats')
    .insert({
      user_id: principalId,
      total_workouts: 0,
      total_calories_burned: 0,
      total_workout_time: 0,
      current_streak: 0,
      longest_streak: 0
    });

  return data;
}

// Sign up a new user (Supabase Auth - optional)
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new Error('DUPLICATE_EMAIL');
    }
    throw error;
  }

  return data;
}

// Sign in an existing user (Supabase Auth - optional)
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  // Update last login
  if (data.user) {
    await updateUser(data.user.id, { last_login: new Date().toISOString() });
  }

  return data;
}

// Sign out the current user
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current authenticated user (Supabase Auth)
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Get user profile from database
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // User not found
    }
    throw error;
  }

  return data;
}

// Update user profile
export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user stats
export async function getUserStats(userId) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

// Update user stats
export async function updateUserStats(userId, updates) {
  const { data, error } = await supabase
    .from('user_stats')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Check if email exists
export async function checkEmailExists(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

// Soft delete user
export async function deleteUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getUserProfile,
  updateUser,
  getUserStats,
  updateUserStats,
  checkEmailExists,
  deleteUser
};
