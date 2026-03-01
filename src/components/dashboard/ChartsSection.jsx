import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="backdrop-blur-md bg-white/95 border border-slate-200 p-3 rounded-lg shadow-xl shadow-slate-200/50">
                <p className="text-slate-500 text-xs mb-1 font-medium">{label}</p>
                <p className="text-slate-800 font-bold text-sm">
                    {payload[0].name}: <span style={{ color: payload[0].color }}>{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

function LiveChart({ data, dataKey, title, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="glass-card p-4 h-[250px] flex flex-col bg-white/70"
        >
            <h3 className="text-slate-700 font-bold text-sm mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#64748b"
                            fontSize={10}
                            tickMargin={10}
                            minTickGap={30}
                            tickLine={false}
                            axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => value.toFixed(0)}
                            tickLine={false}
                            axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#color${dataKey})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

export function ChartsSection({ data, filterKeys }) {
    const allCharts = [
        { title: 'Core Temperature (°C)', dataKey: 'temperature', color: '#ef4444' }, // Red
        { title: 'State of Health (SOH %)', dataKey: 'soh', color: '#10b981' },       // Emerald
        { title: 'System Efficiency (%)', dataKey: 'efficiency', color: '#0ea5e9' },  // Sky
        { title: 'Voltage (V)', dataKey: 'voltage', color: '#6366f1' },               // Indigo
        { title: 'AI Anomaly Score', dataKey: 'anomalyScore', color: '#f59e0b' },     // Amber
    ];

    const charts = filterKeys
        ? allCharts.filter(c => filterKeys.includes(c.dataKey))
        : allCharts.slice(0, 4); // Default to first 4 if no filter

    return (
        <React.Fragment>
            {charts.map((chart, i) => (
                <LiveChart
                    key={chart.dataKey}
                    data={data}
                    dataKey={chart.dataKey}
                    title={chart.title}
                    color={chart.color}
                    delay={i * 0.1}
                />
            ))}
        </React.Fragment>
    );
}
