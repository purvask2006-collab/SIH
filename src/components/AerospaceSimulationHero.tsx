import React from 'react';
import { TelemetryData, FaultType, OperatingControls as OperatingControlsType, MissionPhase } from '../types/engine';
import { Engine3DView } from './Engine3DView';
import { Gauge, Sliders, AlertTriangle, CheckCircle2, RotateCcw, Flame, Zap, Wind, ShieldAlert } from 'lucide-react';

interface AerospaceSimulationHeroProps {
  telemetry: TelemetryData;
  activeFault: FaultType;
  faultSeverity: number;
  controls: OperatingControlsType;
  onControlsChange: (controls: OperatingControlsType) => void;
  onFaultChange: (fault: FaultType, severity: number) => void;
  onSelectPreset: (preset: 'nominal' | 'injector' | 'cooling' | 'oil' | 'altitude') => void;
  onReset: () => void;
  theme?: 'light' | 'dark';
}

export const AerospaceSimulationHero: React.FC<AerospaceSimulationHeroProps> = ({
  telemetry,
  activeFault,
  faultSeverity,
  controls,
  onControlsChange,
  onFaultChange,
  onSelectPreset,
  onReset,
  theme = 'light',
}) => {
  const safeControls = controls || { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 };

  const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onControlsChange({
      ...safeControls,
      throttle: val,
      engineLoad: Math.min(100, Math.round(val * 1.05)),
    });
  };

  const handleAltitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Standard ISA temperature lapse rate approximation (-1.98 °C per 1000 ft)
    const lapseTemp = Math.round(15 - (val / 1000) * 1.98);
    onControlsChange({
      ...safeControls,
      altitude: val,
      ambientTemp: lapseTemp,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col space-y-3">
      {/* Simulation Stage Header & Instant Preset Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00897b] animate-pulse" />
            <h2 className="text-sm font-bold text-[#1a3a5c] tracking-tight uppercase">
              3D AERO ENGINE DIGITAL TWIN SIMULATION
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
              MAIN CHARACTER // LIVE KINEMATICS
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Interactive Rotational Dynamics • Thermodynamic Cylinder Head Simulation • 20 Hz Real-Time Physics
          </p>
        </div>

        {/* 1-Click Simulation Scenario Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onSelectPreset('nominal')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
              activeFault === 'NORMAL' && (safeControls.altitude ?? 8400) < 18000
                ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Nominal Cruise at 14,000 ft"
          >
            ● Nominal Cruise
          </button>

          <button
            onClick={() => onSelectPreset('altitude')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
              (safeControls.altitude ?? 8400) >= 20000
                ? 'bg-[#1a3a5c] text-white border-[#1a3a5c] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="High-Altitude Loiter at 22,000 ft"
          >
            Loiter (22k ft)
          </button>

          <button
            onClick={() => onSelectPreset('injector')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
              activeFault === 'INJECTOR_DEGRADATION'
                ? 'bg-[#ff8c00] text-white border-[#ff8c00] shadow-xs'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
            title="Simulate partial fuel injector degradation"
          >
            ▲ Injector Test
          </button>

          <button
            onClick={() => onSelectPreset('cooling')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
              activeFault === 'OVERHEATING'
                ? 'bg-[#e53935] text-white border-[#e53935] shadow-xs'
                : 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
            }`}
            title="Simulate cooling radiator bypass failure"
          >
            ! Overheat Test
          </button>

          <button
            onClick={() => onSelectPreset('oil')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
              activeFault === 'LUBRICATION_FAILURE'
                ? 'bg-[#e53935] text-white border-[#e53935] shadow-xs'
                : 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
            }`}
            title="Simulate scavenge oil pump pressure loss"
          >
            ! Oil Drop Test
          </button>

          <button
            onClick={onReset}
            className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"
            title="Reset simulation parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero 3D Digital Twin Viewport (Primary Visual Canvas) */}
      <div className="w-full h-[400px] sm:h-[450px] relative rounded-lg overflow-hidden border border-slate-200">
        <Engine3DView
          telemetry={telemetry}
          activeFault={activeFault}
          theme="light"
        />
      </div>

      {/* Direct Interactive Flight Operating Controls & Fault Injection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Left Sub-Card: Flight Operating Envelope Sliders */}
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1a3a5c]">
            <div className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00897b]" />
              <span>FLIGHT OPERATING CONTROLS</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              PWR: {telemetry.powerHp.toFixed(0)} HP ({((telemetry.powerHp / 115) * 100).toFixed(0)}%)
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Throttle Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600 font-medium">Throttle Position</span>
                <span className="font-mono font-bold text-[#1a3a5c]">{controls.throttle}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={controls.throttle}
                onChange={handleThrottleChange}
                className="w-full accent-[#00897b] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Altitude Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600 font-medium">Flight Altitude</span>
                <span className="font-mono font-bold text-[#1a3a5c]">
                  {(safeControls.altitude ?? 8400).toLocaleString()} FT ({((safeControls.altitude ?? 8400) * 0.3048).toFixed(0)} m)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="26000"
                step="500"
                value={safeControls.altitude ?? 8400}
                onChange={handleAltitudeChange}
                className="w-full accent-[#1a3a5c] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Right Sub-Card: Real-Time Fault Injection Trigger */}
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1a3a5c]">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff8c00]" />
              <span>ACTIVE FAULT INJECTION LAB</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeFault === 'NORMAL'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {activeFault === 'NORMAL' ? 'NOMINAL STATE' : activeFault}
            </span>
          </div>

          {/* Fault Buttons Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => onFaultChange('NORMAL', 0)}
              className={`p-1.5 rounded-md font-semibold text-[11px] border transition-all ${
                activeFault === 'NORMAL'
                  ? 'bg-[#00897b] text-white border-[#00897b] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ● Normal Ops
            </button>

            <button
              onClick={() => onFaultChange('INJECTOR_DEGRADATION', 0.85)}
              className={`p-1.5 rounded-md font-semibold text-[11px] border transition-all ${
                activeFault === 'INJECTOR_DEGRADATION'
                  ? 'bg-[#ff8c00] text-white border-[#ff8c00] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ▲ Injector Clog
            </button>

            <button
              onClick={() => onFaultChange('OVERHEATING', 0.88)}
              className={`p-1.5 rounded-md font-semibold text-[11px] border transition-all ${
                activeFault === 'OVERHEATING'
                  ? 'bg-[#e53935] text-white border-[#e53935] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ! Cooling Failure
            </button>

            <button
              onClick={() => onFaultChange('LUBRICATION_FAILURE', 0.9)}
              className={`p-1.5 rounded-md font-semibold text-[11px] border transition-all ${
                activeFault === 'LUBRICATION_FAILURE'
                  ? 'bg-[#e53935] text-white border-[#e53935] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ! Oil Line Drop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
