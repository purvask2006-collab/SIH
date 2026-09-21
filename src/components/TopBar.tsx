import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Play,
  RotateCcw,
  Plane,
  Shield,
  Satellite,
  Sun,
  Moon,
} from 'lucide-react';

interface TopBarProps {
  onStartDemo: () => void;
  isDemoRunning: boolean;
  demoStep: number;
  totalDemoSteps: number;
  onResetSimulation: () => void;
  connectionStatus: 'LIVE' | 'DEGRADED' | 'STANDBY';
  overallHealth: number;
  anomalyScore: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onStartDemo,
  isDemoRunning,
  demoStep,
  totalDemoSteps,
  onResetSimulation,
  connectionStatus,
  overallHealth,
  anomalyScore,
  theme,
  onToggleTheme,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [istTime, setIstTime] = useState<string>('');
  const [elapsedSec, setElapsedSec] = useState<number>(1420); // Simulated mission elapsed time

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
      // Indian Standard Time (IST = UTC + 5:30)
      const istDate = new Date(now.getTime() + (5.5 * 60 + now.getTimezoneOffset()) * 60000);
      setIstTime(istDate.toTimeString().split(' ')[0] + ' IST');
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `MET T+${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLight = theme === 'light';

  return (
    <header
      className={`w-full border-b px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none relative transition-colors ${
        isLight
          ? 'bg-white border-[#cbd5e1] text-[#0f172a] shadow-[0_2px_12px_rgba(15,23,42,0.06)]'
          : 'bg-[#070d18] border-[#1c2e47] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Top Indian Tricolor Security Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex z-20">
        <div className="w-1/3 bg-[#ff9933]"></div>
        <div className="w-1/3 bg-[#ffffff] border-y border-slate-200"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* Brand & UAV System Metadata */}
      <div className="flex items-center space-x-3 sm:space-x-3.5">
        {/* DRDO / Indian Defence Insignia Badge */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded border relative overflow-hidden group shadow-sm transition-colors ${
            isLight
              ? 'bg-[#f8fafc] border-[#94a3b8] text-cyan-700'
              : 'bg-[#091526] border-[#23426b] text-cyan-400'
          }`}
        >
          <Plane className="w-5 h-5 transform -rotate-45" />
          <span
            className={`absolute bottom-0.5 right-0.5 text-[8px] font-tech font-bold ${
              isLight ? 'text-amber-800' : 'text-amber-400'
            }`}
          >
            IND
          </span>
        </div>

        <div>
          {/* Government / DRDO Ministry Header Line */}
          <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-chakra tracking-wider font-semibold uppercase">
            <span className={isLight ? 'text-amber-700 font-bold' : 'text-amber-400/90 font-bold'}>
              DRDO • ADE BENGALURU
            </span>
            <span className={isLight ? 'text-slate-400 hidden sm:inline' : 'text-slate-600 hidden sm:inline'}>|</span>
            <span className={isLight ? 'text-slate-700 font-bold hidden md:inline' : 'text-slate-300 font-bold hidden md:inline'}>
              SIH 2026
            </span>
            <span className={isLight ? 'text-slate-400 hidden md:inline' : 'text-slate-600 hidden md:inline'}>|</span>
            <span
              className={`px-1.5 py-0.5 rounded border font-tech text-[9px] font-bold tracking-normal whitespace-nowrap ${
                isLight
                  ? 'bg-red-50 border-red-400 text-red-700'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}
            >
              DRDO GCS // FLIGHT EVALUATION
            </span>
          </div>

          {/* Primary System Title with Chakra Petch font */}
          <div className="flex flex-col mt-0.5">
            <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-wider font-chakra flex flex-wrap items-center gap-x-2 leading-snug">
              <span className={`uppercase font-extrabold whitespace-nowrap ${isLight ? 'text-[#020617]' : 'text-white'}`}>
                AERO PISTON ENGINE DIGITAL TWIN
              </span>
              <span className={`text-[10px] sm:text-xs font-semibold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                isLight 
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-300' 
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
              }`}>
                MALE UAV PROPULSION
              </span>
            </h1>
            <p className={`text-[10px] sm:text-[11px] font-chakra font-medium leading-tight ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Rotax 914-F Turbo // Prognostics & Health Monitoring (PHM)
            </p>
          </div>

          {/* Subsystem & Protocol Channel Tags */}
          <div
            className={`flex flex-wrap items-center gap-x-2 text-[10px] font-tech mt-1 ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center space-x-1">
              <span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-500'}>PLATFORM:</span>
              <span className={`font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>TAPAS-BH-201 (AF-07)</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-500'}>ENGINE:</span>
              <span className={`font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>ROTAX 914-F TURBO (115 HP)</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-500'}>TELEMETRY:</span>
              <span className={isLight ? 'text-slate-800 font-medium' : 'text-slate-300'}>MIL-STD-1553B / 50 Hz HWIL</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 text-xs font-tech">
        {/* Telemetry Heartbeat & Link Status */}
        <div
          className={`flex items-center space-x-2 px-2.5 py-1 rounded border transition-colors ${
            isLight ? 'bg-slate-50 border-[#cbd5e1]' : 'bg-[#0a1220] border-[#1b2b42]'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className={`text-[10px] font-chakra font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              C-BAND LINK:
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] tracking-wider font-chakra">
              {connectionStatus}
            </span>
          </div>
          <span className={isLight ? 'text-slate-300' : 'text-slate-700'}>|</span>
          <span className={`text-[10px] font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>50 Hz RX</span>
        </div>

        {/* NavIC Satellite Sync Badge */}
        <div
          className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded border text-[10px] ${
            isLight ? 'bg-slate-50 border-[#cbd5e1] text-slate-800' : 'bg-[#0a1220] border-[#1b2b42] text-slate-300'
          }`}
        >
          <Satellite className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <span className={`font-chakra font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>NavIC:</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">L5/S LOCKED</span>
        </div>

        {/* Tactical Clocks: IST + UTC + MET */}
        <div
          className={`hidden md:flex items-center space-x-2.5 px-2.5 py-1 rounded border text-[11px] ${
            isLight ? 'bg-slate-50 border-[#cbd5e1] text-slate-800' : 'bg-[#0a1220] border-[#1b2b42] text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <span className={`font-tech font-bold text-[11px] ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              {istTime || '18:12:41 IST'}
            </span>
          </div>
          <span className={isLight ? 'text-slate-300' : 'text-slate-700'}>|</span>
          <span className={`font-tech text-[10px] hidden lg:inline ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {utcTime || '12:42:41 UTC'}
          </span>
          <span className={isLight ? 'text-slate-300 hidden lg:inline' : 'text-slate-700 hidden lg:inline'}>|</span>
          <span className={`font-tech font-bold text-[11px] ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
            {formatElapsed(elapsedSec)}
          </span>
        </div>

        {/* Quick Health Summary Pill */}
        <div
          className={`hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded border text-[11px] ${
            isLight ? 'bg-slate-50 border-[#cbd5e1]' : 'bg-[#0a1220] border-[#1b2b42]'
          }`}
        >
          <span className={`text-[10px] font-chakra font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            HEALTH:
          </span>
          <span
            className={`font-bold font-chakra text-sm ${
              overallHealth > 80
                ? 'text-emerald-700 dark:text-emerald-400'
                : overallHealth > 60
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {overallHealth}%
          </span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-700'}>|</span>
          <span className={`text-[10px] font-chakra font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            ANOMALY:
          </span>
          <span
            className={`font-bold font-chakra text-sm ${
              anomalyScore < 0.25
                ? 'text-emerald-700 dark:text-emerald-400'
                : anomalyScore < 0.6
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {(anomalyScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Action Controls & Light/Dark Theme Switcher */}
      <div className="flex items-center space-x-2">
        {/* LIGHT / DARK THEME TOGGLE */}
        <button
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Tactical Night Ops Dark Mode' : 'Switch to Tactical Daylight Light Mode'}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-chakra font-bold tracking-wider transition-all border shadow-sm uppercase ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-[#94a3b8] text-slate-800'
              : 'bg-[#0b1626] hover:bg-[#12233c] border-[#223956] text-cyan-300'
          }`}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">DAYLIGHT GCS</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">NIGHT OPS</span>
            </>
          )}
        </button>

        {/* Demo Mode Button */}
        <button
          onClick={onStartDemo}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-chakra font-bold tracking-wider transition-all border shadow-sm uppercase ${
            isDemoRunning
              ? 'bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400 animate-pulse'
              : isLight
              ? 'bg-cyan-700 hover:bg-cyan-800 text-white border-cyan-800'
              : 'bg-[#0f253e] hover:bg-[#16375c] text-cyan-300 border-[#235384]'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isDemoRunning ? `TEST (${demoStep}/${totalDemoSteps})` : 'EXECUTE DEMO'}</span>
        </button>

        {/* Reset Simulation */}
        <button
          onClick={onResetSimulation}
          title="Reset Engine to Nominal Cruise Baseline"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-chakra font-bold tracking-wider transition-colors border uppercase ${
            isLight
              ? 'bg-white hover:bg-slate-100 text-slate-800 border-[#cbd5e1]'
              : 'bg-[#0e1726] hover:bg-[#152338] text-slate-300 hover:text-white border-[#1d304a]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">RESET</span>
        </button>
      </div>
    </header>
  );
};
