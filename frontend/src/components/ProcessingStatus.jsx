import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  QUEUED: 'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REVIEW_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

export default function ProcessingStatus({ status, progress }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="space-y-2">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
        {status === 'PROCESSING' && <Clock className="w-3 h-3 animate-spin" />}
        {status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
        {status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
        {status}
      </span>

      {progress && (
        <div className="w-full">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-mono">
            <span>Page {progress.processed_pages} of {progress.total_pages}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
