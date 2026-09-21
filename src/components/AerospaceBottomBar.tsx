import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface AerospaceBottomBarProps {
  elapsedSeconds?: number;
}

export const AerospaceBottomBar: React.FC<AerospaceBottomBarProps> = ({
  elapsedSeconds = 1420,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [localTime, setLocalTime] = useState<string>('');
  const [currentSec, setCurrentSec] = useState<number>(elapsedSeconds);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
      setLocalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentSec((prev) => prev + 1);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `T+${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="w-full bg-white border-t border-[#e2e8f0] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3 shadow-[0_-1px_3px_rgba(0,0,0,0.02)] z-20 select-none">
      {/* Small Circular Status Dots */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] font-medium">
        {/* CAN Bus Connection State */}
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00897b]" />
          <span>CAN Bus 2.0B: <strong className="text-slate-800">Active (1 Mbps)</strong></span>
        </div>

        {/* Edge Device Online Status */}
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Edge Device: <strong className="text-slate-800">Online (Embedded RTOS • 12ms)</strong></span>
        </div>

        {/* Data Logging Active Indicator */}
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
          <span>Telemetry Logger: <strong className="text-slate-800">Recording (20 Hz • Sync)</strong></span>
        </div>

        {/* Mission Elapsed Time */}
        <div className="hidden md:flex items-center space-x-1.5 text-slate-500 font-mono">
          <span>MISSION ELAPSED:</span>
          <strong className="text-[#1a3a5c] font-bold">{formatElapsed(currentSec)}</strong>
        </div>
      </div>

      {/* Digital Clock */}
      <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
        <div className="flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold">{utcTime}</span>
        </div>
        <span>•</span>
        <span className="text-slate-500">{localTime} LOCAL</span>
      </div>
    </footer>
  );
};
