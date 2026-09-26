import React from 'react';
import {
  TelemetryData,
  EngineHealthScores,
  FaultType,
  OperatingControls as OperatingControlsType,
  MissionPhase,
} from '../types/engine';
import {
  Activity,
  Gauge,
  Flame,
  Droplets,
  Plane,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  Sparkles,
} from 'lucide-react';

interface KpiSummaryBannerProps {
  telemetry: TelemetryData;
  health: EngineHealthScores;
  anomalyScore: number;
  activeFault: FaultType;
  controls: OperatingControlsType;
  missionPhase: MissionPhase;
  onQuickFaultSelect: (fault: FaultType) => void;
  onOpenTab: (tabId: string) => void;
  theme: 'light' | 'dark';
}

export const KpiSummaryBanner: React.FC<KpiSummaryBannerProps> = ({
  telemetry,
  health,
  anomalyScore,
  activeFault,
  controls,
  missionPhase,
  onQuickFaultSelect,
  onOpenTab,
  theme,
}) => {
  const safeControls = controls || { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 };
  const isLight = theme === 'light';

  // Overall status classification
  const getStatus = () => {
    if (health.overall < 60 || anomalyScore > 0.6) {
      return {
        label: 'CRITICAL ALERT',
        sublabel: activeFault === 'NORMAL' ? 'High Residual Detected' : activeFault.replace(/_/g, ' '),
        color: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
        icon: ShieldAlert,
        border: 'border-rose-300 dark:border-rose-800/80',
      };
    }
    if (health.overall < 82 || anomalyScore > 0.28) {
      return {
        label: 'CAUTION / DEGRADED',
        sublabel: activeFault === 'NORMAL' ? 'Minor Sensor Deviation' : activeFault.replace(/_/g, ' '),
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
        icon: AlertTriangle,
        border: 'border-amber-300 dark:border-amber-800/80',
      };
    }
    return {
      label: 'OPTIMAL / NOMINAL',
      sublabel: 'All Subsystems Balanced',
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
      icon: ShieldCheck,
      border: 'border-emerald-300 dark:border-emerald-800/80',
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="w-full space-y-2">
      {/* 6 Grid Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Card 1: Master Status */}
        <div
          onClick={() => onOpenTab('diagnostics')}
          role="button"
          tabIndex={0}
          title="Click to view deep AI diagnostics & anomaly metrics"
          className={`cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:shadow-md ${
            isLight
              ? 'bg-white border-slate-200 hover:border-cyan-500'
              : 'bg-[#0a1120] border-[#1c2e47] hover:border-cyan-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-chakra font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              System State
            </span>
            <span className={`p-1 rounded-full ${status.badgeBg} border`}>
              <StatusIcon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1">
            <div className={`text-xs font-bold font-chakra truncate ${status.color}`}>
              {status.label}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {status.sublabel}
            </div>
          </div>
          <div className="mt-2 text-[9px] font-chakra font-medium text-cyan-700 dark:text-cyan-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Diagnostics</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* Card 2: Engine Overall Health */}
        <div
          onClick={() => onOpenTab('overview')}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:shadow-md ${
            isLight
              ? 'bg-white border-slate-200 hover:border-cyan-500'
              : 'bg-[#0a1120] border-[#1c2e47] hover:border-cyan-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-chakra font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Engine Health
            </span>
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span
              className={`text-xl font-tech font-bold ${
                health.overall >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : health.overall >= 60
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {health.overall}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {health.overall >= 85 ? 'Excellent' : health.overall >= 70 ? 'Good' : 'Alert'}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                health.overall >= 80
                  ? 'bg-emerald-500'
                  : health.overall >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${health.overall}%` }}
            />
          </div>
        </div>

        {/* Card 3: Rotational Speed (RPM) & Throttle */}
        <div
          onClick={() => onOpenTab('controls')}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:shadow-md ${
            isLight
              ? 'bg-white border-slate-200 hover:border-cyan-500'
              : 'bg-[#0a1120] border-[#1c2e47] hover:border-cyan-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-chakra font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Engine RPM
            </span>
            <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
              {Math.round(telemetry.rpm)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Throttle: <span className="font-bold text-slate-800 dark:text-slate-200">{safeControls.throttle ?? 68}%</span>
            </div>
          </div>
          <div className="mt-2 text-[9px] font-tech text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            Nominal: 2200 - 5500
          </div>
        </div>

        {/* Card 4: Cylinder & Exhaust Heat (CHT / EGT) */}
        <div
          onClick={() => onOpenTab('overview')}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:shadow-md ${
            isLight
              ? 'bg-white border-slate-200 hover:border-cyan-500'
              : 'bg-[#0a1120] border-[#1c2e47] hover:border-cyan-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-chakra font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Thermal / Temp
            </span>
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>CHT: {telemetry.cht.toFixed(0)}°C</span>
              <span className={telemetry.cht > 200 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                {telemetry.cht > 200 ? 'HIGH' : 'OK'}
              </span>
            </div>
            <div className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between mt-0.5">
              <span>EGT: {telemetry.egt.toFixed(0)}°C</span>
              <span className={telemetry.egt > 820 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                {telemetry.egt > 820 ? 'HIGH' : 'OK'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[9px] font-tech text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            Cylinder #2: {(telemetry.egtCylinders?.[1] ?? telemetry.egt).toFixed(0)}°C
          </div>
        </div>

        {/* Card 5: Oil Pressure & Sump Temp */}
        <div
          onClick={() => onOpenTab('overview')}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:shadow-md ${
            isLight
              ? 'bg-white border-slate-200 hover:border-cyan-500'
              : 'bg-[#0a1120] border-[#1c2e47] hover:border-cyan-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-chakra font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lubrication
            </span>
            <Droplets className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-1">
            <div className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Press: {telemetry.oilPressure.toFixed(1)} bar</span>
              <span className={telemetry.oilPressure < 2.5 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                {telemetry.oilPressure < 2.5 ? 'LOW' : 'OK'}
              </span>
            </div>
            <div className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between mt-0.5">
              <span>Temp: {telemetry.oilTemperature.toFixed(0)}°C</span>
              <span className={telemetry.oilTemperature > 120 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                {telemetry.oilTemperature > 120 ? 'HOT' : 'OK'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[9px] font-tech text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            Nominal: 3.5 - 5.5 bar
          </div>
        </div>

        {/* Card 6: Flight Envelope & Mission */}
        <div
          onClick={() => onOpenTab('mission')}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:shadow-md ${
            isLight
              ? 'bg-white border-slate-200 hover:border-cyan-500'
              : 'bg-[#0a1120] border-[#1c2e47] hover:border-cyan-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-chakra font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Flight Envelope
            </span>
            <Plane className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-1">
            <div className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100">
              {((safeControls.altitude ?? 8400) / 1000).toFixed(1)}k FT
            </div>
            <div className="text-[10px] font-chakra font-semibold text-cyan-700 dark:text-cyan-400 truncate mt-0.5">
              Phase: {missionPhase.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="mt-2 text-[9px] font-tech text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Fuel: {telemetry.fuelRemainingKg.toFixed(0)} kg</span>
            <span>Flow: {telemetry.fuelFlow.toFixed(1)} L/h</span>
          </div>
        </div>
      </div>

      {/* Quick Scenario Simulator Pills - makes it super easy for user to test right away */}
      <div
        className={`px-3 py-2 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs font-chakra ${
          isLight
            ? 'bg-slate-100/90 border-slate-300 text-slate-800'
            : 'bg-[#070e1b] border-[#182a44] text-slate-300'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold text-[11px] uppercase tracking-wider">
            Quick Simulation Presets:
          </span>
          <span className="text-[10px] text-slate-500 hidden md:inline">
            (Select to observe instant digital twin physics response)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onQuickFaultSelect('NORMAL')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
              activeFault === 'NORMAL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isLight
                ? 'bg-white hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-[#0d182a] hover:bg-[#152744] border-[#223d63] text-slate-200'
            }`}
          >
            ✓ Normal Baseline
          </button>

          <button
            onClick={() => onQuickFaultSelect('INJECTOR_DEGRADATION')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
              activeFault === 'INJECTOR_DEGRADATION'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : isLight
                ? 'bg-white hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-[#0d182a] hover:bg-[#152744] border-[#223d63] text-slate-200'
            }`}
          >
            ⚠️ Injector Coking (Cyl #2)
          </button>

          <button
            onClick={() => onQuickFaultSelect('OVERHEATING')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
              activeFault === 'OVERHEATING'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : isLight
                ? 'bg-white hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-[#0d182a] hover:bg-[#152744] border-[#223d63] text-slate-200'
            }`}
          >
            🔥 Cooling Baffle Failure
          </button>

          <button
            onClick={() => onQuickFaultSelect('LUBRICATION_FAILURE')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
              activeFault === 'LUBRICATION_FAILURE'
                ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                : isLight
                ? 'bg-white hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-[#0d182a] hover:bg-[#152744] border-[#223d63] text-slate-200'
            }`}
          >
            💧 Low Oil Pressure
          </button>

          <button
            onClick={() => onOpenTab('controls')}
            className="px-2 py-1 rounded text-[10px] font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>More in Fault Lab &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
