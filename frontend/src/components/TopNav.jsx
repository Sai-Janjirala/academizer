import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopNav = () => {
  const { user } = useAuth();

  return (
    <header className="h-[88px] flex items-center justify-between px-6 sm:px-10 bg-gradient-to-r from-white via-indigo-50/40 to-amber-50/30 border-b border-violet-100/60 shrink-0 text-text-primary backdrop-blur-sm">
      <div className="flex items-center gap-8 min-w-0">
        <h2 className="text-lg font-serif italic text-text-primary flex items-center gap-4 truncate">
          Academizer
          <span className="hidden sm:inline text-xs font-sans not-italic text-text-secondary uppercase tracking-[0.15em] border-l border-border pl-6">
            {user?.role === 'teacher' ? 'Faculty workspace' : 'Welcome'}
          </span>
        </h2>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="relative group w-48 sm:w-64 hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white/90 border-2 border-indigo-100 rounded-xl pl-9 pr-4 py-2 text-xs tracking-wider text-text-primary placeholder-text-secondary focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
          />
        </div>

        <Link
          to="/check-in"
          className="hidden lg:inline text-xs font-bold uppercase tracking-wide text-fuchsia-700 hover:text-violet-700"
        >
          Student kiosk
        </Link>

        <button type="button" className="text-text-secondary hover:text-text-primary transition-colors relative ml-1">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-card" />
        </button>
      </div>
    </header>
  );
};

export default TopNav;
