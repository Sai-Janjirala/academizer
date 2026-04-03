import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const StudentTimetable = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/my/timetable');
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Failed');
        setData(j);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <p className="text-red-700 p-4 rounded-2xl bg-red-50 border border-red-200">{err}</p>;
  if (!data) return <div className="text-slate-500">Loading…</div>;

  const schedule = data.schedule || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Your timetable</h1>
        <p className="text-slate-600">
          {data.courseName || data.className} · Set by your institution for this class
        </p>
      </header>
      <div className="rounded-2xl border-2 border-cyan-100 bg-white/90 overflow-hidden shadow-md">
        {schedule.length === 0 ? (
          <p className="p-8 text-slate-600">No slots yet. Your admin will publish the schedule.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cyan-50 border-b border-cyan-100 text-left">
                <th className="p-4 font-bold text-cyan-900">Day</th>
                <th className="p-4 font-bold text-cyan-900">Time</th>
                <th className="p-4 font-bold text-cyan-900">Hall</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="p-4 font-medium text-slate-800">{s.day}</td>
                  <td className="p-4 text-slate-600 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-600" />
                    {s.startTime} – {s.endTime}
                  </td>
                  <td className="p-4 text-slate-600">{s.hall || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;
