import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  Loader2, 
  Plus
} from 'lucide-react';
import { agentSDK } from '@/agents';
import { User } from '@/api/entities';
import MessageBubble from '@/components/chat/MessageBubble';

export default function Assistant() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationTitles, setConversationTitles] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      const unsubscribe = agentSDK.subscribeToConversation(currentConversation.id, (data) => {
        setMessages(data.messages);
        // Extract first user message for title
        const firstUserMessage = data.messages.find(msg => msg.role === 'user');
        if (firstUserMessage && !conversationTitles[currentConversation.id]) {
          setConversationTitles(prev => ({
            ...prev,
            [currentConversation.id]: firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '')
          }));
        }
      });
      return () => unsubscribe();
    }
  }, [currentConversation, conversationTitles]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const conversationList = await agentSDK.listConversations({
        agent_name: "realEstateAssistant"
      });

      // Filter conversations and load titles
      const conversationsWithUserMessages = [];
      const titles = {};

      for (const conversation of conversationList) {
        try {
          const fullConversation = await agentSDK.getConversation(conversation.id);
          const firstUserMessage = fullConversation.messages?.find(msg => msg.role === 'user');
          
          // Only include conversations that have at least one user message
          if (firstUserMessage) {
            conversationsWithUserMessages.push(conversation);
            titles[conversation.id] = firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '');
          }
        } catch (error) {
          console.error(`Error loading conversation ${conversation.id}:`, error);
        }
      }

      setConversations(conversationsWithUserMessages);
      setConversationTitles(titles);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };
  
  const refreshConversations = async () => {
    const conversationList = await agentSDK.listConversations({
      agent_name: "realEstateAssistant"
    });

    // Filter conversations to only show those with user messages
    const conversationsWithUserMessages = [];
    for (const conversation of conversationList) {
      try {
        const fullConversation = await agentSDK.getConversation(conversation.id);
        const hasUserMessage = fullConversation.messages?.some(msg => msg.role === 'user');
        if (hasUserMessage) {
          conversationsWithUserMessages.push(conversation);
        }
      } catch (error) {
        console.error(`Error checking conversation ${conversation.id}:`, error);
      }
    }

    setConversations(conversationsWithUserMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewConversation = async () => {
    try {
      const conversation = await agentSDK.createConversation({
        agent_name: "realEstateAssistant",
        metadata: {
          name: "New Chat",
          description: "Real Estate Assistant Chat"
        }
      });
      setCurrentConversation(conversation);
      setMessages([]);
      // Don't add to conversations list yet - wait until first user message
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    const fullConversation = await agentSDK.getConversation(conversation.id);
    setMessages(fullConversation.messages || []);
    
    // Extract and store first user message if not already stored
    if (!conversationTitles[conversation.id]) {
      const firstUserMessage = fullConversation.messages?.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        setConversationTitles(prev => ({
          ...prev,
          [conversation.id]: firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '')
        }));
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;
    
    setLoading(true);
    try {
      await agentSDK.addMessage(currentConversation, {
        role: "user",
        content: inputMessage
      });
      
      // If this is the first message in the conversation, use it as title and refresh conversations
      if (messages.length === 0 && !conversationTitles[currentConversation.id]) {
        setConversationTitles(prev => ({
          ...prev,
          [currentConversation.id]: inputMessage.substring(0, 60) + (inputMessage.length > 60 ? '...' : '')
        }));
        // Refresh conversations to include this new conversation with a user message
        await refreshConversations();
      }
      
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Generate conversation title from first user question
  const getConversationTitle = (conversation) => {
    // Use stored first user message if available
    if (conversationTitles[conversation.id]) {
      return conversationTitles[conversation.id];
    }
    
    // Fallback to metadata name or default
    if (conversation.metadata?.name && conversation.metadata.name !== 'New Chat') {
      return conversation.metadata.name;
    }
    
    return "New Chat";
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Real Estate Assistant</h2>
          <Button onClick={createNewConversation} size="icon" variant="ghost" className="text-gray-500 hover:text-gray-900">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`group relative w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                  currentConversation?.id === conversation.id 
                    ? 'bg-indigo-50 border border-indigo-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="font-medium text-gray-800 text-sm truncate pr-4">
                  {getConversationTitle(conversation)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(conversation.updated_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {conversations.length === 0 && (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Hi there! 👋</h4>
                  <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                    I'm your real estate assistant. Ask me about your deals, contacts, or important dates!
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="bg-white rounded-xl p-3 text-xs text-gray-500 border max-w-xs mx-auto">
                      "What's due this week on Main Street?"
                    </div>
                    <div className="bg-white rounded-xl p-3 text-xs text-gray-500 border max-w-xs mx-auto">
                      "Who is the buyer's agent for the Oak property?"
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your transactions, contacts, or important dates..."
                  className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:ring-0 shadow-none text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  size="icon"
                  className="rounded-full flex-shrink-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to Your AI Assistant
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Select a conversation or start a new one to ask questions about your transactions, contacts, and important dates.
              </p>
              <Button onClick={createNewConversation} className="clay-accent-mint">
                <MessageCircle className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}