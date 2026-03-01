import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function HealthTrendGraph({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                    dataKey="month"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#475569"
                    fontSize={10}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#3b82f6' }}
                    labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                    type="monotone"
                    dataKey="soh"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#0f172a', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#60a5fa', stroke: '#2563eb' }}
                    isAnimationActive={true}
                    animationDuration={1500}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
