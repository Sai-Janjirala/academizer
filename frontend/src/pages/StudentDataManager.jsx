import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const panelClass = 'bg-card shadow-sm border border-border rounded p-6';
const statCardClass = 'bg-card shadow-sm border border-border rounded p-5 relative overflow-hidden';
const inputClass = 'w-full bg-slate-50 border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-text-primary';
const modalCardClass = 'bg-card shadow-xl border border-border rounded p-6 text-text-primary';
const chartGridColor = '#d7dee7';
const chartAxisColor = '#64748b';
const chartAccent = '#1e293b';
const pieColors = ['#1e293b', '#475569', '#94a3b8', '#cbd5e1'];

const defaultStudentForm = {
  name: '',
  rollNumber: '',
  semester: 'Semester 1',
  attendance: 0,
  loginPin: '',
  marksText: '{\n  "Math": 0,\n  "Science": 0\n}'
};

const defaultBulkStudentsJson = `[
  {
    "name": "Aarav Sharma",
    "rollNumber": "CSE101",
    "attendance": 92,
    "semester": "Semester 1",
    "marks": {
      "Mathematics": 84,
      "Physics": 79,
      "Programming": 91
    }
  }
]`;

const tooltipStyle = {
  borderRadius: 8,
  borderColor: '#d7dee7',
  backgroundColor: '#ffffff',
  color: '#0f172a'
};

const ClassDataManager = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [classForm, setClassForm] = useState({ className: '', subject: '' });
  const [studentForm, setStudentForm] = useState(defaultStudentForm);
  const [editingStudentId, setEditingStudentId] = useState('');
  const [studentEntryMode, setStudentEntryMode] = useState('single');
  const [bulkStudentsJson, setBulkStudentsJson] = useState(defaultBulkStudentsJson);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isClearingClassData, setIsClearingClassData] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  const parseMarks = (raw, fallbackSemester = '') => {
    const parsed = JSON.parse(raw || '{}');
    return Object.entries(parsed).map(([subject, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
          subject,
          semester: value.semester || fallbackSemester,
          score: Number(value.score || 0)
        };
      }

      return {
        subject,
        semester: fallbackSemester,
        score: Number(value)
      };
    });
  };

  const formatMarksForEditor = (marks = []) => {
    const formatted = {};
    marks.forEach((mark) => {
      if (!mark?.subject) return;
      if (mark.semester) {
        formatted[mark.subject] = { score: Number(mark.score || 0), semester: mark.semester };
      } else {
        formatted[mark.subject] = Number(mark.score || 0);
      }
    });
    return JSON.stringify(formatted, null, 2);
  };

  const loadClasses = async (preferredClassId = '') => {
    const res = await apiFetch('/classes');
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setClasses(list);

    if (list.length === 0) {
      setSelectedClassId('');
      return;
    }

    const nextSelectedClassId =
      preferredClassId && list.some((cls) => cls._id === preferredClassId)
        ? preferredClassId
        : selectedClassId;

    const hasSelectedClass = list.some((cls) => cls._id === nextSelectedClassId);
    setSelectedClassId(hasSelectedClass ? nextSelectedClassId : list[0]._id);
  };

  const loadClassData = async (classId) => {
    if (!classId) {
      setStudents([]);
      setAnalytics(null);
      return;
    }

    const [studentsRes, analyticsRes] = await Promise.all([
      apiFetch(`/students/class/${classId}`),
      apiFetch(`/analytics/class/${classId}`)
    ]);
    const studentsData = await studentsRes.json();
    const analyticsData = await analyticsRes.json();
    setStudents(Array.isArray(studentsData) ? studentsData : []);
    setAnalytics(analyticsData || null);
  };

  useEffect(() => {
    loadClasses().catch(() => setStatus('Unable to load classes.'));
  }, []);

  useEffect(() => {
    loadClassData(selectedClassId).catch(() => setStatus('Unable to load class data.'));
  }, [selectedClassId]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q));
  }, [students, search]);

  const createClass = async (e) => {
    e.preventDefault();
    const trimmedClassName = classForm.className.trim();
    const trimmedSubject = classForm.subject.trim();
    if (!trimmedClassName) {
      setStatus('Class name is required.');
      return;
    }

    setIsCreatingClass(true);
    setStatus('');
    try {
      const createBody = { className: trimmedClassName, subject: trimmedSubject };
      if (user?.role === 'teacher' && user?.profile?._id) {
        createBody.teacherId = user.profile._id;
      }
      const res = await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify(createBody)
      });
      const created = await res.json();
      if (!res.ok) {
        setStatus(created.error || 'Failed to create class.');
        return;
      }

      setShowClassModal(false);
      setClassForm({ className: '', subject: '' });
      await loadClasses(created._id);
      setStatus(`Class "${created.className}" created successfully.`);
    } catch (_err) {
      setStatus('Network error while creating class.');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    try {
      if (!editingStudentId && studentEntryMode === 'json') {
        const parsedStudents = JSON.parse(bulkStudentsJson || '[]');
        if (!Array.isArray(parsedStudents) || parsedStudents.length === 0) {
          setStatus('Provide a JSON array with at least one student.');
          return;
        }

        const res = await apiFetch(`/classes/${selectedClassId}/students/upload-json`, {
          method: 'POST',
          body: JSON.stringify({ students: parsedStudents })
        });
        const payload = await res.json();
        if (!res.ok) {
          setStatus(payload.error || 'Failed to upload students JSON.');
          return;
        }

        setShowStudentModal(false);
        setStudentEntryMode('single');
        setBulkStudentsJson(defaultBulkStudentsJson);
        setStudentForm(defaultStudentForm);
        await loadClassData(selectedClassId);
        setStatus(payload.message || 'Students uploaded successfully.');
        return;
      }

      const body = {
        name: studentForm.name,
        rollNumber: studentForm.rollNumber,
        registrationId: studentForm.rollNumber,
        classId: selectedClassId,
        batch: 'Academic',
        semester: studentForm.semester,
        attendance: Number(studentForm.attendance),
        marks: parseMarks(studentForm.marksText, studentForm.semester)
      };
      if (studentForm.loginPin && String(studentForm.loginPin).length >= 4) {
        body.loginPin = String(studentForm.loginPin);
      }

      const path = editingStudentId ? `/students/${editingStudentId}` : '/students';
      const method = editingStudentId ? 'PUT' : 'POST';

      const res = await apiFetch(path, {
        method,
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error || 'Failed to save student.');
        return;
      }

      setShowStudentModal(false);
      setEditingStudentId('');
      setStudentForm(defaultStudentForm);
      setStudentEntryMode('single');
      setBulkStudentsJson(defaultBulkStudentsJson);
      await loadClassData(selectedClassId);
      setStatus(editingStudentId ? 'Student updated successfully.' : 'Student added successfully.');
    } catch (_err) {
      setStatus('Invalid marks JSON or network error.');
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      await apiFetch(`/students/${studentId}`, { method: 'DELETE' });
      await loadClassData(selectedClassId);
      setStatus('Student removed successfully.');
    } catch (_err) {
      setStatus('Failed to delete student.');
    }
  };

  const clearClassData = async () => {
    if (!selectedClassId || isClearingClassData) return;

    setIsClearingClassData(true);
    setStatus('');
    try {
      const res = await apiFetch(`/classes/${selectedClassId}/students`, {
        method: 'DELETE'
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error || 'Failed to clear class data.');
        return;
      }

      await loadClassData(selectedClassId);
      setStatus(payload.message || 'Class data cleared successfully.');
    } catch (_err) {
      setStatus('Network error while clearing class data.');
    } finally {
      setIsClearingClassData(false);
    }
  };

  const deleteClass = async () => {
    if (!selectedClassId || isDeletingClass) return;

    setIsDeletingClass(true);
    setStatus('');
    try {
      const res = await apiFetch(`/classes/${selectedClassId}`, {
        method: 'DELETE'
      });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error || 'Failed to delete class.');
        return;
      }

      setShowStudentModal(false);
      setShowClassModal(false);
      setEditingStudentId('');
      setStudentForm(defaultStudentForm);
      setStudentEntryMode('single');
      setBulkStudentsJson(defaultBulkStudentsJson);
      await loadClasses();
      setStudents([]);
      setAnalytics(null);
      setStatus(payload.message || 'Class deleted successfully.');
    } catch (_err) {
      setStatus('Network error while deleting class.');
    } finally {
      setIsDeletingClass(false);
    }
  };

  const editStudent = (student) => {
    const marksMap = {};
    (student.marks || []).forEach((m) => {
      marksMap[m.subject] = m.score;
    });

    setEditingStudentId(student._id);
    setStudentForm({
      name: student.name,
      rollNumber: student.rollNumber,
      semester: student.marks?.find((mark) => mark.semester)?.semester || 'Semester 1',
      attendance: student.attendance || 0,
      loginPin: '',
      marksText: formatMarksForEditor(student.marks || [])
    });
    setStudentEntryMode('single');
    setShowStudentModal(true);
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-7xl mx-auto px-4">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary font-bold mb-2">Class Data</p>
          <h2 className="text-3xl text-text-primary mb-1 font-serif">Class Performance Dashboard</h2>
          <p className="text-text-secondary text-sm tracking-wide font-serif italic">Manage class rosters, student records, and live analytics in one place</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setShowClassModal(true);
            }}
            className="bg-text-primary text-white px-4 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            + Add Class
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedClassId) {
                setStatus('Create a class before adding students.');
                return;
              }
              setStatus('');
              setEditingStudentId('');
              setStudentForm(defaultStudentForm);
              setStudentEntryMode('single');
              setBulkStudentsJson(defaultBulkStudentsJson);
              setShowStudentModal(true);
            }}
            className="bg-text-primary text-white px-4 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            + Add Student
          </button>
          <button
            type="button"
            onClick={clearClassData}
            disabled={!selectedClassId || isClearingClassData}
            className="border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isClearingClassData ? 'Clearing Data...' : 'Clear Class Data'}
          </button>
          <button
            type="button"
            onClick={deleteClass}
            disabled={!selectedClassId || isDeletingClass}
            className="border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeletingClass ? 'Deleting Class...' : 'Delete Class'}
          </button>
        </div>
      </section>

      {status && (
        <div className="bg-slate-50 border border-border rounded px-4 py-3">
          <p className="text-sm text-text-secondary">{status}</p>
        </div>
      )}

      <section className={panelClass}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm">
            <label className="text-[11px] uppercase tracking-widest text-text-secondary font-bold block mb-2">Select Class</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className={inputClass}>
              {classes.length === 0 && <option value="">No classes available</option>}
              {classes.map((cls) => <option key={cls._id} value={cls._id}>{cls.className}</option>)}
            </select>
          </div>
          <div className="text-sm text-text-secondary">
            {selectedClassId ? `${students.length} students in selected class` : 'Create a class to begin'}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={statCardClass}>
          <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-3">Average Score</p>
          <p className="text-3xl font-serif text-text-primary">{analytics?.averageMarks || 0}</p>
          <div className="absolute bottom-0 left-0 h-1 w-16 bg-text-primary" />
        </div>
        <div className={statCardClass}>
          <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-3">Highest Score</p>
          <p className="text-3xl font-serif text-text-primary">{analytics?.topPerformer?.averageScore || 0}</p>
          <div className="absolute bottom-0 left-0 h-1 w-16 bg-emerald-600" />
        </div>
        <div className={statCardClass}>
          <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-3">Lowest Score</p>
          <p className="text-3xl font-serif text-text-primary">{analytics?.lowestPerformer?.averageScore || 0}</p>
          <div className="absolute bottom-0 left-0 h-1 w-16 bg-amber-500" />
        </div>
        <div className={statCardClass}>
          <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-3">Attendance Rate</p>
          <p className="text-3xl font-serif text-text-primary">{analytics?.attendanceRate || 0}%</p>
          <div className="absolute bottom-0 left-0 h-1 w-16 bg-slate-400" />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={panelClass}>
          <h4 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-4 border-b border-border pb-3">Class Performance Trend</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics?.studentPerformanceTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="name" stroke={chartAxisColor} />
              <YAxis stroke={chartAxisColor} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="averageScore" stroke={chartAccent} strokeWidth={2.5} dot={{ r: 3, fill: chartAccent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={panelClass}>
          <h4 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-4 border-b border-border pb-3">Subject Averages</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics?.subjectWiseAverages || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="subject" stroke={chartAxisColor} />
              <YAxis stroke={chartAxisColor} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="average" fill={chartAccent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={panelClass}>
          <h4 className="text-sm font-bold uppercase tracking-widest text-text-primary mb-4 border-b border-border pb-3">Grade Distribution</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={analytics?.gradeDistribution || []} dataKey="count" nameKey="grade" outerRadius={80}>
                {(analytics?.gradeDistribution || []).map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 border-b border-border pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">Student Performance Table</p>
            <p className="text-2xl font-serif text-text-primary">{filteredStudents.length}</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." className={`${inputClass} md:w-64`} />
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="py-3 font-bold uppercase tracking-widest text-[11px]">Name</th>
                <th className="py-3 font-bold uppercase tracking-widest text-[11px]">Roll Number</th>
                <th className="py-3 font-bold uppercase tracking-widest text-[11px]">Marks</th>
                <th className="py-3 font-bold uppercase tracking-widest text-[11px]">Attendance</th>
                <th className="py-3 font-bold uppercase tracking-widest text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-text-secondary">No students found for this class.</td>
                </tr>
              )}
              {filteredStudents.map((s) => {
                const avgScore = s.marks?.length ? Math.round(s.marks.reduce((a, b) => a + b.score, 0) / s.marks.length) : 0;
                const weak = avgScore < 55;
                return (
                  <tr key={s._id} className={`border-b border-border last:border-b-0 ${weak ? 'bg-red-50/70' : 'hover:bg-slate-50 transition-colors'}`}>
                    <td className="py-3 text-text-primary font-semibold">{s.name}</td>
                    <td className="py-3 text-text-secondary font-mono">{s.rollNumber}</td>
                    <td className="py-3 text-text-primary">{avgScore}</td>
                    <td className="py-3 text-text-primary">{s.attendance || 0}%</td>
                    <td className="py-3">
                      <button type="button" onClick={() => editStudent(s)} className="text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary mr-4">Edit</button>
                      <button type="button" onClick={() => deleteStudent(s._id)} className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={createClass} className={`${modalCardClass} w-full max-w-md`}>
            <h3 className="text-lg font-serif text-text-primary mb-4">Add Class</h3>
            <input value={classForm.className} onChange={(e) => setClassForm({ ...classForm, className: e.target.value })} placeholder="Class Name (e.g. 10A)" className={`${inputClass} mb-3`} required />
            <input value={classForm.subject} onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })} placeholder="Subject (optional)" className={`${inputClass} mb-4`} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 border border-border rounded text-text-secondary hover:text-text-primary hover:border-slate-400 transition-colors">Cancel</button>
              <button type="submit" disabled={isCreatingClass} className="px-4 py-2 bg-text-primary text-white rounded disabled:opacity-60 disabled:cursor-not-allowed">
                {isCreatingClass ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={saveStudent} className={`${modalCardClass} w-full max-w-xl`}>
            <h3 className="text-lg font-serif text-text-primary mb-4">{editingStudentId ? 'Update Student' : 'Add Student'}</h3>
            {!editingStudentId && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStudentEntryMode('single')}
                  className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-colors ${studentEntryMode === 'single' ? 'bg-text-primary text-white border-text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}
                >
                  Single Entry
                </button>
                <button
                  type="button"
                  onClick={() => setStudentEntryMode('json')}
                  className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-colors ${studentEntryMode === 'json' ? 'bg-text-primary text-white border-text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}
                >
                  JSON Upload
                </button>
              </div>
            )}

            {studentEntryMode === 'json' && !editingStudentId ? (
              <div>
                <textarea value={bulkStudentsJson} onChange={(e) => setBulkStudentsJson(e.target.value)} rows={14} className={inputClass} />
                <p className="text-xs text-text-secondary mt-2">
                  Paste a JSON array of students. Each student can include `semester` and a `marks` object like `{"{ \"Math\": 84, \"Physics\": 79 }"}`.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="Name" className={inputClass} required />
                  <input value={studentForm.rollNumber} onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })} placeholder="Roll Number" className={inputClass} required />
                  <input value={studentForm.semester} onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })} placeholder="Semester (e.g. Semester 1)" className={inputClass} />
                  <input type="number" value={studentForm.attendance} onChange={(e) => setStudentForm({ ...studentForm, attendance: e.target.value })} placeholder="Attendance %" className={inputClass} />
                  <input
                    type="password"
                    value={studentForm.loginPin}
                    onChange={(e) => setStudentForm({ ...studentForm, loginPin: e.target.value })}
                    placeholder={editingStudentId ? 'New PIN (4+ chars, optional)' : 'Attendance PIN (4+ chars, recommended)'}
                    className={`${inputClass} md:col-span-2`}
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-text-secondary -mt-1 md:col-span-2">
                  Students use roll number + this PIN on the student check-in page. Leave blank when editing to keep the current PIN.
                </p>
                <textarea value={studentForm.marksText} onChange={(e) => setStudentForm({ ...studentForm, marksText: e.target.value })} rows={8} className={`${inputClass} mt-3 font-mono`} />
                <p className="text-xs text-text-secondary mt-1">
                  Marks JSON examples: {"{\"Math\": 78, \"Science\": 82}"} or {"{\"Math\": {\"score\": 78, \"semester\": \"Semester 2\"}}"}
                </p>
              </>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowStudentModal(false);
                  setEditingStudentId('');
                  setStudentEntryMode('single');
                  setStudentForm(defaultStudentForm);
                  setBulkStudentsJson(defaultBulkStudentsJson);
                }}
                className="px-4 py-2 border border-border rounded text-text-secondary hover:text-text-primary hover:border-slate-400 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-text-primary text-white rounded">
                {studentEntryMode === 'json' && !editingStudentId ? 'Upload JSON' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClassDataManager;
