/**
 * Database Error Handling Utilities
 */

export class DatabaseError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export const ErrorCodes = {
  // Auth errors
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Database errors
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // Sync errors
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  OFFLINE: 'OFFLINE',
  
  // Generic
  UNKNOWN: 'UNKNOWN'
};

// Map Supabase error codes to our error codes
export function mapSupabaseError(error) {
  if (!error) return null;

  const message = error.message || 'An unknown error occurred';
  const code = error.code || '';

  // Auth errors
  if (message.includes('already registered') || code === '23505') {
    return new DatabaseError('Email already exists', ErrorCodes.DUPLICATE_EMAIL, error);
  }
  if (message.includes('Invalid login credentials')) {
    return new DatabaseError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS, error);
  }
  if (message.includes('JWT expired') || message.includes('session')) {
    return new DatabaseError('Session expired, please login again', ErrorCodes.SESSION_EXPIRED, error);
  }

  // Database errors
  if (code === '23503') {
    return new DatabaseError('Referenced record not found', ErrorCodes.FOREIGN_KEY_VIOLATION, error);
  }
  if (code === '23505') {
    return new DatabaseError('Record already exists', ErrorCodes.UNIQUE_VIOLATION, error);
  }
  if (code === 'PGRST116') {
    return new DatabaseError('Record not found', ErrorCodes.NOT_FOUND, error);
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return new DatabaseError('Network error, please check your connection', ErrorCodes.NETWORK_ERROR, error);
  }

  return new DatabaseError(message, ErrorCodes.UNKNOWN, error);
}

// Wrapper for API calls with error handling
export async function withErrorHandling(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    throw mapSupabaseError(error);
  }
}

// Check if error is a specific type
export function isErrorType(error, code) {
  return error instanceof DatabaseError && error.code === code;
}

// Get user-friendly error message
export function getErrorMessage(error) {
  if (error instanceof DatabaseError) {
    return error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default {
  DatabaseError,
  ErrorCodes,
  mapSupabaseError,
  withErrorHandling,
  isErrorType,
  getErrorMessage
};
