import React, { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const TeacherStudentRemarks = () => {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch('/classes')
      .then((r) => r.json())
      .then((c) => {
        setClasses(Array.isArray(c) ? c : []);
        if (c[0]) setClassId(c[0]._id);
      });
  }, []);

  useEffect(() => {
    if (!classId) return;
    apiFetch(`/teacher/students-for-remarks?classId=${classId}`)
      .then((r) => r.json())
      .then((list) => {
        setStudents(Array.isArray(list) ? list : []);
        if (list[0]) setStudentId(list[0]._id);
      });
  }, [classId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!studentId || !body.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      const res = await apiFetch('/teacher/remarks', {
        method: 'POST',
        body: JSON.stringify({ studentId, classId, body })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setBody('');
      setStatus('Remark delivered to student portal.');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Direct student remarks</h1>
        <p className="text-slate-600 mt-2">Shows on the student&apos;s Remarks screen.</p>
      </header>
      <form onSubmit={submit} className="rounded-2xl border-2 border-teal-100 bg-white/90 p-6 shadow-md space-y-4">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border-2 px-3 py-2.5 text-sm">
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.courseName || c.className}
            </option>
          ))}
        </select>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-xl border-2 px-3 py-2.5 text-sm">
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.registrationId})
            </option>
          ))}
        </select>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Encouragement, corrective feedback, or next steps"
          className="w-full rounded-xl border-2 px-3 py-2.5 text-sm"
          required
        />
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 text-white font-bold px-6 py-3">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
          Send remark
        </button>
        {status && <p className="text-sm text-emerald-700">{status}</p>}
      </form>
    </div>
  );
};

export default TeacherStudentRemarks;
