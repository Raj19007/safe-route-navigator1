import React from 'react';
import { Shield, Map, LayoutDashboard, AlertOctagon, User, Sparkles, Navigation } from 'lucide-react';
import { UserAuth } from '../types';

interface NavbarProps {
  activeTab: 'navigator' | 'safety-map' | 'admin';
  setActiveTab: (tab: 'navigator' | 'safety-map' | 'admin') => void;
  onOpenSOS: () => void;
  onOpenReport: () => void;
  onOpenAuth: () => void;
  currentUser: UserAuth | null;
  onLogout: () => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSOS,
  onOpenReport,
  onOpenAuth,
  currentUser,
  onLogout,
  demoMode,
  setDemoMode,
}) => {
  return (
    <header className="h-16 bg-navy-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between z-30 relative shrink-0">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-glow-emerald">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400 font-sans">
              SAFE ROUTE NAVIGATOR
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0 Local
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Dynamic, Personalized & Explainable Safety-Aware Navigation
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('navigator')}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'navigator'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Navigator</span>
        </button>

        <button
          onClick={() => setActiveTab('safety-map')}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'safety-map'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Safety Map</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'admin'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
      </nav>

      {/* Action Buttons & Auth */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Demo Mode Toggle */}
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            demoMode
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-400'
          }`}
          title="Toggle Judge Presentation Demo Mode"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Scenarios</span>
        </button>

        {/* Report Hazard CTA */}
        <button
          onClick={onOpenReport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all shadow-sm"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Report Hazard</span>
        </button>

        {/* SOS Emergency Button */}
        <button
          onClick={onOpenSOS}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-glow-red hazard-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>SOS</span>
        </button>

        {/* User Auth */}
        {currentUser ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-300 hidden md:inline font-medium">
              {currentUser.full_name}
            </span>
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded bg-slate-800/80"
              title="Logout"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
