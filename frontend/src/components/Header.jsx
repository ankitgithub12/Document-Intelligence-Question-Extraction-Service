import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Plus, User, LogOut, Sparkles } from 'lucide-react';

export default function Header({ onQuickIntake }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input with ⌘ K shortcut */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search papers, questions, LaTeX formulas..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-14 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
          />
          <div className="absolute right-2.5 flex items-center gap-1">
            <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
              ⌘
            </kbd>
            <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-4">
        {/* Quick Intake Button */}
        <button
          onClick={onQuickIntake}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Quick Intake</span>
        </button>

        {/* Notifications */}
        <div className="relative cursor-pointer p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 pr-2 rounded-lg hover:bg-slate-100/70 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.full_name || 'Ankit Sharma'}
              </div>
              <div className="text-[10px] font-medium text-slate-400 leading-tight">
                Full Stack Lead
              </div>
            </div>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500">
                Signed in as <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
