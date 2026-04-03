import React from 'react';
import { Search, Bell } from 'lucide-react';

const TopNav = () => {
  return (
    <header className="h-[88px] flex items-center justify-between px-10 bg-background border-b border-border shrink-0 text-text-primary">
      
      {/* Left Top Sub-Menu equivalent */}
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-serif italic text-text-primary flex items-center gap-4">
          Academiser
          <div className="flex gap-4 text-xs font-sans not-italic text-text-secondary uppercase tracking-[0.15em] ml-6 border-l border-border pl-6">
            <span className="cursor-pointer hover:text-text-primary transition-colors"></span>
            <span className="cursor-pointer hover:text-text-primary transition-colors"></span>
            <span className="cursor-pointer hover:text-text-primary transition-colors text-text-primary font-semibold">Faculty</span>
          </div>
        </h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        
        {/* Command Search */}
        <div className="relative group w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-card border border-border rounded pl-9 pr-4 py-1.5 text-xs tracking-wider text-text-primary placeholder-text-secondary focus:outline-none focus:border-text-secondary focus:ring-1 focus:ring-text-secondary transition-all duration-200"
          />
        </div>

        <button className="text-text-secondary hover:text-text-primary transition-colors relative ml-2">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-card"></span>
        </button>

      </div>
    </header>
  );
};

export default TopNav;
