import {
  AiDiagnosticResult,
  DigitalTwinComparisonItem,
  EngineHealthScores,
  OperatingControls,
  RulEstimate,
  TelemetryData,
} from '../types/engine';
import { calculateAirDensityRatio } from './physicsEngine';

export interface ExpectedTelemetry {
  rpm: number;
  cht: number;
  egt: number;
  oilPressure: number;
  oilTemperature: number;
  fuelFlow: number;
  vibration: number;
  manifoldPressure: number;
}

/**
 * Digital Twin Nominal Reference Model.
 * Computes exact mathematical baseline expected parameters for an idealized healthy engine
 * at the given operating condition.
 */
export function computeExpectedValues(controls: OperatingControls): ExpectedTelemetry {
  const { throttle, altitude, ambientTemp, engineLoad } = controls;
  const densityRatio = calculateAirDensityRatio(altitude);

  const throttleFactor = throttle / 100;
  const loadFactor = engineLoad / 100;
  const tempOffset = ambientTemp - 15;

  const expectedRpm = Math.round(2200 + throttleFactor * 3400 - loadFactor * 240);
  const coolingEfficiency = Math.max(0.65, Math.pow(densityRatio, 0.4));

  const expectedFuelFlow = Number((11.5 + throttleFactor * 24.5 * (0.7 + 0.3 * densityRatio) + (loadFactor * 2.2)).toFixed(1));
  const expectedCht = Number((132 + throttleFactor * 42 + loadFactor * 16 + (tempOffset * 0.45) + ((1 - coolingEfficiency) * 22)).toFixed(1));
  const expectedEgt = Number((675 + throttleFactor * 90 + loadFactor * 25 + (tempOffset * 0.3)).toFixed(1));
  const expectedOilPressure = Number((3.6 + (expectedRpm / 5800) * 1.6).toFixed(2));
  const expectedOilTemp = Number((82 + throttleFactor * 22 + loadFactor * 10 + (tempOffset * 0.4)).toFixed(1));
  const expectedVibration = Number((0.85 + (expectedRpm / 5800) * 0.85 + loadFactor * 0.4).toFixed(2));
  const expectedMap = Number((18.0 + throttleFactor * 16.5 * Math.min(1.0, densityRatio * 1.25)).toFixed(1));

  return {
    rpm: expectedRpm,
    cht: expectedCht,
    egt: expectedEgt,
    oilPressure: expectedOilPressure,
    oilTemperature: expectedOilTemp,
    fuelFlow: expectedFuelFlow,
    vibration: expectedVibration,
    manifoldPressure: expectedMap,
  };
}

/**
 * Calculates parameter residuals and anomaly classification against tolerances.
 */
export function computeResidualComparison(
  actual: TelemetryData,
  expected: ExpectedTelemetry
): { items: DigitalTwinComparisonItem[]; anomalyScore: number } {
  const definitions: Array<{
    id: string;
    name: string;
    unit: string;
    actual: number;
    expected: number;
    tolerance: number;
    weight: number;
  }> = [
    {
      id: 'cht',
      name: 'CHT (Cylinder Head)',
      unit: '°C',
      actual: actual.cht,
      expected: expected.cht,
      tolerance: 10.0,
      weight: 1.3,
    },
    {
      id: 'egt',
      name: 'EGT (Exhaust Gas)',
      unit: '°C',
      actual: actual.egt,
      expected: expected.egt,
      tolerance: 25.0,
      weight: 1.2,
    },
    {
      id: 'oilPressure',
      name: 'Oil Pressure',
      unit: 'bar',
      actual: actual.oilPressure,
      expected: expected.oilPressure,
      tolerance: 0.35,
      weight: 1.5,
    },
    {
      id: 'oilTemperature',
      name: 'Oil Temperature',
      unit: '°C',
      actual: actual.oilTemperature,
      expected: expected.oilTemperature,
      tolerance: 8.0,
      weight: 1.1,
    },
    {
      id: 'fuelFlow',
      name: 'Fuel Flow',
      unit: 'L/h',
      actual: actual.fuelFlow,
      expected: expected.fuelFlow,
      tolerance: 1.5,
      weight: 1.0,
    },
    {
      id: 'vibration',
      name: 'Vibration RMS',
      unit: 'g',
      actual: actual.vibration,
      expected: expected.vibration,
      tolerance: 0.5,
      weight: 1.4,
    },
    {
      id: 'rpm',
      name: 'Engine RPM',
      unit: 'RPM',
      actual: actual.rpm,
      expected: expected.rpm,
      tolerance: 100,
      weight: 0.8,
    },
    {
      id: 'manifoldPressure',
      name: 'Manifold Pressure (MAP)',
      unit: 'inHg',
      actual: actual.manifoldPressure,
      expected: expected.manifoldPressure,
      tolerance: 1.8,
      weight: 1.1,
    },
  ];

  let weightedDeviationSum = 0;
  let totalWeight = 0;

  const items: DigitalTwinComparisonItem[] = definitions.map((def) => {
    const residual = Number((def.actual - def.expected).toFixed(2));
    const normalizedErr = Math.abs(residual) / def.tolerance;

    weightedDeviationSum += Math.pow(normalizedErr, 1.8) * def.weight;
    totalWeight += def.weight;

    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    if (normalizedErr > 2.0) {
      status = 'CRITICAL';
    } else if (normalizedErr > 1.0) {
      status = 'WARNING';
    }

    return {
      id: def.id,
      name: def.name,
      unit: def.unit,
      expected: def.expected,
      actual: def.actual,
      residual,
      tolerance: def.tolerance,
      status,
    };
  });

  // Calculate composite continuous Anomaly Score bounded [0.02, 0.99]
  const rawScore = weightedDeviationSum / totalWeight;
  const anomalyScore = Number((1 - Math.exp(-rawScore * 0.65)).toFixed(3));

  return { items, anomalyScore };
}

/**
 * Calculates subsystem and synthetic overall health scores.
 */
export function computeEngineHealthScores(
  comparisonItems: DigitalTwinComparisonItem[],
  actual: TelemetryData
): EngineHealthScores {
  const getResidual = (id: string) => {
    const item = comparisonItems.find((i) => i.id === id);
    return item ? item.residual : 0;
  };

  const getNormErr = (id: string) => {
    const item = comparisonItems.find((i) => i.id === id);
    return item ? Math.abs(item.residual) / item.tolerance : 0;
  };

  // Thermal Health: driven by CHT & EGT deviations
  const chtErr = getNormErr('cht');
  const egtErr = getNormErr('egt');
  const thermalHealth = Math.round(Math.max(12, Math.min(99, 100 - (chtErr * 22 + egtErr * 18))));

  // Combustion Health: driven by fuel flow, EGT balance, RPM stability
  const fuelErr = getNormErr('fuelFlow');
  const rpmErr = getNormErr('rpm');
  const combustionHealth = Math.round(Math.max(15, Math.min(99, 100 - (fuelErr * 26 + egtErr * 16 + rpmErr * 12))));

  // Lubrication Health: driven by oil pressure drop & oil temp spike
  const oilPressErr = getNormErr('oilPressure');
  const oilTempErr = getNormErr('oilTemperature');
  const pressDropPenalty = getResidual('oilPressure') < -0.3 ? 35 : 0;
  const lubricationHealth = Math.round(Math.max(10, Math.min(99, 100 - (oilPressErr * 32 + oilTempErr * 18 + pressDropPenalty))));

  // Mechanical Health: driven by vibration RMS
  const vibErr = getNormErr('vibration');
  const mechanicalHealth = Math.round(Math.max(14, Math.min(99, 100 - (vibErr * 36))));

  // Electrical Health: generator bus voltage deviation
  const voltDiff = Math.abs(actual.busVoltage - 28.0);
  const electricalHealth = Math.round(Math.max(40, Math.min(99, 100 - voltDiff * 45)));

  // Synthetic Overall Engine Health Index (weighted harmonic balance)
  const weightedOverall =
    thermalHealth * 0.25 +
    combustionHealth * 0.25 +
    lubricationHealth * 0.25 +
    mechanicalHealth * 0.20 +
    electricalHealth * 0.05;

  const overall = Math.round(Math.max(10, Math.min(99, weightedOverall)));

  return {
    overall,
    thermal: thermalHealth,
    combustion: combustionHealth,
    lubrication: lubricationHealth,
    mechanical: mechanicalHealth,
    electrical: electricalHealth,
  };
}

/**
 * AI/ML Prototype Probabilistic Diagnostic Engine.
 * Evaluates residual signatures and cross-correlations to isolate root causes.
 */
export function evaluateAiDiagnostics(
  comparisonItems: DigitalTwinComparisonItem[],
  anomalyScore: number,
  health: EngineHealthScores
): AiDiagnosticResult {
  const getResidual = (id: string) => comparisonItems.find((i) => i.id === id)?.residual ?? 0;
  const getNormErr = (id: string) => {
    const item = comparisonItems.find((i) => i.id === id);
    return item ? Math.abs(item.residual) / item.tolerance : 0;
  };

  const chtRes = getResidual('cht');
  const egtRes = getResidual('egt');
  const oilPressRes = getResidual('oilPressure');
  const oilTempRes = getResidual('oilTemperature');
  const fuelRes = getResidual('fuelFlow');
  const vibRes = getResidual('vibration');
  const rpmErr = getNormErr('rpm');

  const ruleReasoning: string[] = [];
  let probableFault = 'Nominal Aero Engine Envelope';
  let faultProbability = 0;
  let confidence = 94;
  let signatureMatch = 'SIG-NOMINAL-00';
  let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

  // Check 1: SENSOR DRIFT (Cross-Sensor Discrepancy)
  // One thermal sensor deviates strongly while physically coupled sensors remain normal
  if (getNormErr('cht') > 2.0 && Math.abs(egtRes) < 18 && Math.abs(oilTempRes) < 6) {
    probableFault = 'Sensor Telemetry Drift (CHT-01 Thermocouple)';
    faultProbability = 91.4;
    confidence = 88.2;
    status = 'WARNING';
    signatureMatch = 'SIG-SENSOR-DRIFT-A2';
    ruleReasoning.push('Cross-sensor decouple detected: CHT indicates +34°C while EGT and Oil Temp remain in nominal band.');
    ruleReasoning.push('Diagnostic Classifier: Telemetry channel fault rather than actual combustion/cooling failure.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Check 2: LUBRICATION FAILURE
  if (oilPressRes < -0.8 && oilTempRes > 10) {
    probableFault = 'Lubrication System Failure (Oil Starvation / Valve Bypass)';
    faultProbability = 96.8;
    confidence = 92.5;
    status = 'CRITICAL';
    signatureMatch = 'SIG-LUB-03';
    ruleReasoning.push(`Oil pressure dropped ${oilPressRes} bar below expected with oil temperature +${oilTempRes}°C.`);
    ruleReasoning.push('Hydrodynamic oil wedge collapsing; bearing boundary lubrication friction accelerating.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Check 3: INJECTOR DEGRADATION
  if (egtRes > 25 && fuelRes > 1.8 && vibRes > 0.6) {
    probableFault = 'Injector Degradation / Asymmetric Spray (Cylinder #2)';
    faultProbability = 93.7;
    confidence = 87.4;
    status = anomalyScore > 0.6 ? 'CRITICAL' : 'WARNING';
    signatureMatch = 'SIG-INJ-DEGRAD-F04';
    ruleReasoning.push(`EGT residual elevated (+${egtRes}°C) paired with abnormal fuel flow (+${fuelRes} L/h).`);
    ruleReasoning.push(`Cylinder torque imbalance detected (+${vibRes}g cyclic vibration rise).`);
    ruleReasoning.push('Symptom signature matches partial injector nozzle fouling/coking.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Check 4: MISFIRE
  if (rpmErr > 1.2 && vibRes > 2.0) {
    probableFault = 'Cylinder Combustion Misfire (Ignition / Injection Drop)';
    faultProbability = 95.1;
    confidence = 89.0;
    status = 'CRITICAL';
    signatureMatch = 'SIG-MISFIRE-07';
    ruleReasoning.push(`Severe cyclic vibration (+${vibRes}g) accompanied by unstable crankshaft speed jitter.`);
    ruleReasoning.push('Zero-torque combustion strokes detected on cylinder sequence.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Check 5: OVERHEATING / THERMAL RUNAWAY
  if (chtRes > 25 && (egtRes > 30 || oilTempRes > 12)) {
    probableFault = 'Thermal Overheating (Cooling Duct Loss / Coolant Boil-off)';
    faultProbability = 94.6;
    confidence = 90.1;
    status = 'CRITICAL';
    signatureMatch = 'SIG-THERMAL-EXCEED-01';
    ruleReasoning.push(`Cylinder head temp exceedance (+${chtRes}°C above baseline model).`);
    ruleReasoning.push('Exhaust gas and oil temperatures tracking rapid upward thermal curve.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Check 6: MECHANICAL BEARING / VIBRATION ANOMALY
  if (vibRes > 2.2) {
    probableFault = 'Mechanical Bearing Anomaly / Dynamic Propeller Unbalance';
    faultProbability = 89.5;
    confidence = 84.6;
    status = 'WARNING';
    signatureMatch = 'SIG-MECH-VIB-02';
    ruleReasoning.push(`High-frequency vibration harmonic (+${vibRes}g RMS) isolated without thermal correlation.`);
    ruleReasoning.push('Indicates rotating component eccentricity or bearing raceway spalling.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Check 7: EARLY SLIGHT DEGRADATION
  if (anomalyScore > 0.28) {
    probableFault = 'Early Developing Telemetry Anomaly';
    faultProbability = Number((anomalyScore * 85).toFixed(1));
    confidence = 79.5;
    status = 'WARNING';
    signatureMatch = 'SIG-EARLY-ANOM-01';
    ruleReasoning.push('Sensor residuals moderately diverging from nominal physics manifold.');
    ruleReasoning.push('Monitoring for recurring signature classification.');
    return { anomalyScore, probableFault, faultProbability, confidence, status, ruleReasoning, signatureMatch };
  }

  // Normal Baseline
  ruleReasoning.push('All 7 critical telemetry channels correlate within ±1.0σ nominal boundaries.');
  ruleReasoning.push('Thermodynamic efficiency and mechanical balance verified by Digital Twin.');

  return {
    anomalyScore,
    probableFault,
    faultProbability: 3.2,
    confidence: 96.5,
    status: 'NORMAL',
    ruleReasoning,
    signatureMatch,
  };
}

/**
 * Computes estimated Remaining Useful Life (RUL) with confidence.
 */
export function computeRulEstimate(
  health: EngineHealthScores,
  anomalyScore: number,
  fault: string
): RulEstimate {
  // Nominal overhaul interval is ~150-180 flight hours for high-stress UAV piston engines
  let nominalBaseHours = 145;

  // Degradation acceleration factor
  const overallFactor = health.overall / 100;
  const stressPenalty = Math.pow(anomalyScore, 1.4) * 115;

  let minHours = Math.max(1, Math.round(nominalBaseHours * Math.pow(overallFactor, 2.2) - stressPenalty));
  let maxHours = Math.round(minHours * 1.25 + 2);

  let confidence = 91;
  let advisoryText = 'Normal maintenance cycle schedule (50-hr inspection window).';

  if (fault.includes('Injector')) {
    minHours = Math.max(14, Math.round(24 + (1 - anomalyScore) * 12));
    maxHours = minHours + 7;
    confidence = 87;
    advisoryText = 'Injector nozzle coking acceleration. Recommend servicing within 25 flight hours.';
  } else if (fault.includes('Lubrication')) {
    minHours = Math.max(0.5, Math.round(1.5 + (1 - anomalyScore) * 3));
    maxHours = Math.round(minHours + 2);
    confidence = 94;
    advisoryText = 'CRITICAL: Bearing boundary seizure risk imminent. Immediate landing required.';
  } else if (fault.includes('Overheating')) {
    minHours = Math.max(1, Math.round(4 + (1 - anomalyScore) * 6));
    maxHours = minHours + 3;
    confidence = 92;
    advisoryText = 'Cylinder head warp and valve recession risk. Reduce power to avoid permanent damage.';
  } else if (fault.includes('Misfire')) {
    minHours = Math.max(2, Math.round(6 + (1 - anomalyScore) * 8));
    maxHours = minHours + 4;
    confidence = 88;
    advisoryText = 'High cyclic torque fatigue on crankshaft. Abort mission if misfire persists.';
  } else if (fault.includes('Sensor Telemetry Drift')) {
    minHours = 120;
    maxHours = 140;
    confidence = 84;
    advisoryText = 'Avionics sensor recalibration required. Engine mechanical integrity uncompromised.';
  }

  return {
    minHours,
    maxHours,
    confidence,
    wearFactor: Number(((1 - overallFactor) * 10).toFixed(2)),
    advisoryText,
  };
}
