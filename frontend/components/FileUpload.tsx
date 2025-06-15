import React, { useState, useRef } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { api } from "../utils/api"; // Import the centralized API functions

interface FileUploadProps {
  onUploadComplete: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function FileUpload({
  onUploadComplete,
  showToast,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      showToast("Please select a PDF file", "error");
      return;
    }

    // 2. Validate file size (add your own logic if needed, e.g., max 10MB)
    // if (file.size > 10 * 1024 * 1024) { // 10 MB
    //   showToast('File size exceeds 10MB limit', 'error');
    //   return;
    // }

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // 2. Send POST request to /api/upload
      await api.uploadPDF(file);
      showToast(`Successfully uploaded ${file.name}`, "success");
      onUploadComplete();
    } catch (error) {
      showToast("Failed to upload PDF", "error");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Prevent default to allow drop
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-6">
      <h3 className="font-medium text-gray-900 mb-4">Upload Documents</h3>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag & Drop area and Upload button */}
      <div
        className="upload-area border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <p className="mt-2 text-gray-700">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600 mb-1">Drag & drop PDF here, or</p>
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Browse files
            </button>
          </>
        )}
      </div>

      {/* Removed the separate upload button as it's integrated into the drag & drop area */}
      {/* Progress bar - not explicitly implemented as a visual bar, but the loading state indicates progress */}
    </div>
  );
}
