import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AiInsightPanel({ data }) {
    // Simple risk heuristic
    let riskLevel = 'Low';
    let riskColor = 'text-emerald-600';
    let riskBg = 'bg-emerald-50 border-emerald-200';
    let RiskIcon = ShieldCheck;

    if (data.temperature > 55 || data.soh < 70 || data.anomalyScore > 0.8) {
        riskLevel = 'Critical';
        riskColor = 'text-red-600';
        riskBg = 'bg-red-50 border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
        RiskIcon = ShieldAlert;
    } else if (data.temperature > 45 || data.soh < 85 || data.anomalyScore > 0.4) {
        riskLevel = 'Medium';
        riskColor = 'text-amber-600';
        riskBg = 'bg-amber-50 border-amber-200';
        RiskIcon = Shield;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card p-6 h-full flex flex-col bg-white/70"
        >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 border border-indigo-200">
                    <BrainCircuit className="animate-pulse" size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-wide">AI Engine Insights</h2>
            </div>

            <div className="space-y-6 flex-1">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">System Efficiency</p>
                    <p className="text-2xl font-bold text-sky-600">{data.efficiency.toFixed(1)}%</p>
                </div>

                <div className={cn("rounded-xl p-4 border flex items-center gap-4 transition-colors duration-500", riskBg)}>
                    <RiskIcon className={riskColor} size={32} />
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Real-time Risk Assessment</p>
                        <p className={cn("text-xl font-black tracking-wide", riskColor)}>
                            {riskLevel.toUpperCase()} RISK
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
