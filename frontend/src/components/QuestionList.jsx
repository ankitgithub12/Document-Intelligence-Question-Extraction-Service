import QuestionCard from './QuestionCard'

export default function QuestionList({ questions, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-dark-700 rounded w-3/4 mb-3" />
            <div className="h-3 bg-dark-700 rounded w-full mb-2" />
            <div className="h-3 bg-dark-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!questions?.length) {
    return (
      <div className="text-center py-12 text-dark-400">
        <p className="text-lg">No questions found</p>
        <p className="text-sm mt-1">Questions will appear here after document processing</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  )
}
