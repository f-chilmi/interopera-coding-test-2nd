import { Document } from "@/utils/types";
import { FileText, Loader2, Trash2 } from "lucide-react";
import React, { useState } from "react";

const DocumentCard = ({
  doc,
  onDelete,
}: {
  doc: Document;
  onDelete: (id: string) => void;
}) => {
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

export default DocumentCard;
