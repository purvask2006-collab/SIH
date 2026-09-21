import React from 'react';
import { FaultType } from '../types/engine';
import {
  AlertOctagon,
  CheckCircle2,
  Droplets,
  Flame,
  Gauge,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';

interface FaultInjectionPanelProps {
  activeFault: FaultType;
  onSelectFault: (fault: FaultType) => void;
  faultSeverity: number;
  onSeverityChange: (sev: number) => void;
  disabled?: boolean;
}

interface FaultButtonDef {
  type: FaultType;
  code: string;
  name: string;
  badge: string;
  desc: string;
  symptoms: string[];
  severityLevel: 'NONE' | 'LOW' | 'MED' | 'HIGH';
  icon: React.ComponentType<{ className?: string }>;
}

export const FAULT_BUTTONS: FaultButtonDef[] = [
  {
    type: 'NORMAL',
    code: 'FLT-00',
    name: 'NOMINAL MIL-FLIGHT BASELINE',
    badge: 'BASELINE',
    desc: 'Unperturbed flight operating condition within DRDO-ADE envelope.',
    symptoms: ['Symmetric cylinder thermal balance', 'Hydrodynamic oil film nominal', 'Zero CAN residual'],
    severityLevel: 'NONE',
    icon: CheckCircle2,
  },
  {
    type: 'INJECTOR_DEGRADATION',
    code: 'FLT-01',
    name: 'INJECTOR #2 COKING DEGRADE',
    badge: 'TARGET FAULT',
    desc: 'Coking & spray pattern restriction on Cylinder #2 injector orifice.',
    symptoms: ['Fuel mass flow erratic', 'EGT thermal gradient +45°C', 'Cyclic vibration +1.5g RMS'],
    severityLevel: 'MED',
    icon: Droplets,
  },
  {
    type: 'MISFIRE',
    code: 'FLT-02',
    name: 'CYLINDER COMBUSTION MISFIRE',
    badge: 'IGNITION / COIL',
    desc: 'Intermittent magneto spark ignition loss or cylinder flameout.',
    symptoms: ['RPM instability (±150 RPM)', 'Vibration transient > 4.5g', 'EGT rapid fluctuation'],
    severityLevel: 'HIGH',
    icon: Zap,
  },
  {
    type: 'LUBRICATION_FAILURE',
    code: 'FLT-03',
    name: 'LUBRICATION PRESSURE COLLAPSE',
    badge: 'CRITICAL',
    desc: 'Pressure relief valve seizure or scavenge line oil starvation.',
    symptoms: ['Oil pressure collapses < 2.0 bar', 'Oil sump temp > 130°C', 'Friction boundary regime'],
    severityLevel: 'HIGH',
    icon: Droplets,
  },
  {
    type: 'OVERHEATING',
    code: 'FLT-04',
    name: 'RAM-AIR COOLING BAFFLE LOSS',
    badge: 'THERMAL RUNAWAY',
    desc: 'Cylinder duct blockage or aerodynamic cooling baffle failure at altitude.',
    symptoms: ['CHT exceeds 210°C redline', 'EGT climbs > 820°C', 'Piston scuffing risk'],
    severityLevel: 'HIGH',
    icon: Flame,
  },
  {
    type: 'VIBRATION_ANOMALY',
    code: 'FLT-05',
    name: 'PROP DYNAMIC ROTOR UNBALANCE',
    badge: 'AERO-MECHANICAL',
    desc: 'Bearing raceway micro-spalling or propeller blade pitch imbalance.',
    symptoms: ['Harmonic vibration > 5.0g RMS', 'Thermal channels stay nominal', 'Shaft fatigue stress'],
    severityLevel: 'MED',
    icon: Gauge,
  },
  {
    type: 'SENSOR_DRIFT',
    code: 'FLT-06',
    name: 'AVIONICS SENSOR BIAS DRIFT',
    badge: 'CAN AVIONICS',
    desc: 'Thermocouple reference cold-junction drift / analog ground loop bias.',
    symptoms: ['Only CHT deviates +35°C', 'Correlated channels stay nominal', 'AI sensor-isolation flag'],
    severityLevel: 'LOW',
    icon: Radio,
  },
];

export const FaultInjectionPanel: React.FC<FaultInjectionPanelProps> = ({
  activeFault,
  onSelectFault,
  faultSeverity,
  onSeverityChange,
  disabled = false,
}) => {
  return (
    <div className="w-full bg-[#0a1120] rounded border border-[#1c2e47] p-3 sm:p-3.5 flex flex-col space-y-3 relative shadow-[0_4px_16px_rgba(0,0,0,0.4)] drdo-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1b2a40]">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-rajdhani font-bold tracking-widest text-slate-200 uppercase">
            [SYS.HIL-05] HARDWARE-IN-THE-LOOP (HIL) FAULT INJECTION RIG
          </h2>
        </div>

        {/* Severity Selector */}
        <div className="flex items-center space-x-2 text-xs font-tech">
          <span className="text-slate-400 text-[10px] uppercase">SEVERITY LEVEL:</span>
          <div className="flex items-center space-x-1">
            {[0.4, 0.75, 1.0].map((sev) => (
              <button
                key={sev}
                disabled={disabled || activeFault === 'NORMAL'}
                onClick={() => onSeverityChange(sev)}
                className={`px-2 py-0.5 rounded text-[10px] font-tech transition-colors border ${
                  faultSeverity === sev && activeFault !== 'NORMAL'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-[#070c17] border-[#18263a] text-slate-400 hover:text-white hover:border-[#223b5c]'
                }`}
              >
                {sev === 0.4 ? 'STAGE I (40%)' : sev === 0.75 ? 'STAGE II (75%)' : 'STAGE III (100%)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {FAULT_BUTTONS.map((item) => {
          const isSelected = activeFault === item.type;
          const Icon = item.icon;

          let activeStyle = 'border-[#18263a] bg-[#070c17] hover:bg-[#0c1626] hover:border-[#233a59]';
          if (isSelected) {
            if (item.type === 'NORMAL') {
              activeStyle = 'border-emerald-500 bg-[#051c16] shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500';
            } else if (item.type === 'SENSOR_DRIFT') {
              activeStyle = 'border-cyan-400 bg-[#061826] shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400';
            } else {
              activeStyle = 'border-rose-500 bg-[#1c0810] shadow-[0_0_12px_rgba(244,63,94,0.3)] ring-1 ring-rose-500';
            }
          }

          return (
            <button
              key={item.type}
              disabled={disabled}
              onClick={() => onSelectFault(item.type)}
              className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between ${activeStyle} ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        item.type === 'NORMAL'
                          ? 'text-emerald-400'
                          : item.type === 'SENSOR_DRIFT'
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    />
                    <span
                      className={`font-rajdhani text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      [{item.code}]
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-tech px-1.5 py-0.2 rounded border font-bold ${
                      item.type === 'NORMAL'
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                        : item.type === 'SENSOR_DRIFT'
                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60'
                        : 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                <div className="text-xs font-chakra font-semibold text-slate-200 mb-1 leading-snug">
                  {item.name}
                </div>

                <p className="text-[10px] font-chakra text-slate-400 leading-snug line-clamp-2">
                  {item.desc}
                </p>
              </div>

              {/* Physical Symptoms bullet */}
              <div className="mt-2 pt-1.5 border-t border-[#16253a] flex flex-wrap gap-1">
                {item.symptoms.slice(0, 2).map((symp, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-tech text-slate-400 bg-[#040812] border border-[#142336] px-1.5 py-0.2 rounded"
                  >
                    › {symp}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
