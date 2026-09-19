import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAnalyticsSummary } from '../api/analyticsApi';
import {
  Sliders,
  BarChart3,
  Cpu,
  Database,
  Cloud,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Copy,
  Check,
  Zap,
  Server,
  Sparkles,
  Layers,
  Clock,
  Settings2,
  SlidersHorizontal,
  HelpCircle,
  FileText,
  Activity,
  UserCheck,
  BellRing,
  Eye
} from 'lucide-react';

export default function SettingsAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'engine' | 'infrastructure' | 'account'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [summary, setSummary] = useState(null);

  // Engine Settings state (persisted to localStorage)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('docintel_engine_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* fallback */
      }
    }
    return {
      minConfidence: 75,
      hitlReviewThreshold: 60,
      enableHeuristicFallback: true,
      strictOptionFormat: true,
      enhanceImageContrast: true,
      ocrDpi: 150,
      notifyOnComplete: true,
      autoTagTaxonomy: true,
    };
  });

  const loadAnalytics = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await getAnalyticsSummary();
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
    } finally {
      if (showSpinner) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics(true);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('docintel_engine_settings', JSON.stringify(settings));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const copyToken = () => {
    const token = localStorage.getItem('token') || 'docintel_session_active';
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const taxonomy = summary?.questions?.taxonomy || {};
  const totalTaxonomyQuestions = Object.values(taxonomy).reduce((a, b) => a + b, 0) || 1;

  const confDist = summary?.questions?.confidence_distribution || { high: 0, medium: 0, low: 0 };
  const totalConf = (confDist.high + confDist.medium + confDist.low) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-emerald-600" />
            <span>Settings & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Engine performance telemetry, confidence distributions, and extraction pipeline configuration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Live • All Systems Operational</span>
          </div>

          <button
            onClick={() => loadAnalytics(false)}
            disabled={refreshing}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px overflow-x-auto">
        {[
          { id: 'analytics', label: 'Intelligence Analytics', icon: BarChart3 },
          { id: 'engine', label: 'Extraction Engine Settings', icon: Cpu },
          { id: 'infrastructure', label: 'Cloud Infrastructure', icon: Server },
          { id: 'account', label: 'Account & API Credentials', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INTELLIGENCE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Extracted Questions
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {summary?.questions?.total ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Across {summary?.documents?.total ?? 0} Documents</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mean Extraction Confidence
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {summary?.questions?.avg_confidence ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Weighted OCR & LLM alignment
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                HITL Clearance Rate
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {summary?.review?.clearance_rate ?? 100}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {summary?.review?.resolved ?? 0} resolved of {summary?.review?.total_flags ?? 0} flagged
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vault Ingestion Volume
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {summary?.documents?.total_pages ?? 0} Pages
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {formatBytes(summary?.documents?.total_file_bytes)} media processed
              </div>
            </div>
          </div>

          {/* Two column analytics graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Score Spectrum */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Extraction Confidence Spectrum</h3>
                  <p className="text-xs text-slate-400">Distribution of automated extraction confidence levels</p>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      High Confidence (&ge; 85%)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {confDist.high} ({Math.round((confDist.high / totalConf) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(confDist.high / totalConf) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Moderate Confidence (60% - 84%)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {confDist.medium} ({Math.round((confDist.medium / totalConf) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(confDist.medium / totalConf) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      Attention Required (&lt; 60%)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {confDist.low} ({Math.round((confDist.low / totalConf) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${(confDist.low / totalConf) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-[11px] text-emerald-800 leading-relaxed">
                ✨ <strong>Quality Benchmark:</strong> Over{' '}
                {Math.round(((confDist.high + confDist.medium) / totalConf) * 100)}% of questions
                satisfy automated production threshold without manual OCR re-keying.
              </div>
            </div>

            {/* Question Taxonomy Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Question Taxonomy Distribution</h3>
                  <p className="text-xs text-slate-400">Classified structural question archetypes</p>
                </div>
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-3 pt-2">
                {Object.keys(taxonomy).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No taxonomy data available yet.
                  </div>
                ) : (
                  Object.entries(taxonomy).map(([type, count]) => {
                    const pct = Math.round((count / totalTaxonomyQuestions) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 uppercase font-mono text-[11px]">
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                ℹ️ Standard Multiple Choice questions are verified with option counts (A-D) and automated key cross-referencing.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXTRACTION ENGINE SETTINGS */}
      {activeTab === 'engine' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Extraction Pipeline Calibration</h2>
              <p className="text-xs text-slate-500">Tune AI confidence tolerances and parsing rules for exam assessments</p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Calibration</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slider 1: Min Confidence */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900">Minimum Question Acceptance Confidence</label>
                  <p className="text-[11px] text-slate-500">Threshold required before committing question to database</p>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {settings.minConfidence}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={settings.minConfidence}
                onChange={(e) => setSettings({ ...settings, minConfidence: Number(e.target.value) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>50% (Permissive)</span>
                <span>75% (Balanced)</span>
                <span>95% (Strict)</span>
              </div>
            </div>

            {/* Slider 2: HITL Review Threshold */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900">Human-In-The-Loop Flagging Sensitivity</label>
                  <p className="text-[11px] text-slate-500">Flag questions with confidence below this level for human review</p>
                </div>
                <span className="font-mono text-sm font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {settings.hitlReviewThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={settings.hitlReviewThreshold}
                onChange={(e) => setSettings({ ...settings, hitlReviewThreshold: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>40% (Fewer Flags)</span>
                <span>60% (Recommended)</span>
                <span>85% (High Audit)</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Heuristic & OCR Parsing Rules</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/60 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableHeuristicFallback}
                  onChange={(e) => setSettings({ ...settings, enableHeuristicFallback: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Autonomous Offline Regex Fallback</div>
                  <div className="text-[11px] text-slate-500">Seamlessly switches to deterministic regex parser if AI API quota or network is unavailable.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/60 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.strictOptionFormat}
                  onChange={(e) => setSettings({ ...settings, strictOptionFormat: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Strict Option Key Normalization</div>
                  <div className="text-[11px] text-slate-500">Normalize option labels (A, B, C, D) and prevent orphaned bullet options.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/60 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enhanceImageContrast}
                  onChange={(e) => setSettings({ ...settings, enhanceImageContrast: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Adaptive Contrast for Scanned Examination Sheets</div>
                  <div className="text-[11px] text-slate-500">Removes background noise and uneven lighting from photo/scanned question papers.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/60 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.notifyOnComplete}
                  onChange={(e) => setSettings({ ...settings, notifyOnComplete: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Real-time Background Pipeline Notifications</div>
                  <div className="text-[11px] text-slate-500">Dispatch UI alerts immediately when Celery finishes document question extraction.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLOUD INFRASTRUCTURE */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Supabase */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">PostgreSQL Database</h3>
                    <p className="text-[10px] text-slate-400">Supabase Cloud IPv4 Pooler</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  CONNECTED
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-slate-600 pt-2 border-t border-slate-100 font-mono">
                <div>Port: <strong className="text-slate-900">5432</strong></div>
                <div>Migrations: <strong className="text-emerald-700">001_initial (applied)</strong></div>
                <div>Async Pool: <strong className="text-slate-900">SQLAlchemy asyncpg</strong></div>
              </div>
            </div>

            {/* Upstash Redis */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Redis Broker & Cache</h3>
                    <p className="text-[10px] text-slate-400">Upstash Serverless Redis</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  TLS ENABLED
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-slate-600 pt-2 border-t border-slate-100 font-mono">
                <div>Protocol: <strong className="text-slate-900">rediss:// (SSL/TLS)</strong></div>
                <div>Region: <strong className="text-slate-900">light-goshawk-286216</strong></div>
                <div>Celery Backend: <strong className="text-emerald-700">Online</strong></div>
              </div>
            </div>

            {/* Cloudinary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Object / Media Storage</h3>
                    <p className="text-[10px] text-slate-400">Cloudinary CDN Storage</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  READY
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-slate-600 pt-2 border-t border-slate-100 font-mono">
                <div>Cloud Name: <strong className="text-slate-900">dclvocalp</strong></div>
                <div>Cache Layer: <strong className="text-emerald-700">Disk + Remote CDN</strong></div>
                <div>PyMuPDF Render: <strong className="text-slate-900">Active</strong></div>
              </div>
            </div>
          </div>

          {/* Celery Worker Status Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Celery Distributed Task Worker</h4>
                <p className="text-xs text-slate-400">Windows Solo Pool • document_tasks.process_document</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Queue Status: Listening for Ingest Tasks</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT & API CREDENTIALS */}
      {activeTab === 'account' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Identity & API Authentication</h2>
            <p className="text-xs text-slate-500">Manage your active profile session and token credentials for API integration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active User Account</span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>{user?.email || 'admin@docintel.io'}</span>
              </div>
              <div className="text-xs text-slate-500">Role: Academic Evaluation Lead • Pragati Assessment</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace Tenant</span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>DocIntel Enterprise (Pragati Bharti)</span>
              </div>
              <div className="text-xs text-slate-500">Environment: Production Sandbox</div>
            </div>
          </div>

          {/* API Bearer Token */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">REST API Bearer Token</h3>
                <p className="text-[11px] text-slate-500">Use this token to authorize programmatic requests via cURL or Python SDK</p>
              </div>
              <button
                onClick={copyToken}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Token</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 text-slate-300 font-mono text-xs p-3.5 rounded-xl overflow-x-auto border border-slate-800 flex items-center justify-between">
              <span className="truncate pr-4">
                Bearer {localStorage.getItem('token') ? `${localStorage.getItem('token').slice(0, 32)}********************` : 'eyJh...'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono">
              curl -X GET http://localhost:8000/api/v1/documents \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer &lt;YOUR_TOKEN&gt;"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
