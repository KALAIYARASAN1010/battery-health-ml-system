import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CellMonitoringPanel({ baseVoltage = 387, baseCurrent = 181 }) {
    // 4 prominent cells instead of 96
    const NUM_CELLS = 4;
    const AVG_VOLTAGE = baseVoltage / 96; // Still use 96-cell math for realistic individual cell voltage (~4.03V)

    const [cells, setCells] = useState([]);

    useEffect(() => {
        // Initialize 4 cells with specific realistic states
        const initialCells = [
            { id: 1, name: "Cell 1", voltage: AVG_VOLTAGE + 0.02, current: baseCurrent - 0.5, temp: 32.4, status: 'optimal' },
            { id: 2, name: "Cell 2", voltage: AVG_VOLTAGE + 0.04, current: baseCurrent + 0.2, temp: 33.1, status: 'optimal' },
            { id: 3, name: "Cell 3", voltage: AVG_VOLTAGE - 0.01, current: baseCurrent - 0.1, temp: 31.8, status: 'optimal' },
            { id: 4, name: "Cell 4", voltage: 4.16, current: baseCurrent + 1.2, temp: 38.5, status: 'warning' }, // One warning cell for visual interest
        ];

        setCells(initialCells);

        // Setup interval for live jitter
        const interval = setInterval(() => {
            setCells(prev => prev.map(cell => {
                // Return to mean tendency slightly, but maintain their relative states
                const targetV = cell.id === 4 ? 4.15 : AVG_VOLTAGE;
                const vDiff = targetV - cell.voltage;

                return {
                    ...cell,
                    voltage: cell.voltage + (vDiff * 0.05) + (Math.random() * 0.01 - 0.005),
                    current: baseCurrent + (Math.random() * 0.8 - 0.4),
                    temp: cell.temp + (Math.random() * 0.2 - 0.1),
                };
            }));
        }, 1500);

        return () => clearInterval(interval);
    }, [baseVoltage, baseCurrent, AVG_VOLTAGE]);

    const getStatusTheme = (status) => {
        if (status === 'warning') {
            return {
                bg: "bg-gradient-to-br from-orange-50 to-amber-50/50",
                border: "border-orange-200",
                text: "text-orange-700",
                shadow: "shadow-[inset_0_0_0_1px_rgba(251,146,60,0.1),0_10px_30px_-10px_rgba(251,146,60,0.15)]",
                barColor: "bg-orange-500",
                glow: "shadow-[0_0_15px_rgba(251,146,60,0.5)]"
            };
        }
        return {
            bg: "bg-white",
            border: "border-slate-100",
            text: "text-slate-800",
            shadow: "shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
            barColor: "bg-blue-500",
            glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        };
    };

    const agingPrediction = useMemo(() => {
        if (!cells.length) {
            return { weakCell: null, expectedDays: 0 };
        }

        const scored = cells.map((cell) => {
            const tempRisk = Math.max(0, cell.temp - 30) * 2.4;
            const voltageRisk = Math.max(0, cell.voltage - 4.12) * 180;
            const currentRisk = Math.max(0, Math.abs(cell.current - baseCurrent) - 0.2) * 6;
            const warningBoost = cell.status === 'warning' ? 16 : 0;
            const score = tempRisk + voltageRisk + currentRisk + warningBoost;

            return { ...cell, score };
        });

        const weakCell = scored.reduce((worst, cell) => (cell.score > worst.score ? cell : worst), scored[0]);
        const expectedDays = Math.max(15, Math.round(120 - weakCell.score * 1.8));

        return { weakCell, expectedDays };
    }, [cells, baseCurrent]);

    return (
        <div className="glass-card p-8 h-full flex flex-col">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Core Cell Monitoring</h2>
                    <p className="text-sm text-slate-500 max-w-xl">High-fidelity realtime telemetry for four primary cells. Monitoring voltage, current draw, and thermal state.</p>
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> Optimal
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></span> Elevated
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {cells.map((cell, i) => {
                        const theme = getStatusTheme(cell.status);
                        const progressPct = Math.min(100, Math.max(0, (cell.voltage - 3.0) / (4.2 - 3.0) * 100));

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                                key={cell.id}
                                className={`relative p-8 rounded-2xl border flex flex-col transition-all duration-500 overflow-hidden ${theme.bg} ${theme.border} ${theme.shadow}`}
                            >
                                {/* Background decorative elements */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${theme.barColor}`}></div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Cell 0{cell.id}</div>
                                        <div className={`text-xl font-bold ${theme.text}`}>{cell.name}</div>
                                    </div>
                                    <div
                                        className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                                            cell.status === 'warning'
                                                ? 'text-orange-500 border-orange-200 bg-orange-50/70'
                                                : 'text-blue-500 border-blue-100 bg-blue-50/70'
                                        } ${cell.status === 'warning' ? 'animate-pulse' : ''}`}
                                        aria-label={`${cell.name} status icon`}
                                    >
                                        <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden="true">
                                            <rect x="2.5" y="8" width="24" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
                                            <rect x="26.5" y="12.5" width="3" height="7" rx="1" fill="currentColor" />
                                            <path d="M16.6 10.8 13.7 16h2.3L14.9 21l4.1-6h-2.6l1.2-4.2Z" fill="currentColor" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-100/50">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Voltage</div>
                                        <div className="font-mono font-bold text-3xl text-slate-800 tracking-tight">
                                            {cell.voltage.toFixed(3)}<span className="text-sm text-slate-400 ml-1 font-sans">V</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-100/50">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Current</div>
                                        <div className="font-mono font-bold text-3xl text-slate-800 tracking-tight">
                                            {cell.current.toFixed(1)}<span className="text-sm text-slate-400 ml-1 font-sans">A</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto relative z-10">
                                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                                        <span>Charge Capacity</span>
                                        <span className="font-mono">{progressPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${theme.barColor}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPct}%` }}
                                            transition={{ duration: 1 }}
                                        ></motion.div>
                                    </div>
                                    <div className="flex justify-between mt-4 text-xs font-medium text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Min: 3.0V
                                        </span>
                                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                                            {cell.temp.toFixed(1)}°C Thermal
                                        </span>
                                        <span className="flex items-center gap-1">
                                            Max: 4.2V <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {agingPrediction.weakCell && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-6"
                >
                    <h3 className="text-xl font-black text-slate-900">Cell Aging Prediction</h3>
                    <p className="text-sm text-slate-500 mt-1">Predicted weak cell based on thermal and electrical stress</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Predicted Weak Cell</p>
                            <p className="text-2xl font-black text-slate-900">Cell #{agingPrediction.weakCell.id}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Expected Degradation</p>
                            <p className="text-2xl font-black text-slate-900">{agingPrediction.expectedDays} days</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
