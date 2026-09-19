export default function ConfidenceBadge({ confidence, status }) {
  let color = 'bg-green-500/20 text-green-400 border-green-500/30'
  let label = status || 'EXTRACTED'

  if (confidence < 0.6) {
    color = 'bg-red-500/20 text-red-400 border-red-500/30'
    label = status || 'REVIEW_REQUIRED'
  } else if (confidence < 0.85) {
    color = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    label = status || 'PARTIAL'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label} ({Math.round(confidence * 100)}%)
    </span>
  )
}
