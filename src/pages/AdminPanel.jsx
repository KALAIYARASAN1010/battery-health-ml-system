import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HealthTrendGraph } from '../components/admin/HealthTrendGraph';
import { cn } from '../lib/utils';
import { BrandLogo } from '../components/BrandLogo';
import { clearSession, logout } from '../lib/auth';

// Mock fleet data
const generateFleet = () => {
    return Array.from({ length: 42 }).map((_, i) => {
        const soh = Math.max(50, Math.min(100, 100 - (Math.random() * 40)));
        const efficiency = Math.max(80, Math.min(99, 99 - (Math.random() * 15)));

        let status = 'Healthy';
        if (soh < 70) status = 'Critical';
        else if (soh < 85) status = 'Warning';

        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + (Math.random() * 48 - 12));

        return {
            id: `EV-${1000 + i}`,
            model: ['Model S', 'Model 3', 'Model X', 'Model Y'][Math.floor(Math.random() * 4)],
            soh: parseFloat(soh.toFixed(1)),
            efficiency: parseFloat(efficiency.toFixed(1)),
            status,
            warrantyExpiry: expiry,
            isWarrantyEligible: soh < 70,
            history: Array.from({ length: 12 }).map((_, m) => ({
                month: `M${m + 1}`,
                soh: parseFloat((soh + (11 - m) * (Math.random() * 1.5)).toFixed(1))
            })).reverse()
        };
    });
};

export default function AdminPanel() {
    const navigate = useNavigate();
    const [fleet] = useState(generateFleet());
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(fleet[0]);

    const filteredFleet = useMemo(() => {
        return fleet.filter(v => {
            const matchFilter = filter === 'All' || v.status === filter;
            const matchSearch = v.id.toLowerCase().includes(search.toLowerCase());
            return matchFilter && matchSearch;
        });
    }, [fleet, filter, search]);

    const avgEfficiency = (fleet.reduce((acc, v) => acc + v.efficiency, 0) / fleet.length).toFixed(1);
    const criticalCount = fleet.filter(v => v.status === 'Critical').length;

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            clearSession();
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 text-slate-800 font-sans">
            {/* Dynamic Background for Admin */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col h-[calc(100vh-4rem)]">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <BrandLogo size={48} />
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">Global Fleet Command</h1>
                            <p className="text-slate-500 font-medium text-sm">Battery Efficiency & Warranty Administration</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm shadow-sm font-bold text-slate-600 hover:text-red-500"
                    >
                        Exit Terminal
                    </button>
                </header>

                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Monitored Units</p>
                            <p className="text-4xl font-black text-slate-800 tabular-nums">{fleet.length}</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                            <Shield size={24} />
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Avg Fleet Efficiency</p>
                            <p className="text-4xl font-black text-emerald-600 tabular-nums">{avgEfficiency}%</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Critical Warnings</p>
                            <p className="text-4xl font-black text-red-500 animate-pulse tabular-nums">{criticalCount}</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                    {/* Table Sidebar */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search VIN or ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors w-64 shadow-sm"
                                />
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                                {['All', 'Healthy', 'Warning', 'Critical'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300",
                                            filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-xs text-slate-400 uppercase tracking-wider px-4 font-bold">
                                        <th className="px-4 py-3">Unit ID</th>
                                        <th className="px-4 py-3">Model</th>
                                        <th className="px-4 py-3">SOH %</th>
                                        <th className="px-4 py-3">Efficiency</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredFleet.map((v) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                key={v.id}
                                                onClick={() => setSelectedVehicle(v)}
                                                className={cn(
                                                    "group cursor-pointer transition-all duration-300",
                                                    selectedVehicle?.id === v.id ? "bg-blue-50 shadow-[inset_4px_0_0_rgba(59,130,246,1)]" : "hover:bg-slate-50 bg-white"
                                                )}
                                            >
                                                <td className="px-4 py-3 rounded-l-lg text-slate-800 font-bold">{v.id}</td>
                                                <td className="px-4 py-3 text-slate-500 text-sm font-medium">{v.model}</td>
                                                <td className="px-4 py-3 tabular-nums font-mono text-sm font-bold text-slate-700">{v.soh}</td>
                                                <td className="px-4 py-3 tabular-nums font-mono text-sm font-bold text-slate-700">{v.efficiency}</td>
                                                <td className="px-4 py-3 rounded-r-lg">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-full text-xs font-black border",
                                                        v.status === 'Healthy' && "bg-emerald-50 border-emerald-200 text-emerald-600",
                                                        v.status === 'Warning' && "bg-amber-50 border-amber-200 text-amber-600",
                                                        v.status === 'Critical' && "bg-red-50 border-red-200 text-red-600"
                                                    )}>
                                                        {v.status}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Details Sidebar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto shadow-sm">
                        {selectedVehicle ? (
                            <motion.div
                                key={selectedVehicle.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col h-full space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">{selectedVehicle.id}</h2>
                                    <p className="text-slate-500 font-medium">{selectedVehicle.model}</p>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Shield size={16} className="text-indigo-400" />
                                        Warranty Status
                                    </h3>

                                    <div className="mb-4">
                                        {selectedVehicle.isWarrantyEligible ? (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm">
                                                <CheckCircle size={16} /> Eligible (SOH &lt; 70%)
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-sm shadow-sm">
                                                <Clock size={16} /> Valid (SOH &gt; 70%)
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <Clock size={16} />
                                        Expires: {selectedVehicle.warrantyExpiry.toLocaleDateString()}
                                        {selectedVehicle.warrantyExpiry < new Date() && <span className="text-red-500 ml-2 font-bold">(Expired)</span>}
                                    </div>
                                </div>

                                <div className="flex-1 min-h-[250px] bg-white rounded-2xl border border-slate-100 p-4 pb-0 flex flex-col shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Health Degradation Trend</h3>
                                    <div className="flex-1 w-full min-h-0">
                                        <HealthTrendGraph data={selectedVehicle.history} />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 font-medium text-sm">
                                Select a vehicle to view details.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
