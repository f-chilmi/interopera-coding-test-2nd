import { Document } from "@/utils/types";
import { FileText, MessageSquare } from "lucide-react";
import React from "react";

function Header({
  documents,
  activeTab,
  setActiveTab,
}: {
  documents: Document[];
  activeTab: string;
  setActiveTab: (val: string) => void;
}) {
  return (
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

          <div className="flex flex-col lg:flex-row items-center gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                activeTab === "chat"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MessageSquare size={16} className="inline" />
              <p className="hidden  ml-2 lg:block">Chat</p>
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                activeTab === "documents"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileText size={16} className="inline " />
              <p className="hidden lg:block ml-2">
                {" "}
                Documents ({documents.length})
              </p>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
