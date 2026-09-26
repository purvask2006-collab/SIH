import React, { useState, useEffect } from 'react';
import { Sun, Moon, Plane, Cpu, Wrench, Eye, Code2, FileText, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types/engine';

interface VibesparTopBarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  show3DEngine: boolean;
  onToggle3DEngine: () => void;
  onOpenPythonModal: () => void;
  onOpenReportsModal: () => void;
  uavId?: string;
  engineId?: string;
  missionId?: string;
  isConnected?: boolean;
}

export const VibesparTopBar: React.FC<VibesparTopBarProps> = ({
  theme,
  onToggleTheme,
  currentRole,
  onSelectRole,
  show3DEngine,
  onToggle3DEngine,
  onOpenPythonModal,
  onOpenReportsModal,
  uavId = 'UAV-07',
  engineId = 'AERO-PISTON-01',
  missionId = 'MISSION-027',
  isConnected = true,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLight = theme === 'light';

  const roles: { id: UserRole; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'OPERATOR',
      label: 'UAV OPERATOR',
      sub: 'Mission Control HUD',
      icon: <Plane className="w-3.5 h-3.5" />,
    },
    {
      id: 'ENGINEER',
      label: 'PROPULSION ENG',
      sub: 'Physics & Thermodynamics',
      icon: <Cpu className="w-3.5 h-3.5" />,
    },
    {
      id: 'MAINTENANCE',
      label: 'MAINTENANCE',
      sub: 'Prognostics & Work Orders',
      icon: <Wrench className="w-3.5 h-3.5" />,
    },
    {
      id: 'REPORTS',
      label: 'MISSION REPORTS',
      sub: 'Sortie Logs & Analytics',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'EDGE_AI',
      label: 'EDGE & SECURITY',
      sub: 'Onboard AI & Cyber Shield',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />,
    },
  ];

  return (
    <header
      id="vibespar-topbar"
      className={`w-full px-3 sm:px-5 py-2 border-b transition-colors flex flex-wrap items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#060c18] border-[#14233a] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Left side: Brand + Identifiers */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        <div className="flex items-center space-x-2">
          <span className="font-chakra font-extrabold text-xl sm:text-2xl tracking-wider text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
            VIBESPAR
          </span>
          <span className="text-[10px] font-tech text-cyan-500/70 hidden md:inline px-1 py-0.5 rounded bg-cyan-950/30 border border-cyan-800/40">
            DIGITAL TWIN
          </span>
        </div>

        {/* Identifiers */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-chakra font-semibold tracking-wider text-slate-300">
          <span className="px-1.5 py-0.5 rounded bg-[#0b1626] border border-[#1a2d48] text-slate-300">
            {uavId}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">{engineId}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px]">{missionId}</span>
        </div>
      </div>

      {/* Middle: ROLE SELECTOR (Operator / Propulsion Engineer / Maintenance) */}
      <div className="flex items-center bg-[#091322] border border-[#182c48] p-1 rounded-md shadow-inner">
        {roles.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all text-xs font-chakra font-bold tracking-wide ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101e33] border border-transparent'
              }`}
              title={`Switch persona to ${r.label} (${r.sub})`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{r.icon}</span>
              <span className="hidden sm:inline">{r.label}</span>
              <span className="sm:hidden">{r.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Right side: 3D Toggle, Python Dash Source, Live Status, UTC Clock, Theme Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-chakra">
        {/* Toggle 3D Engine View */}
        <button
          onClick={onToggle3DEngine}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-chakra font-semibold transition-all ${
            show3DEngine
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : 'bg-[#091322] border-[#182c48] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle 3D Engine cutaway visualization in current view"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">3D TWIN:</span>
          <span>{show3DEngine ? 'ON' : 'OFF'}</span>
        </button>

        {/* Mission-Wise Health Reports Button */}
        <button
          onClick={onOpenReportsModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-cyan-700/80 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-chakra font-bold tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.25)] transition-all"
          title="Open comprehensive Mission-Wise Health Reports module"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">REPORTS</span>
        </button>

        {/* Python Dash Code Export Button */}
        <button
          onClick={onOpenPythonModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-[#23426e] bg-[#0c1a2f] hover:bg-[#132644] text-amber-300 hover:text-amber-200 text-xs font-chakra font-bold tracking-wider transition-all"
          title="View & copy complete Python Dash + Plotly code for SIH 2026"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">PYTHON DASH</span>
        </button>

        {/* Live Indicator */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-800/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold tracking-wider text-[11px]">
            LIVE
          </span>
        </div>

        {/* UTC Clock */}
        <div className="hidden sm:block font-tech text-xs tracking-wider text-slate-300">
          {utcTime || '12:47:03 UTC'}
        </div>

        {/* Connected Badge */}
        <div className="hidden lg:block px-2 py-0.5 rounded border border-emerald-500/60 text-[10px] font-chakra font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/30">
          CONNECTED
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`p-1.5 rounded border transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-[#0d182a] hover:bg-[#142642] border-[#1d3353] text-amber-400'
          }`}
        >
          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};

