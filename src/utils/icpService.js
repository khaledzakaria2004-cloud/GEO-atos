import { createActor } from '../declarations/backend';
import { AuthClient } from '@dfinity/auth-client';

// Get canister IDs from environment or canister_ids.json
const getCanisterId = () => {
  try {
    const canisterIds = require('../../canister_ids.json');
    return process.env.DFX_NETWORK === 'ic' 
      ? canisterIds.backend.ic 
      : canisterIds.backend.local;
  } catch (e) {
    console.error("Could not get canister ID", e);
    return process.env.BACKEND_CANISTER_ID;
  }
};

// Initialize the backend actor
let actor = null;
let authClient = null;

export const initializeActor = async () => {
  authClient = await AuthClient.create();
  const isAuthenticated = await authClient.isAuthenticated();
  
  const canisterId = getCanisterId();
  
  if (isAuthenticated) {
    const identity = authClient.getIdentity();
    actor = createActor(canisterId, {
      agentOptions: {
        identity,
      },
    });
  } else {
    actor = createActor(canisterId);
  }
  
  return actor;
};

// Authentication functions
export const login = async () => {
  if (!authClient) await initializeActor();
  
  return new Promise((resolve, reject) => {
    authClient.login({
      identityProvider: process.env.DFX_NETWORK === 'ic' 
        ? 'https://identity.ic0.app/#authorize' 
        : `http://localhost:8000?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
      onSuccess: async () => {
        await initializeActor();
        resolve();
      },
      onError: (error) => {
        console.error("Login failed", error);
        reject(error);
      }
    });
  });
};

export const logout = async () => {
  if (!authClient) await initializeActor();
  await authClient.logout();
  actor = createActor(getCanisterId());
};

// User functions
export const createUser = async (email, name, fitnessLevel, goals, profilePicture = null) => {
  if (!actor) await initializeActor();
  return actor.createUser(email, name, fitnessLevel, goals, profilePicture ? [profilePicture] : []);
};

export const getUser = async (userId) => {
  if (!actor) await initializeActor();
  return actor.getUser(userId);
};

export const updateUser = async (userId, updates) => {
  if (!actor) await initializeActor();
  const { name, fitnessLevel, goals, profilePicture } = updates;
  return actor.updateUser(
    userId, 
    name ? [name] : [], 
    fitnessLevel ? [fitnessLevel] : [], 
    goals ? [goals] : [], 
    profilePicture ? [profilePicture] : []
  );
};

// Workout session functions
export const recordWorkoutSession = async (userId, items) => {
  if (!actor) await initializeActor();
  const dateISO = new Date().toISOString();
  return actor.recordWorkoutSession(userId, dateISO, items);
};

export const getWorkoutSessions = async (userId) => {
  if (!actor) await initializeActor();
  return actor.getWorkoutSessions(userId);
};

// Stats functions
export const getUserStats = async (userId) => {
  if (!actor) await initializeActor();
  return actor.getUserStats(userId);
};

// Achievement functions
export const recordAchievement = async (userId, code, title, level, progress, target) => {
  if (!actor) await initializeActor();
  return actor.recordAchievement(userId, code, title, level, progress, target);
};

export const getUserAchievements = async (userId) => {
  if (!actor) await initializeActor();
  return actor.getUserAchievements(userId);
};