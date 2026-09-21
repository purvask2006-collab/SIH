import React from 'react';
import {
  Layers,
  Activity,
  Cpu,
  Sliders,
  Compass,
  Grid,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export type DashboardTabId = 'overview' | 'diagnostics' | 'controls' | 'mission' | 'all';

interface TabItem {
  id: DashboardTabId;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'normal' | 'warn' | 'crit';
}

interface DashboardTabBarProps {
  activeTab: DashboardTabId;
  onSelectTab: (tab: DashboardTabId) => void;
  anomalyScore: number;
  activeFault: string;
  theme: 'light' | 'dark';
}

export const DashboardTabBar: React.FC<DashboardTabBarProps> = ({
  activeTab,
  onSelectTab,
  anomalyScore,
  activeFault,
  theme,
}) => {
  const isLight = theme === 'light';
  const hasFault = activeFault !== 'NORMAL';

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Cockpit & 3D Twin',
      sublabel: '3D Engine & Real-Time Gauges',
      icon: Activity,
    },
    {
      id: 'diagnostics',
      label: 'AI Diagnostics & Residuals',
      sublabel: 'Expected vs Actual & RUL',
      icon: Cpu,
      badge: hasFault
        ? `${(anomalyScore * 100).toFixed(0)}% Anomaly`
        : undefined,
      badgeType: anomalyScore > 0.6 ? 'crit' : anomalyScore > 0.28 ? 'warn' : 'normal',
    },
    {
      id: 'controls',
      label: 'Flight Controls & Fault Lab',
      sublabel: 'Throttle, Altitude & Fault Injection',
      icon: Sliders,
      badge: hasFault ? 'Fault Injected' : undefined,
      badgeType: hasFault ? 'warn' : undefined,
    },
    {
      id: 'mission',
      label: 'Mission & Flight Recorder',
      sublabel: 'Phases, What-If & FDR Replay',
      icon: Compass,
    },
    {
      id: 'all',
      label: 'All Modules',
      sublabel: 'Unified Master GCS',
      icon: Grid,
    },
  ];

  return (
    <nav
      aria-label="Dashboard views"
      className={`w-full rounded-xl border p-1.5 flex flex-wrap items-center gap-1.5 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#091220] border-[#1b2f4a] shadow-md'
      }`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex-1 min-w-[170px] sm:min-w-[190px] px-3.5 py-2 rounded-lg text-left transition-all relative flex items-center space-x-2.5 ${
              isActive
                ? isLight
                  ? 'bg-cyan-700 text-white shadow-sm'
                  : 'bg-[#122744] text-white border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-[#0e1c31] text-slate-300'
            }`}
          >
            <div
              className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${
                isActive
                  ? isLight
                    ? 'bg-cyan-800 text-white'
                    : 'bg-cyan-500/20 text-cyan-300'
                  : isLight
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-[#060c16] text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`text-xs font-chakra font-bold tracking-wide truncate ${
                    isActive
                      ? 'text-white'
                      : isLight
                      ? 'text-slate-900'
                      : 'text-slate-100'
                  }`}
                >
                  {tab.label}
                </span>

                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-tech font-bold uppercase shrink-0 ${
                      tab.badgeType === 'crit'
                        ? 'bg-rose-500 text-white'
                        : tab.badgeType === 'warn'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <div
                className={`text-[10px] font-sans truncate ${
                  isActive
                    ? isLight
                      ? 'text-cyan-100'
                      : 'text-cyan-200/80'
                    : isLight
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {tab.sublabel}
              </div>
            </div>

            {/* Active Indicator Bar */}
            {isActive && (
              <span
                className="absolute bottom-0 left-4 right-4 h-0.5 bg-white/70 rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
