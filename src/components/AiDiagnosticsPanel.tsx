import React from 'react';
import { AiDiagnosticResult, RulEstimate } from '../types/engine';
import { BrainCircuit, Clock, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, Cpu } from 'lucide-react';

interface AiDiagnosticsPanelProps {
  diagnostic: AiDiagnosticResult;
  rul: RulEstimate;
}

export const AiDiagnosticsPanel: React.FC<AiDiagnosticsPanelProps> = ({
  diagnostic,
  rul,
}) => {
  const isCritical = diagnostic.status === 'CRITICAL';
  const isWarning = diagnostic.status === 'WARNING';

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header with clear DRDO AI/ML Prototype Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            [FAULT PREDICTION] AI/ML FAULT ISOLATION & REMAINING USEFUL LIFE (RUL)
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-[#09182d] border border-cyan-300 dark:border-[#235384] text-cyan-800 dark:text-cyan-300 font-chakra text-[10px] font-bold tracking-wide">
          PINN + Bi-LSTM PROGNOSTICS
        </span>
      </div>

      {/* Main Diagnosis Card */}
      <div
        className={`p-3 rounded border transition-all ${
          isCritical
            ? 'bg-rose-950/25 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : isWarning
            ? 'bg-amber-950/25 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'bg-[#070c17] border-[#18263a]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider">
              [CLASSIFIED ROOT-CAUSE FAULT SIGNATURE]
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              {isCritical ? (
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span
                className={`font-rajdhani text-sm sm:text-base font-bold tracking-wide uppercase ${
                  isCritical
                    ? 'text-rose-300'
                    : isWarning
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}
              >
                {diagnostic.probableFault}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-right">
            <div className="px-2 py-1 rounded bg-[#050a14] border border-[#18263a] font-tech text-xs">
              <span className="text-slate-400 text-[9px]">P(FAULT): </span>
              <span
                className={`font-bold ${
                  isCritical
                    ? 'text-rose-400'
                    : isWarning
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {diagnostic.faultProbability}%
              </span>
            </div>
            <div className="px-2 py-1 rounded bg-[#050a14] border border-[#18263a] font-tech text-xs">
              <span className="text-slate-400 text-[9px]">CONFIDENCE: </span>
              <span className="text-cyan-300 font-bold">{diagnostic.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Feature Signature Pattern Reasoning */}
        <div className="mt-2 pt-2 border-t border-[#18283f] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-tech text-slate-400 mb-1">
            <span>SIGNATURE MATCH: <strong className="text-slate-200">{diagnostic.signatureMatch}</strong></span>
            <span className="text-cyan-400/80">INFERENCE REASONING CHAIN</span>
          </div>
          {diagnostic.ruleReasoning.map((rule, idx) => (
            <div key={idx} className="flex items-start space-x-1.5 text-xs font-chakra text-slate-300">
              <span className="text-cyan-400 font-mono">›</span>
              <p className="leading-snug">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RUL Panel (Section 9) */}
      <div className="p-3 rounded border border-[#18263a] bg-[#070c17] flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-rajdhani font-bold tracking-wider text-slate-200 uppercase">
              REMAINING USEFUL LIFE (RUL) WEIBULL PROGNOSIS
            </h3>
          </div>
          <span className="text-[10px] font-tech px-2 py-0.5 rounded bg-[#091526] border border-[#1d3350] text-slate-300">
            CONFIDENCE: <strong className="text-cyan-300">{rul.confidence}%</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-[#050a14] border border-[#162438]">
          <div>
            <div className="text-[10px] font-tech text-slate-400">ESTIMATED PROGNOSIS WINDOW:</div>
            <div className="text-lg sm:text-xl font-tech font-bold text-amber-300">
              {rul.minHours}–{rul.maxHours} FLIGHT HOURS
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-tech text-slate-400">FATIGUE ACCELERATION:</div>
            <div className="text-xs font-tech font-bold text-slate-200">
              {rul.wearFactor}x MIL-SPEC OVERHAUL BASELINE
            </div>
          </div>
        </div>

        <p className="text-[11px] font-chakra text-slate-300 bg-[#091220] px-2.5 py-1.5 rounded border border-[#192b45]">
          <span className="text-amber-400 font-bold font-rajdhani tracking-wide">AVIONICS DIRECTIVE: </span>
          {rul.advisoryText}
        </p>

        {/* Prototype Disclaimer */}
        <div className="flex items-start space-x-1.5 text-[10px] font-tech text-slate-500 italic pt-1 border-t border-[#16253a]">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
          <span>
            DRDO-ADE Telemetry Test Bench — requires continuous run-to-overhaul ground dynamometer calibration.
          </span>
        </div>
      </div>
    </div>
  );
};
