import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const StudentAssignments = () => {
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/my/assignments');
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Failed');
        setList(Array.isArray(j) ? j : []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <p className="text-red-700 p-4 rounded-2xl bg-red-50 border border-red-200">{err}</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <h1 className="font-serif text-3xl font-bold text-slate-900">Assignments</h1>
      {list.length === 0 && <p className="text-slate-600">No assignments posted for your class yet.</p>}
      <ul className="space-y-4">
        {list.map((a) => (
          <li key={a._id} className="rounded-2xl border-2 border-amber-100 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">{a.title}</h2>
                <p className="text-sm text-slate-600 mt-1">{a.description || '—'}</p>
                <p className="text-xs text-amber-800 mt-2 font-medium">
                  {a.teacherId?.name ? `From ${a.teacherId.name}` : ''}
                  {a.dueDate ? ` · Due ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentAssignments;
