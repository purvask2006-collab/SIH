import React, { useState, useMemo } from 'react';
import { WhatIfScenarioInput, WhatIfPrediction } from '../types/engine';
import { calculateWhatIfPrediction } from '../services/missionService';
import { Sparkles, Calculator, AlertTriangle, ShieldCheck, TrendingDown, Clock, Fuel, Sliders } from 'lucide-react';

interface WhatIfSimulationProps {
  currentHealth: number;
}

export const WhatIfSimulation: React.FC<WhatIfSimulationProps> = ({ currentHealth }) => {
  const [scenario, setScenario] = useState<WhatIfScenarioInput>({
    altitude: 15000,
    ambientTemp: 10,
    throttle: 70,
    durationHours: 4,
  });

  const prediction = useMemo(() => {
    return calculateWhatIfPrediction(scenario, currentHealth);
  }, [scenario, currentHealth]);

  const updateScenario = (key: keyof WhatIfScenarioInput, val: number) => {
    setScenario((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            [MISSION RELIABILITY ENHANCEMENT] "WHAT-IF" SORTIE PLANNER & WEAR EXTRAPOLATOR
          </h2>
        </div>
        <span className="text-[10px] font-chakra text-slate-600 dark:text-slate-400 uppercase font-semibold">
          PROGNOSTIC WEIBULL HAZARD SENSITIVITY
        </span>
      </div>

      {/* Input Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Planned Altitude */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex justify-between text-[10px] font-tech">
            <span className="text-slate-400 uppercase">EN-ROUTE CEILING:</span>
            <span className="text-emerald-400 font-bold">{scenario.altitude.toLocaleString()} FT</span>
          </div>
          <input
            type="range"
            min="0"
            max="20000"
            step="500"
            value={scenario.altitude}
            onChange={(e) => updateScenario('altitude', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* Planned Temp */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex justify-between text-[10px] font-tech">
            <span className="text-slate-400 uppercase">ISA AMBIENT DELTA:</span>
            <span className="text-amber-400 font-bold">
              {scenario.ambientTemp > 0 ? `+${scenario.ambientTemp}` : scenario.ambientTemp}°C
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="50"
            step="1"
            value={scenario.ambientTemp}
            onChange={(e) => updateScenario('ambientTemp', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Planned Throttle */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex justify-between text-[10px] font-tech">
            <span className="text-slate-400 uppercase">CRUISE THROTTLE:</span>
            <span className="text-cyan-400 font-bold">{scenario.throttle}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="1"
            value={scenario.throttle}
            onChange={(e) => updateScenario('throttle', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Mission Duration */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex justify-between text-[10px] font-tech">
            <span className="text-slate-400 uppercase">TARGET STATION TIME:</span>
            <span className="text-purple-400 font-bold">{scenario.durationHours} HRS</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="0.5"
            value={scenario.durationHours}
            onChange={(e) => updateScenario('durationHours', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-purple-400"
          />
        </div>
      </div>

      {/* Output Predictions Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Engine Power */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">EST. POWER OUTPUT</div>
          <div className="text-sm font-tech font-bold text-white mt-0.5">{prediction.powerHp} HP</div>
        </div>

        {/* Total Fuel */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">TOTAL FUEL REQUIRED</div>
          <div className="text-sm font-tech font-bold text-amber-300 mt-0.5">
            {prediction.fuelConsumptionTotalKg} KG
          </div>
        </div>

        {/* Predicted CHT */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">ESTIMATED CHT</div>
          <div
            className={`text-sm font-tech font-bold mt-0.5 ${
              prediction.predictedCht > 185 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {prediction.predictedCht}°C
          </div>
        </div>

        {/* Predicted EGT */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">ESTIMATED EGT</div>
          <div className="text-sm font-tech font-bold text-white mt-0.5">
            {prediction.predictedEgt}°C
          </div>
        </div>

        {/* Predicted Health at Mission End */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">HEALTH @ RECOVERY</div>
          <div
            className={`text-sm font-tech font-bold mt-0.5 ${
              prediction.predictedHealthEnd > 75
                ? 'text-emerald-400'
                : prediction.predictedHealthEnd > 55
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {prediction.predictedHealthEnd}%
          </div>
        </div>

        {/* Estimated Endurance */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">STATION ENDURANCE</div>
          <div className="text-sm font-tech font-bold text-cyan-300 mt-0.5">
            {prediction.estimatedEnduranceHours} HRS
          </div>
        </div>

        {/* Mission Risk */}
        <div className="p-2 rounded bg-[#050a14] border border-[#16253a]">
          <div className="text-[9px] font-tech text-slate-400 uppercase">PROBABLE RISK</div>
          <div
            className={`text-sm font-tech font-bold mt-0.5 ${
              prediction.missionRisk === 'CRITICAL'
                ? 'text-rose-400'
                : prediction.missionRisk === 'MODERATE'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {prediction.missionRisk}
          </div>
        </div>
      </div>

      {/* Operator Advisory Note */}
      <div className="p-2 rounded bg-[#070c17] border border-[#16253a] text-xs font-chakra text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <span className="text-slate-400 font-tech text-[10px] uppercase">OPERATIONAL EVALUATION:</span>
        <span className="text-slate-200">{prediction.notes}</span>
      </div>
    </div>
  );
};
