import React from 'react';
import { TelemetryData } from '../types/engine';

interface AerospaceGaugesRowProps {
  telemetry: TelemetryData;
  history: TelemetryData[];
}

interface GaugeConfig {
  id: string;
  label: string;
  sublabel: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warnHigh?: number;
  warnLow?: number;
  critHigh?: number;
  critLow?: number;
  historyKey: keyof TelemetryData;
  decimals?: number;
}

export const AerospaceGaugesRow: React.FC<AerospaceGaugesRowProps> = ({
  telemetry,
  history,
}) => {
  const gauges: GaugeConfig[] = [
    {
      id: 'rpm',
      label: 'RPM',
      sublabel: 'Crankshaft Speed',
      value: telemetry.rpm,
      unit: 'RPM',
      min: 0,
      max: 6500,
      warnHigh: 5800,
      critHigh: 6100,
      historyKey: 'rpm',
      decimals: 0,
    },
    {
      id: 'cht',
      label: 'CHT',
      sublabel: 'Cylinder Head Temp',
      value: telemetry.cht,
      unit: '°C',
      min: 50,
      max: 240,
      warnHigh: 175,
      critHigh: 200,
      historyKey: 'cht',
      decimals: 1,
    },
    {
      id: 'egt',
      label: 'EGT',
      sublabel: 'Exhaust Gas Temp',
      value: telemetry.egt,
      unit: '°C',
      min: 500,
      max: 1000,
      warnHigh: 840,
      critHigh: 890,
      historyKey: 'egt',
      decimals: 0,
    },
    {
      id: 'oilPress',
      label: 'OIL PRESSURE',
      sublabel: 'Lubrication Line',
      value: telemetry.oilPressure,
      unit: 'bar',
      min: 0,
      max: 8.0,
      warnLow: 2.8,
      critLow: 1.9,
      warnHigh: 6.5,
      critHigh: 7.2,
      historyKey: 'oilPressure',
      decimals: 2,
    },
    {
      id: 'oilTemp',
      label: 'OIL TEMP',
      sublabel: 'Sump Temperature',
      value: telemetry.oilTemperature,
      unit: '°C',
      min: 40,
      max: 150,
      warnHigh: 118,
      critHigh: 132,
      historyKey: 'oilTemperature',
      decimals: 1,
    },
    {
      id: 'vibration',
      label: 'VIBRATION',
      sublabel: 'Engine Mount RMS',
      value: telemetry.vibration,
      unit: 'mm/s',
      min: 0,
      max: 15.0,
      warnHigh: 4.8,
      critHigh: 7.5,
      historyKey: 'vibration',
      decimals: 2,
    },
  ];

  return (
    <section aria-label="Engine Instrumentation" className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {gauges.map((g) => {
          // Normalize value between min and max (0 to 1)
          const clampedVal = Math.min(Math.max(g.value, g.min), g.max);
          const ratio = (clampedVal - g.min) / (g.max - g.min);

          // Evaluate warning / critical
          let isCritical = false;
          let isWarning = false;
          if (g.critHigh !== undefined && g.value >= g.critHigh) isCritical = true;
          if (g.critLow !== undefined && g.value <= g.critLow) isCritical = true;
          if (!isCritical && g.warnHigh !== undefined && g.value >= g.warnHigh) isWarning = true;
          if (!isCritical && g.warnLow !== undefined && g.value <= g.warnLow) isWarning = true;

          // Rim colors based on exact prompt:
          // Deep navy (#1a3a5c), teal (#00897b), amber (#ff8c00), alert red (#e53935)
          const rimColor = isCritical
            ? '#e53935'
            : isWarning
            ? '#ff8c00'
            : '#00897b';

          // Circular gauge math (240 degree arc from 150 deg to 390 deg)
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const arcFraction = 0.75; // 270 degree dial arc
          const strokeDash = arcFraction * circumference;
          const strokeOffset = strokeDash * (1 - ratio);

          // Sparkline recent points (up to last 16 samples)
          const recentPoints = history.slice(-16).map((h) => {
            const raw = Number(h[g.historyKey]) || 0;
            return Math.min(Math.max(raw, g.min), g.max);
          });

          let sparklinePath = '';
          let sparklineArea = '';
          if (recentPoints.length > 1) {
            const width = 120;
            const height = 24;
            const pts = recentPoints.map((pt, i) => {
              const x = (i / (recentPoints.length - 1)) * width;
              const y = height - ((pt - g.min) / (g.max - g.min)) * height;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            });
            sparklinePath = `M ${pts.join(' L ')}`;
            sparklineArea = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`;
          }

          return (
            <div
              key={g.id}
              className="bg-white rounded-xl border border-[#e5e9f0] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(26,58,92,0.06)] transition-all flex flex-col items-center justify-between min-h-[200px]"
            >
              {/* Header Label */}
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#1a3a5c] tracking-wider uppercase">
                  {g.label}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCritical
                      ? 'bg-[#e53935] animate-ping'
                      : isWarning
                      ? 'bg-[#ff8c00]'
                      : 'bg-[#00897b]'
                  }`}
                  title={isCritical ? 'Critical Threshold' : isWarning ? 'Caution Warning' : 'Nominal Envelope'}
                />
              </div>

              {/* Circular Real-Time Gauge with White Face, Thin Colored Rim, and Dark Center Readout */}
              <div className="relative w-24 h-24 my-1 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Gauge background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="#ffffff"
                    stroke="#f1f5f9"
                    strokeWidth="5"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeLinecap="round"
                  />
                  {/* Thin colored rim */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={rimColor}
                    strokeWidth="4.5"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                </svg>

                {/* Center Dark Numeric Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-lg font-bold text-[#1a3a5c] tracking-tight leading-none">
                    {g.decimals === 0
                      ? Math.round(g.value).toLocaleString()
                      : g.value.toFixed(g.decimals)}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5 tracking-wider">
                    {g.unit}
                  </span>
                </div>
              </div>

              {/* Sparkline Trend Graph Below */}
              <div className="w-full mt-1 pt-1.5 border-t border-slate-100 flex flex-col items-center">
                <div className="w-full h-6 relative overflow-hidden">
                  {sparklinePath && (
                    <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id={`grad-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={rimColor} stopOpacity="0.18" />
                          <stop offset="100%" stopColor={rimColor} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={sparklineArea} fill={`url(#grad-${g.id})`} />
                      <path
                        d={sparklinePath}
                        fill="none"
                        stroke={rimColor}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div className="w-full flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span className="truncate max-w-[80px]">{g.sublabel}</span>
                  <span
                    className={`font-semibold ${
                      isCritical
                        ? 'text-[#e53935]'
                        : isWarning
                        ? 'text-[#ff8c00]'
                        : 'text-[#00897b]'
                    }`}
                  >
                    {isCritical ? 'CRIT' : isWarning ? 'WARN' : 'NOM'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
