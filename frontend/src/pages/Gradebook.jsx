import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, BarChart, Download } from 'lucide-react';

const Gradebook = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/students');
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) setSelectedStudentId(data[0]._id);
        }
      } catch (_err) {
        setStudents([]);
      }
    };

    fetchStudents();
  }, []);

  const generateReport = () => {
    const selectedStudent = students.find((s) => s._id === selectedStudentId);
    if (!selectedStudent) return;
    setLoading(true);
    // Simulating API fetch GET /api/students/:id/report
    setTimeout(() => {
      setReport({
        student: selectedStudent.name,
        score: "81%",
        summary: `${selectedStudent.name} presents consistent progress with measurable opportunities for improvement across assessments.`,
        actions: ["Schedule 1-on-1 tutoring", "Review Module 4 assignments"]
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-5xl mx-auto px-4">
      <section>
        <h2 className="text-3xl text-text-primary mb-1 font-serif">Student Gradebook</h2>
        <p className="text-text-secondary text-sm tracking-wide font-serif italic">Performance Tracking & AI Reports</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        
        {/* Performance Viewer */}
        <section className="bg-card shadow-sm border border-border rounded flex-1 p-6">
          <h3 className="text-sm font-bold tracking-widest text-text-primary uppercase mb-6 border-b border-border pb-4">Select Student</h3>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full p-2.5 border border-border rounded text-sm bg-slate-50 mb-8 focus:outline-none focus:border-text-primary"
          >
            {students.length === 0 && <option value="">No students available</option>}
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} ({student.registrationId})
              </option>
            ))}
          </select>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                <span>Mid-Term Exam</span>
                <span>84/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-text-primary w-[84%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                <span>Lab Report 1</span>
                <span>92/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-text-primary w-[92%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                <span>Theoretical Quiz</span>
                <span>65/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[65%]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Report Generator */}
        <section className="bg-slate-50 shadow-sm border border-border rounded p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          {!report && !loading && (
            <>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-border mb-6">
                <Sparkles size={24} className="text-text-primary" />
              </div>
              <h3 className="text-xl font-serif text-text-primary mb-2">Generate AI Report Card</h3>
              <p className="text-sm text-text-secondary px-8 mb-8">Compile performance markers, attendance logs, and behavioural inputs into a cohesive academic overview.</p>
              <button
                onClick={generateReport}
                disabled={!selectedStudentId}
                className="bg-text-primary disabled:opacity-50 text-white px-6 py-3 rounded text-xs font-bold tracking-widest uppercase hover:bg-slate-800 transition-colors shadow-lg"
              >
                Run AI Analysis
              </button>
            </>
          )}

          {loading && (
            <p className="text-sm font-bold uppercase tracking-widest text-text-secondary animate-pulse">Aggregating Models...</p>
          )}

          {report && !loading && (
            <div className="text-left w-full h-full flex flex-col">
              <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-2xl font-serif text-text-primary">{report.student}</h3>
                  <p className="text-xs uppercase tracking-widest font-bold text-text-secondary mt-1">AI Automated Overview</p>
                </div>
                <div className="px-4 py-2 bg-text-primary text-white rounded text-2xl font-serif">{report.score}</div>
              </div>
              
              <div className="bg-white p-4 rounded border border-border mb-6">
                <p className="text-sm leading-relaxed text-text-primary italic">"{report.summary}"</p>
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">AI Recommendations</h4>
              <ul className="space-y-2 mb-8 flex-1">
                {report.actions.map((act, i) => (
                  <li key={i} className="text-sm text-text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-primary"></span>
                    {act}
                  </li>
                ))}
              </ul>
              
              <button onClick={() => setReport(null)} className="w-full flex justify-center items-center gap-2 border border-border text-text-primary bg-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors">
                <Download size={14} /> Download PDF
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
export default Gradebook;
