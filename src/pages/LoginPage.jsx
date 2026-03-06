import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { getSession, login, setSession, signup } from '../lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.token || !session?.user) return;
    navigate(session.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = mode === 'signup'
        ? await signup({ email, password, role })
        : await login({ email, password });

      setSession(payload);
      navigate(payload.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-400/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/40 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card w-full max-w-md p-8 relative z-10 bg-white/80 shadow-2xl shadow-indigo-500/10"
      >
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size={64} className="mb-4" />
          <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">System Access</h1>
          <p className="text-slate-500 font-medium text-sm mt-2 text-center">Adaptive AI Battery Intelligence System</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2 rounded-xl border text-sm font-bold ${mode === 'login' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`py-2 rounded-xl border text-sm font-bold ${mode === 'signup' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
              minLength={8}
              required
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-300 shadow-sm ${role === 'user' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'}`}
                  >
                    <User size={18} />
                    <span className="font-bold text-sm">Operator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-300 shadow-sm ${role === 'admin' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'}`}
                  >
                    <Shield size={18} />
                    <span className="font-bold text-sm">Command</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-xl mt-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="relative px-6 py-4 font-black text-white tracking-widest text-sm flex items-center justify-center gap-2 z-10">
              {loading ? 'PROCESSING...' : mode === 'signup' ? 'CREATE ACCOUNT' : 'INITIALIZE UPLINK'}
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
