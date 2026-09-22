import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertMessage,
  FaultType,
  MissionPhase,
  OperatingControls as OperatingControlsType,
  TelemetryData,
} from './types/engine';
import { simulateAeroPistonTelemetry } from './services/physicsEngine';
import {
  computeExpectedValues,
  computeResidualComparison,
  computeEngineHealthScores,
  evaluateAiDiagnostics,
  computeRulEstimate,
} from './services/digitalTwinModel';
import {
  MISSION_PHASES,
  DEMO_STEPS,
  MissionReplayPoint,
} from './services/missionService';

import { TopBar } from './components/TopBar';
import { Engine3DView } from './components/Engine3DView';
import { EngineHealthPanel } from './components/EngineHealthPanel';
import { TelemetryCharts } from './components/TelemetryCharts';
import { OperatingControls } from './components/OperatingControls';
import { FaultInjectionPanel } from './components/FaultInjectionPanel';
import { DigitalTwinComparison } from './components/DigitalTwinComparison';
import { AiDiagnosticsPanel } from './components/AiDiagnosticsPanel';
import { MissionSimulationPanel } from './components/MissionSimulationPanel';
import { MissionReplayTimeline } from './components/MissionReplayTimeline';
import { WhatIfSimulation } from './components/WhatIfSimulation';
import { AlertBannerAndLogs } from './components/AlertBannerAndLogs';
import { DemoController } from './components/DemoController';

// Dedicated components matching the user-requested UI
import { VibesparTopBar } from './components/VibesparTopBar';
import { VibesparEngineVisualization } from './components/VibesparEngineVisualization';
import { VibesparTelemetryGauges } from './components/VibesparTelemetryGauges';
import { VibesparMissionProfile } from './components/VibesparMissionProfile';
import { VibesparEngineHealthIndex } from './components/VibesparEngineHealthIndex';
import { VibesparAiDiagnostics } from './components/VibesparAiDiagnostics';
import { VibesparBottomBar } from './components/VibesparBottomBar';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  // Theme state: default to 'light' (Tactical Daylight Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('drdo_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('drdo_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Operating controls state (matches 8,400 ft cruise initial state)
  const [controls, setControls] = useState<OperatingControlsType>({
    throttle: 68,
    altitude: 8400,
    ambientTemp: 15,
    engineLoad: 70,
  });

  // Injected fault state (defaults to OVERHEATING / Cooling Degradation matching screenshot)
  const [activeFault, setActiveFault] = useState<FaultType>('OVERHEATING');
  const [faultSeverity, setFaultSeverity] = useState<number>(0.9);

  // Advanced Digital Twin & Telemetry Lab drawer state
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);

  // Mission profile phase
  const [currentMissionPhase, setCurrentMissionPhase] = useState<MissionPhase>('CRUISE');

  // Flight Data Recorder (FDR) / Live mode toggle
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);

  // Telemetry real-time buffer
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData>(() =>
    simulateAeroPistonTelemetry(
      { throttle: 68, altitude: 8400, ambientTemp: 15, engineLoad: 70 },
      'OVERHEATING',
      0.9,
      84
    )
  );
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

  // Selected sensor for cross-highlighting
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

  // Alerts list
  const [alerts, setAlerts] = useState<AlertMessage[]>([
    {
      id: 'al-init',
      timestamp: '12:47:03',
      level: 'WARNING',
      subsystem: 'THERMAL',
      message: 'Cooling degradation detected. CHT & EGT elevated.',
      actionRequired: 'Reduce engine load and monitor thermal parameters.',
    },
  ]);

  // Demo Mode state
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(true);

  // Starts at 84 seconds (01:24) to match screenshot
  const elapsedSecondsRef = useRef<number>(84);

  // --- Real-Time Telemetry Physics Loop (500ms update rate for stable smooth rendering) ---
  useEffect(() => {
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 0.5;

      const currentSec = elapsedSecondsRef.current;
      const newTelemetry = simulateAeroPistonTelemetry(
        controls,
        activeFault,
        faultSeverity,
        currentSec
      );

      setLatestTelemetry(newTelemetry);

      setTelemetryHistory((prev) => {
        const next = [...prev, newTelemetry];
        if (next.length > 45) {
          return next.slice(next.length - 45);
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [controls, activeFault, faultSeverity]);

  // --- Digital Twin Computations ---
  const expectedValues = computeExpectedValues(controls);
  const { items: comparisonItems, anomalyScore } = computeResidualComparison(
    latestTelemetry,
    expectedValues
  );
  const healthScores = computeEngineHealthScores(comparisonItems, latestTelemetry);
  const aiDiagnostics = evaluateAiDiagnostics(comparisonItems, anomalyScore, healthScores);
  const rulEstimate = computeRulEstimate(
    healthScores,
    anomalyScore,
    aiDiagnostics.probableFault
  );

  // --- Automatic Alert Triggering on Subsystem Deviation ---
  const lastLoggedFaultRef = useRef<string>('NORMAL');
  useEffect(() => {
    if (activeFault !== lastLoggedFaultRef.current) {
      lastLoggedFaultRef.current = activeFault;
      const now = new Date().toTimeString().split(' ')[0];

      if (activeFault === 'NORMAL') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'NORMAL',
            subsystem: 'THERMAL',
            message: 'Engine operating within expected envelope.',
            actionRequired: 'Maintain cruise altitude and continuous CAN telemetry surveillance.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'INJECTOR_DEGRADATION') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'COMBUSTION',
            message: 'Emerging thermal degradation detected. EGT residual +45°C on Cylinder #2.',
            actionRequired: 'Throttle back to 60%, prepare diversion to alternate recovery strip.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'LUBRICATION_FAILURE') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'CRITICAL',
            subsystem: 'LUBRICATION',
            message: 'Severe lubrication degradation detected. Recovery/maintenance advisory.',
            actionRequired: 'CRITICAL: Bearing boundary seizure risk. Initiate emergency descent immediately.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'OVERHEATING') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'CRITICAL',
            subsystem: 'THERMAL',
            message: 'Cylinder head temperature exceedance (> 210°C). Thermal runaway boundary.',
            actionRequired: 'Enrich mixture, open cowl flaps, step down throttle to 45%.',
          },
          ...prev.slice(0, 19),
        ]);
      } else if (activeFault === 'SENSOR_DRIFT') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'SENSOR',
            message: 'Sensor Telemetry Drift: CHT Thermocouple decoupled from coupled thermal channels.',
            actionRequired: 'AI Isolated Sensor Failure: Do not command engine shutdown; flag avionics bay.',
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'MECHANICAL',
            message: `Fault signature active: ${activeFault.replace(/_/g, ' ')}.`,
            actionRequired: 'Monitor harmonic vibration trends and verify flight envelope safety.',
          },
          ...prev.slice(0, 19),
        ]);
      }
    }
  }, [activeFault]);

  // Current Headline for the Alert Banner
  const currentAlertHeadline =
    aiDiagnostics.status === 'CRITICAL'
      ? activeFault === 'LUBRICATION_FAILURE'
        ? 'Severe lubrication degradation detected. Recovery/maintenance advisory.'
        : 'Critical propulsion threshold exceedance! Immediate recovery advisory active.'
      : aiDiagnostics.status === 'WARNING'
      ? activeFault === 'INJECTOR_DEGRADATION'
        ? 'Emerging thermal degradation detected.'
        : `Diagnostic advisory: ${aiDiagnostics.probableFault}.`
      : 'Engine operating within expected envelope.';

  // --- Mission Phase Selection Handler ---
  const handleSelectMissionPhase = (phase: MissionPhase) => {
    setCurrentMissionPhase(phase);
    const cfg = MISSION_PHASES[phase];
    setControls((prev) => ({
      ...prev,
      altitude: cfg.altitude,
      throttle: cfg.throttle,
      engineLoad: cfg.engineLoad,
    }));
  };

  // --- Flight Data Recorder (FDR) Replay Handler ---
  const handleReplayPointSelect = useCallback((point: MissionReplayPoint) => {
    setControls(point.controls);
    setActiveFault(point.fault);
    setFaultSeverity(point.faultSeverity || 0.8);
  }, []);

  // --- Demo Mode Progression Controller ---
  const applyDemoStep = useCallback((stepIdx: number) => {
    const step = DEMO_STEPS[stepIdx];
    if (!step) return;

    if (step.step === 1) {
      setControls({ throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 });
      setActiveFault('NORMAL');
      setFaultSeverity(0);
    } else if (step.step === 2) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.35);
    } else if (step.step === 3) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.60);
    } else if (step.step === 4) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.75);
    } else if (step.step === 5) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.88);
    } else if (step.step === 6) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.92);
    } else if (step.step === 7) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.96);
    } else if (step.step === 8) {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(1.0);
    }
  }, []);

  // Demo auto-advance timer (5 seconds per phase for optimal evaluation pace)
  useEffect(() => {
    if (!isDemoActive || !isDemoPlaying) return;

    const timer = setInterval(() => {
      setDemoStepIndex((prev) => {
        if (prev < DEMO_STEPS.length - 1) {
          const next = prev + 1;
          applyDemoStep(next);
          return next;
        } else {
          // Loop back or hold at maintenance advisory
          return prev;
        }
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [isDemoActive, isDemoPlaying, applyDemoStep]);

  const startDemo = () => {
    setIsDemoActive(true);
    setDemoStepIndex(0);
    setIsDemoPlaying(true);
    applyDemoStep(0);
  };

  const stopDemo = () => {
    setIsDemoActive(false);
  };

  const handleDemoNext = () => {
    if (demoStepIndex < DEMO_STEPS.length - 1) {
      const next = demoStepIndex + 1;
      setDemoStepIndex(next);
      applyDemoStep(next);
    }
  };

  const handleDemoPrev = () => {
    if (demoStepIndex > 0) {
      const prev = demoStepIndex - 1;
      setDemoStepIndex(prev);
      applyDemoStep(prev);
    }
  };

  const handleDemoJump = (idx: number) => {
    setDemoStepIndex(idx);
    applyDemoStep(idx);
  };

  // Reset simulation to baseline cruise
  const handleResetSimulation = () => {
    setIsDemoActive(false);
    setActiveFault('NORMAL');
    setFaultSeverity(0.85);
    setControls({
      throttle: 68,
      altitude: 14000,
      ambientTemp: 5,
      engineLoad: 70,
    });
    setCurrentMissionPhase('CRUISE');
    setIsLiveMode(true);
  };

  // Format elapsed mission time as MM:SS (e.g. 01:24 matching screenshot)
  const elapsedMins = Math.floor(elapsedSecondsRef.current / 60);
  const elapsedSecs = Math.floor(elapsedSecondsRef.current % 60);
  const elapsedTimeStr = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        theme === 'light'
          ? 'bg-[#f1f5f9] text-[#020617]'
          : 'bg-[#060a12] text-slate-100'
      }`}
    >
      {/* 1. Header (Exact to screenshot: VIBESPAR, UAV-07, AERO-PISTON-01, MISSION-027, LIVE, UTC, CONNECTED) */}
      <VibesparTopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        uavId="UAV-07"
        engineId="AERO-PISTON-01"
        missionId="MISSION-027"
        isConnected={isLiveMode}
      />

      {/* Main Dashboard Layout (Exact 3-Column Layout from Screenshot) */}
      <main className="flex-1 p-3 sm:p-4.5 max-w-[1780px] mx-auto w-full flex flex-col space-y-4">
        {/* Active Demo Mode Stepper Banner (when active) */}
        {isDemoActive && (
          <DemoController
            currentStepIndex={demoStepIndex}
            isPlaying={isDemoPlaying}
            onTogglePlay={() => setIsDemoPlaying(!isDemoPlaying)}
            onNextStep={handleDemoNext}
            onPrevStep={handleDemoPrev}
            onStopDemo={stopDemo}
            onJumpToStep={handleDemoJump}
          />
        )}

        {/* The 3-Column Primary Grid from Screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* COLUMN 1: ENGINE VISUALIZATION (Reciprocating 4-cylinder cutaway + RPM readout + 3D toggle) */}
          <div className="lg:col-span-4 flex flex-col">
            <VibesparEngineVisualization
              telemetry={latestTelemetry}
              activeFault={activeFault}
              theme={theme}
              selectedSensor={selectedSensorId}
              onSelectSensor={(id) => setSelectedSensorId(id)}
            />
          </div>

          {/* COLUMN 2: TELEMETRY GAUGES + MISSION PROFILE */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Telemetry Gauges (RPM, CHT, EGT, OIL P, OIL T, VIBRATION) */}
            <VibesparTelemetryGauges
              telemetry={latestTelemetry}
              theme={theme}
            />

            {/* Mission Profile (Phases, Altitude, Fuel Rem, Endurance, Elapsed, Decision Support) */}
            <VibesparMissionProfile
              currentPhase={currentMissionPhase}
              onSelectPhase={handleSelectMissionPhase}
              altitude={controls.altitude}
              fuelRemainingL={62.4}
              enduranceHours={3.4}
              elapsedTimeStr={elapsedTimeStr}
              decisionSupportText={
                activeFault !== 'NORMAL' || anomalyScore > 0.5
                  ? 'REDUCE LOAD / MONITOR'
                  : 'NOMINAL ENVELOPE // CRUISE PROFILE'
              }
              decisionSupportStatus={
                aiDiagnostics.status === 'CRITICAL'
                  ? 'CRITICAL'
                  : activeFault !== 'NORMAL' || anomalyScore > 0.35
                  ? 'WARNING'
                  : 'NOMINAL'
              }
              theme={theme}
            />
          </div>

          {/* COLUMN 3: ENGINE HEALTH INDEX + AI DIAGNOSTICS */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Engine Health Index (74% overall health, warning badge, subsystem bars) */}
            <VibesparEngineHealthIndex
              health={healthScores}
              theme={theme}
            />

            {/* AI Diagnostics (0.81 anomaly score, cooling system degradation card) */}
            <VibesparAiDiagnostics
              diagnostic={aiDiagnostics}
              theme={theme}
            />
          </div>
        </div>

        {/* Bottom Bar: FAULT INJECTION + DEMO MODE (Exact to Screenshot) */}
        <VibesparBottomBar
          activeFault={activeFault}
          onSelectFault={(f) => {
            setActiveFault(f);
            if (f === 'NORMAL') {
              setControls((prev) => ({ ...prev, throttle: 68, altitude: 8400 }));
            }
          }}
          isDemoActive={isDemoActive}
          onToggleDemo={() => {
            if (isDemoActive) {
              setIsDemoPlaying(!isDemoPlaying);
            } else {
              startDemo();
            }
          }}
          theme={theme}
        />

        {/* Collapsible Advanced Digital Twin & Telemetry Lab */}
        <div className="w-full pt-2">
          <button
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className={`w-full py-2.5 px-4 rounded border font-chakra font-bold text-xs tracking-wider flex items-center justify-between transition-colors ${
              theme === 'light'
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-[#091222] hover:bg-[#0e1a30] border-[#182942] text-slate-300'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                [ADVANCED SIMULATION SUITE]
              </span>
              <span>
                REAL-TIME CHARTS • DIGITAL TWIN RESIDUAL MATRIX • WHAT-IF SCENARIO PLANNER • FDR TIMELINE
              </span>
            </span>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-[11px] uppercase font-tech">
                {showAdvancedTools ? 'HIDE LAB' : 'EXPAND LAB'}
              </span>
              {showAdvancedTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Expandable Advanced Lab Modules */}
          {showAdvancedTools && (
            <div className="mt-4 space-y-4 animate-fadeIn">
              {/* Alert System Banner & Expandable Log Drawer */}
              <AlertBannerAndLogs
                currentLevel={aiDiagnostics.status}
                currentHeadline={currentAlertHeadline}
                alerts={alerts}
                onAcknowledgeAlerts={() => setAlerts([])}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Expected vs Actual Residual Table + AI Prognostic Details */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <DigitalTwinComparison
                    items={comparisonItems}
                    anomalyScore={anomalyScore}
                  />
                  <AiDiagnosticsPanel
                    diagnostic={aiDiagnostics}
                    rul={rulEstimate}
                  />
                </div>

                {/* Real-Time Telemetry Stream Graphs (Recharts) + Actuator Controls */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <TelemetryCharts
                    history={telemetryHistory}
                    latest={latestTelemetry}
                    selectedChannel={selectedSensorId}
                    onSelectChannel={(ch) => setSelectedSensorId(ch)}
                  />
                  <OperatingControls
                    controls={controls}
                    onChange={setControls}
                    disabled={isDemoActive}
                  />
                </div>
              </div>

              {/* What-If Scenario Extrapolator + Flight Data Recorder Replay */}
              <div className="space-y-4">
                <WhatIfSimulation currentHealth={healthScores.overall} />
                <MissionReplayTimeline
                  onReplayPointSelect={handleReplayPointSelect}
                  isLiveMode={isLiveMode}
                  onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Technical Metadata */}
        <footer
          className={`w-full pt-3 pb-3 text-[10px] font-tech border-t flex flex-wrap items-center justify-between gap-2 select-none uppercase tracking-wider ${
            theme === 'light'
              ? 'border-slate-200 text-slate-500'
              : 'border-[#18263a] text-slate-500'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold font-chakra text-xs tracking-widest">
              VIBESPAR AERO-PISTON-01
            </span>
            <span>•</span>
            <span className="font-chakra">ROTAX 914-F TURBO DIGITAL TWIN // MALE UAV PROPULSION PHM</span>
          </div>
          <div className="font-chakra font-medium">
            HIGH-FIDELITY FAULT PREDICTION & PROGNOSTICS • GROUND CONTROL STATION (GCS)
          </div>
        </footer>
      </main>
    </div>
  );
}
