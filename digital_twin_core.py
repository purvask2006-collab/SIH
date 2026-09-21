"""
Digital Twin Core Engine for Aero Piston Engines used in MALE UAVs.
Computes physics-based nominal reference states, parameter residuals,
and multi-subsystem degradation health indices.
"""

import math
from typing import Dict, Any

class DigitalTwinCore:
    def __init__(self):
        print("[DIGITAL TWIN] Initialized Digital Twin Core Physics Model")

    def predict_physics(self, telemetry: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculates theoretical nominal values expected for an undamaged aero engine
        operating under the given throttle, altitude, and RPM conditions.
        """
        throttle = telemetry.get("throttle", 65.0) / 100.0
        altitude = telemetry.get("altitude", 5000.0)
        rpm = telemetry.get("rpm", 2400.0)
        
        # Atmospheric lapse ratio
        air_density_ratio = math.exp(-altitude / 8500.0)

        # First-principles thermodynamic approximations for 4-cylinder aero piston:
        predicted_cht = 180.0 + (throttle * 42.0) + ((1.0 - air_density_ratio) * 15.0)
        predicted_egt = 630.0 + (throttle * 55.0) - (air_density_ratio * 10.0)
        predicted_oil_pressure = 3.6 + (rpm / 2600.0) * 0.75
        predicted_oil_temp = 105.0 + (throttle * 22.0)
        predicted_vibration = 0.110 + (rpm / 3000.0) * 0.040
        predicted_fuel_flow = 12.0 + (throttle * 19.5) * air_density_ratio

        return {
            "cht": round(predicted_cht, 1),
            "egt": round(predicted_egt, 1),
            "oil_pressure": round(predicted_oil_pressure, 2),
            "oil_temp": round(predicted_oil_temp, 1),
            "vibration": round(predicted_vibration, 3),
            "fuel_flow": round(predicted_fuel_flow, 1),
        }

    def compute_residuals(self, telemetry: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, float]:
        """
        Computes the analytical residual vector: Delta = Measured - Predicted.
        A healthy engine has residuals close to 0 (+/- sensor noise).
        """
        res_cht = telemetry.get("cht", 0.0) - predictions["cht"]
        res_egt = telemetry.get("egt", 0.0) - predictions["egt"]
        res_oil_p = telemetry.get("oil_pressure", 0.0) - predictions["oil_pressure"]
        res_oil_t = telemetry.get("oil_temp", 0.0) - predictions["oil_temp"]
        res_vib = telemetry.get("vibration", 0.0) - predictions["vibration"]
        res_fuel = telemetry.get("fuel_flow", 0.0) - predictions["fuel_flow"]

        return {
            "cht": round(res_cht, 1),
            "egt": round(res_egt, 1),
            "oil_pressure": round(res_oil_p, 2),
            "oil_temp": round(res_oil_t, 1),
            "vibration": round(res_vib, 3),
            "fuel_flow": round(res_fuel, 1),
        }

    def compute_health_scores(self, telemetry: Dict[str, Any], residuals: Dict[str, float]) -> Dict[str, float]:
        """
        Computes health percentages (0 - 100%) across all engine subsystems.
        Uses normalized physical penalties based on residual magnitude.
        """
        # Cooling Health (penalized heavily by CHT excess and high oil temp)
        cht_penalty = max(0.0, residuals["cht"] * 2.2)
        oil_t_penalty = max(0.0, residuals["oil_temp"] * 1.5)
        cooling_health = max(10.0, min(100.0, 100.0 - (cht_penalty + oil_t_penalty * 0.8)))

        # Lubrication Health (penalized heavily by oil pressure loss and oil temp excess)
        oil_p_drop = max(0.0, -residuals["oil_pressure"] * 55.0)
        lubrication_health = max(10.0, min(100.0, 100.0 - (oil_p_drop + oil_t_penalty * 1.2)))

        # Ignition / Combustion Health (penalized by misfire vibration and EGT divergence)
        vib_penalty = max(0.0, residuals["vibration"] * 450.0)
        egt_divergence = abs(residuals["egt"]) * 0.45
        ignition_health = max(10.0, min(100.0, 100.0 - (vib_penalty * 0.7 + egt_divergence)))

        # Fuel System Health
        fuel_res_penalty = abs(residuals["fuel_flow"]) * 3.5
        fuel_health = max(20.0, min(100.0, 100.0 - fuel_res_penalty))

        # Electrical System Health
        v_bat = telemetry.get("battery_voltage", 14.0)
        elec_penalty = abs(14.0 - v_bat) * 15.0
        electrical_health = max(30.0, min(100.0, 100.0 - elec_penalty))

        # Overall Engine Health Index (Harmonic/Weighted Composite)
        weights = {
            "cooling": 0.25,
            "lubrication": 0.25,
            "ignition": 0.25,
            "fuel": 0.15,
            "electrical": 0.10
        }
        overall = (
            cooling_health * weights["cooling"] +
            lubrication_health * weights["lubrication"] +
            ignition_health * weights["ignition"] +
            fuel_health * weights["fuel"] +
            electrical_health * weights["electrical"]
        )

        return {
            "overall": round(overall, 1),
            "cooling": round(cooling_health, 1),
            "lubrication": round(lubrication_health, 1),
            "fuel": round(fuel_health, 1),
            "ignition": round(ignition_health, 1),
            "electrical": round(electrical_health, 1)
        }

    def process_sensor_data(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        End-to-end processing pipeline: Telemetry -> Predictions -> Residuals -> Health.
        """
        predictions = self.predict_physics(telemetry)
        residuals = self.compute_residuals(telemetry, predictions)
        health_scores = self.compute_health_scores(telemetry, residuals)

        return {
            "predictions": predictions,
            "residuals": residuals,
            "health_scores": health_scores
        }
