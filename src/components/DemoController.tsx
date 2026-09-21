import React from 'react';
import { DEMO_STEPS } from '../services/missionService';
import { Play, Pause, Square, SkipForward, SkipBack, Award, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface DemoControllerProps {
  currentStepIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onStopDemo: () => void;
  onJumpToStep: (stepIndex: number) => void;
}

export const DemoController: React.FC<DemoControllerProps> = ({
  currentStepIndex,
  isPlaying,
  onTogglePlay,
  onNextStep,
  onPrevStep,
  onStopDemo,
  onJumpToStep,
}) => {
  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];
  const progressPercent = ((currentStepIndex + 1) / DEMO_STEPS.length) * 100;

  return (
    <div className="w-full bg-[#08101e] rounded border border-cyan-500/70 p-3 sm:p-3.5 shadow-[0_0_24px_rgba(6,182,212,0.25)] flex flex-col space-y-3 relative drdo-card">
      {/* Top Banner with SIH / DRDO Evaluation Focus */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-900/60">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#09223b] border border-cyan-400 text-cyan-300 font-rajdhani text-xs font-bold tracking-wider animate-pulse">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>DRDO-ADE / SIH 2026 BENCHMARK EVALUATION RIG</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-white tracking-wide uppercase">
            SORTIE EVENT {currentStep.step} OF {DEMO_STEPS.length}: {currentStep.title}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onPrevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded bg-[#070d18] border border-[#1d314d] text-slate-300 hover:text-white disabled:opacity-40"
            title="Previous Step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-tech font-bold transition-all border ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-400'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 border-cyan-400'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE TEST' : 'DISPATCH SEQUENCE'}</span>
          </button>

          <button
            onClick={onNextStep}
            disabled={currentStepIndex === DEMO_STEPS.length - 1}
            className="p-1.5 rounded bg-[#070d18] border border-[#1d314d] text-slate-300 hover:text-white disabled:opacity-40"
            title="Next Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onStopDemo}
            className="p-1.5 rounded bg-rose-950/80 border border-rose-600/70 text-rose-300 hover:bg-rose-900"
            title="Exit Demo Mode"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar with 8 Step Dots */}
      <div className="space-y-1.5">
        <div className="w-full h-1.5 bg-[#050914] rounded-full overflow-hidden border border-[#16253a]">
          <div
            className="h-full bg-cyan-400 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Step Clickers */}
        <div className="grid grid-cols-8 gap-1 pt-1">
          {DEMO_STEPS.map((s, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;

            return (
              <button
                key={s.step}
                onClick={() => onJumpToStep(idx)}
                className={`py-1 px-1 rounded text-center text-[10px] font-tech border transition-all uppercase ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold border-white shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                    : isCompleted
                    ? 'bg-[#0b243d] text-cyan-300 border-cyan-800 hover:bg-[#0e2f50]'
                    : 'bg-[#070c17] text-slate-500 border-[#18263a] hover:text-slate-300'
                }`}
              >
                EV-{s.step}
              </button>
            );
          })}
        </div>
      </div>

      {/* Narrative Card Explaining Exact Physical Phenomena */}
      <div className="p-3 rounded bg-[#050a14] border border-[#182a40] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 font-rajdhani font-bold tracking-wider uppercase">[AERO DYNAMICS EVENT]:</span>
            <span className="text-slate-200 font-chakra">{currentStep.subtitle}</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-tech text-slate-400">
            <span>AI DIAGNOSTIC: <strong className="text-amber-300">{currentStep.aiStatus}</strong></span>
            <span>•</span>
            <span>RUL WINDOW: <strong className="text-cyan-300">{currentStep.rulRange}</strong></span>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded bg-[#08101e] border border-[#1b2f4c] text-slate-200 text-xs font-chakra max-w-sm">
          <span className="text-amber-400 font-rajdhani font-bold tracking-wide uppercase">[DRDO ADVISORY]: </span>
          <span>{currentStep.advisory}</span>
        </div>
      </div>
    </div>
  );
};
