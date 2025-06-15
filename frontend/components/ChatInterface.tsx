/* eslint-disable @typescript-eslint/no-unused-vars */
import { api } from "@/utils/api";
import { Document } from "@/utils/types";
import {
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToastInterface } from "./Toast";
import DocumentCard from "./DocumentCard";

interface Source {
  content: string;
  metadata: {
    page_width: number;
    rotation: number;
    document_id: string;
    page: number;
    filename: string;
    chunk_index: number;
    total_chunks_in_page: number;
    upload_date: Date;
    page_height: number;
    chunk_id: string;
  };
  page: number;
  score: number;
}
interface Message {
  id?: string;
  type: "user" | "assistant";
  answer?: string;
  text: string;
  processing_time?: number;
  sources?: Source[];
}

interface ChatInterfaceProps {
  documents: Document[];
  activeTab: string;
  loadDocuments: () => void;
  showToast: (val: ToastInterface) => void;
}

const MessageComponent = ({
  message,
  isUser,
  sources,
  onFeedback,
}: {
  message: string;
  isUser: boolean;
  sources?: Source[];
  onFeedback: (message: string, rating: number) => void;
}) => {
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
            isUser ? "bg-blue-900  ml-12" : "bg-gray-100  mr-12"
          }`}
        >
          <div
            className={`prose max-w-none ${
              isUser ? "text-white" : "text-gray-800"
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
          </div>

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
          <div className="mt-2 flex items-center gap-1 bg-white p-2 rounded border border-gray-300 shadow-sm">
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

const exampleQuestions = [
  "What is the total revenue for 2025?",
  "What is the year-over-year operating profit growth rate?",
  "What are the main cost items?",
  "How is the cash flow situation?",
  "What is the debt ratio?",
];

export default function ChatInterface(props: ChatInterfaceProps) {
  const { documents, activeTab, loadDocuments, showToast } = props;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { text: userMessage, type: "user" }]);
    setIsSending(true);

    try {
      const response = await api.sendMessage(userMessage, sessionId);
      setMessages((prev) => [
        ...prev,
        {
          text: response.answer,
          isUser: false,
          type: "assistant",
          sources: response.sources,
        },
      ]);
    } catch (error) {
      showToast({ message: "Failed to send message", type: "error" });
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error processing your question.",
          isUser: false,
          type: "user",
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

  const handleDeleteDocument = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
      showToast({ message: "Document deleted successfully", type: "success" });
      loadDocuments();
    } catch (error) {
      showToast({ message: "Failed to delete document", type: "error" });
    }
  };

  const handleFeedback = async (message: string, rating: number) => {
    try {
      await api.submitFeedback({
        question: messages[messages.length - 2]?.text || "",
        answer: message,
        rating,
        session_id: sessionId,
      });
      showToast({ message: "Thank you for your feedback!", type: "success" });
    } catch (error) {
      showToast({ message: "Failed to submit feedback", type: "error" });
    }
  };

  const askTemplateQuestion = (q: string) => {
    setInputMessage(q);
  };

  return (
    <div className="w-full lg:w-3/4 h-full overflow-auto min-h-0">
      {activeTab === "chat" ? (
        <div className="bg-white rounded-lg shadow-sm flex flex-col h-full">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare
                  className="mx-auto text-gray-400 mb-4"
                  size={48}
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Financial Q&A
                </h3>
                <p className="text-gray-500 mb-4">
                  Upload your financial documents and start asking questions
                  about them.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Example questions:
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    {exampleQuestions.map((q) => (
                      <li
                        key={q}
                        className="cursor-pointer"
                        onClick={() => askTemplateQuestion(q)}
                      >
                        • {q}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageComponent
                  key={idx}
                  message={msg.text}
                  isUser={msg.type === "user"}
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

          {/* Input Area */}
          <div className="border-t border-gray-300 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your financial documents..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
        </div>
      ) : (
        /* Documents Tab */
        <div className="bg-white rounded-lg shadow-md p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Uploaded Documents
            </h2>
            <button
              onClick={loadDocuments}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              Refresh
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents uploaded
              </h3>
              <p className="text-gray-500 mb-4">
                Upload your first PDF document to get started with financial
                analysis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, idx) => (
                <DocumentCard
                  key={idx}
                  doc={doc}
                  onDelete={() => handleDeleteDocument(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
