import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getDocumentStatus } from '../api/documentApi';
import { getQuestions } from '../api/questionApi';
import QuestionCard from '../components/QuestionCard';
import { 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  HelpCircle,
  Flag,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export default function DocumentDetails() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDocument = async () => {
    try {
      const [docRes, statusRes] = await Promise.all([
        getDocument(id),
        getDocumentStatus(id),
      ]);
      setDoc(docRes.data.data);
      setStatus(statusRes.data);
    } catch {
      /* silent */
    }
    setLoading(false);
  };

  const loadQuestions = async () => {
    try {
      const res = await getQuestions(id);
      setQuestions(res.data.data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    loadDocument();
    loadQuestions();
  }, [id]);

  useEffect(() => {
    if (status?.status === 'PROCESSING' || status?.status === 'QUEUED') {
      const interval = setInterval(async () => {
        try {
          const res = await getDocumentStatus(id);
          setStatus(res.data);
          if (res.data.status === 'COMPLETED' || res.data.status === 'REVIEW_REQUIRED') {
            loadDocument();
            loadQuestions();
            clearInterval(interval);
          }
        } catch {
          /* silent */
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status?.status]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center text-slate-500">
        Document not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Back Navigation */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <span>{doc.original_filename}</span>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-normal uppercase">
            {doc.file_type}
          </span>
        </h1>
      </div>

      {/* KPI Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Extraction Status
          </span>
          <div className="flex items-center gap-2 mt-2">
            {doc.status === 'COMPLETED' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COMPLETED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                {doc.status}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            File Specifications
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {doc.total_pages || 1} Pages • {(doc.file_size / 1024).toFixed(1)} KB
          </div>
          <div className="text-[11px] text-slate-400">Stored via Cloudinary</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Questions Extracted
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {doc.question_count || questions.length || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">100% Options Mapped</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Review Items Flagged
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {doc.review_count || 0}
          </div>
          <div className="text-[11px] text-slate-400">Requires Human In Loop</div>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="flex items-center gap-3">
        <Link
          to={`/documents/${id}/questions`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>View All Questions ({questions.length})</span>
        </Link>
        <Link
          to={`/documents/${id}/review`}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2"
        >
          <Flag className="w-4 h-4 text-slate-500" />
          <span>Review Items ({doc.review_count || 0})</span>
        </Link>
      </div>

      {/* Extracted Questions Preview */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Extracted Examination Questions</h2>
        {questions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
            No questions extracted yet. Processing will populate questions automatically.
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
