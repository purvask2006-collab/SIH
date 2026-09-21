import React, { useState } from 'react';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Activity,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

interface DashboardExplainerProps {
  theme: 'light' | 'dark';
  onStartDemo: () => void;
}

export const DashboardExplainer: React.FC<DashboardExplainerProps> = ({
  theme,
  onStartDemo,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return localStorage.getItem('drdo_guide_dismissed') !== 'true';
  });

  const isLight = theme === 'light';

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) {
      localStorage.setItem('drdo_guide_dismissed', 'true');
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        isLight
          ? 'bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/70 border-sky-200 shadow-sm'
          : 'bg-gradient-to-r from-[#091526] via-[#0b1b33] to-[#0d1627] border-[#1f3a5f] shadow-md'
      }`}
    >
      {/* Top Banner Row */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-chakra font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Interactive Aero Digital Twin System
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                TAPAS-BH-201 MALE UAV
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-0.5">
              Real-time physics model compared against live sensor telemetry to predict engine faults before in-flight failure.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onStartDemo}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-chakra font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow transition-colors"
          >
            <span>Take 8-Step Tour</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleOpen}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#0e1c31] hover:bg-[#152a49] border-[#224068] text-slate-300'
            }`}
            title={isOpen ? 'Collapse Guide' : 'Expand Guide'}
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] hidden md:inline">{isOpen ? 'Hide Quick Guide' : 'How It Works'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Educational Workflow Cards */}
      {isOpen && (
        <div
          className={`px-4 pt-2 pb-3.5 border-t text-xs font-sans grid grid-cols-1 md:grid-cols-3 gap-3 ${
            isLight ? 'border-sky-100 text-slate-700' : 'border-[#182f4d] text-slate-300'
          }`}
        >
          {/* Step 1 */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              isLight ? 'bg-white/90 border-slate-200' : 'bg-[#07111e]/90 border-[#1a3150]'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-chakra font-bold text-xs uppercase">
                <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Physics Digital Twin</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                The engine model runs thermodynamic & rotordynamic equations in real time matching current throttle, altitude, and load.
              </p>
            </div>
            <div className="mt-2 text-[10px] font-chakra font-semibold text-sky-600 dark:text-sky-400 flex items-center space-x-1">
              <span>Dynamic 3D Simulation & Real-Time Math</span>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              isLight ? 'bg-white/90 border-slate-200' : 'bg-[#07111e]/90 border-[#1a3150]'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-chakra font-bold text-xs uppercase">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Residual Deviation</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Any gap between the physics prediction and live telemetry produces an L2 anomaly residual (e.g., Cylinder #2 runs 45°C hotter).
              </p>
            </div>
            <div className="mt-2 text-[10px] font-chakra font-semibold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
              <span>Continuous EKF State Estimation</span>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              isLight ? 'bg-white/90 border-slate-200' : 'bg-[#07111e]/90 border-[#1a3150]'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-chakra font-bold text-xs uppercase">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Fault Injection & What-If</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Simulate pilot throttle adjustments, flight altitudes, or test faults (injector failure, oil loss, misfire) to see proactive safety alerts.
              </p>
            </div>
            <div className="mt-2 text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span>Predictive Early Warning (45-60 min)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
