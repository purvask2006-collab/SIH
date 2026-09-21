import React, { useState, useEffect, useRef } from 'react';
import {
  FaultType,
  OperatingControls,
  TelemetryData,
  MissionPhase,
  AlertMessage,
} from './types/engine';
import { simulateAeroPistonTelemetry } from './services/physicsEngine';
import {
  computeExpectedValues,
  computeResidualComparison,
  computeEngineHealthScores,
  evaluateAiDiagnostics,
  computeRulEstimate,
} from './services/digitalTwinModel';
import { AerospaceTopNav } from './components/AerospaceTopNav';
import { AerospaceGaugesRow } from './components/AerospaceGaugesRow';
import { AerospaceHealthPanel } from './components/AerospaceHealthPanel';
import { AerospaceSimulationHero } from './components/AerospaceSimulationHero';
import { AerospaceMultiTraceChart } from './components/AerospaceMultiTraceChart';
import { AerospaceRightPanel } from './components/AerospaceRightPanel';
import { AerospaceBottomBar } from './components/AerospaceBottomBar';
import { DigitalTwinComparison } from './components/DigitalTwinComparison';
import { WhatIfSimulation } from './components/WhatIfSimulation';
import { ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';

export function App() {
  // Flight Operating Controls (Baseline Cruise at FL140)
  const [controls, setControls] = useState<OperatingControls>({
    throttle: 68,
    altitude: 14000,
    ambientTemp: 5,
    engineLoad: 70,
  });

  // Active Fault State
  const [activeFault, setActiveFault] = useState<FaultType>('NORMAL');
  const [faultSeverity, setFaultSeverity] = useState<number>(0);

  // Active Mission Phase
  const [currentMissionPhase, setCurrentMissionPhase] = useState<MissionPhase>('CRUISE');

  // Drawer / Secondary Analysis toggle
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState<boolean>(false);

  // Real-Time Telemetry State
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData>(() =>
    simulateAeroPistonTelemetry(
      { throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 },
      'NORMAL',
      0,
      0
    )
  );
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);

  // Alerts List with Soft Pastel Notification Banners
  const [alerts, setAlerts] = useState<AlertMessage[]>([
    {
      id: 'al-init',
      timestamp: '12:00:00',
      level: 'NORMAL',
      subsystem: 'THERMAL',
      message: 'Propulsion system operating within certified flight envelope.',
      actionRequired: 'Maintain nominal cruise profile.',
    },
  ]);

  const elapsedSecondsRef = useRef<number>(1420);

  // Real-Time Telemetry Loop (300ms update rate for fluid gauges and waveforms)
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
        if (next.length > 50) {
          return next.slice(next.length - 50);
        }
        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [controls, activeFault, faultSeverity]);

  // Digital Twin Computations
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

  // Dynamic Alert Generation when fault changes
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
            message: 'All engine channels restored to nominal operating parameters.',
            actionRequired: 'Telemetry surveillance active.',
          },
          ...prev.slice(0, 9),
        ]);
      } else if (activeFault === 'INJECTOR_DEGRADATION') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'COMBUSTION',
            message: 'Fuel injector partial restriction detected on Cylinder #2. EGT residual +42°C.',
            actionRequired: 'Reduce cruise throttle to 60%; monitor cylinder balance.',
          },
          ...prev.slice(0, 9),
        ]);
      } else if (activeFault === 'OVERHEATING') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'CRITICAL',
            subsystem: 'THERMAL',
            message: 'Cylinder head temperature exceedance (> 185°C). Cooling jacket heat rejection compromised.',
            actionRequired: 'Immediate throttle step-down; enrich mixture to avoid thermal detonation.',
          },
          ...prev.slice(0, 9),
        ]);
      } else if (activeFault === 'LUBRICATION_FAILURE') {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'CRITICAL',
            subsystem: 'LUBRICATION',
            message: 'Main oil gallery pressure collapse (< 2.0 bar). Severe hydrodynamic bearing risk.',
            actionRequired: 'Prepare descent vector; land at nearest diversion airstrip.',
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        setAlerts((prev) => [
          {
            id: `al-${Date.now()}`,
            timestamp: now,
            level: 'WARNING',
            subsystem: 'MECHANICAL',
            message: `Telemetry anomaly detected: ${activeFault.replace(/_/g, ' ')}.`,
            actionRequired: 'Verify airframe vibration dampers and TCU actuators.',
          },
          ...prev.slice(0, 9),
        ]);
      }
    }
  }, [activeFault]);

  // Mission Phase selector handler
  const handleMissionPhaseSelect = (phase: MissionPhase) => {
    setCurrentMissionPhase(phase);
    switch (phase) {
      case 'TAKEOFF':
        setControls({ throttle: 100, altitude: 500, ambientTemp: 26, engineLoad: 100 });
        break;
      case 'CLIMB':
        setControls({ throttle: 88, altitude: 8000, ambientTemp: 14, engineLoad: 88 });
        break;
      case 'CRUISE':
        setControls({ throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 });
        break;
      case 'HIGH_ALTITUDE_LOITER':
        setControls({ throttle: 78, altitude: 22000, ambientTemp: -18, engineLoad: 80 });
        break;
      case 'DESCENT':
      case 'LANDING':
        setControls({ throttle: 35, altitude: 2000, ambientTemp: 24, engineLoad: 38 });
        break;
    }
  };

  // Preset handler
  const handlePresetSelect = (preset: 'nominal' | 'injector' | 'cooling' | 'oil' | 'altitude') => {
    if (preset === 'nominal') {
      setActiveFault('NORMAL');
      setFaultSeverity(0);
      setControls({ throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 });
      setCurrentMissionPhase('CRUISE');
    } else if (preset === 'altitude') {
      setActiveFault('NORMAL');
      setFaultSeverity(0);
      setControls({ throttle: 80, altitude: 22000, ambientTemp: -18, engineLoad: 82 });
      setCurrentMissionPhase('HIGH_ALTITUDE_LOITER');
    } else if (preset === 'injector') {
      setActiveFault('INJECTOR_DEGRADATION');
      setFaultSeverity(0.85);
      setControls({ throttle: 72, altitude: 14000, ambientTemp: 5, engineLoad: 75 });
    } else if (preset === 'cooling') {
      setActiveFault('OVERHEATING');
      setFaultSeverity(0.9);
      setControls({ throttle: 90, altitude: 8000, ambientTemp: 32, engineLoad: 92 });
      setCurrentMissionPhase('CLIMB');
    } else if (preset === 'oil') {
      setActiveFault('LUBRICATION_FAILURE');
      setFaultSeverity(0.88);
      setControls({ throttle: 65, altitude: 12000, ambientTemp: 10, engineLoad: 68 });
    }
  };

  // Reset handler
  const handleResetSimulation = () => {
    setActiveFault('NORMAL');
    setFaultSeverity(0);
    setControls({ throttle: 68, altitude: 14000, ambientTemp: 5, engineLoad: 70 });
    setCurrentMissionPhase('CRUISE');
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Top Navigation Bar: White background, subtle border, green/amber/red status pills */}
      <AerospaceTopNav
        overallHealth={healthScores.overall}
        anomalyScore={anomalyScore}
        activeFault={activeFault}
        criticalAlertCount={alerts.filter((a) => a.level === 'CRITICAL').length}
        warningAlertCount={alerts.filter((a) => a.level === 'WARNING').length}
        onResetSimulation={handleResetSimulation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full p-3 sm:p-4 md:p-5 flex flex-col space-y-4">
        {/* 2. Top Row: Six Circular Real-Time Gauges with Sparkline Graphs */}
        <section aria-label="Engine Instrumentation Gauges">
          <AerospaceGaugesRow
            telemetry={latestTelemetry}
            history={telemetryHistory}
          />
        </section>

        {/* 3. Main 3-Column Dashboard Layout */}
        <section aria-label="Core Telemetry and Simulation Matrix" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT PANEL (col-span-3): Vertical health index bar chart with horizontal progress bars */}
          <aside className="lg:col-span-3 w-full">
            <AerospaceHealthPanel
              health={healthScores}
              anomalyScore={anomalyScore}
            />
          </aside>

          {/* CENTER PANEL (col-span-6): 3D Simulation as MAIN CHARACTER + Prominent Multi-Trace Line Chart */}
          <section className="lg:col-span-6 w-full flex flex-col space-y-4">
            {/* HERO: The 3D Engine Digital Twin Simulation */}
            <AerospaceSimulationHero
              telemetry={latestTelemetry}
              activeFault={activeFault}
              faultSeverity={faultSeverity}
              controls={controls}
              onControlsChange={setControls}
              onFaultChange={(fault, sev) => {
                setActiveFault(fault);
                setFaultSeverity(sev);
              }}
              onSelectPreset={handlePresetSelect}
              onReset={handleResetSimulation}
              theme="light"
            />

            {/* PROMINENT TIME-SERIES LINE CHART with multiple sensor traces and vertical cursor */}
            <AerospaceMultiTraceChart
              history={telemetryHistory}
              latest={latestTelemetry}
            />
          </section>

          {/* RIGHT PANEL (col-span-3): RUL countdown display in navy numerals, mission phase pills, soft pastel alerts */}
          <aside className="lg:col-span-3 w-full">
            <AerospaceRightPanel
              rul={rulEstimate}
              currentPhase={currentMissionPhase}
              onSelectPhase={handleMissionPhaseSelect}
              alerts={alerts}
              onAcknowledgeAlerts={() => setAlerts([])}
            />
          </aside>
        </section>

        {/* Optional Deep Engineering Inspection Drawer (Kalman Residuals & What-If Mission Envelope) */}
        <section className="bg-white rounded-xl border border-[#e5e9f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <button
            onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-[#1a3a5c] uppercase tracking-wider"
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#00897b]" />
              <span>ADVANCED KALMAN STATE COMPARISON & WHAT-IF MISSION PLANNER</span>
              <span className="text-[10px] font-normal text-slate-500 normal-case">
                (Expand for full tolerance residual tables and flight envelope modeling)
              </span>
            </div>
            {showAdvancedAnalytics ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdvancedAnalytics && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DigitalTwinComparison
                items={comparisonItems}
                anomalyScore={anomalyScore}
              />
              <WhatIfSimulation currentHealth={healthScores.overall} />
            </div>
          )}
        </section>
      </main>

      {/* 4. Bottom Strip: Compact white status bar with circular dots and digital clock */}
      <AerospaceBottomBar elapsedSeconds={1420} />
    </div>
  );
}

export default App;
