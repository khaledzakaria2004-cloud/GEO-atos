/**
 * API Index - Central export for all API modules
 */

// User API
export {
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
} from './userApi';

// Exercise API
export {
  recordExercise,
  recordExercises,
  getExercises,
  getExercisesByDate,
  getExerciseStats,
  updateExercise,
  deleteExercise
} from './exerciseApi';

// Chat API
export {
  saveChatMessage,
  saveChatResponse,
  saveConversationTurn,
  getChatHistory,
  getConversations,
  getConversationMessages,
  deleteConversation,
  getMessageCount
} from './chatApi';

// Food API
export {
  logFood,
  logFoods,
  getFoodLogs,
  getFoodLogsByDate,
  getDailyCalories,
  getDailyNutrition,
  getWeeklyCalories,
  updateFoodLog,
  deleteFoodLog
} from './foodApi';

// Achievement API
export {
  earnAchievement,
  getAchievements,
  getAchievement,
  updateAchievementProgress,
  incrementAchievementProgress,
  getCompletedAchievements,
  getTotalTokens,
  checkAndAwardAchievements
} from './achievementApi';

// Exercise Achievements API (cumulative tracking)
export {
  updateAchievement,
  updateAchievements,
  calculateLevel,
  getCurrentTarget,
  isTimeBased,
  getAchievementLevels,
  getSupportedExercises
} from './achievementsApi';

// Error handling
export {
  DatabaseError,
  ErrorCodes,
  mapSupabaseError,
  withErrorHandling,
  isErrorType,
  getErrorMessage
} from './errors';

// Default exports as namespaced objects
import userApi from './userApi';
import exerciseApi from './exerciseApi';
import chatApi from './chatApi';
import foodApi from './foodApi';
import achievementApi from './achievementApi';
import achievementsApi from './achievementsApi';
import errors from './errors';

export default {
  user: userApi,
  exercise: exerciseApi,
  chat: chatApi,
  food: foodApi,
  achievement: achievementApi,
  achievements: achievementsApi,
  errors
};
