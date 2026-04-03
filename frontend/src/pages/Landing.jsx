import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  Users,
  Wand2
} from 'lucide-react';

const Landing = () => (
  <div className="min-h-screen bg-landing-gradient text-slate-800 overflow-x-hidden">
    {/* Decorative blobs */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-fuchsia-300/40 blur-3xl animate-float-slow" />
      <div className="absolute top-1/3 -right-16 h-96 w-96 rounded-full bg-cyan-300/35 blur-3xl animate-float-slower" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
    </div>

    <header className="relative z-20 border-b border-white/40 bg-white/50 backdrop-blur-md sticky top-0">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600">
            Academizer
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-violet-800 hover:text-fuchsia-700 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-5 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Sign up
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>

    <main className="relative z-10">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 md:pt-16 md:pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-up space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fuchsia-700 shadow-sm border border-fuchsia-100">
            <Sparkles className="h-3.5 w-3.5" />
            Smart campus workflow
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
            Teaching, attendance &amp; insight—{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500">
              in one joyful hub
            </span>
            .
          </h1>
          <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
            Academizer connects <strong>admins</strong>, <strong>teachers</strong>, and <strong>students</strong> with role-based tools: live
            timetables, AI-flavored grade insights, face-verified attendance on class Wi‑Fi, assignments, and report cards—wrapped in a bright,
            animated interface you actually want to use.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3.5 font-semibold shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02]"
            >
              Get started
              <Wand2 className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-violet-200 bg-white/80 px-6 py-3.5 font-semibold text-violet-800 hover:border-violet-400 transition-all"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative animate-fade-up md:pl-4" style={{ animationDelay: '0.15s' }}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 rotate-1 hover:rotate-0 transition-transform duration-500">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
              alt="Students collaborating on campus"
              className="w-full h-[320px] md:h-[420px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent pointer-events-none" />
          </div>
          {/* Floating stickers */}
          <div className="absolute -bottom-4 -left-4 md:left-4 bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-4 max-w-[200px] animate-float-slow">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Attendance</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">Face + class network check ✓</p>
          </div>
          <div className="absolute -top-2 right-2 md:-right-4 bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white rounded-2xl shadow-xl p-3 rotate-6 hover:rotate-3 transition-transform">
            <ClipboardCheck className="h-8 w-8" />
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4">
          Built for every role on campus
        </h2>
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
          Sign up as a student, teacher, or administrator—each dashboard matches the blueprint: the right data, at the right time, with lively
          visuals instead of dull gray tables.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Students',
              icon: BookOpen,
              gradient: 'from-emerald-400 to-teal-500',
              items: ['Report cards from teachers', 'Face check-in for attendance', 'Teacher remarks', 'Assignments & class timetable']
            },
            {
              title: 'Teachers',
              icon: LayoutDashboard,
              gradient: 'from-violet-500 to-indigo-500',
              items: ['Gradebook & class data', 'Attendance sessions & analytics', 'Publish assignments & remarks', 'See admin tasks & feedback']
            },
            {
              title: 'Admins',
              icon: Users,
              gradient: 'from-amber-400 to-orange-500',
              items: ['Assign work to faculty', 'Remarks to teachers', 'Set class timetables', 'Monitor attendance & grades school-wide']
            }
          ].map((card) => (
            <div
              key={card.title}
              className="group rounded-3xl bg-white/85 backdrop-blur border-2 border-white shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-md mb-5 group-hover:scale-110 transition-transform`}
              >
                <card.icon className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">{card.title}</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {card.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-fuchsia-500 font-bold">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature strip with second image */}
      <section className="bg-white/60 border-y border-violet-100/80 py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 rounded-3xl overflow-hidden border-4 border-cyan-100 shadow-lg -rotate-1 hover:rotate-0 transition-transform duration-500">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
              alt="Planning and scheduling"
              className="w-full h-64 object-cover"
            />
          </div>
          <div className="order-1 md:order-2 space-y-5">
            <h2 className="font-serif text-3xl font-bold text-slate-900">Calm operations, colorful UI</h2>
            <p className="text-slate-600 leading-relaxed">
              Timetables flow from admin to class rosters. Teachers push assignments and narrative remarks; students pull them into a single
              friendly hub. We keep the layout <strong>light and playful</strong>—gradients, soft motion, and stickers—not a heavy dark theme.
            </p>
            <ul className="grid gap-3">
              {[
    { icon: CalendarDays, text: 'Centralized schedules per class & teacher view' },
    { icon: ClipboardCheck, text: 'Attendance you can trust with face + LAN session codes' },
    { icon: Sparkles, text: 'Insights and report cards without boring spreadsheets' }
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-slate-700">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lilac text-violet-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/50 bg-white/40 backdrop-blur py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <p className="font-serif font-semibold text-violet-800">Academizer — campus tools, human-centered design.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-fuchsia-600 font-medium transition-colors">
              Login
            </Link>
            <Link to="/signup" className="hover:text-fuchsia-600 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  </div>
);

export default Landing;
