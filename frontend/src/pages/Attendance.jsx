import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight, Save, Search, Download, Edit3, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

// Reusable micro-components for UI consistency
const StatCard = ({ title, value, subtext, icon, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-2">
    <div className="flex items-center justify-between text-slate-500">
      <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
      {icon}
    </div>
    <div className="flex items-baseline gap-2">
      <span className={`text-3xl font-light tracking-tight ${colorClass}`}>{value}</span>
      <span className="text-xs text-slate-400 font-medium">{subtext}</span>
    </div>
  </div>
);

const Attendance = () => {
  const [view, setView] = useState('DASHBOARD'); // DASHBOARD, FLOW, SUMMARY, HISTORY, EDIT
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  
  // Data State
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  
  // Flow State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [flowDate, setFlowDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState({}); // { studentId: 'Present' | 'Absent' | 'Leave' }
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit State
  const [editingRecordId, setEditingRecordId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const clsRes = await apiFetch('/classes');
      const clsData = await clsRes.json();
      if (Array.isArray(clsData)) setClasses(clsData);

      await fetchHistory();
    } catch (e) {
      console.error(e);
      showToast('Error loading initial data');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiFetch('/attendance');
      const data = await res.json();
      if (Array.isArray(data)) setHistoryRecords(data);
    } catch (e) {}
  };

  const loadSubjectsAndStudents = async (classId) => {
    if (!classId) return;
    setLoading(true);
    try {
      const [stuRes, subRes] = await Promise.all([
        apiFetch(`/classes/${classId}/students`),
        apiFetch(`/classes/${classId}/subjects`)
      ]);
      const stuData = await stuRes.json();
      const subData = await subRes.json();
      
      setStudents(Array.isArray(stuData) ? stuData : []);
      const subs = Array.isArray(subData) ? subData : [];
      setSubjects(subs);
      
      if (!selectedSubject && subs.length > 0) setSelectedSubject(subs[0]);
      
      // Default to Present
      const defaultRecords = {};
      (Array.isArray(stuData) ? stuData : []).forEach(s => defaultRecords[s._id] = 'Present');
      setRecords(defaultRecords);
    } catch (e) {
      showToast('Failed to load class data');
    }
    setLoading(false);
  };

  // When class changes in FLOW, load its students
  useEffect(() => {
    if ((view === 'FLOW' || view === 'EDIT') && selectedClassId) {
      loadSubjectsAndStudents(selectedClassId);
    }
  }, [selectedClassId, view]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveAttendance = async () => {
    if (!selectedClassId || !selectedSubject) {
      showToast('Select a Class and Subject'); return;
    }
    setLoading(true);
    
    const payloadRecords = students.map(s => ({
      student: s._id,
      status: records[s._id] || 'Present'
    }));
    
    // Calculate live stats
    const present = payloadRecords.filter(r => r.status === 'Present').length;
    const absent = payloadRecords.filter(r => r.status === 'Absent').length;
    const leave = payloadRecords.filter(r => r.status === 'Leave').length;
    const netStudents = payloadRecords.length - leave;
    const percentage = netStudents > 0 ? Math.round((present / netStudents) * 100) : 0;
    
    try {
      if (view === 'EDIT' && editingRecordId) {
        // PUT request
        const res = await apiFetch(`/attendance/${editingRecordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: payloadRecords })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showToast('Attendance updated successfully');
      } else {
        // POST request
        const res = await apiFetch('/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selectedClassId,
            subject: selectedSubject,
            date: flowDate,
            records: payloadRecords
          })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showToast('Attendance saved successfully');
      }
      
      await fetchHistory(); // refresh data
      setView('SUMMARY');
    } catch (e) {
      showToast(e.message || 'Error saving attendance');
    }
    setLoading(false);
  };

  const openHistory = () => {
    fetchHistory();
    setView('HISTORY');
  }

  const openEdit = (record) => {
    setSelectedClassId(record.classId._id);
    setSelectedSubject(record.subject);
    setFlowDate(new Date(record.date).toISOString().slice(0, 10));
    setEditingRecordId(record._id);
    
    // map existing records
    const rMap = {};
    record.records.forEach(r => {
       rMap[r.student._id] = r.status;
    });
    setRecords(rMap);
    
    setView('EDIT');
  };

  // --- STATS CALCULATIONS ---
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [students, searchTerm]);

  const liveStats = useMemo(() => {
    const total = students.length;
    let p = 0, a = 0, l = 0;
    students.forEach(s => {
      const st = records[s._id] || 'Present';
      if(st === 'Present') p++;
      if(st === 'Absent') a++;
      if(st === 'Leave') l++;
    });
    const net = total - l;
    const pct = net > 0 ? Math.round((p / net) * 100) : 0;
    return { total, present: p, absent: a, leave: l, percentage: pct };
  }, [records, students]);

  // Dash stats (today)
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0,10);
    const todayRecs = historyRecords.filter(r => new Date(r.date).toISOString().slice(0,10) === today);
    let p = 0, a = 0, l = 0, totalObj = 0;
    todayRecs.forEach(record => {
      record.records.forEach(st => {
         totalObj++;
         if(st.status==='Present') p++;
         if(st.status==='Absent') a++;
         if(st.status==='Leave') l++;
      });
    });
    const net = totalObj - l;
    const percentage = net > 0 ? Math.round((p/net)*100) : 0;
    return { present: p, absent: a, leave: l, percentage };
  }, [historyRecords]);

  // --- RENDERS ---
  const renderDashboard = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">Module</p>
           <h1 className="text-3xl font-serif text-slate-900 tracking-tight">Attendance Dashboard</h1>
        </div>
        <button 
          onClick={() => {
            if(classes.length > 0 && !selectedClassId) setSelectedClassId(classes[0]._id);
            if(subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0]);
            setFlowDate(new Date().toISOString().slice(0, 10));
            setEditingRecordId(null);
            setView('FLOW');
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-95 text-center flex items-center gap-2"
        >
          Start Attendance <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard title="Today Present" value={todayStats.present} subtext="Students" icon={<CheckCircle2 size={16} className="text-emerald-500"/>} colorClass="text-emerald-700" />
        <StatCard title="Today Absent" value={todayStats.absent} subtext="Students" icon={<XCircle size={16} className="text-rose-500"/>} colorClass="text-rose-700" />
        <StatCard title="On Leave" value={todayStats.leave} subtext="Approved" icon={<AlertCircle size={16} className="text-amber-500"/>} colorClass="text-amber-700" />
        <StatCard title="Attendance %" value={`${todayStats.percentage}%`} subtext="Avg Today" icon={<Sparkles size={16} className="text-indigo-500"/>} colorClass="text-indigo-700" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
             <Clock size={16} className="text-slate-400"/> Recent Activity
           </h3>
           <button onClick={openHistory} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View History</button>
        </div>
        {historyRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No attendance records found yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyRecords.slice(0, 5).map((r, i) => {
               const p = r.records.filter(x => x.status==='Present').length;
               const net = r.records.length - r.records.filter(x => x.status==='Leave').length;
               const pct = net > 0 ? Math.round((p/net)*100) : 0;
               return (
                 <div key={r._id || i} onClick={() => openEdit(r)} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors">
                   <div>
                     <p className="text-sm font-bold text-slate-800">{r.classId?.className || 'Class'} • {r.subject}</p>
                     <p className="text-xs text-slate-500 mt-1">{new Date(r.date).toLocaleDateString()} — {r.records.length} Students</p>
                   </div>
                   <div className="text-right">
                     <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct}%</span>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Attendance</p>
                   </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderFlow = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
       {/* Top Bar */}
       <div className="flex items-center gap-4 mb-6">
         <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
           <ArrowLeft size={18} />
         </button>
         <h1 className="text-2xl font-serif text-slate-900 tracking-tight flex-1">
           {view === 'EDIT' ? 'Edit Attendance' : 'Mark Attendance'}
         </h1>
         <div className="flex bg-slate-100 rounded-lg p-1 mr-4">
            <span className="text-xs font-bold uppercase text-slate-500 px-3 py-1.5">{new Date(flowDate).toLocaleDateString()}</span>
         </div>
       </div>

       {/* Control Header (Sticky) */}
       <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm p-4 mb-6">
         
         <div className="flex flex-col lg:flex-row gap-6 mb-4">
           <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Class</label>
               <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-medium">
                 {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Subject</label>
               <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-medium">
                 <option value="">Select subject...</option>
                 {subjects.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Date</label>
               <input type="date" value={flowDate} onChange={e => setFlowDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-medium" />
             </div>
           </div>
           
           {/* Live Stats */}
           <div className="flex gap-4 md:gap-8 items-center bg-slate-50 rounded-xl px-6 py-2 border border-slate-100">
             <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-slate-500">Total</p>
               <p className="text-lg font-bold text-slate-900">{liveStats.total}</p>
             </div>
             <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-emerald-600">Present</p>
               <p className="text-lg font-bold text-emerald-700">{liveStats.present}</p>
             </div>
             <div className="text-center">
               <p className="text-[10px] uppercase font-bold text-rose-600">Absent</p>
               <p className="text-lg font-bold text-rose-700">{liveStats.absent}</p>
             </div>
             <div className="text-center pl-4 border-l border-slate-200">
               <p className="text-[10px] uppercase font-bold text-indigo-500">Rate</p>
               <p className="text-xl font-bold text-indigo-900">{liveStats.percentage}%</p>
             </div>
           </div>
         </div>

         {/* Actions */}
         <div className="flex justify-between items-center border-t border-slate-100 pt-4">
           <div className="flex gap-2">
             <button onClick={() => {
                const nx = {...records};
                students.forEach(s => nx[s._id] = 'Present');
                setRecords(nx);
             }} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold transition-colors">All Present</button>
             <button onClick={() => {
                const nx = {...records};
                students.forEach(s => nx[s._id] = 'Absent');
                setRecords(nx);
             }} className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-bold transition-colors">All Absent</button>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} type="text" placeholder="Search..." className="pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-indigo-300 w-48" />
             </div>
             <button onClick={saveAttendance} disabled={loading} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                {loading ? 'Saving...' : 'Save Attendance'}
             </button>
           </div>
         </div>
       </div>

       {/* Vertical Student List */}
       <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2 pb-20">
         {filteredStudents.length === 0 ? (
           <div className="text-center text-slate-400 text-sm py-10">No students found.</div>
         ) : filteredStudents.map(student => {
            const status = records[student._id] || 'Present';
            return (
              <div key={student._id} className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 hover:border-indigo-100 hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{student.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{student.rollNumber || student.registrationId}</p>
                </div>
                
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button onClick={()=>setRecords(p => ({...p, [student._id]: 'Present'}))}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                  >Present</button>
                  <button onClick={()=>setRecords(p => ({...p, [student._id]: 'Absent'}))}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'}`}
                  >Absent</button>
                  <button onClick={()=>setRecords(p => ({...p, [student._id]: 'Leave'}))}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Leave' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'}`}
                  >Leave</button>
                </div>
              </div>
            )
         })}
       </div>
    </div>
  );

  const renderSummary = () => (
    <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
       <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl p-8 max-w-sm w-full text-center">
         <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
         </div>
         <h2 className="text-2xl font-serif text-slate-900 mb-2">Saved Successfully</h2>
         <p className="text-sm text-slate-500 mb-8">Recorded {liveStats.total} students for {selectedSubject}.</p>
         
         <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
             <p className="text-[10px] uppercase font-bold text-slate-400">Attendance</p>
             <p className="text-2xl font-bold text-emerald-600">{liveStats.percentage}%</p>
           </div>
           <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
             <p className="text-[10px] uppercase font-bold text-slate-400">Absentees</p>
             <p className="text-2xl font-bold text-rose-600">{liveStats.absent}</p>
           </div>
         </div>

         <div className="flex flex-col gap-3">
           <button onClick={() => setView('DASHBOARD')} className="w-full py-3 bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors hover:bg-slate-800">
             Back to Dashboard
           </button>
           <button onClick={() => setView('EDIT')} className="w-full py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-colors hover:bg-slate-50">
             Review & Edit
           </button>
         </div>
       </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
           <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
             <ArrowLeft size={18} />
           </button>
           <h1 className="text-3xl font-serif text-slate-900 tracking-tight">History Log</h1>
         </div>
       </div>

       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
         {historyRecords.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">No history available.</div>
         ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance %</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.map(r => {
                    const p = r.records.filter(x => x.status==='Present').length;
                    const net = r.records.length - r.records.filter(x => x.status==='Leave').length;
                    const pct = net > 0 ? Math.round((p/net)*100) : 0;
                    return (
                      <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{r.classId?.className || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{r.subject}</td>
                        <td className="px-6 py-4">
                           <span className={`text-sm font-bold ${pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct}%</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => openEdit(r)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center justify-end gap-1 ml-auto">
                             <Edit3 size={14} /> Edit
                           </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
         )}
       </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] max-w-6xl mx-auto px-4 pb-6 flex flex-col relative w-full">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-bottom-8 z-50 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}

      {view === 'DASHBOARD' && renderDashboard()}
      {(view === 'FLOW' || view === 'EDIT') && renderFlow()}
      {view === 'SUMMARY' && renderSummary()}
      {view === 'HISTORY' && renderHistory()}

    </div>
  );
};

export default Attendance;
