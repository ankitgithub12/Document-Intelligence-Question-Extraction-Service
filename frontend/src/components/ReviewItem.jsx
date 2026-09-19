export default function ReviewItem({ item }) {
  const typeColors = {
    LOW_CONFIDENCE: 'text-red-400 bg-red-500/10',
    MISSING_QUESTION_NUMBER: 'text-yellow-400 bg-yellow-500/10',
    INCOMPLETE_QUESTION: 'text-orange-400 bg-orange-500/10',
    OCR_ERROR: 'text-red-400 bg-red-500/10',
    UNCERTAIN_OPTIONS: 'text-yellow-400 bg-yellow-500/10',
    UNCERTAIN_ANSWER: 'text-orange-400 bg-orange-500/10',
    UNMATCHED_ANSWER: 'text-purple-400 bg-purple-500/10',
    CROSS_PAGE_MERGE: 'text-blue-400 bg-blue-500/10',
    AI_EXTRACTION_ERROR: 'text-red-400 bg-red-500/10',
  }

  const color = typeColors[item.issue_type] || 'text-dark-300 bg-dark-700'

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${color}`}>
          {item.issue_type.replace(/_/g, ' ')}
        </span>
        {item.resolved ? (
          <span className="text-xs text-green-400">✓ Resolved</span>
        ) : (
          <span className="text-xs text-orange-400">Pending</span>
        )}
      </div>

      <p className="text-sm text-dark-200 mb-2">{item.reason}</p>

      <div className="flex items-center gap-4 text-xs text-dark-500">
        {item.confidence != null && (
          <span>Confidence: {Math.round(item.confidence * 100)}%</span>
        )}
        {item.source_page && <span>Page: {item.source_page}</span>}
      </div>
    </div>
  )
}
