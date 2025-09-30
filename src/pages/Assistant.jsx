import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot, Loader2, Plus } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    setLoading(true);

    // Just echo back the message (stub mode)
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: inputMessage },
      { id: Date.now() + 1, role: "assistant", content: "⚠️ Chat backend not connected yet." },
    ]);

    setInputMessage("");
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Assistant</h2>
          <Button size="icon" variant="ghost" className="text-gray-500 hover:text-gray-900">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 text-gray-400 text-sm flex items-center justify-center">
          <p>No conversations (stub mode)</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Hi there! 👋</h4>
              <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                The Assistant is in stub mode. Chat features will be connected later.
              </p>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
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
      </div>
    </div>
  );
}