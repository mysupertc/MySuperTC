
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageCircle,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  Mail, // New import
  Phone, // New import
  Building // New import
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// New ContactCard Component
const ContactCard = ({ content }) => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const details = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      if (key.includes('Contact')) details.name = value;
      else if (key.includes('Role')) details.role = value;
      else if (key.includes('Brokerage')) details.brokerage = value;
      else if (key.includes('Email')) details.email = value;
      else if (key.includes('Cell')) details.cell = value;
      else if (key.includes('Office')) details.office = value;
    }
  });

  if (!details.name) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm my-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{details.name}</h4>
          {details.role && <p className="text-sm text-gray-500">{details.role}</p>}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {details.brokerage && (
          <div className="flex items-center gap-3 text-gray-700">
            <Building className="w-4 h-4 text-gray-400" />
            <span>{details.brokerage}</span>
          </div>
        )}
        {details.email && (
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${details.email}`} className="text-blue-600 hover:underline">{details.email}</a>
          </div>
        )}
        {details.cell && (
          <div className="flex items-center gap-3 text-gray-700">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{details.cell} (Cell)</span>
          </div>
        )}
        {details.office && (
          <div className="flex items-center gap-3 text-gray-700">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{details.office} (Office)</span>
          </div>
        )}
      </div>
    </div>
  );
};


export default function FloatingChatWidget({ onStateChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Notify parent component when state changes
  const handleToggleOpen = (newIsOpen) => {
    setIsOpen(newIsOpen);
    if (onStateChange) {
      onStateChange(newIsOpen);
    }
  };

  useEffect(() => {
    // Load last active conversation from localStorage on initial mount
    const loadLastConversation = async () => {
      const lastConversationId = localStorage.getItem('activeConversationId');
      if (lastConversationId) {
        try {
          const conversation = await agentSDK.getConversation(lastConversationId);
          // Only set conversation if it actually has messages. Otherwise, it's an empty, old conversation.
          if (conversation && conversation.messages && conversation.messages.length > 0) {
            setCurrentConversation(conversation);
            setMessages(conversation.messages);
          } else {
            console.log("Last conversation was empty or invalid, clearing it.");
            localStorage.removeItem('activeConversationId');
          }
        } catch (error) {
          console.error("Failed to load last conversation:", error);
          localStorage.removeItem('activeConversationId'); // Clear if invalid
        }
      }
    };
    loadLastConversation();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      const unsubscribe = agentSDK.subscribeToConversation(currentConversation.id, (data) => {
        setMessages(data.messages);

        // Count unread messages if chat is closed
        if (!isOpen && data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            setUnreadCount(prev => prev + 1);
          }
        }
      });
      return unsubscribe;
    }
  }, [currentConversation, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createConversation = async () => {
    try {
      const conversation = await agentSDK.createConversation({
        agent_name: "realEstateAssistant",
        metadata: {
          name: "Quick Chat",
          description: "Real Estate Assistant Chat"
        }
      });
      setCurrentConversation(conversation);
      setMessages([]);
      localStorage.setItem('activeConversationId', conversation.id); // Save new conversation ID
      return conversation; // Return the new conversation
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (messageContent) => {
    const message = typeof messageContent === 'string' ? messageContent : inputMessage;
    if (!message.trim()) return;

    let activeConversation = currentConversation;
    if (!activeConversation) {
      activeConversation = await createConversation();
    }

    setLoading(true);
    // Clear input only if the message came from the textarea state
    if (typeof messageContent !== 'string') {
      setInputMessage('');
    }

    try {
      await agentSDK.addMessage(activeConversation, {
        role: "user",
        content: message
      });
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

  const handleOpenChat = async () => {
    handleToggleOpen(true); // Use handleToggleOpen here
    setUnreadCount(0);

    if (!currentConversation) {
      const lastConversationId = localStorage.getItem('activeConversationId');
      if (lastConversationId) {
        try {
          const conversation = await agentSDK.getConversation(lastConversationId);
          // Only set conversation if it actually has messages. Otherwise, it's an empty, old conversation.
          if (conversation && conversation.messages && conversation.messages.length > 0) {
            setCurrentConversation(conversation);
            setMessages(conversation.messages);
          } else {
            console.log("Last conversation on open was empty or invalid, creating new one.");
            localStorage.removeItem('activeConversationId'); // Clear if invalid
            await createConversation();
          }
        } catch (error) {
           console.error("Failed to load last conversation on open, creating new one:", error);
           localStorage.removeItem('activeConversationId'); // Clear if invalid
           await createConversation();
        }
      } else {
        await createConversation();
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-8 z-[100000]">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
          onClick={() => handleToggleOpen(true)}
        >
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full min-w-[24px] h-[24px] flex items-center justify-center text-xs font-bold animate-bounce">
              {unreadCount}
            </Badge>
          )}
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 z-[100000] w-[420px] h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 ${isMinimized ? 'h-16 w-64' : ''}`}>
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
              <p className="text-blue-100 text-sm">Here to help with your deals</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-lg"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleOpen(false)}
              className="text-white hover:bg-white/10 h-8 w-8 p-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 h-[390px] overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Hi there! 👋</h4>
                <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                  I'm your real estate assistant. Ask me about your deals, contacts, or important dates!
                </p>
                <div className="mt-4 space-y-2">
                  <div className="bg-white rounded-xl p-3 text-xs text-gray-500 border">
                    "What's due this week on Main Street?"
                  </div>
                  <div className="bg-white rounded-xl p-3 text-xs text-gray-500 border">
                    "Who is the buyer's agent for the Oak property?"
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[280px] ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-lg rounded-2xl px-4 py-3'
                        : ''
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="text-sm leading-relaxed">
                        {message.content}
                      </div>
                    ) : (
                      <ReactMarkdown
                        className="text-sm prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1"
                        components={{
                          p: ({ children }) => <p className="text-gray-800 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          ul: ({ children }) => <ul className="list-none p-0 my-2 space-y-2">{children}</ul>,
                          li: ({ children }) => {
                            const textContent = Array.isArray(children)
                              ? children.map(c => typeof c === 'string' ? c : (c.props?.children ?? '')).join('')
                              : String(children);
                            return (
                              <button
                                onClick={() => sendMessage(textContent)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full transition-colors w-full text-left border border-blue-100"
                              >
                                {textContent}
                              </button>
                            );
                          },
                          blockquote: ({ node, ...props }) => {
                            // Extract text content from the first child paragraph of the blockquote
                            // This assumes the contact information is typically within a single paragraph
                            // or structured with lines directly under a single blockquote entry.
                            const content = node.children[0]?.children?.map(child => child.value)?.join('') || '';

                            if (content.startsWith('**Contact:')) {
                              return <ContactCard content={content} />;
                            }
                            // Default rendering for other blockquotes
                            return <blockquote className="border-l-2 border-gray-300 pl-3 my-2 text-gray-600" {...props} />;
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your deals, dates, contacts..."
                  className="resize-none border-gray-200 rounded-2xl bg-gray-50 focus:bg-white transition-colors pr-12 min-h-[44px] text-sm leading-relaxed"
                  rows={1}
                  style={{ maxHeight: '120px' }}
                />
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 px-4 shadow-sm"
                size="sm"
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
      )}
    </div>
  );
}
