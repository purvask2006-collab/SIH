import React from 'react';
import { EngineHealthScores } from '../types/engine';
import { ShieldCheck, Cpu, Droplets, Flame, Activity } from 'lucide-react';

interface AerospaceHealthPanelProps {
  health: EngineHealthScores;
  anomalyScore: number;
}

export const AerospaceHealthPanel: React.FC<AerospaceHealthPanelProps> = ({
  health,
  anomalyScore,
}) => {
  // Helper to determine bar color transitioning from teal (#00897b) to amber (#ff8c00) to red (#e53935)
  const getBarColor = (score: number) => {
    if (score >= 85) return '#00897b'; // Teal
    if (score >= 65) return '#ff8c00'; // Amber
    return '#e53935'; // Alert Red
  };

  const getStatusLabel = (score: number) => {
    if (score >= 85) return 'NOMINAL';
    if (score >= 65) return 'CAUTION';
    return 'CRITICAL';
  };

  const healthBars = [
    {
      id: 'overall',
      name: 'Engine Health Score',
      score: health.overall,
      icon: <ShieldCheck className="w-4 h-4 text-[#1a3a5c]" />,
    },
    {
      id: 'cooling',
      name: 'Cooling System Health',
      score: health.thermal,
      icon: <Droplets className="w-4 h-4 text-[#00897b]" />,
    },
    {
      id: 'lubrication',
      name: 'Lubrication Health',
      score: health.lubrication,
      icon: <Activity className="w-4 h-4 text-[#0284c7]" />,
    },
    {
      id: 'combustion',
      name: 'Combustion Health',
      score: health.combustion,
      icon: <Flame className="w-4 h-4 text-[#ff8c00]" />,
    },
    {
      id: 'structural',
      name: 'Structural & Rotordynamics',
      score: health.mechanical,
      icon: <Cpu className="w-4 h-4 text-[#6366f1]" />,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-[#1a3a5c] tracking-tight uppercase">
            HEALTH INDEX & SUBSYSTEMS
          </h2>
          <p className="text-[11px] text-slate-500">
            Real-Time State Estimation • Extended Kalman Filter
          </p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            health.overall >= 85
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : health.overall >= 65
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          {getStatusLabel(health.overall)}
        </span>
      </div>

      {/* Vertical Health Index Bar Chart with Horizontal Progress Bars */}
      <div className="space-y-3.5">
        {healthBars.map((bar) => {
          const color = getBarColor(bar.score);
          const isOverall = bar.id === 'overall';

          return (
            <div key={bar.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded bg-slate-50 border border-slate-100">
                    {bar.icon}
                  </span>
                  <span
                    className={`font-medium ${
                      isOverall ? 'font-bold text-[#1a3a5c]' : 'text-slate-700'
                    }`}
                  >
                    {bar.name}
                  </span>
                </div>
                {/* Percentage label on the right */}
                <span
                  className="font-mono font-bold text-xs"
                  style={{ color: isOverall ? '#1a3a5c' : color }}
                >
                  {bar.score.toFixed(1)}%
                </span>
              </div>

              {/* Clean Horizontal Progress Bar with Smooth Transition */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(Math.max(bar.score, 0), 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subsystem State Matrix & Kalman Filter Residual Indicator */}
      <div className="pt-2 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>KALMAN FILTER L2 RESIDUAL</span>
          <span
            className={`font-mono px-2 py-0.5 rounded text-[11px] font-bold ${
              anomalyScore < 0.25
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : anomalyScore < 0.55
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {anomalyScore.toFixed(3)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-slate-500 font-medium">Fuel Injection</span>
            <span
              className={`font-bold mt-0.5 ${
                health.combustion >= 80 ? 'text-[#00897b]' : 'text-[#ff8c00]'
              }`}
            >
              {health.combustion >= 80 ? '● Nominal Flow' : '▲ Pressure Delta'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-slate-500 font-medium">Turbocharger</span>
            <span
              className={`font-bold mt-0.5 ${
                health.mechanical >= 80 ? 'text-[#00897b]' : 'text-[#ff8c00]'
              }`}
            >
              {health.mechanical >= 80 ? '● Wastegate Sync' : '▲ High Boost'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-slate-500 font-medium">Lubrication Line</span>
            <span
              className={`font-bold mt-0.5 ${
                health.lubrication >= 80 ? 'text-[#00897b]' : 'text-[#e53935]'
              }`}
            >
              {health.lubrication >= 80 ? '● 4.2 bar Dynamic' : '▲ Pressure Loss'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-slate-500 font-medium">Cylinder Sync</span>
            <span
              className={`font-bold mt-0.5 ${
                health.thermal >= 80 ? 'text-[#00897b]' : 'text-[#ff8c00]'
              }`}
            >
              {health.thermal >= 80 ? '● CHT < 165°C' : '▲ Cylinder Delta'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
