import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileSearch, 
  Webhook, 
  Sliders, 
  ShieldCheck, 
  ChevronDown, 
  Layers, 
  Sparkles 
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Documents Vault & Upload', path: '/documents', icon: FolderKanban },
    { name: 'Question Inspector', path: '/questions', icon: FileSearch },
    { name: 'Review Items', path: '/review', icon: Webhook },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Workspace Brand Selector */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-emerald-500/20">
                DI
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">DocIntel</h1>
                <p className="text-[11px] font-medium text-slate-400 leading-tight">Pragati Bharti</p>
              </div>
            </div>
            <div className="text-slate-400 p-1 hover:bg-slate-50 rounded">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Academic Core Box */}
          <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-950 text-white flex items-center justify-center font-bold text-[10px]">
                PB
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 leading-none">Pragati Assessment</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-none">Academic Core</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Intelligence Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Settings & Analytics</span>
            </div>
          </nav>
        </div>
      </div>

      {/* Engine Status Card at Bottom */}
      <div className="p-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-slate-700">Engine Status</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">v2.4</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">OCR Pipeline Active</span>
            <span className="font-mono text-emerald-600 font-semibold">12ms latency</span>
          </div>
          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-400">
            <span>Security Clearance L3</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>
    </aside>
  );
}
