import Head from "next/head";
import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Document } from "@/utils/types";
import Toast, { ToastInterface } from "@/components/Toast";

export default function Home() {
  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [toast, setToast] = useState<ToastInterface | null>(null);
  const [activeTab, setActiveTab] = useState("chat");

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const showToast = (val: ToastInterface) => {
    console.log("showtoast", val);
    setToast(val);
  };

  const loadDocuments = async () => {
    try {
      const response = await api.getDocuments();
      setDocuments(response.documents || []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      showToast({ message: "Failed to load documents", type: "error" });
    }
  };
  return (
    <div className="h-full">
      <Head>
        <title>RAG-based Financial Q&A System</title>
        <meta
          name="description"
          content="AI-powered Q&A system for financial documents"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-full flex flex-col bg-gray-50">
        <Header
          documents={documents}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="py-6 flex-1 flex items-center justify-center h-full min-h-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-row lg:flex-row gap-6 min-h-0 w-full h-full flex-1">
            <Sidebar loadDocuments={loadDocuments} showToast={showToast} />

            <ChatInterface
              activeTab={activeTab}
              loadDocuments={loadDocuments}
              documents={documents}
              showToast={showToast}
            />
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}
      </main>
    </div>
  );
}
