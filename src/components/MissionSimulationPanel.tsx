import React from 'react';
import { MissionPhase, MissionPhaseConfig } from '../types/engine';
import { MISSION_PHASES } from '../services/missionService';
import { Compass, PlaneTakeoff, Gauge, Fuel, ShieldAlert, Clock, AlertTriangle, Navigation } from 'lucide-react';

interface MissionSimulationPanelProps {
  currentPhase: MissionPhase;
  onSelectPhase: (phase: MissionPhase) => void;
  currentAltitude: number;
  currentThrottle: number;
  currentEngineLoad: number;
  currentFuelFlow: number;
  engineHealth: number;
  fuelRemainingKg: number;
  disabled?: boolean;
}

const PHASE_CODES: Record<MissionPhase, string> = {
  PRE_FLIGHT: 'PH-00',
  TAKEOFF: 'PH-01',
  CLIMB: 'PH-02',
  CRUISE: 'PH-03',
  HIGH_ALTITUDE_LOITER: 'PH-04',
  THROTTLE_TRANSITION: 'PH-05',
  DESCENT: 'PH-06',
  LANDING: 'PH-07',
  POST_FLIGHT: 'PH-08',
};

export const MissionSimulationPanel: React.FC<MissionSimulationPanelProps> = ({
  currentPhase,
  onSelectPhase,
  currentAltitude,
  currentThrottle,
  currentEngineLoad,
  currentFuelFlow,
  engineHealth,
  fuelRemainingKg,
  disabled = false,
}) => {
  // Estimated endurance in hours:mins based on current fuel flow
  const hourlyFuelKg = currentFuelFlow * 0.72;
  const enduranceHours = hourlyFuelKg > 0 ? fuelRemainingKg / hourlyFuelKg : 0;
  const endurHrs = Math.floor(enduranceHours);
  const endurMins = Math.round((enduranceHours - endurHrs) * 60);

  // Dynamic Mission Risk assessment
  let missionRisk: 'LOW' | 'MODERATE' | 'CRITICAL' = 'LOW';
  if (engineHealth < 60 || currentAltitude > 19000 || fuelRemainingKg < 8) {
    missionRisk = 'CRITICAL';
  } else if (engineHealth < 78 || currentAltitude > 16000 || currentThrottle > 90) {
    missionRisk = 'MODERATE';
  }

  const phaseKeys = Object.keys(MISSION_PHASES) as MissionPhase[];

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <PlaneTakeoff className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            [MISSION RELIABILITY ENHANCEMENT] DYNAMIC SORTIE FLIGHT PROFILE & PROPULSION WORKLOAD
          </h2>
        </div>
        <span className="text-[10px] font-chakra text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-wide">
          TAPAS-BH-201 MALE UAV // PROPULSION ENVELOPE GOVERNOR
        </span>
      </div>

      {/* Mission Phase Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {phaseKeys.map((pk) => {
          const cfg = MISSION_PHASES[pk];
          if (!cfg) return null;
          const isSelected = currentPhase === pk;
          const code = PHASE_CODES[pk] || 'PH-XX';

          return (
            <button
              key={pk}
              disabled={disabled}
              onClick={() => onSelectPhase(pk)}
              className={`px-2.5 py-1.5 rounded text-xs font-rajdhani font-bold tracking-wider transition-all flex items-center space-x-1.5 border uppercase ${
                isSelected
                  ? 'bg-[#0e2744] border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/60'
                  : 'bg-[#070c17] border-[#18263a] text-slate-400 hover:text-slate-200 hover:border-[#223b5c]'
              }`}
            >
              <span className="text-[10px] font-tech text-cyan-400/80">{code}:</span>
              <span>{cfg.name.split('&')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Mission Phase Context Banner */}
      <div className="bg-[#070c17] p-2.5 rounded border border-[#16253a] text-xs font-chakra text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-rajdhani font-bold tracking-wide uppercase">[SORTIE DIRECTIVE]:</span>
          <span>{MISSION_PHASES[currentPhase]?.description || 'Nominal operational sortie profile.'}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-tech text-slate-400">
          <Navigation className="w-3 h-3 text-emerald-400" />
          <span>AUTONOMOUS FMS WAYPOINT SYNCED</span>
        </div>
      </div>

      {/* Required Mission Parameters Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Altitude */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">PRESSURE ALT</span>
          <div className="text-sm font-tech font-bold text-white mt-0.5">
            {Math.round(currentAltitude).toLocaleString()} FT
          </div>
        </div>

        {/* Throttle */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">THROTTLE LEVER</span>
          <div className="text-sm font-tech font-bold text-cyan-300 mt-0.5">
            {currentThrottle}%
          </div>
        </div>

        {/* Engine Load */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">BMEP LOAD</span>
          <div className="text-sm font-tech font-bold text-purple-300 mt-0.5">
            {currentEngineLoad}%
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">FUEL MASS FLOW</span>
          <div className="text-sm font-tech font-bold text-amber-300 mt-0.5">
            {currentFuelFlow} L/H
          </div>
        </div>

        {/* Engine Health */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">HEALTH INDEX</span>
          <div
            className={`text-sm font-tech font-bold mt-0.5 ${
              engineHealth > 80
                ? 'text-emerald-400'
                : engineHealth > 60
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {engineHealth}%
          </div>
        </div>

        {/* Mission Risk */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">SORTIE RISK</span>
          <div
            className={`text-sm font-tech font-bold mt-0.5 ${
              missionRisk === 'CRITICAL'
                ? 'text-rose-400'
                : missionRisk === 'MODERATE'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {missionRisk}
          </div>
        </div>

        {/* Estimated Endurance */}
        <div className="bg-[#050a14] p-2 rounded border border-[#16253a] text-left">
          <span className="text-[9px] font-tech text-slate-400 uppercase">EST. ENDURANCE</span>
          <div className="text-sm font-tech font-bold text-cyan-300 mt-0.5">
            {endurHrs}H {endurMins}M
          </div>
        </div>
      </div>

      {/* Autonomous FADEC Envelope Protection & Emergency Divert Reachability */}
      <div className="p-2.5 rounded border border-cyan-800/50 bg-cyan-950/20 dark:bg-cyan-950/30 flex flex-wrap items-center justify-between gap-3 text-xs font-chakra">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-slate-900 dark:text-white uppercase">
            AUTONOMOUS ENVELOPE PROTECTION:
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {engineHealth < 65 ? 'ACTIVE DERATE (THROTTLE CAPPED AT 60%)' : 'ONLINE // MAXIMUM THERMAL MARGIN'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 text-[11px] font-tech">
          <span className="text-slate-600 dark:text-slate-400">
            P(MISSION SUCCESS):{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
              {Math.max(12, Math.min(99.4, engineHealth * 1.05 - (currentAltitude > 16000 ? 8 : 0))).toFixed(1)}%
            </strong>
          </span>
          <span>•</span>
          <span className="text-slate-600 dark:text-slate-400">
            PRIMARY RECOVERY:{' '}
            <strong className="text-cyan-700 dark:text-cyan-300 font-bold">ATR CHITRADURGA (RWY 09/27 - 42 KM)</strong>
          </span>
          <span>•</span>
          <span className="text-slate-600 dark:text-slate-400">
            ALTERNATE:{' '}
            <strong className="text-amber-700 dark:text-amber-400 font-bold">BELLARY AFS (78 KM - GLIDE REACHABLE)</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
