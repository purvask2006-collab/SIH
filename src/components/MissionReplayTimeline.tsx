import React, { useState, useEffect } from 'react';
import { REPLAY_TIMELINE, MissionReplayPoint } from '../services/missionService';
import { History, Play, Pause, RotateCcw, FastForward, Film, Disc } from 'lucide-react';
import { OperatingControls, FaultType } from '../types/engine';

interface MissionReplayTimelineProps {
  onReplayPointSelect: (point: MissionReplayPoint) => void;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
}

export const MissionReplayTimeline: React.FC<MissionReplayTimelineProps> = ({
  onReplayPointSelect,
  isLiveMode,
  onToggleLiveMode,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const points = REPLAY_TIMELINE;
  const currentPoint = points[selectedIndex];

  // Auto-playback when playing in replay mode
  useEffect(() => {
    if (!isPlaying || isLiveMode) return;

    const interval = setInterval(() => {
      setSelectedIndex((prev) => {
        const next = (prev + 1) % points.length;
        onReplayPointSelect(points[next]);
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlaying, isLiveMode, points, onReplayPointSelect]);

  const handleSeek = (index: number) => {
    setSelectedIndex(index);
    if (isLiveMode) {
      onToggleLiveMode();
    }
    onReplayPointSelect(points[index]);
  };

  const togglePlay = () => {
    if (isLiveMode) {
      onToggleLiveMode();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-rajdhani font-bold tracking-widest text-slate-200 uppercase">
            [SYS.FDR-08] CRASH-SURVIVABLE SOLID-STATE FLIGHT DATA RECORDER (SSFDR)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Switch Pill */}
          <button
            onClick={onToggleLiveMode}
            className={`px-2.5 py-1 rounded text-[10px] font-tech font-bold transition-all border uppercase ${
              isLiveMode
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-[#070c17] border-[#18263a] text-slate-400 hover:text-white'
            }`}
          >
            {isLiveMode ? '● LIVE SATCOM TELEMETRY' : 'PAUSED (HISTORIC BLACKBOX REPLAY)'}
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLiveMode}
            className={`p-1.5 rounded text-xs font-tech transition-colors border ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                : 'bg-[#070c17] border-[#18263a] text-slate-300 hover:text-white disabled:opacity-40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        </div>
      </div>

      {/* Timeline Scrubber Controls */}
      <div className="space-y-2 pt-1">
        {/* Scrubber track with markers */}
        <div className="relative flex items-center justify-between px-2">
          <div className="absolute left-3 right-3 h-1 bg-[#142236] rounded-full z-0" />

          {points.map((pt, idx) => {
            const isSelected = selectedIndex === idx && !isLiveMode;
            const isFaulty = pt.fault !== 'NORMAL';

            return (
              <button
                key={pt.minute}
                onClick={() => handleSeek(idx)}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-cyan-400 border-white scale-125 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                      : isFaulty
                      ? 'bg-rose-950 border-rose-500 group-hover:scale-110'
                      : 'bg-[#070c17] border-[#223956] group-hover:border-cyan-400'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-slate-950' : isFaulty ? 'bg-rose-400' : 'bg-slate-400'
                    }`}
                  />
                </div>

                <span
                  className={`text-[9px] font-tech mt-1.5 transition-colors ${
                    isSelected
                      ? 'text-cyan-300 font-bold'
                      : isFaulty
                      ? 'text-rose-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {pt.timeStr}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Replay Snapshot Info */}
        <div className="p-2.5 rounded bg-[#050a14] border border-[#16253a] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 font-tech">
            <span className="text-slate-400 uppercase">TELEMETRY FRAME T+{currentPoint.timeStr}:</span>
            <span className="text-white font-bold">{currentPoint.phase}</span>
            {currentPoint.fault !== 'NORMAL' && (
              <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 text-[9px] font-bold uppercase">
                IN-FLIGHT ANOMALY LOGGED
              </span>
            )}
          </div>
          <div className="text-slate-300 text-[11px] font-chakra">{currentPoint.eventDescription}</div>
        </div>
      </div>
    </div>
  );
};
