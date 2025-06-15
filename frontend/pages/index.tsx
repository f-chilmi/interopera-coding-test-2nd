import Head from "next/head";
import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Send,
  FileText,
  MessageSquare,
  BarChart3,
  Calculator,
  Trash2,
  Download,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ThumbsUp,
  ThumbsDown,
  Star,
} from "lucide-react";
import { api } from "@/utils/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// // Mock API functions - replace with your actual API calls
// const api = {
//   uploadPDF: async (file) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     const response = await fetch("/api/upload", {
//       method: "POST",
//       body: formData,
//     });
//     return response.json();
//   },

//   sendMessage: async (question, sessionId) => {
//     const response = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question, session_id: sessionId }),
//     });
//     return response.json();
//   },

//   getDocuments: async () => {
//     const response = await fetch("/api/documents");
//     return response.json();
//   },

//   deleteDocument: async (documentId) => {
//     const response = await fetch(`/api/documents/${documentId}`, {
//       method: "DELETE",
//     });
//     return response.json();
//   },

//   calculateMetrics: async (data) => {
//     const response = await fetch("/api/calculate-metrics", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },

//   generateChart: async (data) => {
//     const response = await fetch("/api/generate-chart", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     return response.json();
//   },

//   submitFeedback: async (feedback) => {
//     const response = await fetch("/api/feedback", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(feedback),
//     });
//     return response.json();
//   },
// };

// Toast Component
const Toast = ({ message, type, onClose, duration = 3000 }) => {
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

// Loading Overlay Component
const LoadingOverlay = ({ message }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
    <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-xl">
      <Loader2 className="animate-spin text-blue-500" size={24} />
      <span className="text-gray-700">{message}</span>
    </div>
  </div>
);

// Document Card Component
const DocumentCard = ({ doc, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(doc.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <FileText className="text-blue-500 flex-shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {doc.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {doc.chunks_count} chunks • Uploaded{" "}
              {new Date(doc.upload_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

// Message Component
const Message = ({ message, isUser, sources, onFeedback }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);

  const handleFeedback = async (rating) => {
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
            isUser ? "bg-blue-500  ml-12" : "bg-gray-100  mr-12"
          }`}
        >
          {/* <div className="whitespace-pre-wrap">{message}</div> */}
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

// Main Component
const RAGComponent = () => {
  // State management
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  // Refs
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper functions
  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const loadDocuments = async () => {
    try {
      const response = await api.getDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      showToast("Failed to load documents", "error");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please select a PDF file", "error");
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.uploadPDF(file);
      showToast(`Successfully uploaded ${file.name}`, "success");
      loadDocuments();
    } catch (error) {
      showToast("Failed to upload PDF", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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

  const handleDeleteDocument = async (docId) => {
    try {
      await api.deleteDocument(docId);
      showToast("Document deleted successfully", "success");
      loadDocuments();
    } catch (error) {
      showToast("Failed to delete document", "error");
    }
  };

  const handleFeedback = async (message, rating) => {
    try {
      await api.submitFeedback({
        question: messages[messages.length - 2]?.text || "",
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Financial Q&A Assistant
                </h1>
                <p className="text-sm text-gray-500">
                  AI-powered financial document analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "chat"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <MessageSquare size={16} className="inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "documents"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Documents ({documents.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-6">
              <h3 className="font-medium text-gray-900 mb-4">
                Upload Documents
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Upload size={20} />
                )}
                {isUploading ? "Uploading..." : "Upload PDF"}
              </button>

              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-gray-600 hover:text-blue-600 py-1">
                    <Calculator size={14} className="inline mr-2" />
                    Calculate Metrics
                  </button>
                  <button className="w-full text-left text-sm text-gray-600 hover:text-blue-600 py-1">
                    <BarChart3 size={14} className="inline mr-2" />
                    Generate Charts
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "chat" ? (
              <div className="bg-white rounded-lg shadow-sm border flex flex-col h-[calc(100vh-200px)]">
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
                        Upload your financial documents and start asking
                        questions about them.
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
                        <Loader2
                          className="animate-spin text-gray-500"
                          size={20}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
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
              </div>
            ) : (
              /* Documents Tab */
              <div className="bg-white rounded-lg shadow-sm border p-6">
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
                    <FileText
                      className="mx-auto text-gray-400 mb-4"
                      size={48}
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No documents uploaded
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Upload your first PDF document to get started with
                      financial analysis.
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
        </div>
      </div>

      {/* Loading Overlay */}
      {isUploading && <LoadingOverlay message="Processing PDF document..." />}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Custom Animations */}
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
};

export default function Home() {
  return (
    <div>
      <Head>
        <title>RAG-based Financial Q&A System</title>
        <meta
          name="description"
          content="AI-powered Q&A system for financial documents"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <RAGComponent />
      </main>
    </div>
  );
}
