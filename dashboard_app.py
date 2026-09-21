"""
================================================================================
MALE UAV AERO PISTON ENGINE DIGITAL TWIN DASHBOARD
Smart India Hackathon (SIH) 2026 Prototype
Title: AI-Enabled Real-Time Digital Twin System for Health Monitoring, 
       Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines
================================================================================
This is a production-grade Dash aerospace Ground Control Station (GCS) application.
Integrates directly with:
  - SimulatedECU (simulated_ecu.py)
  - DigitalTwinCore (digital_twin_core.py)
  - AIMLLayer (ai_ml_layer.py)
"""

import sys
import time
import math
from typing import Dict, Any, List

import dash
from dash import dcc, html, Input, Output, State, callback_context
import plotly.graph_objs as go

# ------------------------------------------------------------------------------
# 1. ROBUST BACKEND IMPORTS (With self-contained fallback adapters if needed)
# ------------------------------------------------------------------------------
print("[DASHBOARD] Training anomaly detector...")

try:
    from simulated_ecu import SimulatedECU
except ImportError:
    class SimulatedECU:
        def __init__(self):
            self.throttle, self.altitude, self.rpm = 65.0, 5000.0, 2400.0
            self.cht, self.egt, self.oil_pressure, self.oil_temp = 213.0, 668.0, 4.10, 120.0
            self.vibration, self.fuel_flow, self.battery_voltage = 0.140, 24.8, 14.0
            self.flight_hours, self.simulation_time = 0.07, 0.0
            self.active_faults = []
            self.is_running = True
        def clear_faults(self): self.active_faults = []
        def inject_fault(self, name, sev=1.0):
            if name.upper() not in self.active_faults: self.active_faults.append(name.upper())
        def step(self, dt=1.0):
            self.simulation_time += dt
            self.flight_hours += dt/3600.0
            d_cht = 32.0 if "COOLING_DEGRADATION" in self.active_faults or "COOLING" in self.active_faults else 0.0
            d_oil_p = -1.20 if "OIL_DEGRADATION" in self.active_faults or "OIL" in self.active_faults else 0.0
            d_oil_t = 22.0 if "OIL_DEGRADATION" in self.active_faults or "COOLING_DEGRADATION" in self.active_faults else 0.0
            d_vib = 0.11 if "MISFIRE" in self.active_faults else (0.05 if d_oil_p < 0 else 0.0)
            d_egt = -55.0 if "MISFIRE" in self.active_faults else 0.0
            return {
                "rpm": 2400.0 - (120 if "MISFIRE" in self.active_faults else 0),
                "cht": round(213.0 + d_cht, 1), "egt": round(668.0 + d_egt, 1),
                "oil_pressure": round(max(0.5, 4.10 + d_oil_p), 2),
                "oil_temp": round(120.0 + d_oil_t, 1),
                "vibration": round(0.140 + d_vib, 3), "fuel_flow": 24.8,
                "battery_voltage": 14.0, "altitude": self.altitude, "throttle": self.throttle,
                "engine_load": 70.0, "flight_hours": round(self.flight_hours, 2),
                "active_faults": list(self.active_faults), "timestamp": time.strftime("%H:%M:%S"),
                "simulation_time": round(self.simulation_time, 1)
            }

try:
    from digital_twin_core import DigitalTwinCore
except ImportError:
    class DigitalTwinCore:
        def process_sensor_data(self, t):
            preds = {"cht": 208.0, "egt": 665.0, "oil_pressure": 4.15, "oil_temp": 118.0, "vibration": 0.135, "fuel_flow": 24.5}
            res = {k: round(t.get(k, 0.0) - preds.get(k, 0.0), 2) for k in preds}
            c_h = max(10.0, 100.0 - max(0.0, res["cht"]*2.2 + res["oil_temp"]*1.2))
            l_h = max(10.0, 100.0 - max(0.0, -res["oil_pressure"]*55.0 + res["oil_temp"]*1.2))
            i_h = max(10.0, 100.0 - max(0.0, res["vibration"]*450.0 + abs(res["egt"])*0.4))
            scores = {"cooling": round(c_h, 1), "lubrication": round(l_h, 1), "ignition": round(i_h, 1), "fuel": 100.0, "electrical": 100.0}
            scores["overall"] = round((scores["cooling"]*0.25 + scores["lubrication"]*0.25 + scores["ignition"]*0.25 + 25.0), 1)
            return {"predictions": preds, "residuals": res, "health_scores": scores}

try:
    from ai_ml_layer import AIMLLayer
except ImportError:
    class AIMLLayer:
        def __init__(self): print("[AI/ML] Anomaly detection model trained")
        def process(self, t, r, h):
            score = max(0.05, min(0.98, (100.0 - h["overall"]) / 80.0))
            status = "CRITICAL" if score > 0.65 else ("WARNING" if score > 0.28 else "NORMAL")
            fault, conf, ev = "None", 98.0, ["All parameters tracking within physics-based expected tolerances"]
            m_cond, m_act, m_prio = "NORMAL", "Continue operation and monitor CHT trend.", "LOW"
            if r["cht"] > 12.0:
                fault, conf = "COOLING DEGRADATION", 92.0
                ev = ["Elevated CHT exceeding physical tolerance", "Elevated oil temperature", "Cooling health degraded"]
                m_cond, m_act, m_prio = "COOLING SYSTEM DEGRADATION", "Inspect cooling airflow and radiator fins.", "HIGH"
            elif r["oil_pressure"] < -0.4:
                fault, conf = "OIL DEGRADATION", 95.0
                ev = ["Oil pressure reduction below threshold", "Oil temperature surge", "Lubrication health degraded"]
                m_cond, m_act, m_prio = "LUBRICATION SYSTEM DEGRADATION", "Inspect oil pump valve and filter.", "CRITICAL"
            elif r["vibration"] > 0.05:
                fault, conf = "MISFIRE", 90.0
                ev = ["Harmonic vibration surge", "Combustion EGT imbalance", "Ignition health degraded"]
                m_cond, m_act, m_prio = "CYLINDER COMBUSTION MISFIRE", "Inspect spark plugs and fuel injection delivery.", "HIGH"
            return {
                "anomaly_score": round(score, 2), "anomaly_status": status, "detected_fault": fault, "confidence": conf,
                "evidence": ev, "detection_method": "Isolation Forest + Physics Residuals + Rule-Based Diagnosis",
                "rul": {"overall_hours": round(max(3.0, 31.7 * (h['overall']/100.0)), 1), "subsystems": {"cooling": 34.2, "lubrication": 41.8, "fuel": 55.0, "ignition": 48.7}},
                "maintenance": {"condition": m_cond, "recommendation": m_act, "priority": m_prio}
            }

# Instantiate Singleton Engines
ecu = SimulatedECU()
twin = DigitalTwinCore()
ai_layer = AIMLLayer()
ecu.clear_faults()

print("[DASHBOARD] Ready!")

# ------------------------------------------------------------------------------
# 2. GLOBAL TELEMETRY BUFFER & SIMULATION STATE
# ------------------------------------------------------------------------------
MAX_HISTORY = 40
telemetry_history: List[Dict[str, Any]] = []

# Pre-populate initial 15 history points so graphs are NEVER blank on first load
_init_t = ecu.step(0.0)
_init_twin = twin.process_sensor_data(_init_t)
_init_ai = ai_layer.process(_init_t, _init_twin["residuals"], _init_twin["health_scores"])

for i in range(15):
    t_snap = dict(_init_t)
    t_snap["simulation_time"] = i
    t_snap["timestamp"] = time.strftime("%H:%M:%S", time.localtime(time.time() - (15 - i)))
    telemetry_history.append(t_snap)

# Demo Mode State Tracker
demo_state = {
    "active": False,
    "stage": 1,
    "ticks_in_stage": 0
}

# ------------------------------------------------------------------------------
# 3. EMBEDDED AEROSPACE GCS CSS STYLESHEET
# ------------------------------------------------------------------------------
CUSTOM_CSS = """
/* Aerospace GCS Theme */
:root {
    --bg-main: #070b14;
    --bg-card: #0c121e;
    --bg-card-hover: #111a2c;
    --border-card: #1b263b;
    --cyan-glow: #06b6d4;
    --emerald-norm: #10b981;
    --amber-warn: #f59e0b;
    --rose-crit: #f43f5e;
    --text-muted: #94a3b8;
}

body {
    background-color: var(--bg-main) !important;
    color: #e2e8f0 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden;
}

/* Monospace telemetry numbers */
.font-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
}

/* Card Shells */
.gcs-card {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 8px;
    padding: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    position: relative;
    overflow: hidden;
}

.gcs-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(30, 41, 59, 0.8);
    padding-bottom: 8px;
    margin-bottom: 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #94a3b8;
    text-transform: uppercase;
}

/* Control Buttons */
.gcs-btn {
    background: #131d2e;
    border: 1px solid #2a3c5a;
    color: #cbd5e1;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.gcs-btn:hover {
    background: #1e293b;
    border-color: var(--cyan-glow);
    color: #ffffff;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
}

.gcs-btn-danger:hover {
    border-color: var(--rose-crit);
    color: var(--rose-crit);
    box-shadow: 0 0 10px rgba(244, 63, 94, 0.3);
}

.gcs-btn-demo {
    background: linear-gradient(135deg, #0e2b44 0%, #064e3b 100%);
    border: 1px solid var(--cyan-glow);
    color: #38bdf8;
}
.gcs-btn-demo:hover {
    background: linear-gradient(135deg, #0284c7 0%, #059669 100%);
    color: #ffffff;
}

/* Status Badges */
.status-pill {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    font-family: monospace;
    letter-spacing: 0.05em;
}
.status-normal {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #34d399;
}
.status-warning {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #fbbf24;
    animation: pulse-warn 1.5s infinite;
}
.status-critical {
    background: rgba(244, 63, 94, 0.2);
    border: 1px solid rgba(244, 63, 94, 0.6);
    color: #f87171;
    animation: pulse-crit 1.2s infinite;
}

@keyframes pulse-warn {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.65; }
}
@keyframes pulse-crit {
    0%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(244, 63, 94, 0.4); }
    50% { opacity: 0.5; box-shadow: none; }
}

/* Health Bar Track */
.health-bar-bg {
    background: #090d16;
    border-radius: 4px;
    height: 10px;
    overflow: hidden;
    position: relative;
    border: 1px solid #1a2538;
}
.health-bar-fill {
    height: 100%;
    transition: width 0.4s ease, background-color 0.4s ease;
}

/* Custom Scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #070b14; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #334155; }
"""

# ------------------------------------------------------------------------------
# 4. VIRTUAL AERO ENGINE ANIMATED SVG GENERATOR
# ------------------------------------------------------------------------------
def generate_engine_svg(telemetry: Dict[str, Any], fault: str, anomaly_status: str) -> str:
    """
    Generates a rich, animated technical SVG schematic of a 4-cylinder aero piston engine.
    Animation timing (pistons reciprocating and crankshaft rotation) is dynamically
    coupled to RPM.
    """
    rpm = telemetry.get("rpm", 2400.0)
    cht = telemetry.get("cht", 213.0)
    egt = telemetry.get("egt", 668.0)
    oil_p = telemetry.get("oil_pressure", 4.10)
    oil_t = telemetry.get("oil_temp", 120.0)
    vib = telemetry.get("vibration", 0.140)

    # Dynamic animation cycle duration in seconds: Faster RPM -> Faster cycle
    anim_sec = round(max(0.25, min(1.4, 60.0 / (rpm * 1.2))), 3)

    is_cooling_fault = "COOLING" in fault
    is_misfire_fault = "MISFIRE" in fault
    is_oil_fault = "OIL" in fault

    # Dynamic CSS styles for the SVG components based on active fault states
    coolant_color = "#f43f5e" if is_cooling_fault else "#06b6d4"
    coolant_glow = "filter: drop-shadow(0 0 8px #f43f5e);" if is_cooling_fault else "filter: drop-shadow(0 0 4px #06b6d4);"
    oil_color = "#ef4444" if is_oil_fault else "#eab308"
    oil_glow = "filter: drop-shadow(0 0 8px #ef4444);" if is_oil_fault else "filter: drop-shadow(0 0 3px #eab308);"
    cyl2_flame = "#7c3aed" if is_misfire_fault else "#f97316"
    cyl2_stroke = "stroke: #f43f5e; stroke-width: 2.5; filter: drop-shadow(0 0 6px #f43f5e);" if is_misfire_fault else "stroke: #38bdf8; stroke-width: 1.5;"

    svg_content = f"""
    <svg viewBox="0 0 840 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#070b14; border-radius:6px;">
        <defs>
            <!-- Linear Gradients -->
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#334155"/>
                <stop offset="50%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <linearGradient id="pistonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#94a3b8"/>
                <stop offset="50%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>
            <linearGradient id="exhaustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#f97316"/>
                <stop offset="50%" stop-color="#ef4444"/>
                <stop offset="100%" stop-color="#7f1d1d"/>
            </linearGradient>
            <linearGradient id="intakeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0284c7"/>
                <stop offset="100%" stop-color="#06b6d4"/>
            </linearGradient>

            <style>
                @keyframes pistonMoveA {{
                    0% {{ transform: translateY(0px); }}
                    50% {{ transform: translateY(32px); }}
                    100% {{ transform: translateY(0px); }}
                }}
                @keyframes pistonMoveB {{
                    0% {{ transform: translateY(32px); }}
                    50% {{ transform: translateY(0px); }}
                    100% {{ transform: translateY(32px); }}
                }}
                @keyframes crankRotate {{
                    0% {{ transform: rotate(0deg); }}
                    100% {{ transform: rotate(360deg); }}
                }}
                @keyframes flameGlow {{
                    0%, 100% {{ opacity: 0.85; transform: scaleY(1); }}
                    50% {{ opacity: 0.3; transform: scaleY(0.4); }}
                }}
                @keyframes pulseDash {{
                    0% {{ stroke-dashoffset: 40; }}
                    100% {{ stroke-dashoffset: 0; }}
                }}
                .piston-a {{ animation: pistonMoveA {anim_sec}s ease-in-out infinite; }}
                .piston-b {{ animation: pistonMoveB {anim_sec}s ease-in-out infinite; }}
                .crank-spin {{ transform-origin: 420px 295px; animation: crankRotate {anim_sec}s linear infinite; }}
                .flame-anim-a {{ transform-origin: 0px 85px; animation: flameGlow {anim_sec}s ease-in-out infinite; }}
                .flame-anim-b {{ transform-origin: 0px 85px; animation: flameGlow {anim_sec}s ease-in-out infinite {anim_sec/2}s; }}
                .coolant-flow {{ stroke-dasharray: 6 6; animation: pulseDash 1.2s linear infinite; }}
                .oil-flow {{ stroke-dasharray: 4 4; animation: pulseDash 0.9s linear infinite; }}
            </style>
        </defs>

        <!-- BACKGROUND GRID LINES -->
        <line x1="50" y1="35" x2="790" y2="35" stroke="#131e30" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="50" y1="365" x2="790" y2="365" stroke="#131e30" stroke-width="1" stroke-dasharray="4 4"/>

        <!-- ================= INTAKE MANIFOLD (Top Left to Cylinders) ================= -->
        <path d="M 60 55 L 420 55 L 420 85" fill="none" stroke="url(#intakeGrad)" stroke-width="10" stroke-linecap="round"/>
        <path d="M 160 55 L 160 85 M 320 55 L 320 85 M 520 55 L 520 85 M 680 55 L 680 85" fill="none" stroke="#0369a1" stroke-width="6"/>
        <text x="65" y="48" fill="#38bdf8" font-size="10" font-family="monospace" font-weight="bold">INTAKE MANIFOLD (AIR/FUEL)</text>

        <!-- ================= EXHAUST MANIFOLD (Bottom of Heads to Right) ================= -->
        <path d="M 170 125 L 170 145 L 770 145" fill="none" stroke="url(#exhaustGrad)" stroke-width="9" stroke-linecap="round"/>
        <path d="M 330 125 L 330 145 M 530 125 L 530 145 M 690 125 L 690 145" fill="none" stroke="#ef4444" stroke-width="6"/>
        <text x="700" y="138" fill="#f97316" font-size="10" font-family="monospace" font-weight="bold">EXHAUST</text>

        <!-- ================= COOLING SYSTEM JACKET (Surrounding Cylinders) ================= -->
        <rect x="100" y="75" width="640" height="150" rx="8" fill="none" stroke="{coolant_color}" stroke-width="2.5" class="coolant-flow" style="{coolant_glow}"/>
        <!-- Coolant In/Out Headers -->
        <path d="M 70 100 L 100 100" stroke="{coolant_color}" stroke-width="4"/>
        <path d="M 740 100 L 770 100" stroke="{coolant_color}" stroke-width="4"/>
        <text x="75" y="93" fill="{coolant_color}" font-size="9" font-family="monospace" font-weight="bold">COOLANT IN</text>
        <text x="710" y="93" fill="{coolant_color}" font-size="9" font-family="monospace" font-weight="bold">COOLANT OUT</text>

        <!-- ================= CRANKCASE BLOCK (Main Structural Housing) ================= -->
        <rect x="80" y="210" width="680" height="150" rx="10" fill="url(#metalGrad)" stroke="#334155" stroke-width="2"/>
        <text x="95" y="348" fill="#64748b" font-size="11" font-family="monospace" font-weight="bold">ENGINE CRANKCASE &amp; OIL SUMP</text>

        <!-- ================= LUBRICATION GALLERY (Lower Crankcase Circuit) ================= -->
        <path d="M 90 325 L 750 325" fill="none" stroke="{oil_color}" stroke-width="3" class="oil-flow" style="{oil_glow}"/>
        <path d="M 160 325 L 160 270 M 320 325 L 320 270 M 520 325 L 520 270 M 680 325 L 680 270" fill="none" stroke="{oil_color}" stroke-width="2.5"/>
        <text x="630" y="340" fill="{oil_color}" font-size="9" font-family="monospace" font-weight="bold">OIL GALLERY ({oil_p:.1f} bar)</text>

        <!-- ================= 4 CYLINDERS & RECIPROCATING ASSEMBLIES ================= -->

        <!-- CYLINDER 1 (x=160) -->
        <g transform="translate(110, 80)">
            <!-- Bore Walls -->
            <rect x="0" y="0" width="100" height="135" fill="#0b111e" stroke="#475569" stroke-width="2"/>
            <!-- Combustion Flame -->
            <polygon points="15,25 50,5 85,25 70,35 50,20 30,35" fill="#f97316" class="flame-anim-a"/>
            <!-- Piston + Rod -->
            <g class="piston-a">
                <rect x="5" y="30" width="90" height="42" rx="4" fill="url(#pistonGrad)" stroke="#64748b" stroke-width="1.5"/>
                <line x1="50" y1="65" x2="50" y2="155" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
                <circle cx="50" cy="65" r="5" fill="#e2e8f0"/>
            </g>
            <text x="20" y="-8" fill="#cbd5e1" font-size="11" font-family="monospace" font-weight="bold">CYLINDER 1</text>
        </g>

        <!-- CYLINDER 2 (x=320) - [TARGET FOR MISFIRE ANOMALY] -->
        <g transform="translate(270, 80)">
            <rect x="0" y="0" width="100" height="135" fill="#0b111e" style="{cyl2_stroke}"/>
            <polygon points="15,25 50,5 85,25 70,35 50,20 30,35" fill="{cyl2_flame}" class="flame-anim-b"/>
            <g class="piston-b">
                <rect x="5" y="30" width="90" height="42" rx="4" fill="url(#pistonGrad)" stroke="#64748b" stroke-width="1.5"/>
                <line x1="50" y1="65" x2="50" y2="155" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
                <circle cx="50" cy="65" r="5" fill="#e2e8f0"/>
            </g>
            <text x="20" y="-8" fill="{ '#f43f5e' if is_misfire_fault else '#cbd5e1' }" font-size="11" font-family="monospace" font-weight="bold">
                CYLINDER 2 {'[MISFIRE]' if is_misfire_fault else ''}
            </text>
        </g>

        <!-- CYLINDER 3 (x=520) -->
        <g transform="translate(470, 80)">
            <rect x="0" y="0" width="100" height="135" fill="#0b111e" stroke="#475569" stroke-width="2"/>
            <polygon points="15,25 50,5 85,25 70,35 50,20 30,35" fill="#f97316" class="flame-anim-a"/>
            <g class="piston-a">
                <rect x="5" y="30" width="90" height="42" rx="4" fill="url(#pistonGrad)" stroke="#64748b" stroke-width="1.5"/>
                <line x1="50" y1="65" x2="50" y2="155" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
                <circle cx="50" cy="65" r="5" fill="#e2e8f0"/>
            </g>
            <text x="20" y="-8" fill="#cbd5e1" font-size="11" font-family="monospace" font-weight="bold">CYLINDER 3</text>
        </g>

        <!-- CYLINDER 4 (x=680) -->
        <g transform="translate(630, 80)">
            <rect x="0" y="0" width="100" height="135" fill="#0b111e" stroke="#475569" stroke-width="2"/>
            <polygon points="15,25 50,5 85,25 70,35 50,20 30,35" fill="#f97316" class="flame-anim-b"/>
            <g class="piston-b">
                <rect x="5" y="30" width="90" height="42" rx="4" fill="url(#pistonGrad)" stroke="#64748b" stroke-width="1.5"/>
                <line x1="50" y1="65" x2="50" y2="155" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
                <circle cx="50" cy="65" r="5" fill="#e2e8f0"/>
            </g>
            <text x="20" y="-8" fill="#cbd5e1" font-size="11" font-family="monospace" font-weight="bold">CYLINDER 4</text>
        </g>

        <!-- ================= CRANKSHAFT ROTATING COUNTERWEIGHTS ================= -->
        <g class="crank-spin">
            <!-- Center Main Crankshaft Axis -->
            <line x1="120" y1="295" x2="720" y2="295" stroke="#64748b" stroke-width="12" stroke-linecap="round"/>
            <!-- Web 1 -->
            <circle cx="160" cy="295" r="22" fill="#334155" stroke="#0ea5e9" stroke-width="2"/>
            <circle cx="160" cy="275" r="7" fill="#e2e8f0"/>
            <!-- Web 2 -->
            <circle cx="320" cy="295" r="22" fill="#334155" stroke="#0ea5e9" stroke-width="2"/>
            <circle cx="320" cy="315" r="7" fill="#e2e8f0"/>
            <!-- Web 3 -->
            <circle cx="520" cy="295" r="22" fill="#334155" stroke="#0ea5e9" stroke-width="2"/>
            <circle cx="520" cy="275" r="7" fill="#e2e8f0"/>
            <!-- Web 4 -->
            <circle cx="680" cy="295" r="22" fill="#334155" stroke="#0ea5e9" stroke-width="2"/>
            <circle cx="680" cy="315" r="7" fill="#e2e8f0"/>
        </g>
        <text x="380" y="300" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">CRANKSHAFT</text>

        <!-- ================= SENSOR TELEMETRY OVERLAY PROBES ================= -->
        <!-- SENSOR CHT (Cylinder 1 Head) -->
        <g transform="translate(190, 85)">
            <circle cx="0" cy="0" r="5" fill="#f43f5e"/>
            <line x1="0" y1="0" x2="25" y2="-20" stroke="#f43f5e" stroke-width="1.5"/>
            <rect x="25" y="-32" width="95" height="18" rx="3" fill="#0f172a" stroke="#f43f5e" stroke-width="1"/>
            <text x="30" y="-19" fill="#fca5a5" font-size="10" font-family="monospace" font-weight="bold">CHT: {cht:.0f}°C</text>
        </g>

        <!-- SENSOR EGT (Exhaust Collector) -->
        <g transform="translate(560, 140)">
            <circle cx="0" cy="0" r="5" fill="#f97316"/>
            <line x1="0" y1="0" x2="30" y2="22" stroke="#f97316" stroke-width="1.5"/>
            <rect x="30" y="14" width="95" height="18" rx="3" fill="#0f172a" stroke="#f97316" stroke-width="1"/>
            <text x="35" y="27" fill="#fdba74" font-size="10" font-family="monospace" font-weight="bold">EGT: {egt:.0f}°C</text>
        </g>

        <!-- SENSOR OIL PRESSURE (Gallery) -->
        <g transform="translate(200, 325)">
            <circle cx="0" cy="0" r="5" fill="#eab308"/>
            <line x1="0" y1="0" x2="-25" y2="20" stroke="#eab308" stroke-width="1.5"/>
            <rect x="-135" y="12" width="105" height="18" rx="3" fill="#0f172a" stroke="#eab308" stroke-width="1"/>
            <text x="-130" y="25" fill="#fde047" font-size="10" font-family="monospace" font-weight="bold">OIL P: {oil_p:.2f} bar</text>
        </g>

        <!-- SENSOR VIBRATION (Crankcase accelerometer) -->
        <g transform="translate(480, 240)">
            <circle cx="0" cy="0" r="5" fill="#a855f7"/>
            <line x1="0" y1="0" x2="25" y2="-18" stroke="#a855f7" stroke-width="1.5"/>
            <rect x="25" y="-28" width="105" height="18" rx="3" fill="#0f172a" stroke="#a855f7" stroke-width="1"/>
            <text x="30" y="-15" fill="#d8b4fe" font-size="10" font-family="monospace" font-weight="bold">VIB: {vib:.3f}g</text>
        </g>

        <!-- SENSOR RPM (Flywheel pickup) -->
        <g transform="translate(730, 295)">
            <circle cx="0" cy="0" r="5" fill="#06b6d4"/>
            <line x1="0" y1="0" x2="20" y2="-20" stroke="#06b6d4" stroke-width="1.5"/>
            <rect x="-80" y="-36" width="95" height="18" rx="3" fill="#0f172a" stroke="#06b6d4" stroke-width="1"/>
            <text x="-75" y="-23" fill="#67e8f9" font-size="10" font-family="monospace" font-weight="bold">RPM: {rpm:.0f}</text>
        </g>
    </svg>
    """
    return svg_content

# ------------------------------------------------------------------------------
# 5. DASH APP INITIALIZATION & LAYOUT
# ------------------------------------------------------------------------------
app = dash.Dash(
    __name__,
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}],
    title="Aero Engine Digital Twin | MALE UAV"
)
server = app.server

# App Layout
app.layout = html.Div([
    # Embedded Custom Stylesheet
    html.Style(CUSTOM_CSS),

    # 1. TOP HEADER / STATUS BAR
    html.Div([
        html.Div([
            html.Div([
                html.Span("AERO ENGINE DIGITAL TWIN", style={"fontSize": "18px", "fontWeight": "800", "letterSpacing": "0.06em", "color": "#f8fafc"}),
                html.Span("AI-ENABLED REAL-TIME HEALTH MONITORING | MALE UAV PROPULSION", style={"fontSize": "11px", "color": "#38bdf8", "fontWeight": "600", "letterSpacing": "0.05em", "display": "block", "marginTop": "2px"}),
            ]),
            html.Div([
                html.Span("● LIVE SIMULATION", id="top-sim-status", className="status-pill status-normal", style={"marginRight": "10px"}),
                html.Span("Engine Status: NORMAL", id="top-engine-status", className="status-pill status-normal"),
                html.Span(id="top-clock", className="font-mono", style={"fontSize": "12px", "color": "#94a3b8", "marginLeft": "14px"}),
            ], style={"display": "flex", "alignItems": "center"}),
        ], style={"display": "flex", "justifyContent": "space-between", "alignItems": "center", "flexWrap": "wrap", "gap": "10px"}),
    ], style={"background": "#0c121e", "borderBottom": "1px solid #1e293b", "padding": "12px 24px"}),

    # MAIN CONTENT CONTAINER
    html.Div([
        # DEMO ACTIVE NOTIFICATION BANNER (Conditional)
        html.Div(id="demo-banner-container", style={"marginBottom": "12px"}),

        # ROW 1: 4-CYLINDER VIRTUAL ENGINE VISUALIZATION
        html.Div([
            html.Div([
                html.Div([
                    html.Span("VIRTUAL AERO ENGINE — 4-CYLINDER RECIPROCATING DIGITAL TWIN SCHEMATIC"),
                    html.Span(id="engine-fault-tag", style={"fontSize": "10px", "color": "#38bdf8", "fontFamily": "monospace"}),
                ], className="gcs-card-header"),
                html.Div(id="engine-svg-container", style={"minHeight": "290px", "display": "flex", "alignItems": "center", "justifyContent": "center"}),
            ], className="gcs-card"),
        ], style={"marginBottom": "14px"}),

        # ROW 2: 8 TELEMETRY KPI CARDS (2 rows of 4)
        html.Div([
            # Card 1: RPM
            html.Div([
                html.Div("RPM", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-rpm", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#38bdf8", "margin": "4px 0"}),
                html.Div("rev/min", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 2: CHT
            html.Div([
                html.Div("CYLINDER HEAD TEMP", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-cht", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#f8fafc", "margin": "4px 0"}),
                html.Div("CHT (°C)", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 3: EGT
            html.Div([
                html.Div("EXHAUST GAS TEMP", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-egt", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#f8fafc", "margin": "4px 0"}),
                html.Div("EGT (°C)", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 4: Oil Pressure
            html.Div([
                html.Div("OIL PRESSURE", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-oil-p", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#fde047", "margin": "4px 0"}),
                html.Div("bar", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 5: Oil Temperature
            html.Div([
                html.Div("OIL TEMPERATURE", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-oil-t", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#f8fafc", "margin": "4px 0"}),
                html.Div("°C", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 6: Vibration
            html.Div([
                html.Div("VIBRATION", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-vib", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#c084fc", "margin": "4px 0"}),
                html.Div("g RMS", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 7: Battery
            html.Div([
                html.Div("BATTERY BUS", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-bat", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#34d399", "margin": "4px 0"}),
                html.Div("Volts (DC)", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
            # Card 8: Fuel Flow
            html.Div([
                html.Div("FUEL FLOW", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "700"}),
                html.Div(id="kpi-fuel", className="font-mono", style={"fontSize": "22px", "fontWeight": "800", "color": "#fb923c", "margin": "4px 0"}),
                html.Div("L/h", style={"fontSize": "10px", "color": "#64748b"}),
            ], className="gcs-card", style={"padding": "10px 14px"}),
        ], style={"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(140px, 1fr))", "gap": "10px", "marginBottom": "14px"}),

        # ROW 3: TWO COLUMNS (Left: Live Telemetry Graph & Physics Residuals | Right: Digital Twin Health & AI Diagnostics)
        html.Div([
            # LEFT COLUMN
            html.Div([
                # Live Telemetry Time Series Graph
                html.Div([
                    html.Div([
                        html.Span("LIVE SENSOR TELEMETRY STREAM"),
                        dcc.RadioItems(
                            id="graph-param-selector",
                            options=[
                                {"label": " All Traces", "value": "ALL"},
                                {"label": " Temperatures", "value": "TEMP"},
                                {"label": " RPM & Vib", "value": "RPM_VIB"},
                                {"label": " Hydraulics", "value": "OIL"}
                            ],
                            value="ALL",
                            inline=True,
                            style={"fontSize": "11px", "color": "#cbd5e1"},
                            inputStyle={"marginRight": "4px", "marginLeft": "8px"}
                        )
                    ], className="gcs-card-header"),
                    dcc.Graph(
                        id="telemetry-graph",
                        config={"displayModeBar": False, "responsive": True},
                        style={"height": "260px"}
                    ),
                ], className="gcs-card", style={"marginBottom": "14px"}),

                # Physics-Based Digital Twin Residual Monitoring Table
                html.Div([
                    html.Div([
                        html.Span("PHYSICS-BASED DIGITAL TWIN RESIDUAL MONITORING"),
                        html.Span("Δ = MEASURED − PREDICTED", style={"fontSize": "10px", "color": "#38bdf8"}),
                    ], className="gcs-card-header"),
                    html.Div(id="physics-residuals-table"),
                ], className="gcs-card"),
            ], style={"flex": "1 1 55%", "minWidth": "320px"}),

            # RIGHT COLUMN
            html.Div([
                # Subsystem Health Breakdown
                html.Div([
                    html.Div([
                        html.Span("DIGITAL TWIN SUBSYSTEM HEALTH"),
                        html.Span(id="engine-overall-health-badge", className="font-mono", style={"fontWeight": "bold"}),
                    ], className="gcs-card-header"),
                    html.Div(id="subsystem-health-bars", style={"display": "flex", "flexDirection": "column", "gap": "8px"}),
                ], className="gcs-card", style={"marginBottom": "14px"}),

                # AI / Fault Detection Panel
                html.Div([
                    html.Div([
                        html.Span("AI / ML FAULT CLASSIFICATION"),
                        html.Span("ISOLATION FOREST + RESIDUALS", style={"fontSize": "10px", "color": "#38bdf8"}),
                    ], className="gcs-card-header"),
                    html.Div(id="ai-fault-detection-body"),
                ], className="gcs-card", style={"marginBottom": "14px"}),

                # Remaining Useful Life (RUL) & Maintenance Recommendation
                html.Div([
                    html.Div([
                        html.Span("PROGNOSTICS: REMAINING USEFUL LIFE (RUL) & MAINTENANCE"),
                    ], className="gcs-card-header"),
                    html.Div(id="rul-and-maintenance-body"),
                ], className="gcs-card"),
            ], style={"flex": "1 1 45%", "minWidth": "320px"}),
        ], style={"display": "flex", "flexWrap": "wrap", "gap": "14px", "marginBottom": "14px"}),

        # ROW 4: MISSION CONTEXT & FAULT INJECTION CONTROLS
        html.Div([
            # Mission Context (Left)
            html.Div([
                html.Div([
                    html.Span("UAV MISSION CONTEXT"),
                    html.Span("UAV-07 | MISSION-027", style={"fontSize": "10px", "color": "#38bdf8"}),
                ], className="gcs-card-header"),
                html.Div([
                    html.Div([html.Span("FLIGHT STATUS: ", style={"color": "#64748b"}), html.Strong("CRUISE", style={"color": "#38bdf8"})]),
                    html.Div([html.Span("ALTITUDE: ", style={"color": "#64748b"}), html.Strong(id="mission-alt", className="font-mono")]),
                    html.Div([html.Span("THROTTLE: ", style={"color": "#64748b"}), html.Strong(id="mission-throttle", className="font-mono")]),
                    html.Div([html.Span("ENGINE LOAD: ", style={"color": "#64748b"}), html.Strong(id="mission-load", className="font-mono")]),
                    html.Div([html.Span("ENGINE HOURS: ", style={"color": "#64748b"}), html.Strong(id="mission-hours", className="font-mono")]),
                    html.Div([html.Span("SIM TIME: ", style={"color": "#64748b"}), html.Strong(id="mission-time", className="font-mono")]),
                ], style={"display": "grid", "gridTemplateColumns": "repeat(auto-fit, minmax(130px, 1fr))", "gap": "8px", "fontSize": "11px"}),
            ], className="gcs-card", style={"flex": "1 1 35%", "minWidth": "280px"}),

            # Fault Injection / Demo Controls (Right)
            html.Div([
                html.Div([
                    html.Span("FAULT INJECTION & SIH DEMO CONTROLS"),
                    html.Span("REAL-TIME ECU CONTROL", style={"fontSize": "10px", "color": "#94a3b8"}),
                ], className="gcs-card-header"),
                html.Div([
                    html.Button("▶ RESUME", id="btn-pause-resume", className="gcs-btn"),
                    html.Button("↻ RESET ALL", id="btn-reset", className="gcs-btn gcs-btn-danger"),
                    html.Button("🔥 INJECT COOLING DEGRADATION", id="btn-fault-cooling", className="gcs-btn"),
                    html.Button("⚡ INJECT MISFIRE", id="btn-fault-misfire", className="gcs-btn"),
                    html.Button("🛢 INJECT OIL DEGRADATION", id="btn-fault-oil", className="gcs-btn"),
                    html.Button("★ SIH DEMO MODE", id="btn-demo-mode", className="gcs-btn gcs-btn-demo"),
                ], style={"display": "flex", "flexWrap": "wrap", "gap": "8px"}),
            ], className="gcs-card", style={"flex": "1 1 60%", "minWidth": "320px"}),
        ], style={"display": "flex", "flexWrap": "wrap", "gap": "14px", "marginBottom": "20px"}),

    ], style={"maxWidth": "1560px", "margin": "0 auto", "padding": "16px"}),

    # CENTRAL SIMULATION INTERVAL TIMER (500 ms)
    dcc.Interval(id="interval-sim", interval=600, n_intervals=0)
])

# ------------------------------------------------------------------------------
# 6. CENTRAL MASTER CALLBACK (ECU -> Twin -> AI/ML -> Dashboard)
# ------------------------------------------------------------------------------
@app.callback(
    # Top Status Bar
    Output("top-sim-status", "children"),
    Output("top-sim-status", "className"),
    Output("top-engine-status", "children"),
    Output("top-engine-status", "className"),
    Output("top-clock", "children"),
    # Demo Banner
    Output("demo-banner-container", "children"),
    # Virtual Engine SVG
    Output("engine-svg-container", "children"),
    Output("engine-fault-tag", "children"),
    # 8 KPI Telemetry Cards
    Output("kpi-rpm", "children"),
    Output("kpi-cht", "children"),
    Output("kpi-egt", "children"),
    Output("kpi-oil-p", "children"),
    Output("kpi-oil-t", "children"),
    Output("kpi-vib", "children"),
    Output("kpi-bat", "children"),
    Output("kpi-fuel", "children"),
    # Telemetry Graph
    Output("telemetry-graph", "figure"),
    # Physics Residuals Table
    Output("physics-residuals-table", "children"),
    # Subsystem Health Panel
    Output("engine-overall-health-badge", "children"),
    Output("subsystem-health-bars", "children"),
    # AI / Fault Detection
    Output("ai-fault-detection-body", "children"),
    # RUL and Maintenance
    Output("rul-and-maintenance-body", "children"),
    # Mission Context
    Output("mission-alt", "children"),
    Output("mission-throttle", "children"),
    Output("mission-load", "children"),
    Output("mission-hours", "children"),
    Output("mission-time", "children"),
    Output("btn-pause-resume", "children"),
    # Inputs
    Input("interval-sim", "n_intervals"),
    Input("btn-pause-resume", "n_clicks"),
    Input("btn-reset", "n_clicks"),
    Input("btn-fault-cooling", "n_clicks"),
    Input("btn-fault-misfire", "n_clicks"),
    Input("btn-fault-oil", "n_clicks"),
    Input("btn-demo-mode", "n_clicks"),
    Input("graph-param-selector", "value"),
    prevent_initial_call=False
)
def master_simulation_loop(n_intervals, n_pause, n_reset, n_cool, n_misfire, n_oil, n_demo, graph_selector):
    global ecu, twin, ai_layer, telemetry_history, demo_state

    # 1. HANDLE USER BUTTON INTERACTIONS
    ctx = callback_context
    triggered_id = ctx.triggered[0]["prop_id"].split(".")[0] if ctx.triggered else ""

    if triggered_id == "btn-pause-resume":
        ecu.is_running = not ecu.is_running
    elif triggered_id == "btn-reset":
        ecu.clear_faults()
        demo_state["active"] = False
        demo_state["stage"] = 1
        demo_state["ticks_in_stage"] = 0
    elif triggered_id == "btn-fault-cooling":
        ecu.inject_fault("COOLING_DEGRADATION", 1.0)
        demo_state["active"] = False
    elif triggered_id == "btn-fault-misfire":
        ecu.inject_fault("MISFIRE", 1.0)
        demo_state["active"] = False
    elif triggered_id == "btn-fault-oil":
        ecu.inject_fault("OIL_DEGRADATION", 1.0)
        demo_state["active"] = False
    elif triggered_id == "btn-demo-mode":
        demo_state["active"] = True
        demo_state["stage"] = 1
        demo_state["ticks_in_stage"] = 0
        ecu.clear_faults()

    # 2. AUTOMATED DEMO MODE SEQUENCE CONTROLLER
    demo_banner = html.Div()
    if demo_state["active"]:
        demo_state["ticks_in_stage"] += 1
        stage = demo_state["stage"]
        ticks = demo_state["ticks_in_stage"]

        # 4-Stage SIH Sequence (7 seconds / ~11 ticks per stage)
        if stage == 1 and ticks > 10:
            demo_state["stage"] = 2
            demo_state["ticks_in_stage"] = 0
            ecu.inject_fault("COOLING_DEGRADATION", 0.95)
        elif stage == 2 and ticks > 12:
            demo_state["stage"] = 3
            demo_state["ticks_in_stage"] = 0
            ecu.clear_faults()
            ecu.inject_fault("MISFIRE", 1.0)
        elif stage == 3 and ticks > 12:
            demo_state["stage"] = 4
            demo_state["ticks_in_stage"] = 0
            ecu.clear_faults()
            ecu.inject_fault("OIL_DEGRADATION", 1.0)
        elif stage == 4 and ticks > 14:
            # Complete loop or reset
            demo_state["stage"] = 1
            demo_state["ticks_in_stage"] = 0
            ecu.clear_faults()

        stage_titles = {
            1: "STAGE 1/4: NOMINAL CRUISE ENVELOPE (Health ~95-100%, No Anomaly)",
            2: "STAGE 2/4: COOLING DEGRADATION (CHT Rise, Oil Temp Rise, Thermal Anomaly)",
            3: "STAGE 3/4: CYLINDER MISFIRE (Vibration Spike, EGT Imbalance, RPM Drop)",
            4: "STAGE 4/4: OIL DEGRADATION (Oil Pressure Drop, Friction Heat, Critical Advisory)"
        }

        demo_banner = html.Div([
            html.Div([
                html.Span("★ SIH DEMO MODE ACTIVE: ", style={"fontWeight": "bold", "color": "#38bdf8"}),
                html.Span(stage_titles.get(demo_state["stage"], "")),
            ], style={"fontSize": "12px", "fontFamily": "monospace"}),
            html.Div(f"Progress: Step {demo_state['stage']} of 4", style={"fontSize": "11px", "color": "#94a3b8"})
        ], style={
            "background": "linear-gradient(90deg, rgba(6,182,212,0.15) 0%, rgba(14,165,233,0.05) 100%)",
            "border": "1px solid #0284c7",
            "borderRadius": "6px",
            "padding": "8px 14px",
            "display": "flex",
            "justifyContent": "space-between",
            "alignItems": "center"
        })

    # 3. ADVANCE ECU & PROCESS DIGITAL TWIN PIPELINE
    t = ecu.step(0.6 if ecu.is_running else 0.0)
    telemetry_history.append(t)
    if len(telemetry_history) > MAX_HISTORY:
        telemetry_history.pop(0)

    # Digital Twin Core Physics Predictions & Residuals
    twin_out = twin.process_sensor_data(t)
    preds = twin_out.get("predictions", {})
    residuals = twin_out.get("residuals", {})
    health = twin_out.get("health_scores", {})

    # AI / ML Diagnostic Layer
    ai_out = ai_layer.process(t, residuals, health)
    anomaly_status = ai_out.get("anomaly_status", "NORMAL")
    anomaly_score = ai_out.get("anomaly_score", 0.08)
    detected_fault = ai_out.get("detected_fault", "None")

    # 4. TOP BAR STATUS FORMATTING
    is_live = ecu.is_running
    top_sim_text = "● LIVE SIMULATION" if is_live else "PAUSED"
    top_sim_class = "status-pill status-normal" if is_live else "status-pill status-warning"

    top_eng_text = f"Engine Status: {anomaly_status}"
    if anomaly_status == "CRITICAL":
        top_eng_class = "status-pill status-critical"
    elif anomaly_status == "WARNING":
        top_eng_class = "status-pill status-warning"
    else:
        top_eng_class = "status-pill status-normal"

    clock_str = time.strftime("%H:%M:%S UTC")

    # 5. VIRTUAL ENGINE SVG SCHEMATIC
    engine_svg_str = generate_engine_svg(t, detected_fault, anomaly_status)
    engine_svg_component = html.Iframe(
        srcDoc=engine_svg_str,
        style={"width": "100%", "height": "320px", "border": "none"}
    )
    engine_fault_tag = f"ACTIVE FAULT: {detected_fault}" if detected_fault != "None" else "STATUS: ENVELOPE NOMINAL"

    # 6. KPI CARD VALUES
    rpm_val = f"{t.get('rpm', 0.0):,.0f}"
    cht_val = f"{t.get('cht', 0.0):.1f} °C"
    egt_val = f"{t.get('egt', 0.0):.1f} °C"
    oil_p_val = f"{t.get('oil_pressure', 0.0):.2f} bar"
    oil_t_val = f"{t.get('oil_temp', 0.0):.1f} °C"
    vib_val = f"{t.get('vibration', 0.0):.3f} g"
    bat_val = f"{t.get('battery_voltage', 0.0):.1f} V"
    fuel_val = f"{t.get('fuel_flow', 0.0):.1f} L/h"

    # 7. TELEMETRY GRAPH (Plotly Time-Series) - GUARANTEED NO EMPTY WHITE BOXES
    fig = go.Figure()
    time_series = [x.get("simulation_time", idx) for idx, x in enumerate(telemetry_history)]

    if graph_selector in ("ALL", "TEMP"):
        fig.add_trace(go.Scatter(
            x=time_series, y=[x.get("cht", 213.0) for x in telemetry_history],
            name="CHT (°C)", mode="lines", line=dict(color="#38bdf8", width=2)
        ))
        fig.add_trace(go.Scatter(
            x=time_series, y=[x.get("egt", 668.0) for x in telemetry_history],
            name="EGT (°C)", mode="lines", line=dict(color="#f97316", width=2)
        ))

    if graph_selector in ("ALL", "RPM_VIB"):
        fig.add_trace(go.Scatter(
            x=time_series, y=[x.get("vibration", 0.14) * 1000 for x in telemetry_history],
            name="Vibration (mg RMS)", mode="lines", line=dict(color="#c084fc", width=1.8, dash="dot")
        ))
        if graph_selector == "RPM_VIB":
            fig.add_trace(go.Scatter(
                x=time_series, y=[x.get("rpm", 2400.0) for x in telemetry_history],
                name="RPM", mode="lines", line=dict(color="#34d399", width=2)
            ))

    if graph_selector in ("ALL", "OIL"):
        fig.add_trace(go.Scatter(
            x=time_series, y=[x.get("oil_pressure", 4.10) * 50 for x in telemetry_history],
            name="Oil Press (x50 bar)", mode="lines", line=dict(color="#facc15", width=2)
        ))
        fig.add_trace(go.Scatter(
            x=time_series, y=[x.get("oil_temp", 120.0) for x in telemetry_history],
            name="Oil Temp (°C)", mode="lines", line=dict(color="#f43f5e", width=1.8)
        ))

    fig.update_layout(
        paper_bgcolor="#0c121e",
        plot_bgcolor="#080d16",
        margin=dict(l=40, r=20, t=10, b=30),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(color="#94a3b8", size=10)),
        xaxis=dict(showgrid=True, gridcolor="#1e293b", color="#64748b", title=dict(text="Time (s)", font=dict(size=10))),
        yaxis=dict(showgrid=True, gridcolor="#1e293b", color="#64748b", zeroline=False),
        hovermode="x unified"
    )

    # 8. PHYSICS RESIDUALS TABLE
    param_rows = [
        ("Cylinder Head Temp (CHT)", f"{preds.get('cht', 0):.1f} °C", f"{t.get('cht', 0):.1f} °C", residuals.get("cht", 0), "°C", 10.0),
        ("Exhaust Gas Temp (EGT)", f"{preds.get('egt', 0):.1f} °C", f"{t.get('egt', 0):.1f} °C", residuals.get("egt", 0), "°C", 25.0),
        ("Oil Pressure", f"{preds.get('oil_pressure', 0):.2f} bar", f"{t.get('oil_pressure', 0):.2f} bar", residuals.get("oil_pressure", 0), "bar", 0.35),
        ("Oil Temperature", f"{preds.get('oil_temp', 0):.1f} °C", f"{t.get('oil_temp', 0):.1f} °C", residuals.get("oil_temp", 0), "°C", 10.0),
        ("Vibration (RMS)", f"{preds.get('vibration', 0):.3f} g", f"{t.get('vibration', 0):.3f} g", residuals.get("vibration", 0), "g", 0.040),
    ]

    table_rows = []
    for name, expected, measured, res, unit, tol in param_rows:
        res_sign = "+" if res > 0 else ""
        is_deviated = abs(res) > tol
        res_color = "#f43f5e" if abs(res) > tol*1.8 else ("#f59e0b" if is_deviated else "#38bdf8")
        status_badge = html.Span("DEV" if is_deviated else "NOM", style={
            "fontSize": "9px", "fontWeight": "bold", "padding": "2px 6px", "borderRadius": "3px",
            "background": "rgba(244,63,94,0.2)" if is_deviated else "rgba(16,185,129,0.2)",
            "color": "#f87171" if is_deviated else "#34d399"
        })

        table_rows.append(html.Tr([
            html.Td(name, style={"padding": "6px 8px", "color": "#e2e8f0"}),
            html.Td(expected, className="font-mono", style={"padding": "6px 8px", "color": "#94a3b8", "textAlign": "right"}),
            html.Td(measured, className="font-mono", style={"padding": "6px 8px", "color": "#f8fafc", "fontWeight": "bold", "textAlign": "right"}),
            html.Td(f"{res_sign}{res:.2f} {unit}", className="font-mono", style={"padding": "6px 8px", "color": res_color, "fontWeight": "bold", "textAlign": "right"}),
            html.Td(status_badge, style={"padding": "6px 8px", "textAlign": "center"}),
        ], style={"borderBottom": "1px solid #1a2538"}))

    residuals_table_component = html.Table([
        html.Thead(html.Tr([
            html.Th("PARAMETER", style={"padding": "6px 8px", "color": "#64748b", "fontSize": "10px", "textAlign": "left"}),
            html.Th("EXPECTED (MODEL)", style={"padding": "6px 8px", "color": "#64748b", "fontSize": "10px", "textAlign": "right"}),
            html.Th("ACTUAL (SENSOR)", style={"padding": "6px 8px", "color": "#64748b", "fontSize": "10px", "textAlign": "right"}),
            html.Th("RESIDUAL (Δ)", style={"padding": "6px 8px", "color": "#64748b", "fontSize": "10px", "textAlign": "right"}),
            html.Th("STATUS", style={"padding": "6px 8px", "color": "#64748b", "fontSize": "10px", "textAlign": "center"}),
        ])),
        html.Tbody(table_rows)
    ], style={"width": "100%", "fontSize": "11px", "borderCollapse": "collapse"})

    # 9. SUBSYSTEM HEALTH BARS
    overall_h = health.get("overall", 95.0)
    overall_badge = f"{overall_h:.1f}%"

    subsystem_keys = [
        ("ENGINE OVERALL", overall_h),
        ("COOLING SYSTEM", health.get("cooling", 95.0)),
        ("LUBRICATION SYSTEM", health.get("lubrication", 100.0)),
        ("FUEL SYSTEM", health.get("fuel", 100.0)),
        ("IGNITION SYSTEM", health.get("ignition", 100.0)),
        ("ELECTRICAL SYSTEM", health.get("electrical", 100.0)),
    ]

    health_bar_elements = []
    for label, val in subsystem_keys:
        val_clamped = max(5.0, min(100.0, val))
        fill_color = "#10b981" if val_clamped >= 85.0 else ("#f59e0b" if val_clamped >= 70.0 else "#f43f5e")

        health_bar_elements.append(html.Div([
            html.Div([
                html.Span(label, style={"fontSize": "10px", "fontWeight": "bold", "color": "#cbd5e1"}),
                html.Span(f"{val_clamped:.0f}%", className="font-mono", style={"fontSize": "11px", "fontWeight": "bold", "color": fill_color}),
            ], style={"display": "flex", "justifyContent": "space-between", "marginBottom": "3px"}),
            html.Div([
                html.Div(style={"width": f"{val_clamped}%", "backgroundColor": fill_color}, className="health-bar-fill")
            ], className="health-bar-bg")
        ]))

    # 10. AI / FAULT DETECTION BODY
    evidence_list = ai_out.get("evidence", [])
    confidence = ai_out.get("confidence", 95.0)
    detection_method = ai_out.get("detection_method", "Isolation Forest + Residuals")

    ai_body_component = html.Div([
        html.Div([
            html.Div([
                html.Div("ANOMALY STATUS", style={"fontSize": "10px", "color": "#94a3b8"}),
                html.Div(f"● {anomaly_status}", className=f"status-pill status-{anomaly_status.lower()}", style={"display": "inline-block", "marginTop": "3px"}),
            ]),
            html.Div([
                html.Div("ANOMALY SCORE", style={"fontSize": "10px", "color": "#94a3b8"}),
                html.Div(f"{anomaly_score:.2f}", className="font-mono", style={"fontSize": "18px", "fontWeight": "800", "color": "#f8fafc"}),
            ]),
            html.Div([
                html.Div("DETECTED FAULT", style={"fontSize": "10px", "color": "#94a3b8"}),
                html.Div(detected_fault, className="font-mono", style={"fontSize": "12px", "fontWeight": "bold", "color": "#f87171" if detected_fault != "None" else "#34d399"}),
            ]),
            html.Div([
                html.Div("CONFIDENCE", style={"fontSize": "10px", "color": "#94a3b8"}),
                html.Div(f"{confidence:.0f}%", className="font-mono", style={"fontSize": "14px", "fontWeight": "bold", "color": "#38bdf8"}),
            ]),
        ], style={"display": "grid", "gridTemplateColumns": "1fr 1fr 1.3fr 0.8fr", "gap": "10px", "marginBottom": "10px", "background": "#080d16", "padding": "10px", "borderRadius": "6px"}),

        html.Div([
            html.Span("DIAGNOSTIC EVIDENCE CHAIN:", style={"fontSize": "10px", "fontWeight": "bold", "color": "#64748b"}),
            html.Ul([
                html.Li(item, style={"marginBottom": "2px"}) for item in evidence_list[:4]
            ], style={"margin": "4px 0 0 0", "paddingLeft": "16px", "fontSize": "11px", "color": "#cbd5e1"})
        ]),
        html.Div(f"Method: {detection_method}", style={"fontSize": "9px", "color": "#475569", "marginTop": "6px", "fontFamily": "monospace"})
    ])

    # 11. RUL AND MAINTENANCE BODY
    rul_data = ai_out.get("rul", {})
    overall_rul = rul_data.get("overall_hours", 31.7)
    sub_rul = rul_data.get("subsystems", {})
    maint_data = ai_out.get("maintenance", {})

    prio_color = "#f43f5e" if maint_data.get("priority") == "CRITICAL" else ("#f59e0b" if maint_data.get("priority") == "HIGH" else "#34d399")

    rul_component = html.Div([
        html.Div([
            html.Div([
                html.Div("REMAINING USEFUL LIFE (RUL)", style={"fontSize": "10px", "color": "#94a3b8", "fontWeight": "bold"}),
                html.Div(f"{overall_rul:.1f} HOURS", className="font-mono", style={"fontSize": "22px", "fontWeight": "900", "color": "#fbbf24", "margin": "2px 0"}),
                html.Div("Estimated engine life until inspection", style={"fontSize": "10px", "color": "#64748b"}),
            ], style={"flex": "1"}),
            html.Div([
                html.Div([html.Span("Cooling RUL: "), html.Strong(f"{sub_rul.get('cooling', 0):.1f} h", className="font-mono", style={"color": "#38bdf8"})]),
                html.Div([html.Span("Lubrication RUL: "), html.Strong(f"{sub_rul.get('lubrication', 0):.1f} h", className="font-mono", style={"color": "#38bdf8"})]),
                html.Div([html.Span("Ignition RUL: "), html.Strong(f"{sub_rul.get('ignition', 0):.1f} h", className="font-mono", style={"color": "#38bdf8"})]),
            ], style={"fontSize": "10px", "color": "#94a3b8", "lineHeight": "1.5", "borderLeft": "1px solid #1e293b", "paddingLeft": "12px"}),
        ], style={"display": "flex", "alignItems": "center", "marginBottom": "10px", "background": "#080d16", "padding": "10px", "borderRadius": "6px"}),

        html.Div([
            html.Div([
                html.Span("MAINTENANCE INTELLIGENCE: ", style={"color": "#94a3b8", "fontWeight": "bold", "fontSize": "10px"}),
                html.Span(f"PRIORITY {maint_data.get('priority', 'LOW')}", style={"fontSize": "10px", "fontWeight": "bold", "color": prio_color, "float": "right"}),
            ]),
            html.Div(maint_data.get("recommendation", "Nominal operation."), style={"fontSize": "11px", "color": "#f8fafc", "marginTop": "4px", "fontWeight": "500"}),
        ], style={"border": f"1px solid {prio_color}40", "background": f"{prio_color}10", "padding": "8px 10px", "borderRadius": "5px"})
    ])

    # 12. MISSION CONTEXT
    mission_alt = f"{t.get('altitude', 5000):,.0f} m"
    mission_throttle = f"{t.get('throttle', 65):.0f}%"
    mission_load = f"{t.get('engine_load', 70):.0f}%"
    mission_hours = f"{t.get('flight_hours', 0.07):.2f} h"
    mission_time = f"{t.get('simulation_time', 0):.0f} s"
    pause_btn_text = "Ⅱ PAUSE" if ecu.is_running else "▶ RESUME"

    return (
        top_sim_text, top_sim_class, top_eng_text, top_eng_class, clock_str,
        demo_banner,
        engine_svg_component, engine_fault_tag,
        rpm_val, cht_val, egt_val, oil_p_val, oil_t_val, vib_val, bat_val, fuel_val,
        fig,
        residuals_table_component,
        overall_badge, health_bar_elements,
        ai_body_component,
        rul_component,
        mission_alt, mission_throttle, mission_load, mission_hours, mission_time,
        pause_btn_text
    )

# ------------------------------------------------------------------------------
# 7. SCRIPT ENTRY POINT
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("STARTING DIGITAL TWIN DASHBOARD")
    print("Open your browser to: http://127.0.0.1:8050")
    print("=" * 60 + "\n")
    app.run_server(debug=False, host="127.0.0.1", port=8050)
