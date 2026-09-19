import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDocument, getDocumentStatus } from '../api/documentApi'
import { getQuestions } from '../api/questionApi'
import ProcessingStatus from '../components/ProcessingStatus'
import QuestionList from '../components/QuestionList'

export default function DocumentDetails() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [status, setStatus] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDocument = async () => {
    try {
      const [docRes, statusRes] = await Promise.all([
        getDocument(id),
        getDocumentStatus(id),
      ])
      setDoc(docRes.data.data)
      setStatus(statusRes.data)
    } catch { /* silent */ }
    setLoading(false)
  }

  const loadQuestions = async () => {
    try {
      const res = await getQuestions(id)
      setQuestions(res.data.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    loadDocument()
    loadQuestions()
  }, [id])

  // Poll for status when processing
  useEffect(() => {
    if (status?.status === 'PROCESSING' || status?.status === 'QUEUED') {
      const interval = setInterval(async () => {
        try {
          const res = await getDocumentStatus(id)
          setStatus(res.data)
          if (res.data.status === 'COMPLETED' || res.data.status === 'REVIEW_REQUIRED') {
            loadDocument()
            loadQuestions()
            clearInterval(interval)
          }
        } catch { /* silent */ }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [status?.status])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-dark-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-dark-700 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-dark-400">
        Document not found
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/documents" className="text-sm text-dark-400 hover:text-dark-300 transition-colors mb-2 inline-block">
          ← Back to Documents
        </Link>
        <h1 className="text-2xl font-bold text-white">{doc.original_filename}</h1>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-dark-400 mb-1">Status</p>
          <ProcessingStatus status={status?.status || doc.status} progress={status?.progress} />
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-dark-400 mb-1">File Info</p>
          <p className="text-sm text-white font-medium">{doc.file_type?.toUpperCase()}</p>
          <p className="text-xs text-dark-500">{(doc.file_size / 1024).toFixed(1)} KB</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-dark-400 mb-1">Questions</p>
          <p className="text-2xl font-bold text-white">{doc.question_count || 0}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-dark-400 mb-1">Review Items</p>
          <p className="text-2xl font-bold text-orange-400">{doc.review_count || 0}</p>
        </div>
      </div>

      {/* Error */}
      {doc.processing_error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <strong>Processing Error:</strong> {doc.processing_error}
        </div>
      )}

      {/* Quick Links */}
      <div className="flex gap-3 mb-6">
        <Link
          to={`/documents/${id}/questions`}
          className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
        >
          View All Questions
        </Link>
        <Link
          to={`/documents/${id}/review`}
          className="px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium transition-colors"
        >
          Review Items ({doc.review_count || 0})
        </Link>
      </div>

      {/* Questions Preview */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-4">Extracted Questions</h2>
        <QuestionList questions={questions.slice(0, 10)} loading={false} />
        {questions.length > 10 && (
          <Link
            to={`/documents/${id}/questions`}
            className="block text-center mt-4 text-sm text-primary-400 hover:text-primary-300"
          >
            View all {questions.length} questions →
          </Link>
        )}
      </div>
    </div>
  )
}
