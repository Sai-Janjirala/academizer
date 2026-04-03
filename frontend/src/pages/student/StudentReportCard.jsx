import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const StudentReportCard = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/my/report-card');
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Failed');
        setData(j);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <p className="text-red-700 rounded-2xl border border-red-200 bg-red-50 p-4">{err}</p>;
  if (!data) return <div className="h-32 flex items-center justify-center text-slate-500">Loading…</div>;

  const { student, class: cls } = data;
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Report card</h1>
        <p className="text-slate-600">
          {cls?.courseName || cls?.className} {cls?.courseCode ? `· ${cls.courseCode}` : ''}
        </p>
      </header>
      <section className="rounded-2xl border-2 border-violet-100 bg-white/90 p-6 shadow-md">
        <p className="text-sm text-slate-500">Overall attendance (record)</p>
        <p className="text-3xl font-bold text-violet-800 mt-1">{student.attendanceOverall ?? '—'}%</p>
      </section>
      <section className="rounded-2xl border-2 border-emerald-100 bg-white/90 p-6 shadow-md">
        <h2 className="font-bold text-slate-900 mb-4">Subject marks</h2>
        <div className="space-y-3">
          {(student.marks || []).length === 0 && <p className="text-slate-500 text-sm">No marks published yet.</p>}
          {(student.marks || []).map((m) => (
            <div key={m.subject + (m.semester || '')} className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-800">{m.subject}</span>
              <span className="font-mono text-emerald-700">{m.score}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StudentReportCard;
