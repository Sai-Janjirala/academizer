import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Link2, QrCode, Search, Sparkles, Users, Wifi } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [records, setRecords] = useState({});

  const [activeSession, setActiveSession] = useState(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const studentPortalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/check-in`;

  const fetchClasses = async () => {
    try {
      const res = await apiFetch('/classes');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      if (!selectedClassId && list.length > 0) setSelectedClassId(list[0]._id);
    } catch (_err) {
      setStatusMessage('Unable to load classes.');
    }
  };

  const fetchStudentsAndSubjects = async (classId) => {
    if (!classId) return;
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        apiFetch(`/classes/${classId}/students`),
        apiFetch(`/classes/${classId}/subjects`)
      ]);
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();
      const classStudents = Array.isArray(studentsData) ? studentsData : [];
      const classSubjects = Array.isArray(subjectsData) ? subjectsData : [];

      setStudents(classStudents);
      setSubjects(classSubjects);
      setSelectedSubject((prev) => (prev && classSubjects.includes(prev) ? prev : classSubjects[0] || ''));

      const base = {};
      classStudents.forEach((s) => {
        base[s._id] = 'Present';
      });
      setRecords(base);
    } catch (_err) {
      setStatusMessage('Unable to load students or subjects.');
    }
  };

  const fetchAttendanceForLecture = async () => {
    if (!selectedClassId) return;
    try {
      const res = await apiFetch(
        `/attendance/${selectedClassId}?lectureNumber=${lectureNumber}&date=${attendanceDate}`
      );
      const data = await res.json();
      if (!data) return;

      if (data.subject) setSelectedSubject(data.subject);
      const updated = {};
      (data.records || []).forEach((r) => {
        updated[r.student?._id || r.student] = r.status;
      });
      setRecords((prev) => ({ ...prev, ...updated }));
    } catch (_err) {
      setStatusMessage('Unable to load saved attendance for this lecture.');
    }
  };

  const fetchActiveSession = async () => {
    if (!selectedClassId) return;
    try {
      const q = new URLSearchParams({
        classId: selectedClassId,
        lectureNumber: String(lectureNumber),
        date: attendanceDate
      });
      const res = await apiFetch(`/attendance-sessions/active?${q}`);
      const data = await res.json();
      setActiveSession(data && data.sessionCode ? data : null);
    } catch (_err) {
      setActiveSession(null);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudentsAndSubjects(selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    fetchAttendanceForLecture();
  }, [selectedClassId, lectureNumber, attendanceDate]);

  useEffect(() => {
    fetchActiveSession();
    const t = setInterval(fetchActiveSession, 15000);
    return () => clearInterval(t);
  }, [selectedClassId, lectureNumber, attendanceDate]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.registrationId.toLowerCase().includes(q));
  }, [students, searchTerm]);

  const addSubject = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !newSubject.trim()) return;
    const subject = newSubject.trim();
    try {
      const res = await apiFetch(`/classes/${selectedClassId}/subjects`, {
        method: 'POST',
        body: JSON.stringify({ subject })
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatusMessage(payload.error || 'Could not add subject.');
        return;
      }
      setSubjects(payload.subjects || []);
      setSelectedSubject(subject);
      setNewSubject('');
    } catch (_err) {
      setStatusMessage('Network error while adding subject.');
    }
  };

  const removeSubject = async (subject) => {
    if (!selectedClassId || !subject) return;
    try {
      const res = await apiFetch(`/classes/${selectedClassId}/subjects`, {
        method: 'DELETE',
        body: JSON.stringify({ subject })
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatusMessage(payload.error || 'Could not remove subject.');
        return;
      }
      const list = payload.subjects || [];
      setSubjects(list);
      if (selectedSubject === subject) setSelectedSubject(list[0] || '');
    } catch (_err) {
      setStatusMessage('Network error while removing subject.');
    }
  };

  const saveAttendance = async () => {
    if (!selectedClassId) {
      setStatusMessage('Select a class first.');
      return;
    }
    if (!selectedSubject) {
      setStatusMessage('Add/select a subject first.');
      return;
    }

    const payloadRecords = students.map((s) => ({
      student: s._id,
      status: records[s._id] || 'Present'
    }));

    try {
      const res = await apiFetch(`/attendance/${selectedClassId}/mark`, {
        method: 'POST',
        body: JSON.stringify({
          lectureNumber,
          subject: selectedSubject,
          date: attendanceDate,
          records: payloadRecords
        })
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatusMessage(payload.error || 'Could not save attendance.');
        return;
      }
      setStatusMessage('Attendance saved successfully for this lecture.');
    } catch (_err) {
      setStatusMessage('Network error while saving attendance.');
    }
  };

  const startLectureSession = async () => {
    if (!selectedClassId || !selectedSubject) {
      setStatusMessage('Select class and subject before opening a self check-in session.');
      return;
    }
    setSessionBusy(true);
    try {
      const res = await apiFetch('/attendance-sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          lectureNumber,
          date: attendanceDate,
          subject: selectedSubject
        })
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatusMessage(payload.error || 'Could not start session.');
        return;
      }
      setActiveSession(payload.session);
      setStatusMessage('Students can check in with the code below (same classroom Wi‑Fi / LAN as this computer).');
    } catch (_err) {
      setStatusMessage('Network error starting session.');
    } finally {
      setSessionBusy(false);
    }
  };

  const copyCode = async () => {
    if (!activeSession?.sessionCode) return;
    try {
      await navigator.clipboard.writeText(activeSession.sessionCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setStatusMessage('Could not copy — select the code manually.');
    }
  };

  const copyPortalLink = async () => {
    try {
      await navigator.clipboard.writeText(studentPortalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setStatusMessage('Could not copy link.');
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-6xl mx-auto px-4 animate-fade-up">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-violet-600 mb-1 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Attendance
          </p>
          <h2 className="text-3xl text-text-primary mb-1 font-serif">Class Attendance</h2>
          <p className="text-text-secondary text-sm tracking-wide font-serif italic">
            Manual roster + optional student self check-in with face + PIN
          </p>
        </div>
        <button
          onClick={saveAttendance}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 text-sm font-bold tracking-wide uppercase shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          Save Attendance
        </button>
      </section>

      {statusMessage && (
        <p className="text-sm rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-violet-900 animate-fade-in">{statusMessage}</p>
      )}

      <section className="rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-white via-lilac/40 to-mint-50/50 shadow-md p-6 space-y-4 transition-shadow hover:shadow-lg duration-300">
        <div className="flex flex-wrap items-center gap-2 border-b border-violet-100/80 pb-3">
          <Users className="h-4 w-4 text-fuchsia-600" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">Student self check-in session</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Share the check-in page and session code. Students sign in with their roll ID and PIN (set in Class Data), verify their face, and mark present. The server compares
          LAN network prefixes—it cannot read Wi‑Fi names, so everyone should be on the same classroom network as this machine.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyPortalLink}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyan-900 hover:bg-cyan-100 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Copy student link
          </button>
          <code className="text-xs bg-white/80 px-3 py-2 rounded-lg border border-cyan-100 text-cyan-800 truncate max-w-[220px]">{studentPortalUrl}</code>
          {copiedLink && <span className="text-xs font-semibold text-emerald-600">Copied!</span>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={sessionBusy}
            onClick={startLectureSession}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <QrCode className="h-4 w-4" />
            {sessionBusy ? 'Starting…' : 'Open / refresh lecture code'}
          </button>
        </div>
        {activeSession && (
          <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <Wifi className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-900">Active session code</p>
                <p className="text-3xl font-mono font-bold tracking-wider text-amber-950 mt-1">{activeSession.sessionCode}</p>
                <p className="text-xs text-amber-800/90 mt-1">
                  Expires {activeSession.expiresAt ? new Date(activeSession.expiresAt).toLocaleTimeString() : 'in a few hours'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 self-start rounded-xl bg-amber-500 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy code
              </button>
              {copiedCode && <span className="text-xs font-semibold text-emerald-600">Code copied!</span>}
            </div>
          </div>
        )}
      </section>

      <section className="bg-card shadow-md border-2 border-indigo-50 rounded-2xl p-6 space-y-4 transition-all hover:border-indigo-100 duration-300">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-indigo-100 pb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          Attendance settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          >
            {classes.length === 0 && <option value="">No classes available</option>}
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.courseName} ({cls.courseCode})
              </option>
            ))}
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          >
            {subjects.length === 0 && <option value="">No subjects</option>}
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={lectureNumber}
            onChange={(e) => setLectureNumber(Number(e.target.value) || 1)}
            className="bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            placeholder="Lecture Number"
          />
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>

        <form onSubmit={addSubject} className="flex gap-3">
          <input
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add subject option for this class"
            className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          <button
            type="submit"
            className="rounded-xl bg-teal-500 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-teal-600 transition-colors shadow-sm"
          >
            Add Subject
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <div
              key={subject}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 text-xs font-medium text-fuchsia-900"
            >
              <span>{subject}</span>
              <button type="button" onClick={() => removeSubject(subject)} className="text-rose-600 font-bold hover:text-rose-800">
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card shadow-md border-2 border-teal-50 rounded-2xl flex-1 p-6 transition-all hover:shadow-lg duration-300">
        <div className="flex justify-between mb-8 items-end border-b border-teal-100 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-teal-700 font-bold mb-1">Students in selected class</p>
            <p className="text-2xl font-serif text-text-primary">{students.length}</p>
          </div>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-teal-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="text"
              placeholder="Search student..."
              className="w-full bg-teal-50/50 border-2 border-teal-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredStudents.length === 0 && <p className="text-sm text-text-secondary">No students found in this class.</p>}
          {filteredStudents.map((student) => {
            const status = records[student._id] || 'Present';
            return (
              <div
                key={student._id}
                className="flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-transparent hover:border-violet-100 transition-all duration-300"
              >
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{student.name}</h4>
                  <p className="text-xs text-text-secondary font-mono mt-0.5">
                    {student.registrationId} • Batch {student.batch}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecords((prev) => ({ ...prev, [student._id]: 'Present' }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                      status === 'Present'
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm scale-[1.02]'
                        : 'bg-white border-slate-200 text-text-secondary hover:border-emerald-200'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecords((prev) => ({ ...prev, [student._id]: 'Absent' }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                      status === 'Absent'
                        ? 'bg-rose-100 border-rose-400 text-rose-800 shadow-sm scale-[1.02]'
                        : 'bg-white border-slate-200 text-text-secondary hover:border-rose-200'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Attendance;
