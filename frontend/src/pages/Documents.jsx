import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../api/documentApi';
import { 
  FileText, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers
} from 'lucide-react';
import UploadDocumentModal from '../components/UploadDocumentModal';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await getDocuments(page, 20);
      setDocs(res.data.data);
      setTotal(res.data.total);
    } catch {
      /* silent */
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document and all its extracted questions?')) return;
    try {
      await deleteDocument(id);
      loadDocuments();
    } catch {
      /* silent */
    }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 animate-spin" />
            PROCESSING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
            QUEUED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} documents processed across examination question banks
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Table Surface */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5">Filename</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pages</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Review Items</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No documents found. Click "Upload Document" to begin extraction.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="flex items-center gap-2.5 font-semibold text-slate-900 hover:text-emerald-700 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="truncate max-w-xs">{doc.original_filename}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-slate-600 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{renderStatusBadge(doc.status)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {doc.total_pages || 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {doc.question_count || 0}
                    </td>
                    <td className="py-3 px-4">
                      {doc.review_item_count > 0 ? (
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                          {doc.review_item_count} items
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadDocuments();
          }}
        />
      )}
    </div>
  );
}
