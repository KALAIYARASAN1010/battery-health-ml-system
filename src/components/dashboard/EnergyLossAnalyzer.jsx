import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function EnergyLossAnalyzer({ data }) {
  const metrics = useMemo(() => {
    const recent = data.slice(-12);
    if (!recent.length) {
      return { heatLossKw: 0, efficiencyLoss: 0 };
    }

    const heatLosses = recent.map((point) => {
      const input = Number(point.inputPower ?? 0);
      const output = Number(point.outputPower ?? 0);
      return Math.max(0, input - output);
    });

    const efficiencies = recent.map((point) => Number(point.efficiency ?? 0));
    const heatLossKw = average(heatLosses);
    const efficiencyLoss = Math.max(0, 100 - average(efficiencies));

    return {
      heatLossKw: Number(heatLossKw.toFixed(1)),
      efficiencyLoss: Number(efficiencyLoss.toFixed(1)),
    };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card p-6 bg-white/85 border border-slate-200 rounded-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-slate-900 font-black text-xl">Energy Loss Analyzer</h3>
          <p className="text-slate-500 text-sm mt-1">Realtime wasted energy from heat and inefficiency</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
          <Flame size={18} className="text-rose-600" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Energy Loss</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics.heatLossKw} kW
          </p>
          <p className="text-sm text-slate-600 mt-1">lost as heat</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Efficiency Loss</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics.efficiencyLoss}%
          </p>
          <p className="text-sm text-slate-600 mt-1">system conversion loss</p>
        </div>
      </div>
    </motion.div>
  );
}
