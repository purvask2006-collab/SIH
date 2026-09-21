"""
Main Entry Point for the MALE UAV Aero Piston Digital Twin System.
Runs the ECU -> Digital Twin -> AI/ML pipeline and launches the dashboard.
"""

from simulated_ecu import SimulatedECU
from digital_twin_core import DigitalTwinCore
from ai_ml_layer import AIMLLayer

def main():
    print("=" * 60)
    print("MALE UAV PROPULSION DIGITAL TWIN SYSTEM")
    print("Smart India Hackathon 2026 Prototype")
    print("=" * 60)
    
    ecu = SimulatedECU()
    twin = DigitalTwinCore()
    ai = AIMLLayer()
    
    print("[MAIN] Running initial pipeline check...")
    telemetry = ecu.step()
    twin_results = twin.process_sensor_data(telemetry)
    ai_results = ai.process(telemetry, twin_results["residuals"], twin_results["health_scores"])
    
    print(f"[MAIN] Pipeline nominal: RPM={telemetry['rpm']}, CHT={telemetry['cht']}°C, Health={twin_results['health_scores']['overall']}%, Anomaly={ai_results['anomaly_score']}")
    print("[MAIN] Launching Dashboard...")
    
    from dashboard_app import app
    app.run_server(debug=False, host="127.0.0.1", port=8050)

if __name__ == "__main__":
    main()
