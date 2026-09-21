import React from 'react';
import { EngineHealthScores } from '../types/engine';
import { Flame, Activity, Droplets, Wrench, BatteryCharging, ShieldCheck, AlertCircle } from 'lucide-react';

interface EngineHealthPanelProps {
  health: EngineHealthScores;
}

export const EngineHealthPanel: React.FC<EngineHealthPanelProps> = ({ health }) => {
  const getScoreColor = (score: number) => {
    if (score >= 82) return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/50' };
    if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/50' };
    return { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/50' };
  };

  const getStatusLabel = (score: number) => {
    if (score >= 85) return 'NOMINAL';
    if (score >= 70) return 'ACCEPTABLE';
    if (score >= 50) return 'DEGRADED';
    return 'CRITICAL / WARN';
  };

  const overallStyle = getScoreColor(health.overall);

  const subsystems = [
    {
      id: 'thermal',
      code: 'THM-01',
      name: 'Thermal Boundary Health',
      desc: 'CHT / EGT thermal boundary margin',
      score: health.thermal,
      icon: Flame,
    },
    {
      id: 'combustion',
      code: 'CMB-02',
      name: 'Combustion Delivery Health',
      desc: 'Fuel injection delivery & ignition symmetry',
      score: health.combustion,
      icon: Activity,
    },
    {
      id: 'lubrication',
      code: 'LUB-03',
      name: 'Lubrication System Health',
      desc: 'Hydrodynamic oil film pressure & temp',
      score: health.lubrication,
      icon: Droplets,
    },
    {
      id: 'mechanical',
      code: 'MEC-04',
      name: 'Mechanical & Vibration Health',
      desc: 'Crankcase vibration & bearing harmonic fatigue',
      score: health.mechanical,
      icon: Wrench,
    },
    {
      id: 'electrical',
      code: 'ELC-05',
      name: 'Avionics Power & FADEC Rail',
      desc: '28V generator & dual-redundant ECU bus',
      score: health.electrical,
      icon: BatteryCharging,
    },
  ];

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col justify-between relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1b2a40] mb-2.5">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            [HEALTH MONITORING] AERO PISTON ENGINE RELIABILITY MATRIX
          </h2>
        </div>
        <span className="text-[10px] font-tech text-amber-600 dark:text-amber-400 font-bold tracking-wider">
          50 Hz HWIL // ROTAX 914-F
        </span>
      </div>

      {/* Main Composite Health Display */}
      <div className="flex items-center justify-between p-3 rounded bg-[#070c17] border border-[#18263a] mb-3">
        <div className="flex items-center space-x-3.5">
          <div
            className={`flex flex-col items-center justify-center w-16 h-16 rounded border ${overallStyle.border} bg-[#040812] shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]`}
          >
            <span className={`text-2xl font-tech font-bold ${overallStyle.text}`}>
              {health.overall}
            </span>
            <span className="text-[9px] font-tech text-slate-500">INDEX %</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold font-rajdhani tracking-wider text-white uppercase">
                COMPOSITE ENGINE HEALTH
              </span>
              <span
                className={`text-[9px] font-tech font-bold px-1.5 py-0.5 rounded border ${overallStyle.border} ${overallStyle.text} bg-[#060e1c]`}
              >
                {getStatusLabel(health.overall)}
              </span>
            </div>
            <p className="text-[11px] font-chakra text-slate-400 mt-0.5 leading-tight">
              Aggregated from real-time digital twin state estimator, CAN bus telemetry residuals & fatigue cycles.
            </p>
          </div>
        </div>

        {health.overall < 70 && (
          <div className="flex items-center space-x-1 px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-tech animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>SUB-HEALTH ADVISORY</span>
          </div>
        )}
      </div>

      {/* 5 Subsystem Breakdown Meters */}
      <div className="space-y-2">
        {subsystems.map((sub) => {
          const style = getScoreColor(sub.score);
          const Icon = sub.icon;

          return (
            <div key={sub.id} className="space-y-1 bg-[#060c18]/60 p-2 rounded border border-[#142236]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-tech text-cyan-400/80 bg-[#091526] px-1 py-0.2 rounded border border-[#1c324f]">
                    {sub.code}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-200 font-rajdhani font-semibold tracking-wide text-xs">{sub.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500 font-chakra hidden sm:inline">{sub.desc}</span>
                  <span className={`font-bold font-tech ${style.text}`}>{sub.score}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-[#0a1220] border border-[#152336] rounded-sm overflow-hidden">
                <div
                  className={`h-full ${style.bg} transition-all duration-300 ease-out`}
                  style={{ width: `${sub.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
