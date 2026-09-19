import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getReviewItems } from '../api/reviewApi'
import ReviewItemComponent from '../components/ReviewItem'

export default function Review() {
  const { id } = useParams()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getReviewItems(id)
        setItems(res.data.data)
        setTotal(res.data.total)
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/documents/${id}`} className="text-sm text-dark-400 hover:text-dark-300 transition-colors mb-2 inline-block">
        ← Back to Document
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Review Items</h1>
        <p className="text-dark-400 text-sm">{total} items flagged for review</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-dark-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-dark-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-dark-400">
          <p className="text-lg">No review items</p>
          <p className="text-sm mt-1">All extractions passed quality checks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ReviewItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
