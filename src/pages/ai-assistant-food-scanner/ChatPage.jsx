import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import Icon from '../../components/AppIcon';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ChatHistory from './components/ChatHistory';
import { saveConversationTurn, getConversationMessages } from '../../utils/api/chatApi';

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, message: "Hello! I'm your AI fitness coach. How can I assist you today?", isUser: false, timestamp: new Date() }]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState(null);
  const chatContainerRef = useRef(null);

  // Get user ID
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.principal || user.id;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setCurrentTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement?.classList?.add('dark');
    else document.documentElement?.classList?.remove('dark');
  }, []);

  // Load conversation from URL parameter
  useEffect(() => {
    const loadConversation = async () => {
      const conversationId = searchParams.get('conversation');
      if (conversationId) {
        try {
          const userId = getUserId();
          if (userId) {
            console.log('📥 Loading conversation:', conversationId);
            const msgs = await getConversationMessages(userId, conversationId);
            console.log('✅ Messages loaded:', msgs);

            if (msgs && msgs.length > 0) {
              const formattedMessages = msgs.map(m => ({
                id: m.id,
                message: m.message,
                isUser: m.is_user_message,
                timestamp: new Date(m.timestamp)
              }));
              setMessages(formattedMessages);
              setCurrentConversationId(conversationId);
              setCurrentConversationTitle(msgs[0].conversation_title || msgs[0].message.substring(0, 30));
            }
          }
        } catch (error) {
          console.error('❌ Error loading conversation:', error);
        }
      }
    };

    loadConversation();
  }, [searchParams]);

  useEffect(() => {
    if (chatContainerRef?.current) {
      chatContainerRef.current.scrollTop = chatContainerRef?.current?.scrollHeight;
    }
  }, [messages, isTyping]);

  const CHATBOT_API_KEY = 'AIzaSyBxlkXAIw-0_fRHwnkXzb7gEwrROKnlvk8';

  const handleSendMessage = async (message) => {
    const userMessage = { id: Date.now(), message, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    let success = false;
    let lastError = null;

    console.log('Using API Key:', CHATBOT_API_KEY ? `Key exists (${CHATBOT_API_KEY.substring(0, 10)}...)` : 'No key');
    const models = ['gemini-2.5-flash-lite', 'gemini-1.5-flash-latest'];

    for (const model of models) {
      if (success) break;
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CHATBOT_API_KEY}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are ATOS fit, a helpful AI fitness coach. You are fully equipped to provide both workout routines AND meal planning/prep advice. Answer the following question about fitness, health, meal planning, nutrition, or exercise: ${message}` }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error with ${model}:`, response.status, errorText);
          lastError = new Error(`API Error: ${response.status} - ${errorText}`);
          continue; // Try next model
        }

        const data = await response.json();
        console.log(`API Response from ${model}:`, data);
        let aiText = 'Sorry, no response from AI.';
        if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
          const parts = data.candidates[0]?.content?.parts;
          if (Array.isArray(parts) && parts.length > 0 && typeof parts[0].text === 'string') {
            aiText = parts[0].text.trim() || aiText;
          }
        }

        const aiMessage = { id: Date.now() + 1, message: aiText, isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);

        // Save to Supabase
        const userId = getUserId();
        if (userId) {
          try {
            console.log('📤 Saving conversation to Supabase');
            const result = await saveConversationTurn(userId, message, aiText, currentConversationId);
            console.log('✅ Conversation saved:', result);

            // Update conversation ID if this is a new conversation
            if (!currentConversationId && result.conversationId) {
              setCurrentConversationId(result.conversationId);
              setCurrentConversationTitle(message.substring(0, 30));
            }
          } catch (saveError) {
            console.error('❌ Error saving to Supabase:', saveError);
          }
        }

        success = true; // Mark as successful to stop loop
      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError);
        lastError = modelError;
      }
    }

    // If all models failed, show error message
    if (!success) {
      console.error('All models failed:', lastError);
      const errorMessage = { id: Date.now() + 1, message: `Error contacting AI service: ${lastError?.message || 'Unknown error'}. Please try again later.`, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleConversationSelect = (conversation) => {
    if (conversation) {
      setCurrentConversationId(conversation.id);
      setCurrentConversationTitle(conversation.title);
    } else {
      // New chat
      setCurrentConversationId(null);
      setCurrentConversationTitle(null);
      setMessages([{ id: 1, message: "Hello! I'm your AI fitness coach. How can I assist you today?", isUser: false, timestamp: new Date() }]);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light');
  const handleLogout = () => navigate('/login-screen');

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onSidebarToggle={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={toggleTheme}
        currentTheme={currentTheme}
        user={JSON.parse(localStorage.getItem('user')) || {}}
        onLogout={handleLogout}
      />
      <SidebarNavigation isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="pt-16 lg:pl-72 min-h-screen">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Chat History Sidebar */}
          <div className={`${isChatHistoryOpen ? 'block' : 'hidden'} lg:block w-80 border-r border-border`}>
            <ChatHistory
              isOpen={true}
              onClose={() => setIsChatHistoryOpen(false)}
              onConversationSelect={handleConversationSelect}
              currentConversationId={currentConversationId}
            />
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <button onClick={() => navigate('/dashboard')} className="hover:text-foreground transition-colors">Dashboard</button>
                  <Icon name="ChevronRight" size={16} />
                  <span className="text-foreground">AI Chatbot</span>
                </div>

                <button
                  onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                  className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Icon name="History" size={20} />
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl h-[calc(100vh-12rem)] flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Icon name="Bot" size={20} color="white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">ATOS fit</h3>
                        <p className="text-sm text-muted-foreground flex items-center space-x-1">
                          <span className="w-2 h-2 bg-success rounded-full inline-block"></span>
                          <span>Online</span>
                        </p>
                      </div>
                    </div>

                    {currentConversationTitle && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-card-foreground truncate max-w-48">
                          {currentConversationTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {messages.length} messages
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages?.map((m) => (
                    <ChatMessage key={m?.id} message={m?.message} isUser={m?.isUser} timestamp={m?.timestamp} />
                  ))}
                  {isTyping && <ChatMessage message="" isUser={false} timestamp={new Date()} isTyping={true} />}
                </div>

                <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
