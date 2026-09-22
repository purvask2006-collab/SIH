import React from 'react';
import { FaultType } from '../types/engine';
import { Play, Pause } from 'lucide-react';

interface VibesparBottomBarProps {
  activeFault: FaultType;
  onSelectFault: (fault: FaultType) => void;
  isDemoActive: boolean;
  onToggleDemo: () => void;
  theme: 'light' | 'dark';
}

export const VibesparBottomBar: React.FC<VibesparBottomBarProps> = ({
  activeFault,
  onSelectFault,
  isDemoActive,
  onToggleDemo,
  theme,
}) => {
  const isLight = theme === 'light';

  // Map fault buttons from screenshot:
  // NORMAL -> 'NORMAL'
  // COOLING DEGRADATION -> 'OVERHEATING'
  // CYLINDER MISFIRE -> 'MISFIRE'
  // OIL CIRCUIT -> 'LUBRICATION_FAILURE'
  // CLEAR FAULT -> 'NORMAL'

  const faultButtons: { label: string; fault: FaultType }[] = [
    { label: 'NORMAL', fault: 'NORMAL' },
    { label: 'COOLING DEGRADATION', fault: 'OVERHEATING' },
    { label: 'CYLINDER MISFIRE', fault: 'MISFIRE' },
    { label: 'OIL CIRCUIT', fault: 'LUBRICATION_FAILURE' },
  ];

  return (
    <div
      id="vibespar-bottom-bar"
      className={`w-full px-4 sm:px-6 py-2.5 border-t transition-colors flex flex-wrap items-center justify-between gap-3 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#080e1a] border-[#16253c] text-slate-100'
      }`}
    >
      {/* Left side: Fault Injection selector */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-xs font-chakra font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          FAULT INJECTION:
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {faultButtons.map((btn) => {
            const isSelected = activeFault === btn.fault;

            return (
              <button
                key={btn.label}
                onClick={() => onSelectFault(btn.fault)}
                className={`px-3 py-1.5 rounded text-xs font-chakra font-bold tracking-wider transition-all border uppercase ${
                  isSelected
                    ? isLight
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-[#0b1322] hover:bg-[#121e33] border-[#182840] text-slate-400 hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            );
          })}

          {/* Clear Fault Button */}
          <button
            onClick={() => onSelectFault('NORMAL')}
            className={`px-3 py-1.5 rounded text-xs font-chakra font-bold tracking-wider transition-all border uppercase ${
              isLight
                ? 'bg-slate-100 hover:bg-rose-50 border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300'
                : 'bg-[#0b1322] hover:bg-rose-950/40 border-[#182840] text-slate-400 hover:text-rose-400 hover:border-rose-700/60'
            }`}
          >
            CLEAR FAULT
          </button>
        </div>
      </div>

      {/* Right side: Demo Mode controls */}
      <div className="flex items-center space-x-2.5">
        <span className="text-xs font-chakra font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          DEMO MODE:
        </span>

        <button
          onClick={onToggleDemo}
          className={`px-4 py-1.5 rounded text-xs font-chakra font-bold tracking-wider flex items-center space-x-1.5 transition-all border uppercase ${
            isDemoActive
              ? isLight
                ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white shadow-sm'
                : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : isLight
              ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600 text-white shadow-sm'
              : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
          }`}
        >
          {isDemoActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
