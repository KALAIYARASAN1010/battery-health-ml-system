import { useState, useEffect, useCallback } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/* ===============================
   🔮 ML BACKEND PREDICTION CALL
================================= */
export async function getPrediction(data) {
  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voltage: data.voltage,
        current: data.current,
        temperature: data.temperature,
        efficiency: data.efficiency,
        soc: data.soc,
        soh: data.soh
      }),
    });

    if (!response.ok) {
      throw new Error("Prediction API failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Prediction Error:", error);
    return null;
  }
}

/* ===============================
   📊 GENERATE MOCK BASE DATA
================================= */
const generateMockData = (points = 30) => {
    const data = [];
    let time = new Date();
    time.setMinutes(time.getMinutes() - points);

    let currentV = 400;
    let currentI = 150;
    let currentT = 35;
    let currentSOC = 85;
    let currentSOH = 98;

    for (let i = 0; i < points; i++) {
        const thermalWave = 44 + Math.sin(i / 4) * 10;
        const thermalSpike = Math.random() < 0.08 ? (4 + Math.random() * 4) : 0;

        currentV = clamp(currentV + (Math.random() - 0.5) * 5, 300, 450);
        currentI = clamp(currentI + (Math.random() - 0.5) * 20, 10, 300);
        currentT = clamp((currentT * 0.55) + (thermalWave * 0.45) + ((Math.random() - 0.5) * 2.2) + thermalSpike, 22, 72);
        currentSOC = clamp(currentSOC - (Math.random() * 0.1), 10, 100);
        // Give SOH a visible but realistic trend for charting.
        const sohWave = Math.sin(i / 6) * 0.06;
        const sohStepDecay = 0.03 + Math.random() * 0.05;
        currentSOH = clamp(currentSOH - sohStepDecay + sohWave, 70, 100);

        const inputPower = currentV * currentI;
        const powerKw = inputPower / 1000;
        const powerLoss = currentT * 0.05;
        const outputPowerKw = powerKw - powerLoss;
        const efficiency = powerKw > 0 ? (outputPowerKw / powerKw) * 100 : 0;
        const anomalyScore = Math.random() * (currentT > 55 ? 0.9 : 0.2);

        data.push({
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            voltage: parseFloat(currentV.toFixed(1)),
            current: parseFloat(currentI.toFixed(1)),
            temperature: parseFloat(currentT.toFixed(1)),
            inputPower: parseFloat(powerKw.toFixed(2)),
            outputPower: parseFloat(outputPowerKw.toFixed(2)),
            efficiency: parseFloat(efficiency.toFixed(1)),
            soc: parseFloat(currentSOC.toFixed(1)),
            soh: parseFloat(currentSOH.toFixed(2)),
            anomalyScore: parseFloat(anomalyScore.toFixed(3)),
        });

        time.setSeconds(time.getSeconds() + 2);
    }

    return data;
};

/* ===============================
   🔋 MAIN HOOK
================================= */
export function useBatteryData() {
    const [data, setData] = useState(generateMockData());
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setData(prev => {
                const last = prev[prev.length - 1];

                const thermalWave = 48 + Math.sin(Date.now() / 6000) * 14;
                const thermalSpike = Math.random() < 0.15 ? (3 + Math.random() * 6) : 0;

                let currentV = clamp(last.voltage + (Math.random() - 0.5) * 5, 300, 450);
                let currentI = clamp(last.current + (Math.random() - 0.5) * 20, 10, 300);
                let currentT = clamp((last.temperature * 0.45) + (thermalWave * 0.55) + ((Math.random() - 0.5) * 3) + thermalSpike, 22, 75);
                let currentSOC = clamp(last.soc - (Math.random() * 0.1), 10, 100);
                // Add visible SOH movement with gradual decay; hotter operation degrades faster.
                const thermalPenalty = Math.max(0, currentT - 45) * 0.006;
                const baseDecay = 0.03 + Math.random() * 0.06;
                const microRecovery = Math.random() < 0.15 ? Math.random() * 0.03 : 0;
                let currentSOH = clamp(last.soh - baseDecay - thermalPenalty + microRecovery, 65, 100);

                const inputPower = currentV * currentI;
                const powerKw = inputPower / 1000;
                const powerLossKw = currentT * 0.05;
                const outputPowerKw = powerKw - powerLossKw;
                const efficiency = powerKw > 0 ? (outputPowerKw / powerKw) * 100 : 0;
                const anomalyScore = Math.random() * (currentT > 55 ? 0.9 : 0.2);

                const newPoint = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    voltage: parseFloat(currentV.toFixed(1)),
                    current: parseFloat(currentI.toFixed(1)),
                    temperature: parseFloat(currentT.toFixed(1)),
                    inputPower: parseFloat(powerKw.toFixed(2)),
                    outputPower: parseFloat(outputPowerKw.toFixed(2)),
                    efficiency: parseFloat(efficiency.toFixed(1)),
                    soc: parseFloat(currentSOC.toFixed(1)),
                    soh: parseFloat(currentSOH.toFixed(2)),
                    anomalyScore: parseFloat(anomalyScore.toFixed(3)),
                };

                return [...prev.slice(1), newPoint];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isLive]);

    const handleCsvData = useCallback((parsedData) => {
        setIsLive(false);
        setData(parsedData);
    }, []);

    return { data, isLive, setIsLive, handleCsvData };
}
