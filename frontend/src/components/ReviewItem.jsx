import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function ReviewItem({ item }) {
  const typeColors = {
    LOW_CONFIDENCE: 'text-red-700 bg-red-50 border-red-200',
    MISSING_QUESTION_NUMBER: 'text-amber-700 bg-amber-50 border-amber-200',
    INCOMPLETE_QUESTION: 'text-orange-700 bg-orange-50 border-orange-200',
    OCR_ERROR: 'text-red-700 bg-red-50 border-red-200',
    UNCERTAIN_OPTIONS: 'text-amber-700 bg-amber-50 border-amber-200',
    UNCERTAIN_ANSWER: 'text-orange-700 bg-orange-50 border-orange-200',
    UNMATCHED_ANSWER: 'text-purple-700 bg-purple-50 border-purple-200',
    CROSS_PAGE_MERGE: 'text-blue-700 bg-blue-50 border-blue-200',
    AI_EXTRACTION_ERROR: 'text-red-700 bg-red-50 border-red-200',
  };

  const badgeStyle = typeColors[item.issue_type] || 'text-slate-700 bg-slate-100 border-slate-200';

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${badgeStyle}`}>
          {item.issue_type?.replace(/_/g, ' ') || 'REVIEW ISSUE'}
        </span>
        {item.resolved ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Action Required
          </span>
        )}
      </div>

      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
        {item.reason}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
        {item.confidence != null && (
          <span className="font-mono text-slate-600">
            Confidence: <strong className="text-slate-800">{Math.round(item.confidence * 100)}%</strong>
          </span>
        )}
        {item.source_page && (
          <span className="font-mono text-slate-600">
            Source Page: <strong className="text-slate-800">{item.source_page}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
