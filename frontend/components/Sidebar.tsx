import React from "react";
import { Upload, Calculator, BarChart3, Loader2 } from "lucide-react";
import FileUpload from "./FileUpload"; // Import the new FileUpload component

interface SidebarProps {
  onFileUploadComplete: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

const Sidebar = ({ onFileUploadComplete, showToast }: SidebarProps) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-6">
        <FileUpload
          onUploadComplete={onFileUploadComplete}
          showToast={showToast}
        />

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
  );
};

export default Sidebar;
