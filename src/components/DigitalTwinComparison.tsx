import React from 'react';
import { DigitalTwinComparisonItem } from '../types/engine';
import { GitCompare, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';

interface DigitalTwinComparisonProps {
  items: DigitalTwinComparisonItem[];
  anomalyScore: number;
}

export const DigitalTwinComparison: React.FC<DigitalTwinComparisonProps> = ({
  items,
  anomalyScore,
}) => {
  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <GitCompare className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h2 className="text-xs font-chakra font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
            [HEALTH MONITORING] DIGITAL TWIN (PHYSICS MODEL) vs ACTUAL SENSOR RESIDUALS
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-tech">
          <span className="text-slate-600 dark:text-slate-400 font-chakra font-medium">L2 RESIDUAL:</span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold border ${
              anomalyScore > 0.6
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-400'
                : anomalyScore > 0.28
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
            }`}
          >
            {anomalyScore.toFixed(3)} [{(anomalyScore * 100).toFixed(1)}%]
          </span>
        </div>
      </div>

      {/* Anomaly Score Progress Indicator */}
      <div className="bg-[#070c17] p-2.5 rounded border border-[#18263a] space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-tech">
          <span className="text-slate-400">PHYSICS RESIDUAL DISTANCE METRIC (NORM-2 RESIDUAL VECTOR)</span>
          <span className="text-slate-300">
            NOMINAL: &lt;0.280 | WARN: <span className="text-amber-400 font-bold">0.300</span> | ABORT:{' '}
            <span className="text-rose-400 font-bold">0.650</span>
          </span>
        </div>
        <div className="w-full h-2 bg-[#040812] border border-[#142236] rounded-sm overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              anomalyScore > 0.65
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                : anomalyScore > 0.3
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
            }`}
            style={{ width: `${Math.min(100, anomalyScore * 100)}%` }}
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded border border-[#18263a] bg-[#070c17]">
        <table className="w-full text-left text-xs font-tech">
          <thead className="bg-[#0b1424] text-slate-400 border-b border-[#1a2d47] text-[10px] uppercase font-chakra tracking-wider">
            <tr>
              <th className="py-2 px-3 font-bold">CHANNEL / PARAMETER</th>
              <th className="py-2 px-3 font-bold text-right">MODEL EXPECTED</th>
              <th className="py-2 px-3 font-bold text-right">CAN TELEMETRY</th>
              <th className="py-2 px-3 font-bold text-right">RESIDUAL (Δ)</th>
              <th className="py-2 px-3 font-bold text-center">LIMIT CHECK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#142338]">
            {items.map((item) => {
              const hasResidual = Math.abs(item.residual) > 0.01;
              const sign = item.residual > 0 ? '+' : '';

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-[#0c1626] transition-colors ${
                    item.status === 'CRITICAL'
                      ? 'bg-rose-950/20'
                      : item.status === 'WARNING'
                      ? 'bg-amber-950/15'
                      : ''
                  }`}
                >
                  <td className="py-2 px-3 font-rajdhani font-semibold text-slate-200 tracking-wide">
                    {item.name}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {item.expected} {item.unit}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-white">
                    {item.actual} {item.unit}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      item.status === 'CRITICAL'
                        ? 'text-rose-400'
                        : item.status === 'WARNING'
                        ? 'text-amber-400'
                        : hasResidual
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {sign}
                    {item.residual} {item.unit}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        item.status === 'CRITICAL'
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          : item.status === 'WARNING'
                          ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                          : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
