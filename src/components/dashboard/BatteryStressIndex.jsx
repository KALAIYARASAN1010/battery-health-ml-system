import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStress(data) {
  const points = data.slice(-12);
  const latest = points[points.length - 1];

  if (!latest) {
    return {
      score: 0,
      status: 'Low Load',
      contributors: { currentSpikes: 0, temperature: 0, chargeRate: 0 },
    };
  }

  const currentValues = points.map((point) => Math.abs(point.current ?? 0));
  const baselineCurrent = average(currentValues);
  const currentSpikeValue = Math.abs((latest.current ?? 0) - baselineCurrent);
  const currentSpikeNorm = clamp(currentSpikeValue / 120, 0, 1);

  const temperatureNorm = clamp(((latest.temperature ?? 25) - 30) / 35, 0, 1);

  const firstSoc = points[0]?.soc ?? latest.soc ?? 0;
  const lastSoc = latest.soc ?? firstSoc;
  const socDeltaPerPoint = Math.abs(lastSoc - firstSoc) / Math.max(1, points.length - 1);
  const chargeRateNorm = clamp(socDeltaPerPoint / 0.45, 0, 1);

  const score = Math.round(
    (currentSpikeNorm * 0.4 + temperatureNorm * 0.35 + chargeRateNorm * 0.25) * 100
  );

  let status = 'Low Load';
  if (score >= 75) status = 'Critical Load';
  else if (score >= 50) status = 'Moderate Load';
  else if (score >= 30) status = 'Elevated Load';

  return {
    score,
    status,
    contributors: {
      currentSpikes: Math.round(currentSpikeNorm * 100),
      temperature: Math.round(temperatureNorm * 100),
      chargeRate: Math.round(chargeRateNorm * 100),
    },
  };
}

export function BatteryStressIndex({ data }) {
  const result = useMemo(() => calculateStress(data), [data]);

  const statusClass =
    result.score >= 75
      ? 'text-red-600'
      : result.score >= 50
        ? 'text-amber-600'
        : 'text-emerald-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card p-6 bg-white/85 border border-slate-200 rounded-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-slate-900 font-black text-xl">Battery Stress Index</h3>
          <p className="text-slate-500 text-sm mt-1">Real-time battery stress level</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <p className="text-4xl font-black text-slate-900 tabular-nums">{result.score}</p>
        <p className="text-lg font-bold text-slate-500 mb-1">/ 100</p>
      </div>

      <p className={`mt-1 text-sm font-bold ${statusClass}`}>Status: {result.status}</p>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Calculated using</p>
        <ul className="space-y-1 text-sm text-slate-700">
          <li>Current spikes: {result.contributors.currentSpikes}%</li>
          <li>Temperature: {result.contributors.temperature}%</li>
          <li>Charge/discharge rate: {result.contributors.chargeRate}%</li>
        </ul>
      </div>
    </motion.div>
  );
}
