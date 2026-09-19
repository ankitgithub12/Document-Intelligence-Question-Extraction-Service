import React from 'react';

export default function ConfidenceBadge({ confidence, status }) {
  let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let label = status || 'EXTRACTED';

  if (confidence < 0.6) {
    color = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
    label = status || 'REVIEW_REQUIRED';
  } else if (confidence < 0.85) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    label = status || 'PARTIAL';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label} ({Math.round(confidence * 100)}%)
    </span>
  );
}
