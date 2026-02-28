/**
 * ICP + Supabase Integration
 * Uses Internet Identity for authentication and Supabase for data storage
 */

import { supabase } from './supabase';

/**
 * Check if email already exists in database
 * @param {string} email - The email to check
 * @returns {object|null} - User data if exists, null otherwise
 */
export async function checkEmailExists(email) {
  if (!email) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code === 'PGRST116') {
    return null; // Email not found
  }
  if (error) throw error;
  return data;
}

/**
 * Login existing user by email - returns user if email matches their principal
 * @param {string} principalId - The ICP Principal ID
 * @param {string} email - The email to verify
 */
export async function loginWithEmail(principalId, email) {
  if (!principalId || !email) {
    throw new Error('Principal ID and email are required');
  }

  // Check if user exists with this email
  const existingUser = await checkEmailExists(email);
  
  if (!existingUser) {
    return { success: false, error: 'No account found with this email. Please create a new account.' };
  }

  // Check if the principal matches
  if (existingUser.id !== principalId) {
    return { success: false, error: 'This email is registered with a different Internet Identity. Please use the correct identity.' };
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', principalId);

  return { success: true, user: existingUser };
}

/**
 * Create or get user in Supabase using ICP Principal
 * @param {string} principalId - The ICP Principal ID
 * @param {object} metadata - Optional user metadata
 */
export async function getOrCreateSupabaseUser(principalId, metadata = {}) {
  if (!principalId) {
    throw new Error('Principal ID is required');
  }

  // Check if user exists by principal ID
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', principalId)
    .single();

  if (existingUser) {
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', principalId);
    
    return existingUser;
  }

  // Check if email already exists (for a different user)
  if (metadata.email) {
    const emailUser = await checkEmailExists(metadata.email);
    if (emailUser && emailUser.id !== principalId) {
      throw new Error('This email is already registered with another account. Please use a different email.');
    }
  }

  // User doesn't exist, create new one
  if (fetchError && fetchError.code === 'PGRST116') {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: principalId,
        email: metadata.email || `${principalId.substring(0, 10)}@icp.user`,
        full_name: metadata.name || 'ICP User',
        role: 'user',
        fitness_level: metadata.fitnessLevel || 'beginner',
        goals: metadata.goals || [],
        age: metadata.age || null,
        height: metadata.height || null,
        weight: metadata.weight || null,
        date_joined: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    // Also create user_stats entry
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

    return newUser;
  }

  throw fetchError;
}

/**
 * Update user profile in Supabase
 */
export async function updateSupabaseUser(principalId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', principalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user profile from Supabase
 */
export async function getSupabaseUser(principalId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', principalId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get user stats from Supabase
 */
export async function getSupabaseUserStats(principalId) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', principalId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update user stats in Supabase
 */
export async function updateSupabaseUserStats(principalId, updates) {
  const { data, error } = await supabase
    .from('user_stats')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', principalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export default {
  getOrCreateSupabaseUser,
  updateSupabaseUser,
  getSupabaseUser,
  getSupabaseUserStats,
  updateSupabaseUserStats,
  checkEmailExists,
  loginWithEmail
};
