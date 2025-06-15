/* eslint-disable @typescript-eslint/no-explicit-any */
export const api = {
  uploadPDF: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload PDF");
    }
    return response.json();
  },

  sendMessage: async (question: string, sessionId: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, session_id: sessionId }),
    });
    if (!response.ok) {
      throw new Error("Failed to send message");
    }
    return response.json();
  },

  getDocuments: async () => {
    const response = await fetch("/api/documents");
    if (!response.ok) {
      throw new Error("Failed to load documents");
    }
    return response.json();
  },

  deleteDocument: async (documentId: string) => {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete document");
    }
    return response.json();
  },

  calculateMetrics: async (data: any) => {
    const response = await fetch("/api/calculate-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to calculate metrics");
    }
    return response.json();
  },

  generateChart: async (data: any) => {
    const response = await fetch("/api/generate-chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to generate chart");
    }
    return response.json();
  },

  submitFeedback: async (feedback: any) => {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    if (!response.ok) {
      throw new Error("Failed to submit feedback");
    }
    return response.json();
  },
};
