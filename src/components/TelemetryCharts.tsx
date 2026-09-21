import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TelemetryData } from '../types/engine';
import { Activity, Gauge, TrendingUp, Filter } from 'lucide-react';

interface TelemetryChartsProps {
  history: TelemetryData[];
  latest: TelemetryData;
  selectedChannel?: string | null;
  onSelectChannel?: (channel: string) => void;
}

interface ChannelDef {
  key: keyof TelemetryData;
  code: string;
  name: string;
  short: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  warnHigh?: number;
  warnLow?: number;
  critHigh?: number;
  critLow?: number;
  nominalText: string;
}

export const TELEMETRY_CHANNELS: ChannelDef[] = [
  {
    key: 'rpm',
    code: 'CH-01',
    name: 'Crankshaft Rotational Speed',
    short: 'RPM',
    unit: 'RPM',
    color: '#00e5ff', // tactical cyan
    min: 1500,
    max: 6200,
    warnHigh: 5800,
    critHigh: 6000,
    nominalText: '2200 - 5500 RPM',
  },
  {
    key: 'cht',
    code: 'CH-02',
    name: 'Cylinder Head Temperature (CHT-Max)',
    short: 'CHT',
    unit: '°C',
    color: '#fb923c', // amber-400
    min: 100,
    max: 250,
    warnHigh: 185,
    critHigh: 210,
    nominalText: '130 - 180 °C',
  },
  {
    key: 'egt',
    code: 'CH-03',
    name: 'Exhaust Gas Temperature (EGT-Avg)',
    short: 'EGT',
    unit: '°C',
    color: '#f87171', // red-400
    min: 550,
    max: 920,
    warnHigh: 810,
    critHigh: 860,
    nominalText: '680 - 780 °C',
  },
  {
    key: 'oilPressure',
    code: 'CH-04',
    name: 'Hydrodynamic Oil Pressure',
    short: 'P-OIL',
    unit: 'bar',
    color: '#10b981', // emerald-400
    min: 0,
    max: 7,
    warnLow: 3.0,
    critLow: 2.0,
    nominalText: '3.8 - 5.2 bar',
  },
  {
    key: 'oilTemperature',
    code: 'CH-05',
    name: 'Sump Oil Temperature',
    short: 'T-OIL',
    unit: '°C',
    color: '#eab308', // yellow-500
    min: 50,
    max: 160,
    warnHigh: 118,
    critHigh: 135,
    nominalText: '80 - 110 °C',
  },
  {
    key: 'fuelFlow',
    code: 'CH-06',
    name: 'Fuel Consumption Rate',
    short: 'FFLOW',
    unit: 'L/h',
    color: '#a855f7', // purple-500
    min: 5,
    max: 45,
    warnHigh: 38,
    critHigh: 42,
    nominalText: '12 - 36 L/h',
  },
  {
    key: 'vibration',
    code: 'CH-07',
    name: 'Crankcase Accelerometer RMS',
    short: 'VIB',
    unit: 'g',
    color: '#f43f5e', // rose-500
    min: 0,
    max: 7.5,
    warnHigh: 3.0,
    critHigh: 5.0,
    nominalText: '0.8 - 2.2 g RMS',
  },
];

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  history,
  latest,
  selectedChannel,
  onSelectChannel,
}) => {
  const [activeChannelKey, setActiveChannelKey] = useState<string>('rpm');

  const currentKey = selectedChannel || activeChannelKey;
  const activeDef =
    TELEMETRY_CHANNELS.find((c) => c.key === currentKey) || TELEMETRY_CHANNELS[0];

  const handleChannelSelect = (key: string) => {
    setActiveChannelKey(key);
    if (onSelectChannel) onSelectChannel(key);
  };

  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            [HEALTH MONITORING] REAL-TIME 50Hz AERO PISTON TELEMETRY STREAM & LIMITS
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-tech text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">50 HZ DUPLEX CAN 2.0B</span>
          </span>
          <span>•</span>
          <span>BUFFER: 45 SEC</span>
        </div>
      </div>

      {/* Channel Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
        {TELEMETRY_CHANNELS.map((ch) => {
          const isActive = ch.key === activeDef.key;
          const val = latest[ch.key];
          const isWarning =
            (ch.warnHigh && (val as number) > ch.warnHigh) ||
            (ch.warnLow && (val as number) < ch.warnLow);
          const isCritical =
            (ch.critHigh && (val as number) > ch.critHigh) ||
            (ch.critLow && (val as number) < ch.critLow);

          return (
            <button
              key={ch.key}
              onClick={() => handleChannelSelect(ch.key as string)}
              className={`p-2 rounded border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#0f1f33] border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50'
                  : 'bg-[#070c17] border-[#16253a] hover:bg-[#0d1626] hover:border-[#223b5c]'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] font-tech">
                <span className="text-cyan-400/80 font-bold">{ch.code}</span>
                {isCritical ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                ) : isWarning ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ch.color }}
                  />
                )}
              </div>
              <div className="text-[10px] font-chakra font-semibold text-slate-300 truncate mt-0.5">
                {ch.short}
              </div>
              <div className="mt-0.5">
                <span
                  className={`font-tech text-xs sm:text-sm font-bold ${
                    isCritical
                      ? 'text-rose-400'
                      : isWarning
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {typeof val === 'number' ? (val < 10 && val > 0 && !Number.isInteger(val) ? val.toFixed(2) : val.toLocaleString()) : val}
                </span>
                <span className="text-[9px] text-slate-500 ml-1 font-tech">{ch.unit}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Focus Chart */}
      <div className="bg-[#060a14] rounded border border-[#16253a] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs font-rajdhani">
          <div className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: activeDef.color }}
            />
            <span className="font-bold text-white tracking-wider uppercase text-sm">
              [{activeDef.code}] {activeDef.name}
            </span>
            <span className="text-slate-400 font-tech text-xs">({activeDef.unit})</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-tech text-slate-400">
            <span>
              MIL-ENVELOPE: <span className="text-emerald-400">{activeDef.nominalText}</span>
            </span>
            <span>|</span>
            <span>
              LIVE:{' '}
              <span className="text-cyan-300 font-bold">
                {latest[activeDef.key]} {activeDef.unit}
              </span>
            </span>
          </div>
        </div>

        {/* Recharts Component */}
        <div className="w-full h-44 sm:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="timeStr"
                stroke="#334155"
                fontSize={9}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[activeDef.min, activeDef.max]}
                stroke="#334155"
                fontSize={9}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070c17',
                  borderColor: '#1e2f4a',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'Share Tech Mono, monospace',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />

              {activeDef.warnHigh && (
                <ReferenceLine
                  y={activeDef.warnHigh}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `WARN HIGH: ${activeDef.warnHigh}`,
                    fill: '#f59e0b',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}
              {activeDef.critHigh && (
                <ReferenceLine
                  y={activeDef.critHigh}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `CRIT ABORT: ${activeDef.critHigh}`,
                    fill: '#ef4444',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}
              {activeDef.critLow && (
                <ReferenceLine
                  y={activeDef.critLow}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `MIN CRIT: ${activeDef.critLow}`,
                    fill: '#ef4444',
                    fontSize: 9,
                    position: 'insideBottomRight',
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey={activeDef.key}
                stroke={activeDef.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
