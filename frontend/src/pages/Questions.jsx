import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuestions } from '../api/questionApi';
import { getDocuments } from '../api/documentApi';
import QuestionCard from '../components/QuestionCard';
import { ArrowLeft, HelpCircle, Filter, FileText } from 'lucide-react';

export default function Questions() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [activeDocId, setActiveDocId] = useState(id || null);

  useEffect(() => {
    const fetchDocAndQuestions = async () => {
      setLoading(true);
      try {
        let targetId = id;
        if (!targetId) {
          const docsRes = await getDocuments(1, 10);
          const completed = (docsRes.data.data || []).find((d) => d.status === 'COMPLETED');
          if (completed) {
            targetId = completed.id;
            setActiveDocId(completed.id);
          }
        }

        if (targetId) {
          const filters = {};
          if (typeFilter) filters.question_type = typeFilter;
          const res = await getQuestions(targetId, page, 50, filters);
          setQuestions(res.data.data || []);
          setTotal(res.data.total || 0);
        }
      } catch {
        /* silent */
      }
      setLoading(false);
    };

    fetchDocAndQuestions();
  }, [id, page, typeFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {id && (
            <Link
              to={`/documents/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Document</span>
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Inspector</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} structured questions extracted with option linkages & confidence metrics
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Question Types</option>
            <option value="MCQ">Multiple Choice (MCQ)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          No questions found. Process a document from the Dashboard or Documents Vault.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
