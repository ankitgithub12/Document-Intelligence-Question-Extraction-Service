import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../api/documentApi';
import { 
  FileText, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  Flag,
  RefreshCw,
  X,
  Layers,
  FileCheck2,
  Hourglass
} from 'lucide-react';
import UploadDocumentModal from '../components/UploadDocumentModal';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const pollTimerRef = useRef(null);

  const loadDocuments = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const apiStatus = statusFilter === 'ALL' ? null : statusFilter;
      const res = await getDocuments(page, 50, apiStatus);
      setDocs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      if (showSpinner) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments(true);
  }, [page, statusFilter]);

  // Real-time polling when any document is in flight
  useEffect(() => {
    const hasActiveProcessing = docs.some(
      (d) => d.status === 'PROCESSING' || d.status === 'QUEUED'
    );

    if (hasActiveProcessing) {
      pollTimerRef.current = setInterval(() => {
        loadDocuments(false);
      }, 4000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [docs, page, statusFilter]);

  const handleDelete = async (id, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}" and all its extracted questions?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDocument(id);
      await loadDocuments(false);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side search filtering by filename or type
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const query = searchQuery.toLowerCase().trim();
    return docs.filter(
      (doc) =>
        doc.original_filename?.toLowerCase().includes(query) ||
        doc.file_type?.toLowerCase().includes(query)
    );
  }, [docs, searchQuery]);

  // Aggregate metrics across vault
  const vaultMetrics = useMemo(() => {
    const totalCount = total;
    const completedCount = docs.filter((d) => d.status === 'COMPLETED').length;
    const processingCount = docs.filter((d) => d.status === 'PROCESSING' || d.status === 'QUEUED').length;
    const totalQuestions = docs.reduce((acc, d) => acc + (d.question_count || 0), 0);
    const totalReviews = docs.reduce((acc, d) => acc + (d.review_count || 0), 0);

    return { totalCount, completedCount, processingCount, totalQuestions, totalReviews };
  }, [docs, total]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            PROCESSING
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
            <Hourglass className="w-3.5 h-3.5 animate-pulse" />
            QUEUED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Documents Vault</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository for exam question papers, answer keys, and syllabus documents
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDocuments(false)}
            disabled={refreshing}
            title="Refresh documents"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{vaultMetrics.totalCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Documents</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">{vaultMetrics.totalQuestions}</div>
            <div className="text-[11px] text-slate-500 font-medium">Questions Extracted</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600">{vaultMetrics.processingCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Active In Pipeline</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-rose-600">{vaultMetrics.totalReviews}</div>
            <div className="text-[11px] text-slate-500 font-medium">HITL Review Items</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by name or extension..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto overflow-x-auto max-w-full">
          {['ALL', 'COMPLETED', 'PROCESSING', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'ALL' ? 'All Docs' : status}
            </button>
          ))}
        </div>
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
                <th className="py-3 px-4">Size</th>
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
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading documents from vault...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-700 text-sm">
                        {searchQuery ? 'No matching documents' : 'No documents in vault'}
                      </div>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? `No files match "${searchQuery}". Try a different keyword.`
                          : 'Upload an examination question paper or syllabus to begin automated extraction.'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
                        >
                          Clear search filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="flex items-center gap-2.5 font-semibold text-slate-900 hover:text-emerald-700 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate max-w-xs">
                          <span className="truncate block font-medium group-hover:underline">
                            {doc.original_filename}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {doc.id.slice(0, 8)}...
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{renderStatusBadge(doc.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {doc.total_pages || 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/documents/${doc.id}/questions`}
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                        title="View extracted questions"
                      >
                        <span>{doc.question_count || 0}</span>
                        <ChevronRight className="w-3 h-3 text-emerald-500" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      {(doc.review_count || 0) > 0 ? (
                        <Link
                          to={`/documents/${doc.id}/review`}
                          className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full text-[11px] hover:bg-rose-100 transition-colors"
                        >
                          <Flag className="w-3 h-3 text-rose-600" />
                          <span>{doc.review_count} flags</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="View Document Overview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/documents/${doc.id}/questions`}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="View Questions"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Link>
                        <button
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id, doc.original_filename)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
                          title="Delete Document"
                        >
                          {deletingId === doc.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredDocs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> documents in vault
          </div>
          {Math.ceil(total / 50) > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-600 font-medium px-2">Page {page}</span>
              <button
                disabled={page >= Math.ceil(total / 50)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadDocuments(true);
          }}
        />
      )}
    </div>
  );
}
