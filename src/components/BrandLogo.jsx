import React from 'react';
import { Zap } from 'lucide-react';

export function BrandLogo({ showName = true, size = 44, className = '', textClassName = '' }) {
    return (
        <div className={`flex items-center gap-3 min-w-0 ${className}`.trim()}>
            <div
                className="rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-500 shadow-[0_10px_24px_-12px_rgba(249,115,22,0.85)] flex items-center justify-center ring-1 ring-white/80"
                style={{ width: size, height: size }}
                aria-label="PulsePilot logo"
            >
                <Zap size={Math.max(14, Math.round(size * 0.52))} className="text-white" strokeWidth={2.7} />
            </div>
            {showName && (
                <span className={`truncate whitespace-nowrap font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 bg-clip-text text-transparent ${textClassName}`.trim()}>
                    PulsePilot
                </span>
            )}
        </div>
    );
}
