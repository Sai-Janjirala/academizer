import React, { useEffect, useState } from 'react';

const qualityKeys = ['participation', 'discipline', 'teamwork', 'creativity'];

const StudentDataManager = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [classForm, setClassForm] = useState({ courseName: '', courseCode: '' });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [editStudent, setEditStudent] = useState({
    name: '',
    registrationId: '',
    batch: '',
    participation: 5,
    discipline: 5,
    teamwork: 5,
    creativity: 5
  });

  const fetchClasses = async () => {
    const res = await fetch('http://localhost:5000/api/classes');
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setClasses(list);
    if (!selectedClassId && list.length > 0) setSelectedClassId(list[0]._id);
  };

  const fetchStudents = async (classId) => {
    if (!classId) return;
    const res = await fetch(`http://localhost:5000/api/classes/${classId}/students`);
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchClasses().catch(() => setStatusMessage('Unable to load classes.'));
  }, []);

  useEffect(() => {
    fetchStudents(selectedClassId).catch(() => setStatusMessage('Unable to load students.'));
  }, [selectedClassId]);

  const createClass = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm)
      });
      const payload = await res.json();
      if (!res.ok) return setStatusMessage(payload.error || 'Could not create class.');
      setClassForm({ courseName: '', courseCode: '' });
      await fetchClasses();
      setSelectedClassId(payload?.class?._id || selectedClassId);
      setStatusMessage('Class created.');
    } catch (_err) {
      setStatusMessage('Network error while creating class.');
    }
  };

  const uploadJsonFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClassId) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const studentsPayload = Array.isArray(parsed) ? parsed : parsed.students;
      if (!Array.isArray(studentsPayload)) {
        setStatusMessage('Invalid JSON. Use an array or { "students": [...] }.');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/classes/${selectedClassId}/students/upload-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsPayload })
      });
      const payload = await res.json();
      if (!res.ok) return setStatusMessage(payload.error || 'Upload failed.');

      setStatusMessage(`Uploaded ${payload.count} students.`);
      fetchStudents(selectedClassId);
    } catch (_err) {
      setStatusMessage('Invalid JSON file.');
    }
  };

  const onSelectStudent = (id) => {
    setSelectedStudentId(id);
    const selected = students.find((s) => s._id === id);
    if (!selected) return;
    setEditStudent({
      name: selected.name,
      registrationId: selected.registrationId,
      batch: selected.batch,
      participation: selected.qualities?.participation ?? 5,
      discipline: selected.qualities?.discipline ?? 5,
      teamwork: selected.qualities?.teamwork ?? 5,
      creativity: selected.qualities?.creativity ?? 5
    });
  };

  const updateStudent = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !selectedStudentId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/classes/${selectedClassId}/students/${selectedStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editStudent.name,
          registrationId: editStudent.registrationId,
          batch: editStudent.batch,
          qualities: {
            participation: Number(editStudent.participation),
            discipline: Number(editStudent.discipline),
            teamwork: Number(editStudent.teamwork),
            creativity: Number(editStudent.creativity)
          }
        })
      });
      const payload = await res.json();
      if (!res.ok) return setStatusMessage(payload.error || 'Update failed.');
      setStatusMessage('Student profile updated.');
      fetchStudents(selectedClassId);
    } catch (_err) {
      setStatusMessage('Network error while updating student.');
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-6xl mx-auto px-4">
      <section>
        <h2 className="text-3xl text-text-primary mb-1 font-serif">Class Data Manager</h2>
        <p className="text-text-secondary text-sm tracking-wide font-serif italic">Select a class, view its students, and update student data for that class</p>
      </section>

      {statusMessage && <p className="text-sm text-text-secondary">{statusMessage}</p>}

      <section className="bg-card border border-border rounded p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border pb-3">Create / Select Class</h3>
        <form onSubmit={createClass} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={classForm.courseName} onChange={(e) => setClassForm({ ...classForm, courseName: e.target.value })} placeholder="Course Name" required className="bg-slate-50 border border-border rounded px-3 py-2 text-sm" />
          <input value={classForm.courseCode} onChange={(e) => setClassForm({ ...classForm, courseCode: e.target.value })} placeholder="Course Code" required className="bg-slate-50 border border-border rounded px-3 py-2 text-sm" />
          <button type="submit" className="bg-text-primary text-white px-5 py-2.5 rounded text-sm font-bold tracking-widest uppercase">Add Class</button>
        </form>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full bg-slate-50 border border-border rounded px-3 py-2 text-sm"
        >
          {classes.length === 0 && <option value="">No classes yet</option>}
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.courseName} ({cls.courseCode})
            </option>
          ))}
        </select>
      </section>

      <section className="bg-card border border-border rounded p-6 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border pb-3">Upload Students JSON</h3>
        <input type="file" accept=".json,application/json" onChange={uploadJsonFile} className="text-sm" />
        <p className="text-xs text-text-secondary">
          JSON format: [{`{"name":"A","registrationId":"STU-1","batch":"2026","qualities":{"participation":7,"discipline":8,"teamwork":6,"creativity":9}}`}]
        </p>
      </section>

      <section className="bg-card border border-border rounded p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border pb-3">Update Student Profile</h3>
        <form onSubmit={updateStudent} className="space-y-3">
          <select value={selectedStudentId} onChange={(e) => onSelectStudent(e.target.value)} className="w-full bg-slate-50 border border-border rounded px-3 py-2 text-sm">
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.registrationId})</option>
            ))}
          </select>
          <input value={editStudent.name} onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })} placeholder="Student Name" className="w-full bg-slate-50 border border-border rounded px-3 py-2 text-sm" />
          <input value={editStudent.registrationId} onChange={(e) => setEditStudent({ ...editStudent, registrationId: e.target.value })} placeholder="Registration ID" className="w-full bg-slate-50 border border-border rounded px-3 py-2 text-sm" />
          <input value={editStudent.batch} onChange={(e) => setEditStudent({ ...editStudent, batch: e.target.value })} placeholder="Batch" className="w-full bg-slate-50 border border-border rounded px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            {qualityKeys.map((q) => (
              <input key={q} type="number" min="1" max="10" value={editStudent[q]} onChange={(e) => setEditStudent({ ...editStudent, [q]: e.target.value })} placeholder={`${q} (1-10)`} className="bg-slate-50 border border-border rounded px-3 py-2 text-sm" />
            ))}
          </div>
          <button type="submit" className="w-full bg-text-primary text-white px-5 py-2.5 rounded text-sm font-bold tracking-widest uppercase">Update Student</button>
        </form>
      </section>

      <section className="bg-card border border-border rounded p-6 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border pb-3">Students In Selected Class</h3>
        {students.length === 0 && <p className="text-sm text-text-secondary">No students available in this class.</p>}
        {students.map((s) => (
          <div key={s._id} className="p-3 border border-border rounded bg-slate-50/60">
            <p className="text-sm font-semibold text-text-primary">{s.name}</p>
            <p className="text-xs text-text-secondary">{s.registrationId} • Batch {s.batch}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default StudentDataManager;
