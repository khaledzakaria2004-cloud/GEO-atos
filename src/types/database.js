/**
 * Database Types (JSDoc for JavaScript projects)
 * These types match the Supabase database schema
 */

/**
 * @typedef {Object} User
 * @property {string} id - UUID
 * @property {string} email
 * @property {string} full_name
 * @property {'user'|'admin'} role
 * @property {'beginner'|'intermediate'|'advanced'} fitness_level
 * @property {string[]} goals
 * @property {string} [profile_picture]
 * @property {number} [weight]
 * @property {string} date_joined - ISO timestamp
 * @property {string} [last_login] - ISO timestamp
 * @property {string} [deleted_at] - ISO timestamp for soft delete
 */

/**
 * @typedef {Object} Exercise
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to users
 * @property {string} exercise_name
 * @property {number} [repetitions]
 * @property {number} sets
 * @property {number} [duration_sec]
 * @property {number} [angle_accuracy] - Decimal 0-100
 * @property {number} [calories_burned]
 * @property {string} date_performed - ISO timestamp
 * @property {string} [deleted_at]
 */

/**
 * @typedef {Object} ChatLog
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to users
 * @property {string} message
 * @property {string} [response]
 * @property {boolean} is_user_message
 * @property {string} [conversation_id] - UUID to group messages
 * @property {string} timestamp - ISO timestamp
 * @property {string} [deleted_at]
 */

/**
 * @typedef {Object} FoodLog
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to users
 * @property {string} food_name
 * @property {number} calories
 * @property {number} [protein]
 * @property {number} [carbs]
 * @property {number} [fat]
 * @property {string} [portion_size]
 * @property {string} [image_url]
 * @property {string} date_logged - ISO timestamp
 * @property {string} [deleted_at]
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to users
 * @property {string} achievement_code - Unique per user
 * @property {string} achievement_name
 * @property {string} [description]
 * @property {number} tokens_earned
 * @property {number} progress
 * @property {number} target
 * @property {number} level
 * @property {string} date_earned - ISO timestamp
 */

/**
 * @typedef {Object} UserStats
 * @property {string} id - UUID
 * @property {string} user_id - UUID reference to users (unique)
 * @property {number} total_workouts
 * @property {number} total_calories_burned
 * @property {number} total_workout_time - in seconds
 * @property {number} current_streak
 * @property {number} longest_streak
 * @property {string} [last_workout_date] - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} ExerciseInput
 * @property {string} exerciseName
 * @property {number} [repetitions]
 * @property {number} [sets]
 * @property {number} [durationSec]
 * @property {number} [angleAccuracy]
 * @property {number} [caloriesBurned]
 * @property {string} [datePerformed]
 */

/**
 * @typedef {Object} FoodInput
 * @property {string} foodName
 * @property {number} calories
 * @property {number} [protein]
 * @property {number} [carbs]
 * @property {number} [fat]
 * @property {string} [portionSize]
 * @property {string} [imageUrl]
 * @property {string} [dateLogged]
 */

/**
 * @typedef {Object} AchievementInput
 * @property {string} code
 * @property {string} name
 * @property {string} [description]
 * @property {number} [tokensEarned]
 * @property {number} [progress]
 * @property {number} [target]
 * @property {number} [level]
 */

/**
 * @typedef {Object} ExerciseFilters
 * @property {string} [startDate] - ISO timestamp
 * @property {string} [endDate] - ISO timestamp
 * @property {string} [exerciseName]
 * @property {number} [limit]
 */

/**
 * @typedef {Object} Pagination
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} SyncOperation
 * @property {string} id - UUID
 * @property {'exercise'|'food'|'chat'|'achievement'} type
 * @property {'create'|'update'|'delete'} action
 * @property {Object} data
 * @property {string} timestamp - ISO timestamp
 */

// Export empty object for module compatibility
export default {};
