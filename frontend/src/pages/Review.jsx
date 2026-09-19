import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReviewItems } from '../api/reviewApi';
import { getDocuments } from '../api/documentApi';
import ReviewItem from '../components/ReviewItem';
import { ArrowLeft, Flag, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';

export default function Review() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        let targetId = id;
        if (!targetId) {
          const docsRes = await getDocuments(1, 10);
          const docWithReview = (docsRes.data.data || []).find((d) => d.review_count > 0) || docsRes.data.data?.[0];
          if (docWithReview) {
            targetId = docWithReview.id;
          }
        }

        if (targetId) {
          const res = await getReviewItems(targetId);
          setItems(res.data.data || []);
          setTotal(res.data.total || 0);
        }
      } catch {
        /* silent */
      }
      setLoading(false);
    };

    fetchReviews();
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        {id && (
          <Link
            to={`/documents/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Document</span>
          </Link>
        )}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Items (HITL)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {total} items flagged for Human-In-The-Loop review (low confidence, ambiguous options, missing keys)
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-800">All questions verified!</div>
          <p className="text-slate-400 mt-1">No items currently flagged for manual review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ReviewItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
