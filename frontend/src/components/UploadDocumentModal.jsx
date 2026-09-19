import React, { useState } from 'react';
import { uploadDocument } from '../api/documentApi';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadDocumentModal({ isOpen, onClose, onSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleUpload = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(10);

    try {
      const res = await uploadDocument(file, (e) => {
        if (e.total) {
          const pct = Math.round((e.loaded / e.total) * 90);
          setProgress(Math.max(10, pct));
        }
      });
      setProgress(100);
      setTimeout(() => {
        onSuccess?.(res.data.data);
      }, 500);
    } catch (err) {
      const msg =
        err.response?.data?.detail?.error?.message ||
        err.response?.data?.detail ||
        'Upload failed. Please check file format and size.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick Document Intake</h3>
            <p className="text-xs text-slate-400">Ingest PDF, scanned papers, or question images</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${
              dragging
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                  handleUpload(e.target.files[0]);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Drag and drop document files here'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  or <span className="text-emerald-600 font-semibold underline">browse drive</span> to select
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">PDF</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">PNG</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">JPG</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Max 50MB</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Uploading & enqueuing to Celery...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
