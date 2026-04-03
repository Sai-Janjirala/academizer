import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const TeacherAssignments = () => {
  const [classes, setClasses] = useState([]);
  const [list, setList] = useState([]);
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [cRes, aRes] = await Promise.all([apiFetch('/classes'), apiFetch('/teacher/assignments')]);
    const c = await cRes.json();
    const a = await aRes.json();
    if (cRes.ok) {
      setClasses(Array.isArray(c) ? c : []);
      if (!classId && c[0]) setClassId(c[0]._id);
    }
    if (aRes.ok) setList(Array.isArray(a) ? a : []);
  };

  useEffect(() => {
    load().catch(() => setStatus('Could not load.'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!classId || !title.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const res = await apiFetch('/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify({ classId, title, description, dueDate: due || undefined })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setTitle('');
      setDescription('');
      setDue('');
      setStatus('Posted for your class.');
      await load();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Assignments</h1>
        <p className="text-slate-600 mt-2">Students see these in their portal under Assignments.</p>
      </header>

      <form onSubmit={submit} className="rounded-2xl border-2 border-fuchsia-100 bg-white/90 p-6 shadow-md space-y-4 max-w-lg">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border-2 border-fuchsia-100 px-3 py-2.5 text-sm">
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.courseName || c.className}
            </option>
          ))}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border-2 border-fuchsia-100 px-3 py-2.5 text-sm" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions" rows={4} className="w-full rounded-xl border-2 border-fuchsia-100 px-3 py-2.5 text-sm" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-xl border-2 border-fuchsia-100 px-3 py-2.5 text-sm" />
        <button type="submit" disabled={busy} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white font-bold px-6 py-3 flex items-center gap-2">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Publish assignment
        </button>
        {status && <p className="text-sm text-emerald-700">{status}</p>}
      </form>

      <section>
        <h2 className="font-bold text-slate-900 mb-4">Recent</h2>
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a._id} className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">{a.title}</span>
              <span className="text-slate-500"> · {a.classId?.courseName || a.classId?.className}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default TeacherAssignments;
