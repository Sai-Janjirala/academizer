import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  LineChart,
  Calendar,
  ClipboardList,
  Database,
  LogOut,
  Send,
  MessageSquare,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/faculty' },
    { icon: UserCheck, label: 'Attendance', path: '/faculty/attendance' },
    { icon: BookOpen, label: 'Gradebook', path: '/faculty/gradebook' },
    { icon: LineChart, label: 'Analytics', path: '/faculty/analytics' },
    { icon: Calendar, label: 'Timetable', path: '/faculty/timetable' },
    { icon: Database, label: 'Class Data', path: '/faculty/class-data' },
    { icon: ClipboardList, label: 'Daily Schedule', path: '/faculty/daily-schedule' },
    { icon: Send, label: 'Assignments', path: '/faculty/assignments' },
    { icon: MessageSquare, label: 'Student remarks', path: '/faculty/student-remarks' },
    { icon: Inbox, label: 'Admin inbox', path: '/faculty/admin-inbox' }
  ];

  return (
    <aside className="w-[260px] h-full flex flex-col border-r border-violet-100/80 bg-sidebar-gradient shrink-0 shadow-sm">
      <div className="px-8 py-10 pb-8">
        <Link to="/faculty" className="block">
          <h1 className="text-2xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600 mb-1">
            Academizer
          </h1>
        </Link>
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Faculty</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              to={item.path}
              key={index}
              end={item.path === '/faculty'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 transition-all duration-300 relative group rounded-xl ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-900 font-bold shadow-sm border border-violet-200/60'
                    : 'text-text-secondary hover:text-violet-800 hover:bg-white/60'
                }`}
            >
              <Icon size={18} className="stroke-[2.5px] transition-colors shrink-0" />
              <span className="text-[15px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-6 space-y-4 border-t border-violet-100/60">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-cyan-50 to-violet-50 rounded-xl border border-cyan-100/80">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.email || 'teacher')}&backgroundColor=e0e7ff`}
            alt=""
            className="w-10 h-10 rounded-xl shadow-sm border border-white"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">{user?.displayName || 'Teacher'}</div>
            <div className="text-xs text-text-secondary truncate">{user?.email}</div>
          </div>
        </div>
        <Link to="/" className="block text-xs text-violet-600 hover:underline px-2">
          ← Home page
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-4 px-4 py-2.5 text-text-secondary hover:text-red-600 transition-colors group rounded-xl hover:bg-red-50"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
