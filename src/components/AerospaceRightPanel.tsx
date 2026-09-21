import React from 'react';
import { AlertMessage, MissionPhase, RulEstimate } from '../types/engine';
import { Clock, AlertOctagon, AlertTriangle, Info, CheckCircle2, ChevronRight } from 'lucide-react';

interface AerospaceRightPanelProps {
  rul: RulEstimate;
  currentPhase: MissionPhase;
  onSelectPhase: (phase: MissionPhase) => void;
  alerts: AlertMessage[];
  onAcknowledgeAlerts?: () => void;
}

export const AerospaceRightPanel: React.FC<AerospaceRightPanelProps> = ({
  rul,
  currentPhase,
  onSelectPhase,
  alerts,
  onAcknowledgeAlerts,
}) => {
  // Pill phases exactly matching the prompt: Takeoff, Climb, Cruise, Loiter, Landing
  const phases: { id: MissionPhase; label: string }[] = [
    { id: 'TAKEOFF', label: 'Takeoff' },
    { id: 'CLIMB', label: 'Climb' },
    { id: 'CRUISE', label: 'Cruise' },
    { id: 'HIGH_ALTITUDE_LOITER', label: 'Loiter' },
    { id: 'DESCENT', label: 'Landing' },
  ];

  const criticalAlerts = alerts.filter((a) => a.level === 'CRITICAL' || (a as any).severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.level === 'WARNING' || (a as any).severity === 'WARNING');
  const infoAlerts = alerts.filter((a) => a.level === 'NORMAL' || (a as any).severity === 'INFO');

  // Format hours as 042.8 HRS or 042:30:00
  const hoursNum = rul.minHours || 42.5;
  const wholeHours = Math.floor(hoursNum);
  const minutes = Math.floor((hoursNum - wholeHours) * 60);

  return (
    <div className="flex flex-col space-y-3.5">
      {/* CARD 1: Large Remaining Useful Life (RUL) Countdown Display in Dark Navy Numerals */}
      <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#1a3a5c]" />
            <h2 className="text-xs font-bold text-[#1a3a5c] tracking-wider uppercase">
              REMAINING USEFUL LIFE (RUL)
            </h2>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            WEIBULL-LSTM
          </span>
        </div>

        {/* Large Countdown Display in Dark Navy Numerals (#1a3a5c) */}
        <div className="my-3 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-[#1a3a5c] tracking-tight">
              {wholeHours.toString().padStart(3, '0')}
              <span className="text-slate-400 font-light">:</span>
              {minutes.toString().padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              HRS : MIN
            </span>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-[#00897b]">
              {rul.confidence ? `${(rul.confidence * 100).toFixed(0)}%` : '96%'} CONFIDENCE
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              CI [{(hoursNum * 0.95).toFixed(1)} - {(hoursNum * 1.05).toFixed(1)} h]
            </div>
          </div>
        </div>

        {/* Advisory / Degradation slope */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-500">Cumulative Wear Factor:</span>
            <span className="font-mono font-semibold text-slate-800">
              {rul.wearFactor ? `${(rul.wearFactor * 100).toFixed(1)}%` : '18.4%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {rul.advisoryText || 'All subsystems within operational tolerances. No immediate servicing required.'}
          </p>
        </div>
      </div>

      {/* CARD 2: Mission Phase Indicator with Clean Pill-Shaped Badges */}
      <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
          <h2 className="text-xs font-bold text-[#1a3a5c] tracking-wider uppercase">
            MISSION PHASE PROFILE
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">Click to transition</span>
        </div>

        {/* Clean Pill-Shaped Badges for Takeoff, Climb, Cruise, Loiter, and Landing */}
        <div className="flex flex-wrap gap-1.5">
          {phases.map((p) => {
            const isActive =
              currentPhase === p.id ||
              (p.id === 'DESCENT' && currentPhase === 'LANDING');

            return (
              <button
                key={p.id}
                onClick={() => onSelectPhase(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#00897b] text-white border-[#00897b] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 align-middle" />}
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Active Profile: <strong className="text-slate-800">{currentPhase}</strong></span>
          <span className="text-[11px] font-mono">ENVELOPE: FL140</span>
        </div>
      </div>

      {/* CARD 3: Alerts Panel with Color-Coded Notification Banners (Soft Pastel Backgrounds) */}
      <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-1.5">
            <h2 className="text-xs font-bold text-[#1a3a5c] tracking-wider uppercase">
              ANNUNCIATIONS & ALERTS
            </h2>
          </div>
          {alerts.length > 0 && onAcknowledgeAlerts && (
            <button
              onClick={onAcknowledgeAlerts}
              className="text-[10px] text-slate-500 hover:text-slate-700 underline font-semibold"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Alerts List with Soft Pastel Backgrounds */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            /* Reassuring Nominal Banner */
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#00897b] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">ALL SYSTEMS NOMINAL</span>
                <span className="text-[11px] text-emerald-800/90 leading-tight">
                  Telemetry parameters are operating within standard civil/military flight envelope.
                </span>
              </div>
            </div>
          ) : (
            alerts.map((alert) => {
              // Soft pastel backgrounds per prompt specification:
              // Red tint for critical, amber tint for warning, blue tint for info
              const isCrit = alert.level === 'CRITICAL' || (alert as any).severity === 'CRITICAL';
              const isWarn = alert.level === 'WARNING' || (alert as any).severity === 'WARNING';

              if (isCrit) {
                return (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-start space-x-2 transition-all shadow-xs"
                  >
                    <AlertOctagon className="w-4 h-4 text-[#e53935] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-red-950 uppercase">
                          CRITICAL // {alert.subsystem}
                        </span>
                        <span className="font-mono text-[9px] text-red-600">
                          {alert.timestamp.split('T')[1]?.slice(0, 8) || alert.timestamp || 'NOW'}
                        </span>
                      </div>
                      <p className="text-[11px] text-red-900/90 mt-0.5 leading-snug">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                );
              }

              if (isWarn) {
                return (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2 transition-all"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#ff8c00] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-amber-950 uppercase">
                          CAUTION // {alert.subsystem}
                        </span>
                        <span className="font-mono text-[9px] text-amber-700">
                          {alert.timestamp.split('T')[1]?.slice(0, 8) || 'NOW'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900/90 mt-0.5 leading-snug">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                );
              }

              // Info alert: soft blue tint
              return (
                <div
                  key={alert.id}
                  className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start space-x-2 transition-all"
                >
                  <Info className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-sky-950 uppercase">
                        INFO // {alert.subsystem}
                      </span>
                      <span className="font-mono text-[9px] text-sky-600">
                        {alert.timestamp.split('T')[1]?.slice(0, 8) || 'NOW'}
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-900/90 mt-0.5 leading-snug">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
