import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, ClipboardCheck, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const cards = [
  { to: '/student/report-card', title: 'Report card', desc: 'Marks and overview from your teachers', icon: BookOpen, gradFrom: 'from-violet-500', gradTo: 'to-indigo-500' },
  { to: '/check-in', title: 'Give attendance', desc: 'Face recognition on class Wi‑Fi', icon: ClipboardCheck, gradFrom: 'from-fuchsia-500', gradTo: 'to-pink-500' },
  { to: '/student/remarks', title: 'Direct remarks', desc: 'Personal notes from teachers', icon: MessageSquare, gradFrom: 'from-emerald-500', gradTo: 'to-teal-500' },
  { to: '/student/assignments', title: 'Assignments', desc: 'What is due next', icon: Sparkles, gradFrom: 'from-amber-500', gradTo: 'to-orange-500' },
  { to: '/student/timetable', title: 'Timetable', desc: 'Updated by your admin & teachers', icon: CalendarDays, gradFrom: 'from-cyan-500', gradTo: 'to-blue-500' }
];

const StudentHome = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-up">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Student dashboard</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900">
          Hi {user?.displayName?.split(' ')[0] || 'there'} — your campus cockpit
        </h1>
        <p className="text-slate-600 mt-2">Jump into anything below. Everything stays pastel-bright on purpose.</p>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group relative overflow-hidden rounded-2xl border-2 border-white bg-white/80 p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradFrom} ${c.gradTo} text-white mb-4 group-hover:scale-110 transition-transform`}>
              <c.icon className="h-6 w-6" />
            </div>
            <h2 className="font-bold text-lg text-slate-900">{c.title}</h2>
            <p className="text-sm text-slate-600 mt-1">{c.desc}</p>
            <ArrowRight className="absolute right-4 bottom-4 h-5 w-5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StudentHome;
