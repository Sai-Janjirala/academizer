import React, { useEffect, useState } from 'react';
import { School, UserCog } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const AdminDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, tRes] = await Promise.all([apiFetch('/admin/classes-overview'), apiFetch('/admin/teachers')]);
        const c = await cRes.json();
        const t = await tRes.json();
        if (cRes.ok) setClasses(Array.isArray(c) ? c : []);
        if (tRes.ok) setTeachers(Array.isArray(t) ? t : []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-up">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-2">Institution overview</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-slate-600 mt-2">Monitor teachers, class health, and schedules from one place.</p>
      </header>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border-2 border-amber-100 bg-white/90 p-6 shadow-md flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <School className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Active classes</p>
            <p className="text-3xl font-bold text-slate-900">{classes.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-violet-100 bg-white/90 p-6 shadow-md flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
            <UserCog className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Teachers</p>
            <p className="text-3xl font-bold text-slate-900">{teachers.length}</p>
          </div>
        </div>
      </div>
      <section className="rounded-2xl border-2 border-white bg-white/80 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Class snapshot</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Class</th>
                <th className="pb-2">Students</th>
                <th className="pb-2">Avg marks</th>
                <th className="pb-2">Avg attendance %</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-800">{c.courseName || c.className}</td>
                  <td className="py-3 text-slate-600">{c.studentCount}</td>
                  <td className="py-3 text-slate-600">{c.averageMarks}</td>
                  <td className="py-3 text-slate-600">{c.attendanceRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
