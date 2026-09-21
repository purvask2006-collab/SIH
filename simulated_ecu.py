"""
Simulated Engine Control Unit (ECU) for MALE UAV Aero Piston Engine.
Generates realistic multi-channel sensor telemetry with physical cross-correlations,
sensor noise, and support for controlled fault injection.
"""

import time
import math
import random
from typing import Dict, Any, List

class SimulatedECU:
    def __init__(self):
        # Base engine state parameters
        self.throttle = 65.0         # %
        self.altitude = 5000.0       # meters
        self.engine_load = 70.0      # %
        self.flight_hours = 0.07     # hours
        self.simulation_time = 0.0   # seconds
        self.is_running = True
        
        # Fault states
        self.active_faults: List[str] = []
        self.fault_severities: Dict[str, float] = {}
        
        # Dynamic telemetry channels
        self.rpm = 2400.0
        self.cht = 213.0             # °C
        self.egt = 668.0             # °C
        self.oil_pressure = 4.10     # bar
        self.oil_temp = 120.0        # °C
        self.vibration = 0.140       # g RMS
        self.fuel_flow = 24.8        # L/h
        self.battery_voltage = 14.0  # V
        
        print("[ECU] Initialized MALE UAV Aero Piston Engine ECU")
        self.clear_faults()
        
    def clear_faults(self):
        """Clears all active fault injections and restores nominal engine conditions."""
        self.active_faults = []
        self.fault_severities = {}
        print("[ECU] All faults cleared")

    def inject_fault(self, fault_name: str, severity: float = 1.0):
        """
        Injects a specific fault into the engine physics simulation.
        Supported faults: 'cooling', 'misfire', 'oil'
        """
        fault_key = fault_name.lower().strip()
        if 'cool' in fault_key:
            fault_id = 'COOLING_DEGRADATION'
        elif 'misfire' in fault_key:
            fault_id = 'MISFIRE'
        elif 'oil' in fault_key or 'lub' in fault_key:
            fault_id = 'OIL_DEGRADATION'
        else:
            fault_id = fault_name.upper()

        if fault_id not in self.active_faults:
            self.active_faults.append(fault_id)
        self.fault_severities[fault_id] = max(0.1, min(1.0, severity))
        print(f"[ECU] Fault injected: {fault_id} (severity: {self.fault_severities[fault_id]:.2f})")

    def set_throttle(self, throttle_pct: float):
        self.throttle = max(0.0, min(100.0, float(throttle_pct)))

    def set_altitude(self, altitude_m: float):
        self.altitude = max(0.0, min(8000.0, float(altitude_m)))

    def step(self, dt: float = 1.0) -> Dict[str, Any]:
        """
        Advances the engine simulation by dt seconds and computes telemetry.
        """
        if not self.is_running:
            return self.get_telemetry()

        self.simulation_time += dt
        self.flight_hours += dt / 3600.0

        # Physical baseline calculation based on throttle and altitude air density
        # Altitude lapse: standard barometric lapse rate
        air_density_ratio = math.exp(-self.altitude / 8500.0)
        throttle_norm = self.throttle / 100.0
        
        # Nominal target values
        target_rpm = 1200.0 + (throttle_norm * 1450.0) * (0.85 + 0.15 * air_density_ratio)
        target_cht = 180.0 + (throttle_norm * 42.0) + ((1.0 - air_density_ratio) * 15.0)
        target_egt = 630.0 + (throttle_norm * 55.0) - (air_density_ratio * 10.0)
        target_oil_pressure = 3.6 + (target_rpm / 2600.0) * 0.75
        target_oil_temp = 105.0 + (throttle_norm * 22.0)
        target_vibration = 0.110 + (target_rpm / 3000.0) * 0.040
        target_fuel_flow = 12.0 + (throttle_norm * 19.5) * air_density_ratio
        target_load = 50.0 + throttle_norm * 35.0

        # Fault effects modulation
        delta_cht = 0.0
        delta_egt = 0.0
        delta_oil_p = 0.0
        delta_oil_t = 0.0
        delta_vib = 0.0
        delta_fuel = 0.0
        delta_rpm = 0.0

        for fault in self.active_faults:
            sev = self.fault_severities.get(fault, 1.0)
            if fault == 'COOLING_DEGRADATION':
                # Cylinder head temp spikes dramatically, oil temperature elevates
                delta_cht += 32.0 * sev
                delta_oil_t += 18.0 * sev
                delta_vib += 0.025 * sev
            elif fault == 'MISFIRE':
                # Cylinder misfire causes strong vibration harmonic, RPM drop, unburnt fuel / EGT drop or spike
                delta_vib += 0.115 * sev
                delta_egt += -65.0 * sev
                delta_rpm += -140.0 * sev
                delta_cht += -12.0 * sev
                delta_fuel += 2.8 * sev
            elif fault == 'OIL_DEGRADATION':
                # Oil pressure loss, oil temp surge, increased friction vibration
                delta_oil_p += -1.20 * sev
                delta_oil_t += 24.0 * sev
                delta_vib += 0.065 * sev
                delta_cht += 10.0 * sev

        # First-order lag response + realistic stochastic sensor jitter
        jitter_rpm = random.gauss(0, 7.0)
        jitter_cht = random.gauss(0, 0.4)
        jitter_egt = random.gauss(0, 1.5)
        jitter_oil_p = random.gauss(0, 0.02)
        jitter_oil_t = random.gauss(0, 0.25)
        jitter_vib = abs(random.gauss(0, 0.005))
        jitter_fuel = random.gauss(0, 0.15)

        alpha = 0.35  # Smoothing factor
        self.rpm += alpha * ((target_rpm + delta_rpm) - self.rpm) + jitter_rpm
        self.cht += alpha * ((target_cht + delta_cht) - self.cht) + jitter_cht
        self.egt += alpha * ((target_egt + delta_egt) - self.egt) + jitter_egt
        self.oil_pressure += alpha * ((target_oil_pressure + delta_oil_p) - self.oil_pressure) + jitter_oil_p
        self.oil_temp += alpha * ((target_oil_temp + delta_oil_t) - self.oil_temp) + jitter_oil_t
        self.vibration += alpha * ((target_vibration + delta_vib) - self.vibration) + jitter_vib
        self.fuel_flow += alpha * ((target_fuel_flow + delta_fuel) - self.fuel_flow) + jitter_fuel
        self.engine_load = round(target_load, 1)

        # Boundary clamping for realism
        self.rpm = max(800.0, min(3200.0, self.rpm))
        self.cht = max(100.0, min(300.0, self.cht))
        self.egt = max(400.0, min(950.0, self.egt))
        self.oil_pressure = max(0.5, min(6.5, self.oil_pressure))
        self.oil_temp = max(60.0, min(180.0, self.oil_temp))
        self.vibration = max(0.05, min(0.60, self.vibration))
        self.fuel_flow = max(5.0, min(45.0, self.fuel_flow))

        return self.get_telemetry()

    def get_telemetry(self) -> Dict[str, Any]:
        """Returns the current sensor telemetry package."""
        now_str = time.strftime("%H:%M:%S")
        return {
            "rpm": round(self.rpm, 0),
            "cht": round(self.cht, 1),
            "egt": round(self.egt, 1),
            "oil_pressure": round(self.oil_pressure, 2),
            "oil_temp": round(self.oil_temp, 1),
            "vibration": round(self.vibration, 3),
            "fuel_flow": round(self.fuel_flow, 1),
            "battery_voltage": round(self.battery_voltage + random.gauss(0, 0.03), 1),
            "altitude": round(self.altitude, 0),
            "throttle": round(self.throttle, 1),
            "engine_load": round(self.engine_load, 1),
            "flight_hours": round(self.flight_hours, 2),
            "active_faults": list(self.active_faults),
            "timestamp": now_str,
            "simulation_time": round(self.simulation_time, 1)
        }
