import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useBatteryData, getPrediction } from '../hooks/useBatteryData';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AdaptiveBmsSection } from '../components/dashboard/AdaptiveBmsSection';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { ChartsSection } from '../components/dashboard/ChartsSection';
import { AiInsightPanel } from '../components/dashboard/AiInsightPanel';
import { CellMonitoringPanel } from '../components/dashboard/CellMonitoringPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Zap, Activity, BrainCircuit, LayoutGrid, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '../lib/utils';
import { BrandLogo } from '../components/BrandLogo';

const buildPredictionCurve = (prediction) => {
    if (!prediction) return [];

    const rawHealth = Number(prediction.health_score);
    const rawDays = Number(prediction.remaining_days);

    const startHealth = Number.isFinite(rawHealth) ? Math.max(0, Math.min(100, rawHealth)) : 80;
    const totalDays = Number.isFinite(rawDays) ? Math.max(1, Math.round(rawDays)) : 1;
    const endOfLifeHealth = 70;
    const points = 10;

    return Array.from({ length: points + 1 }, (_, index) => {
        const progress = index / points;
        const remainingDays = Math.max(0, Math.round(totalDays * (1 - progress)));
        const predictedHealth = startHealth - (startHealth - endOfLifeHealth) * Math.pow(progress, 1.2);

        return {
            remainingDays,
            healthScore: Number(predictedHealth.toFixed(2)),
        };
    });
};

export default function UserDashboard() {
    const { data, isLive } = useBatteryData();
    const latestData = data[data.length - 1];

    const [activeTab, setActiveTab] = useState('overview');
    const [prediction, setPrediction] = useState(null);
    const [loadingPrediction, setLoadingPrediction] = useState(false);
    const contentScrollRef = useRef(null);
    const aiScrollTopRef = useRef(0);

    const isOverheating = latestData?.temperature > 55;

    const predictionCurve = useMemo(() => buildPredictionCurve(prediction), [prediction]);

    useEffect(() => {
        if (activeTab !== 'ai') return;

        const fetchPrediction = async () => {
            if (!latestData) return;

            try {
                // Show loader only for first fetch. Keep old values visible on background refreshes.
                if (!prediction) {
                    setLoadingPrediction(true);
                }

                const result = await getPrediction({
                    voltage: latestData.voltage,
                    current: latestData.current,
                    temperature: latestData.temperature,
                    efficiency: latestData.efficiency,
                    soc: latestData.soc,
                    soh: latestData.soh,
                });

                setPrediction(result);
            } catch (error) {
                console.error('Prediction error:', error);
            } finally {
                setLoadingPrediction(false);
            }
        };

        fetchPrediction();

        const interval = setInterval(fetchPrediction, 12000);
        return () => clearInterval(interval);
    }, [activeTab, latestData]);

    const handleMainScroll = () => {
        if (activeTab !== 'ai' || !contentScrollRef.current) return;
        aiScrollTopRef.current = contentScrollRef.current.scrollTop;
    };

    useLayoutEffect(() => {
        if (activeTab !== 'ai' || !contentScrollRef.current) return;
        contentScrollRef.current.scrollTop = aiScrollTopRef.current;
    }, [activeTab, prediction, loadingPrediction]);

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'cells', label: 'Cell Monitoring', icon: LayoutGrid },
        { id: 'voltage', label: 'Voltage & Efficiency', icon: Zap },
        { id: 'current', label: 'Temperature & Health', icon: Activity },
        { id: 'ai', label: 'AI Engine', icon: BrainCircuit },
        { id: 'adaptive', label: 'Adaptive BMS', icon: ShieldAlert },
    ];

    return (
        <div className="flex h-screen w-full bg-[#f5f6fa] overflow-hidden font-sans text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
                <div className="h-[90px] flex items-center px-4 bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50/80">
                    <BrandLogo
                        size={46}
                        className="w-full"
                        textClassName="text-[1.85rem] leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]"
                    />
                </div>

                <div className="flex-1 py-6 px-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-3 w-full px-4 py-3 transition-all font-medium',
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white rounded-xl'
                                    : 'text-slate-500 hover:bg-slate-100 rounded-xl'
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-b from-sky-50/35 via-[#f5f6fa] to-[#f5f6fa]">
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-56">
                    <div className="absolute -top-16 left-24 h-56 w-56 rounded-full bg-blue-200/25 blur-3xl"></div>
                    <div className="absolute -top-20 right-28 h-56 w-56 rounded-full bg-emerald-200/25 blur-3xl"></div>
                    <div className="absolute top-4 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl"></div>
                </div>
                <DashboardHeader />

                <div
                    ref={contentScrollRef}
                    onScroll={handleMainScroll}
                    className="flex-1 overflow-y-auto p-8 space-y-6 relative z-10"
                >
                    <AnimatePresence mode="wait">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <MetricsGrid data={latestData} />
                                <div className="mt-6">
                                    <ChartsSection data={data} filterKeys={['voltage', 'current']} />
                                </div>
                            </motion.div>
                        )}

                        {/* VOLTAGE TAB */}
                        {activeTab === 'voltage' && (
                            <motion.div key="voltage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                                        Voltage & Efficiency
                                    </h2>
                                    <p className="text-slate-500 text-base mt-2 max-w-3xl">
                                        Realtime telemetry for pack voltage behavior and conversion efficiency trends.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ChartsSection data={data} filterKeys={['voltage', 'efficiency']} />
                                </div>
                            </motion.div>
                        )}

                        {/* CURRENT TAB */}
                        {activeTab === 'current' && (
                            <motion.div key="current" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                                        Temperature & Health
                                    </h2>
                                    <p className="text-slate-500 text-base mt-2 max-w-3xl">
                                        Thermal stress and state-of-health tracking for battery degradation monitoring.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ChartsSection data={data} filterKeys={['temperature', 'soh']} />
                                </div>
                            </motion.div>
                        )}

                        {/* AI TAB */}
                        {activeTab === 'ai' && (
                            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <AiInsightPanel data={latestData} />

                                <div className="mt-6 p-6 bg-white rounded-2xl shadow-md border">
                                    <h2 className="text-lg font-bold mb-4">AI Prediction Results</h2>

                                    {loadingPrediction && !prediction && (
                                        <p className="text-blue-600 font-medium">Predicting battery health...</p>
                                    )}

                                    {prediction && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                <p className="font-semibold text-blue-700">
                                                    Health Score: {prediction.health_score}%
                                                </p>
                                            </div>

                                            <div
                                                className={`p-4 rounded-xl border ${
                                                    prediction.remaining_days < 30
                                                        ? 'bg-red-50 border-red-200'
                                                        : 'bg-green-50 border-green-200'
                                                }`}
                                            >
                                                <p
                                                    className={`font-semibold ${
                                                        prediction.remaining_days < 30
                                                            ? 'text-red-600'
                                                            : 'text-green-600'
                                                    }`}
                                                >
                                                    Remaining Useful Days: {prediction.remaining_days}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                                    Remaining Life Graph (Future Prediction Curve)
                                                </h3>
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={predictionCurve} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                            <XAxis
                                                                dataKey="remainingDays"
                                                                tickFormatter={(value) => `${value}d`}
                                                                label={{
                                                                    value: 'Remaining Useful Days',
                                                                    position: 'insideBottom',
                                                                    offset: -10,
                                                                }}
                                                            />
                                                            <YAxis
                                                                domain={[60, 100]}
                                                                tickFormatter={(value) => `${value}%`}
                                                                label={{
                                                                    value: 'Health Score %',
                                                                    angle: -90,
                                                                    position: 'insideLeft',
                                                                }}
                                                            />
                                                            <Tooltip
                                                                formatter={(value) => [`${value}%`, 'Health Score']}
                                                                labelFormatter={(label) => `Remaining: ${label} days`}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="healthScore"
                                                                stroke="#f97316"
                                                                strokeWidth={3}
                                                                dot={{ r: 3, fill: '#f97316' }}
                                                                activeDot={{ r: 6 }}
                                                                isAnimationActive
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ADAPTIVE TAB */}
                        {activeTab === 'adaptive' && (
                            <motion.div key="adaptive" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <AdaptiveBmsSection
                                    temperature={latestData?.temperature}
                                    isOverheating={isOverheating}
                                />
                            </motion.div>
                        )}

                        {/* CELLS TAB */}
                        {activeTab === 'cells' && (
                            <motion.div key="cells" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <CellMonitoringPanel
                                    baseVoltage={latestData?.voltage}
                                    baseCurrent={latestData?.current}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
