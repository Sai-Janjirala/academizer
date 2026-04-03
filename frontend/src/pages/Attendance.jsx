import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

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

  const fetchClasses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/classes');
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
        fetch(`http://localhost:5000/api/classes/${classId}/students`),
        fetch(`http://localhost:5000/api/classes/${classId}/subjects`)
      ]);
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();
      const classStudents = Array.isArray(studentsData) ? studentsData : [];
      const classSubjects = Array.isArray(subjectsData) ? subjectsData : [];

      setStudents(classStudents);
      setSubjects(classSubjects);
      setSelectedSubject((prev) => (prev && classSubjects.includes(prev) ? prev : (classSubjects[0] || '')));

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
      const res = await fetch(`http://localhost:5000/api/attendance/${selectedClassId}?lectureNumber=${lectureNumber}&date=${attendanceDate}`);
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

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudentsAndSubjects(selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    fetchAttendanceForLecture();
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
      const res = await fetch(`http://localhost:5000/api/classes/${selectedClassId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`http://localhost:5000/api/classes/${selectedClassId}/subjects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`http://localhost:5000/api/attendance/${selectedClassId}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="h-full flex flex-col gap-8 max-w-6xl mx-auto px-4">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-text-primary mb-1 font-serif">Class Attendance</h2>
          <p className="text-text-secondary text-sm tracking-wide font-serif italic">Take attendance lecture by lecture for a selected class</p>
        </div>
        <button onClick={saveAttendance} className="bg-text-primary text-white px-5 py-2.5 rounded text-sm font-bold tracking-widest uppercase hover:bg-slate-800 transition-colors">
          Save Attendance
        </button>
      </section>

      {statusMessage && <p className="text-sm text-text-secondary">{statusMessage}</p>}

      <section className="bg-card shadow-sm border border-border rounded p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary border-b border-border pb-3">Attendance Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary">
            {classes.length === 0 && <option value="">No classes available</option>}
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>{cls.courseName} ({cls.courseCode})</option>
            ))}
          </select>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary">
            {subjects.length === 0 && <option value="">No subjects</option>}
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <input type="number" min="1" value={lectureNumber} onChange={(e) => setLectureNumber(Number(e.target.value) || 1)} className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary" placeholder="Lecture Number" />
          <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary" />
        </div>

        <form onSubmit={addSubject} className="flex gap-3">
          <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Add subject option for this class" className="flex-1 bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary" />
          <button type="submit" className="bg-text-primary text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800">Add Subject</button>
        </form>

        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <div key={subject} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-slate-50 text-xs">
              <span>{subject}</span>
              <button onClick={() => removeSubject(subject)} className="text-red-600 font-bold">x</button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card shadow-sm border border-border rounded flex-1 p-6">
        <div className="flex justify-between mb-8 items-end border-b border-border pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Students In Selected Class</p>
            <p className="text-2xl font-serif text-text-primary">{students.length}</p>
          </div>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-text-secondary" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Search student..." className="w-full bg-slate-50 border border-border rounded pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          {filteredStudents.length === 0 && <p className="text-sm text-text-secondary">No students found in this class.</p>}
          {filteredStudents.map((student) => {
            const status = records[student._id] || 'Present';
            return (
              <div key={student._id} className="flex items-center justify-between p-4 border border-border rounded hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{student.name}</h4>
                  <p className="text-xs text-text-secondary font-mono mt-0.5">{student.registrationId} • Batch {student.batch}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setRecords((prev) => ({ ...prev, [student._id]: 'Present' }))} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border ${status === 'Present' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-border text-text-secondary'}`}>
                    Present
                  </button>
                  <button onClick={() => setRecords((prev) => ({ ...prev, [student._id]: 'Absent' }))} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border ${status === 'Absent' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-border text-text-secondary'}`}>
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
