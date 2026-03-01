import React from 'react';
import { AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdaptiveBmsSection({ temperature, isOverheating }) {
    return (
        <div
            className={cn(
                "glass-card p-5 border",
                isOverheating ? "border-red-300 bg-red-50/50" : "border-emerald-200 bg-emerald-50/40"
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Adaptive BMS</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Live thermal protection and adaptive control state.
                    </p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border",
                    isOverheating
                        ? "text-red-700 bg-red-100 border-red-300"
                        : "text-emerald-700 bg-emerald-100 border-emerald-300"
                )}>
                    <Thermometer size={16} />
                    {Number(temperature).toFixed(1)}degC
                </div>
            </div>

            <div className={cn(
                "mt-4 rounded-xl p-4 flex items-center gap-3 border",
                isOverheating
                    ? "bg-red-100/70 border-red-300 text-red-700"
                    : "bg-emerald-100/70 border-emerald-300 text-emerald-700"
            )}>
                {isOverheating ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                <div className="text-sm font-medium">
                    {isOverheating
                        ? `ENGINE OVERHEAT: Adaptive BMS activated at ${Number(temperature).toFixed(1)}degC.`
                        : `Thermal state normal at ${Number(temperature).toFixed(1)}degC. Adaptive BMS monitoring active.`}
                </div>
            </div>
        </div>
    );
}
