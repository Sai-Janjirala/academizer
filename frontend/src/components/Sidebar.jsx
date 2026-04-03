import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserCheck, BookOpen, LineChart, Calendar, ClipboardList, Database, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: UserCheck, label: 'Attendance', path: '/attendance' },
    { icon: BookOpen, label: 'Gradebook', path: '/gradebook' },
    { icon: LineChart, label: 'Analytics', path: '/analytics' },
    { icon: Calendar, label: 'Timetable', path: '/timetable' },
    { icon: Database, label: 'Class Data', path: '/class-data' },
    { icon: ClipboardList, label: 'Daily Schedule', path: '/daily-schedule' },
  ];

  return (
    <aside className="w-[260px] h-full flex flex-col border-r border-border bg-card shrink-0">
      
      {/* Brand Header */}
      <div className="px-8 py-10 pb-12">
        <h1 className="text-2xl font-serif italic text-text-primary mb-1">Academiser</h1>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-2 px-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              to={item.path}
              key={index}
              className={({ isActive }) => `flex items-center gap-4 px-4 py-3 transition-colors duration-200 relative group ${
                isActive
                  ? 'bg-slate-100 text-text-primary font-bold rounded-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={18} className="stroke-[2.5px] transition-colors" />
              <span className="text-[15px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="px-4 py-8 space-y-6">
        
        {/* Profile Element */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-lg border border-border">
          <img 
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Aris&backgroundColor=1E293B" 
            alt="Profile" 
            className="w-10 h-10 rounded shadow-sm border border-border"
          />
          <div>
            <div className="text-sm font-semibold text-text-primary">jay jadhav</div>
            <div className="text-xs text-text-secondary">Science Teacher</div>
          </div>
        </div>

        {/* System Actions */}
        <div className="space-y-1">
          <a href="#" className="flex items-center gap-4 px-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors group">
            <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-sm font-medium">Settings</span>
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-2.5 text-text-secondary hover:text-red-600 transition-colors group">
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </a>
        </div>
      </div>
      
    </aside>
  );
};

export default Sidebar;
