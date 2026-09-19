import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';
import { CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export default function QuestionCard({ question }) {
  const isCorrectOption = (optKey) => {
    return question.answer?.value === optKey || question.answer === optKey;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 shadow-2xs transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          {question.question_number && (
            <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold font-mono">
              Q{question.question_number}
            </span>
          )}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {question.question_type || 'MCQ'}
          </span>
        </div>
        <ConfidenceBadge confidence={question.confidence || 0.9} status={question.status} />
      </div>

      <p className="text-slate-900 text-sm font-medium leading-relaxed mb-4">
        {question.question || question.question_text}
      </p>

      {/* Options */}
      {question.options?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {question.options.map((opt) => {
            const correct = isCorrectOption(opt.key);
            return (
              <div
                key={opt.key}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs font-medium transition-all ${
                  correct
                    ? 'bg-emerald-50/80 border border-emerald-300 text-emerald-950 font-semibold'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-700'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                    correct
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                >
                  {opt.key}
                </span>
                <span className="pt-0.5">{opt.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-3">
          {(question.answer?.value || (typeof question.answer === 'string' && question.answer)) && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Correct: Option {question.answer?.value || question.answer}
            </span>
          )}

          {question.source?.pages?.length > 0 && (
            <span className="text-slate-400 font-mono text-[11px]">
              Page {question.source.pages.join(', ')}
            </span>
          )}
        </div>
        {question.review_required && (
          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3.5 h-3.5" />
            Review Needed
          </span>
        )}
      </div>
    </div>
  );
}
