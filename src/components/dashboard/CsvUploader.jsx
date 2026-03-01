import React, { useRef, useState } from 'react';
import { UploadCloud, FileType, CheckCircle, Play, Pause } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../../lib/utils';

export function CsvUploader({ onDataParsed, isLive, onToggleLive }) {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState('');

    const processData = (parsedResult) => {
        if (!parsedResult.data || parsedResult.data.length === 0) {
            setError("CSV is empty or invalid format.");
            return;
        }

        // Process and map the data
        const mappedData = parsedResult.data.map((row, index) => {
            // Allow flexible headers (case-insensitive mapping)
            const getVal = (keys) => {
                for (let key of keys) {
                    if (row[key] !== undefined) return parseFloat(row[key]);
                }
                return 0; // default if missing
            };

            const voltage = getVal(['Voltage', 'voltage', 'V']);
            const current = getVal(['Current', 'current', 'A']);
            const temperature = getVal(['Temperature', 'temperature', 'Temp']);
            const soc = getVal(['SOC', 'soc']);
            const soh = getVal(['SOH', 'soh']);

            const inputPower = voltage * current;
            const powerKw = inputPower / 1000;
            const powerLossKw = temperature * 0.05;
            const outputPowerKw = powerKw - powerLossKw;
            const efficiency = powerKw > 0 ? (outputPowerKw / powerKw) * 100 : 0;
            const anomalyScore = Math.random() * (temperature > 55 ? 0.9 : 0.2);

            // Create a fake time sequence based on index since CSV might not have time
            let timeStr = row['Time'] || row['time'];
            if (!timeStr) {
                const d = new Date();
                d.setSeconds(d.getSeconds() + index * 2);
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }

            return {
                time: timeStr,
                voltage: isNaN(voltage) ? 0 : Number(voltage.toFixed(1)),
                current: isNaN(current) ? 0 : Number(current.toFixed(1)),
                temperature: isNaN(temperature) ? 0 : Number(temperature.toFixed(1)),
                inputPower: isNaN(powerKw) ? 0 : Number(powerKw.toFixed(2)),
                outputPower: isNaN(outputPowerKw) ? 0 : Number(outputPowerKw.toFixed(2)),
                efficiency: isNaN(efficiency) ? 0 : Number(efficiency.toFixed(1)),
                soc: isNaN(soc) ? 0 : Number(soc.toFixed(1)),
                soh: isNaN(soh) ? 0 : Number(soh.toFixed(1)),
                anomalyScore: isNaN(anomalyScore) ? 0 : Number(anomalyScore.toFixed(3)),
            };
        }).filter(row => row.voltage > 0 || row.current > 0); // basic filter out empty trailing rows

        if (mappedData.length > 0) {
            setError('');
            onDataParsed(mappedData);
        } else {
            setError("Could not parse numeric data from CSV. Check headers.");
        }
    };

    const handleFileUpload = (file) => {
        if (!file) return;
        setFileName(file.name);
        setError('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: processData,
            error: (err) => setError(`Parse error: ${err.message}`)
        });
    };

    return (
        <div className="glass-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white tracking-wide">Dataset Integration</h2>
                <button
                    onClick={onToggleLive}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                        isLive
                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                    )}
                >
                    {isLive ? <><Play size={12} className="animate-pulse" /> LIVE STREAM</> : <><Pause size={12} /> PAUSED REPLAY</>}
                </button>
            </div>

            <div
                className={cn(
                    "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group",
                    isDragOver ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/30",
                    fileName && !error ? "border-green-500/50 bg-green-500/5" : ""
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        handleFileUpload(file);
                    } else {
                        setError("Please upload a valid CSV file.");
                    }
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                />

                {fileName && !error ? (
                    <div className="flex flex-col items-center text-green-400 animate-fade-in">
                        <CheckCircle className="w-10 h-10 mb-2 opacity-80" />
                        <p className="font-medium text-sm">Dataset Loaded</p>
                        <p className="text-xs text-green-400/70 mt-1 max-w-[200px] truncate">{fileName}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-300">
                        <UploadCloud className="w-10 h-10 mb-3 opacity-50 group-hover:opacity-100 transition-opacity text-cyan-400" />
                        <p className="font-medium text-sm text-slate-200 mb-1">Upload CSV Target</p>
                        <p className="text-xs">Drag & drop or click to browse</p>
                        <div className="flex items-center gap-1 mt-4 text-xs bg-slate-900/50 px-3 py-1.5 rounded-md border border-slate-800">
                            <FileType size={12} className="text-cyan-500" />
                            <span>Requires: Voltage, Current, Temperature, SOC, SOH</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-red-400 text-xs mt-3 text-center animate-shake">{error}</p>
            )}
        </div>
    );
}
