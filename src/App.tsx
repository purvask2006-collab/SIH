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

  // Operating controls state (nominal cruise initial state)
  const [controls, setControls] = useState<OperatingControlsType>({
    throttle: 68,
    altitude: 14000,
    ambientTemp: 5,
    engineLoad: 70,
  });

  // Injected fault state
  const [activeFault, setActiveFault] = useState<FaultType>('NORMAL');
  const [faultSeverity, setFaultSeverity] = useState<number>(0.85);

  // Mission profile phase
  const [currentMissionPhase, setCurrentMissionPhase] = useState<MissionPhase>('CRUISE');

  // Flight Data Recorder (FDR) / Live mode toggle
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);

  // Telemetry real-time buffer
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData>(() =>
    simulateAeroPistonTelemetry(
      { throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 },
      'NORMAL',
      1,
      0
    )
  );
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

  // Selected sensor for cross-highlighting
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);

  // Alerts list
  const [alerts, setAlerts] = useState<AlertMessage[]>([
    {
      id: 'al-init',
      timestamp: '12:00:00',
      level: 'NORMAL',
      subsystem: 'THERMAL',
      message: 'Engine operating within expected envelope.',
      actionRequired: 'Continue nominal mission loiter profile.',
    },
  ]);

  // Demo Mode state
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(true);

  const elapsedSecondsRef = useRef<number>(0);

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

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        theme === 'light'
          ? 'bg-[#f1f5f9] text-[#020617]'
          : 'bg-[#060a12] text-slate-100'
      }`}
    >
      {/* 1. Aerospace GCS Top Bar with Light/Dark Mode Switcher */}
      <TopBar
        onStartDemo={startDemo}
        isDemoRunning={isDemoActive}
        demoStep={demoStepIndex + 1}
        totalDemoSteps={DEMO_STEPS.length}
        onResetSimulation={handleResetSimulation}
        connectionStatus={isLiveMode ? 'LIVE' : 'STANDBY'}
        overallHealth={healthScores.overall}
        anomalyScore={anomalyScore}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1720px] mx-auto w-full flex flex-col space-y-3.5">
        {/* Active Demo Mode Controller Stepper Banner (when demo activated) */}
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

        {/* 13. Alert System Banner & Expandable Log Drawer */}
        <AlertBannerAndLogs
          currentLevel={aiDiagnostics.status}
          currentHeadline={currentAlertHeadline}
          alerts={alerts}
          onAcknowledgeAlerts={() => setAlerts([])}
        />

        {/* Primary Dual-Column GCS Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT SIDE: 3D Digital Twin + Residual Comparison + AI Diagnostics */}
          <div className="lg:col-span-6 flex flex-col space-y-3.5">
            {/* 2. 3D Digital Twin Viewport (TAPAS-BH-201 MALE UAV twin-boom propulsion) */}
            <div className="h-[480px] sm:h-[520px]">
              <Engine3DView
                telemetry={latestTelemetry}
                activeFault={activeFault}
                selectedSensor={selectedSensorId}
                onSelectSensor={(id) => setSelectedSensorId(id)}
                theme={theme}
              />
            </div>

            {/* 7. Digital Twin Expected vs Actual Comparison Panel */}
            <DigitalTwinComparison
              items={comparisonItems}
              anomalyScore={anomalyScore}
            />

            {/* 8 & 9. AI Diagnostics Module ("AI/ML PROTOTYPE") & RUL Panel */}
            <AiDiagnosticsPanel
              diagnostic={aiDiagnostics}
              rul={rulEstimate}
            />
          </div>

          {/* RIGHT SIDE: Health Metrics + Real-Time Telemetry Charts + Operating Controls + Fault Injection */}
          <div className="lg:col-span-6 flex flex-col space-y-3.5">
            {/* 3. Engine Health Panel (Overall Health + 5 Subsystems) */}
            <EngineHealthPanel health={healthScores} />

            {/* 4. Real-Time Telemetry Stream Graphs (Recharts) */}
            <TelemetryCharts
              history={telemetryHistory}
              latest={latestTelemetry}
              selectedChannel={selectedSensorId}
              onSelectChannel={(ch) => setSelectedSensorId(ch)}
            />

            {/* 5. Engine Operating Controls (Sliders: Throttle, Altitude, Temp, Load) */}
            <OperatingControls
              controls={controls}
              onChange={setControls}
              disabled={isDemoActive}
            />

            {/* 6. Fault Injection Panel (Normal, Injector, Misfire, Lub, Overheating, Vib, Drift) */}
            <FaultInjectionPanel
              activeFault={activeFault}
              onSelectFault={setActiveFault}
              faultSeverity={faultSeverity}
              onSeverityChange={setFaultSeverity}
              disabled={isDemoActive}
            />
          </div>
        </div>

        {/* LOWER ADVANCED MISSION SECTION: Mission Profiles, What-If Planner & FDR Replay */}
        <div className="space-y-3.5 pt-1">
          {/* 10. Mission Simulation (Takeoff, Climb, Cruise, Loiter, etc.) */}
          <MissionSimulationPanel
            currentPhase={currentMissionPhase}
            onSelectPhase={handleSelectMissionPhase}
            currentAltitude={controls.altitude}
            currentThrottle={controls.throttle}
            currentEngineLoad={controls.engineLoad}
            currentFuelFlow={latestTelemetry.fuelFlow}
            engineHealth={healthScores.overall}
            fuelRemainingKg={latestTelemetry.fuelRemainingKg}
            disabled={isDemoActive}
          />

          {/* 12. What-If Simulation Scenario Planner */}
          <WhatIfSimulation currentHealth={healthScores.overall} />

          {/* 11. Mission Replay Timeline (FDR 00:00 to 60:00) */}
          <MissionReplayTimeline
            onReplayPointSelect={handleReplayPointSelect}
            isLiveMode={isLiveMode}
            onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
          />
        </div>

        {/* Footer Technical Metadata & Aerospace Proof-of-Concept Notice */}
        <footer
          className={`w-full pt-4 pb-3 text-[10px] font-tech border-t flex flex-wrap items-center justify-between gap-2 select-none uppercase tracking-wider ${
            theme === 'light'
              ? 'border-[#cbd5e1] text-slate-700'
              : 'border-[#18263a] text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-cyan-700 dark:text-cyan-400 font-bold font-chakra text-xs tracking-widest">
              [DRDO-ADE / SIH 2026]
            </span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="font-chakra">TAPAS-BH-201 MALE UAV DIGITAL TWIN // LEVEL-4 PROGNOSTICS</span>
          </div>
          <div className="font-chakra font-medium">
            AERONAUTICAL DEVELOPMENT ESTABLISHMENT • DEFENCE RESEARCH & DEVELOPMENT ORGANISATION • TACTICAL GCS BENCH
          </div>
        </footer>
      </main>
    </div>
  );
}
