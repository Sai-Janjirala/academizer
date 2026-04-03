import React, { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const TeacherAdminInbox = () => {
  const [tasks, setTasks] = useState([]);
  const [remarks, setRemarks] = useState([]);

  const load = async () => {
    const [tRes, rRes] = await Promise.all([apiFetch('/my/teacher-tasks'), apiFetch('/my/admin-feedback')]);
    if (tRes.ok) setTasks(await tRes.json());
    if (rRes.ok) setRemarks(await rRes.json());
  };

  useEffect(() => {
    load();
  }, []);

  const markDone = async (id) => {
    await apiFetch(`/my/teacher-tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">From administration</h1>
        <p className="text-slate-600 mt-2">Tasks assigned to you and institutional feedback.</p>
      </header>

      <section className="rounded-2xl border-2 border-amber-100 bg-amber-50/40 p-6">
        <h2 className="font-bold flex items-center gap-2 text-amber-900 mb-4">
          <ClipboardList className="h-5 w-5" />
          Tasks
        </h2>
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t._id} className="rounded-xl bg-white/90 border border-amber-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{t.title}</p>
                <p className="text-xs text-slate-500">{t.description}</p>
                <p className="text-xs text-amber-800 mt-1 font-medium uppercase">{t.status}</p>
              </div>
              {t.status === 'pending' && (
                <button type="button" onClick={() => markDone(t._id)} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark done
                </button>
              )}
            </li>
          ))}
        </ul>
        {tasks.length === 0 && <p className="text-sm text-slate-600">No admin tasks right now.</p>}
      </section>

      <section className="rounded-2xl border-2 border-violet-100 bg-white/90 p-6">
        <h2 className="font-bold text-violet-900 mb-4">Admin remarks</h2>
        <ul className="space-y-4">
          {remarks.map((r) => (
            <li key={r._id} className="text-sm border-b border-slate-100 pb-3">
              <p className="text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</p>
              <p className="text-slate-800 mt-1 whitespace-pre-wrap">{r.body}</p>
            </li>
          ))}
        </ul>
        {remarks.length === 0 && <p className="text-sm text-slate-600">No remarks yet.</p>}
      </section>
    </div>
  );
};

export default TeacherAdminInbox;
