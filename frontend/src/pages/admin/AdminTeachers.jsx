import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [due, setDue] = useState('');
  const [remarkBody, setRemarkBody] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [tRes, kRes] = await Promise.all([apiFetch('/admin/teachers'), apiFetch('/admin/teacher-tasks')]);
    const t = await tRes.json();
    const k = await kRes.json();
    if (tRes.ok) setTeachers(t);
    if (kRes.ok) setTasks(k);
    if (!selectedTeacher && t.length) setSelectedTeacher(t[0]._id);
  };

  useEffect(() => {
    load().catch(() => setStatus('Could not load teachers.'));
  }, []);

  const submitTask = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !taskTitle) return;
    setBusy(true);
    setStatus('');
    try {
      const res = await apiFetch('/admin/teacher-tasks', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: selectedTeacher,
          title: taskTitle,
          description: taskDesc,
          dueDate: due || undefined
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setTaskTitle('');
      setTaskDesc('');
      setDue('');
      setStatus('Task assigned.');
      await load();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRemark = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !remarkBody.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const res = await apiFetch('/admin/teacher-remarks', {
        method: 'POST',
        body: JSON.stringify({ teacherId: selectedTeacher, body: remarkBody })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setRemarkBody('');
      setStatus('Remark sent.');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Teachers & work items</h1>
        <p className="text-slate-600 mt-2">Assign operational tasks and share performance remarks.</p>
      </header>

      {status && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{status}</div>}

      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={submitTask} className="rounded-2xl border-2 border-amber-100 bg-white/90 p-6 shadow-md space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Send className="h-5 w-5 text-amber-600" />
            Assign work
          </h2>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full rounded-xl border-2 border-amber-100 px-3 py-2.5 text-sm"
          >
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border-2 border-amber-100 px-3 py-2.5 text-sm"
            required
          />
          <textarea
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full rounded-xl border-2 border-amber-100 px-3 py-2.5 text-sm"
          />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-xl border-2 border-amber-100 px-3 py-2.5 text-sm" />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 flex justify-center gap-2"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Assign task
          </button>
        </form>

        <form onSubmit={submitRemark} className="rounded-2xl border-2 border-violet-100 bg-white/90 p-6 shadow-md space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-violet-600" />
            Remark to teacher
          </h2>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full rounded-xl border-2 border-violet-100 px-3 py-2.5 text-sm"
          >
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          <textarea
            value={remarkBody}
            onChange={(e) => setRemarkBody(e.target.value)}
            placeholder="Feedback, appreciation, or corrective note"
            rows={5}
            className="w-full rounded-xl border-2 border-violet-100 px-3 py-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold py-3"
          >
            Send remark
          </button>
        </form>
      </div>

      <section className="rounded-2xl border-2 border-slate-100 bg-white/80 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Recent assignments</h2>
        <ul className="space-y-2 text-sm">
          {tasks.slice(0, 12).map((t) => (
            <li key={t._id} className="flex justify-between border-b border-slate-100 pb-2">
              <span className="font-medium text-slate-800">{t.title}</span>
              <span className="text-slate-500">
                {(t.teacherId && t.teacherId.name) || 'Teacher'} · {t.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminTeachers;
