import React, { useState } from "react";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { api } from "../utils/api"; // Import the centralized API functions

interface Document {
  id: string;
  filename: string;
  chunks_count: number;
  upload_date: string;
}

interface DocumentCardProps {
  doc: Document;
  onDelete: (documentId: string) => void;
}

const DocumentCard = ({ doc, onDelete }: DocumentCardProps) => {
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

interface DocumentListProps {
  documents: Document[];
  onDeleteDocument: (documentId: string) => void;
  onRefreshDocuments: () => void;
}

export default function DocumentList({
  documents,
  onDeleteDocument,
  onRefreshDocuments,
}: DocumentListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Uploaded Documents
        </h2>
        <button
          onClick={onRefreshDocuments}
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
            <DocumentCard key={idx} doc={doc} onDelete={onDeleteDocument} />
          ))}
        </div>
      )}
    </div>
  );
}
