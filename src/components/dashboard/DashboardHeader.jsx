import React from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession, logout } from '../../lib/auth';

export function DashboardHeader() {
    const navigate = useNavigate();
    const session = getSession();
    const email = session?.user?.email || '';
    const initials = email ? email.slice(0, 2).toUpperCase() : 'US';

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            clearSession();
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-100/70 via-sky-100/70 to-emerald-100/70 border-b border-white/60 backdrop-blur-md shadow-[0_8px_20px_-16px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col">
                <p className="text-lg md:text-xl font-bold tracking-tight text-slate-700">
                    Realtime Battery Intelligence
                </p>
            </div>
            <div className="flex items-center gap-4">
                <button className="text-slate-600 hover:text-sky-700 transition relative p-2">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="h-8 w-px bg-slate-300/80 mx-1"></div>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold">
                        {initials}
                        </div>
                    </div>
                <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-500 transition-all p-2 bg-white/90 rounded-full shadow-sm ml-2 border border-white"
                    title="Disconnect"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
}
