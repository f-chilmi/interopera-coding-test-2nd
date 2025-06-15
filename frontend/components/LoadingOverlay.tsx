import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay = ({ message }: LoadingOverlayProps) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
    <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-xl">
      <Loader2 className="animate-spin text-blue-500" size={24} />
      <span className="text-gray-700">{message}</span>
    </div>
  </div>
);

export default LoadingOverlay;
