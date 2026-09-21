import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TelemetryData } from '../types/engine';
import { Activity, Eye, EyeOff } from 'lucide-react';

interface AerospaceMultiTraceChartProps {
  history: TelemetryData[];
  latest: TelemetryData;
}

interface TraceDef {
  key: keyof TelemetryData;
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
}

export const AerospaceMultiTraceChart: React.FC<AerospaceMultiTraceChartProps> = ({
  history,
  latest,
}) => {
  const traces: TraceDef[] = [
    { key: 'rpm', label: 'RPM', unit: 'RPM', color: '#00897b', min: 0, max: 6500 },
    { key: 'cht', label: 'CHT (Cyl Head)', unit: '°C', color: '#ff8c00', min: 50, max: 250 },
    { key: 'egt', label: 'EGT (Exhaust)', unit: '°C', color: '#1a3a5c', min: 500, max: 1000 },
    { key: 'oilPressure', label: 'Oil Pressure', unit: 'bar', color: '#0284c7', min: 0, max: 8 },
    { key: 'vibration', label: 'Vibration', unit: 'mm/s', color: '#e53935', min: 0, max: 15 },
  ];

  // Active traces state (all enabled by default)
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({
    rpm: true,
    cht: true,
    egt: true,
    oilPressure: true,
    vibration: true,
  });

  const toggleKey = (key: string) => {
    setActiveKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Prepare normalized chart data so all curves are cleanly comparable on a 0-100% scale,
  // while preserving raw values for the hover tooltip!
  const chartData = history.slice(-40).map((pt, index) => {
    const timeLabel = pt.timestamp
      ? new Date(pt.timestamp).toTimeString().split(' ')[0]
      : `T+${index}s`;

    const normalized: Record<string, any> = {
      index,
      time: timeLabel,
      raw: pt,
    };

    traces.forEach((t) => {
      const rawVal = Number(pt[t.key]) || 0;
      // Normalized between 0 and 100%
      const norm = ((rawVal - t.min) / (t.max - t.min)) * 100;
      normalized[`${String(t.key)}_norm`] = Math.min(Math.max(norm, 0), 100);
      normalized[String(t.key)] = rawVal;
    });

    return normalized;
  });

  // Custom Hover Tooltip with vertical cursor crosshair
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 shadow-lg text-xs space-y-1.5 z-50">
          <div className="font-mono text-slate-400 text-[10px] pb-1 border-b border-slate-100 flex items-center justify-between">
            <span>TIMESTAMP</span>
            <span className="font-bold text-slate-700">{dataPoint?.time}</span>
          </div>

          <div className="space-y-1">
            {traces
              .filter((t) => activeKeys[String(t.key)])
              .map((t) => {
                const val = dataPoint?.[String(t.key)];
                return (
                  <div key={t.key} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-slate-600 font-medium">{t.label}:</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {typeof val === 'number'
                        ? val < 10 && !Number.isInteger(val)
                          ? val.toFixed(2)
                          : Math.round(val).toLocaleString()
                        : val}{' '}
                      <span className="text-[10px] font-normal text-slate-400">{t.unit}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col space-y-3">
      {/* Chart Title & Interactive Trace Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#1a3a5c]" />
          <div>
            <h2 className="text-sm font-bold text-[#1a3a5c] tracking-tight uppercase">
              MULTI-SENSOR TELEMETRY WAVEFORM
            </h2>
            <p className="text-[11px] text-slate-500">
              Synchronized Real-Time Sensor Traces • 20 Hz Live Ingestion
            </p>
          </div>
        </div>

        {/* Clear Legend with Toggleable Sensor Trace Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {traces.map((t) => {
            const isActive = activeKeys[String(t.key)];
            const rawVal = latest[t.key];

            return (
              <button
                key={t.key}
                onClick={() => toggleKey(String(t.key))}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                  isActive
                    ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-xs'
                    : 'bg-white border-dashed border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
                title={`Click to toggle ${t.label}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? t.color : '#cbd5e1' }}
                />
                <span className="truncate max-w-[85px]">{t.label}</span>
                {isActive && (
                  <span className="font-mono text-[10px] font-bold text-slate-700 ml-1">
                    {typeof rawVal === 'number'
                      ? rawVal < 10 && !Number.isInteger(rawVal)
                        ? rawVal.toFixed(1)
                        : Math.round(rawVal)
                      : rawVal}
                  </span>
                )}
                {isActive ? (
                  <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-300 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent Time-Series Line Chart with Light Grid Lines and Vertical Cursor Line */}
      <div className="w-full h-52 sm:h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
          >
            {/* Light Grid Lines */}
            <CartesianGrid
              stroke="#f1f5f9"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `${v}%`}
            />

            {/* Subtle vertical cursor line that follows the data */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: '#94a3b8',
                strokeWidth: 1.2,
                strokeDasharray: '4 4',
              }}
            />

            {/* Render each active sensor trace line */}
            {traces.map((t) => {
              if (!activeKeys[String(t.key)]) return null;
              return (
                <Line
                  key={t.key}
                  type="monotone"
                  dataKey={`${String(t.key)}_norm`}
                  stroke={t.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    fill: t.color,
                  }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <span>Y-Axis: Normalized Subsystem Operating Range (0-100%)</span>
        <span className="font-mono">BUFFER: 40 SAMPLES @ 500ms</span>
      </div>
    </div>
  );
};
