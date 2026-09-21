import React from 'react';
import { OperatingControls as OperatingControlsType } from '../types/engine';
import { Sliders, Gauge, Mountain, Thermometer, Compass, Cpu } from 'lucide-react';

interface OperatingControlsProps {
  controls: OperatingControlsType;
  onChange: (newControls: OperatingControlsType) => void;
  disabled?: boolean;
}

export const OperatingControls: React.FC<OperatingControlsProps> = ({
  controls,
  onChange,
  disabled = false,
}) => {
  const updateField = (field: keyof OperatingControlsType, value: number) => {
    onChange({
      ...controls,
      [field]: value,
    });
  };

  const applyPreset = (preset: {
    throttle: number;
    altitude: number;
    ambientTemp: number;
    engineLoad: number;
  }) => {
    onChange(preset);
  };

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-rajdhani font-bold tracking-widest text-slate-200 uppercase">
            [SYS.CTL-02] FADEC PILOT FLIGHT OPERATING ACTUATORS
          </h2>
        </div>
        <span className="text-[10px] font-tech text-cyan-400/80 uppercase">
          MANUAL OVERRIDE DISPATCH // ENVELOPE GENERATOR
        </span>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5">
        <button
          disabled={disabled}
          onClick={() =>
            applyPreset({ throttle: 20, altitude: 0, ambientTemp: 15, engineLoad: 15 })
          }
          className="px-2.5 py-1 rounded bg-[#070c17] border border-[#18263a] hover:border-cyan-500/60 text-[10px] font-tech text-slate-300 hover:text-white transition-colors uppercase"
        >
          [P-01] GND IDLE (0 FT)
        </button>
        <button
          disabled={disabled}
          onClick={() =>
            applyPreset({ throttle: 88, altitude: 8500, ambientTemp: 12, engineLoad: 85 })
          }
          className="px-2.5 py-1 rounded bg-[#070c17] border border-[#18263a] hover:border-cyan-500/60 text-[10px] font-tech text-slate-300 hover:text-white transition-colors uppercase"
        >
          [P-02] CLIMB (8,500 FT)
        </button>
        <button
          disabled={disabled}
          onClick={() =>
            applyPreset({ throttle: 65, altitude: 14000, ambientTemp: 2, engineLoad: 68 })
          }
          className="px-2.5 py-1 rounded bg-[#070c17] border border-[#18263a] hover:border-cyan-500/60 text-[10px] font-tech text-slate-300 hover:text-white transition-colors uppercase"
        >
          [P-03] NOMINAL CRUISE (14K FT)
        </button>
        <button
          disabled={disabled}
          onClick={() =>
            applyPreset({ throttle: 55, altitude: 18500, ambientTemp: -8, engineLoad: 58 })
          }
          className="px-2.5 py-1 rounded bg-[#070c17] border border-[#18263a] hover:border-cyan-500/60 text-[10px] font-tech text-slate-300 hover:text-white transition-colors uppercase"
        >
          [P-04] HIGH LOITER (18.5K FT)
        </button>
        <button
          disabled={disabled}
          onClick={() =>
            applyPreset({ throttle: 100, altitude: 2500, ambientTemp: 45, engineLoad: 100 })
          }
          className="px-2.5 py-1 rounded bg-[#070c17] border border-amber-900/60 hover:border-amber-500 text-[10px] font-tech text-amber-300 hover:text-white transition-colors uppercase"
        >
          [P-05] HOT & HIGH STRESS
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Throttle Slider */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-tech">
            <span className="flex items-center space-x-1.5 text-slate-300 font-semibold uppercase">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>THROTTLE LEVER ANGLE (TLA)</span>
            </span>
            <span className="text-cyan-400 font-bold font-tech text-sm">
              {controls.throttle}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            disabled={disabled}
            value={controls.throttle}
            onChange={(e) => updateField('throttle', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[9px] font-tech text-slate-400 uppercase">
            <span>0% (GROUND IDLE)</span>
            <span>50%</span>
            <span>100% (WOT RATED)</span>
          </div>
        </div>

        {/* Altitude Slider */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-tech">
            <span className="flex items-center space-x-1.5 text-slate-300 font-semibold uppercase">
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
              <span>ALTITUDE ENVELOPE (AMSL)</span>
            </span>
            <span className="text-emerald-400 font-bold font-tech text-sm">
              {controls.altitude.toLocaleString()} FT
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20000"
            step="250"
            disabled={disabled}
            value={controls.altitude}
            onChange={(e) => updateField('altitude', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[9px] font-tech text-slate-400 uppercase">
            <span>0 FT (MSL)</span>
            <span>10,000 FT</span>
            <span>20,000 FT (SERVICE CEILING)</span>
          </div>
        </div>

        {/* Ambient Temp Slider */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-tech">
            <span className="flex items-center space-x-1.5 text-slate-300 font-semibold uppercase">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>OAT AMBIENT TEMPERATURE</span>
            </span>
            <span
              className={`font-bold font-tech text-sm ${
                controls.ambientTemp > 35
                  ? 'text-rose-400'
                  : controls.ambientTemp < 0
                  ? 'text-sky-300'
                  : 'text-amber-400'
              }`}
            >
              {controls.ambientTemp > 0 ? `+${controls.ambientTemp}` : controls.ambientTemp} °C
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="50"
            step="1"
            disabled={disabled}
            value={controls.ambientTemp}
            onChange={(e) => updateField('ambientTemp', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[9px] font-tech text-slate-400 uppercase">
            <span>-10°C (HIGH ARCTIC)</span>
            <span>+15°C (ISA STD)</span>
            <span>+50°C (DESERT SEVERE)</span>
          </div>
        </div>

        {/* Engine Load Slider */}
        <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-tech">
            <span className="flex items-center space-x-1.5 text-slate-300 font-semibold uppercase">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>PROP CONSTANT SPEED TORQUE</span>
            </span>
            <span className="text-purple-400 font-bold font-tech text-sm">
              {controls.engineLoad}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            disabled={disabled}
            value={controls.engineLoad}
            onChange={(e) => updateField('engineLoad', Number(e.target.value))}
            className="w-full h-1.5 bg-[#040812] border border-[#16253a] rounded appearance-none cursor-pointer accent-purple-400"
          />
          <div className="flex justify-between text-[9px] font-tech text-slate-400 uppercase">
            <span>0% (FEATHER / MIN)</span>
            <span>50%</span>
            <span>100% (HIGH BMEP DRAG)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
