import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface VibesparTopBarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  uavId?: string;
  engineId?: string;
  missionId?: string;
  isConnected?: boolean;
}

export const VibesparTopBar: React.FC<VibesparTopBarProps> = ({
  theme,
  onToggleTheme,
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

  return (
    <header
      id="vibespar-topbar"
      className={`w-full px-4 sm:px-6 py-2.5 border-b transition-colors flex items-center justify-between ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Left side: Brand + Vehicle / Engine Identifiers */}
      <div className="flex items-center space-x-4 sm:space-x-8">
        {/* Brand */}
        <div className="flex items-center">
          <span className="font-chakra font-extrabold text-xl sm:text-2xl tracking-wider text-cyan-600 dark:text-cyan-400">
            VIBESPAR
          </span>
        </div>

        {/* Metadata Identifiers */}
        <div className="flex items-center space-x-3 sm:space-x-6 text-xs sm:text-sm font-chakra font-semibold tracking-wider">
          <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>
            {uavId}
          </span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>•</span>
          <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>
            {engineId}
          </span>
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>•</span>
          <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>
            {missionId}
          </span>
        </div>
      </div>

      {/* Right side: Live status, UTC clock, Connected badge, Theme toggle */}
      <div className="flex items-center space-x-3 sm:space-x-5 text-xs sm:text-sm font-chakra">
        {/* Live Indicator */}
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wider text-xs">
            LIVE
          </span>
        </div>

        {/* Clock */}
        <div className={`font-tech text-xs sm:text-sm tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          {utcTime || '12:47:03 UTC'}
        </div>

        {/* Connected Badge */}
        <div
          className={`px-2.5 py-0.5 rounded border text-[11px] font-chakra font-bold tracking-wider uppercase transition-colors ${
            isConnected
              ? isLight
                ? 'border-emerald-600/70 text-emerald-700 bg-emerald-50'
                : 'border-emerald-500/70 text-emerald-400 bg-emerald-950/40'
              : 'border-rose-500 text-rose-500 bg-rose-50'
          }`}
        >
          CONNECTED
        </div>

        {/* Theme switcher */}
        <button
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`p-1.5 rounded border transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-[#101b2e] hover:bg-[#182944] border-[#223a5d] text-amber-400'
          }`}
        >
          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
