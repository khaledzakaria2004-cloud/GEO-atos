import { useState, useEffect, useCallback } from 'react';
import {
  getChatConversations,
  saveChatConversation,
  updateChatConversation,
  addMessageToConversation,
  getChatConversation,
  deleteChatConversation,
  getChatSettings,
  updateChatSettings,
  cleanupOldConversations
} from '../utils/workoutStorage';

export default function useChatStorage() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadData = useCallback(() => {
    try {
      setLoading(true);
      const allConversations = getChatConversations();
      const chatSettings = getChatSettings();
      
      setConversations(allConversations);
      setSettings(chatSettings);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create a new conversation
  const createConversation = useCallback((initialMessages = []) => {
    try {
      const conversation = {
        messages: initialMessages
      };
      
      const savedConversation = saveChatConversation(conversation);
      if (savedConversation) {
        setConversations(getChatConversations());
        setCurrentConversation(savedConversation);
        return savedConversation;
      }
      return null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, []);

  // Load a specific conversation
  const loadConversation = useCallback((conversationId) => {
    try {
      const conversation = getChatConversation(conversationId);
      setCurrentConversation(conversation);
      return conversation;
    } catch (error) {
      console.error('Error loading conversation:', error);
      return null;
    }
  }, []);

  // Add a message to the current conversation
  const addMessage = useCallback((message) => {
    try {
      if (!currentConversation) {
        // Create a new conversation if none exists
        const newConversation = createConversation([message]);
        return newConversation;
      }
      
      const updatedConversation = addMessageToConversation(currentConversation.id, message);
      if (updatedConversation) {
        setCurrentConversation(updatedConversation);
        setConversations(getChatConversations());
        return updatedConversation;
      }
      return null;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [currentConversation, createConversation]);

  // Update conversation
  const updateConversation = useCallback((conversationId, updates) => {
    try {
      const updatedConversation = updateChatConversation(conversationId, updates);
      if (updatedConversation) {
        setConversations(getChatConversations());
        if (currentConversation && currentConversation.id === conversationId) {
          setCurrentConversation(updatedConversation);
        }
        return updatedConversation;
      }
      return null;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return null;
    }
  }, [currentConversation]);

  // Delete a conversation
  const deleteConversation = useCallback((conversationId) => {
    try {
      const success = deleteChatConversation(conversationId);
      if (success) {
        setConversations(getChatConversations());
        if (currentConversation && currentConversation.id === conversationId) {
          setCurrentConversation(null);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }, [currentConversation]);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    try {
      const updatedSettings = updateChatSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      return null;
    }
  }, []);

  // Clear current conversation (start new)
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
  }, []);

  // Auto-cleanup old conversations based on settings
  const performCleanup = useCallback(() => {
    try {
      if (settings && settings.maxConversations) {
        cleanupOldConversations(settings.maxConversations);
        setConversations(getChatConversations());
      }
    } catch (error) {
      console.error('Error performing cleanup:', error);
    }
  }, [settings]);

  // Auto-save current conversation
  const autoSaveConversation = useCallback((messages) => {
    try {
      if (settings && settings.autoSave && currentConversation) {
        updateConversation(currentConversation.id, { messages });
      }
    } catch (error) {
      console.error('Error auto-saving conversation:', error);
    }
  }, [currentConversation, settings, updateConversation]);

  return {
    // Data
    conversations,
    currentConversation,
    settings,
    loading,
    
    // Actions
    createConversation,
    loadConversation,
    addMessage,
    updateConversation,
    deleteConversation,
    updateSettings,
    clearCurrentConversation,
    performCleanup,
    autoSaveConversation,
    
    // Utilities
    refreshData: loadData
  };
}