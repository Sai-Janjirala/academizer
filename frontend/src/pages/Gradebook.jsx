import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Search, Sparkles, TrendingUp, TrendingDown, AlertCircle, BookOpen, Download, User, CheckCircle2, GraduationCap, X, Award, BrainCircuit, Activity } from 'lucide-react';
import { apiFetch } from '../lib/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const fetchAIPlan = async (studentName, avgScore, attendance, marks) => {
  try {
    const prompt = `Analyze this student for the teacher's gradebook dashboard.
Student Name: ${studentName}
Average Score: ${avgScore}%
Attendance: ${attendance}%
Recent Marks: ${marks.map(m => m.subject + ': ' + m.score).join(', ')}

Please provide a structured response in exactly this JSON format:
{
  "summary": "2-3 sentences concise summary",
  "alerts": ["alert 1"] (if none, empty array. Low attendance/dropping grades),
  "strengths": ["strength 1", "strength 2"],
  "studyPlan": {
    "focusAreas": ["topic 1", "topic 2"],
    "timeline": "e.g., 7 Days",
    "dailyTasks": ["task 1", "task 2", "task 3"]
  }
}`;
    const res = await apiFetch('/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    const jsonMatch = data.response.match(/{.*}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (e) {
    console.error("AI Error:", e);
    return null;
  }
};

const getStatusConf = (score) => {
  if (score >= 85) return { color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-200/50', tag: 'Excellent', icon: <TrendingUp size={12}/> };
  if (score >= 60) return { color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-200/50', tag: 'Average', icon: <CheckCircle2 size={12}/> };
  return { color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-200/50', tag: 'Needs Attention', icon: <TrendingDown size={12}/> };
};

// --- Beautiful & Minimalist Report Card Modal ---
const ReportCardModal = ({ student, aiData, onClose }) => {
  const contentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student.name}_Report_Card.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
    setDownloading(false);
  };

  if (!aiData) return null;
  const conf = getStatusConf(student.avgScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Printable Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto bg-white p-8 sm:p-12 hide-scrollbar">
          
          <div className="flex items-start justify-between border-b border-slate-100 pb-8 mb-8">
             <div>
               <h2 className="text-3xl font-serif text-slate-900 mb-1">{student.name}</h2>
               <div className="flex items-center gap-2 text-sm text-slate-500">
                 <span>ID: {student.rollNumber || student.registrationId}</span>
                 <span>•</span>
                 <span>AI Assessment Report</span>
               </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Overall</p>
                <div className="flex items-baseline gap-2">
                   <p className={`text-4xl font-light tracking-tight ${conf.color}`}>{student.avgScore}%</p>
                   <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold ${conf.bg} ${conf.color}`}>
                     {conf.tag}
                   </span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="flex flex-col gap-8">
                <section>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                     <BrainCircuit size={14} className="text-slate-400"/> Executive Summary
                   </h4>
                   <p className="text-slate-600 text-[13px] leading-relaxed">
                     {aiData.summary}
                   </p>
                </section>

                <section>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                     <Award size={14} className="text-slate-400"/> Strengths
                   </h4>
                   <ul className="space-y-2">
                     {(aiData.strengths || []).map((s, i) => (
                       <li key={i} className="text-[13px] text-slate-600 flex items-start gap-2 leading-relaxed">
                         <span className="text-slate-300 mt-0.5">•</span>
                         <span>{s}</span>
                       </li>
                     ))}
                   </ul>
                </section>

                {aiData.alerts && aiData.alerts.length > 0 && (
                  <section>
                     <h4 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-4 flex items-center gap-2">
                       <AlertCircle size={14} /> Attention Required
                     </h4>
                     <ul className="space-y-2">
                       {aiData.alerts.map((alert, i) => (
                         <li key={i} className="text-[13px] text-rose-700 flex items-start gap-2 leading-relaxed">
                           <span className="text-rose-300 mt-0.5">•</span>
                           <span>{alert}</span>
                         </li>
                       ))}
                     </ul>
                  </section>
                )}
             </div>

             <div className="flex flex-col gap-6">
                {aiData.studyPlan && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100/50">
                     <div className="flex items-center justify-between mb-6 border-b border-slate-200/50 pb-4">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900">Action Plan</h4>
                       <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                         {aiData.studyPlan.timeline}
                       </span>
                     </div>
                     
                     <div className="mb-6">
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-3">Focus Areas</p>
                       <div className="flex flex-wrap gap-2">
                         {aiData.studyPlan.focusAreas.map((f, i) => (
                           <span key={i} className="text-xs font-medium bg-white text-slate-600 px-3 py-1 rounded shadow-sm border border-slate-100">
                             {f}
                           </span>
                         ))}
                       </div>
                     </div>

                     <div>
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-3">Tasks</p>
                       <ul className="space-y-2">
                         {aiData.studyPlan.dailyTasks.map((t, i) => (
                           <li key={i} className="text-[13px] text-slate-700 flex items-start gap-2">
                             <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                             <span className="leading-snug">{t}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Footer Actions (Not printed) */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 flex justify-end gap-3 px-6">
           <button onClick={onClose} disabled={downloading} className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Close</button>
           <button onClick={handleDownload} disabled={downloading} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">
             {downloading ? "Generating PDF..." : <><Download size={14} /> Download PDF</>}
           </button>
        </div>
        
        <button onClick={onClose} disabled={downloading} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 mix-blend-multiply">
           <X size={18} />
        </button>
      </div>
    </div>
  );
};


const Gradebook = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [aiData, setAiData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await apiFetch('/students');
        const data = await res.json();
        if (Array.isArray(data)) {
          const enriched = data.map(s => {
            const marks = s.marks || [];
            const avg = marks.length ? marks.reduce((a, b) => a + Number(b.score||0), 0) / marks.length : 0;
            return { ...s, avgScore: Math.round(avg) };
          });
          setStudents(enriched);
          if (enriched.length > 0) setSelectedStudent(enriched[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    let filtered = students.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
    );

    if (filterMode === 'Top') filtered = filtered.filter(s => s.avgScore >= 85);
    if (filterMode === 'Risk') filtered = filtered.filter(s => s.avgScore < 60 && s.avgScore > 0);
    
    return filtered;
  }, [students, search, filterMode]);

  const generateAI = async () => {
    if (!selectedStudent) return;
    setLoadingAi(true);
    const data = await fetchAIPlan(selectedStudent.name, selectedStudent.avgScore, selectedStudent.attendance, selectedStudent.marks || []);
    if (data) {
      setAiData(data);
      setShowReportCard(true);
    }
    setLoadingAi(false);
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="h-[calc(100vh-80px)] flex gap-8 max-w-[1400px] mx-auto px-4 pb-6">
      
      {/* 🟦 LEFT SIDEBAR: Minimalist List */}
      <div className="w-[280px] flex flex-col gap-6 shrink-0 h-full border-r border-slate-100 pr-6">
        <div>
          <h2 className="text-xl font-serif text-slate-900 mb-4">Roster</h2>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex gap-2">
             {['All', 'Top', 'Risk'].map(mode => (
               <button 
                 key={mode} 
                 onClick={() => setFilterMode(mode)}
                 className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${filterMode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
               >
                 {mode}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1">
          {filteredStudents.length === 0 ? (
             <div className="text-center text-xs text-slate-400 py-6">No students found.</div>
          ) : (
            filteredStudents.map(student => {
              const conf = getStatusConf(student.avgScore);
              const isSelected = selectedStudent?._id === student._id;
              return (
                <button
                  key={student._id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{student.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{student.rollNumber || student.registrationId}</p>
                  </div>
                  {student.avgScore > 0 && (
                    <div className={`shrink-0 text-[11px] font-bold ${conf.color}`}>
                      {student.avgScore}%
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 🟨 MAIN AREA: Clean Canvas with Nice Grid */}
      <div className="flex-1 h-full overflow-y-auto hide-scrollbar flex flex-col relative bg-white/50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0 opacity-80"></div>
        
        {!selectedStudent ? (
           <div className="flex-1 flex items-center justify-center text-slate-400 text-sm relative z-10">
              Select a student to view their dashboard
           </div>
        ) : (() => {
          const conf = getStatusConf(selectedStudent.avgScore);
          return (
            <div className="animate-in fade-in duration-500 flex flex-col max-w-4xl pt-6 pb-8 px-4 h-full relative z-10 w-full mx-auto">
              
              {/* Ultra Minimal Header */}
              <div className="flex items-end justify-between pb-8 mb-8 border-b border-slate-100">
                <div>
                  <h1 className="text-4xl font-serif text-slate-900 mb-2">{selectedStudent.name}</h1>
                  <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-widest font-bold">
                    <span>{selectedStudent.rollNumber || selectedStudent.registrationId}</span>
                    <span>•</span>
                    <span className={conf.color}>{conf.tag}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-5xl font-light tracking-tight ${conf.color}`}>{selectedStudent.avgScore}<span className="text-2xl text-slate-300">%</span></p>
                </div>
              </div>

              {/* Data Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
                
                {/* Academic Metrics */}
                <div className="flex flex-col gap-8">
                   <section>
                      <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">Subject Mastery</h3>
                      <div className="space-y-4">
                        {!(selectedStudent.marks || []).length && (
                          <p className="text-xs text-slate-400">No marks recorded.</p>
                        )}
                        {(selectedStudent.marks || []).map((m, i) => (
                           <div key={i}>
                             <div className="flex justify-between items-end mb-1.5">
                               <span className="text-xs font-medium text-slate-600">{m.subject}</span>
                               <span className="text-xs font-bold text-slate-900">{m.score}%</span>
                             </div>
                             <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-slate-800 rounded-full" style={{ width: `${m.score}%` }}></div>
                             </div>
                           </div>
                        ))}
                      </div>
                   </section>

                   <section>
                      <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">Stats</h3>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Attendance</p>
                          <p className={`text-xl font-light ${selectedStudent.attendance < 75 ? 'text-rose-500' : 'text-slate-900'}`}>
                            {selectedStudent.attendance || 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Submissions</p>
                          <p className="text-xl font-light text-slate-900">100%</p>
                        </div>
                      </div>
                   </section>
                </div>

                {/* AI Gateway */}
                <div className="flex flex-col">
                   <div className="relative rounded-2xl p-8 border border-indigo-100/50 text-center flex flex-col items-center justify-center h-full min-h-[250px] overflow-hidden group shadow-sm bg-gradient-to-br from-indigo-50/50 via-white to-fuchsia-50/50">
                      
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-300/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 transition-transform group-hover:scale-150 duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-300/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 transition-transform group-hover:scale-150 duration-700"></div>
                      
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 relative z-10 border border-indigo-50">
                        <Sparkles size={20} className="text-indigo-500" />
                      </div>
                      <h3 className="text-[13px] font-bold text-indigo-950 tracking-widest uppercase mb-2 relative z-10">AI Assessment</h3>
                      <p className="text-xs text-indigo-900/60 font-medium leading-relaxed mb-6 max-w-[220px] relative z-10">
                        Process historical data to instantly generate a targeted SMART Action Plan and beautiful Report Card.
                      </p>
                      <button 
                        onClick={generateAI}
                        disabled={loadingAi}
                        className="relative z-10 px-6 py-3 w-full max-w-[200px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loadingAi ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                        {loadingAi ? 'Synthesizing...' : 'Generate Report'}
                      </button>
                   </div>
                </div>

              </div>
            </div>
          );
        })()}
      </div>

      {showReportCard && selectedStudent && (
        <ReportCardModal 
          student={selectedStudent} 
          aiData={aiData} 
          onClose={() => setShowReportCard(false)} 
        />
      )}

    </div>
  );
};
export default Gradebook;
