import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, Check, X } from 'lucide-react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password criteria checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+/\\~`]/.test(password);

  const passedCriteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLevel = () => {
    if (!password) return { label: '', color: 'bg-slate-200', text: '' };
    if (passedCriteriaCount <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    if (passedCriteriaCount <= 4) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-700' };
  };

  const strength = getStrengthLevel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!hasUpper) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (!hasLower) {
      setError('Password must contain at least one lowercase letter (a-z)');
      return;
    }
    if (!hasNumber) {
      setError('Password must contain at least one number (0-9)');
      return;
    }
    if (!hasSpecial) {
      setError('Password must contain at least one special character (!@#$%^&*...)');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(cleanEmail, password, fullName.trim());
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.detail?.error?.message ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response?.data?.detail[0]?.msg
          : err.response?.data?.detail) ||
        'Registration failed. Please check your details.';
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
            <h2 className="text-base font-bold text-slate-900">Create your account</h2>
            <p className="text-xs text-slate-400 mt-0.5">Start ingesting and extracting exam question banks</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                placeholder="Ankit Sharma"
              />
            </div>

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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                  placeholder="At least 8 characters"
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

              {/* Live Password Strength Meter */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Strength:</span>
                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(passedCriteriaCount / 5) * 100}%` }}
                    />
                  </div>

                  {/* Criteria checklist */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {hasMinLength ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 inline-block rounded-full bg-slate-200" />}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {hasUpper ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 inline-block rounded-full bg-slate-200" />}
                      <span>Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {hasLower ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 inline-block rounded-full bg-slate-200" />}
                      <span>Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 inline-block rounded-full bg-slate-200" />}
                      <span>Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1 col-span-2 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      {hasSpecial ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 inline-block rounded-full bg-slate-200" />}
                      <span>Special character (!@#$%...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:bg-white transition-all ${
                    confirm && password !== confirm
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : confirm && password === confirm
                      ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && password !== confirm && (
                <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirm && password === confirm && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800 underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="flex items-center justify-center gap-4 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            256-bit AES Encryption
          </span>
          <span>•</span>
          <span>Role-Based Access</span>
        </div>
      </div>
    </div>
  );
}
