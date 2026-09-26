import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Gauge,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Download,
  Printer,
  Share2,
  X,
  ChevronRight,
  ShieldCheck,
  Activity,
  Droplets,
  Flame,
  Cpu,
  Layers,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  Wrench,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';

export interface MissionSummaryRecord {
  id: string;
  date: string;
  duration: string;
  maxAltitudeFt: number;
  distanceNm: number;
  avgHealthPct: number;
  peakChtC: number;
  peakEgtC: number;
  faultCount: number;
  status: 'Success' | 'Degraded' | 'Aborted';
  pilotName: string;
  tailNumber: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  executiveSummary: string;
}

interface MissionReportsModuleProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentEngineHealth?: number;
  isInline?: boolean;
}

export const MissionReportsModule: React.FC<MissionReportsModuleProps> = ({
  isOpen = true,
  onClose,
  currentEngineHealth = 88,
  isInline = false,
}) => {
  // Historical 8 past missions dataset
  const pastMissions: MissionSummaryRecord[] = useMemo(() => [
    {
      id: 'MISSION-027',
      date: '2026-09-26',
      duration: '01:42:15',
      maxAltitudeFt: 8400,
      distanceNm: 184.2,
      avgHealthPct: currentEngineHealth,
      peakChtC: 174.5,
      peakEgtC: 812.0,
      faultCount: 1,
      status: 'Degraded',
      pilotName: 'Capt. R. Deshmukh',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'B',
      executiveSummary:
        'Mission 027 completed high-altitude perimeter surveillance. While propulsion baseline remained operational, cylinder 2 thermal gradient elevated during the loiter climb, generating a cooling advisory. Early intervention by the pilot averted critical CHT redline.',
    },
    {
      id: 'MISSION-026',
      date: '2026-09-24',
      duration: '03:15:40',
      maxAltitudeFt: 9200,
      distanceNm: 310.5,
      avgHealthPct: 94,
      peakChtC: 161.2,
      peakEgtC: 778.0,
      faultCount: 0,
      status: 'Success',
      pilotName: 'Flt. Lt. S. Iyer',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'A',
      executiveSummary:
        'Nominal long-endurance ISR sortie with exemplary engine telemetry. Fuel consumption matched target zero-D digital twin curves within 1.2%, with no thermodynamic or vibration excursions detected across all flight phases.',
    },
    {
      id: 'MISSION-025',
      date: '2026-09-21',
      duration: '02:40:10',
      maxAltitudeFt: 8100,
      distanceNm: 254.0,
      avgHealthPct: 91,
      peakChtC: 165.8,
      peakEgtC: 789.0,
      faultCount: 0,
      status: 'Success',
      pilotName: 'Capt. R. Deshmukh',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'A',
      executiveSummary:
        'Standard border reconnaissance sortie. Engine maintained continuous cruise envelope with oil pressure at 4.25 bar and coolant temperatures steady across all four boxer cylinders.',
    },
    {
      id: 'MISSION-024',
      date: '2026-09-18',
      duration: '00:54:30',
      maxAltitudeFt: 5200,
      distanceNm: 76.4,
      avgHealthPct: 68,
      peakChtC: 198.4,
      peakEgtC: 864.0,
      faultCount: 3,
      status: 'Aborted',
      pilotName: 'Flt. Lt. S. Iyer',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'F',
      executiveSummary:
        'Sortie aborted at T+42 min following an uncommanded oil pressure drop to 1.7 bar coupled with rapid CHT escalation. Operator successfully executed QRH Emergency procedure and initiated controlled RTB glide recovery.',
    },
    {
      id: 'MISSION-023',
      date: '2026-09-15',
      duration: '03:45:00',
      maxAltitudeFt: 10400,
      distanceNm: 365.0,
      avgHealthPct: 89,
      peakChtC: 172.0,
      peakEgtC: 805.0,
      faultCount: 1,
      status: 'Success',
      pilotName: 'Capt. A. Verma',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'B',
      executiveSummary:
        'Maximum ceiling test flight. Turbocharger wastegate servo cycled frequently above 9,500 ft to maintain manifold pressure, logging a transient pressure ripple without compromising sortie objectives.',
    },
    {
      id: 'MISSION-022',
      date: '2026-09-12',
      duration: '02:10:00',
      maxAltitudeFt: 7800,
      distanceNm: 215.8,
      avgHealthPct: 95,
      peakChtC: 159.0,
      peakEgtC: 772.0,
      faultCount: 0,
      status: 'Success',
      pilotName: 'Flt. Lt. S. Iyer',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'A',
      executiveSummary:
        'Flawless calibration flight following 50-hour spark plug and filter maintenance. Telemetry confirmed 100% cylinder compression balance and nominal BSFC.',
    },
    {
      id: 'MISSION-021',
      date: '2026-09-08',
      duration: '01:58:20',
      maxAltitudeFt: 8400,
      distanceNm: 192.0,
      avgHealthPct: 87,
      peakChtC: 178.2,
      peakEgtC: 818.0,
      faultCount: 2,
      status: 'Degraded',
      pilotName: 'Capt. R. Deshmukh',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'C',
      executiveSummary:
        'High ambient thermal condition (38°C ground temp). Cylinder 2 exhibited mild fuel starvation symptoms due to injector varnish accumulation, prompting load reduction to 62% throttle.',
    },
    {
      id: 'MISSION-020',
      date: '2026-09-04',
      duration: '03:02:15',
      maxAltitudeFt: 8800,
      distanceNm: 288.4,
      avgHealthPct: 93,
      peakChtC: 163.5,
      peakEgtC: 781.0,
      faultCount: 0,
      status: 'Success',
      pilotName: 'Capt. A. Verma',
      tailNumber: 'UAV-07 (TAPAS-BH-201)',
      grade: 'A',
      executiveSummary:
        'Standard operational patrol. Nominal fuel consumption and smooth vibration metrics across all mission phases.',
    },
  ], [currentEngineHealth]);

  // Selected mission for full detailed report inspection (null = dashboard list view)
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>('MISSION-027');

  // Active section tab in individual mission report
  const [activeReportSection, setActiveReportSection] = useState<
    | 'summary'
    | 'healthTrend'
    | 'deviations'
    | 'faults'
    | 'efficiency'
    | 'maintenance'
    | 'twinAccuracy'
  >('summary');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Success' | 'Degraded' | 'Aborted'>('ALL');

  const filteredMissions = useMemo(() => {
    return pastMissions.filter((m) => {
      const matchesSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.pilotName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pastMissions, searchQuery, statusFilter]);

  const activeMission = useMemo(() => {
    return pastMissions.find((m) => m.id === selectedMissionId) || pastMissions[0];
  }, [pastMissions, selectedMissionId]);

  // Time-series health trend with overlay markers for active mission
  const healthTimelineSeries = useMemo(() => {
    const isDegraded = activeMission.status === 'Degraded';
    const isAborted = activeMission.status === 'Aborted';

    return [
      { time: '00:00', phase: 'Pre-flight', health: 98, altitude: 0, throttle: 15, event: null },
      { time: '00:15', phase: 'Takeoff', health: 96, altitude: 1200, throttle: 98, event: 'Throttle 98%' },
      { time: '00:30', phase: 'Climb', health: 93, altitude: 4500, throttle: 85, event: 'Climb step 8.5k' },
      {
        time: '00:45',
        phase: 'Cruise',
        health: isAborted ? 65 : isDegraded ? 78 : 92,
        altitude: activeMission.maxAltitudeFt,
        throttle: 68,
        event: isAborted ? 'Oil Press Drop' : isDegraded ? 'CHT Peak 174.5°C' : null,
      },
      {
        time: '01:00',
        phase: 'Loiter',
        health: isAborted ? 55 : isDegraded ? 74 : 93,
        altitude: activeMission.maxAltitudeFt,
        throttle: 62,
        event: isAborted ? 'RTB Declared' : isDegraded ? 'Mixture Enriched' : null,
      },
      {
        time: '01:20',
        phase: 'Cruise 2',
        health: isAborted ? 50 : isDegraded ? 82 : 94,
        altitude: activeMission.maxAltitudeFt,
        throttle: 65,
        event: null,
      },
      { time: '01:42', phase: 'Landing', health: activeMission.avgHealthPct, altitude: 0, throttle: 25, event: 'Touchdown' },
    ];
  }, [activeMission]);

  // Parameter threshold deviations
  const parameterDeviations = useMemo(() => {
    if (activeMission.status === 'Success') return [];
    if (activeMission.status === 'Aborted') {
      return [
        { parameter: 'Oil Pressure (bar)', time: '00:42:10', duration: '14 min', maxVal: '1.42 bar', limit: '2.00 bar min', severity: 'CRITICAL' },
        { parameter: 'Cylinder Head Temp (°C)', time: '00:44:00', duration: '12 min', maxVal: '198.4°C', limit: '185.0°C max', severity: 'CRITICAL' },
        { parameter: 'Engine Vibration (g)', time: '00:45:20', duration: '8 min', maxVal: '0.48 g', limit: '0.40 g max', severity: 'WARNING' },
      ];
    }
    return [
      { parameter: 'CHT Cyl 2 Delta (°C)', time: '00:48:30', duration: '18 min', maxVal: '+18.4°C Δ', limit: '12.0°C Δ max', severity: 'WARNING' },
      { parameter: 'Collector EGT (°C)', time: '00:52:10', duration: '6 min', maxVal: '812.0°C', limit: '800.0°C nom', severity: 'CAUTION' },
    ];
  }, [activeMission]);

  // AI-Detected Anomaly Log
  const anomalyLog = useMemo(() => {
    if (activeMission.status === 'Success') {
      return [
        {
          timestamp: '00:15:30',
          faultType: 'Normal Intake Oscillation',
          confidence: 96,
          component: 'Air Intake Filter',
          recommendation: 'Nominal acoustic pulse at takeoff power.',
          actionTaken: 'Monitored. Cleared automatically.',
        },
      ];
    }
    return [
      {
        timestamp: '00:45:10',
        faultType: activeMission.status === 'Aborted' ? 'Lubrication Loss / Pump Cavitation' : 'Injector Nozzle Clogging',
        confidence: 92,
        component: activeMission.status === 'Aborted' ? 'Oil Circuit' : 'Cylinder 2 Fuel Injector',
        recommendation: activeMission.status === 'Aborted' ? 'Immediate RTB glide approach.' : 'Trim mixture +3% and shed thermal load.',
        actionTaken: activeMission.status === 'Aborted' ? 'YES (RTB Engaged)' : 'YES (Throttle reduced to 62%)',
      },
      {
        timestamp: '00:48:00',
        faultType: 'Thermal Gradient Drift',
        confidence: 88,
        component: 'Cylinder 2 Water Jacket',
        recommendation: 'Verify ram airflow corridor and radiator bypass flap.',
        actionTaken: 'YES (Automatic TCU adjusted)',
      },
    ];
  }, [activeMission]);

  // Digital Twin accuracy comparison
  const digitalTwinAccuracy = useMemo(() => {
    return [
      { parameter: 'Cylinder Head Temp (CHT)', actualAvg: '162.4°C', twinExpected: '161.8°C', rmse: '1.42°C', mae: '1.10°C', accuracy: '98.8%' },
      { parameter: 'Exhaust Gas Temp (EGT)', actualAvg: '782.0°C', twinExpected: '778.5°C', rmse: '4.15°C', mae: '3.20°C', accuracy: '97.6%' },
      { parameter: 'Oil Pressure Circuit', actualAvg: '4.22 bar', twinExpected: '4.25 bar', rmse: '0.06 bar', mae: '0.04 bar', accuracy: '99.1%' },
      { parameter: 'Manifold Pressure (MAP)', actualAvg: '34.2 inHg', twinExpected: '34.1 inHg', rmse: '0.24 inHg', mae: '0.18 inHg', accuracy: '99.4%' },
      { parameter: 'Fuel Burn Rate', actualAvg: '18.2 L/h', twinExpected: '18.0 L/h', rmse: '0.35 L/h', mae: '0.28 L/h', accuracy: '98.2%' },
    ];
  }, []);

  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Parameter,Value\n' +
      `Mission ID,${activeMission.id}\n` +
      `Date,${activeMission.date}\n` +
      `Duration,${activeMission.duration}\n` +
      `Max Altitude,${activeMission.maxAltitudeFt} FT\n` +
      `Distance,${activeMission.distanceNm} NM\n` +
      `Avg Health,${activeMission.avgHealthPct}%\n` +
      `Peak CHT,${activeMission.peakChtC}°C\n` +
      `Peak EGT,${activeMission.peakEgtC}°C\n` +
      `Status,${activeMission.status}\n` +
      `Pilot,${activeMission.pilotName}\n` +
      `Tail Number,${activeMission.tailNumber}\n` +
      `Grade,${activeMission.grade}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeMission.id}_Health_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isInline && !isOpen) return null;

  const content = (
    <div
      className={`bg-[#0a0e17] border border-[#1a3252] rounded-xl w-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden ${
        isInline ? 'min-h-[750px] my-1' : 'max-w-6xl max-h-[94vh]'
      }`}
    >
      {/* ===================================================================== */}
      {/* TOP BAR: MODULE TITLE & NAVIGATION                                    */}
      {/* ===================================================================== */}
      <div className="px-5 py-3.5 bg-[#070b13] border-b border-[#16273f] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/60 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-chakra font-extrabold text-base text-slate-100 tracking-wider uppercase">
                MISSION-WISE PROPULSION HEALTH REPORTS
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase bg-cyan-950 border border-cyan-800 text-cyan-300">
                DRDO GCS ARCHIVE
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Auditable post-flight diagnostics, anomaly logs, digital twin predictions vs actuals, and maintenance work orders.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedMissionId && (
            <button
              onClick={() => setSelectedMissionId(null)}
              className="px-3 py-1.5 rounded-lg bg-[#0e1c31] hover:bg-[#162e50] border border-[#1f3f6e] text-cyan-300 text-xs font-chakra font-bold flex items-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Missions Table</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#142338] transition-colors"
              title="Close Reports Module"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* ===================================================================== */}
        {/* VIEW 1: REPORT DASHBOARD (LIST OF ALL PAST MISSIONS)                  */}
        {/* ===================================================================== */}
        {!selectedMissionId ? (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070b13] p-3 rounded-lg border border-[#16273f]">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search mission ID, pilot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-mono text-slate-200 outline-hidden placeholder-slate-500"
                />
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center space-x-1 text-xs font-chakra">
                {(['ALL', 'Success', 'Degraded', 'Aborted'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Missions Table */}
            <div className="overflow-x-auto rounded-lg border border-[#16273f]">
              <table className="w-full text-left text-xs font-tech">
                <thead className="bg-[#070b13] text-slate-400 border-b border-[#16273f] text-[10px] uppercase font-chakra tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">MISSION ID</th>
                    <th className="py-2.5 px-3">DATE</th>
                    <th className="py-2.5 px-3">DURATION</th>
                    <th className="py-2.5 px-3">MAX ALTITUDE</th>
                    <th className="py-2.5 px-3">DISTANCE</th>
                    <th className="py-2.5 px-3 text-center">AVG HEALTH</th>
                    <th className="py-2.5 px-3">PEAK CHT / EGT</th>
                    <th className="py-2.5 px-3 text-center">FAULTS</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#142338]">
                  {filteredMissions.map((m) => {
                    const isSuccess = m.status === 'Success';
                    const isDegraded = m.status === 'Degraded';
                    const isAborted = m.status === 'Aborted';

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-[#0c1626] transition-colors cursor-pointer group"
                        onClick={() => setSelectedMissionId(m.id)}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-cyan-300">
                          {m.id}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{m.date}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{m.duration}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{m.maxAltitudeFt} ft</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{m.distanceNm} nm</td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              m.avgHealthPct >= 90
                                ? 'text-emerald-400 bg-emerald-950/40'
                                : m.avgHealthPct >= 75
                                ? 'text-amber-400 bg-amber-950/40'
                                : 'text-rose-400 bg-rose-950/40'
                            }`}
                          >
                            {m.avgHealthPct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          <span>{m.peakChtC}°C</span> / <span className="text-amber-400">{m.peakEgtC}°C</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              m.faultCount > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400'
                            }`}
                          >
                            {m.faultCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-chakra">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isSuccess
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : isDegraded
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMissionId(m.id);
                            }}
                            className="px-2.5 py-1 rounded bg-[#0d2238] group-hover:bg-cyan-950 border border-cyan-800/80 text-cyan-300 text-xs font-chakra font-bold flex items-center space-x-1 ml-auto transition-all"
                          >
                            <span>View Report</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* VIEW 2: INDIVIDUAL MISSION REPORT PAGE WITH SIDEBAR NAVIGATION         */
          /* ===================================================================== */
          <div className="flex-1 flex overflow-hidden">
            {/* REPORT SIDEBAR NAVIGATION */}
            <aside className="w-56 bg-[#070b13] border-r border-[#16273f] p-3 flex flex-col justify-between shrink-0">
              <div className="space-y-1">
                <div className="text-[10px] font-chakra font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  REPORT SECTIONS
                </div>
                {[
                  { id: 'summary', label: '1. Executive Summary' },
                  { id: 'healthTrend', label: '2. Health Trend Timeline' },
                  { id: 'deviations', label: '3. Parameter Deviations' },
                  { id: 'faults', label: '4. Fault & Anomaly Log' },
                  { id: 'efficiency', label: '5. Efficiency Analysis' },
                  { id: 'maintenance', label: '6. Maintenance Advisory' },
                  { id: 'twinAccuracy', label: '7. Digital Twin Accuracy' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveReportSection(sec.id as any)}
                    className={`w-full text-left px-2.5 py-2 rounded text-xs font-chakra font-bold transition-all flex items-center justify-between ${
                      activeReportSection === sec.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1524] border border-transparent'
                    }`}
                  >
                    <span>{sec.label}</span>
                    {activeReportSection === sec.id && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>

              {/* Mission Selector Quick Switcher */}
              <div className="pt-3 border-t border-[#142338]">
                <div className="text-[10px] font-chakra text-slate-400 uppercase mb-1">SELECT MISSION:</div>
                <select
                  value={activeMission.id}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="w-full bg-[#0d1624] text-xs font-mono text-cyan-300 border border-[#1b3456] rounded p-1.5 outline-hidden"
                >
                  {pastMissions.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.id} ({pm.date})
                    </option>
                  ))}
                </select>
              </div>
            </aside>

            {/* REPORT MAIN CONTENT AREA (AEROSPACE FLIGHT TEST REPORT STYLING) */}
            <main className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#080d17]">
              {/* Report Header Strip */}
              <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-chakra font-black text-lg text-cyan-300">
                      {activeMission.id} FLIGHT TEST & PROPULSION REPORT
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-chakra font-black uppercase border ${
                        activeMission.status === 'Success'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : activeMission.status === 'Degraded'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {activeMission.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Date: <strong>{activeMission.date}</strong></span>
                    <span>•</span>
                    <span>Airframe: <strong>{activeMission.tailNumber}</strong></span>
                    <span>•</span>
                    <span>Pilot: <strong>{activeMission.pilotName}</strong></span>
                    <span>•</span>
                    <span>Duration: <strong>{activeMission.duration}</strong></span>
                  </div>
                </div>

                {/* Overall Mission Grade Badge */}
                <div className="flex items-center space-x-4 border-l border-slate-700/60 pl-4">
                  <div className="text-center">
                    <div className="text-[10px] font-chakra text-slate-400 uppercase">ENGINE GRADE</div>
                    <div
                      className={`text-3xl font-tech font-black ${
                        activeMission.grade === 'A'
                          ? 'text-emerald-400'
                          : activeMission.grade === 'B'
                          ? 'text-cyan-400'
                          : activeMission.grade === 'C'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      GRADE {activeMission.grade}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="flex flex-col space-y-1.5 text-xs font-chakra">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 rounded bg-[#0f213b] hover:bg-[#163056] border border-[#234572] text-slate-200 font-bold flex items-center space-x-1.5"
                    >
                      <Printer className="w-3 h-3 text-cyan-400" />
                      <span>Download PDF / Print</span>
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="px-3 py-1 rounded bg-[#0f213b] hover:bg-[#163056] border border-[#234572] text-slate-200 font-bold flex items-center space-x-1.5"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download Raw CSV</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-3 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-bold flex items-center space-x-1.5"
                    >
                      <Share2 className="w-3 h-3 text-cyan-400" />
                      <span>{shareSuccess ? 'Shared with Maintenance!' : 'Share with Maintenance'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 1: EXECUTIVE SUMMARY                                      */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'summary' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-3 animate-fadeIn">
                  <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>1. Executive Summary & Sortie Synopsis</span>
                  </h4>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed bg-[#070b13] p-3.5 rounded-lg border border-[#142338]">
                    {activeMission.executiveSummary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-chakra pt-2">
                    <div className="p-2.5 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Total Distance</span>
                      <div className="font-tech font-bold text-cyan-400 text-base">{activeMission.distanceNm} NM</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Average Engine Health</span>
                      <div className="font-tech font-bold text-emerald-400 text-base">{activeMission.avgHealthPct}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Peak Thermal CHT</span>
                      <div className="font-tech font-bold text-amber-400 text-base">{activeMission.peakChtC}°C</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Peak Collector EGT</span>
                      <div className="font-tech font-bold text-amber-400 text-base">{activeMission.peakEgtC}°C</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 2: HEALTH TREND DURING MISSION                            */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'healthTrend' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>2. Health Trend Timeline & In-Flight Phase Events</span>
                    </h4>
                    <span className="text-[10px] font-mono text-amber-400">
                      Red shaded band = Health &lt; 80%
                    </span>
                  </div>

                  <div className="h-64 w-full bg-[#070b13] p-2 rounded-lg border border-[#142338]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={healthTimelineSeries} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#16273f" />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <YAxis domain={[40, 100]} stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a162a',
                            borderColor: '#1e385c',
                            borderRadius: 4,
                            fontSize: 10,
                            color: '#fff',
                          }}
                        />
                        <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '80% Threshold', fill: '#f59e0b', fontSize: 9 }} />
                        <Area type="monotone" dataKey="health" name="Engine Health (%)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Flight Phase Milestones with Events */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-chakra">
                    {healthTimelineSeries.filter((p) => p.event).map((ev, i) => (
                      <div key={i} className="p-2 rounded bg-[#070b13] border border-[#142338]">
                        <span className="text-[10px] font-mono text-cyan-400">{ev.time} • {ev.phase}</span>
                        <div className="font-bold text-slate-200">{ev.event}</div>
                        <div className="text-[9px] font-mono text-slate-400">Health: {ev.health}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 3: PARAMETER DEVIATIONS                                   */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'deviations' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-3 animate-fadeIn">
                  <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>3. Flight Envelope Safety Threshold Deviations</span>
                  </h4>

                  {parameterDeviations.length === 0 ? (
                    <div className="p-4 rounded-lg bg-[#070b13] border border-emerald-900/50 text-center text-xs font-mono text-emerald-400">
                      ✓ No parameter threshold deviations recorded for this mission. All sensors remained within nominal green envelope corridors.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-[#16273f]">
                      <table className="w-full text-left text-xs font-tech">
                        <thead className="bg-[#070b13] text-slate-400 border-b border-[#16273f] text-[10px] uppercase font-chakra tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">PARAMETER</th>
                            <th className="py-2.5 px-3">TIME OF EVENT</th>
                            <th className="py-2.5 px-3">EXCURSION DURATION</th>
                            <th className="py-2.5 px-3">MAX VALUE LOGGED</th>
                            <th className="py-2.5 px-3">SAFE LIMIT</th>
                            <th className="py-2.5 px-3">SEVERITY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#142338]">
                          {parameterDeviations.map((d, i) => (
                            <tr key={i} className="hover:bg-[#070b13]">
                              <td className="py-2.5 px-3 font-bold text-slate-200">{d.parameter}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">{d.time}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">{d.duration}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{d.maxVal}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400">{d.limit}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    d.severity === 'CRITICAL'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                      : 'bg-amber-950 text-amber-300 border border-amber-600'
                                  }`}
                                >
                                  {d.severity}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 4: FAULT & ANOMALY LOG                                    */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'faults' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-3 animate-fadeIn">
                  <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>4. Chronological AI Fault & Anomaly Log</span>
                  </h4>

                  <div className="space-y-2">
                    {anomalyLog.map((log, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#070b13] border border-[#142338] space-y-1 text-xs font-chakra">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 flex items-center space-x-2">
                            <span className="text-cyan-400 font-mono">[{log.timestamp}]</span>
                            <span>{log.faultType}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                            Confidence: {log.confidence}%
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300">
                          Affected Subsystem: <strong className="text-slate-100">{log.component}</strong>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Recommended Action: {log.recommendation}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 pt-1 border-t border-[#142338]">
                          Pilot Action Executed: <strong>{log.actionTaken}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 5: EFFICIENCY ANALYSIS                                    */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'efficiency' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-4 animate-fadeIn">
                  <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>5. Fuel Efficiency & Specific Air Range Analysis</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-chakra">
                    <div className="p-3 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Specific Air Range</span>
                      <div className="text-xl font-tech font-bold text-cyan-400 my-1">
                        {(activeMission.distanceNm / (activeMission.duration === '03:15:40' ? 52.4 : 31.8)).toFixed(2)} NM / L
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">+3.8% vs Fleet Baseline</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Brake Specific Fuel Consumption</span>
                      <div className="text-xl font-tech font-bold text-slate-100 my-1">
                        {activeMission.status === 'Degraded' ? '335' : '304'} g/kWh
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Rotax 914 Nominal: 280-320</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#070b13] border border-[#142338]">
                      <span className="text-[10px] text-slate-400">Total Fuel Consumed</span>
                      <div className="text-xl font-tech font-bold text-amber-400 my-1">
                        {Math.round(activeMission.distanceNm * 0.175)} kg (Avgas 100LL)
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Burn rate: 18.2 L/h avg</span>
                    </div>
                  </div>

                  {/* Efficiency Loss Attribution */}
                  <div className="p-3 rounded-lg bg-[#070b13] border border-[#142338] space-y-2">
                    <div className="text-xs font-chakra font-bold text-slate-200">
                      EFFICIENCY LOSS ATTRIBUTION ANALYSIS
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-400">Thermal Losses (Exhaust & Cooling Water):</span>
                          <span className="text-amber-400 font-bold">58.4%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#142338] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: '58.4%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-400">Mechanical Friction (Piston Rings & Bearings):</span>
                          <span className="text-cyan-400 font-bold">8.2%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#142338] rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: '8.2%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-400">Pumping & Aerodynamic Induction Losses:</span>
                          <span className="text-fuchsia-400 font-bold">4.6%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#142338] rounded-full overflow-hidden">
                          <div className="h-full bg-fuchsia-500" style={{ width: '4.6%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 6: MAINTENANCE RECOMMENDATIONS                            */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'maintenance' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-3 animate-fadeIn">
                  <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>6. Post-Mission Maintenance Actions & Work Orders</span>
                  </h4>

                  <div className="space-y-2">
                    {[
                      {
                        action: 'Perform ultrasonic bath cleaning on Cylinder 2 fuel injector nozzle.',
                        reason: 'Post-cruise CHT spread elevated +18.4°C.',
                        parts: 'Seal Kit O-Ring (ROT-914-721)',
                        labor: '1.5 hrs',
                        priority: 'HIGH',
                      },
                      {
                        action: 'Borescope inspection of Cylinder 2 exhaust valve seat.',
                        reason: 'Thermal gradient audit following climb step excursion.',
                        parts: 'None (Inspection)',
                        labor: '1.0 hrs',
                        priority: 'MEDIUM',
                      },
                      {
                        action: 'Replace oil filter element and perform spectrographic oil analysis.',
                        reason: 'Routine post-sortie lubrication health audit.',
                        parts: 'Filter Cartridge (ROTAX-914-825-B)',
                        labor: '0.8 hrs',
                        priority: 'SCHEDULED',
                      },
                    ].map((act, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[#070b13] border border-[#142338] flex items-center justify-between text-xs font-chakra">
                        <div className="space-y-0.5 max-w-xl">
                          <div className="font-bold text-slate-100">• {act.action}</div>
                          <div className="text-[11px] font-mono text-slate-400">Trigger: {act.reason}</div>
                          <div className="text-[10px] font-mono text-cyan-300">Required: {act.parts}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            {act.priority}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">Est. Labor: {act.labor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 7: DIGITAL TWIN ACCURACY (RMSE & MAE)                     */}
              {/* ----------------------------------------------------------------- */}
              {activeReportSection === 'twinAccuracy' && (
                <div className="p-4 rounded-xl bg-[#0a1120] border border-[#182942] space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-chakra font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>7. Digital Twin Physics Model Prediction Accuracy</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      Overall Model Fidelity: 98.6%
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#16273f]">
                    <table className="w-full text-left text-xs font-tech">
                      <thead className="bg-[#070b13] text-slate-400 border-b border-[#16273f] text-[10px] uppercase font-chakra tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">PARAMETER</th>
                          <th className="py-2.5 px-3 text-right">ACTUAL SENSOR AVG</th>
                          <th className="py-2.5 px-3 text-right">TWIN PREDICTED AVG</th>
                          <th className="py-2.5 px-3 text-right">RMSE ERROR</th>
                          <th className="py-2.5 px-3 text-right">MAE ERROR</th>
                          <th className="py-2.5 px-3 text-center">ACCURACY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#142338]">
                        {digitalTwinAccuracy.map((row, i) => (
                          <tr key={i} className="hover:bg-[#070b13]">
                            <td className="py-2.5 px-3 font-bold text-slate-200">{row.parameter}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">{row.actualAvg}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-cyan-300">{row.twinExpected}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-400">{row.rmse}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">{row.mae}</td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                {row.accuracy}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      {content}
    </div>
  );
};
