import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDocuments, deleteDocument } from '../api/documentApi'

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await getDocuments(page, 20)
      setDocs(res.data.data)
      setTotal(res.data.total)
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadDocuments() }, [page])

  const handleDelete = async (id) => {
    if (!confirm('Delete this document and all its data?')) return
    try {
      await deleteDocument(id)
      loadDocuments()
    } catch { /* silent */ }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-dark-400 text-sm">{total} total documents</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Filename</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Pages</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Questions</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Review</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Created</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-dark-500">Loading...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-dark-500">No documents found</td></tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/documents/${doc.id}`} className="text-sm text-dark-200 hover:text-primary-400 transition-colors">
                        {doc.original_filename}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-300 font-mono">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${doc.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          doc.status === 'PROCESSING' || doc.status === 'QUEUED' ? 'bg-yellow-500/20 text-yellow-400' :
                          doc.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                          'bg-orange-500/20 text-orange-400'}`
                      }>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-400">{doc.total_pages || '-'}</td>
                    <td className="py-3 px-4 text-sm text-dark-400">{doc.question_count || 0}</td>
                    <td className="py-3 px-4 text-sm text-dark-400">{doc.review_count || 0}</td>
                    <td className="py-3 px-4 text-xs text-dark-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-dark-700/50">
            {Array.from({ length: totalPages }, (_, i) => (
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
    </div>
  )
}
