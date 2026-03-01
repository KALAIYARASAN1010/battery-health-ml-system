import React, { useEffect, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { Zap, Activity, Thermometer, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

// Helper component for counting up numbers smoothly
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }) {
    const nodeRef = useRef();

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        const controls = animate(parseFloat(node.textContent.replace(/[^\d.-]/g, '')) || 0, value, {
            duration: 0.8,
            ease: "easeOut",
            onUpdate(v) {
                node.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
            },
        });

        return () => controls.stop();
    }, [value, prefix, suffix, decimals]);

    return <span ref={nodeRef} className="tabular-nums tracking-tight">{prefix}{value.toFixed(decimals)}{suffix}</span>;
}

function MetricCard({ title, value, unit, icon: Icon, color, delay = 0, isWarning = false, splitUnit = false }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={cn(
                "glass-card p-5 group flex items-center gap-4 rounded-2xl",
                isWarning ? "border border-red-200 bg-red-50/40" : "border border-white/70 bg-white/85"
            )}
        >
            <div
                className="relative w-14 h-14 flex items-center justify-center rounded-full shrink-0"
                style={{ background: `conic-gradient(${color} 0% 75%, #f1f5f9 75% 100%)` }}
            >
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <Icon size={20} style={{ color }} />
                </div>
            </div>

            <div className="flex flex-col leading-tight">
                <h3 className="text-slate-500 font-semibold text-sm md:text-[1.05rem] mb-2">{title}</h3>
                {splitUnit ? (
                    <div className={cn("font-extrabold tracking-tight", isWarning ? "text-red-600" : "text-slate-800")}>
                        <div className="text-4xl md:text-5xl flex items-baseline gap-3">
                            <AnimatedNumber value={value} decimals={0} />
                            <span className="text-2xl md:text-3xl">{unit.trim()}</span>
                        </div>
                    </div>
                ) : (
                    <div className={cn("text-3xl md:text-4xl font-bold tracking-tight", isWarning ? "text-red-600" : "text-slate-800")}>
                        <AnimatedNumber value={value} suffix={unit} decimals={0} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export function MetricsGrid({ data }) {
    const metrics = [
        { title: 'Total Voltage', value: data.voltage, unit: 'V', icon: Zap, color: '#3b82f6', splitUnit: true },
        { title: 'Current Draw', value: data.current, unit: 'A', icon: Activity, color: '#10b981', splitUnit: true },
        { title: 'System Temp', value: data.temperature, unit: ' degC', icon: Thermometer, color: data.temperature > 55 ? '#ef4444' : '#f59e0b', isWarning: data.temperature > 55 },
        { title: 'Input Power', value: data.inputPower, unit: 'kW', icon: Cpu, color: '#8b5cf6', splitUnit: true },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {metrics.map((m, i) => (
                <MetricCard key={m.title} {...m} delay={i * 0.05} />
            ))}
        </div>
    );
}
