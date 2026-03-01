import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export default function LoginPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState('user'); // 'user' or 'admin'

    const handleLogin = (e) => {
        e.preventDefault();
        if (role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative overflow-hidden">
            {/* Bright Animated Light Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-400/30 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/40 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-card w-full max-w-md p-8 relative z-10 bg-white/80 shadow-2xl shadow-indigo-500/10"
            >
                <div className="flex flex-col items-center mb-8">
                    <BrandLogo size={64} className="mb-4" />
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">System Access</h1>
                    <p className="text-slate-500 font-medium text-sm mt-2 text-center decoration-slate-300">Adaptive AI Battery Intelligence System</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Email Array</label>
                            <input
                                type="email"
                                defaultValue="operative@tesla.ai"
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Access Token</label>
                            <input
                                type="password"
                                defaultValue="••••••••"
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Authorization Protocol</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-300 shadow-sm ${role === 'user'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <User size={18} />
                                <span className="font-bold text-sm">Operator</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-300 shadow-sm ${role === 'admin'
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                <Shield size={18} />
                                <span className="font-bold text-sm">Command</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full relative group overflow-hidden rounded-xl mt-4 shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500 group-hover:scale-105 transition-transform duration-500"></div>
                        <div className="relative px-6 py-4 font-black text-white tracking-widest text-sm flex items-center justify-center gap-2 z-10">
                            INITIALIZE UPLINK
                        </div>
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
