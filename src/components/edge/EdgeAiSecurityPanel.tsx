import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  Cpu,
  Radio,
  Server,
  Plane,
  Lock,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Terminal,
  Layers,
  Sliders,
  Globe,
  HelpCircle,
  BarChart3,
  Wifi,
  Sparkles,
  ArrowRight,
  HardDrive,
  Flame,
  Check,
  Info
} from 'lucide-react';
import { TelemetryData, FaultType, EngineHealthScores, AiDiagnosticResult } from '../../types/engine';

interface EdgeAiSecurityPanelProps {
  telemetry: TelemetryData;
  health: EngineHealthScores;
  activeFault: FaultType;
  diagnostic: AiDiagnosticResult;
  theme?: 'light' | 'dark';
}

interface CanFrame {
  id: string;
  source: 'ENGINE' | 'AVIONICS' | 'PAYLOAD';
  name: string;
  timestamp: string;
  data: string;
  dlc: number;
  status: 'VALID' | 'ANOMALOUS' | 'CORRUPTED';
  details?: string;
}

export const EdgeAiSecurityPanel: React.FC<EdgeAiSecurityPanelProps> = ({
  telemetry,
  health,
  activeFault,
  diagnostic,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // --- Sub-panel 1: Edge Computing Stack States ---
  const [edgeDevice, setEdgeDevice] = useState<'JETSON_ORIN' | 'RPI_CM4'>('JETSON_ORIN');
  const [edgeModelVersion, setEdgeModelVersion] = useState<string>('v2.4.1-int8-edge');
  const latestCloudVersion = 'v2.4.2-rc1';
  const [isUpdatingModel, setIsUpdatingModel] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateStepName, setUpdateStepName] = useState<string>('');

  // Jittered latency & telemetry for edge device
  const [edgeLatency, setEdgeLatency] = useState<number>(21.4);
  const [edgeCpu, setEdgeCpu] = useState<number>(38);
  const [edgeTemp, setEdgeTemp] = useState<number>(51.2);
  const [edgeMem, setEdgeMem] = useState<number>(44);

  useEffect(() => {
    const timer = setInterval(() => {
      // Dynamic fluctuations based on fault activity
      const loadMultiplier = activeFault === 'NORMAL' ? 1.0 : 1.35;
      setEdgeLatency(+(20 + Math.random() * 4.5 * loadMultiplier).toFixed(1));
      setEdgeCpu(Math.min(95, Math.round(36 + Math.random() * 8 * loadMultiplier)));
      setEdgeTemp(+(50 + Math.random() * 3.5 * loadMultiplier).toFixed(1));
      setEdgeMem(Math.round(42 + Math.random() * 3));
    }, 1500);
    return () => clearInterval(timer);
  }, [activeFault]);

  // Handle simulated model update OTA
  const handlePushModelUpdate = () => {
    if (isUpdatingModel) return;
    setIsUpdatingModel(true);
    setUpdateProgress(5);
    setUpdateStepName('Verifying SHA-256 Checksum on Secure Telemetry Tunnel...');

    setTimeout(() => {
      setUpdateProgress(35);
      setUpdateStepName('Packaging TensorRT INT8 Engine (.plan, 42.6 MB)...');
    }, 700);

    setTimeout(() => {
      setUpdateProgress(70);
      setUpdateStepName('Wireless Delta Stream Transmission over AES-256-GCM Link...');
    }, 1500);

    setTimeout(() => {
      setUpdateProgress(90);
      setUpdateStepName('Zero-Downtime Shadow Verification & Hot-Reload on Edge DLA...');
    }, 2300);

    setTimeout(() => {
      setUpdateProgress(100);
      setUpdateStepName('Hot-Swap Success! Engine v2.4.2 Active on Jetson Orin DLA.');
      setEdgeModelVersion('v2.4.2-int8-edge');
      setTimeout(() => {
        setIsUpdatingModel(false);
        setUpdateProgress(0);
      }, 1500);
    }, 3100);
  };

  // --- Sub-panel 3: Secure Telemetry & CAN Bus States ---
  const [canFrames, setCanFrames] = useState<CanFrame[]>([]);
  const [canFilter, setCanFilter] = useState<'ALL' | 'ENGINE' | 'AVIONICS' | 'PAYLOAD'>('ALL');
  const [canOnlyAnomalies, setCanOnlyAnomalies] = useState<boolean>(false);
  const [isCanStreaming, setIsCanStreaming] = useState<boolean>(true);
  const [corruptedInjected, setCorruptedInjected] = useState<boolean>(false);

  // Bandwidth telemetry jitter
  const [bandwidthKbps, setBandwidthKbps] = useState<number>(64.8);
  const maxBandwidthKbps = 128.0;

  // Packet integrity metrics
  const crcErrorRate = useMemo(() => {
    return activeFault === 'SENSOR_DRIFT' || corruptedInjected ? '0.048%' : '0.002%';
  }, [activeFault, corruptedInjected]);

  const packetLossRate = useMemo(() => {
    return activeFault === 'SENSOR_DRIFT' ? '0.38%' : '0.12%';
  }, [activeFault]);

  const linkLatencyMs = 28;

  // CAN Stream generator
  useEffect(() => {
    if (!isCanStreaming) return;

    const frameTemplates = [
      { id: '0x120', source: 'ENGINE' as const, name: 'CRANK_RPM_PHASE', dlc: 8 },
      { id: '0x140', source: 'ENGINE' as const, name: 'CHT_CYL_1_TO_4', dlc: 8 },
      { id: '0x160', source: 'ENGINE' as const, name: 'EGT_COLLECTORS', dlc: 8 },
      { id: '0x180', source: 'ENGINE' as const, name: 'OIL_PRESS_TEMP', dlc: 8 },
      { id: '0x1A0', source: 'ENGINE' as const, name: 'TCU_BOOST_GATE', dlc: 6 },
      { id: '0x210', source: 'AVIONICS' as const, name: 'AIR_DATA_PITOT', dlc: 8 },
      { id: '0x240', source: 'AVIONICS' as const, name: 'INS_GPS_NAV', dlc: 8 },
      { id: '0x310', source: 'PAYLOAD' as const, name: 'EO_IR_GIMBAL_AZ', dlc: 8 },
      { id: '0x340', source: 'PAYLOAD' as const, name: 'SAR_RADAR_SYNC', dlc: 4 },
    ];

    const generateRandomHex = (length: number) => {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase() + ' ';
      }
      return result.trim();
    };

    const interval = setInterval(() => {
      const template = frameTemplates[Math.floor(Math.random() * frameTemplates.length)];
      const now = new Date();
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const timeStr = `${now.toTimeString().split(' ')[0]}.${ms}`;

      let status: 'VALID' | 'ANOMALOUS' | 'CORRUPTED' = 'VALID';
      let details: string | undefined = undefined;

      // Inject anomaly or corrupted frame condition
      if (corruptedInjected && Math.random() > 0.4) {
        status = 'CORRUPTED';
        details = 'CRC15 Mismatch • Bit stuffing error on SOF/Arbitration';
      } else if (activeFault !== 'NORMAL' && template.source === 'ENGINE' && Math.random() > 0.6) {
        status = 'ANOMALOUS';
        details = `${activeFault.replace(/_/g, ' ')} detected in payload frame`;
      }

      const newFrame: CanFrame = {
        id: template.id,
        source: template.source,
        name: template.name,
        timestamp: timeStr,
        data: generateRandomHex(template.dlc),
        dlc: template.dlc,
        status,
        details,
      };

      setCanFrames((prev) => [newFrame, ...prev.slice(0, 40)]);
      setBandwidthKbps(+(61 + Math.random() * 8.5).toFixed(1));
    }, 600);

    return () => clearInterval(interval);
  }, [isCanStreaming, corruptedInjected, activeFault]);

  // --- Sub-panel 4: Federated Learning States ---
  const [fleetRound, setFleetRound] = useState<number>(14);
  const [fleetDelta, setFleetDelta] = useState<number>(0.42);
  const [isFederating, setIsFederating] = useState<boolean>(false);
  const [fleetRoundTime, setFleetRoundTime] = useState<string>('18 mins ago');

  const fleetUavs = [
    { id: 'UAV-07', callsign: 'TAPAS-M027', location: 'Active Mission Airspace', localAcc: 98.4, status: 'LOCAL TRAINING ACTIVE', isCurrent: true },
    { id: 'UAV-03', callsign: 'TAPAS-M022', location: 'Kolkata Forward Base', localAcc: 97.9, status: 'WEIGHTS READY', isCurrent: false },
    { id: 'UAV-12', callsign: 'TAPAS-M025', location: 'Jaisalmer Desert Strip', localAcc: 98.8, status: 'SYNCED', isCurrent: false },
    { id: 'UAV-05', callsign: 'TAPAS-M019', location: 'Bengaluru HAL Range', localAcc: 96.5, status: 'LOCAL TRAINING', isCurrent: false },
    { id: 'UAV-09', callsign: 'TAPAS-M024', location: 'Chandipur Coastal Strip', localAcc: 98.1, status: 'SYNCED', isCurrent: false },
  ];

  const handleSimulateFederation = () => {
    if (isFederating) return;
    setIsFederating(true);
    setTimeout(() => {
      setFleetRound((r) => r + 1);
      setFleetDelta(+(0.28 + Math.random() * 0.25).toFixed(2));
      setFleetRoundTime('Just now');
      setIsFederating(false);
    }, 1800);
  };

  // --- Sub-panel 5: Explainable AI & SHAP Computations ---
  // Compute dynamic SHAP waterfall contributions based on the active fault
  const shapAnalysis = useMemo(() => {
    let explanation = '';
    let baseValue = 0.12; // E[f(x)]
    let features: { name: string; value: string; shap: number; direction: 'pos' | 'neg'; note: string }[] = [];

    switch (activeFault) {
      case 'INJECTOR_DEGRADATION':
        features = [
          { name: 'Fuel Flow Deviation', value: `${telemetry.fuelFlow.toFixed(1)} L/h (-14%)`, shap: +0.34, direction: 'pos', note: 'Drop in volumetric fuel delivery' },
          { name: 'Cylinder 2 CHT Residual', value: `+${(telemetry.chtCylinders[1] - 150).toFixed(0)}°C`, shap: +0.24, direction: 'pos', note: 'Asymmetric thermal hot spot' },
          { name: 'EGT Collector Residual', value: `+${(telemetry.egt - 760).toFixed(0)}°C`, shap: +0.14, direction: 'pos', note: 'Late lean combustion burn' },
          { name: 'Vibration 2x Harmonic', value: `${telemetry.vibration.toFixed(2)} g RMS`, shap: +0.07, direction: 'pos', note: 'Power stroke torque ripple' },
          { name: 'Oil Pressure Normalcy', value: `${telemetry.oilPressure.toFixed(1)} bar`, shap: -0.05, direction: 'neg', note: 'Within lubrication bounds' },
          { name: 'Engine RPM Stability', value: `${Math.round(telemetry.rpm)} RPM`, shap: -0.02, direction: 'neg', note: 'Governor maintaining speed' },
        ];
        explanation = `The model flagged this as INJECTOR CLOGGING because Fuel Flow dropped 14% while Cylinder 2 CHT rose 18°C above expected, causing cyclic torque imbalance and lean flame delay.`;
        break;

      case 'OVERHEATING':
        features = [
          { name: 'Peak CHT Exceedance', value: `${telemetry.cht.toFixed(0)}°C (>210°C)`, shap: +0.44, direction: 'pos', note: 'Critical boundary exceeded' },
          { name: 'Water Jacket Coolant', value: `${telemetry.coolantTemp.toFixed(0)}°C`, shap: +0.22, direction: 'pos', note: 'Heat exchanger saturated' },
          { name: 'Oil Temperature', value: `${telemetry.oilTemperature.toFixed(0)}°C`, shap: +0.16, direction: 'pos', note: 'Thermal dissipation decay' },
          { name: 'EGT Deviation', value: `${telemetry.egt.toFixed(0)}°C`, shap: +0.08, direction: 'pos', note: 'High manifold gas temp' },
          { name: 'Fuel Flow Rate', value: `${telemetry.fuelFlow.toFixed(1)} L/h`, shap: -0.03, direction: 'neg', note: 'Nominal metering' },
          { name: 'Crank Vibration', value: `${telemetry.vibration.toFixed(2)} g`, shap: +0.03, direction: 'pos', note: 'Thermal expansion clearances' },
        ];
        explanation = `The model flagged this as OVERHEATING because Cylinder Head Temperature exceeded safety limits (reaching ${telemetry.cht.toFixed(0)}°C) alongside a steep rise in Coolant Water Jacket temperature (+22°C above cruise baseline).`;
        break;

      case 'LUBRICATION_FAILURE':
        features = [
          { name: 'Oil Pressure Collapse', value: `${telemetry.oilPressure.toFixed(2)} bar (Low)`, shap: +0.48, direction: 'pos', note: 'Boundary lubrication breach' },
          { name: 'High-Freq Vibration', value: `${telemetry.vibration.toFixed(2)} g RMS`, shap: +0.22, direction: 'pos', note: 'Bearing hydrodynamic friction' },
          { name: 'Oil Temperature Rise', value: `${telemetry.oilTemperature.toFixed(0)}°C`, shap: +0.15, direction: 'pos', note: 'Viscous shear dissipation' },
          { name: 'Oil Flow Rate', value: `${telemetry.oilFlowRate.toFixed(1)} L/min`, shap: +0.09, direction: 'pos', note: 'Scavenge pump bypass' },
          { name: 'EGT Combustion Balance', value: `${telemetry.egt.toFixed(0)}°C`, shap: -0.04, direction: 'neg', note: 'Normal flame envelope' },
          { name: 'Cylinder CHT Balance', value: `${telemetry.cht.toFixed(0)}°C`, shap: -0.02, direction: 'neg', note: 'Normal thermal balance' },
        ];
        explanation = `The model flagged this as LUBRICATION FAILURE because Oil Pressure plunged to ${telemetry.oilPressure.toFixed(2)} bar while bearing acoustic vibration increased by 3.2x, presenting severe seizure risk.`;
        break;

      case 'SENSOR_DRIFT':
        features = [
          { name: 'Thermodynamic Decoupling', value: 'Residual > 3.8σ', shap: +0.46, direction: 'pos', note: 'Sensor deviates from physics twin' },
          { name: 'Coupled Sensor Invariance', value: 'EGT & Coolant Flat', shap: +0.26, direction: 'pos', note: 'Thermodynamic mismatch' },
          { name: 'CAN Parity Jitter', value: '0.048% CRC Delta', shap: +0.12, direction: 'pos', note: 'Thermocouple ADC noise' },
          { name: 'RPM & Mechanical State', value: `${Math.round(telemetry.rpm)} RPM`, shap: -0.05, direction: 'neg', note: 'Smooth rotational torque' },
          { name: 'Fuel & Oil Press', value: 'Nominal', shap: -0.04, direction: 'neg', note: 'Fluid channels healthy' },
          { name: 'Vibration Profile', value: 'Nominal', shap: -0.03, direction: 'neg', note: 'No mechanical distress' },
        ];
        explanation = `The model flagged this as SENSOR DRIFT because CHT sensor telemetry decoupled from physical twin predictions while coupled channels (Coolant & EGT) remained nominal, isolating an electrical transducer fault rather than mechanical failure.`;
        break;

      default:
        // NORMAL
        features = [
          { name: 'CHT Envelope Consistency', value: `${telemetry.cht.toFixed(0)}°C`, shap: -0.08, direction: 'neg', note: 'Tracking digital twin ±1.2°C' },
          { name: 'EGT Equilibrium', value: `${telemetry.egt.toFixed(0)}°C`, shap: -0.06, direction: 'neg', note: 'Stoichiometric cylinder balance' },
          { name: 'Oil System Stability', value: `${telemetry.oilPressure.toFixed(1)} bar`, shap: -0.05, direction: 'neg', note: 'Hydrodynamic film verified' },
          { name: 'Fuel Consumption Match', value: `${telemetry.fuelFlow.toFixed(1)} L/h`, shap: -0.04, direction: 'neg', note: 'BSFC within ±2% of spec' },
          { name: 'Vibration Envelope', value: `${telemetry.vibration.toFixed(2)} g RMS`, shap: -0.03, direction: 'neg', note: 'Clean harmonics 1x & 2x' },
          { name: 'Manifold Turbo Boost', value: `${telemetry.turboBoostBar.toFixed(2)} bar`, shap: -0.02, direction: 'neg', note: 'TCU wastegate in closed loop' },
        ];
        explanation = `The model confirms NOMINAL OPERATION: All physical channels correlate tightly with the Rotax 914-F Digital Twin physics equations with an aggregate anomaly score of ${(diagnostic.anomalyScore * 100).toFixed(1)}%.`;
        break;
    }

    const predictedProbability = Math.min(0.99, Math.max(0.02, +(baseValue + features.reduce((acc, f) => acc + f.shap, 0)).toFixed(2)));

    return { baseValue, features, predictedProbability, explanation };
  }, [activeFault, telemetry, diagnostic]);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Banner: Innovation Areas Badge */}
      <div
        className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
          isLight
            ? 'bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 border-cyan-200 text-slate-800'
            : 'bg-gradient-to-r from-[#061120] via-[#091629] to-[#071322] border-cyan-900/50 text-slate-100 shadow-[0_4px_24px_rgba(6,182,212,0.1)]'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-chakra font-black text-base sm:text-lg tracking-wider text-cyan-400">
                EDGE AI & CYBER-PHYSICAL SECURITY ARCHITECTURE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase tracking-wider bg-cyan-950/60 border border-cyan-600/40 text-cyan-300">
                SIH 2026 INNOVATION SUITE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-rajdhani tracking-wide">
              Ultra-lightweight onboard inference • INT8 Quantization • Differential Privacy Federated Learning • Real-Time SHAP XAI • Secure CAN Bus Monitor
            </p>
          </div>
        </div>

        {/* Global Security Badges */}
        <div className="flex flex-wrap items-center gap-2 font-tech text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">AES-256-GCM ACTIVE</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>EDGE LATENCY: {edgeLatency} ms</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-PANEL 1 — Edge Device Status & Computing Stack Diagram */}
      {/* ========================================================================= */}
      <section
        className={`p-4 rounded-xl border flex flex-col space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#08101e] border-[#162740]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182944] pb-2.5">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="font-chakra font-bold text-sm tracking-wider text-slate-100 uppercase">
              SUB-PANEL 1 — Onboard Computing Stack & Edge Device Status
            </h2>
          </div>

          {/* Device Profile Selector */}
          <div className="flex items-center space-x-2 text-xs font-tech">
            <span className="text-slate-400">Target Node:</span>
            <div className="flex rounded border border-[#1b2f4c] bg-[#0a1424] p-0.5">
              <button
                onClick={() => setEdgeDevice('JETSON_ORIN')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  edgeDevice === 'JETSON_ORIN'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NVIDIA Jetson Orin Nano (40 TOPS)
              </button>
              <button
                onClick={() => setEdgeDevice('RPI_CM4')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  edgeDevice === 'RPI_CM4'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raspberry Pi CM4 + Coral NPU
              </button>
            </div>
          </div>
        </div>

        {/* Computing Stack Architecture Flow Diagram (with animated signals) */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[820px] flex items-center justify-between py-4 px-2 relative">
            {/* 1. UAV Airframe & Sensors */}
            <div className="flex-1 max-w-[170px] p-3 rounded-lg border border-[#183050] bg-[#091424] flex flex-col items-center text-center shadow-lg relative group">
              <div className="absolute -top-2 left-2 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-[9px] font-tech text-cyan-300">
                STAGE 1
              </div>
              <Plane className="w-6 h-6 text-cyan-400 mb-1" />
              <div className="font-chakra font-bold text-xs text-slate-100">UAV Airframe</div>
              <div className="text-[10px] text-slate-400 font-tech">Rotax 914-F Turbo</div>
              <div className="mt-2 text-[10px] font-tech text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>18 Sensors Online</span>
              </div>
            </div>

            {/* Signal Flow 1 -> 2 */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="text-[9px] font-tech text-cyan-400/80 mb-0.5">Dual CAN 2.0B</div>
              <div className="w-full h-1 bg-[#162740] relative overflow-hidden rounded">
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-packet-travel"></div>
              </div>
              <div className="text-[9px] font-tech text-slate-500 mt-0.5">1.0 Mbps</div>
            </div>

            {/* 2. ECU / FADEC */}
            <div className="flex-1 max-w-[170px] p-3 rounded-lg border border-[#183050] bg-[#091424] flex flex-col items-center text-center shadow-lg relative group">
              <div className="absolute -top-2 left-2 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-[9px] font-tech text-cyan-300">
                STAGE 2
              </div>
              <Layers className="w-6 h-6 text-indigo-400 mb-1" />
              <div className="font-chakra font-bold text-xs text-slate-100">Engine ECU / TCU</div>
              <div className="text-[10px] text-slate-400 font-tech">Dual-Core FADEC</div>
              <div className="mt-2 text-[10px] font-tech text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>100 Hz Sampling</span>
              </div>
            </div>

            {/* Signal Flow 2 -> 3 */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="text-[9px] font-tech text-cyan-400/80 mb-0.5">SPI / CAN-FD</div>
              <div className="w-full h-1 bg-[#162740] relative overflow-hidden rounded">
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-packet-travel"></div>
              </div>
              <div className="text-[9px] font-tech text-slate-500 mt-0.5">5.0 Mbps</div>
            </div>

            {/* 3. Edge AI Node (NVIDIA Jetson / Pi) */}
            <div className="flex-1 max-w-[190px] p-3.5 rounded-lg border-2 border-cyan-500/60 bg-[#0c1a2e] flex flex-col items-center text-center shadow-[0_0_20px_rgba(6,182,212,0.25)] relative">
              <div className="absolute -top-2.5 left-2 px-2 py-0.2 rounded bg-cyan-600 border border-cyan-300 text-[9px] font-tech font-bold text-white uppercase tracking-wider">
                CORE EDGE AI
              </div>
              <Cpu className="w-7 h-7 text-cyan-300 mb-1 animate-pulse" />
              <div className="font-chakra font-bold text-xs text-cyan-200">
                {edgeDevice === 'JETSON_ORIN' ? 'NVIDIA Jetson Orin' : 'Raspberry Pi 4 CM4'}
              </div>
              <div className="text-[10px] text-cyan-400/80 font-tech font-semibold">
                TensorRT INT8 Engine
              </div>
              <div className="mt-2 text-[10px] font-tech text-emerald-300 flex items-center space-x-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>INFERENCE: {edgeLatency} ms</span>
              </div>
            </div>

            {/* Signal Flow 3 -> 4 */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="text-[9px] font-tech text-emerald-400 mb-0.5">AES-256 Crypto</div>
              <div className="w-full h-1 bg-[#162740] relative overflow-hidden rounded">
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-packet-travel"></div>
              </div>
              <div className="text-[9px] font-tech text-slate-500 mt-0.5">Payload Reduced 92%</div>
            </div>

            {/* 4. Telemetry Radio */}
            <div className="flex-1 max-w-[170px] p-3 rounded-lg border border-[#183050] bg-[#091424] flex flex-col items-center text-center shadow-lg relative group">
              <div className="absolute -top-2 left-2 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-[9px] font-tech text-cyan-300">
                STAGE 4
              </div>
              <Radio className="w-6 h-6 text-amber-400 mb-1" />
              <div className="font-chakra font-bold text-xs text-slate-100">Telemetry Radio</div>
              <div className="text-[10px] text-slate-400 font-tech">COFDM S-Band Transceiver</div>
              <div className="mt-2 text-[10px] font-tech text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>RSSI: -64 dBm</span>
              </div>
            </div>

            {/* Signal Flow 4 -> 5 */}
            <div className="flex-1 flex flex-col items-center px-1">
              <div className="text-[9px] font-tech text-amber-400 mb-0.5">RF Datalink</div>
              <div className="w-full h-1 bg-[#162740] relative overflow-hidden rounded">
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-packet-travel"></div>
              </div>
              <div className="text-[9px] font-tech text-slate-500 mt-0.5">LOS: 84 km</div>
            </div>

            {/* 5. Ground Station */}
            <div className="flex-1 max-w-[170px] p-3 rounded-lg border border-[#183050] bg-[#091424] flex flex-col items-center text-center shadow-lg relative group">
              <div className="absolute -top-2 left-2 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-[9px] font-tech text-cyan-300">
                STAGE 5
              </div>
              <Activity className="w-6 h-6 text-purple-400 mb-1" />
              <div className="font-chakra font-bold text-xs text-slate-100">Ground Station</div>
              <div className="text-[10px] text-slate-400 font-tech">VIBESPAR Digital Twin</div>
              <div className="mt-2 text-[10px] font-tech text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>SYNC: LIVE (0.0s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Technical System Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-tech text-xs">
          {/* Card 1: Node State */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">Edge Node State</div>
            <div className="mt-1 flex items-center space-x-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ONLINE</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Uptime: 01:24:48</div>
          </div>

          {/* Card 2: CPU Utilization */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">CPU / GPU Core Load</div>
            <div className="mt-1 font-bold text-cyan-300">{edgeCpu}% Load</div>
            <div className="w-full bg-[#122238] h-1.5 rounded mt-1 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded transition-all duration-500"
                style={{ width: `${edgeCpu}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Memory */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">LPDDR5 Unified RAM</div>
            <div className="mt-1 font-bold text-slate-200">
              {((8 * edgeMem) / 100).toFixed(1)} GB / 8.0 GB
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{edgeMem}% Allocated</div>
          </div>

          {/* Card 4: Temperature */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">SoC Junction Temp</div>
            <div className="mt-1 font-bold text-amber-400 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{edgeTemp} °C</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">T_j_max: 95.0 °C (Safe)</div>
          </div>

          {/* Card 5: Real-time Latency (Target <50ms) */}
          <div className="p-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/20">
            <div className="text-[10px] text-cyan-400 uppercase font-bold">Edge Latency (Target &lt;50ms)</div>
            <div className="mt-1 font-extrabold text-sm text-cyan-300">{edgeLatency} ms</div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>PASS (-57% Margin)</span>
            </div>
          </div>

          {/* Card 6: Model Version & Push Update */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Active Model Version</div>
              <div className="mt-0.5 font-bold text-slate-200 text-[11px] truncate">
                {edgeModelVersion}
              </div>
              <div className="text-[9px] text-slate-400">
                Latest: <span className="text-cyan-400">{latestCloudVersion}</span>
              </div>
            </div>
            <button
              onClick={handlePushModelUpdate}
              disabled={isUpdatingModel || edgeModelVersion === 'v2.4.2-int8-edge'}
              className={`mt-1.5 w-full py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all ${
                edgeModelVersion === 'v2.4.2-int8-edge'
                  ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 cursor-default'
                  : isUpdatingModel
                  ? 'bg-cyan-950/60 border border-cyan-500 text-cyan-300 animate-pulse'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/60 text-cyan-300'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isUpdatingModel ? 'animate-spin' : ''}`} />
              <span>
                {edgeModelVersion === 'v2.4.2-int8-edge'
                  ? 'UP TO DATE'
                  : isUpdatingModel
                  ? 'PUSHING OTA...'
                  : 'PUSH MODEL UPDATE'}
              </span>
            </button>
          </div>
        </div>

        {/* Simulated OTA Progress Bar (when updating) */}
        {isUpdatingModel && (
          <div className="p-3 rounded-lg border border-cyan-500/50 bg-[#091526] font-tech text-xs flex flex-col space-y-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>OVER-THE-AIR (OTA) EDGE MODEL DEPLOYMENT</span>
              </span>
              <span>{updateProgress}%</span>
            </div>
            <div className="w-full bg-[#11233d] h-2 rounded overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${updateProgress}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center space-x-1.5">
              <span className="text-cyan-400">›</span>
              <span>{updateStepName}</span>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SUB-PANEL 2 — Lightweight Onboard Analytics */}
      {/* ========================================================================= */}
      <section
        className={`p-4 rounded-xl border flex flex-col space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#08101e] border-[#162740]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#182944] pb-2.5">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="font-chakra font-bold text-sm tracking-wider text-slate-100 uppercase">
              SUB-PANEL 2 — Lightweight Onboard Analytics & Model Compression
            </h2>
          </div>
          <span className="text-[10px] font-tech text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800">
            OPTIMIZED FOR DETERMINISTIC REAL-TIME
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Inference Time Comparison Bar Chart */}
          <div className="p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col space-y-3">
            <div className="text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide flex items-center justify-between">
              <span>Inference Latency Comparison</span>
              <span className="text-[10px] font-tech text-slate-400">Target: &lt;50ms</span>
            </div>

            {/* Bars */}
            <div className="flex flex-col space-y-3 font-tech text-xs pt-1">
              {/* Cloud */}
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Cloud GCS Inference (over RF)</span>
                  <span className="font-bold text-rose-400">285.0 ms</span>
                </div>
                <div className="w-full bg-[#122238] h-3.5 rounded relative overflow-hidden">
                  <div
                    className="bg-rose-500/80 h-full rounded flex items-center justify-end pr-1 text-[9px] font-bold text-white"
                    style={{ width: '100%' }}
                  >
                    High Link Jitter
                  </div>
                </div>
              </div>

              {/* Hybrid */}
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Hybrid (Edge Pre-filter + Cloud Confirm)</span>
                  <span className="font-bold text-amber-300">48.2 ms</span>
                </div>
                <div className="w-full bg-[#122238] h-3.5 rounded relative overflow-hidden">
                  <div
                    className="bg-amber-500/80 h-full rounded flex items-center justify-end pr-1 text-[9px] font-bold text-slate-900"
                    style={{ width: `${(48.2 / 285) * 100}%` }}
                  >
                    Boundary
                  </div>
                </div>
              </div>

              {/* Edge */}
              <div>
                <div className="flex items-center justify-between text-cyan-300 font-bold mb-1">
                  <span className="flex items-center space-x-1">
                    <span>⚡ Onboard Edge TensorRT (INT8)</span>
                    <span className="text-[10px] text-emerald-400">(This Node)</span>
                  </span>
                  <span className="text-emerald-400">{edgeLatency} ms</span>
                </div>
                <div className="w-full bg-[#122238] h-3.5 rounded relative overflow-hidden border border-emerald-500/40">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded flex items-center justify-end pr-1 text-[9px] font-bold text-slate-900"
                    style={{ width: `${(edgeLatency / 285) * 100}%` }}
                  >
                    Real-Time
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-rajdhani leading-tight pt-1">
              Onboard edge execution guarantees hard real-time anomaly detection even under hostile electronic countermeasures (jamming) or LOS link blackout.
            </p>
          </div>

          {/* Column 2: System Footprint (Memory, Power, Watts) */}
          <div className="p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col justify-between space-y-3">
            <div className="text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide">
              Hardware Resource Footprint
            </div>

            <div className="grid grid-cols-2 gap-3 font-tech text-xs">
              {/* Memory Footprint */}
              <div className="p-2.5 rounded bg-[#0e1c31] border border-[#1c3558]">
                <div className="text-[10px] text-slate-400 uppercase">Model RAM Footprint</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">42.6 MB</div>
                <div className="text-[10px] text-emerald-400 mt-1">
                  ↓ 91.2% vs 485 MB FP32
                </div>
              </div>

              {/* Power Consumption */}
              <div className="p-2.5 rounded bg-[#0e1c31] border border-[#1c3558]">
                <div className="text-[10px] text-slate-400 uppercase">Power Consumption</div>
                <div className="text-lg font-bold text-amber-300 mt-0.5">8.4 Watts</div>
                <div className="text-[10px] text-slate-400 mt-1">12V Avionics Rail (Max 15W)</div>
              </div>

              {/* Compute Throughput */}
              <div className="p-2.5 rounded bg-[#0e1c31] border border-[#1c3558]">
                <div className="text-[10px] text-slate-400 uppercase">Effective TOPS</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">28.4 TOPS</div>
                <div className="text-[10px] text-slate-400 mt-1">INT8 DLA Engine Active</div>
              </div>

              {/* Memory Bandwidth */}
              <div className="p-2.5 rounded bg-[#0e1c31] border border-[#1c3558]">
                <div className="text-[10px] text-slate-400 uppercase">Mem Bandwidth</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">14.2 GB/s</div>
                <div className="text-[10px] text-slate-400 mt-1">LPDDR5 128-bit Bus</div>
              </div>
            </div>

            <div className="text-[10px] font-tech text-slate-400 flex items-center space-x-2 pt-1 border-t border-[#182a44]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Compliant with MALE UAV SWaP-C (Size, Weight, Power & Cost) Envelope</span>
            </div>
          </div>

          {/* Column 3: Model Compression Indicator (INT8 & Pruning) */}
          <div className="p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col justify-between space-y-3">
            <div className="text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide flex items-center justify-between">
              <span>Model Compression Status</span>
              <span className="text-[10px] font-tech text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/40">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5 font-tech text-xs">
              {/* Quantization */}
              <div className="p-2 rounded bg-[#0e1c31] border border-[#1a3152]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">1. Quantization: INT8 (PTQ)</span>
                  <span className="text-emerald-400 font-bold">99.4% Acc Retained</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  KL-Divergence Entropy Calibration against 4,000 synthetic aero-piston cycles.
                </p>
              </div>

              {/* Pruning */}
              <div className="p-2 rounded bg-[#0e1c31] border border-[#1a3152]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">2. Structured Pruning: 2:4 Sparsity</span>
                  <span className="text-cyan-400 font-bold">42% Zeroed</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Hardware-accelerated 2:4 structured sparse matrix multiply on Ampere Tensor Cores.
                </p>
              </div>

              {/* Engine */}
              <div className="p-2 rounded bg-[#0e1c31] border border-[#1a3152]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">3. Runtime Graph Fusion</span>
                  <span className="text-indigo-400 font-bold">TensorRT 10.2</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Conv + BatchNorm + ReLU operator fusion eliminated 38 kernel launch calls per step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SUB-PANEL 3 — Secure Telemetry & CAN Bus Monitor */}
      {/* ========================================================================= */}
      <section
        className={`p-4 rounded-xl border flex flex-col space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#08101e] border-[#162740]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182944] pb-2.5">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="font-chakra font-bold text-sm tracking-wider text-slate-100 uppercase">
              SUB-PANEL 3 — Secure Telemetry & Real-Time CAN Bus Monitor
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-xs font-tech">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>AES-256-GCM Active</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-slate-300">
              ECDH Curve25519 Session Re-Key: <span className="text-cyan-400">142s</span>
            </div>
          </div>
        </div>

        {/* Security & Datalink Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-tech text-xs">
          {/* Metric 1: CRC Error Rate */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">Packet CRC Error Rate</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{crcErrorRate}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Nominal (&lt; 0.05%)</div>
          </div>

          {/* Metric 2: Packet Loss */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">Packet Loss %</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5">{packetLossRate}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">RS(255,223) FEC Active</div>
          </div>

          {/* Metric 3: End-to-End Latency */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="text-[10px] text-slate-400 uppercase">Telemetry Latency</div>
            <div className="text-base font-bold text-slate-200 mt-0.5">{linkLatencyMs} ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Ground-to-Air Turnaround</div>
          </div>

          {/* Metric 4: Bandwidth Usage Gauge */}
          <div className="p-2.5 rounded-lg border border-[#172b48] bg-[#0a1424]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>Bandwidth Usage</span>
              <span className="font-bold text-cyan-300">
                {bandwidthKbps} / {maxBandwidthKbps} kbps
              </span>
            </div>
            <div className="w-full bg-[#122238] h-2 rounded mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded transition-all duration-300"
                style={{ width: `${(bandwidthKbps / maxBandwidthKbps) * 100}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>{((bandwidthKbps / maxBandwidthKbps) * 100).toFixed(0)}% Link Cap</span>
              <span className="text-emerald-400">NOMINAL</span>
            </div>
          </div>
        </div>

        {/* CAN Bus Monitor (Live Scrolling Table + Filters) */}
        <div className="p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-chakra font-bold text-xs text-slate-200 uppercase tracking-wide">
                Live CAN Bus Frame Monitor (ISO 11898 CAN 2.0B / CAN-FD)
              </span>
            </div>

            {/* Controls & Filter */}
            <div className="flex flex-wrap items-center gap-2 font-tech text-xs">
              {/* Category Filter */}
              <div className="flex rounded border border-[#182c48] bg-[#08101e] p-0.5">
                {(['ALL', 'ENGINE', 'AVIONICS', 'PAYLOAD'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCanFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      canFilter === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Only Anomalies Toggle */}
              <button
                onClick={() => setCanOnlyAnomalies(!canOnlyAnomalies)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                  canOnlyAnomalies
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                    : 'bg-[#0d1b2f] border-[#182f50] text-slate-400 hover:text-slate-200'
                }`}
              >
                {canOnlyAnomalies ? '⚠ SHOWING ANOMALIES ONLY' : 'SHOW ALL FRAMES'}
              </button>

              {/* Pause / Resume */}
              <button
                onClick={() => setIsCanStreaming(!isCanStreaming)}
                className="px-2 py-1 rounded text-[10px] font-bold border border-[#1b3456] bg-[#0d1b2f] text-slate-300 hover:text-cyan-300 flex items-center space-x-1"
                title={isCanStreaming ? 'Pause streaming' : 'Resume streaming'}
              >
                {isCanStreaming ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isCanStreaming ? 'PAUSE' : 'RESUME'}</span>
              </button>

              {/* Simulate Injected Glitch */}
              <button
                onClick={() => setCorruptedInjected(!corruptedInjected)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                  corruptedInjected
                    ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                    : 'bg-[#1a2133] hover:bg-[#222d44] border-slate-700 text-slate-300'
                }`}
                title="Simulate injection of malformed CAN frame"
              >
                {corruptedInjected ? 'CLEAR GLITCH' : 'TEST CORRUPTED FRAME'}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[220px] rounded border border-[#162740] bg-[#060c18]">
            <table className="w-full text-left font-tech text-xs">
              <thead className="bg-[#0b1626] text-slate-400 uppercase text-[10px] sticky top-0 border-b border-[#162842]">
                <tr>
                  <th className="py-1.5 px-3">CAN ID</th>
                  <th className="py-1.5 px-3">Subsystem</th>
                  <th className="py-1.5 px-3">Signal Name</th>
                  <th className="py-1.5 px-3">Timestamp</th>
                  <th className="py-1.5 px-3">Data Bytes (Hex)</th>
                  <th className="py-1.5 px-3">DLC</th>
                  <th className="py-1.5 px-3">Frame Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101e33]">
                {canFrames
                  .filter((frame) => {
                    if (canFilter !== 'ALL' && frame.source !== canFilter) return false;
                    if (canOnlyAnomalies && frame.status === 'VALID') return false;
                    return true;
                  })
                  .slice(0, 15)
                  .map((frame, idx) => {
                    const isCorrupted = frame.status === 'CORRUPTED';
                    const isAnomalous = frame.status === 'ANOMALOUS';

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isCorrupted
                            ? 'bg-rose-950/40 text-rose-200'
                            : isAnomalous
                            ? 'bg-amber-950/30 text-amber-200'
                            : 'hover:bg-[#0c182a] text-slate-300'
                        }`}
                      >
                        <td className="py-1.5 px-3 font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isCorrupted
                                ? 'bg-rose-900 border border-rose-500 text-white font-mono'
                                : isAnomalous
                                ? 'bg-amber-950 border border-amber-600 text-amber-300'
                                : 'bg-[#0f213a] text-cyan-300'
                            }`}
                          >
                            {frame.id}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-[10px] text-slate-400">{frame.source}</td>
                        <td className="py-1.5 px-3 font-semibold">{frame.name}</td>
                        <td className="py-1.5 px-3 text-slate-400 text-[11px]">{frame.timestamp}</td>
                        <td className="py-1.5 px-3 font-mono tracking-wider text-[11px]">
                          {frame.data}
                        </td>
                        <td className="py-1.5 px-3 text-slate-400">{frame.dlc}</td>
                        <td className="py-1.5 px-3">
                          {isCorrupted ? (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                              CORRUPTED (CRC)
                            </span>
                          ) : isAnomalous ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold text-[10px]">
                              ANOMALY FLAG
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                              VALID
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SUB-PANEL 4 — Federated Learning Status */}
      {/* ========================================================================= */}
      <section
        className={`p-4 rounded-xl border flex flex-col space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#08101e] border-[#162740]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182944] pb-2.5">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h2 className="font-chakra font-bold text-sm tracking-wider text-slate-100 uppercase">
              SUB-PANEL 4 — Federated Learning Fleet Aggregation & Privacy
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs font-tech">
            <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-bold">
              Differential Privacy (ε = 1.0, δ = 1e-5) Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tactical Fleet Map / Schematic (5 UAVs) */}
          <div className="lg:col-span-7 p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide">
              <span>Fleet Distributed Model Contributors (MALE UAV Network)</span>
              <span className="text-[10px] font-tech text-cyan-400">5 Active Nodes</span>
            </div>

            {/* Schematic Node Grid */}
            <div className="space-y-2">
              {fleetUavs.map((uav) => (
                <div
                  key={uav.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    uav.isCurrent
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-[#0c182a] border-[#182e4e]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1.5 rounded ${
                        uav.isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-[#152742] text-slate-300'
                      }`}
                    >
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-chakra font-bold text-xs text-slate-100">
                          {uav.id} ({uav.callsign})
                        </span>
                        {uav.isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 border border-cyan-400 text-[9px] font-tech text-cyan-300 font-bold">
                            CURRENT SORTIE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-tech">{uav.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 font-tech text-xs">
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">Local Accuracy</div>
                      <div className="font-bold text-emerald-400">{uav.localAcc}%</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-slate-400 text-[10px]">Sync Status</div>
                      <div
                        className={`text-[11px] font-bold ${
                          uav.status.includes('ACTIVE')
                            ? 'text-cyan-400 animate-pulse'
                            : 'text-slate-300'
                        }`}
                      >
                        {uav.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 rounded bg-[#07101d] border border-[#142640] text-[11px] font-tech text-slate-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Zero raw flight telemetry leaves the UAV airframe. Only weight gradients with Gaussian noise injection are securely aggregated (SecAgg protocol).
              </span>
            </div>
          </div>

          {/* Aggregated Model Performance & Federation Actions */}
          <div className="lg:col-span-5 p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide">
                <span>Global Federated Model Accuracy Trend</span>
                <span className="text-[10px] font-tech text-emerald-400">FedAvg Algorithm</span>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-2 mt-3 font-tech text-xs">
                <div className="p-2 rounded bg-[#0e1c31] border border-[#1c3558]">
                  <div className="text-[10px] text-slate-400 uppercase">Current Fleet Round</div>
                  <div className="text-lg font-bold text-cyan-300 mt-0.5">Round #{fleetRound}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Last Sync: {fleetRoundTime}</div>
                </div>

                <div className="p-2 rounded bg-[#0e1c31] border border-[#1c3558]">
                  <div className="text-[10px] text-slate-400 uppercase">Global Model Accuracy</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">98.6%</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{fleetDelta}% from R{fleetRound - 1}</div>
                </div>
              </div>

              {/* Accuracy Trend Progression Chart (Simulated Bar/Line) */}
              <div className="mt-3 p-2.5 rounded bg-[#091322] border border-[#162740] font-tech text-xs">
                <div className="text-[10px] text-slate-400 uppercase mb-2">Round-by-Round Convergence</div>
                <div className="flex items-end justify-between h-20 pt-2 px-1">
                  {[
                    { r: 'R1', acc: 91.2 },
                    { r: 'R3', acc: 93.4 },
                    { r: 'R6', acc: 95.1 },
                    { r: 'R9', acc: 96.8 },
                    { r: 'R12', acc: 98.1 },
                    { r: `R${fleetRound}`, acc: 98.6 },
                  ].map((pt, idx) => (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <span className="text-[9px] text-cyan-300 font-bold">{pt.acc}%</span>
                      <div
                        className="w-5 sm:w-6 bg-gradient-to-t from-cyan-600 to-emerald-400 rounded-t"
                        style={{ height: `${((pt.acc - 88) / 12) * 55}px` }}
                      ></div>
                      <span className="text-[9px] text-slate-400">{pt.r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Federation Action Button */}
            <button
              onClick={handleSimulateFederation}
              disabled={isFederating}
              className={`w-full py-2 px-3 rounded text-xs font-chakra font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                isFederating
                  ? 'bg-cyan-950/60 border border-cyan-500 text-cyan-300 animate-pulse'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/60 text-cyan-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFederating ? 'animate-spin' : ''}`} />
              <span>
                {isFederating
                  ? `FEDERATING ROUND #${fleetRound + 1}...`
                  : `TRIGGER FEDERATED ROUND #${fleetRound + 1}`}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SUB-PANEL 5 — Explainable AI (XAI) Console & Real-Time SHAP Waterfall */}
      {/* ========================================================================= */}
      <section
        className={`p-4 rounded-xl border flex flex-col space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#08101e] border-[#162740]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#182944] pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="font-chakra font-bold text-sm tracking-wider text-slate-100 uppercase">
              SUB-PANEL 5 — Explainable AI Console (SHAP Waterfall & Confidence Calibration)
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs font-tech">
            <span className="text-slate-400">Diagnosis:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                activeFault === 'NORMAL'
                  ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/50 border border-rose-500/50 text-rose-300'
              }`}
            >
              {activeFault.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Natural Language Explanation Box */}
        <div className="p-3.5 rounded-lg border border-cyan-500/40 bg-[#091526] font-rajdhani text-sm text-slate-200 flex items-start space-x-3 shadow-inner">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="font-chakra font-bold text-xs uppercase tracking-wider text-cyan-400">
              PHYSICS-GROUNDED AI DIAGNOSTIC EXPLANATION
            </div>
            <p className="text-slate-200 font-semibold text-sm leading-relaxed">
              "{shapAnalysis.explanation}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Real-time SHAP Waterfall Chart */}
          <div className="lg:col-span-7 p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide">
              <span>SHAP Feature Value Contributions (Waterfall)</span>
              <span className="text-[10px] font-tech text-cyan-400">
                Base E[f(x)] = {shapAnalysis.baseValue} → f(x) = {shapAnalysis.predictedProbability}
              </span>
            </div>

            {/* Waterfall Items */}
            <div className="space-y-2 font-tech text-xs pt-1">
              {shapAnalysis.features.map((feat, idx) => {
                const isPositive = feat.shap > 0;
                const widthPercent = Math.min(100, Math.abs(feat.shap) * 200);

                return (
                  <div key={idx} className="p-2 rounded bg-[#0c182a] border border-[#172e4c]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-200 font-bold">{feat.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">{feat.value}</span>
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isPositive ? `+${feat.shap.toFixed(2)}` : feat.shap.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Bar */}
                    <div className="w-full bg-[#122238] h-2 rounded overflow-hidden flex">
                      {isPositive ? (
                        <div
                          className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      ) : (
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">{feat.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Feature Importance Ranking & Calibration Diagram */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Feature Importance Ranking */}
            <div className="p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col space-y-2.5">
              <div className="text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide flex items-center justify-between">
                <span>Global Feature Importance Ranking</span>
                <span className="text-[10px] font-tech text-slate-400">Random Forest + GBDT</span>
              </div>

              <div className="space-y-1.5 font-tech text-xs">
                {[
                  { name: 'CHT (Cylinder Head Temp)', pct: 28.4, color: 'bg-rose-500' },
                  { name: 'EGT (Exhaust Gas Temp)', pct: 24.1, color: 'bg-amber-500' },
                  { name: 'Fuel Flow Rate (L/h)', pct: 18.7, color: 'bg-cyan-500' },
                  { name: 'Vibration Harmonic (g RMS)', pct: 12.8, color: 'bg-indigo-500' },
                  { name: 'Oil Pressure (bar)', pct: 10.5, color: 'bg-emerald-500' },
                  { name: 'Engine RPM', pct: 5.5, color: 'bg-purple-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[11px]">
                    <span className="w-4 text-slate-500 text-[10px]">{idx + 1}.</span>
                    <span className="flex-1 text-slate-300 truncate">{item.name}</span>
                    <div className="w-24 bg-[#122238] h-2 rounded overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded`}
                        style={{ width: `${(item.pct / 28.4) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right font-bold text-slate-200">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Confidence Calibration Chart */}
            <div className="p-3.5 rounded-lg border border-[#172b48] bg-[#0a1424] flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide">
                <span>Model Confidence Calibration</span>
                <span className="text-[10px] font-tech text-emerald-400">Brier: 0.034</span>
              </div>

              {/* Calibration Curve Visual */}
              <div className="p-2.5 rounded bg-[#091322] border border-[#162740] font-tech text-xs flex flex-col space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Predicted Prob vs Actual Frequency</span>
                  <span className="text-cyan-400">Near-Optimal Calibration</span>
                </div>
                <div className="h-16 w-full flex items-end justify-between px-2 pt-1 border-b border-l border-[#1b3252]">
                  {[0.1, 0.25, 0.45, 0.65, 0.85, 0.98].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
                        style={{ marginBottom: `${val * 45}px` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                  <span>0.0 (Safe)</span>
                  <span>0.5 (Warning)</span>
                  <span>1.0 (Critical)</span>
                </div>
              </div>

              <div className="text-[10px] font-tech text-slate-400 leading-tight">
                Empirical reliability diagram demonstrates zero overconfidence in boundary flight regimes, preventing false alarm induced mission aborts.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
