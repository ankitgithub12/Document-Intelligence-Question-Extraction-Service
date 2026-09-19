import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDocuments } from '../api/documentApi'
import UploadDocument from '../components/UploadDocument'

const STAT_CARDS = [
  { key: 'total', label: 'Total Documents', icon: '📄', color: 'from-primary-500/20 to-purple-500/20' },
  { key: 'processing', label: 'Processing', icon: '⚙️', color: 'from-yellow-500/20 to-orange-500/20' },
  { key: 'completed', label: 'Completed', icon: '✅', color: 'from-green-500/20 to-emerald-500/20' },
  { key: 'review', label: 'Review Required', icon: '⚠️', color: 'from-orange-500/20 to-red-500/20' },
  { key: 'questions', label: 'Questions Extracted', icon: '❓', color: 'from-blue-500/20 to-cyan-500/20' },
]

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, processing: 0, completed: 0, review: 0, questions: 0 })
  const [recentDocs, setRecentDocs] = useState([])

  const loadData = async () => {
    try {
      const res = await getDocuments(1, 100)
      const docs = res.data.data
      setRecentDocs(docs.slice(0, 5))
      setStats({
        total: docs.length,
        processing: docs.filter(d => d.status === 'PROCESSING' || d.status === 'QUEUED').length,
        completed: docs.filter(d => d.status === 'COMPLETED').length,
        review: docs.filter(d => d.status === 'REVIEW_REQUIRED').length,
        questions: docs.reduce((sum, d) => sum + (d.question_count || 0), 0),
      })
    } catch { /* silent */ }
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Document Intelligence & Question Extraction Service</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className={`glass rounded-xl p-4 bg-gradient-to-br ${card.color}`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold text-white">{stats[card.key]}</div>
            <div className="text-xs text-dark-400 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload */}
        <UploadDocument onUploadComplete={() => loadData()} />

        {/* Recent Documents */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Documents</h3>
            <Link to="/documents" className="text-sm text-primary-400 hover:text-primary-300">View all →</Link>
          </div>

          {recentDocs.length === 0 ? (
            <p className="text-dark-500 text-sm py-8 text-center">No documents yet. Upload one to get started!</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-xs font-bold text-dark-300 flex-shrink-0">
                      {doc.file_type?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-dark-200 truncate group-hover:text-white transition-colors">
                        {doc.original_filename}
                      </p>
                      <p className="text-xs text-dark-500">{doc.question_count || 0} questions</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${doc.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      doc.status === 'PROCESSING' || doc.status === 'QUEUED' ? 'bg-yellow-500/20 text-yellow-400' :
                      doc.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                      'bg-orange-500/20 text-orange-400'}`
                  }>
                    {doc.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
