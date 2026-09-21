import React from 'react';
import { TelemetryData, EngineHealthScores, FaultType } from '../types/engine';
import {
  Gauge,
  Flame,
  Droplets,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Leaf,
  Clock,
  Zap,
} from 'lucide-react';

interface VisualGaugesBannerProps {
  telemetry: TelemetryData;
  health: EngineHealthScores;
  anomalyScore: number;
  activeFault: FaultType;
  rulHours: number;
  theme: 'light' | 'dark';
}

export const VisualGaugesBanner: React.FC<VisualGaugesBannerProps> = ({
  telemetry,
  health,
  anomalyScore,
  activeFault,
  rulHours,
  theme,
}) => {
  const isLight = theme === 'light';

  // Calculations for gauges
  const rpmPercent = Math.min(100, Math.max(0, (telemetry.rpm / 6000) * 100));
  const chtPercent = Math.min(100, Math.max(0, ((telemetry.cht - 50) / (230 - 50)) * 100));
  const egtPercent = Math.min(100, Math.max(0, ((telemetry.egt - 400) / (900 - 400)) * 100));
  const oilPressPercent = Math.min(100, Math.max(0, (telemetry.oilPressure / 6) * 100));

  // Determine Go / Caution / No-Go status (as in DRDO SIH spec)
  const getMissionDecision = () => {
    if (health.overall < 55 || anomalyScore > 0.65 || telemetry.oilPressure < 2.0 || telemetry.cht > 215) {
      return {
        status: 'ABORT / RTL',
        desc: 'Return to Launch immediately',
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800',
        icon: XCircle,
      };
    }
    if (health.overall < 75 || anomalyScore > 0.3 || activeFault !== 'NORMAL') {
      return {
        status: 'CAUTION / HOLD',
        desc: 'Degradation detected; maintain loiter',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800',
        icon: AlertTriangle,
      };
    }
    return {
      status: 'GO / MISSION READY',
      desc: 'All parameters in nominal flight envelope',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800',
      icon: CheckCircle,
    };
  };

  const decision = getMissionDecision();
  const DecisionIcon = decision.icon;

  // Eco Fuel optimizer calculation (slide 2 DRDO spec)
  const isEcoOptimal = telemetry.rpm >= 4500 && telemetry.rpm <= 5400 && telemetry.oilTemperature <= 105;
  const co2SavedToday = Math.max(1.2, (5500 - Math.abs(telemetry.rpm - 5000)) * 0.003).toFixed(1);

  return (
    <section aria-label="Visual Cockpit Instruments" className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Dial 1: RPM / Engine Speed */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0d1627] border-[#1e3250] shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-chakra font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
              <span>ENGINE RPM</span>
            </span>
            <span className="text-[10px] font-tech text-slate-400">MAX 6000</span>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-tech font-bold text-slate-900 dark:text-white tracking-tight">
                {Math.round(telemetry.rpm)}
              </div>
              <div className="text-[11px] font-chakra text-slate-500">
                Power: <strong className="text-slate-800 dark:text-slate-200">{telemetry.powerHp.toFixed(0)} HP</strong> ({((telemetry.powerHp / 115) * 100).toFixed(0)}%)
              </div>
            </div>

            {/* Circular mini progress gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    telemetry.rpm > 5500
                      ? 'text-rose-500'
                      : telemetry.rpm > 4500
                      ? 'text-cyan-500'
                      : 'text-blue-500'
                  }
                  strokeDasharray={`${rpmPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-tech font-bold text-slate-700 dark:text-slate-300">
                {Math.round(rpmPercent)}%
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                telemetry.rpm > 5500 ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${rpmPercent}%` }}
            />
          </div>
        </div>

        {/* Dial 2: Cylinder Head Temperature (CHT) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0d1627] border-[#1e3250] shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-chakra font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>CYL HEAD TEMP (CHT)</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                telemetry.cht > 200
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {telemetry.cht > 200 ? 'HOT' : 'NOMINAL'}
            </span>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-tech font-bold text-slate-900 dark:text-white tracking-tight">
                {telemetry.cht.toFixed(0)} <span className="text-sm font-normal text-slate-500">°C</span>
              </div>
              <div className="text-[11px] font-chakra text-slate-500">
                Limit: 220°C max
              </div>
            </div>

            {/* Circular mini progress gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    telemetry.cht > 205
                      ? 'text-rose-500'
                      : telemetry.cht > 185
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }
                  strokeDasharray={`${chtPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-tech font-bold text-slate-700 dark:text-slate-300">
                {telemetry.cht.toFixed(0)}°
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                telemetry.cht > 205
                  ? 'bg-rose-500'
                  : telemetry.cht > 185
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${chtPercent}%` }}
            />
          </div>
        </div>

        {/* Dial 3: Exhaust Gas Temperature (EGT) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0d1627] border-[#1e3250] shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-chakra font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span>EXHAUST TEMP (EGT)</span>
            </span>
            <span className="text-[10px] font-tech text-slate-400">4 Cylinders</span>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-tech font-bold text-slate-900 dark:text-white tracking-tight">
                {telemetry.egt.toFixed(0)} <span className="text-sm font-normal text-slate-500">°C</span>
              </div>
              <div className="text-[11px] font-chakra text-slate-500">
                Cyl #2: <strong className="text-amber-600 dark:text-amber-400">{(telemetry.egtCylinders?.[1] ?? telemetry.egt).toFixed(0)}°C</strong>
              </div>
            </div>

            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    telemetry.egt > 830
                      ? 'text-rose-500'
                      : telemetry.egt > 780
                      ? 'text-amber-500'
                      : 'text-sky-500'
                  }
                  strokeDasharray={`${egtPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-tech font-bold text-slate-700 dark:text-slate-300">
                {telemetry.egt.toFixed(0)}°
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                telemetry.egt > 830 ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              style={{ width: `${egtPercent}%` }}
            />
          </div>
        </div>

        {/* Dial 4: Oil System Pressure & Sump Temp */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0d1627] border-[#1e3250] shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-chakra font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-teal-500" />
              <span>OIL PRESSURE</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                telemetry.oilPressure < 2.5
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
              }`}
            >
              {telemetry.oilPressure < 2.5 ? 'PRESSURE DROP' : 'STABLE'}
            </span>
          </div>

          <div className="my-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-tech font-bold text-slate-900 dark:text-white tracking-tight">
                {telemetry.oilPressure.toFixed(1)} <span className="text-sm font-normal text-slate-500">bar</span>
              </div>
              <div className="text-[11px] font-chakra text-slate-500">
                Oil Temp: <strong className="text-slate-800 dark:text-slate-200">{telemetry.oilTemperature.toFixed(0)}°C</strong>
              </div>
            </div>

            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    telemetry.oilPressure < 2.5
                      ? 'text-rose-500'
                      : 'text-teal-500'
                  }
                  strokeDasharray={`${oilPressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-tech font-bold text-slate-700 dark:text-slate-300">
                {telemetry.oilPressure.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                telemetry.oilPressure < 2.5 ? 'bg-rose-500' : 'bg-teal-500'
              }`}
              style={{ width: `${oilPressPercent}%` }}
            />
          </div>
        </div>

        {/* Dial 5: Auto Go / No-Go Decision (SIH Problem Statement Feature) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            decision.bg
          }`}
        >
          <div className="flex items-center justify-between text-xs font-chakra font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <DecisionIcon className={`w-4 h-4 ${decision.color}`} />
              <span className="uppercase tracking-wider">AUTO GO/NO-GO</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/30">
              HEALTH {health.overall}%
            </span>
          </div>

          <div className="my-1.5">
            <div className={`text-base font-chakra font-bold leading-tight ${decision.color}`}>
              {decision.status}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
              {decision.desc}
            </div>
          </div>

          <div className="text-[10px] font-tech flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400">
            <span>Residual: {(anomalyScore * 100).toFixed(0)}%</span>
            <span>RUL: ~{rulHours.toFixed(0)}h</span>
          </div>
        </div>

        {/* Dial 6: Green Fuel Optimizer & CO2 Reduction (SIH Bonus Feature) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-200 shadow-sm text-emerald-950'
              : 'bg-[#091b19] border-[#15463f] shadow-md text-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-chakra font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
              <span>GREEN OPTIMIZER</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              {isEcoOptimal ? 'OPTIMAL RPM' : 'CRUISE TRIM'}
            </span>
          </div>

          <div className="my-1.5">
            <div className="text-xl font-tech font-bold text-emerald-800 dark:text-emerald-300">
              {telemetry.fuelFlow.toFixed(1)} <span className="text-xs font-normal">L/hr</span>
            </div>
            <div className="text-[11px] font-sans text-emerald-700/90 dark:text-emerald-300/80 mt-0.5">
              CO₂ Saved: <strong className="font-tech">{co2SavedToday} kg/hr</strong>
            </div>
          </div>

          <div className="text-[10px] font-chakra text-emerald-700 dark:text-emerald-400 pt-1 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <span>Target: 5000 RPM</span>
            <span>12-18t/yr Fleet</span>
          </div>
        </div>
      </div>
    </section>
  );
};
