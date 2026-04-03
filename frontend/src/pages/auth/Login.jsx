import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const redirectForRole = (role) => {
  if (role === 'teacher') return '/faculty';
  if (role === 'student') return '/student';
  if (role === 'admin') return '/admin';
  return '/';
};

const Login = () => {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={from && from !== '/login' ? from : redirectForRole(user.role)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(from && from !== '/login' ? from : redirectForRole(u.role), { replace: true });
    } catch (e2) {
      setErr(e2.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-auth-gradient flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl animate-float-slower" />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-violet-900 font-serif font-bold text-lg hover:opacity-80 transition-opacity">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          Academizer
        </Link>
        <Link to="/signup" className="text-sm font-semibold text-fuchsia-700 hover:text-violet-700">
          Sign up
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pb-16 relative z-10">
        <div className="w-full max-w-md rounded-3xl border-2 border-white/80 bg-white/90 backdrop-blur-xl shadow-2xl p-8 md:p-10 animate-fade-up">
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600 text-sm mb-8">Sign in with the email you used to register. We will route you to the right dashboard.</p>

          {err && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{err}</div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border-2 border-violet-100 bg-white pl-10 pr-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 transition-all"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-violet-100 bg-white pl-10 pr-4 py-3 text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold py-3.5 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              Continue
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            No account?{' '}
            <Link to="/signup" className="font-bold text-violet-700 hover:text-fuchsia-600">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
