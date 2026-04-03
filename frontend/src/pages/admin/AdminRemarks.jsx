import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const AdminRemarks = () => {
  const [remarks, setRemarks] = useState([]);

  useEffect(() => {
    apiFetch('/admin/teacher-remarks')
      .then((r) => r.json())
      .then((list) => setRemarks(Array.isArray(list) ? list : []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Faculty remark log</h1>
        <p className="text-slate-600 mt-2">Every note you have sent to teachers (newest first).</p>
      </header>
      <ul className="space-y-4">
        {remarks.map((r) => (
          <li key={r._id} className="rounded-2xl border-2 border-violet-100 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-violet-600">
              {r.teacherId?.name || 'Teacher'} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
            </p>
            <p className="text-slate-800 mt-2 whitespace-pre-wrap">{r.body}</p>
          </li>
        ))}
      </ul>
      {remarks.length === 0 && <p className="text-slate-500">No remarks sent yet.</p>}
    </div>
  );
};

export default AdminRemarks;
