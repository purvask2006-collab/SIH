import React, { useState } from 'react';
import { AlertMessage } from '../types/engine';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AlertBannerAndLogsProps {
  currentLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  currentHeadline: string;
  alerts: AlertMessage[];
  onAcknowledgeAlerts?: () => void;
}

export const AlertBannerAndLogs: React.FC<AlertBannerAndLogsProps> = ({
  currentLevel,
  currentHeadline,
  alerts,
  onAcknowledgeAlerts,
}) => {
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const getLevelStyle = () => {
    switch (currentLevel) {
      case 'CRITICAL':
        return {
          banner: 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
          badge: 'bg-rose-600 text-white animate-pulse',
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
        };
      case 'WARNING':
        return {
          banner: 'bg-amber-950/75 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
        };
      case 'NORMAL':
      default:
        return {
          banner: 'bg-[#08121f] border-[#1c3350] text-emerald-300 shadow-[0_2px_8px_rgba(0,0,0,0.4)]',
          badge: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
    }
  };

  const style = getLevelStyle();
  const Icon = style.icon;

  return (
    <div className="w-full space-y-2">
      {/* Primary Alert Banner */}
      <div
        className={`w-full rounded border px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-all ${style.banner}`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-1 rounded bg-black/50 border border-white/10">
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[9px] font-tech px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${style.badge}`}>
                [{currentLevel}]
              </span>
              <span className="text-xs font-rajdhani font-bold tracking-widest text-white uppercase">
                DRDO-ADE C2 MASTER CAUTION & AVIONICS ANNUNCIATOR
              </span>
            </div>
            <p className="text-xs sm:text-sm font-chakra font-medium mt-0.5 tracking-wide">{currentHeadline}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'GCS Audio Annunciator Active' : 'GCS Audio Muted'}
            className="p-1.5 rounded bg-black/40 hover:bg-black/60 text-slate-300 border border-[#243b59] transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => setShowLogModal(!showLogModal)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0b1524] hover:bg-[#122238] border border-[#223957] text-xs font-rajdhani font-bold tracking-wider text-slate-200 uppercase"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>EVENT LOG ({alerts.length})</span>
            {showLogModal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Alert Log Drawer */}
      {showLogModal && (
        <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 flex flex-col space-y-2 animate-fadeIn drdo-card">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#18263a] text-xs font-tech">
            <span className="text-slate-400 uppercase tracking-wider">HISTORICAL GCS TELEMETRY EVENT LOG // ATR CHITRADURGA</span>
            {onAcknowledgeAlerts && (
              <button
                onClick={onAcknowledgeAlerts}
                className="text-[10px] font-tech text-cyan-400 hover:text-cyan-300 underline uppercase"
              >
                ACKNOWLEDGE & CLEAR LOG
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs font-tech">
            {alerts.length === 0 ? (
              <div className="text-slate-500 text-[11px] py-2 text-center font-chakra">No alerts logged. System operating inside nominal flight envelope.</div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-2 rounded border flex flex-wrap items-center justify-between gap-2 ${
                    al.level === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : al.level === 'WARNING'
                      ? 'bg-amber-950/25 border-amber-800/60 text-amber-200'
                      : 'bg-[#070c17] border-[#16253a] text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono">{al.timestamp}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                        al.level === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : al.level === 'WARNING'
                          ? 'bg-amber-600 text-black'
                          : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {al.subsystem}
                    </span>
                    <span className="font-chakra font-semibold">{al.message}</span>
                  </div>

                  <div className="text-[10px] font-chakra text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    DIRECTIVE: <strong className="text-slate-200">{al.actionRequired}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
