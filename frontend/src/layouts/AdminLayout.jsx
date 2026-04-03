import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BarChart3, CalendarDays, LayoutDashboard, LogOut, School, Shield, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const links = [
    { to: '/admin', label: 'Overview', end: true,  icon: LayoutDashboard },
    { to: '/admin/teachers', label: 'Teachers & tasks', icon: UserCog },
    { to: '/admin/classes', label: 'Classes & analytics', icon: School },
    { to: '/admin/timetable', label: 'Timetables', icon: CalendarDays },
    { to: '/admin/remarks', label: 'Faculty remarks', icon: BarChart3 }
  ];

  return (
    <div className="flex min-h-screen bg-landing-gradient">
      <aside className="w-64 shrink-0 border-r border-amber-100/80 bg-white/70 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-amber-100">
          <Link to="/admin" className="flex items-center gap-2 font-serif font-bold text-amber-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <Shield className="h-4 w-4" />
            </span>
            Admin console
          </Link>
          <p className="text-xs text-slate-600 mt-2 truncate">{user?.displayName}</p>
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
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950 border border-amber-200/80'
                    : 'text-slate-600 hover:bg-white/90'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-amber-100">
          <Link to="/" className="block text-xs text-amber-800 hover:underline px-2 mb-2">
            ← Marketing site
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
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

export default AdminLayout;
