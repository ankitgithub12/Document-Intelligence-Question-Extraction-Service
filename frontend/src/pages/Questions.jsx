import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuestions } from '../api/questionApi';
import { getDocuments } from '../api/documentApi';
import QuestionCard from '../components/QuestionCard';
import { 
  ArrowLeft, 
  HelpCircle, 
  Filter, 
  FileText, 
  Search, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function Questions() {
  const { id } = useParams();
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(id || '');
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // 1. Fetch all documents for the dropdown selector
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await getDocuments(1, 50);
        const docs = res.data.data || [];
        setAvailableDocs(docs);

        // Auto-select document if not set by URL param
        if (!id && docs.length > 0 && !selectedDocId) {
          const firstWithQuestions = docs.find((d) => (d.question_count || 0) > 0) || docs[0];
          setSelectedDocId(firstWithQuestions.id);
        }
      } catch (err) {
        console.error('Failed to load documents', err);
      }
    };
    loadDocs();
  }, [id]);

  // 2. Fetch questions for the selected document
  useEffect(() => {
    const fetchQuestions = async () => {
      const docId = id || selectedDocId;
      if (!docId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const filters = {};
        if (typeFilter) filters.question_type = typeFilter;
        if (confidenceFilter === 'HIGH') filters.min_confidence = 0.85;
        if (confidenceFilter === 'REVIEW') filters.review_required = true;

        const res = await getQuestions(docId, page, 100, filters);
        setQuestions(res.data.data || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error('Failed to fetch questions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [id, selectedDocId, page, typeFilter, confidenceFilter]);

  // Client-side search filtering by question text or option
  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesText = (q.question_text || q.question || '').toLowerCase().includes(query);
    const matchesOption = q.options?.some((o) => (o.text || '').toLowerCase().includes(query));
    return matchesText || matchesOption;
  });

  // Calculate live stats for the inspected document
  const mcqCount = questions.filter((q) => (q.question_type || '').toUpperCase() === 'MCQ').length;
  const linkedAnswerCount = questions.filter(
    (q) => Boolean(q.answer?.value || (typeof q.answer === 'string' && q.answer))
  ).length;
  const avgConfidence = questions.length
    ? Math.round((questions.reduce((sum, q) => sum + (q.confidence || 0), 0) / questions.length) * 100)
    : 0;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDoc = availableDocs.find((d) => d.id === (id || selectedDocId));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {id && (
            <Link
              to={`/documents/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Document Details</span>
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Inspector</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inspection of extracted questions, options, confidence scores & answer keys
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyJSON}
            disabled={!questions.length}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Copy questions as structured JSON"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Export JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Document Selector & Quick Metrics Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Document Dropdown */}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Inspecting Document:</span>
            <select
              value={id || selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={Boolean(id)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {availableDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.original_filename} ({doc.question_count || 0} questions)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Metrics */}
          {questions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                Total: {questions.length}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                MCQs: {mcqCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Key Match: {Math.round((linkedAnswerCount / questions.length) * 100)}%
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                Avg Conf: {avgConfidence}%
              </span>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          {/* Search Query */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by question text or options..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Question Types</option>
              <option value="MCQ">Multiple Choice (MCQ)</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="SHORT_ANSWER">Short Answer</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="sm:col-span-3">
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Confidence Levels</option>
              <option value="HIGH">High Confidence (&gt; 85%)</option>
              <option value="REVIEW">Needs Review (&lt; 60%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <div className="text-sm font-bold text-slate-800">No matching questions found</div>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? `No questions matching "${searchQuery}". Clear your search query.`
              : 'Select another document from the dropdown above or upload a new question paper.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
