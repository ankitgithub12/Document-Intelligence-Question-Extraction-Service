import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getAllReviewItems, resolveReviewItem } from '../api/reviewApi';
import { getDocuments } from '../api/documentApi';
import ReviewItem from '../components/ReviewItem';
import { 
  ArrowLeft, 
  Flag, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Filter,
  Search,
  RefreshCw,
  Layers,
  HelpCircle,
  FileText,
  X
} from 'lucide-react';

export default function Review() {
  const { id: paramDocId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDocId = searchParams.get('docId');
  const activeDocId = paramDocId || queryDocId || '';

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(activeDocId);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('UNRESOLVED'); // 'ALL' | 'UNRESOLVED' | 'RESOLVED'
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load document list for document switcher
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await getDocuments(1, 100);
        setDocuments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    fetchDocs();
  }, []);

  // Update selected doc if URL changes
  useEffect(() => {
    if (activeDocId && activeDocId !== selectedDocId) {
      setSelectedDocId(activeDocId);
    }
  }, [activeDocId]);

  const loadReviews = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const resolvedParam =
        statusFilter === 'ALL' ? null : statusFilter === 'RESOLVED';
      const docParam = selectedDocId || null;

      const res = await getAllReviewItems(docParam, 1, 150, resolvedParam);
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch review items:', err);
    } finally {
      if (showSpinner) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews(true);
  }, [selectedDocId, statusFilter]);

  const handleToggleResolve = async (itemId, newResolved) => {
    try {
      await resolveReviewItem(itemId, newResolved);
      // Update local state optimistically
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, resolved: newResolved } : it))
      );
    } catch (err) {
      console.error('Failed to update review item status:', err);
      alert('Failed to update item. Please try again.');
    }
  };

  // Filter items based on type and keyword search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = typeFilter === 'ALL' || item.issue_type === typeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.reason?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.issue_type?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.id?.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesType && matchesSearch;
    });
  }, [items, typeFilter, searchQuery]);

  // Aggregate counters
  const metrics = useMemo(() => {
    const totalCount = items.length;
    const pendingCount = items.filter((i) => !i.resolved).length;
    const resolvedCount = items.filter((i) => i.resolved).length;
    const avgConfidence = items.length
      ? Math.round(
          (items.reduce((acc, i) => acc + (i.confidence || 0), 0) / items.length) * 100
        )
      : 0;

    return { totalCount, pendingCount, resolvedCount, avgConfidence };
  }, [items]);

  // Unique issue types in current batch
  const availableTypes = useMemo(() => {
    const types = new Set(items.map((i) => i.issue_type).filter(Boolean));
    return Array.from(types);
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {paramDocId && (
            <Link
              to={`/documents/${paramDocId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Document</span>
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Flag className="w-6 h-6 text-rose-600" />
            <span>Human-In-The-Loop (HITL) Review Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit low-confidence extraction points, missing answer choices, and OCR degradation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadReviews(false)}
            disabled={refreshing}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh items"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Document Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <FileText className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDocId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedDocId(nextId);
                if (nextId) setSearchParams({ docId: nextId });
                else setSearchParams({});
              }}
              className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer max-w-xs truncate"
            >
              <option value="">All Documents (Unified Queue)</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} ({d.review_count || 0} flags)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{total}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Flagged Items</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600">{metrics.pendingCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Awaiting Human Review</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">{metrics.resolvedCount}</div>
            <div className="text-[11px] text-slate-500 font-medium">Verified & Cleared</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-rose-600">{metrics.avgConfidence}%</div>
            <div className="text-[11px] text-slate-500 font-medium">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search review reasons, issues, or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Issue Type Dropdown Filter */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="ALL">All Issue Types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto overflow-x-auto">
          {[
            { id: 'UNRESOLVED', label: 'Action Needed' },
            { id: 'RESOLVED', label: 'Resolved' },
            { id: 'ALL', label: 'All Items' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review Items List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-800">
            {searchQuery
              ? 'No matching review items'
              : statusFilter === 'UNRESOLVED'
              ? 'Queue is clear! All items verified.'
              : 'No items found.'}
          </div>
          <p className="text-slate-400 mt-1">
            {searchQuery
              ? `No items match "${searchQuery}". Clear your search query.`
              : 'The automated extraction pipeline flagged 0 pending issues for this selection.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ReviewItem
              key={item.id}
              item={item}
              onToggleResolve={handleToggleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
