import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { TelemetryData } from '../types/engine';
import {
  Flame,
  Layers,
  Activity,
  Eye,
  Wrench,
  Camera,
  Gauge,
  Zap,
  Wind,
} from 'lucide-react';

interface Engine3DViewProps {
  telemetry: TelemetryData;
  activeFault: string;
  onSelectSensor?: (sensorId: string) => void;
  selectedSensor?: string | null;
  theme?: 'light' | 'dark';
  isPaused?: boolean;
}

interface Sensor3DDef {
  id: string;
  name: string;
  shortName: string;
  position: [number, number, number];
  color: string;
  unit: string;
  getValue: (t: TelemetryData) => number | string;
}

export const Engine3DView: React.FC<Engine3DViewProps> = ({
  telemetry,
  activeFault,
  onSelectSensor,
  selectedSensor,
  theme = 'light',
  isPaused = false,
}) => {
  const isPausedRef = useRef<boolean>(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Animation & Component Node References
  const engineRootRef = useRef<THREE.Group | null>(null);
  const nacelleGroupRef = useRef<THREE.Group | null>(null);
  const propellerRef = useRef<THREE.Group | null>(null);
  const propBladesRef = useRef<THREE.Mesh[]>([]);
  const crankshaftRef = useRef<THREE.Group | null>(null);
  const turboImpellerRef = useRef<THREE.Mesh | null>(null);
  const turbineRotorRef = useRef<THREE.Mesh | null>(null);
  const wastegateRodRef = useRef<THREE.Mesh | null>(null);

  const pistonsRef = useRef<THREE.Mesh[]>([]);
  const conrodsRef = useRef<THREE.Mesh[]>([]);
  const combustionGlowsRef = useRef<THREE.Mesh[]>([]);
  const combustionLightsRef = useRef<THREE.PointLight[]>([]);
  const cylinderBlocksRef = useRef<THREE.Mesh[]>([]);
  const cylinderHeadsRef = useRef<THREE.Mesh[]>([]);
  const valveCoversRef = useRef<THREE.Mesh[]>([]);
  const exhaustPipesRef = useRef<THREE.Mesh[]>([]);

  // Interactive View Modes & Camera State
  const [viewScope, setViewScope] = useState<'ENGINE_STAND' | 'NACELLE_MOUNT'>('ENGINE_STAND');
  const [visualMode, setVisualMode] = useState<'CUTAWAY' | 'THERMAL_IR' | 'VIBRATION' | 'MECHANICAL'>('CUTAWAY');
  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
  const [activeCameraPreset, setActiveCameraPreset] = useState<string>('ISOMETRIC');

  // Spherical camera orbit tracking
  const sphericalRef = useRef({ radius: 6.2, theta: Math.PI / 3.8, phi: Math.PI / 3.2 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0.2));

  // 3D Engine Sensor mapping (Rotax 914-F Turbocharged Aero Piston Engine)
  const sensors: Sensor3DDef[] = [
    {
      id: 'rpm',
      name: 'Propeller Output Shaft & Gearbox Tachometer',
      shortName: 'PROP RPM',
      position: [0, 0, 1.95],
      color: '#0284c7',
      unit: 'RPM',
      getValue: (t) => `${t.rpm} RPM`,
    },
    {
      id: 'cht2',
      name: 'Cylinder #2 Head Thermocouple (Critical Hot Spot)',
      shortName: 'CYL-2 CHT',
      position: [1.18, 0.15, 0.38],
      color: '#ea580c',
      unit: '°C',
      getValue: (t) => `${t.chtCylinders ? t.chtCylinders[1] : t.cht}°C`,
    },
    {
      id: 'cht1',
      name: 'Cylinder #1 Head Thermocouple (Port Front)',
      shortName: 'CYL-1 CHT',
      position: [-1.18, 0.15, 0.38],
      color: '#f97316',
      unit: '°C',
      getValue: (t) => `${t.chtCylinders ? t.chtCylinders[0] : (t.cht - 2).toFixed(1)}°C`,
    },
    {
      id: 'cht3',
      name: 'Cylinder #3 Head Thermocouple (Port Rear)',
      shortName: 'CYL-3 CHT',
      position: [-1.18, 0.15, -0.22],
      color: '#f59e0b',
      unit: '°C',
      getValue: (t) => `${t.chtCylinders ? t.chtCylinders[2] : (t.cht + 3.5).toFixed(1)}°C`,
    },
    {
      id: 'egt',
      name: 'Exhaust Gas Temperature Pyrometer (Collector to Turbo)',
      shortName: 'EXH EGT',
      position: [0.45, -0.65, -0.85],
      color: '#e11d48',
      unit: '°C',
      getValue: (t) => `${t.egt}°C`,
    },
    {
      id: 'oilPressure',
      name: 'Main Lubrication Gallery Pressure Transducer',
      shortName: 'OIL PRESS',
      position: [-0.65, -0.55, 0.2],
      color: '#059669',
      unit: 'bar',
      getValue: (t) => `${t.oilPressure} bar`,
    },
    {
      id: 'oilTemp',
      name: 'Dry-Sump Oil Tank Temperature Sensor',
      shortName: 'OIL TEMP',
      position: [-0.85, -0.45, -0.6],
      color: '#d97706',
      unit: '°C',
      getValue: (t) => `${t.oilTemperature}°C`,
    },
    {
      id: 'manifoldPressure',
      name: 'Intake Plenum Manifold Absolute Pressure (MAP)',
      shortName: 'MAP / BOOST',
      position: [0, 0.88, -0.1],
      color: '#8b5cf6',
      unit: 'inHg',
      getValue: (t) => `${t.manifoldPressure} inHg (${t.turboBoostBar || 0.22} bar boost)`,
    },
    {
      id: 'wastegate',
      name: 'Turbocharger TCU Pneumatic Wastegate Position',
      shortName: 'TCU WASTEGATE',
      position: [0.35, 0.25, -0.15],
      color: '#10b981',
      unit: '%',
      getValue: (t) => `${t.wastegatePosition || 42}%`,
    },
    {
      id: 'vibration',
      name: 'Tri-Axial Crankcase Accelerometer',
      shortName: 'CRANK VIB',
      position: [0, -0.2, 0.75],
      color: '#06b6d4',
      unit: 'g',
      getValue: (t) => `${t.vibration} g`,
    },
  ];

  // Keep latest telemetry in refs for smooth requestAnimationFrame rendering
  const latestTelemetryRef = useRef(telemetry);
  useEffect(() => {
    latestTelemetryRef.current = telemetry;
  }, [telemetry]);

  const latestFaultRef = useRef(activeFault);
  useEffect(() => {
    latestFaultRef.current = activeFault;
  }, [activeFault]);

  // Camera presets handler
  const setCameraPreset = useCallback((preset: 'ISOMETRIC' | 'CUTAWAY' | 'TURBO' | 'CYLINDERS' | 'PROP') => {
    setActiveCameraPreset(preset);
    if (!cameraRef.current) return;

    let targetRadius = 6.2;
    let targetTheta = Math.PI / 3.8;
    let targetPhi = Math.PI / 3.2;
    let targetLook = new THREE.Vector3(0, 0, 0.2);

    switch (preset) {
      case 'ISOMETRIC':
        targetRadius = 6.2;
        targetTheta = Math.PI / 3.6;
        targetPhi = Math.PI / 3.2;
        targetLook.set(0, 0, 0.2);
        break;
      case 'CUTAWAY':
        targetRadius = 3.6;
        targetTheta = Math.PI / 2.0; // Side profile showing moving pistons and conrods
        targetPhi = Math.PI / 2.4;
        targetLook.set(0, 0.1, 0.2);
        break;
      case 'TURBO':
        targetRadius = 3.4;
        targetTheta = -Math.PI / 1.5; // Rear-angle focusing on turbocharger, wastegate, and glowing exhaust
        targetPhi = Math.PI / 2.8;
        targetLook.set(0.1, -0.1, -0.7);
        break;
      case 'CYLINDERS':
        targetRadius = 3.8;
        targetTheta = Math.PI / 4; // High angle showing all 4 green rocker covers & spark plugs
        targetPhi = Math.PI / 4.5;
        targetLook.set(0, 0.2, 0.1);
        break;
      case 'PROP':
        targetRadius = 4.2;
        targetTheta = 0.05; // Head-on view of the propeller and reduction gearbox
        targetPhi = Math.PI / 2.3;
        targetLook.set(0, 0.15, 1.4);
        break;
    }

    sphericalRef.current = { radius: targetRadius, theta: targetTheta, phi: targetPhi };
    targetLookAtRef.current = targetLook;

    const camera = cameraRef.current;
    camera.position.x = targetRadius * Math.sin(targetPhi) * Math.sin(targetTheta);
    camera.position.y = targetRadius * Math.cos(targetPhi);
    camera.position.z = targetRadius * Math.sin(targetPhi) * Math.cos(targetTheta);
    camera.lookAt(targetLook);
  }, []);

  // Three.js Scene Setup & Geometry Construction
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const isLight = theme === 'light';

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x060c16);
    scene.fog = new THREE.FogExp2(isLight ? 0xf1f5f9 : 0x060c16, 0.038);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(3.8, 2.5, 4.5);
    camera.lookAt(0, 0, 0.2);
    cameraRef.current = camera;

    // 3. High-Fidelity Aerospace Lighting
    const ambientLight = new THREE.AmbientLight(isLight ? 0xffffff : 0x93b4d7, isLight ? 1.35 : 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.7 : 1.5);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(isLight ? 0xbae6fd : 0x38bdf8, isLight ? 0.75 : 0.65);
    fillLight.position.set(-7, -2, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(isLight ? 0x0284c7 : 0x38bdf8, 1.4, 20);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 4. Ground Inspection Grid
    const gridHelper = new THREE.GridHelper(16, 32, isLight ? 0x0284c7 : 0x1e3a5f, isLight ? 0xcbd5e1 : 0x0f1d30);
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    // -------------------------------------------------------------
    // BUILD THE AERO PISTON ENGINE (Rotax 914-F Turbocharged Boxer)
    // -------------------------------------------------------------
    const engineRoot = new THREE.Group();
    engineRootRef.current = engineRoot;
    scene.add(engineRoot);

    // Authentic Aerospace Materials
    const crankcaseMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x8fa3b8 : 0x3b4a5d,
      metalness: 0.75,
      roughness: 0.3,
    });

    const cylinderFinMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : 0x2d3a4b,
      metalness: 0.8,
      roughness: 0.28,
    });

    // Signature Rotax Olive/Green Powdercoat Valve Covers
    const rotaxGreenMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // deep racing/olive green
      metalness: 0.35,
      roughness: 0.35,
    });

    const polishedAlloyMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0x94a3b8,
      metalness: 0.9,
      roughness: 0.15,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.96,
      roughness: 0.08,
    });

    const carbonPropMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.3,
      roughness: 0.35,
    });

    const siliconeHoseBlue = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // silicone turbo intake couplers
      metalness: 0.1,
      roughness: 0.6,
    });

    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // turbo turbine housing
      metalness: 0.65,
      roughness: 0.5,
    });

    // A. Central Crankcase Casting & Sump
    const crankcaseGeo = new THREE.BoxGeometry(1.24, 0.92, 1.85);
    const crankcase = new THREE.Mesh(crankcaseGeo, crankcaseMat);
    crankcase.position.set(0, 0, 0.2);
    engineRoot.add(crankcase);

    // Sump Stiffening Ribs
    for (let i = -0.65; i <= 0.65; i += 0.28) {
      const ribGeo = new THREE.BoxGeometry(1.28, 0.96, 0.04);
      const rib = new THREE.Mesh(ribGeo, crankcaseMat);
      rib.position.set(0, 0, 0.2 + i);
      engineRoot.add(rib);
    }

    // Lower Oil Sump Pan with Magnetic Drain Plug
    const sumpGeo = new THREE.CylinderGeometry(0.42, 0.35, 0.45, 18);
    const sump = new THREE.Mesh(sumpGeo, crankcaseMat);
    sump.position.set(0, -0.6, 0.2);
    engineRoot.add(sump);

    const drainPlugGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 6);
    const drainPlug = new THREE.Mesh(drainPlugGeo, brassMat);
    drainPlug.position.set(0, -0.84, 0.2);
    engineRoot.add(drainPlug);

    // B. Four Horizontally-Opposed Finned Cylinders & Moving Pistons
    // Rotax 914-F: Cyl 1 & 3 on Left (-X), Cyl 2 & 4 on Right (+X)
    const cylPositions: { x: number; y: number; z: number; side: number; cylNum: number; name: string }[] = [
      { x: -0.9, y: 0.12, z: 0.6, side: -1, cylNum: 1, name: 'CYL 1' },
      { x: 0.9, y: 0.12, z: 0.4, side: 1, cylNum: 2, name: 'CYL 2' },
      { x: -0.9, y: 0.12, z: -0.2, side: -1, cylNum: 3, name: 'CYL 3' },
      { x: 0.9, y: 0.12, z: -0.4, side: 1, cylNum: 4, name: 'CYL 4' },
    ];

    pistonsRef.current = [];
    conrodsRef.current = [];
    combustionGlowsRef.current = [];
    combustionLightsRef.current = [];
    cylinderBlocksRef.current = [];
    cylinderHeadsRef.current = [];
    valveCoversRef.current = [];

    cylPositions.forEach((pos) => {
      // Cylinder Barrel (with through-studs)
      const cylGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.78, 20);
      cylGeo.rotateZ(Math.PI / 2);
      const cylMesh = new THREE.Mesh(cylGeo, cylinderFinMat);
      cylMesh.position.set(pos.x, pos.y, pos.z);
      engineRoot.add(cylMesh);
      cylinderBlocksRef.current.push(cylMesh);

      // Cooling Fins (7 fine cooling fins per cylinder)
      for (let f = -0.28; f <= 0.28; f += 0.09) {
        const finGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.02, 20);
        finGeo.rotateZ(Math.PI / 2);
        const fin = new THREE.Mesh(finGeo, cylinderFinMat);
        fin.position.set(pos.x + f, pos.y, pos.z);
        engineRoot.add(fin);
      }

      // Cylinder Head (Liquid-cooled jacket)
      const headGeo = new THREE.BoxGeometry(0.28, 0.68, 0.68);
      const headMesh = new THREE.Mesh(headGeo, polishedAlloyMat);
      headMesh.position.set(pos.x + pos.side * 0.46, pos.y, pos.z);
      engineRoot.add(headMesh);
      cylinderHeadsRef.current.push(headMesh);

      // Signature Rotax Green Valve/Rocker Cover
      const coverGeo = new THREE.BoxGeometry(0.12, 0.58, 0.58);
      const coverMesh = new THREE.Mesh(coverGeo, rotaxGreenMat);
      coverMesh.position.set(pos.x + pos.side * 0.62, pos.y, pos.z);
      engineRoot.add(coverMesh);
      valveCoversRef.current.push(coverMesh);

      // Central Chrome Acorn Nut on Valve Cover
      const nutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 6);
      nutGeo.rotateZ(Math.PI / 2);
      const nut = new THREE.Mesh(nutGeo, chromeMat);
      nut.position.set(pos.x + pos.side * 0.69, pos.y, pos.z);
      engineRoot.add(nut);

      // Dual Spark Plugs with High-Tension Leads
      [-0.16, 0.16].forEach((spZ) => {
        const plugGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.24, 8);
        plugGeo.rotateZ(pos.side * (Math.PI / 4));
        const plug = new THREE.Mesh(plugGeo, brassMat);
        plug.position.set(pos.x + pos.side * 0.52, pos.y + 0.32, pos.z + spZ);
        engineRoot.add(plug);

        // Black Rubber Spark Plug Boot
        const bootGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const boot = new THREE.Mesh(bootGeo, carbonPropMat);
        boot.position.set(pos.x + pos.side * 0.58, pos.y + 0.4, pos.z + spZ);
        engineRoot.add(boot);
      });

      // Internal Combustion Chamber Flame Glow (Visible in Cutaway & Thermal modes)
      const glowGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(pos.x + pos.side * 0.32, pos.y, pos.z);
      engineRoot.add(glowMesh);
      combustionGlowsRef.current.push(glowMesh);

      const fireLight = new THREE.PointLight(0xff6600, 0, 1.8);
      fireLight.position.set(pos.x + pos.side * 0.32, pos.y, pos.z);
      engineRoot.add(fireLight);
      combustionLightsRef.current.push(fireLight);

      // Reciprocating Internal Piston with Compression Rings
      const pistonGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.3, 18);
      pistonGeo.rotateZ(Math.PI / 2);
      const pistonMesh = new THREE.Mesh(pistonGeo, chromeMat);
      pistonMesh.position.set(pos.x, pos.y, pos.z);
      engineRoot.add(pistonMesh);
      pistonsRef.current.push(pistonMesh);

      // Connecting Rod
      const conrodGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.56, 8);
      conrodGeo.rotateZ(Math.PI / 2);
      const conrodMesh = new THREE.Mesh(conrodGeo, brassMat);
      conrodMesh.position.set(pos.x - pos.side * 0.2, pos.y, pos.z);
      engineRoot.add(conrodMesh);
      conrodsRef.current.push(conrodMesh);
    });

    // C. Internal Crankshaft (Center Axis)
    const crankGroup = new THREE.Group();
    crankshaftRef.current = crankGroup;
    engineRoot.add(crankGroup);

    const crankShaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 16);
    crankShaftGeo.rotateX(Math.PI / 2);
    const crankMain = new THREE.Mesh(crankShaftGeo, chromeMat);
    crankMain.position.set(0, 0, 0.2);
    crankGroup.add(crankMain);

    // Crankshaft Counterweight Throws
    [-0.4, -0.15, 0.2, 0.55].forEach((cwZ) => {
      const throwGeo = new THREE.BoxGeometry(0.15, 0.45, 0.18);
      const throwMesh = new THREE.Mesh(throwGeo, chromeMat);
      throwMesh.position.set(0, 0.1, cwZ);
      crankGroup.add(throwMesh);
    });

    // D. Front Propeller Reduction Gearbox (PRSU i=2.43)
    const gearboxGeo = new THREE.ConeGeometry(0.46, 0.68, 18);
    gearboxGeo.rotateX(Math.PI / 2);
    const gearbox = new THREE.Mesh(gearboxGeo, crankcaseMat);
    gearbox.position.set(0, 0.15, 1.4);
    engineRoot.add(gearbox);

    const propFlangeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 18);
    propFlangeGeo.rotateX(Math.PI / 2);
    const propFlange = new THREE.Mesh(propFlangeGeo, chromeMat);
    propFlange.position.set(0, 0.15, 1.78);
    engineRoot.add(propFlange);

    // E. 3-Blade Variable-Pitch Composite Propeller
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0.15, 1.88);
    propellerRef.current = propGroup;
    engineRoot.add(propGroup);

    // Propeller Spinner Cone (Polished Alloy)
    const spinnerGeo = new THREE.ConeGeometry(0.24, 0.55, 18);
    spinnerGeo.rotateX(Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, isLight ? polishedAlloyMat : chromeMat);
    spinner.position.set(0, 0, 0.22);
    propGroup.add(spinner);

    // Variable Pitch Propeller Blades
    propBladesRef.current = [];
    for (let b = 0; b < 3; b++) {
      const bladeAngle = (b * Math.PI * 2) / 3;
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = bladeAngle;

      const bladeGeo = new THREE.BoxGeometry(0.19, 1.42, 0.04);
      bladeGeo.translate(0, 0.78, 0);
      const bladeMesh = new THREE.Mesh(bladeGeo, carbonPropMat);
      bladeMesh.rotation.y = 0.35; // baseline pitch twist
      bladePivot.add(bladeMesh);
      propBladesRef.current.push(bladeMesh);

      // Blade Tip High-Visibility Yellow Stripe
      const tipGeo = new THREE.BoxGeometry(0.192, 0.2, 0.042);
      tipGeo.translate(0, 1.4, 0);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      bladePivot.add(tip);

      propGroup.add(bladePivot);
    }

    // F. Garrett T25/T2 Turbocharger with Operating Wastegate Actuator
    const turboGroup = new THREE.Group();
    turboGroup.position.set(0, -0.35, -1.05);
    engineRoot.add(turboGroup);

    // Turbine Casing (Hot side - cast iron dark grey)
    const turbineGeo = new THREE.TorusGeometry(0.25, 0.12, 12, 24);
    const turbineMesh = new THREE.Mesh(turbineGeo, castIronMat);
    turboGroup.add(turbineMesh);

    // Spinning Turbine Rotor
    const turbRotorGeo = new THREE.CylinderGeometry(0.14, 0.02, 0.07, 10);
    turbRotorGeo.rotateX(Math.PI / 2);
    const turbRotor = new THREE.Mesh(turbRotorGeo, chromeMat);
    turbRotor.position.set(0, 0, 0.12);
    turboGroup.add(turbRotor);
    turbineRotorRef.current = turbRotor;

    // Compressor Casing (Cold side - polished aluminum)
    const compGeo = new THREE.CylinderGeometry(0.23, 0.32, 0.24, 18);
    compGeo.rotateX(Math.PI / 2);
    const compMesh = new THREE.Mesh(compGeo, polishedAlloyMat);
    compMesh.position.set(0, 0, -0.26);
    turboGroup.add(compMesh);

    // Spinning Compressor Impeller
    const impellerGeo = new THREE.CylinderGeometry(0.18, 0.03, 0.08, 12);
    impellerGeo.rotateX(Math.PI / 2);
    const impellerMesh = new THREE.Mesh(impellerGeo, chromeMat);
    impellerMesh.position.set(0, 0, -0.38);
    turboGroup.add(impellerMesh);
    turboImpellerRef.current = impellerMesh;

    // Wastegate Pneumatic Canister & Articulating Actuator Rod
    const wastegateCanisterGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.25, 12);
    const wastegateCanister = new THREE.Mesh(wastegateCanisterGeo, brassMat);
    wastegateCanister.position.set(0.38, 0.22, -0.15);
    turboGroup.add(wastegateCanister);

    const wastegateRodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8);
    const wastegateRod = new THREE.Mesh(wastegateRodGeo, chromeMat);
    wastegateRod.position.set(0.38, 0.02, -0.15);
    turboGroup.add(wastegateRod);
    wastegateRodRef.current = wastegateRod;

    // G. Tuned Stainless Steel 4-into-1 Exhaust Header (Cylinders -> Turbo)
    exhaustPipesRef.current = [];
    cylPositions.forEach((pos) => {
      const pipeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(pos.x + pos.side * 0.3, pos.y - 0.2, pos.z),
        new THREE.Vector3(pos.side * 0.42, -0.48, (pos.z - 0.95) / 2),
        new THREE.Vector3(0, -0.25, -1.05),
      ]);
      const pipeGeo = new THREE.TubeGeometry(pipeCurve, 20, 0.058, 8, false);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: 0x78716c,
        metalness: 0.75,
        roughness: 0.35,
      });
      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      engineRoot.add(pipeMesh);
      exhaustPipesRef.current.push(pipeMesh);
    });

    // H. Intake Airbox Plenum & Tuned Intake Runners with Blue Couplers
    const plenumGeo = new THREE.CylinderGeometry(0.19, 0.19, 1.45, 16);
    plenumGeo.rotateZ(Math.PI / 2);
    const plenum = new THREE.Mesh(plenumGeo, polishedAlloyMat);
    plenum.position.set(0, 0.68, 0.1);
    engineRoot.add(plenum);

    // Blue silicone intake couplers on plenum
    [-0.5, 0.5].forEach((cpX) => {
      const cGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.12, 16);
      cGeo.rotateZ(Math.PI / 2);
      const cMesh = new THREE.Mesh(cGeo, siliconeHoseBlue);
      cMesh.position.set(cpX, 0.68, 0.1);
      engineRoot.add(cMesh);
    });

    // Intake Runners to cylinder heads
    cylPositions.forEach((pos) => {
      const runnerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(pos.side * 0.45, 0.68, pos.z),
        new THREE.Vector3(pos.x + pos.side * 0.2, 0.46, pos.z),
        new THREE.Vector3(pos.x + pos.side * 0.4, pos.y + 0.2, pos.z),
      ]);
      const runnerGeo = new THREE.TubeGeometry(runnerCurve, 14, 0.046, 8, false);
      const runnerMesh = new THREE.Mesh(runnerGeo, polishedAlloyMat);
      engineRoot.add(runnerMesh);
    });

    // I. External Dry Sump Oil Tank, Oil Radiator & Intercooler
    const oilTankGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.72, 16);
    const oilTank = new THREE.Mesh(oilTankGeo, polishedAlloyMat);
    oilTank.position.set(-0.85, -0.45, -0.6);
    engineRoot.add(oilTank);

    // Oil lines (Braided stainless hose)
    const oilLineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.85, -0.6, -0.6),
      new THREE.Vector3(-0.5, -0.7, -0.1),
      new THREE.Vector3(0, -0.65, 0.2),
    ]);
    const oilLineGeo = new THREE.TubeGeometry(oilLineCurve, 16, 0.032, 8, false);
    const oilLineMesh = new THREE.Mesh(oilLineGeo, chromeMat);
    engineRoot.add(oilLineMesh);

    // Aluminum finned intercooler
    const intercoolerGeo = new THREE.BoxGeometry(0.72, 0.36, 0.22);
    const intercooler = new THREE.Mesh(intercoolerGeo, cylinderFinMat);
    intercooler.position.set(0, 0.98, -0.6);
    engineRoot.add(intercooler);

    // J. Tubular Chrome-Moly Engine Mount Truss (Dynafocal Ring)
    const mountRingGeo = new THREE.TorusGeometry(0.75, 0.035, 8, 18);
    const mountRingMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const mountRing = new THREE.Mesh(mountRingGeo, mountRingMat);
    mountRing.position.set(0, 0.05, -0.65);
    engineRoot.add(mountRing);

    // 4 Rubber Vibration Damper Mounts (Dynafocal isolators)
    for (let d = 0; d < 4; d++) {
      const angle = (d * Math.PI) / 2 + Math.PI / 4;
      const damperGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10);
      const damper = new THREE.Mesh(damperGeo, carbonPropMat);
      damper.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75 + 0.05, -0.65);
      damper.rotation.z = angle;
      engineRoot.add(damper);
    }

    // -------------------------------------------------------------
    // TAPAS-BH-201 MALE UAV NACELLE CONTEXT (When in NACELLE_MOUNT view)
    // -------------------------------------------------------------
    const nacelleGroup = new THREE.Group();
    nacelleGroupRef.current = nacelleGroup;
    nacelleGroup.visible = false;
    scene.add(nacelleGroup);

    // Nacelle Cowl Shell (Semi-transparent composite aerodynamic fairing)
    const cowlGeo = new THREE.CylinderGeometry(0.95, 1.25, 3.4, 24, 1, true);
    cowlGeo.rotateX(Math.PI / 2);
    const cowlMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0x1e293b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const cowl = new THREE.Mesh(cowlGeo, cowlMat);
    cowl.position.set(0, 0.1, 0.2);
    nacelleGroup.add(cowl);

    // Wing Section Mockup extending from the nacelle
    const wingMockGeo = new THREE.BoxGeometry(4.5, 0.22, 1.4);
    const wingMock = new THREE.Mesh(wingMockGeo, cowlMat);
    wingMock.position.set(2.2, 0.45, 0);
    nacelleGroup.add(wingMock);

    // -------------------------------------------------------------
    // 5. 3D Sensor Markers with Glowing Rings
    // -------------------------------------------------------------
    const sensorSpheres: THREE.Mesh[] = [];
    sensors.forEach((s) => {
      const sGroup = new THREE.Group();
      sGroup.position.set(...s.position);

      const sphereGeo = new THREE.SphereGeometry(0.075, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(s.color),
        emissive: new THREE.Color(s.color),
        emissiveIntensity: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.userData = { sensorId: s.id, sensorName: s.name };
      sGroup.add(sphere);
      sensorSpheres.push(sphere);

      // Outer pulsing ring
      const ringGeo = new THREE.RingGeometry(0.09, 0.12, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(s.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'sensorRing';
      sGroup.add(ring);

      engineRoot.add(sGroup);
    });

    // 6. Raycasting for Sensor Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sensorSpheres);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.sensorId;
        setHoveredSensor(id);
        container.style.cursor = 'pointer';
      } else {
        setHoveredSensor(null);
        container.style.cursor = 'grab';
      }
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(sensorSpheres);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.sensorId;
        if (onSelectSensor) onSelectSensor(id);
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // 7. Mouse Orbit Drag Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const updateCameraFromSpherical = () => {
      const sp = sphericalRef.current;
      sp.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sp.phi));
      sp.radius = Math.max(2.0, Math.min(14.0, sp.radius));

      camera.position.x = sp.radius * Math.sin(sp.phi) * Math.sin(sp.theta);
      camera.position.y = sp.radius * Math.cos(sp.phi);
      camera.position.z = sp.radius * Math.sin(sp.phi) * Math.cos(sp.theta);
      camera.lookAt(targetLookAtRef.current);
    };

    updateCameraFromSpherical();

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      sphericalRef.current.theta -= deltaX * 0.008;
      sphericalRef.current.phi -= deltaY * 0.008;
      updateCameraFromSpherical();

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius += e.deltaY * 0.005;
      updateCameraFromSpherical();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 9. Continuous Animation Loop (Synchronized with 4-Stroke Cycle & Telemetry)
    let animationFrameId: number;
    let crankAngleRad = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const curTel = latestTelemetryRef.current;
      const curFault = latestFaultRef.current;

      // Calculate realistic angular velocity based on live RPM
      const rpm = curTel?.rpm || 5200;
      const omega = (rpm / 60) * Math.PI * 2 * 0.016; // per frame step

      if (!isPausedRef.current) {
        crankAngleRad += omega * 0.45;

        // A. Spin Propeller & Crankshaft
        if (propellerRef.current) {
          propellerRef.current.rotation.z -= omega * (1 / 2.43); // Gearbox ratio
        }
        if (crankshaftRef.current) {
          crankshaftRef.current.rotation.z -= omega;
        }
        if (turboImpellerRef.current) {
          turboImpellerRef.current.rotation.z += omega * 4.5; // Turbo high-speed spin
        }
        if (turbineRotorRef.current) {
          turbineRotorRef.current.rotation.z += omega * 4.5;
        }
      }

      const cycleAngle720 = ((crankAngleRad * (180 / Math.PI)) % 720 + 720) % 720;

      // Dynamic Propeller Blade Pitch Angle from Simulation
      const propPitchDeg = curTel?.propellerPitchDeg || 22;
      const pitchRad = (propPitchDeg * Math.PI) / 180;
      propBladesRef.current.forEach((bMesh) => {
        bMesh.rotation.y = pitchRad;
      });

      // Dynamic Wastegate Actuator Rod Position from Simulation
      if (wastegateRodRef.current) {
        const wgPos = (curTel?.wastegatePosition || 40) / 100;
        wastegateRodRef.current.position.y = 0.02 - wgPos * 0.08;
      }

      // B. Reciprocating Pistons & Conrods (Boxer stroke order 1-4-3-2)
      // 4-Stroke 720° Cycle:
      // Cyl 1: 0° - 180° (Power)
      // Cyl 4: 180° - 360° (Power)
      // Cyl 3: 360° - 540° (Power)
      // Cyl 2: 540° - 720° (Power)
      const firingRanges: [number, number][] = [
        [0, 180], // Cyl 1
        [540, 720], // Cyl 2
        [360, 540], // Cyl 3
        [180, 360], // Cyl 4
      ];

      pistonsRef.current.forEach((pMesh, idx) => {
        const strokeOffset = idx % 2 === 0 ? 0 : Math.PI;
        const disp = Math.sin(crankAngleRad + strokeOffset) * 0.16;
        const side = cylPositions[idx].side;
        pMesh.position.x = cylPositions[idx].x + side * disp;

        if (conrodsRef.current[idx]) {
          conrodsRef.current[idx].position.x = cylPositions[idx].x - side * (0.15 - disp * 0.5);
          conrodsRef.current[idx].rotation.z = Math.PI / 2 + Math.cos(crankAngleRad + strokeOffset) * 0.18;
        }

        // 4-Stroke Combustion Flame Simulation
        const [fStart, fEnd] = firingRanges[idx];
        const isFiringStroke = cycleAngle720 >= fStart && cycleAngle720 <= fEnd;
        const strokeProgress = (cycleAngle720 - fStart) / (fEnd - fStart);

        let flameIntensity = 0;
        if (isFiringStroke) {
          // Peak intensity right after ignition (first 30% of power stroke), decaying afterwards
          flameIntensity = Math.sin(Math.PI * Math.min(1.0, strokeProgress * 1.5));
        }

        // Fault modifications on combustion:
        if (curFault === 'MISFIRE' && idx === 2) {
          // Cylinder 3 misfires: erratic missing combustion
          flameIntensity *= Math.sin(Date.now() * 0.015) > 0.4 ? 0.8 : 0.05;
        } else if (curFault === 'INJECTOR_DEGRADATION' && idx === 1) {
          // Cylinder 2 running lean: fierce prolonged high-temperature flame
          flameIntensity = Math.min(1.0, flameIntensity * 1.4 + 0.15);
        }

        if (combustionGlowsRef.current[idx]) {
          const cMat = combustionGlowsRef.current[idx].material as THREE.MeshBasicMaterial;
          cMat.opacity = flameIntensity * 0.85;
        }
        if (combustionLightsRef.current[idx]) {
          combustionLightsRef.current[idx].intensity = flameIntensity * 1.6;
        }
      });

      // C. Vibration Shake Simulation during Mechanical Faults
      if (engineRootRef.current) {
        if (curFault === 'VIBRATION_ANOMALY' || curFault === 'MISFIRE') {
          const vibAmp = curFault === 'VIBRATION_ANOMALY' ? 0.045 : 0.024;
          engineRootRef.current.position.x = (Math.random() - 0.5) * vibAmp;
          engineRootRef.current.position.y = (Math.random() - 0.5) * vibAmp;
        } else {
          engineRootRef.current.position.set(0, 0, 0);
        }
      }

      // D. Pulse Sensor Rings
      scene.traverse((obj) => {
        if (obj.name === 'sensorRing') {
          const s = 1.0 + Math.sin(Date.now() * 0.006) * 0.15;
          obj.scale.set(s, s, s);
          obj.lookAt(camera.position);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);

      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [theme]);

  // Update Visual Mode Materials Dynamically
  useEffect(() => {
    if (!sceneRef.current) return;

    const isCutaway = visualMode === 'CUTAWAY';
    const isThermal = visualMode === 'THERMAL_IR';
    const isVib = visualMode === 'VIBRATION';

    cylinderBlocksRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isCutaway) {
        mat.transparent = true;
        mat.opacity = 0.32;
        mat.wireframe = false;
      } else if (isThermal) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(0xea580c);
      } else if (isVib) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(0x0284c7);
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.setHex(theme === 'light' ? 0x64748b : 0x2d3a4b);
      }
    });

    // Dynamic Thermal Exhaust glowing color tied to actual EGT
    const egt = telemetry.egt || 720;
    exhaustPipesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isThermal || egt > 780) {
        const heatColor = egt > 820 ? 0xf43f5e : egt > 760 ? 0xe11d48 : 0xd97706;
        mat.color.setHex(heatColor);
        mat.emissive.setHex(heatColor);
        mat.emissiveIntensity = isThermal ? 0.85 : 0.45;
      } else {
        mat.color.setHex(0x78716c);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [visualMode, theme, telemetry.egt]);

  // Update View Scope (Engine Stand vs Nacelle Mount)
  useEffect(() => {
    if (nacelleGroupRef.current) {
      nacelleGroupRef.current.visible = viewScope === 'NACELLE_MOUNT';
    }
  }, [viewScope]);

  // Cylinder temperatures array
  const chts = telemetry.chtCylinders || [
    telemetry.cht - 2,
    telemetry.cht,
    telemetry.cht + 3.5,
    telemetry.cht + 2,
  ];
  const egts = telemetry.egtCylinders || [
    telemetry.egt - 6,
    telemetry.egt,
    telemetry.egt + 8,
    telemetry.egt + 4,
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-[#e5e9f0] relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      {/* 3D Viewport Header: Clean Aerospace Specification */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-[#e5e9f0] bg-[#f8fafc] z-10">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-[#00897b]" />
          <h2 className="text-xs font-bold tracking-wider text-[#1a3a5c] uppercase">
            3D DIGITAL TWIN • 4-STROKE TURBOCHARGED AERO ENGINE
          </h2>
          <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
            REAL-TIME KINEMATICS
          </span>
        </div>

        {/* View Scope Toggle */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setViewScope('ENGINE_STAND')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
              viewScope === 'ENGINE_STAND'
                ? 'bg-[#1a3a5c] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Engine Stand
          </button>
          <button
            onClick={() => setViewScope('NACELLE_MOUNT')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
              viewScope === 'NACELLE_MOUNT'
                ? 'bg-[#1a3a5c] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Airframe Nacelle
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full flex-1 relative cursor-grab">
        {/* Visual Mode Selector Floating Pill */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1 bg-white/95 dark:bg-[#070d18]/92 backdrop-blur-md p-1 rounded border border-slate-300 dark:border-[#1e3250] shadow-md text-[10px] font-chakra font-semibold max-w-[calc(100%-120px)] sm:max-w-none">
          <button
            onClick={() => setVisualMode('CUTAWAY')}
            className={`px-2 py-1 rounded flex items-center space-x-1 ${
              visualMode === 'CUTAWAY'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">CUTAWAY (PISTONS)</span>
            <span className="sm:hidden">CUTAWAY</span>
          </button>
          <button
            onClick={() => setVisualMode('THERMAL_IR')}
            className={`px-2 py-1 rounded flex items-center space-x-1 ${
              visualMode === 'THERMAL_IR'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span className="hidden sm:inline">THERMAL IR</span>
            <span className="sm:hidden">THERMAL</span>
          </button>
          <button
            onClick={() => setVisualMode('VIBRATION')}
            className={`px-2 py-1 rounded flex items-center space-x-1 ${
              visualMode === 'VIBRATION'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">VIBRATION STRAIN</span>
            <span className="sm:hidden">VIB</span>
          </button>
          <button
            onClick={() => setVisualMode('MECHANICAL')}
            className={`px-2 py-1 rounded flex items-center space-x-1 ${
              visualMode === 'MECHANICAL'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">SOLID ALLOY</span>
            <span className="sm:hidden">ALLOY</span>
          </button>
        </div>

        {/* Camera Quick-Angle Presets */}
        <div className="absolute top-11 sm:top-12 left-2.5 z-20 flex flex-wrap gap-1 bg-white/90 dark:bg-[#070d18]/85 backdrop-blur-md p-1 rounded border border-slate-200 dark:border-slate-800 shadow text-[9px] font-chakra">
          <span className="px-1 py-0.5 text-slate-500 font-bold flex items-center gap-0.5">
            <Camera className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">PRESETS:</span>
          </span>
          {(['ISOMETRIC', 'CUTAWAY', 'TURBO', 'CYLINDERS', 'PROP'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setCameraPreset(preset)}
              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                activeCameraPreset === preset
                  ? 'bg-cyan-700 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Real-Time Live Multi-Cylinder Engine Telemetry HUD (Floating & Compact to prevent canvas overlap) */}
        <div className="absolute top-2.5 right-2.5 z-20 bg-white/95 dark:bg-[#070d18]/92 backdrop-blur-md p-2 rounded border border-slate-300 dark:border-[#1e3250] shadow-lg text-xs font-tech space-y-1.5 select-none w-60 max-w-[calc(100vw-36px)]">
          <div className="flex justify-between items-center text-[10px] font-chakra font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-1">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-600" />
              ROTAX 914-F STATUS
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">50Hz HWIL</span>
          </div>

          {/* 4-Cylinder Head Temperatures (CHT 1, 2, 3, 4) */}
          <div>
            <div className="flex justify-between text-[9px] font-chakra text-slate-500 dark:text-slate-400">
              <span>CYLINDER HEAD TEMPS (°C):</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">MAX 175°C</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-0.5">
              {chts.map((temp, idx) => {
                const isOver = temp > 175;
                const isWarn = temp > 160;
                return (
                  <div
                    key={idx}
                    className={`p-0.5 rounded text-center border font-chakra text-[9px] ${
                      isOver
                        ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400 font-bold animate-pulse'
                        : isWarn
                        ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-[7px] text-slate-500 dark:text-slate-400 font-semibold">C{idx + 1}</div>
                    <div className="font-bold">{temp}°</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-Cylinder Exhaust Gas Temperatures (EGT 1, 2, 3, 4) */}
          <div>
            <div className="flex justify-between text-[9px] font-chakra text-slate-500 dark:text-slate-400">
              <span>EXHAUST GAS TEMPS (°C):</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">MAX 850°C</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-0.5">
              {egts.map((temp, idx) => {
                const isOver = temp > 850;
                const isWarn = temp > 800;
                return (
                  <div
                    key={idx}
                    className={`p-0.5 rounded text-center border font-chakra text-[9px] ${
                      isOver
                        ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                        : isWarn
                        ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[7px] text-slate-500">E{idx + 1}</div>
                    <div>{temp}°</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Propulsion Dynamics */}
          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-chakra">RPM:</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-400">{telemetry.rpm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-chakra">BOOST:</span>
              <span className="font-bold text-purple-700 dark:text-purple-400">
                {telemetry.manifoldPressure} inHg (+{telemetry.turboBoostBar || 0.22} bar)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-chakra">PITCH / POWER:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {telemetry.propellerPitchDeg || 22}° // {telemetry.powerHp} HP
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-chakra">OIL P/T:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {telemetry.oilPressure} bar / {telemetry.oilTemperature}°C
              </span>
            </div>
          </div>
        </div>

        {/* Hovered / Clicked Sensor Inspection Popup (Positioned safely above bottom controls) */}
        {hoveredSensor && (
          <div className="absolute bottom-9 left-2.5 z-20 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-md p-2 rounded border border-cyan-500 shadow-xl text-xs font-tech pointer-events-none max-w-xs">
            {(() => {
              const s = sensors.find((x) => x.id === hoveredSensor);
              if (!s) return null;
              return (
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-chakra font-bold text-slate-900 dark:text-white uppercase text-[11px]">{s.shortName}:</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">{s.getValue(telemetry)}</span>
                  </div>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 font-chakra leading-tight">{s.name}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3D Viewport Controls Hint */}
        <div className="absolute bottom-2 left-2.5 z-10 text-[8px] sm:text-[9px] font-tech text-slate-500 dark:text-slate-400 bg-white/85 dark:bg-black/65 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 pointer-events-none uppercase">
          DRAG TO ORBIT • SCROLL TO ZOOM • PRESET ANGLES
        </div>
      </div>
    </div>
  );
};
