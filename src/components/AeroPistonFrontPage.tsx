import React, { useState, useEffect, useRef } from 'react';
import {
  TelemetryData,
  EngineHealthScores,
  FaultType,
  AiDiagnosticResult,
  RulEstimate,
  OperatingControls,
} from '../types/engine';
import { Engine3DView } from './Engine3DView';
import {
  Activity,
  Gauge,
  Thermometer,
  Droplets,
  Flame,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Rotate3d,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Play,
  Pause,
  Layers,
  Cpu,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface AeroPistonFrontPageProps {
  telemetry: TelemetryData;
  telemetryHistory: TelemetryData[];
  health: EngineHealthScores;
  activeFault: FaultType;
  faultSeverity: number;
  diagnostic: AiDiagnosticResult;
  rul: RulEstimate;
  controls: OperatingControls;
  theme: 'light' | 'dark';
  onInjectFault: (fault: FaultType, severity?: number) => void;
  onNavigateTab?: (tab: string) => void;
}

interface CalloutAnnotation {
  id: string;
  name: string;
  subsystem: string;
  status: 'Normal' | 'Warning' | 'Critical';
  statusText: string;
  worldPos: [number, number, number];
  // Normalized 2D target anchor on canvas [x%, y%]
  anchor: [number, number];
  labelPos: [number, number];
  details: string;
}

export const AeroPistonFrontPage: React.FC<AeroPistonFrontPageProps> = ({
  telemetry,
  telemetryHistory,
  health,
  activeFault,
  faultSeverity,
  diagnostic,
  rul,
  controls,
  theme,
  onInjectFault,
  onNavigateTab,
}) => {
  const isLight = theme === 'light';

  // 3D Engine controls
  const [is3DAnimationActive, setIs3DAnimationActive] = useState<boolean>(true);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [cameraZoomLevel, setCameraZoomLevel] = useState<number>(1.0);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // SHAP Explanation Accordion state (expanded by default matching screenshot)
  const [isShapExpanded, setIsShapExpanded] = useState<boolean>(true);

  // "Ask Gemini" interactive state
  const [geminiQuery, setGeminiQuery] = useState<string>('Why is the engine health decreasing?');
  const [geminiResponse, setGeminiResponse] = useState<{
    query: string;
    answer: string;
    timestamp: string;
  } | null>(null);
  const [isAskingGemini, setIsAskingGemini] = useState<boolean>(false);

  // Interactive 3D Callout Points matching reference image:
  // Propeller Hub, Fuel Injector, ECU, Cylinder Head, Cooling Fins, Intake Manifold, Exhaust Manifold, Crankshaft
  const isInjectorFault = activeFault === 'INJECTOR_DEGRADATION';
  const isLubeFault = activeFault === 'LUBRICATION_FAILURE';

  const callouts: CalloutAnnotation[] = [
    {
      id: 'propeller-hub',
      name: 'Propeller Hub',
      subsystem: 'Propulsion',
      status: 'Normal',
      statusText: '(Normal)',
      worldPos: [0, 0.15, 1.88],
      anchor: [30, 36],
      labelPos: [23, 30],
      details: `Propeller RPM: ${Math.round(telemetry.rpm / 2.43)} RPM | Pitch: ${telemetry.propellerPitchDeg || 22}° | Carbon composite hub nominal`,
    },
    {
      id: 'fuel-injector',
      name: 'Fuel Injector',
      subsystem: 'Fuel System',
      status: isInjectorFault ? 'Warning' : 'Normal',
      statusText: isInjectorFault ? `(Warning: ${Math.round(faultSeverity * 100)}% Clogged)` : '(Normal)',
      worldPos: [0.55, 0.45, 0.35],
      anchor: [39, 17],
      labelPos: [35, 11],
      details: isInjectorFault
        ? `Cylinder 2 injector nozzle partially clogged. Fuel flow restricted to 3.8 L/h, generating local hot spot.`
        : `Electronic multipoint port injection nominal. Fuel pressure: 3.2 bar, Flow: 4.2 L/h.`,
    },
    {
      id: 'ecu',
      name: 'ECU',
      subsystem: 'Avionics',
      status: 'Normal',
      statusText: '(Normal)',
      worldPos: [0, 0.72, 0.25],
      anchor: [48, 15],
      labelPos: [46, 9],
      details: 'Dual Lane FADEC Engine Control Unit. All CAN bus sensor channels operating with 0 dropped frames.',
    },
    {
      id: 'cylinder-head',
      name: 'Cylinder Head',
      subsystem: 'Thermal',
      status: activeFault === 'OVERHEATING' ? 'Warning' : 'Normal',
      statusText: activeFault === 'OVERHEATING' ? '(Elevated 192°C)' : '(Normal)',
      worldPos: [1.2, 0.15, 0.4],
      anchor: [57, 18],
      labelPos: [56, 12],
      details: `Cylinder 2 CHT at 192°C. Spark plug voltage 24kV nominal. Liquid cooling jacket delta: +6.4°C.`,
    },
    {
      id: 'cooling-fins',
      name: 'Cooling Fins',
      subsystem: 'Cooling System',
      status: activeFault === 'OVERHEATING' ? 'Warning' : 'Normal',
      statusText: activeFault === 'OVERHEATING' ? '(Thermal Load)' : '(Normal)',
      worldPos: [1.1, 0.3, 0.4],
      anchor: [62, 28],
      labelPos: [68, 19],
      details: `Machined aluminum cooling fins on cylinders 1-4. Ram air convective cooling efficiency: 91%.`,
    },
    {
      id: 'intake-manifold',
      name: 'Intake Manifold',
      subsystem: 'Air Intake',
      status: 'Normal',
      statusText: '(Normal)',
      worldPos: [0.45, 0.65, 0.1],
      anchor: [63, 49],
      labelPos: [66, 40],
      details: `Manifold Absolute Pressure (MAP): ${telemetry.manifoldPressure || 1.6} bar. Turbo boost nominal.`,
    },
    {
      id: 'exhaust-manifold',
      name: 'Exhaust Manifold',
      subsystem: 'Exhaust',
      status: telemetry.egt > 760 ? 'Warning' : 'Normal',
      statusText: telemetry.egt > 760 ? '(Elevated EGT)' : '(Normal)',
      worldPos: [0.35, -0.45, -0.3],
      anchor: [56, 45],
      labelPos: [58, 48],
      details: `4-into-1 tuned stainless exhaust headers. EGT: ${telemetry.egt}°C (Pyrometer collector nominal).`,
    },
    {
      id: 'crankshaft',
      name: 'Crankshaft',
      subsystem: 'Mechanical',
      status: isLubeFault ? 'Critical' : 'Normal',
      statusText: isLubeFault ? '(Lube Deprived)' : '(Normal)',
      worldPos: [0, -0.1, 0.2],
      anchor: [47, 46],
      labelPos: [45, 47],
      details: `Forged alloy steel counterweighted crankshaft. Main bearing film clearance nominal at 0.045mm.`,
    },
  ];

  // Component Status Checklist (9 critical engine components matching screenshot)
  const componentStatuses = [
    { name: 'Piston & Rings', status: 'Normal', color: 'emerald' },
    { name: 'Connecting Rod', status: 'Normal', color: 'emerald' },
    { name: 'Crankshaft', status: isLubeFault ? 'Warning' : 'Normal', color: isLubeFault ? 'amber' : 'emerald' },
    { name: 'Cylinder Block', status: 'Normal', color: 'emerald' },
    { name: 'Cylinder Head', status: activeFault === 'OVERHEATING' ? 'Warning' : 'Normal', color: activeFault === 'OVERHEATING' ? 'amber' : 'emerald' },
    { name: 'Valves', status: 'Normal', color: 'emerald' },
    {
      name: 'Injector',
      status: isInjectorFault ? 'Warning' : 'Normal',
      color: isInjectorFault ? 'rose' : 'emerald',
    },
    {
      name: 'Cooling System',
      status: activeFault === 'OVERHEATING' ? 'Warning' : 'Normal',
      color: activeFault === 'OVERHEATING' ? 'amber' : 'emerald',
    },
    {
      name: 'Lubrication System',
      status: isLubeFault ? 'Critical' : 'Normal',
      color: isLubeFault ? 'rose' : 'emerald',
    },
  ];

  // 6 Cylinders temperature readings (exact to screenshot: C1: 184, C2: 192 (alert), C3: 181, C4: 178, C5: 176, C6: 173)
  const cylinderTemps = [
    { id: 'C1', temp: isInjectorFault ? 184 : 172, isAlert: false },
    { id: 'C2', temp: isInjectorFault ? 192 : 173, isAlert: isInjectorFault },
    { id: 'C3', temp: isInjectorFault ? 181 : 171, isAlert: false },
    { id: 'C4', temp: isInjectorFault ? 178 : 170, isAlert: false },
    { id: 'C5', temp: isInjectorFault ? 176 : 169, isAlert: false },
    { id: 'C6', temp: isInjectorFault ? 173 : 168, isAlert: false },
  ];

  // SHAP Feature Importance Bars (exact values from reference screenshot)
  const shapFeatures = [
    { name: 'Fuel Flow', delta: '+0.42', value: 0.42, color: '#f43f5e' }, // coral/red
    { name: 'Cylinder Temp', delta: '+0.31', value: 0.31, color: '#f97316' }, // orange
    { name: 'Vibration', delta: '+0.24', value: 0.24, color: '#f59e0b' }, // amber
    { name: 'RPM Variation', delta: '+0.15', value: 0.15, color: '#10b981' }, // green
    { name: 'Exhaust Temp', delta: '+0.08', value: 0.08, color: '#0284c7' }, // blue
  ];

  // Historical key parameters time-series (10 min trend matching reference screenshot)
  const keyParametersData = [
    { time: '18:20', rpm: 3180, oilTemp: 80, coolantTemp: 88, vibration: 0.16 },
    { time: '18:22', rpm: 3200, oilTemp: 81, coolantTemp: 89, vibration: 0.17 },
    { time: '18:24', rpm: 3210, oilTemp: 82, coolantTemp: 90, vibration: 0.18 },
    { time: '18:26', rpm: 3195, oilTemp: 82, coolantTemp: 91, vibration: 0.18 },
    { time: '18:28', rpm: 3205, oilTemp: 83, coolantTemp: 91, vibration: 0.19 },
    { time: '18:30', rpm: 3200, oilTemp: 82, coolantTemp: 91, vibration: 0.18 },
  ];

  // RUL Trend Projection (0h, 50h, 100h, 150h, 200h)
  const rulTrendPoints = [
    { h: '0h', rul: 180 },
    { h: '50h', rul: 165 },
    { h: '100h', rul: 142 },
    { h: '150h', rul: 126 },
    { h: '200h', rul: 108 },
  ];

  // Handle Ask Gemini query
  const handleAskGemini = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!geminiQuery.trim()) return;

    setIsAskingGemini(true);
    setTimeout(() => {
      let ans = '';
      if (geminiQuery.toLowerCase().includes('health') || geminiQuery.toLowerCase().includes('decreasing')) {
        ans =
          'Analysis: Cylinder #2 injector exhibits a 70% restriction in nozzle area, causing a localized lean combustion zone. Cylinder Head Temp (C2) has risen to 192°C with a +18°C delta over adjacent cylinders. Residual analysis indicates fuel flow is down to 4.2 L/h, reducing Predicted RUL from 168h to 126h. Recommendation: Cycle throttle down to 60%, prepare to land for injector ultrasonic cleaning and fuel rail filtration inspection.';
      } else if (geminiQuery.toLowerCase().includes('rul') || geminiQuery.toLowerCase().includes('remaining')) {
        ans =
          'Predicted RUL is currently 126 hours (down from 168 hours baseline). Degradation rate is currently 0.38 hours per flight hour due to thermal stress on Cylinder 2 valve guides. Weibull MTBF projection remains above the mission abort threshold of 50 hours.';
      } else {
        ans = `Telemetry telemetry shows engine speed at ${telemetry.rpm} RPM with ${telemetry.vibration}g vibration and ${telemetry.oilTemperature}°C oil temperature. Digital Twin residual cross-correlation confirms operational boundaries remain within UAV safe envelope.`;
      }
      setGeminiResponse({
        query: geminiQuery,
        answer: ans,
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsAskingGemini(false);
    }, 700);
  };

  // Reset 3D camera
  const handleResetCamera = () => {
    setCameraZoomLevel(1.0);
    setIsAutoRotating(false);
  };

  return (
    <div className="w-full flex flex-col space-y-3.5 animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* MAIN SECTION: 3-COLUMN AERO PISTON DASHBOARD (MATCHING SCREENSHOT) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Engine Telemetry (Live) + Engine Health       */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 flex flex-col space-y-3.5">
          {/* CARD 1: Engine Telemetry (Live) */}
          <div
            className={`rounded-xl border p-4 flex flex-col shadow-xs transition-colors ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-inherit">
              <div className="flex items-center space-x-2">
                <h3 className="font-chakra font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white">
                  Engine Telemetry
                </h3>
                <span className="text-xs font-chakra font-medium text-slate-500 dark:text-slate-400">
                  (Live)
                </span>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            {/* Parameter List: RPM, Torque, Oil Temp, Coolant Temp, Fuel Flow, Vibration, Manifold Pressure, Exhaust Gas Temp */}
            <div className="space-y-2.5">
              {/* 1. RPM */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-medium">RPM</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`font-tech font-bold text-base ${
                    telemetry.rpm > 3400 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Math.round(telemetry.rpm || 3200).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    rpm
                  </span>
                </div>
              </div>

              {/* 2. Torque */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-medium">Torque</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-tech font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {Math.round(telemetry.torqueNm || 125)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Nm
                  </span>
                </div>
              </div>

              {/* 3. Oil Temperature */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Oil Temperature</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`font-tech font-bold text-base ${
                    (telemetry.oilTemperature || 82) > 105 ? 'text-rose-600 dark:text-rose-400' : (telemetry.oilTemperature || 82) > 95 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Math.round(telemetry.oilTemperature || 82)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    °C
                  </span>
                </div>
              </div>

              {/* 4. Coolant Temperature */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  <span className="font-medium">Coolant Temperature</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`font-tech font-bold text-base ${
                    (telemetry.cht || 91) > 115 ? 'text-rose-600 dark:text-rose-400' : (telemetry.cht || 91) > 105 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Math.round(telemetry.cht || 91)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    °C
                  </span>
                </div>
              </div>

              {/* 5. Fuel Flow */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-medium">Fuel Flow</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-tech font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {Number(telemetry.fuelFlow || 4.2).toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    L/h
                  </span>
                </div>
              </div>

              {/* 6. Vibration */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Vibration</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`font-tech font-bold text-base ${
                    (telemetry.vibration || 0.18) > 0.4 ? 'text-rose-600 dark:text-rose-400' : (telemetry.vibration || 0.18) > 0.3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Number(telemetry.vibration || 0.18).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    g
                  </span>
                </div>
              </div>

              {/* 7. Manifold Pressure */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Gauge className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">Manifold Pressure</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-tech font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {Number(telemetry.turboBoostBar ? (1.0 + telemetry.turboBoostBar) : 1.6).toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    bar
                  </span>
                </div>
              </div>

              {/* 8. Exhaust Gas Temp */}
              <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span className="font-medium">Exhaust Gas Temp</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`font-tech font-bold text-base ${
                    (telemetry.egt || 720) > 800 ? 'text-rose-600 dark:text-rose-400' : (telemetry.egt || 720) > 760 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Math.round(telemetry.egt || 720)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    °C
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Engine Health (Circular Gauge + RUL progress + Operating hours) */}
          <div
            className={`rounded-xl border p-4 flex flex-col shadow-xs transition-colors ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}
          >
            <h3 className="font-chakra font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white pb-3 mb-2 border-b border-inherit">
              Engine Health
            </h3>

            <div className="flex items-center justify-between py-2">
              {/* Circular Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress arc (94%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-emerald-500 transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - 0.94)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-chakra font-bold text-2xl text-slate-900 dark:text-white">
                    94%
                  </span>
                  <span className="text-[11px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                    Healthy
                  </span>
                </div>
              </div>

              {/* RUL and Operating Hours details */}
              <div className="flex-1 pl-4 space-y-3">
                <div>
                  <div className="text-[11px] font-chakra text-slate-500 dark:text-slate-400">
                    RUL (Remaining Useful Life)
                  </div>
                  <div className="font-tech font-bold text-xl text-slate-900 dark:text-white">
                    168 h
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: '84%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-chakra text-slate-500 dark:text-slate-400">
                    Operating Hours
                  </div>
                  <div className="font-tech font-bold text-lg text-slate-700 dark:text-slate-300">
                    432 h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER COLUMN: 3D ENGINE DIGITAL TWIN SIMULATION          */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 flex flex-col space-y-3.5">
          {/* Main 3D Engine Visualization Viewport with Real Geometry & Callouts */}
          <div
            className={`rounded-xl border flex flex-col shadow-xs transition-colors relative overflow-hidden h-[480px] min-h-[460px] ${
              isLight
                ? 'bg-slate-50 border-slate-200/90 text-slate-800'
                : 'bg-[#060b14] border-[#15253b] text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            }`}
          >
            {/* Top Sub-bar with Component Focus Indicator */}
            <div className="absolute top-2.5 left-3.5 z-20 flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-chakra font-bold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 backdrop-blur-md">
                3D DIGITAL TWIN • ROTAX 914-F
              </span>
              {selectedComponent && (
                <span className="px-2 py-0.5 rounded text-[10px] font-chakra font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 backdrop-blur-md">
                  FOCUS: {selectedComponent}
                </span>
              )}
            </div>

            {/* Embedded Interactive Three.js WebGL Engine Model */}
            <div className="w-full h-full relative">
              <Engine3DView
                telemetry={telemetry}
                activeFault={activeFault}
                theme={theme}
                isPaused={!is3DAnimationActive}
              />

              {/* OVERLAY: Precision Callout Pointers Matching Reference Image */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* SVG Pointer Connecting Lines */}
                <svg className="w-full h-full absolute inset-0">
                  <defs>
                    <marker
                      id="dot-normal"
                      viewBox="0 0 6 6"
                      refX="3"
                      refY="3"
                      markerWidth="4"
                      markerHeight="4"
                    >
                      <circle cx="3" cy="3" r="2.5" fill="#10b981" />
                    </marker>
                    <marker
                      id="dot-warn"
                      viewBox="0 0 6 6"
                      refX="3"
                      refY="3"
                      markerWidth="4"
                      markerHeight="4"
                    >
                      <circle cx="3" cy="3" r="2.5" fill="#f43f5e" />
                    </marker>
                  </defs>

                  {/* Leader Lines */}
                  {/* 1. Propeller Hub */}
                  <polyline
                    points="24%,32% 28%,32% 33%,36%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                  {/* 2. Fuel Injector */}
                  <polyline
                    points="36%,14% 41%,14% 44%,20%"
                    fill="none"
                    stroke={isInjectorFault ? '#f43f5e' : '#10b981'}
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd={isInjectorFault ? 'url(#dot-warn)' : 'url(#dot-normal)'}
                  />
                  {/* 3. ECU */}
                  <polyline
                    points="46%,12% 48%,12% 49%,17%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                  {/* 4. Cylinder Head */}
                  <polyline
                    points="56%,14% 55%,18% 54%,22%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                  {/* 5. Cooling Fins */}
                  <polyline
                    points="68%,21% 65%,21% 62%,26%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                  {/* 6. Intake Manifold */}
                  <polyline
                    points="67%,42% 64%,42% 61%,46%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                  {/* 7. Exhaust Manifold */}
                  <polyline
                    points="59%,50% 56%,50% 53%,46%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                  {/* 8. Crankshaft */}
                  <polyline
                    points="45%,49% 46%,49% 47%,45%"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    markerEnd="url(#dot-normal)"
                  />
                </svg>

                {/* Callout Labels (HTML overlay matching image.png) */}
                {/* 1. Propeller Hub */}
                <div
                  className="absolute left-[20%] top-[29%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Propeller Hub')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                      Propeller Hub
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>

                {/* 2. Fuel Injector */}
                <div
                  className="absolute left-[34%] top-[10%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Fuel Injector')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      Fuel Injector
                    </span>
                    <span
                      className={`text-[10px] font-chakra font-semibold ${
                        isInjectorFault
                          ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isInjectorFault ? '(Clogged 70%)' : '(Normal)'}
                    </span>
                  </div>
                </div>

                {/* 3. ECU */}
                <div
                  className="absolute left-[45%] top-[8%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('ECU')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      ECU
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>

                {/* 4. Cylinder Head */}
                <div
                  className="absolute left-[55%] top-[10%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Cylinder Head')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      Cylinder Head
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>

                {/* 5. Cooling Fins */}
                <div
                  className="absolute left-[68%] top-[18%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Cooling Fins')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      Cooling Fins
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>

                {/* 6. Intake Manifold */}
                <div
                  className="absolute left-[67%] top-[39%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Intake Manifold')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      Intake Manifold
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>

                {/* 7. Exhaust Manifold */}
                <div
                  className="absolute left-[58%] top-[48%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Exhaust Manifold')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      Exhaust Manifold
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>

                {/* 8. Crankshaft */}
                <div
                  className="absolute left-[44%] top-[47%] pointer-events-auto cursor-pointer group"
                  onClick={() => setSelectedComponent('Crankshaft')}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-chakra font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                      Crankshaft
                    </span>
                    <span className="text-[10px] font-chakra font-semibold text-emerald-600 dark:text-emerald-400">
                      (Normal)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Details Drawer when a component is clicked */}
              {selectedComponent && (
                <div className="absolute bottom-2 left-2 right-2 z-20 p-2.5 rounded-lg bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md border border-cyan-500 shadow-lg text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-chakra font-bold text-slate-900 dark:text-white uppercase mr-2">
                        {selectedComponent}:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {callouts.find((c) => c.name === selectedComponent)?.details ||
                          'Telemetry and kinematics within normal operating limits.'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1.5 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub-Row directly underneath the 3D Engine (3 Cards matching screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* SUB-CARD 1: Internal View (Transparent) + Subsystem color dots */}
            <div
              className={`md:col-span-4 rounded-xl border p-3 flex flex-col justify-between shadow-xs transition-colors ${
                isLight
                  ? 'bg-white border-slate-200/90 text-slate-800'
                  : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <h4 className="font-chakra font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300">
                  Internal View (Transparent)
                </h4>
              </div>

              {/* Graphical Schematic of Cutaway Engine & Color Legend */}
              <div className="grid grid-cols-12 gap-2 pt-2 items-center">
                {/* Visual Engine Cutaway Graphic */}
                <div className="col-span-6 relative h-20 rounded bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Subtle technical schematic drawing */}
                  <svg className="w-full h-full p-1" viewBox="0 0 100 60">
                    <rect x="20" y="15" width="60" height="30" rx="3" fill="#1e293b" opacity="0.6" />
                    {/* Pistons */}
                    <rect x="25" y="20" width="12" height="20" rx="2" fill="#38bdf8" opacity="0.8" />
                    <rect x="63" y="20" width="12" height="20" rx="2" fill="#38bdf8" opacity="0.8" />
                    {/* Crankshaft */}
                    <circle cx="50" cy="30" r="8" fill="#f59e0b" opacity="0.8" />
                    <line x1="37" y1="30" x2="45" y2="30" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="55" y1="30" x2="63" y2="30" stroke="#f59e0b" strokeWidth="3" />
                    {/* Blue intake glow */}
                    <path d="M 30 15 Q 50 5 70 15" fill="none" stroke="#00f0ff" strokeWidth="2.5" />
                  </svg>
                </div>

                {/* Subsystem color markers matching reference image */}
                <div className="col-span-6 space-y-1 text-[11px] font-chakra font-medium">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-700 dark:text-slate-300">Fuel System</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-700 dark:text-slate-300">Air Intake</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-slate-700 dark:text-slate-300">Exhaust</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-slate-700 dark:text-slate-300">Cooling System</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300">Lubrication System</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-CARD 2: Component Status (Checklist with status dots) */}
            <div
              className={`md:col-span-5 rounded-xl border p-3 flex flex-col justify-between shadow-xs transition-colors ${
                isLight
                  ? 'bg-white border-slate-200/90 text-slate-800'
                  : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <h4 className="font-chakra font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300">
                  Component Status
                </h4>
              </div>

              {/* 2-Column Status Grid */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[11px] font-chakra">
                {componentStatuses.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.color === 'emerald'
                            ? 'bg-emerald-500'
                            : item.color === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-rose-500 animate-pulse'
                        }`}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        item.status === 'Normal'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.status === 'Warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SUB-CARD 3: 3D Model Controls (Rotate, Zoom, Reset, Real-time Animation switch) */}
            <div
              className={`md:col-span-3 rounded-xl border p-3 flex flex-col justify-between shadow-xs transition-colors ${
                isLight
                  ? 'bg-white border-slate-200/90 text-slate-800'
                  : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-inherit">
                <h4 className="font-chakra font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300">
                  3D Model Controls
                </h4>
              </div>

              {/* Control Action Buttons */}
              <div className="flex items-center justify-around py-1 text-slate-600 dark:text-slate-300">
                {/* Rotate */}
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex flex-col items-center p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    isAutoRotating ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''
                  }`}
                  title="Toggle 360° Continuous Orbit Rotation"
                >
                  <Rotate3d className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-chakra font-semibold">Rotate</span>
                </button>

                {/* Zoom */}
                <button
                  onClick={() => setCameraZoomLevel((prev) => (prev > 1.2 ? 0.9 : prev + 0.2))}
                  className="flex flex-col items-center p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Toggle Zoom Perspective"
                >
                  <ZoomIn className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-chakra font-semibold">Zoom</span>
                </button>

                {/* Reset */}
                <button
                  onClick={handleResetCamera}
                  className="flex flex-col items-center p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Reset Camera Orientation"
                >
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-chakra font-semibold">Reset</span>
                </button>
              </div>

              {/* Real-time Animation Toggle Switch */}
              <div className="flex items-center justify-between pt-1 border-t border-inherit">
                <span className="text-[11px] font-chakra text-slate-600 dark:text-slate-400">
                  Real-time Animation
                </span>
                <button
                  onClick={() => setIs3DAnimationActive(!is3DAnimationActive)}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    is3DAnimationActive ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      is3DAnimationActive ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AI Diagnostics + Predicted RUL + Status + Gemini */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 flex flex-col space-y-3.5">
          {/* CARD 1: AI Diagnostics (Alert Banner + SHAP Breakdown) */}
          <div
            className={`rounded-xl border p-4 flex flex-col shadow-xs transition-colors ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <h3 className="font-chakra font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>AI Diagnostics</span>
              </h3>
            </div>

            {/* Alert Banner: Injector Clogging Detected (Severity: 70%) */}
            <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-chakra font-bold text-xs text-rose-600 dark:text-rose-400">
                  {isInjectorFault
                    ? 'Injector Clogging Detected'
                    : isLubeFault
                    ? 'Lubrication Failure Risk'
                    : activeFault === 'OVERHEATING'
                    ? 'Thermal Overheat Boundary'
                    : 'Nominal Propulsion Envelope'}
                </span>
              </div>
              <span className="text-[11px] font-chakra font-semibold text-rose-600 dark:text-rose-400">
                Severity: {isInjectorFault ? `${Math.round(faultSeverity * 100)}%` : '0%'}
              </span>
            </div>

            {/* Diagnostics Metadata */}
            <div className="mt-3 space-y-2 text-xs font-chakra">
              {/* Confidence */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Confidence</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">94%</span>
                </div>
              </div>

              {/* Fault Type */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Fault Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {isInjectorFault ? 'Injector Clogging' : activeFault.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Affected Component */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Affected Component</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {isInjectorFault ? 'Injector (Cylinder 2)' : 'Propulsion System'}
                </span>
              </div>

              {/* Suggested Action */}
              <div className="pt-1">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">
                  Suggested Action
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                  {isInjectorFault
                    ? 'Inspect and clean/replace injector. Check fuel quality.'
                    : 'Maintain cruise altitude and continuous CAN telemetry surveillance.'}
                </p>
              </div>
            </div>

            {/* Collapsible SHAP Analysis (Why?) */}
            <div className="mt-3 pt-2 border-t border-inherit">
              <button
                onClick={() => setIsShapExpanded(!isShapExpanded)}
                className="w-full flex items-center justify-between text-xs font-chakra font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-600 transition-colors"
              >
                <span className="flex items-center space-x-1">
                  <span>Why? (SHAP Analysis)</span>
                </span>
                {isShapExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isShapExpanded && (
                <div className="mt-2 space-y-1.5 text-[11px] font-chakra">
                  {shapFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 w-24 truncate">
                        {feat.name}
                      </span>
                      <div className="flex-1 mx-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${feat.value * 100}%`,
                            backgroundColor: feat.color,
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[10px]" style={{ color: feat.color }}>
                        {feat.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Predicted RUL (126 h gauge + RUL Trend) */}
          <div
            className={`rounded-xl border p-4 flex flex-col shadow-xs transition-colors ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}
          >
            <h3 className="font-chakra font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white pb-2 border-b border-inherit">
              Predicted RUL
            </h3>

            <div className="grid grid-cols-12 gap-2 pt-2 items-center">
              {/* Radial Ring (126 h) */}
              <div className="col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-cyan-500"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - 0.63)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-chakra font-bold text-lg text-slate-900 dark:text-white">
                      126 h
                    </span>
                    <span className="text-[9px] font-chakra text-slate-500 dark:text-slate-400">
                      Remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* RUL Trend Line Graph */}
              <div className="col-span-7 flex flex-col">
                <span className="text-[10px] font-chakra font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  RUL Trend
                </span>
                <div className="h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rulTrendPoints}>
                      <XAxis dataKey="h" hide />
                      <YAxis hide domain={[80, 200]} />
                      <Line
                        type="monotone"
                        dataKey="rul"
                        stroke="#00f0ff"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: '#00f0ff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-[8px] font-mono text-slate-400">
                  <span>0h</span>
                  <span>50h</span>
                  <span>100h</span>
                  <span>150h</span>
                  <span>200h</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Digital Twin Status */}
          <div
            className={`rounded-xl border p-3.5 flex flex-col shadow-xs transition-colors ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <h4 className="font-chakra font-bold text-xs tracking-wider uppercase text-slate-900 dark:text-white">
                Digital Twin Status
              </h4>
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-chakra font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized</span>
              </div>
            </div>

            <div className="pt-2 space-y-1 text-[11px] font-chakra">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Last Update</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  2026-09-26 18:30:00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Data Source</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Simulated ECU + Physics Model
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Model</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  ANSYS Twin Builder + Simscape
                </span>
              </div>
            </div>
          </div>

          {/* CARD 4: Ask Gemini (AI Assistant Prompt) */}
          <div
            className={`rounded-xl border p-3.5 flex flex-col shadow-xs transition-colors ${
              isLight
                ? 'bg-white border-slate-200/90 text-slate-800'
                : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="flex items-center space-x-1.5 pb-2 text-cyan-600 dark:text-cyan-400 font-chakra font-bold text-xs uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Gemini</span>
            </div>

            <form onSubmit={handleAskGemini} className="relative mt-1">
              <input
                type="text"
                value={geminiQuery}
                onChange={(e) => setGeminiQuery(e.target.value)}
                placeholder="Ask about engine thermodynamics..."
                className={`w-full py-2 pl-3 pr-9 rounded-lg border text-xs font-sans transition-colors focus:outline-hidden ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                    : 'bg-[#060c18] border-[#1a2c47] text-white focus:border-cyan-400'
                }`}
              />
              <button
                type="submit"
                disabled={isAskingGemini}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-400 disabled:opacity-50"
              >
                {isAskingGemini ? (
                  <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Gemini Response Display */}
            {geminiResponse && (
              <div className="mt-2.5 p-2 rounded-lg bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-[11px] leading-relaxed animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-chakra text-cyan-700 dark:text-cyan-300 font-bold mb-1">
                  <span>Gemini Propulsion Analysis</span>
                  <span className="font-mono text-slate-400">{geminiResponse.timestamp}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-sans">
                  {geminiResponse.answer}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM ROW: Key Parameters (Multi-trace) + Cylinder Temps Bar  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Key Parameters (Last 10 minutes) Multi-line Chart */}
        <div
          className={`lg:col-span-8 rounded-xl border p-4 flex flex-col shadow-xs transition-colors ${
            isLight
              ? 'bg-white border-slate-200/90 text-slate-800'
              : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
          }`}
        >
          {/* Chart Header + Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-inherit">
            <h3 className="font-chakra font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white">
              Key Parameters <span className="text-slate-500 text-xs font-normal">(Last 10 minutes)</span>
            </h3>
            <div className="flex items-center space-x-4 text-xs font-chakra">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">RPM</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Oil Temp</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Coolant Temp</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Vibration</span>
              </div>
            </div>
          </div>

          {/* Multi-trace Line Chart Container */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={keyParametersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="time"
                  stroke={isLight ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isLight ? '#64748b' : '#94a3b8'}
                  fontSize={10}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#08101e',
                    borderColor: isLight ? '#cbd5e1' : '#1e3a5f',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  name="RPM"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="oilTemp"
                  name="Oil Temp (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="coolantTemp"
                  name="Coolant Temp (°C)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="vibration"
                  name="Vibration (g)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cylinder Temperatures Bar Chart (C1 to C6 with C2 Hot Spot Alert) */}
        <div
          className={`lg:col-span-4 rounded-xl border p-4 flex flex-col shadow-xs transition-colors ${
            isLight
              ? 'bg-white border-slate-200/90 text-slate-800'
              : 'bg-[#08101e] border-[#15253b] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
            <h3 className="font-chakra font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white">
              Cylinder Temperatures
            </h3>
            <span className="text-xs font-mono text-slate-500">°C</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cylinderTemps} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="id"
                  stroke={isLight ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isLight ? '#64748b' : '#94a3b8'}
                  fontSize={10}
                  tickLine={false}
                  domain={[120, 240]}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}°C`, 'Head Temp']}
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#08101e',
                    borderColor: isLight ? '#cbd5e1' : '#1e3a5f',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="temp" radius={[4, 4, 0, 0]}>
                  {cylinderTemps.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isAlert ? '#f43f5e' : '#38bdf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE FAULT INJECTION BAR (Instant Testing for Judges)   */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`w-full p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors ${
          isLight
            ? 'bg-slate-100/90 border-slate-300 text-slate-800'
            : 'bg-[#091322] border-[#182c48] text-slate-100'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="font-chakra font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
            Fault Injection Simulator:
          </span>
          <span className="text-[11px] font-sans text-slate-500">
            (Select scenario to test real-time physics, 3D callouts & SHAP response)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onInjectFault('NORMAL', 0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold transition-all ${
              activeFault === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Nominal Cruise
          </button>
          <button
            onClick={() => onInjectFault('INJECTOR_DEGRADATION', 0.7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold transition-all ${
              activeFault === 'INJECTOR_DEGRADATION'
                ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Injector Clogging (70%)
          </button>
          <button
            onClick={() => onInjectFault('OVERHEATING', 0.9)}
            className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold transition-all ${
              activeFault === 'OVERHEATING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Cooling Degradation
          </button>
          <button
            onClick={() => onInjectFault('LUBRICATION_FAILURE', 0.85)}
            className={`px-3 py-1.5 rounded-lg text-xs font-chakra font-bold transition-all ${
              activeFault === 'LUBRICATION_FAILURE'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Lubrication Seizure
          </button>
        </div>
      </div>
    </div>
  );
};
