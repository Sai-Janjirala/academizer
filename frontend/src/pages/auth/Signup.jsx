import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, KeyRound, Loader2, Lock, Mail, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const redirectForRole = (role) => {
  if (role === 'teacher') return '/faculty';
  if (role === 'student') return '/student';
  if (role === 'admin') return '/admin';
  return '/';
};

const roles = [
  { id: 'student', label: 'Student', desc: 'Report card, attendance, assignments', icon: BookOpen, color: 'from-emerald-400 to-teal-500' },
  { id: 'teacher', label: 'Teacher', desc: 'Classes, grades, sessions', icon: GraduationCap, color: 'from-violet-500 to-indigo-500' },
  { id: 'admin', label: 'Admin', desc: 'Institution oversight', icon: Shield, color: 'from-amber-400 to-orange-500' }
];

const Signup = () => {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={redirectForRole(user.role)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const body = { role, email, password, name, department, registrationId, adminSecret };
      const u = await register(body);
      navigate(redirectForRole(u.role), { replace: true });
    } catch (e2) {
      setErr(e2.message || 'Could not register');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-auth-gradient relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl animate-float-slower" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl animate-float-slow" />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-violet-900 font-serif font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          Academizer
        </Link>
        <Link to="/login" className="text-sm font-semibold text-fuchsia-700 hover:text-violet-700">
          Login
        </Link>
      </header>

      <div className="relative z-10 max-w-xl mx-auto px-4 pb-16">
        <div className="rounded-3xl border-2 border-white/80 bg-white/90 backdrop-blur-xl shadow-2xl p-8 md:p-10 animate-fade-up">
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
          <p className="text-slate-600 text-sm mb-6">Pick a role. Students must already exist in Class Data (roll number).</p>

          <div className="grid grid-cols-3 gap-2 mb-8">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`rounded-2xl p-3 text-left border-2 transition-all ${
                  role === r.id
                    ? 'border-violet-400 bg-violet-50 shadow-md scale-[1.02]'
                    : 'border-slate-100 bg-white/70 hover:border-violet-200'
                }`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} text-white mb-2`}>
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-slate-900">{r.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5 hidden sm:block">{r.desc}</div>
              </button>
            ))}
          </div>

          {err && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{err}</div>}

          <form onSubmit={onSubmit} className="space-y-4">
            {(role === 'teacher' || role === 'admin') && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border-2 border-violet-100 bg-white pl-10 pr-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="Jordan Lee"
                  />
                </div>
              </div>
            )}

            {role === 'teacher' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Department</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-2xl border-2 border-violet-100 bg-white px-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
                  placeholder="e.g. Science"
                />
              </div>
            )}

            {role === 'student' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Roll / registration ID</label>
                <input
                  required
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  className="w-full rounded-2xl border-2 border-violet-100 bg-white px-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 font-mono"
                  placeholder="Same ID your teacher saved"
                />
                <p className="text-[11px] text-slate-500 mt-1">Your teacher must add you in Class Data before you can claim this account.</p>
              </div>
            )}

            {role === 'admin' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Institution signup key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                  <input
                    required
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full rounded-2xl border-2 border-violet-100 bg-white pl-10 pr-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
                    placeholder="From your IT / principal"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Dev default matches backend env `ADMIN_SIGNUP_SECRET` (see README).</p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border-2 border-violet-100 bg-white pl-10 pr-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
                  placeholder="you@school.edu"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-violet-100 bg-white pl-10 pr-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100"
                  placeholder="8+ characters recommended"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold py-3.5 shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-violet-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
