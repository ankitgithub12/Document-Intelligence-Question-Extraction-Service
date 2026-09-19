import ConfidenceBadge from './ConfidenceBadge'

export default function QuestionCard({ question }) {
  return (
    <div className="glass rounded-xl p-5 hover:border-dark-600 transition-all animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {question.question_number && (
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold">
              {question.question_number}
            </span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-dark-700 text-dark-300">
            {question.question_type}
          </span>
        </div>
        <ConfidenceBadge confidence={question.confidence} status={question.status} />
      </div>

      <p className="text-dark-100 text-sm leading-relaxed mb-4">{question.question}</p>

      {question.options?.length > 0 && (
        <div className="space-y-2 mb-4">
          {question.options.map((opt) => (
            <div
              key={opt.key}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg text-sm transition-colors
                ${question.answer?.value === opt.key
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-dark-800/50'
                }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-dark-700 text-dark-300 flex items-center justify-center text-xs font-bold">
                {opt.key}
              </span>
              <span className="text-dark-200">{opt.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-dark-500">
        {question.answer?.value && (
          <span className="text-green-400">Answer: {question.answer.value}</span>
        )}
        {question.source?.pages?.length > 0 && (
          <span>Pages: {question.source.pages.join(', ')}</span>
        )}
        {question.review_required && (
          <span className="text-orange-400">⚠ Review needed</span>
        )}
      </div>
    </div>
  )
}
