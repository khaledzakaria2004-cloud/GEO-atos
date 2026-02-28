import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { getConversations, deleteConversation, renameConversation, clearAllConversations } from '../../../utils/api/chatApi';

const ChatHistory = ({ isOpen, onClose, onConversationSelect, currentConversationId }) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Get user ID
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.principal || user.id;
  };

  // Load conversations from Supabase
  const loadConversations = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      if (userId) {
        console.log('📥 Loading chat conversations for user:', userId);
        const convs = await getConversations(userId, 20);
        console.log('✅ Conversations loaded:', convs);
        setConversations(convs);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleConversationClick = (conversation) => {
    if (onConversationSelect) {
      onConversationSelect(conversation);
    }
    navigate(`/ai-assistant-food-scanner?conversation=${conversation.id}`);
    onClose();
  };

  const handleNewChat = () => {
    if (onConversationSelect) {
      onConversationSelect(null);
    }
    navigate('/ai-assistant-food-scanner');
    onClose();
  };

  const handleRenameClick = (conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || '');
    setMenuOpenId(null);
  };

  const handleRenameSubmit = async (conversationId) => {
    if (editTitle.trim()) {
      try {
        const userId = getUserId();
        await renameConversation(userId, conversationId, editTitle.trim());
        
        // Update local state
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, title: editTitle.trim() } : conv
        ));
      } catch (error) {
        console.error('❌ Error renaming conversation:', error);
      }
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    setShowDeleteConfirm(conversationId);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      try {
        const userId = getUserId();
        await deleteConversation(userId, showDeleteConfirm);
        
        // Update local state
        setConversations(prev => prev.filter(conv => conv.id !== showDeleteConfirm));
        
        // If we deleted the current conversation, redirect to new chat
        if (currentConversationId === showDeleteConfirm) {
          handleNewChat();
        }
      } catch (error) {
        console.error('❌ Error deleting conversation:', error);
      }
    }
    setShowDeleteConfirm(null);
  };

  const handleClearAll = async () => {
    try {
      const userId = getUserId();
      await clearAllConversations(userId);
      setConversations([]);
      handleNewChat();
    } catch (error) {
      console.error('❌ Error clearing conversations:', error);
    }
    setShowClearConfirm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black/50 lg:hidden" 
        onClick={onClose}
      ></div>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border lg:relative lg:w-full transform transition-transform lg:transform-none">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Chat History</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Icon name="Plus" size={16} />
            <span>New Chat</span>
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={loadConversations}
              className="flex-1 flex items-center justify-center space-x-2 p-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Icon name="RefreshCw" size={14} />
              <span>Refresh</span>
            </button>
            
            {conversations.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex-1 flex items-center justify-center space-x-2 p-2 text-sm bg-muted text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Icon name="Trash2" size={14} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Icon name="Loader" size={48} className="mx-auto mb-2 opacity-50 animate-spin" />
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to see your history here</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-8">
                      {editingId === conversation.id ? (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(conversation.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameSubmit(conversation.id)}
                            className="p-1 hover:bg-success/10 text-success rounded"
                          >
                            <Icon name="Check" size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-medium text-card-foreground truncate">
                            {conversation.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {conversation.messageCount || 0} messages
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conversation.lastMessage)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Options Menu */}
                    {editingId !== conversation.id && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id);
                          }}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Icon name="MoreVertical" size={14} className="text-muted-foreground" />
                        </button>
                        
                        {menuOpenId === conversation.id && (
                          <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 min-w-32 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameClick(conversation);
                              }}
                              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-muted transition-colors text-sm"
                            >
                              <Icon name="Edit2" size={14} />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, conversation.id)}
                              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors text-sm"
                            >
                              <Icon name="Trash2" size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Delete Conversation
              </h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear All Confirmation Modal */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Clear All Conversations
              </h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete all conversations? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
