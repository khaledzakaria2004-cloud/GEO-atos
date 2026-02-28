import { supabase } from '../supabase';

/**
 * Chat API - Handles all chatbot log database operations
 */

// Save a chat message
export async function saveChatMessage(userId, message, isUserMessage = true, conversationId = null) {
  const { data, error } = await supabase
    .from('chatbot_logs')
    .insert({
      user_id: userId,
      message: message,
      is_user_message: isUserMessage,
      conversation_id: conversationId,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Save a chat response (bot message)
export async function saveChatResponse(userId, response, conversationId = null) {
  return saveChatMessage(userId, response, false, conversationId);
}

// Save a complete message-response pair
export async function saveConversationTurn(userId, userMessage, botResponse, conversationId = null) {
  const convId = conversationId || crypto.randomUUID();
  
  const messages = [
    {
      user_id: userId,
      message: userMessage,
      is_user_message: true,
      conversation_id: convId,
      timestamp: new Date().toISOString()
    },
    {
      user_id: userId,
      message: botResponse,
      is_user_message: false,
      conversation_id: convId,
      timestamp: new Date().toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('chatbot_logs')
    .insert(messages)
    .select();

  if (error) throw error;
  return { conversationId: convId, messages: data };
}

// Get chat history for a user with pagination
export async function getChatHistory(userId, options = {}) {
  const { limit = 50, offset = 0, conversationId = null } = options;

  let query = supabase
    .from('chatbot_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })
    .range(offset, offset + limit - 1);

  if (conversationId) {
    query = query.eq('conversation_id', conversationId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get all conversations for a user (grouped)
export async function getConversations(userId, limit = 20) {
  console.log('📥 Getting conversations for user:', userId);
  
  const { data, error } = await supabase
    .from('chatbot_logs')
    .select('conversation_id, timestamp, message, conversation_title')
    .eq('user_id', userId)
    .eq('is_user_message', true)
    .order('timestamp', { ascending: false })
    .limit(limit * 10); // Get more to group properly

  if (error) {
    console.error('❌ Error getting conversations:', error);
    throw error;
  }

  // Group by conversation_id and get first message as title
  const conversations = {};
  data.forEach(log => {
    const convId = log.conversation_id || 'default';
    if (!conversations[convId]) {
      conversations[convId] = {
        id: convId,
        title: log.conversation_title || log.message.substring(0, 50) + (log.message.length > 50 ? '...' : ''),
        lastMessage: log.timestamp,
        messageCount: 1
      };
    } else {
      conversations[convId].messageCount++;
    }
  });

  const result = Object.values(conversations).slice(0, limit);
  console.log('✅ Conversations loaded:', result.length);
  return result;
}

// Get messages for a specific conversation
export async function getConversationMessages(userId, conversationId) {
  const { data, error } = await supabase
    .from('chatbot_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
}

// Delete a conversation (hard delete)
export async function deleteConversation(userId, conversationId) {
  console.log('🗑️ Deleting conversation:', conversationId);
  
  const { data, error } = await supabase
    .from('chatbot_logs')
    .delete()
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .select();

  if (error) {
    console.error('❌ Error deleting conversation:', error);
    throw error;
  }
  
  console.log('✅ Conversation deleted:', data?.length, 'messages');
  return data;
}

// Rename a conversation
export async function renameConversation(userId, conversationId, newTitle) {
  console.log('✏️ Renaming conversation:', conversationId, 'to:', newTitle);
  
  const { data, error } = await supabase
    .from('chatbot_logs')
    .update({ conversation_title: newTitle })
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .select();

  if (error) {
    console.error('❌ Error renaming conversation:', error);
    throw error;
  }
  
  console.log('✅ Conversation renamed:', data?.length, 'messages updated');
  return data;
}

// Clear all conversations for a user
export async function clearAllConversations(userId) {
  console.log('🗑️ Clearing all conversations for user:', userId);
  
  const { data, error } = await supabase
    .from('chatbot_logs')
    .delete()
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('❌ Error clearing conversations:', error);
    throw error;
  }
  
  console.log('✅ All conversations cleared:', data?.length, 'messages');
  return data;
}

// Get total message count for a user
export async function getMessageCount(userId) {
  const { count, error } = await supabase
    .from('chatbot_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count;
}

export default {
  saveChatMessage,
  saveChatResponse,
  saveConversationTurn,
  getChatHistory,
  getConversations,
  getConversationMessages,
  deleteConversation,
  renameConversation,
  clearAllConversations,
  getMessageCount
};
