import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Email address is required');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.detail?.error?.message ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response?.data?.detail[0]?.msg
          : err.response?.data?.detail) ||
        'Invalid email or password. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-3 shadow-md shadow-emerald-600/20">
            DI
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DocIntel</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pragati Bharti • Document Intelligence & Question Extraction Service
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your credentials to access your assessment workspace</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-800 underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured with JWT authentication & BCrypt encryption</span>
        </div>
      </div>
    </div>
  );
}
