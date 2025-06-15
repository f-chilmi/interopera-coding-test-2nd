/* eslint-disable @typescript-eslint/no-unused-vars */
import { api } from "@/utils/api";
import { BarChart3, Calculator, Loader2, Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import { ToastInterface } from "./Toast";

function Sidebar({
  loadDocuments,
  showToast,
}: {
  loadDocuments: () => void;
  showToast: (val: ToastInterface) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast({ message: "Please select a PDF file", type: "error" });
      return;
    }

    setIsUploading(true);
    try {
      await api.uploadPDF(file);
      showToast({
        message: `Successfully uploaded ${file.name}`,
        type: "success",
      });
      loadDocuments();
    } catch (error) {
      showToast({ message: "Failed to upload PDF", type: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-1/4 hidden lg:block">
      {/* <div className="lg:col-span-1"> */}
      <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6 h-full">
        <h3 className="font-medium text-gray-900 mb-4">Upload Documents</h3>

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
      </div>
    </div>
  );
}

export default Sidebar;
