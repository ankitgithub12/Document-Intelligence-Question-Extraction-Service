import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  HelpCircle,
  ExternalLink,
  RotateCcw,
  Check
} from 'lucide-react';

export default function ReviewItem({ item, onToggleResolve }) {
  const [resolving, setResolving] = useState(false);

  const typeConfig = {
    LOW_CONFIDENCE: {
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      label: 'Low Extraction Confidence',
    },
    MISSING_QUESTION_NUMBER: {
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      label: 'Missing Question Number',
    },
    INCOMPLETE_QUESTION: {
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      label: 'Incomplete Question Text',
    },
    OCR_ERROR: {
      color: 'text-red-700 bg-red-50 border-red-200',
      label: 'OCR Degradation / Artifacts',
    },
    UNCERTAIN_OPTIONS: {
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      label: 'Ambiguous Options',
    },
    UNCERTAIN_ANSWER: {
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      label: 'Uncertain Answer Key',
    },
    UNMATCHED_ANSWER: {
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      label: 'Unmatched Answer Reference',
    },
    CROSS_PAGE_MERGE: {
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      label: 'Cross-Page Question Merge',
    },
    AI_EXTRACTION_ERROR: {
      color: 'text-red-700 bg-red-50 border-red-200',
      label: 'AI Service Error',
    },
  };

  const config = typeConfig[item.issue_type] || {
    color: 'text-slate-700 bg-slate-100 border-slate-200',
    label: item.issue_type?.replace(/_/g, ' ') || 'Review Issue',
  };

  const handleAction = async () => {
    if (!onToggleResolve) return;
    setResolving(true);
    try {
      await onToggleResolve(item.id, !item.resolved);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div
      className={`bg-white border rounded-xl p-4.5 shadow-2xs transition-all space-y-3 ${
        item.resolved
          ? 'border-slate-200/60 bg-slate-50/40 opacity-75'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${config.color}`}
          >
            {config.label}
          </span>
          {item.source_page && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
              Page {item.source_page}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.resolved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified & Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              Human Review Needed
            </span>
          )}

          {onToggleResolve && (
            <button
              disabled={resolving}
              onClick={handleAction}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                item.resolved
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
              }`}
            >
              {resolving ? (
                <span>Saving...</span>
              ) : item.resolved ? (
                <>
                  <RotateCcw className="w-3 h-3" />
                  <span>Reopen</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  <span>Mark Resolved</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs font-medium text-slate-800 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
        {item.reason}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {item.confidence != null && (
            <span className="font-mono text-slate-600">
              Confidence Score:{' '}
              <strong
                className={
                  item.confidence < 0.6
                    ? 'text-rose-600 font-bold'
                    : item.confidence < 0.8
                    ? 'text-amber-600 font-bold'
                    : 'text-emerald-600 font-bold'
                }
              >
                {Math.round(item.confidence * 100)}%
              </strong>
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-mono">
            ID: {item.id.slice(0, 8)}...
          </span>
        </div>

        {item.question_id && (
          <Link
            to={`/questions?questionId=${item.question_id}&docId=${item.document_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <span>Inspect Target Question</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
