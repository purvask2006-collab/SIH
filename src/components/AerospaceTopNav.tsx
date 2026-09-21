import React, { useState, useEffect } from 'react';
import { Activity, RotateCcw, Play, CheckCircle2, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import { FaultType } from '../types/engine';

interface AerospaceTopNavProps {
  anomalyScore: number;
  activeFault: FaultType;
  overallHealth: number;
  criticalAlertCount: number;
  warningAlertCount: number;
  onResetSimulation: () => void;
  onStartDemo?: () => void;
  isDemoActive?: boolean;
}

export const AerospaceTopNav: React.FC<AerospaceTopNavProps> = ({
  anomalyScore,
  activeFault,
  overallHealth,
  criticalAlertCount,
  warningAlertCount,
  onResetSimulation,
  onStartDemo,
  isDemoActive,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isNominal = activeFault === 'NORMAL' && criticalAlertCount === 0;

  return (
    <header className="w-full bg-white border-b border-[#e2e8f0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] z-30">
      {/* Title & System Specification (No text logos or corporate branding) */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-[#1a3a5c] text-white flex items-center justify-center font-bold text-sm shadow-sm">
          <Activity className="w-4 h-4 text-[#00897b]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold text-[#1a3a5c] tracking-tight">
              AEROSPACE PROPULSION HEALTH MONITORING
            </h1>
            <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              DIGITAL TWIN
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Turbocharged Aero Piston Engine • 20 Hz Telemetry & Predictive Kalman State Estimation
          </p>
        </div>
      </div>

      {/* Right Side: System Status Indicators in Green, Amber, and Red Pills */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Green Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isNominal
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-emerald-50/50 text-emerald-700 border-emerald-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#00897b] animate-pulse" />
          <span>SYS HEALTH: {overallHealth.toFixed(0)}%</span>
        </div>

        {/* Amber Warning Pill */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            warningAlertCount > 0 || anomalyScore > 0.35
              ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-sm'
              : 'bg-amber-50/40 text-amber-700/80 border-amber-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#ff8c00]" />
          <span>RESIDUAL: {anomalyScore.toFixed(2)}</span>
          {warningAlertCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#ff8c00] text-white text-[10px]">
              {warningAlertCount}
            </span>
          )}
        </div>

        {/* Red Critical Pill */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            criticalAlertCount > 0
              ? 'bg-red-50 text-red-900 border-red-400 shadow-sm animate-pulse'
              : 'bg-red-50/40 text-red-700/80 border-red-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-[#e53935]" />
          <span>
            {criticalAlertCount > 0 ? `${criticalAlertCount} CRITICAL` : '0 CRITICAL'}
          </span>
        </div>

        {/* Digital Clock */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{utcTime}</span>
        </div>

        {/* Demo and Reset Quick Actions */}
        <div className="flex items-center space-x-1.5 ml-1">
          {onStartDemo && (
            <button
              onClick={onStartDemo}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 border transition-all ${
                isDemoActive
                  ? 'bg-teal-600 text-white border-teal-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Automated guided tour of propulsion digital twin"
            >
              <Play className="w-3 h-3 text-teal-600" />
              <span className="hidden sm:inline">Guided Demo</span>
            </button>
          )}

          <button
            onClick={onResetSimulation}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1 transition-all"
            title="Reset telemetry & flight parameters to nominal cruise"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
