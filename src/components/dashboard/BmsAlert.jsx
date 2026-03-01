import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export function BmsAlert({ temperature }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="animate-shake"
            >
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <div className="bg-red-500/20 p-2 rounded-full animate-pulse text-red-400">
                        <AlertTriangle size={24} className="text-glow-red" />
                    </div>
                    <div>
                        <h3 className="text-red-400 font-bold text-lg tracking-wide text-glow-red">
                            ENGINE OVERHEAT - ADAPTIVE BMS ACTIVATED
                        </h3>
                        <p className="text-red-200/70 text-sm mt-1">
                            Core temperature critical ({Number(temperature).toFixed(1)}degC). Protective control engaged to prevent thermal runaway.
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
