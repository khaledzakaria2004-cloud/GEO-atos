import { db, recordWorkoutSession, updateAggregateStats } from './db';
import { evaluateAchievements } from './achievements';
import { calculateSessionCalories } from './calories';

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USER: 'user',
  WORKOUT_STATS: 'fitcoach_workout_stats',
  DAILY_PROGRESS: 'fitcoach_daily_progress',
  BADGES: 'fitcoach_badges',
  TODAY_PLAN: 'fitcoach_today_plan',
  CHAT_CONVERSATIONS: 'fitcoach_chat_conversations',
  CHAT_SETTINGS: 'fitcoach_chat_settings'
};

// Initialize default workout stats
const DEFAULT_WORKOUT_STATS = {
  totalWorkouts: 0,
  totalCalories: 0,
  totalWorkoutTime: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyWorkouts: 0,
  monthlyWorkouts: 0,
  lastWorkoutDate: null,
  lastUpdated: new Date().toISOString()
};

// Initialize default user profile
const DEFAULT_USER = {
  id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: 'User',
  email: 'user@example.com',
  weight: 70, // kg
  totalCaloriesBurned: 0,
  totalWorkoutTime: 0,
  totalWorkouts: 0,
  currentStreak: 0,
  longestStreak: 0,
  createdAt: new Date().toISOString()
};

// Get or create current user
export function getCurrentUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      const user = JSON.parse(stored);
      // Ensure user has an ID
      if (!user.id) {
        user.id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      return user;
    }

    // Create new user
    const newUser = { ...DEFAULT_USER };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return newUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return { ...DEFAULT_USER };
  }
}

// Update user profile
export function updateUserProfile(updates) {
  try {
    const currentUser = getCurrentUser();
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return getCurrentUser();
  }
}

// Get workout statistics
export function getWorkoutStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_STATS);
    if (stored) {
      return JSON.parse(stored);
    }

    // Initialize with defaults
    localStorage.setItem(STORAGE_KEYS.WORKOUT_STATS, JSON.stringify(DEFAULT_WORKOUT_STATS));
    return { ...DEFAULT_WORKOUT_STATS };
  } catch (error) {
    console.error('Error getting workout stats:', error);
    return { ...DEFAULT_WORKOUT_STATS };
  }
}

// Update workout statistics
export function updateWorkoutStats(newStats) {
  try {
    const currentStats = getWorkoutStats();
    const updatedStats = {
      ...currentStats,
      ...newStats,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.WORKOUT_STATS, JSON.stringify(updatedStats));
    return updatedStats;
  } catch (error) {
    console.error('Error updating workout stats:', error);
    return getWorkoutStats();
  }
}

// Get today's progress
export function getDailyProgress(date = null) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = stored ? JSON.parse(stored) : {};

    if (!allProgress[targetDate]) {
      allProgress[targetDate] = {
        date: targetDate,
        workoutsCompleted: 0,
        caloriesBurned: 0,
        exercisesCompleted: [],
        totalWorkoutTime: 0,
        achievements: []
      };
      localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(allProgress));
    }

    return allProgress[targetDate];
  } catch (error) {
    console.error('Error getting daily progress:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      workoutsCompleted: 0,
      caloriesBurned: 0,
      exercisesCompleted: [],
      totalWorkoutTime: 0,
      achievements: []
    };
  }
}

// Update daily progress
export function updateDailyProgress(updates, date = null) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = stored ? JSON.parse(stored) : {};

    const currentProgress = allProgress[targetDate] || getDailyProgress(targetDate);
    allProgress[targetDate] = { ...currentProgress, ...updates };

    localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(allProgress));
    return allProgress[targetDate];
  } catch (error) {
    console.error('Error updating daily progress:', error);
    return getDailyProgress(date);
  }
}

// Calculate streak
function calculateStreak(workoutStats, lastWorkoutDate) {
  if (!lastWorkoutDate) return { currentStreak: 1, longestStreak: Math.max(1, workoutStats.longestStreak) };

  const today = new Date();
  const lastDate = new Date(lastWorkoutDate);
  const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  let currentStreak = workoutStats.currentStreak || 0;

  if (daysDiff === 0) {
    // Same day, don't increment streak
    currentStreak = Math.max(1, currentStreak);
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    currentStreak += 1;
  } else {
    // Streak broken, reset to 1
    currentStreak = 1;
  }

  const longestStreak = Math.max(currentStreak, workoutStats.longestStreak || 0);

  return { currentStreak, longestStreak };
}

// Main function to record completed workout
export async function recordCompletedWorkout(sessionData) {
  try {
    const user = getCurrentUser();
    const workoutStats = getWorkoutStats();
    const today = new Date().toISOString().split('T')[0];

    // Calculate calories for this session
    const sessionItems = Array.isArray(sessionData) ? sessionData : [sessionData];
    const { total: caloriesBurned } = calculateSessionCalories(sessionItems, user);

    // Calculate workout time (use provided or estimate)
    const workoutTime = sessionData.workoutTime || sessionData.durationSec ||
      sessionItems.reduce((total, item) => total + (item.durationSec || 180), 0);

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreak(workoutStats, workoutStats.lastWorkoutDate);

    // Update workout statistics
    const updatedStats = updateWorkoutStats({
      totalWorkouts: workoutStats.totalWorkouts + 1,
      totalCalories: workoutStats.totalCalories + caloriesBurned,
      totalWorkoutTime: workoutStats.totalWorkoutTime + workoutTime,
      currentStreak,
      longestStreak,
      weeklyWorkouts: workoutStats.weeklyWorkouts + 1, // TODO: Calculate properly
      monthlyWorkouts: workoutStats.monthlyWorkouts + 1, // TODO: Calculate properly
      lastWorkoutDate: new Date().toISOString()
    });

    // Update daily progress
    const dailyProgress = getDailyProgress(today);
    const exerciseNames = Array.isArray(sessionData) ?
      sessionData.map(s => s.exerciseName || s.name) :
      [sessionData.exerciseName || sessionData.name];

    updateDailyProgress({
      workoutsCompleted: dailyProgress.workoutsCompleted + 1,
      caloriesBurned: dailyProgress.caloriesBurned + caloriesBurned,
      exercisesCompleted: [...new Set([...dailyProgress.exercisesCompleted, ...exerciseNames])],
      totalWorkoutTime: dailyProgress.totalWorkoutTime + workoutTime
    }, today);

    // Update user profile
    updateUserProfile({
      totalCaloriesBurned: user.totalCaloriesBurned + caloriesBurned,
      totalWorkoutTime: user.totalWorkoutTime + workoutTime,
      totalWorkouts: user.totalWorkouts + 1,
      currentStreak,
      longestStreak
    });

    // Store in IndexedDB for detailed tracking
    try {
      await recordWorkoutSession(user.id, sessionItems);
      const dbStats = await updateAggregateStats(user.id, sessionItems);
      await evaluateAchievements(user.id, dbStats);
    } catch (dbError) {
      console.warn('IndexedDB storage failed, continuing with localStorage:', dbError);
    }

    // Dispatch events for UI updates
    const workoutCompletedEvent = new CustomEvent('workoutCompleted', {
      detail: {
        exerciseName: sessionData.exerciseName || sessionData.name,
        caloriesBurned,
        workoutTime,
        totalWorkouts: updatedStats.totalWorkouts,
        currentStreak
      }
    });
    window.dispatchEvent(workoutCompletedEvent);

    return {
      success: true,
      stats: updatedStats,
      caloriesBurned,
      workoutTime
    };

  } catch (error) {
    console.error('Error recording workout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Mark specific exercise as completed
export function markExerciseCompleted(exerciseName) {
  const sessionData = {
    exerciseName,
    name: exerciseName,
    reps: 1,
    sets: 1,
    durationSec: 60, // Default duration
    workoutTime: 60
  };

  return recordCompletedWorkout(sessionData);
}

// Get exercise-specific statistics
export function getExerciseStats(exerciseName) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = stored ? JSON.parse(stored) : {};

    let totalSessions = 0;
    let totalCalories = 0;
    let lastCompleted = null;

    Object.values(allProgress).forEach(dayProgress => {
      if (dayProgress.exercisesCompleted?.includes(exerciseName)) {
        totalSessions++;
        // Estimate calories for this exercise (simplified)
        totalCalories += Math.floor(dayProgress.caloriesBurned / dayProgress.exercisesCompleted.length);
        if (!lastCompleted || dayProgress.date > lastCompleted) {
          lastCompleted = dayProgress.date;
        }
      }
    });

    return {
      exerciseName,
      totalSessions,
      totalCalories,
      lastCompleted
    };
  } catch (error) {
    console.error('Error getting exercise stats:', error);
    return {
      exerciseName,
      totalSessions: 0,
      totalCalories: 0,
      lastCompleted: null
    };
  }
}

// Get weekly exercise statistics
export function getWeeklyExerciseStats(exerciseName) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = stored ? JSON.parse(stored) : {};

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    let weeklySessions = 0;
    let weeklyCalories = 0;

    Object.entries(allProgress).forEach(([date, dayProgress]) => {
      if (date >= weekAgoStr && dayProgress.exercisesCompleted?.includes(exerciseName)) {
        weeklySessions++;
        weeklyCalories += Math.floor(dayProgress.caloriesBurned / dayProgress.exercisesCompleted.length);
      }
    });

    return {
      exerciseName,
      weeklySessions,
      weeklyCalories
    };
  } catch (error) {
    console.error('Error getting weekly exercise stats:', error);
    return {
      exerciseName,
      weeklySessions: 0,
      weeklyCalories: 0
    };
  }
}

// Achievement badge management
export function getAchievementBadges() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BADGES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting achievement badges:', error);
    return [];
  }
}

export function addAchievementBadge(badge) {
  try {
    const badges = getAchievementBadges();
    const existingIndex = badges.findIndex(b => b.id === badge.id);

    if (existingIndex >= 0) {
      badges[existingIndex] = { ...badges[existingIndex], ...badge };
    } else {
      badges.push({
        ...badge,
        earnedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));

    // Dispatch achievement event
    const achievementEvent = new CustomEvent('achievementEarned', {
      detail: badge
    });
    window.dispatchEvent(achievementEvent);

    return badges;
  } catch (error) {
    console.error('Error adding achievement badge:', error);
    return getAchievementBadges();
  }
}

// Today's workout plan management
export function getTodayPlan() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TODAY_PLAN);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting today plan:', error);
    return null;
  }
}

export function setTodayPlan(plan) {
  try {
    localStorage.setItem(STORAGE_KEYS.TODAY_PLAN, JSON.stringify(plan));
    return plan;
  } catch (error) {
    console.error('Error setting today plan:', error);
    return null;
  }
}

// Cleanup old data (keep last N days)
export function cleanupOldData(daysToKeep = 30) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    if (!stored) return;

    const allProgress = JSON.parse(stored);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filteredProgress = {};
    Object.entries(allProgress).forEach(([date, progress]) => {
      if (date >= cutoffStr) {
        filteredProgress[date] = progress;
      }
    });

    localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(filteredProgress));
    console.log(`Cleaned up data older than ${daysToKeep} days`);
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

// ===== CHAT STORAGE FUNCTIONS =====

// Get all chat conversations
export function getChatConversations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting chat conversations:', error);
    return [];
  }
}

// Save a new chat conversation
export function saveChatConversation(conversation) {
  try {
    const conversations = getChatConversations();
    const newConversation = {
      id: conversation.id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: conversation.title || generateConversationTitle(conversation.messages),
      messages: conversation.messages || [],
      createdAt: conversation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: conversation.messages ? conversation.messages.length : 0
    };

    // Check if conversation already exists
    const existingIndex = conversations.findIndex(c => c.id === newConversation.id);
    if (existingIndex >= 0) {
      conversations[existingIndex] = newConversation;
    } else {
      conversations.push(newConversation);
    }

    // Sort by most recent first
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
    return newConversation;
  } catch (error) {
    console.error('Error saving chat conversation:', error);
    return null;
  }
}

// Update an existing chat conversation
export function updateChatConversation(conversationId, updates) {
  try {
    const conversations = getChatConversations();
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);

    if (conversationIndex >= 0) {
      conversations[conversationIndex] = {
        ...conversations[conversationIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        messageCount: updates.messages ? updates.messages.length : conversations[conversationIndex].messageCount
      };

      // Update title if messages changed
      if (updates.messages) {
        conversations[conversationIndex].title = generateConversationTitle(updates.messages);
      }

      // Sort by most recent first
      conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
      return conversations[conversationIndex];
    }

    return null;
  } catch (error) {
    console.error('Error updating chat conversation:', error);
    return null;
  }
}

// Add a message to an existing conversation
export function addMessageToConversation(conversationId, message) {
  try {
    const conversations = getChatConversations();
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);

    if (conversationIndex >= 0) {
      const conversation = conversations[conversationIndex];
      const newMessage = {
        id: message.id || Date.now(),
        message: message.message,
        isUser: message.isUser,
        timestamp: message.timestamp || new Date(),
        ...message
      };

      conversation.messages.push(newMessage);
      conversation.updatedAt = new Date().toISOString();
      conversation.messageCount = conversation.messages.length;
      conversation.title = generateConversationTitle(conversation.messages);

      // Sort conversations by most recent first
      conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
      return conversation;
    }

    return null;
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    return null;
  }
}

// Get a specific conversation by ID
export function getChatConversation(conversationId) {
  try {
    const conversations = getChatConversations();
    return conversations.find(c => c.id === conversationId) || null;
  } catch (error) {
    console.error('Error getting chat conversation:', error);
    return null;
  }
}

// Delete a conversation
export function deleteChatConversation(conversationId) {
  try {
    const conversations = getChatConversations();
    const filteredConversations = conversations.filter(c => c.id !== conversationId);
    localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(filteredConversations));
    return true;
  } catch (error) {
    console.error('Error deleting chat conversation:', error);
    return false;
  }
}

// Generate a conversation title from messages
function generateConversationTitle(messages) {
  if (!messages || messages.length === 0) return 'New Conversation';

  // Find the first user message
  const firstUserMessage = messages.find(m => m.isUser);
  if (firstUserMessage && firstUserMessage.message) {
    // Take first 50 characters and add ellipsis if longer
    const title = firstUserMessage.message.trim();
    return title.length > 50 ? title.substring(0, 50) + '...' : title;
  }

  return 'New Conversation';
}

// Get chat settings
export function getChatSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SETTINGS);
    return stored ? JSON.parse(stored) : {
      autoSave: true,
      maxConversations: 50,
      speechLang: 'en-US',
      theme: 'dark'
    };
  } catch (error) {
    console.error('Error getting chat settings:', error);
    return {
      autoSave: true,
      maxConversations: 50,
      speechLang: 'en-US',
      theme: 'dark'
    };
  }
}

// Update chat settings
export function updateChatSettings(settings) {
  try {
    const currentSettings = getChatSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return getChatSettings();
  }
}

// Cleanup old conversations (keep only the most recent N conversations)
export function cleanupOldConversations(maxConversations = 50) {
  try {
    const conversations = getChatConversations();
    if (conversations.length > maxConversations) {
      // Sort by most recent and keep only the specified number
      const sortedConversations = conversations
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, maxConversations);

      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(sortedConversations));
      console.log(`Cleaned up old conversations, kept ${maxConversations} most recent`);
    }
  } catch (error) {
    console.error('Error cleaning up old conversations:', error);
  }
}

// Export conversation data (for backup/export functionality)
export function exportChatData() {
  try {
    const conversations = getChatConversations();
    const settings = getChatSettings();
    const exportData = {
      conversations,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return exportData;
  } catch (error) {
    console.error('Error exporting chat data:', error);
    return null;
  }
}

// Import conversation data (for backup/import functionality)
export function importChatData(importData) {
  try {
    if (importData.conversations) {
      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(importData.conversations));
    }
    if (importData.settings) {
      localStorage.setItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(importData.settings));
    }
    return true;
  } catch (error) {
    console.error('Error importing chat data:', error);
    return false;
  }
}

// Export all functions for easy importing
export default {
  getCurrentUser,
  updateUserProfile,
  getWorkoutStats,
  updateWorkoutStats,
  getDailyProgress,
  updateDailyProgress,
  recordCompletedWorkout,
  markExerciseCompleted,
  getExerciseStats,
  getWeeklyExerciseStats,
  getAchievementBadges,
  addAchievementBadge,
  getTodayPlan,
  setTodayPlan,
  cleanupOldData,
  // Chat functions
  getChatConversations,
  saveChatConversation,
  updateChatConversation,
  addMessageToConversation,
  getChatConversation,
  deleteChatConversation,
  getChatSettings,
  updateChatSettings,
  cleanupOldConversations,
  exportChatData,
  importChatData,
  STORAGE_KEYS
};