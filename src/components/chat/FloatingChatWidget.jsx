import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

// Floating chat widget stub (Base44 removed)
export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="w-80 h-96 bg-white border border-gray-300 rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-indigo-600 text-white rounded-t-xl">
            <h4 className="font-semibold text-sm">Chat Assistant</h4>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex items-center justify-center p-4 text-gray-500 text-sm">
            <p>⚠️ Chat backend not connected yet. Coming soon!</p>
          </div>

          {/* Input area */}
          <div className="p-3 border-t bg-gray-50">
            <input
              disabled
              placeholder="Chat is disabled (stub mode)"
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-400 bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}