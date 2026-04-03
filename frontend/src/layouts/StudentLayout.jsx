import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentLayout = () => {
  const { user, logout } = useAuth();

  const links = [
    { to: '/student', label: 'Home', end: true, icon: Sparkles },
    { to: '/student/report-card', label: 'Report card', icon: BookOpen },
    { to: '/student/remarks', label: 'Remarks', icon: MessageSquare },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardCheck },
    { to: '/student/timetable', label: 'Timetable', icon: CalendarDays }
  ];

  return (
    <div className="flex min-h-screen bg-student-portal-gradient">
      <aside className="w-64 shrink-0 border-r border-white/50 bg-white/60 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-violet-100">
          <Link to="/student" className="flex items-center gap-2 font-serif font-bold text-violet-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            Student hub
          </Link>
          <p className="text-xs text-slate-600 mt-2 font-medium truncate">{user?.displayName || user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border border-emerald-200/60'
                    : 'text-slate-600 hover:bg-white/80'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
          <Link
            to="/check-in"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-fuchsia-800 bg-fuchsia-50/80 border border-fuchsia-200 hover:bg-fuchsia-100/80 transition-all mt-2"
          >
            <ClipboardCheck className="h-4 w-4" />
            Face check-in
          </Link>
        </nav>
        <div className="p-4 border-t border-violet-100 space-y-2">
          <Link to="/" className="block text-xs text-violet-600 hover:underline px-2">
            ← Marketing site
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
