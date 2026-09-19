import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getQuestions } from '../api/questionApi'
import QuestionList from '../components/QuestionList'

export default function Questions() {
  const { id } = useParams()
  const [questions, setQuestions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const filters = {}
        if (typeFilter) filters.question_type = typeFilter
        const res = await getQuestions(id, page, 50, filters)
        setQuestions(res.data.data)
        setTotal(res.data.total)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [id, page, typeFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/documents/${id}`} className="text-sm text-dark-400 hover:text-dark-300 transition-colors mb-2 inline-block">
        ← Back to Document
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Questions</h1>
          <p className="text-dark-400 text-sm">{total} questions extracted</p>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-dark-800 border border-dark-600 text-sm text-dark-200 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="TRUE_FALSE">True/False</option>
          <option value="SHORT_ANSWER">Short Answer</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
      </div>

      <QuestionList questions={questions} loading={loading} />

      {total > 50 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / 50) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors
                ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:bg-dark-600'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
