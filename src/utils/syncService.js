import { supabase } from './supabase';
import * as api from './api';

/**
 * Sync Service - Handles offline/online data synchronization
 */

const SYNC_QUEUE_KEY = 'atos_fit_sync_queue';
const LAST_SYNC_KEY = 'atos_fit_last_sync';

// Queue structure: { id, type, action, data, timestamp }
// Types: 'exercise', 'food', 'chat', 'achievement'
// Actions: 'create', 'update', 'delete'

// Get pending sync operations
export function getSyncQueue() {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

// Add operation to sync queue
export function addToSyncQueue(type, action, data) {
  const queue = getSyncQueue();
  queue.push({
    id: crypto.randomUUID(),
    type,
    action,
    data,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

// Remove operation from sync queue
export function removeFromSyncQueue(operationId) {
  const queue = getSyncQueue();
  const filtered = queue.filter(op => op.id !== operationId);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
}

// Clear sync queue
export function clearSyncQueue() {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

// Check if online
export function isOnline() {
  return navigator.onLine;
}

// Process a single sync operation
async function processSyncOperation(operation, userId) {
  const { type, action, data } = operation;

  try {
    switch (type) {
      case 'exercise':
        if (action === 'create') {
          await api.recordExercise(userId, data);
        } else if (action === 'update') {
          await api.updateExercise(data.id, data);
        } else if (action === 'delete') {
          await api.deleteExercise(data.id);
        }
        break;

      case 'food':
        if (action === 'create') {
          await api.logFood(userId, data);
        } else if (action === 'update') {
          await api.updateFoodLog(data.id, data);
        } else if (action === 'delete') {
          await api.deleteFoodLog(data.id);
        }
        break;

      case 'chat':
        if (action === 'create') {
          await api.saveChatMessage(userId, data.message, data.isUser, data.conversationId);
        }
        break;

      case 'achievement':
        if (action === 'create' || action === 'update') {
          await api.earnAchievement(userId, data);
        }
        break;

      default:
        console.warn('Unknown sync operation type:', type);
    }

    return true;
  } catch (error) {
    console.error('Sync operation failed:', error);
    return false;
  }
}

// Process all pending sync operations
export async function processSyncQueue(userId) {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return { success: false, reason: 'offline' };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { success: true, processed: 0 };
  }

  console.log(`Processing ${queue.length} sync operations...`);

  let processed = 0;
  let failed = 0;

  for (const operation of queue) {
    const success = await processSyncOperation(operation, userId);
    if (success) {
      removeFromSyncQueue(operation.id);
      processed++;
    } else {
      failed++;
    }
  }

  // Update last sync time
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  return { success: failed === 0, processed, failed };
}

// Fetch all user data from server
export async function fetchAllUserData(userId) {
  if (!isOnline()) {
    throw new Error('Cannot fetch data while offline');
  }

  const [profile, stats, exercises, foodLogs, achievements, chatHistory] = await Promise.all([
    api.getUserProfile(userId),
    api.getUserStats(userId),
    api.getExercises(userId, { limit: 100 }),
    api.getFoodLogs(userId, { limit: 100 }),
    api.getAchievements(userId),
    api.getChatHistory(userId, { limit: 100 })
  ]);

  return {
    profile,
    stats,
    exercises,
    foodLogs,
    achievements,
    chatHistory,
    fetchedAt: new Date().toISOString()
  };
}

// Sync with conflict resolution (server wins for older, client wins for newer)
export async function syncWithConflictResolution(userId, localData, serverData) {
  const merged = { ...serverData };

  // For each local item, check if it's newer than server
  for (const [key, localValue] of Object.entries(localData)) {
    if (!localValue || !serverData[key]) continue;

    const localTimestamp = new Date(localValue.updated_at || localValue.timestamp || 0);
    const serverTimestamp = new Date(serverData[key].updated_at || serverData[key].timestamp || 0);

    if (localTimestamp > serverTimestamp) {
      // Local is newer, push to server
      merged[key] = localValue;
      addToSyncQueue(key, 'update', localValue);
    }
  }

  // Process any pending updates
  await processSyncQueue(userId);

  return merged;
}

// Get last sync time
export function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_KEY);
}

// Setup online/offline listeners
export function setupSyncListeners(userId, onSyncComplete) {
  const handleOnline = async () => {
    console.log('Back online - syncing...');
    const result = await processSyncQueue(userId);
    if (onSyncComplete) {
      onSyncComplete(result);
    }
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

// Real-time subscription for data changes
export function subscribeToChanges(userId, table, callback) {
  const channel = supabase
    .channel(`${table}_changes_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

export default {
  getSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  isOnline,
  processSyncQueue,
  fetchAllUserData,
  syncWithConflictResolution,
  getLastSyncTime,
  setupSyncListeners,
  subscribeToChanges
};
