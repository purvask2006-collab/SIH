import {
  DemoStep,
  MissionPhase,
  MissionPhaseConfig,
  OperatingControls,
  WhatIfPrediction,
  WhatIfScenarioInput,
} from '../types/engine';
import { calculateAirDensityRatio } from './physicsEngine';

export const MISSION_PHASES: Record<MissionPhase, MissionPhaseConfig> = {
  TAKEOFF: {
    phase: 'TAKEOFF',
    name: 'Takeoff & Initial Ground Roll',
    altitude: 200,
    throttle: 100,
    engineLoad: 100,
    nominalFuelFlow: 35.5,
    nominalRisk: 'MODERATE',
    description: 'Maximum continuous takeoff power (WOT), sea-level air density, maximum mechanical stress.',
  },
  CLIMB: {
    phase: 'CLIMB',
    name: 'En-Route Climb to Altitude',
    altitude: 9500,
    throttle: 85,
    engineLoad: 88,
    nominalFuelFlow: 28.2,
    nominalRisk: 'LOW',
    description: 'High climb power profile, rising altitude, continuous thermal buildup on cylinder heads.',
  },
  CRUISE: {
    phase: 'CRUISE',
    name: 'High-Speed Transit Cruise',
    altitude: 14000,
    throttle: 68,
    engineLoad: 70,
    nominalFuelFlow: 20.4,
    nominalRisk: 'LOW',
    description: 'Economical power setting, steady thermal equilibrium, optimum cruise endurance envelope.',
  },
  HIGH_ALTITUDE_LOITER: {
    phase: 'HIGH_ALTITUDE_LOITER',
    name: 'High-Altitude Recon Loiter',
    altitude: 18500,
    throttle: 56,
    engineLoad: 60,
    nominalFuelFlow: 15.2,
    nominalRisk: 'LOW',
    description: 'Thin air density (0.53 ρ0), low indicated airspeed, extended loiter fuel conservation.',
  },
  THROTTLE_TRANSITION: {
    phase: 'THROTTLE_TRANSITION',
    name: 'Dynamic Evasive / Power Step',
    altitude: 11000,
    throttle: 88,
    engineLoad: 82,
    nominalFuelFlow: 30.1,
    nominalRisk: 'MODERATE',
    description: 'Rapid throttle excursion to evaluate ECU boost controller response and transient thermal lag.',
  },
  DESCENT: {
    phase: 'DESCENT',
    name: 'Controlled Operational Descent',
    altitude: 4500,
    throttle: 28,
    engineLoad: 35,
    nominalFuelFlow: 12.8,
    nominalRisk: 'LOW',
    description: 'Throttled back descent profile, shock-cooling risk mitigation on cylinder barrels.',
  },
  LANDING: {
    phase: 'LANDING',
    name: 'Final Approach & Touchdown',
    altitude: 400,
    throttle: 42,
    engineLoad: 50,
    nominalFuelFlow: 15.6,
    nominalRisk: 'LOW',
    description: 'Final glide path power management, variable wind gust propeller loading.',
  },
};

/**
 * Computes What-If predictive simulation for mission planning.
 */
export function calculateWhatIfPrediction(
  input: WhatIfScenarioInput,
  currentHealthIndex: number
): WhatIfPrediction {
  const { altitude, ambientTemp, throttle, durationHours } = input;
  const densityRatio = calculateAirDensityRatio(altitude);
  const throttleFactor = throttle / 100;

  // Power output in HP: Base 115 HP engine with altitude boost
  const powerHp = Math.round(
    115 * throttleFactor * (0.4 + 0.6 * Math.min(1.0, densityRatio * 1.2))
  );

  // Hourly fuel consumption in kg/h (fuel density ~0.72 kg/L)
  const hourlyFuelKg = Number(
    ((11.5 + throttleFactor * 24.5 * (0.7 + 0.3 * densityRatio)) * 0.72).toFixed(1)
  );
  const fuelConsumptionTotalKg = Number((hourlyFuelKg * durationHours).toFixed(1));

  // Predicted CHT (°C)
  const coolingEfficiency = Math.max(0.65, Math.pow(densityRatio, 0.4));
  const tempOffset = ambientTemp - 15;
  const predictedCht = Math.round(
    132 + throttleFactor * 42 + (tempOffset * 0.45) + ((1 - coolingEfficiency) * 22)
  );

  // Predicted EGT (°C)
  const predictedEgt = Math.round(675 + throttleFactor * 90 + (tempOffset * 0.3));

  // Health degradation over duration
  // High throttle, high ambient temp, and high altitude thin air accelerates wear
  const wearRatePerHour = 0.3 + (throttleFactor > 0.8 ? 0.9 : 0.2) + (ambientTemp > 35 ? 0.6 : 0) + (predictedCht > 180 ? 1.4 : 0);
  const predictedHealthLoss = Number((wearRatePerHour * durationHours).toFixed(1));
  const predictedHealthEnd = Math.max(10, Math.round(currentHealthIndex - predictedHealthLoss));

  // Total available fuel capacity: 65 kg
  const fuelCapacityKg = 65;
  const estimatedEnduranceHours = Number(Math.max(0.5, fuelCapacityKg / hourlyFuelKg).toFixed(1));

  // Risk calculation
  let missionRisk: 'LOW' | 'MODERATE' | 'CRITICAL' = 'LOW';
  let notes = 'Proposed envelope provides safe thermal margins and adequate reserve endurance.';

  if (fuelConsumptionTotalKg > fuelCapacityKg * 0.88 || predictedCht > 195 || predictedHealthEnd < 60) {
    missionRisk = 'CRITICAL';
    notes = 'WARNING: Exceeds fuel endurance reserve or triggers cylinder head thermal boundary.';
  } else if (fuelConsumptionTotalKg > fuelCapacityKg * 0.75 || predictedCht > 180 || predictedHealthEnd < 75) {
    missionRisk = 'MODERATE';
    notes = 'CAUTION: Elevated thermal stress on cylinder heads; endurance margin tightened.';
  }

  return {
    powerHp,
    fuelConsumptionTotalKg,
    predictedCht,
    predictedEgt,
    predictedHealthEnd,
    estimatedEnduranceHours,
    missionRisk,
    notes,
  };
}

/**
 * 60-Minute Mission Flight Data Recorder Replay Profile.
 * Pre-computes simulated flight data at 10-minute intervals.
 */
export interface MissionReplayPoint {
  timeStr: string;
  minute: number;
  phase: string;
  controls: OperatingControls;
  fault: 'NORMAL' | 'INJECTOR_DEGRADATION';
  faultSeverity: number;
  eventDescription: string;
}

export const REPLAY_TIMELINE: MissionReplayPoint[] = [
  {
    timeStr: '00:00',
    minute: 0,
    phase: 'TAKEOFF ROLL',
    controls: { throttle: 100, altitude: 250, ambientTemp: 28, engineLoad: 95 },
    fault: 'NORMAL',
    faultSeverity: 0,
    eventDescription: 'Runway departure at WOT. Full boost 34 inHg MAP. Nominal ignition sequence.',
  },
  {
    timeStr: '10:00',
    minute: 10,
    phase: 'CLIMB PROFILE',
    controls: { throttle: 85, altitude: 7200, ambientTemp: 18, engineLoad: 85 },
    fault: 'NORMAL',
    faultSeverity: 0,
    eventDescription: 'Passing FL070 en-route climb. CHT stabilized at 154°C. Oil pressure 4.7 bar.',
  },
  {
    timeStr: '20:00',
    minute: 20,
    phase: 'LEVEL CRUISE',
    controls: { throttle: 68, altitude: 14000, ambientTemp: 2, engineLoad: 68 },
    fault: 'NORMAL',
    faultSeverity: 0,
    eventDescription: 'Stationary cruise FL140. Automatic ECU altitude leaning engaged. Health 98%.',
  },
  {
    timeStr: '30:00',
    minute: 30,
    phase: 'HIGH LOITER',
    controls: { throttle: 58, altitude: 18000, ambientTemp: -6, engineLoad: 60 },
    fault: 'NORMAL',
    faultSeverity: 0,
    eventDescription: 'Target loiter orbit. Fuel flow optimized at 15.8 L/h. Telemetry nominal.',
  },
  {
    timeStr: '40:00',
    minute: 40,
    phase: 'ANOMALY INCEPTION',
    controls: { throttle: 65, altitude: 17500, ambientTemp: -5, engineLoad: 66 },
    fault: 'INJECTOR_DEGRADATION',
    faultSeverity: 0.35,
    eventDescription: 'Initial injector nozzle coking on Cyl #2. EGT begins slow upward divergence.',
  },
  {
    timeStr: '50:00',
    minute: 50,
    phase: 'FAULT PROGRESSION',
    controls: { throttle: 62, altitude: 15000, ambientTemp: 1, engineLoad: 65 },
    fault: 'INJECTOR_DEGRADATION',
    faultSeverity: 0.85,
    eventDescription: 'Digital Twin flags EGT residual (+38°C). AI Diagnostic: Probable Injector Degradation.',
  },
  {
    timeStr: '60:00',
    minute: 60,
    phase: 'RECOVERY DESCENT',
    controls: { throttle: 45, altitude: 5500, ambientTemp: 22, engineLoad: 48 },
    fault: 'INJECTOR_DEGRADATION',
    faultSeverity: 0.95,
    eventDescription: 'Operator throttled back to mitigate thermal stress. RUL 28 hrs. GCS maintenance advisory active.',
  },
];

/**
 * 8-Phase Smart India Hackathon Demo Steps
 */
export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'PHASE 1: Normal Engine Operation',
    subtitle: 'Healthy baseline at cruise envelope. Digital twin residuals within ±1.0σ margin.',
    faultToInject: 'NORMAL',
    anomalyTargetRange: [0.02, 0.08],
    aiStatus: 'NOMINAL ENVELOPE',
    probableFault: 'None — Normal Aero Engine Envelope',
    rulRange: '140–155 flight hours',
    alertLevel: 'NORMAL',
    advisory: 'Engine operating within expected envelope. All 7 critical channels verified.',
  },
  {
    step: 2,
    title: 'PHASE 2: Incipient Injector Degradation',
    subtitle: 'Micro-coking introduced in Cylinder #2 injector nozzle. Fuel flow becomes slightly erratic.',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.18, 0.32],
    aiStatus: 'TELEMETRY FLUCTUATION',
    probableFault: 'Developing Fuel Delivery Asymmetry',
    rulRange: '95–110 flight hours',
    alertLevel: 'NORMAL',
    advisory: 'Subtle EGT rise (+12°C) detected by Digital Twin residual tracker.',
  },
  {
    step: 3,
    title: 'PHASE 3: Anomaly Score Elevation',
    subtitle: 'Residual error vector grows beyond nominal statistical bounds (Residual threshold exceeded).',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.42, 0.55],
    aiStatus: 'RESIDUAL ANOMALY DETECTED',
    probableFault: 'Combustion & Fuel Variance',
    rulRange: '52–68 flight hours',
    alertLevel: 'WARNING',
    advisory: 'Residuals on EGT (+32°C) and Vibration (+1.2g) exceeding tolerance envelopes.',
  },
  {
    step: 4,
    title: 'PHASE 4: AI Diagnostic Status Shift',
    subtitle: 'Probabilistic AI Diagnostic classifies pattern: "EARLY DEGRADATION DETECTED".',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.58, 0.68],
    aiStatus: 'EARLY DEGRADATION DETECTED',
    probableFault: 'Incipient Combustion / Injector Fault',
    rulRange: '38–48 flight hours',
    alertLevel: 'WARNING',
    advisory: 'Signature matches multi-channel fuel injector degradation profile F-04.',
  },
  {
    step: 5,
    title: 'PHASE 5: Root-Cause Fault Identification',
    subtitle: 'Digital Twin isolates exact mechanism: "PROBABLE INJECTOR DEGRADATION (CYL #2)".',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.72, 0.82],
    aiStatus: 'FAULT ISOLATED (93.7% PROB)',
    probableFault: 'Injector Degradation / Asymmetric Spray (Cylinder #2)',
    rulRange: '24–31 flight hours',
    alertLevel: 'WARNING',
    advisory: 'High confidence cross-correlation: Fuel Flow + EGT + Cyclic Torque Imbalance.',
  },
  {
    step: 6,
    title: 'PHASE 6: RUL Degradation Trajectory',
    subtitle: 'Remaining Useful Life algorithm updates: Estimated RUL drops to 24–31 flight hours (Confidence 87%).',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.78, 0.86],
    aiStatus: 'RUL TRAJECTORY UPDATED',
    probableFault: 'Injector Degradation / Asymmetric Spray (Cylinder #2)',
    rulRange: '24–31 flight hours (87% Conf)',
    alertLevel: 'WARNING',
    advisory: 'Accelerated thermal wear on exhaust valve seats. Overhaul interval shortened.',
  },
  {
    step: 7,
    title: 'PHASE 7: Mission Risk Escalation',
    subtitle: 'Operational Mission Reliability module elevates mission risk to ELEVATED / HIGH.',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.84, 0.91],
    aiStatus: 'MISSION RISK ELEVATED',
    probableFault: 'Injector Degradation / Asymmetric Spray (Cylinder #2)',
    rulRange: '22–28 flight hours',
    alertLevel: 'WARNING',
    advisory: 'High-altitude loiter mission objective compromised; loiter endurance curtailed.',
  },
  {
    step: 8,
    title: 'PHASE 8: Automated Maintenance Advisory',
    subtitle: 'GCS issues actionable recovery advisory: Throttle back to 60%, initiate divert checklist.',
    faultToInject: 'INJECTOR_DEGRADATION',
    anomalyTargetRange: [0.88, 0.95],
    aiStatus: 'ACTIONABLE ADVISORY ISSUED',
    probableFault: 'Injector Degradation / Asymmetric Spray (Cylinder #2)',
    rulRange: '20–26 flight hours',
    alertLevel: 'CRITICAL',
    advisory: 'MAINTENANCE ADVISORY: Reduce throttle to 60% cruise. Plan RTB (Return to Base). Schedule fuel rail bench test.',
  },
];
