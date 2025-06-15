import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Star,
  X,
} from "lucide-react";
import { api } from "../utils/api"; // Import the centralized API functions

interface Message {
  text: string;
  isUser: boolean;
  sources?: any[];
}

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  const Icon =
    type === "success"
      ? CheckCircle
      : type === "error"
      ? AlertCircle
      : MessageSquare;

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right z-50`}
    >
      <Icon size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
};

interface MessageProps {
  message: string;
  isUser: boolean;
  sources?: any[];
  onFeedback: (message: string, rating: number) => void;
}

const Message = ({ message, isUser, sources, onFeedback }: MessageProps) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);

  const handleFeedback = async (rating: number) => {
    setFeedbackRating(rating);
    await onFeedback(message, rating);
    setShowFeedback(false);
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`max-w-3xl ${isUser ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? "bg-blue-500 text-white ml-12"
              : "bg-gray-100 text-gray-800 mr-12"
          }`}
        >
          <div className="whitespace-pre-wrap">{message}</div>

          {sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-sm font-medium mb-2">Sources:</h4>
              <div className="space-y-1">
                {sources.map((source, idx) => (
                  <div key={idx} className="text-xs opacity-80">
                    <span className="font-medium">Page {source.page}</span> -{" "}
                    {source.content.substring(0, 100)}...
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isUser && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Rate this answer
              </button>
            </div>
          )}
        </div>

        {showFeedback && !isUser && (
          <div className="mt-2 flex items-center gap-1 bg-white p-2 rounded border shadow-sm">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleFeedback(rating)}
                className="text-yellow-400 hover:text-yellow-500"
              >
                <Star
                  size={16}
                  fill={rating <= feedbackRating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatInterfaceProps {
  sessionId: string;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function ChatInterface({
  sessionId,
  showToast,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setIsSending(true);

    try {
      const response = await api.sendMessage(userMessage, sessionId);
      setMessages((prev) => [
        ...prev,
        {
          text: response.answer,
          isUser: false,
          sources: response.sources,
        },
      ]);
    } catch (error) {
      showToast("Failed to send message", "error");
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error processing your question.",
          isUser: false,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleFeedback = async (message: string, rating: number) => {
    try {
      await api.submitFeedback({
        question: messages[messages.length - 2]?.text || "", // Assuming the previous message was the user's question
        answer: message,
        rating,
        session_id: sessionId,
      });
      showToast("Thank you for your feedback!", "success");
    } catch (error) {
      showToast("Failed to submit feedback", "error");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border flex flex-col h-[calc(100vh-200px)]">
      {/* Messages display area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Financial Q&A
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your financial documents and start asking questions about
              them.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-blue-900 mb-2">
                Example questions:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• What was the revenue for the last quarter?</li>
                <li>• Calculate the debt-to-equity ratio</li>
                <li>• Show me the profit margins</li>
                <li>• What are the main expenses?</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <Message
              key={idx}
              message={msg.text}
              isUser={msg.isUser}
              sources={msg.sources}
              onFeedback={handleFeedback}
            />
          ))
        )}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 mr-12">
              <Loader2 className="animate-spin text-gray-500" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your financial documents..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
