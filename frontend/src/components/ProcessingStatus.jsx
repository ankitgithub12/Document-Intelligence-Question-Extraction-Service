const STATUS_STYLES = {
  QUEUED: 'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-yellow-500/20 text-yellow-400 animate-pulse-slow',
  COMPLETED: 'bg-green-500/20 text-green-400',
  REVIEW_REQUIRED: 'bg-orange-500/20 text-orange-400',
  FAILED: 'bg-red-500/20 text-red-400',
}

export default function ProcessingStatus({ status, progress }) {
  const style = STATUS_STYLES[status] || 'bg-dark-600 text-dark-300'

  return (
    <div className="space-y-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
        {status === 'PROCESSING' && (
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {status}
      </span>

      {progress && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-dark-400 mb-1">
            <span>Page {progress.processed_pages} of {progress.total_pages}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-primary-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
