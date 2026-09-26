import React, { useState, useMemo } from 'react';
import {
  TelemetryData,
  EngineHealthScores,
  FaultType,
  RulEstimate,
  AiDiagnosticResult,
} from '../../types/engine';
import {
  Bot,
  Send,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Gauge,
  Sliders,
  Sparkles,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Activity,
  History,
  Check,
  Cpu,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

interface AutonomousMaintenanceAdvisoryProps {
  telemetry: TelemetryData;
  health: EngineHealthScores;
  activeFault: FaultType;
  rul: RulEstimate;
  diagnostic: AiDiagnosticResult;
  theme: 'light' | 'dark';
}

export interface ChatAdvisoryMessage {
  id: string;
  sender: 'ai' | 'user';
  timestamp: string;
  text: string;
  component?: string;
  confidence?: number; // %
  predictedTimeToFailureHours?: number; // hours
  recommendedAction?: string;
  estimatedCostUsd?: number;
  estimatedDowntimeHours?: number;
  feedback?: 'helpful' | 'false_alarm' | null;
}

export interface PriorityQueueItem {
  id: string;
  rank: number;
  component: string;
  issue: string;
  timeRemainingHours: number; // 0-10 = Red, 10-50 = Amber, >50 = Green
  severity: number; // 1 - 10
  failureProbability: number; // 0 - 1.0
  priorityScore: number; // (Severity x Failure Probability) / Time Until Critical
  action: string;
  readinessImpact: 'CRITICAL' | 'MODERATE' | 'LOW';
  estimatedCost: number;
  downtimeHours: number;
}

export interface PastServiceLog {
  id: string;
  date: string;
  missionId: string;
  component: string;
  predictedIssue: string;
  actualOutcome: string;
  wasCorrect: boolean;
  downtimeTaken: string;
  technician: string;
}

export const AutonomousMaintenanceAdvisory: React.FC<AutonomousMaintenanceAdvisoryProps> = ({
  telemetry,
  health,
  activeFault,
  rul,
  diagnostic,
  theme,
}) => {
  // ---------------------------------------------------------------------------
  // 1. CHAT ADVISORY STATE (Conversational UI)
  // ---------------------------------------------------------------------------
  const [messages, setMessages] = useState<ChatAdvisoryMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      timestamp: '10:42 UTC',
      text: 'Based on current vibration trends (harmonic 2X spike at 0.32g RMS), main crankshaft bearing inspection is recommended within the next 15 flight hours.',
      component: 'Main Crankshaft Bearing (Journal #2)',
      confidence: 94,
      predictedTimeToFailureHours: 14.5,
      recommendedAction: 'Perform borescope journal audit & acoustic ultrasonic vibration analysis.',
      estimatedCostUsd: 450,
      estimatedDowntimeHours: 2.5,
      feedback: 'helpful',
    },
    {
      id: 'msg-2',
      sender: 'ai',
      timestamp: '10:45 UTC',
      text: 'Cylinder 3 CHT rising 2.1% per sortie. Rate of thermal buildup exceeds standard convective cooling envelope. Schedule cooling radiator check after Mission #12.',
      component: 'Cylinder 3 Cooling Baffle & Jacket',
      confidence: 89,
      predictedTimeToFailureHours: 28.0,
      recommendedAction: 'Inspect ram-air cooling plenum ducting for debris obstruction and flush coolant line.',
      estimatedCostUsd: 280,
      estimatedDowntimeHours: 1.8,
      feedback: null,
    },
    {
      id: 'msg-3',
      sender: 'ai',
      timestamp: '10:48 UTC',
      text: 'Fuel flow variance across manifold (+2.2 L/h delta at cruise) suggests micro-cavitation and injector nozzle varnishing needed within next 50 flight hours.',
      component: 'Cylinder 2 High-Pressure Injector',
      confidence: 92,
      predictedTimeToFailureHours: 42.0,
      recommendedAction: 'Ultrasonic solvent cleaning and calibration of fuel injector pulse-width duty cycle.',
      estimatedCostUsd: 350,
      estimatedDowntimeHours: 1.2,
      feedback: null,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Send new query to AI Maintenance Advisor
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg: ChatAdvisoryMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsAiThinking(true);

    setTimeout(() => {
      let replyText = '';
      let comp = 'Propulsion Subsystem';
      let conf = 91;
      let ttf = 35.0;
      let act = 'Execute DRDO standard pre-flight diagnostic procedure.';
      let cost = 300;
      let downtime = 1.5;

      const lower = text.toLowerCase();
      if (lower.includes('oil') || lower.includes('lubricat')) {
        replyText = `Synthetic oil pressure is currently ${telemetry.oilPressure.toFixed(2)} bar. Viscosity shear rate has increased by 4.2% over last 20 sorties. Recommending oil filter change and viscosity spectroscopic test.`;
        comp = 'Oil Filter & Pressure Relief Valve';
        conf = 95;
        ttf = 18.5;
        act = 'Replace oil cartridge (ROT-914-825) and sample oil for wear metals (Fe, Cu).';
        cost = 190;
        downtime = 0.8;
      } else if (lower.includes('turbo') || lower.includes('wastegate') || lower.includes('boost')) {
        replyText = `Turbocharger boost pressure is ${telemetry.turboBoostBar.toFixed(2)} bar with wastegate servo command at ${telemetry.wastegatePosition.toFixed(0)}%. Linkage hysteresis detected at 4.8%. Mechanical recalibration advised.`;
        comp = 'Garrett Turbocharger TCU Wastegate';
        conf = 93;
        ttf = 32.0;
        act = 'Check wastegate bellcrank free play, apply high-temp antiseize, test servo stroke.';
        cost = 420;
        downtime = 2.0;
      } else if (lower.includes('vibrat') || lower.includes('bearing')) {
        replyText = `Vibration level is at ${telemetry.vibration.toFixed(2)}g RMS. Harmonic FFT decomposes elevated energy at 1X shaft frequency. Dynamic balance verification recommended.`;
        comp = 'Propeller Shaft & Front Bearings';
        conf = 96;
        ttf = 12.0;
        act = 'Perform dynamic propeller strobe balancing and check torque on reduction gearbox bolts.';
        cost = 520;
        downtime = 3.0;
      } else {
        replyText = `Digital Twin analysis on Rotax 914-F completed: Overall health index stands at ${Math.round(health.overall)}%. Probable risk is ${diagnostic.probableFault} with anomaly score ${(diagnostic.anomalyScore * 100).toFixed(1)}%. Maintenance horizon remains optimal for planned missions.`;
        comp = 'Multi-Sensor Diagnostic Array';
        conf = 88;
        ttf = 55.0;
        act = 'Continue baseline CAN telemetry surveillance and verify ECU fault log buffer.';
        cost = 120;
        downtime = 0.5;
      }

      const aiMsg: ChatAdvisoryMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
        text: replyText,
        component: comp,
        confidence: conf,
        predictedTimeToFailureHours: ttf,
        recommendedAction: act,
        estimatedCostUsd: cost,
        estimatedDowntimeHours: downtime,
        feedback: null,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsAiThinking(false);
    }, 750);
  };

  // Feedback action handler
  const handleFeedback = (messageId: string, feedback: 'helpful' | 'false_alarm') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );
  };

  // ---------------------------------------------------------------------------
  // 2. MAINTENANCE PRIORITY QUEUE STATE & RANKING FORMULA
  // Formula: Priority Score = (Severity x Failure Probability) / Time Until Critical
  // ---------------------------------------------------------------------------
  const rawQueueData: Omit<PriorityQueueItem, 'rank' | 'priorityScore'>[] = useMemo(() => [
    {
      id: 'pq-1',
      component: 'Main Crankshaft Bearing #2',
      issue: 'Spalling fatigue & micro-vibration harmonic spike',
      timeRemainingHours: 8.5, // 0-10h -> RED (Immediate)
      severity: 9.5, // 1 - 10
      failureProbability: 0.88,
      action: 'Borescope inspection & ultrasonic journal probe',
      readinessImpact: 'CRITICAL',
      estimatedCost: 650,
      downtimeHours: 3.5,
    },
    {
      id: 'pq-2',
      component: 'Cylinder 2 High-Pressure Injector',
      issue: 'Nozzle cavitation & spray pattern asymmetry (+18°C CHT)',
      timeRemainingHours: 14.2, // 10-50h -> AMBER (Soon)
      severity: 8.0,
      failureProbability: 0.74,
      action: 'Ultrasonic solvent cleaning & O-ring seal replacement',
      readinessImpact: 'MODERATE',
      estimatedCost: 350,
      downtimeHours: 1.5,
    },
    {
      id: 'pq-3',
      component: 'Coolant Pump Ceramic Mechanical Seal',
      issue: 'Thermal stress wear & intermittent weeping leak',
      timeRemainingHours: 24.0, // 10-50h -> AMBER (Soon)
      severity: 7.5,
      failureProbability: 0.62,
      action: 'Replace ceramic seal kit & flush cooling jacket',
      readinessImpact: 'MODERATE',
      estimatedCost: 280,
      downtimeHours: 2.0,
    },
    {
      id: 'pq-4',
      component: 'Turbocharger Wastegate Linkage',
      issue: 'High-temp pivot binding & boost overshoot lag',
      timeRemainingHours: 38.0, // 10-50h -> AMBER (Soon)
      severity: 6.5,
      failureProbability: 0.45,
      action: 'Apply aero-grade antiseize & calibrate TCU zero-stop',
      readinessImpact: 'LOW',
      estimatedCost: 220,
      downtimeHours: 1.0,
    },
    {
      id: 'pq-5',
      component: 'Dual Spark Plug Array (x8)',
      issue: 'Electrode gap erosion (0.82mm vs 0.70mm nominal)',
      timeRemainingHours: 72.0, // >50h -> GREEN (Planned)
      severity: 4.5,
      failureProbability: 0.28,
      action: 'Re-gap electrodes or replace set (NGK-DCPR8E)',
      readinessImpact: 'LOW',
      estimatedCost: 140,
      downtimeHours: 0.8,
    },
    {
      id: 'pq-6',
      component: 'Alternator Drive Belt & Tensioner',
      issue: 'Normal 100-hour rubber stretch & micro-cracking',
      timeRemainingHours: 95.0, // >50h -> GREEN (Planned)
      severity: 3.5,
      failureProbability: 0.15,
      action: 'Tension check & replacement at scheduled 100h depot',
      readinessImpact: 'LOW',
      estimatedCost: 95,
      downtimeHours: 0.5,
    },
  ], []);

  // Compute ranking using exact formula: (Severity x Failure Probability) / Time Until Critical
  const priorityQueue: PriorityQueueItem[] = useMemo(() => {
    const calculated = rawQueueData.map((item) => {
      // Normalize time denominator (minimum 0.5 to prevent div-by-zero)
      const safeTime = Math.max(0.5, item.timeRemainingHours);
      const score = Number(((item.severity * item.failureProbability * 10) / safeTime).toFixed(2));
      return {
        ...item,
        priorityScore: score,
        rank: 0,
      };
    });

    // Sort descending by priority score
    calculated.sort((a, b) => b.priorityScore - a.priorityScore);

    // Assign 1-indexed ranks
    return calculated.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [rawQueueData]);

  // Filter queue
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'IMMEDIATE' | 'SOON' | 'PLANNED'>('ALL');
  const filteredQueue = useMemo(() => {
    if (queueFilter === 'IMMEDIATE') return priorityQueue.filter((i) => i.timeRemainingHours <= 10);
    if (queueFilter === 'SOON') return priorityQueue.filter((i) => i.timeRemainingHours > 10 && i.timeRemainingHours <= 50);
    if (queueFilter === 'PLANNED') return priorityQueue.filter((i) => i.timeRemainingHours > 50);
    return priorityQueue;
  }, [priorityQueue, queueFilter]);

  // ---------------------------------------------------------------------------
  // 3. MISSION IMPACT SIMULATOR STATE ("What If" Action Simulator)
  // ---------------------------------------------------------------------------
  const [selectedActionId, setSelectedActionId] = useState<string>(priorityQueue[0]?.id || 'pq-1');
  const [deferralHours, setDeferralHours] = useState<number>(10); // user can slide 0 to 40 hours

  const selectedQueueItem = useMemo(
    () => priorityQueue.find((i) => i.id === selectedActionId) || priorityQueue[0],
    [priorityQueue, selectedActionId]
  );

  // Dynamic simulation outcomes
  const simImpact = useMemo(() => {
    if (!selectedQueueItem) {
      return {
        downtime: 2.5,
        costEstimate: 450,
        readinessBefore: 98,
        readinessAfterDeferred: 62,
        riskScoreCurrent: 18,
        riskScoreDeferred: 74,
        deferredFailureCost: 3800,
      };
    }

    const baseDowntime = selectedQueueItem.downtimeHours;
    const baseCost = selectedQueueItem.estimatedCost;

    // With deferral, downtime increases as damage propagates
    const downtime = Number((baseDowntime * (1 + deferralHours * 0.04)).toFixed(1));
    const costEstimate = Math.round(baseCost * (1 + deferralHours * 0.05));

    // Readiness: If serviced now = 98%. If deferred = degrades based on item severity & deferral
    const readinessBefore = 98;
    const readinessDrop = Math.min(65, Math.round(selectedQueueItem.severity * 3.5 + deferralHours * 1.2));
    const readinessAfterDeferred = Math.max(25, 98 - readinessDrop);

    // Operational risk score (0-100)
    const riskScoreCurrent = Math.round(selectedQueueItem.failureProbability * 25);
    const riskScoreDeferred = Math.min(
      99,
      Math.round(selectedQueueItem.failureProbability * 65 + deferralHours * 1.5 + selectedQueueItem.severity * 2)
    );

    // Fail-stop emergency replacement cost if deferred to breakdown
    const deferredFailureCost = Math.round(baseCost * 5.5 + deferralHours * 80);

    return {
      downtime,
      costEstimate,
      readinessBefore,
      readinessAfterDeferred,
      riskScoreCurrent,
      riskScoreDeferred,
      deferredFailureCost,
    };
  }, [selectedQueueItem, deferralHours]);

  // ---------------------------------------------------------------------------
  // 4. SERVICE HISTORY & LEARNING STATE
  // ---------------------------------------------------------------------------
  const [serviceHistory, setServiceHistory] = useState<PastServiceLog[]>([
    {
      id: 'sh-1',
      date: '2026-09-18',
      missionId: 'MISSION-024',
      component: 'Cylinder 1 Exhaust Valve',
      predictedIssue: 'Micro-leakage & elevated EGT gradient',
      actualOutcome: 'Confirmed micro-leak on valve seat; ground lap restored seal',
      wasCorrect: true,
      downtimeTaken: '2.2 hrs',
      technician: 'Sgt. V. Sharma (IAF/DRDO)',
    },
    {
      id: 'sh-2',
      date: '2026-09-10',
      missionId: 'MISSION-021',
      component: 'Oil Pressure Sensor Harness',
      predictedIssue: 'Intermittent signal wire impedance drift',
      actualOutcome: 'Loose connector pin verified & re-crimped',
      wasCorrect: true,
      downtimeTaken: '0.6 hrs',
      technician: 'Tech. K. Nair',
    },
    {
      id: 'sh-3',
      date: '2026-08-28',
      missionId: 'MISSION-018',
      component: 'Dual Spark Plug #4',
      predictedIssue: 'Fouling carbon build-up',
      actualOutcome: 'Plugs had minimal soot; cleaned prematurely (false positive)',
      wasCorrect: false,
      downtimeTaken: '0.5 hrs',
      technician: 'Cpl. R. Desai',
    },
    {
      id: 'sh-4',
      date: '2026-08-14',
      missionId: 'MISSION-014',
      component: 'Water Pump Impeller Shaft',
      predictedIssue: 'Eccentric wobble & seal abrasion',
      actualOutcome: 'Bearing wear confirmed at 0.18mm play; kit replaced',
      wasCorrect: true,
      downtimeTaken: '3.1 hrs',
      technician: 'Sgt. V. Sharma',
    },
    {
      id: 'sh-5',
      date: '2026-07-30',
      missionId: 'MISSION-009',
      component: 'TCU Wastegate Solenoid',
      predictedIssue: 'Duty-cycle thermal saturation',
      actualOutcome: 'Solenoid coil resistance elevated by 28%; replaced',
      wasCorrect: true,
      downtimeTaken: '1.4 hrs',
      technician: 'Tech. K. Nair',
    },
  ]);

  // Advisor accuracy calculation
  const totalPredictions = serviceHistory.length;
  const correctPredictions = serviceHistory.filter((s) => s.wasCorrect).length;
  const advisorAccuracy = Number(((correctPredictions / totalPredictions) * 100).toFixed(1));

  const toggleHistoryOutcome = (id: string) => {
    setServiceHistory((prev) =>
      prev.map((s) => (s.id === id ? { ...s, wasCorrect: !s.wasCorrect } : s))
    );
  };

  // ---------------------------------------------------------------------------
  // 5. INTEGRATION WITH DIGITAL TWIN: PREDICTED VS ACTUAL WEAR
  // ---------------------------------------------------------------------------
  const [divergenceThreshold, setDivergenceThreshold] = useState<number>(8.5); // % threshold

  // Sample data across last 10 Sortie checkpoints (0 to 100 hours)
  const wearComparisonData = useMemo(() => {
    const points = [];
    for (let hour = 0; hour <= 100; hour += 10) {
      // Ideal digital twin theoretical wear curve (Weibull exponential curve)
      const twinWear = Number((Math.pow(hour / 100, 1.35) * 45).toFixed(1));

      // Actual measured wear from vibration, particle sensors & cylinder pressures
      // Inject accelerated wear divergence if an active fault is present
      const faultPenalty = activeFault !== 'NORMAL' ? (hour > 40 ? (hour - 40) * 0.28 : 0) : 0;
      const noise = (Math.sin(hour * 0.4) * 1.2);
      const actualWear = Number((twinWear + faultPenalty + (hour > 50 ? 5.2 : 1.1) + noise).toFixed(1));

      const divergence = Number((Math.abs(actualWear - twinWear) / (twinWear || 1) * 100).toFixed(1));

      points.push({
        hour: `T+${hour}h`,
        flightHours: hour,
        twinWear,
        actualWear,
        divergence,
      });
    }
    return points;
  }, [activeFault]);

  const latestDivergence = wearComparisonData[wearComparisonData.length - 1].divergence;
  const isDivergenceExceeded = latestDivergence > divergenceThreshold;

  // Preset quick questions for the user in chat
  const quickPrompts = [
    'Analyze main crankshaft bearing wear',
    'Assess Cylinder 2 injector nozzle variance',
    'Check turbocharger wastegate hysteresis',
    'Review lubrication circuit & oil pressure',
  ];

  return (
    <div className="w-full flex flex-col space-y-4 font-sans text-slate-100 select-none animate-fadeIn max-w-[1920px] mx-auto">
      {/* ========================================================================= */}
      {/* SYSTEM HEADER BANNER                                                      */}
      {/* ========================================================================= */}
      <section className="bg-[#080d18] border border-[#172844] rounded-lg p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 drdo-card">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="font-chakra font-black text-sm sm:text-base tracking-wider text-slate-100 uppercase">
                AUTONOMOUS MAINTENANCE ADVISORY SYSTEM (AMAS)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                PREDICTIVE ANALYTICS ENGINE
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Proactive Failure Prevention • Self-Ranking Priority Queue • Digital Twin Wear Divergence • Feedback Loop
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded bg-[#0a1220] border border-[#182a46] text-right">
            <div className="text-[10px] text-slate-400 uppercase font-chakra">Advisor Accuracy</div>
            <div className="text-sm font-bold text-emerald-400 font-tech">
              {advisorAccuracy}% ({correctPredictions}/{totalPredictions} VALIDATED)
            </div>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#0a1220] border border-[#182a46] text-right">
            <div className="text-[10px] text-slate-400 uppercase font-chakra">Active Prognostics</div>
            <div className="text-sm font-bold text-cyan-300 font-tech">
              {priorityQueue.length} ITEMS QUEUED
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-COLUMN TOP SECTION: PREDICTIVE ADVISORY ENGINE & PRIORITY QUEUE         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ----------------------------------------------------------------------- */}
        {/* FEATURE 1: PREDICTIVE ADVISORY ENGINE (Conversational Chat-like UI)    */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-5 bg-[#0a0f1c] border border-[#182844] rounded-lg p-3 sm:p-4 flex flex-col shadow-lg">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#15243e]">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-chakra font-bold tracking-wider text-slate-200 uppercase">
                AI MAINTENANCE ADVISOR [PREDICTIVE CONSOLE]
              </h3>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300">ONLINE</span>
            </div>
          </div>

          {/* Quick Prompt Pill Triggers */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-[10px] font-chakra px-2 py-1 rounded bg-[#070c17] hover:bg-[#101b2f] border border-[#182944] text-slate-300 hover:text-cyan-300 transition-colors truncate max-w-full"
              >
                + {q}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 min-h-[360px] max-h-[460px] overflow-y-auto space-y-3 pr-1.5 mb-3 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-mono text-slate-400">
                  <span>{msg.sender === 'ai' ? '⚡ AI PROGNOSTIC ADVISOR' : 'ENGINEER'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Bubble: Cyan theme for AI, White/Neutral for User */}
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed max-w-[92%] transition-all ${
                    msg.sender === 'user'
                      ? 'bg-slate-100 text-slate-900 font-medium rounded-tr-none shadow-md border border-slate-300'
                      : 'bg-[#08182b] text-cyan-100 border border-cyan-500/40 rounded-tl-none shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Metadata Card attached to AI advisories */}
                  {msg.sender === 'ai' && msg.component && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-500/30 text-[11px] font-mono space-y-1.5 bg-[#05101d] p-2 rounded">
                      <div className="flex items-center justify-between text-cyan-300 font-bold">
                        <span className="truncate">TARGET: {msg.component}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/60">
                          {msg.confidence}% CONFIDENCE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-400">PREDICTED TTF:</span>{' '}
                          <strong className="text-amber-300 font-bold">
                            {msg.predictedTimeToFailureHours} flight hrs
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">EST. DOWNTIME:</span>{' '}
                          <strong className="text-slate-100">{msg.estimatedDowntimeHours} hrs</strong>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-300">
                        <span className="text-slate-400">EST. COST:</span>{' '}
                        <strong className="text-emerald-400">${msg.estimatedCostUsd} USD</strong>
                      </div>

                      {msg.recommendedAction && (
                        <div className="text-[10px] text-slate-300 pt-1 border-t border-[#122238]">
                          <span className="text-cyan-400 font-bold">ACTION: </span>
                          <span>{msg.recommendedAction}</span>
                        </div>
                      )}

                      {/* Feedback buttons */}
                      <div className="flex items-center justify-between pt-1.5 text-[10px]">
                        <span className="text-slate-400">Was this advisory accurate?</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleFeedback(msg.id, 'helpful')}
                            className={`px-2 py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                              msg.feedback === 'helpful'
                                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                                : 'bg-[#091526] border-[#182d49] text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <ThumbsUp className="w-2.5 h-2.5" />
                            <span>Helpful</span>
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'false_alarm')}
                            className={`px-2 py-0.5 rounded border flex items-center space-x-1 transition-colors ${
                              msg.feedback === 'false_alarm'
                                ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                                : 'bg-[#091526] border-[#182d49] text-slate-400 hover:text-rose-300'
                            }`}
                          >
                            <ThumbsDown className="w-2.5 h-2.5" />
                            <span>False Alarm</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI Advisor analyzing telemetry residuals & Weibull hazard curve...</span>
              </div>
            )}
          </div>

          {/* User Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2 pt-2 border-t border-[#162744]"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask AI advisor (e.g. check oil pressure anomaly or bearing life)..."
              className="flex-1 bg-[#050a14] border border-[#182b48] rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
            />
            <button
              type="submit"
              disabled={isAiThinking || !inputPrompt.trim()}
              className="px-3.5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-chakra font-bold text-xs tracking-wider flex items-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              <span>SEND</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* FEATURE 2: MAINTENANCE PRIORITY QUEUE (Auto-Ranked Cards)              */}
        {/* Formula: (Severity x Failure Probability) / Time Until Critical        */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-7 bg-[#0a0f1c] border border-[#182844] rounded-lg p-3 sm:p-4 flex flex-col shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#15243e]">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-chakra font-bold tracking-wider text-slate-200 uppercase">
                  MAINTENANCE PRIORITY QUEUE [AUTO-RANKED ENGINE]
                </h3>
                <div className="text-[10px] font-mono text-cyan-400">
                  Ranking Formula: <code className="text-amber-300 font-bold">(Severity × P(Fail)) / Time Until Critical</code>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-1 text-[10px] font-chakra">
              {(['ALL', 'IMMEDIATE', 'SOON', 'PLANNED'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setQueueFilter(cat)}
                  className={`px-2 py-1 rounded transition-colors border ${
                    queueFilter === cat
                      ? cat === 'IMMEDIATE'
                        ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                        : cat === 'SOON'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                        : cat === 'PLANNED'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-[#070c17] border-[#182944] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'IMMEDIATE' ? '● 0-10h' : cat === 'SOON' ? '● 10-50h' : cat === 'PLANNED' ? '● >50h' : 'ALL'}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Queue Cards List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1.5 scrollbar-thin">
            {filteredQueue.map((item) => {
              // Color coding rules:
              // Red = immediate (0-10h), Amber = soon (10-50h), Green = planned (>50h)
              const isRed = item.timeRemainingHours <= 10;
              const isAmber = item.timeRemainingHours > 10 && item.timeRemainingHours <= 50;
              const isGreen = item.timeRemainingHours > 50;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedActionId(item.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedActionId === item.id ? 'ring-1 ring-cyan-400' : ''
                  } ${
                    isRed
                      ? 'bg-rose-950/20 border-rose-500/60 hover:bg-rose-950/30'
                      : isAmber
                      ? 'bg-amber-950/15 border-amber-500/50 hover:bg-amber-950/25'
                      : 'bg-[#081220] border-[#162944] hover:bg-[#0c1a2e]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-chakra font-black text-xs ${
                          isRed
                            ? 'bg-rose-600 text-white'
                            : isAmber
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <div>
                        <span className="font-chakra font-bold text-xs text-white">
                          {item.component}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400">
                          {item.issue}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs">
                      {/* Priority Score badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#040810] border border-[#1b3050] text-cyan-300">
                        SCORE: {item.priorityScore}
                      </span>

                      {/* Time Remaining Badge with exact color coding */}
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold border flex items-center space-x-1 ${
                          isRed
                            ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                            : isAmber
                            ? 'bg-amber-950 text-amber-300 border-amber-500'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{item.timeRemainingHours}h</span>
                        <span className="text-[9px] uppercase">
                          ({isRed ? 'IMMEDIATE' : isAmber ? 'SOON' : 'PLANNED'})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Action and Readiness Impact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#142338] text-[11px] font-mono text-slate-300">
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 text-[10px] uppercase">RECOMMENDED ACTION:</span>
                      <div className="text-slate-200 truncate">{item.action}</div>
                    </div>
                    <div className="flex sm:justify-end items-center space-x-2">
                      <span className="text-slate-400 text-[10px] uppercase">MISSION IMPACT:</span>
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          item.readinessImpact === 'CRITICAL'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                            : item.readinessImpact === 'MODERATE'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {item.readinessImpact}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 3: MISSION IMPACT SIMULATOR ("What If" Simulator & Gauges)        */}
      {/* ========================================================================= */}
      <section className="bg-[#0a0f1c] border border-[#182844] rounded-lg p-3 sm:p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#15243e]">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-xs font-chakra font-bold tracking-wider text-slate-200 uppercase">
                FEATURE 3: MISSION IMPACT SIMULATOR ["WHAT IF" ADVISORY SCENARIO EXPLORER]
              </h3>
              <p className="text-[10px] font-mono text-slate-400">
                Evaluate trade-offs: Immediate proactive servicing vs. Deferral operational breakdown risk
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-[#071322] px-2.5 py-1 rounded border border-[#1a385f]">
            ACTIVE ACTION: <strong className="text-white">{selectedQueueItem?.component}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Controls: Action Selector & Deferral Slider */}
          <div className="lg:col-span-4 space-y-3 bg-[#070c17] p-3 rounded-lg border border-[#15243d]">
            <div>
              <label className="text-[10px] font-chakra font-bold text-slate-400 uppercase block mb-1">
                Select Pending Maintenance Action:
              </label>
              <select
                value={selectedActionId}
                onChange={(e) => setSelectedActionId(e.target.value)}
                className="w-full bg-[#050912] border border-[#1a2f4c] rounded px-2.5 py-1.5 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
              >
                {priorityQueue.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.rank} - {item.component} ({item.timeRemainingHours}h remaining)
                  </option>
                ))}
              </select>
            </div>

            {/* Slider: Deferral Hours */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300 font-bold">Defer Action By:</span>
                <span className="text-amber-400 font-bold font-tech">+{deferralHours} Flight Hours</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={deferralHours}
                onChange={(e) => setDeferralHours(Number(e.target.value))}
                className="w-full h-1.5 bg-[#040810] border border-[#162944] rounded appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>0h (Service Immediately)</span>
                <span>20h (1 Sortie Delay)</span>
                <span>40h (Critical Redline)</span>
              </div>
            </div>

            {/* Cost & Downtime Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#122238] text-xs font-mono">
              <div className="bg-[#050a14] p-2 rounded border border-[#14233a]">
                <div className="text-[10px] text-slate-400 uppercase">Estimated Downtime:</div>
                <div className="text-sm font-bold text-cyan-300 font-tech">
                  {simImpact.downtime} hrs
                </div>
              </div>
              <div className="bg-[#050a14] p-2 rounded border border-[#14233a]">
                <div className="text-[10px] text-slate-400 uppercase">Cost Estimate:</div>
                <div className="text-sm font-bold text-emerald-400 font-tech">
                  ${simImpact.costEstimate} USD
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-rose-300/90 bg-rose-950/30 p-2 rounded border border-rose-900/50">
              ⚠️ Deferral Risk: If unserviced past failure point, secondary damage cost escalates to{' '}
              <strong className="text-rose-200 font-bold">${simImpact.deferredFailureCost} USD</strong>.
            </div>
          </div>

          {/* Before/After Gauge Pair */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* GAUGE PAIR 1: MISSION READINESS (Immediate vs Deferred) */}
            <div className="bg-[#070c17] p-3.5 rounded-lg border border-[#15243d] flex flex-col items-center justify-center text-center">
              <span className="text-xs font-chakra font-bold text-slate-300 uppercase mb-2">
                MISSION READINESS IMPACT (BEFORE vs AFTER)
              </span>

              <div className="flex items-center justify-around w-full py-2">
                {/* Before Gauge (Immediate Servicing) */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${simImpact.readinessBefore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-tech font-bold text-emerald-400">
                        {simImpact.readinessBefore}%
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 uppercase">IMMEDIATE</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-chakra font-bold text-emerald-300 mt-1">
                    Proactive Ready
                  </span>
                </div>

                <div className="text-slate-500 font-bold text-sm">➔</div>

                {/* After Gauge (Deferred Action) */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={simImpact.readinessAfterDeferred < 60 ? 'text-rose-500' : 'text-amber-500'}
                        strokeDasharray={`${simImpact.readinessAfterDeferred}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div
                        className={`text-lg font-tech font-bold ${
                          simImpact.readinessAfterDeferred < 60 ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {simImpact.readinessAfterDeferred}%
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 uppercase">+{deferralHours}h DEFER</div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-chakra font-bold mt-1 ${
                      simImpact.readinessAfterDeferred < 60 ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    Degraded Envelope
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 mt-2">
                Net Readiness Delta:{' '}
                <strong className="text-rose-400 font-bold">
                  -{simImpact.readinessBefore - simImpact.readinessAfterDeferred}% drop
                </strong>
              </div>
            </div>

            {/* GAUGE PAIR 2: PROBABILITY OF IN-FLIGHT FAILURE (Immediate vs Deferred) */}
            <div className="bg-[#070c17] p-3.5 rounded-lg border border-[#15243d] flex flex-col items-center justify-center text-center">
              <span className="text-xs font-chakra font-bold text-slate-300 uppercase mb-2">
                IN-FLIGHT FAILURE RISK SCORE (BEFORE vs AFTER)
              </span>

              <div className="flex items-center justify-around w-full py-2">
                {/* Risk Before */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-cyan-500"
                        strokeDasharray={`${simImpact.riskScoreCurrent}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-tech font-bold text-cyan-400">
                        {simImpact.riskScoreCurrent}%
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 uppercase">NOMINAL</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-chakra font-bold text-cyan-300 mt-1">
                    Acceptable Risk
                  </span>
                </div>

                <div className="text-slate-500 font-bold text-sm">➔</div>

                {/* Risk After Deferral */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-rose-500"
                        strokeDasharray={`${simImpact.riskScoreDeferred}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-tech font-bold text-rose-400">
                        {simImpact.riskScoreDeferred}%
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 uppercase">DEFERRED</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-chakra font-bold text-rose-400 mt-1">
                    High Hazard Risk
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 mt-2">
                Hazard Surge:{' '}
                <strong className="text-rose-400 font-bold">
                  +{simImpact.riskScoreDeferred - simImpact.riskScoreCurrent}% escalation
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2-COLUMN LOWER SECTION: SERVICE HISTORY & DIGITAL TWIN INTEGRATION       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ----------------------------------------------------------------------- */}
        {/* FEATURE 4: SERVICE HISTORY & LEARNING AUDIT LOG                         */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-6 bg-[#0a0f1c] border border-[#182844] rounded-lg p-3 sm:p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#15243e]">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-chakra font-bold tracking-wider text-slate-200 uppercase">
                  SERVICE HISTORY & MODEL REINFORCEMENT LEARNING
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">
                  Closed-Loop Feedback: Technician Ground Truth vs Prognostic Inference
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500">
              ACCURACY: {advisorAccuracy}%
            </span>
          </div>

          {/* History Table */}
          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1.5 scrollbar-thin">
            {serviceHistory.map((item) => (
              <div
                key={item.id}
                className="bg-[#070c17] p-2.5 rounded border border-[#142338] text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{item.component}</span>
                  <span className="text-[10px] text-cyan-400 font-tech">{item.missionId} ({item.date})</span>
                </div>

                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-400">AI PREDICTION:</span> {item.predictedIssue}
                </div>

                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-400">GROUND TRUTH:</span> {item.actualOutcome}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#122033] text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Downtime: {item.downtimeTaken}</span>
                    <span>•</span>
                    <span className="text-slate-400">Tech: {item.technician}</span>
                  </div>

                  <button
                    onClick={() => toggleHistoryOutcome(item.id)}
                    className={`px-2 py-0.5 rounded border flex items-center space-x-1 cursor-pointer transition-colors ${
                      item.wasCorrect
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500 text-rose-300'
                    }`}
                  >
                    {item.wasCorrect ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    <span>{item.wasCorrect ? 'CORRECT PREDICTION' : 'FALSE ALARM'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* FEATURE 5: INTEGRATION WITH DIGITAL TWIN (PREDICTED vs ACTUAL WEAR)    */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-6 bg-[#0a0f1c] border border-[#182844] rounded-lg p-3 sm:p-4 shadow-lg flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#15243e]">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-xs font-chakra font-bold tracking-wider text-slate-200 uppercase">
                  DIGITAL TWIN WEAR DIVERGENCE MONITOR
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">
                  Theoretical Reference Model vs Real-Time Fleet Sensor Telemetry
                </span>
              </div>
            </div>

            {/* Threshold Trigger Alert Banner */}
            <div
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border flex items-center space-x-1.5 ${
                isDivergenceExceeded
                  ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-500'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>
                {isDivergenceExceeded
                  ? `DIVERGENCE > ${divergenceThreshold}% : ENHANCED MONITORING ACTIVE`
                  : `DIVERGENCE NOMINAL (< ${divergenceThreshold}%)`}
              </span>
            </div>
          </div>

          {/* Wear Divergence Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3 font-mono text-xs">
            <div className="bg-[#070c17] p-2 rounded border border-[#142338]">
              <span className="text-[10px] text-slate-400 uppercase">TWIN PREDICTED WEAR:</span>
              <div className="text-sm font-bold text-cyan-400 font-tech">
                {wearComparisonData[wearComparisonData.length - 1].twinWear}%
              </div>
            </div>

            <div className="bg-[#070c17] p-2 rounded border border-[#142338]">
              <span className="text-[10px] text-slate-400 uppercase">ACTUAL SENSOR WEAR:</span>
              <div className="text-sm font-bold text-amber-400 font-tech">
                {wearComparisonData[wearComparisonData.length - 1].actualWear}%
              </div>
            </div>

            <div className="bg-[#070c17] p-2 rounded border border-[#142338]">
              <span className="text-[10px] text-slate-400 uppercase">DELTA DIVERGENCE:</span>
              <div
                className={`text-sm font-bold font-tech ${
                  isDivergenceExceeded ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {latestDivergence}%
              </div>
            </div>
          </div>

          {/* Recharts Area / Line Chart comparing Predicted vs Actual */}
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wearComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="twinGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#16263e" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070f1e',
                    borderColor: '#1d3557',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="twinWear"
                  name="Twin Predicted Wear (%)"
                  stroke="#06b6d4"
                  fill="url(#twinGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="actualWear"
                  name="Actual Measured Wear (%)"
                  stroke="#f59e0b"
                  fill="url(#actualGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-[#132238] pt-2">
            <span>● Cyan Line: Ideal Rotax 914-F Digital Twin Model</span>
            <span>● Amber Line: Real In-Sortie Multi-Sensor Telemetry</span>
          </div>
        </section>
      </div>
    </div>
  );
};
