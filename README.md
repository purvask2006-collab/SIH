# AI-Enabled Real-Time Digital Twin System for MALE UAV Aero Piston Engines
**Smart India Hackathon (SIH) 2026 Prototype**

This system implements an end-to-end aerospace Ground Control Station (GCS) Digital Twin pipeline for health monitoring, anomaly detection, fault classification, and Remaining Useful Life (RUL) estimation for 4-cylinder aero piston engines used in Medium-Altitude Long-Endurance (MALE) UAVs.

---

## 1. System Architecture Pipeline

```text
       ┌──────────────────────┐
       │    Simulated ECU     │ (Engine physics, altitude air density, sensor noise, fault injection)
       └──────────┬───────────┘
                  │  Sensor Telemetry (RPM, CHT, EGT, Oil P, Oil T, Vibration, Fuel, Bus)
                  ▼
       ┌──────────────────────┐
       │  Digital Twin Core   │ (First-principles thermodynamic baseline & expectation models)
       └──────────┬───────────┘
                  │  Analytical Residuals (Δ = Measured − Expected) & Subsystem Health Scores
                  ▼
       ┌──────────────────────┐
       │     AI / ML Layer    │ (Isolation Forest + Physics Residual Distance + Expert Rules)
       └──────────┬───────────┘
                  │  Anomaly Score, Fault Classification, RUL Prognostics & Maintenance Action
                  ▼
       ┌──────────────────────┐
       │ Dash GCS Dashboard   │ (Animated 4-Cylinder SVG Engine, Live Charts, GCS HUD)
       └──────────────────────┘
```

---

## 2. Installation & Setup

Ensure Python 3.9+ is installed. In Windows PowerShell:

```powershell
py -m pip install -r requirements.txt
```

Or install individual packages:

```powershell
py -m pip install dash plotly pandas numpy scikit-learn
```

---

## 3. Running the Dashboard

Launch the application:

```powershell
py dashboard_app.py
```

Then open your browser to:

```text
http://127.0.0.1:8050
```

---

## 4. Key Features for SIH Presentation

1. **Virtual Aero Engine Visualization**: Real-time animated 4-cylinder engine schematic with reciprocating pistons, rotating crankshaft, combustion chamber glow, and cooling/lubrication channels. Animation speed is dynamically synchronized with engine RPM.
2. **Physics-Based Residual Monitoring**: Compares live sensor telemetry against Digital Twin first-principles predictions to calculate analytical residuals ($\Delta$) across thermal, combustion, hydraulic, and mechanical axes.
3. **Multi-Subsystem Health Breakdown**: Continuously computes 0–100% health indices for Engine Overall, Cooling System, Lubrication, Fuel, and Ignition.
4. **AI/ML Anomaly Detection**: Real-time multi-channel anomaly scoring using normalized Mahalanobis residual distance combined with signature-based fault classification.
5. **Fault Injection & Demo Mode**: One-click fault triggers for Cooling System Degradation, Cylinder Misfire, and Oil Circuit Degradation, plus a 4-stage automated SIH evaluation sequence.
6. **Remaining Useful Life (RUL) Prognostics**: Estimates flight hours remaining until required maintenance, factoring in real-time wear acceleration.
