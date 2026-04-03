import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const AdminClasses = () => {
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    apiFetch('/admin/classes-overview')
      .then((r) => r.json())
      .then((c) => {
        setClasses(Array.isArray(c) ? c : []);
        if (c[0]) setSelected(c[0]._id);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    apiFetch(`/admin/analytics/${selected}`)
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, [selected]);

  const sel = classes.find((c) => c._id === selected);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <header>
      <h1 className="font-serif text-3xl font-bold text-slate-900">Class analytics</h1>
      <p className="text-slate-600 mt-2">Same visibility teachers get—plus institution-wide roll-up.</p>
      </header>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full max-w-md rounded-xl border-2 border-amber-100 px-4 py-3 text-sm font-medium"
      >
        {classes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.courseName || c.className} ({c.courseCode})
          </option>
        ))}
      </select>
      {sel && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/90 border border-amber-100 p-4">
            <p className="text-xs uppercase text-slate-500 font-bold">Students</p>
            <p className="text-2xl font-bold text-slate-900">{sel.studentCount}</p>
          </div>
          <div className="rounded-2xl bg-white/90 border border-emerald-100 p-4">
            <p className="text-xs uppercase text-slate-500 font-bold">Avg marks</p>
            <p className="text-2xl font-bold text-emerald-800">{sel.averageMarks}</p>
          </div>
          <div className="rounded-2xl bg-white/90 border border-cyan-100 p-4">
            <p className="text-xs uppercase text-slate-500 font-bold">Avg attendance %</p>
            <p className="text-2xl font-bold text-cyan-800">{sel.attendanceRate}</p>
          </div>
        </div>
      )}
      {analytics && (
        <section className="rounded-2xl border-2 border-slate-100 bg-white/90 p-6">
          <h2 className="font-bold mb-4">Subject averages</h2>
          <ul className="text-sm space-y-2">
            {(analytics.subjectWiseAverages || []).map((s) => (
              <li key={s.subject} className="flex justify-between border-b border-slate-100 pb-2">
                <span>{s.subject}</span>
                <span className="font-mono">{s.average}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default AdminClasses;
