import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const StudentRemarks = () => {
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/my/remarks');
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
      <h1 className="font-serif text-3xl font-bold text-slate-900">Teacher remarks</h1>
      {list.length === 0 && <p className="text-slate-600">No remarks yet.</p>}
      <ul className="space-y-4">
        {list.map((r) => (
          <li key={r._id} className="rounded-2xl border-2 border-white bg-white/90 p-5 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-600 mb-2">
              <MessageSquare className="h-4 w-4" />
              {r.teacherId?.name || 'Teacher'} · {r.classId?.className || r.classId?.courseName || 'Class'}
            </div>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{r.body}</p>
            <p className="text-xs text-slate-400 mt-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentRemarks;
