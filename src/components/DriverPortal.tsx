import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, ShieldAlert, Zap, AlertOctagon, RotateCcw, 
  CloudLightning, Wifi, Activity, Layers, Globe, MapPin, 
  TrendingUp, Droplets, Flame, Sparkles, Timer, ChevronRight, RefreshCw, Radio
} from 'lucide-react';
import { ColdChainOrder } from '../types';
import GoogleMapsTab from './GoogleMapsTab';

interface DriverPortalProps {
  orders: ColdChainOrder[];
  isHighTempPenalty: boolean;
}

export default function DriverPortal({ orders, isHighTempPenalty }: DriverPortalProps) {
  // --- REAL-TIME ENVIRONMENTAL SENSORS & ACCURATE ROAD OSCILLATORS ---
  const [cargoTemp, setCargoTemp] = useState(13.1);
  const [cargoStress, setCargoStress] = useState(12.0);
  const [humidity, setHumidity] = useState(78.0);
  const [ripeness, setRipeness] = useState(28.0);
  const [trafficCondition, setTrafficCondition] = useState<'Clear' | 'Moderate' | 'Heavy'>('Clear');

  // Streaming environmental packets ticker
  const [logPackets, setLogPackets] = useState<string[]>([
    "✓ System Initialized: GCC TransitNet telemetry broadcast online.",
    "✓ Oman Port Exit Node: Safe container environment lock confirmed.",
    "✓ Hatta Border Crossing: GPS signal locked, dual-band 4G carrier active.",
    "✓ Muscat Agri-Terminal: Cold storage pre-loading inspection passed."
  ]);

  // Wobble effect for real-time continuous realistic oscillations
  useEffect(() => {
    const sensorTimer = setInterval(() => {
      setCargoTemp(prev => {
        const delta = (Math.random() - 0.5) * 0.12;
        let next = prev + delta;
        if (next < 12.4) next = 12.4;
        if (next > 13.6) next = 13.6;
        return parseFloat(next.toFixed(2));
      });

      setCargoStress(prev => {
        const delta = (Math.random() - 0.5) * 0.3;
        let next = prev + delta;
        if (next < 11.2) next = 11.2;
        if (next > 12.8) next = 12.8;
        return parseFloat(next.toFixed(1));
      });

      setHumidity(prev => {
        const delta = (Math.random() - 0.5) * 0.5;
        let next = prev + delta;
        if (next < 76.5) next = 76.5;
        if (next > 79.5) next = 79.5;
        return parseFloat(next.toFixed(1));
      });

      setRipeness(prev => {
        const delta = (Math.random() - 0.5) * 0.4;
        let next = prev + delta;
        if (next < 26.8) next = 26.8;
        if (next > 29.2) next = 29.2;
        return parseFloat(next.toFixed(1));
      });

      setTrafficCondition(prev => {
        const roll = Math.random();
        if (roll < 0.1) return 'Heavy';
        if (roll < 0.3) return 'Moderate';
        return 'Clear';
      });
    }, 2500);

    return () => clearInterval(sensorTimer);
  }, []);

  // Streaming real-time packet logger
  useEffect(() => {
    const logTimer = setInterval(() => {
      const checkpoints = [
        "Hatta Highway Node", "Al Ain Agri-Center", "Sohar Cold Loop", 
        "Barka Logistics Gateway", "Jebel Ali Gate 04", "Muscat Distribution Hub"
      ];
      const selectedNode = checkpoints[Math.floor(Math.random() * checkpoints.length)];
      const randomTemp = (12.5 + Math.random() * 0.8).toFixed(2);
      const randomHum = (77.0 + Math.random() * 2.5).toFixed(1);
      const randomStress = (11.5 + Math.random() * 1.0).toFixed(1);

      const logs = [
        `✓ [${selectedNode}] Telemetry beam matched: Temp at ${randomTemp}°C (Safe).`,
        `✓ [${selectedNode}] Container moisture level calibrated at ${randomHum}%.`,
        `✓ [${selectedNode}] Cargo thermal tension verified at optimal ${randomStress}%.`,
        `✓ [${selectedNode}] Core GPS localized, carrier channel strength excellent.`
      ];

      setLogPackets(prev => {
        const next = [logs[Math.floor(Math.random() * logs.length)], ...prev];
        return next.slice(0, 5); // Keep latest 5 logs
      });
    }, 3500);

    return () => clearInterval(logTimer);
  }, []);

  // --- FUTURISTIC 3D GRAPH PROJECTION HELPER ---
  const origin = { x: 55, y: 195 };
  
  const project3D = (xVal: number, seriesIndex: number, zVal: number) => {
    const px = origin.x + xVal * 54 + seriesIndex * 42;
    const py = origin.y + xVal * -12 + seriesIndex * 15 - zVal * 95;
    return { x: px, y: py };
  };

  // Static/dynamic data streams for the 3D graph
  const trafficValues = [0.2, 0.45, 0.75, 0.35, trafficCondition === 'Clear' ? 0.2 : trafficCondition === 'Moderate' ? 0.5 : 0.85];
  const humidityValues = [0.77, 0.75, 0.80, 0.76, humidity / 100]; // normalized
  const ripenessValues = [0.12, 0.14, 0.15, 0.17, ripeness / 100]; // normalized

  // Time labels for the 3D grid
  const timeLabels = ['09:00', '10:00', '11:00', '12:00', 'Now'];

  // Helper for Circular Progress Ring dashoffset
  const getStrokeDashoffset = (radius: number, value: number) => {
    const circumference = 2 * Math.PI * radius;
    return circumference - (value / 100) * circumference;
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* 1. MAP CANVAS (Takes Full Width) */}
      <div className="w-full">
        <GoogleMapsTab />
      </div>

      {/* 2. CORE DUAL-COLUMNS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: GCC TransitNet Vibrant Environmental Telemetry (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] text-[#2A9D8F] font-bold uppercase tracking-widest font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-pulse" />
                  Live Multiplexed Sensors • GCC TransitNet
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1 font-sans">
                  Environmental Telemetry Dashboard
                </h3>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-200/80 px-3 py-1.5 rounded-full">
                  <Globe className="w-3.5 h-3.5 text-[#2A9D8F]" />
                  GCC TRANSITNET
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Real-time multi-sensory environment readings streamed directly from the reefer truck. Displays highly calibrated thermal stress levels, micro-climate relative humidity, and vegetable ripeness parameters.
            </p>

            {/* THREE HIGH-FIDELITY, GLOWING CIRCULAR PROGRESS DIALS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              
              {/* Dial 1: Cargo Stress (12%) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-rose-50/20 to-rose-50/5 border border-rose-100/50 p-5 flex flex-col items-center text-center shadow-sm hover:shadow transition-all duration-300">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background ring */}
                    <circle cx="48" cy="48" r="40" stroke="#FFEAEB" strokeWidth="6" fill="transparent" />
                    {/* Glowing foreground ring */}
                    <motion.circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="#E63946" 
                      strokeWidth="6" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      animate={{ strokeDashoffset: getStrokeDashoffset(40, cargoStress) }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Digital value label inside circle */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-slate-800 font-mono tracking-tight">{cargoStress}%</span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider font-sans">Stress</span>
                  </div>
                </div>
                
                <span className="text-xs font-extrabold text-slate-800 mt-4 flex items-center gap-1 font-sans">
                  <Flame className="w-3.5 h-3.5 text-[#E63946]" />
                  Thermal Stress
                </span>
                <span className="text-[9px] font-bold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded-full mt-1.5 uppercase border border-rose-100">
                  Stable • Low Risk
                </span>
              </div>

              {/* Dial 2: Relative Humidity (78%) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50/20 to-sky-50/5 border border-sky-100/50 p-5 flex flex-col items-center text-center shadow-sm hover:shadow transition-all duration-300">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background ring */}
                    <circle cx="48" cy="48" r="40" stroke="#E0F2FE" strokeWidth="6" fill="transparent" />
                    {/* Glowing foreground ring */}
                    <motion.circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="#22D3EE" 
                      strokeWidth="6" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      animate={{ strokeDashoffset: getStrokeDashoffset(40, humidity) }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Digital value label inside circle */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-slate-800 font-mono tracking-tight">{humidity}%</span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider font-sans">Moisture</span>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-slate-800 mt-4 flex items-center gap-1 font-sans">
                  <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                  Relative Humidity
                </span>
                <span className="text-[9px] font-bold text-cyan-700 font-mono bg-cyan-50 px-2 py-0.5 rounded-full mt-1.5 uppercase border border-cyan-100">
                  Ideal • Cradled
                </span>
              </div>

              {/* Dial 3: Fruit Ripeness Index (28%) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50/20 to-amber-50/5 border border-amber-100/50 p-5 flex flex-col items-center text-center shadow-sm hover:shadow transition-all duration-300">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background ring */}
                    <circle cx="48" cy="48" r="40" stroke="#FEF3C7" strokeWidth="6" fill="transparent" />
                    {/* Glowing foreground ring */}
                    <motion.circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="#F59E0B" 
                      strokeWidth="6" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      animate={{ strokeDashoffset: getStrokeDashoffset(40, ripeness) }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Digital value label inside circle */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-slate-800 font-mono tracking-tight">{ripeness}%</span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider font-sans">Ripeness</span>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-slate-800 mt-4 flex items-center gap-1 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Ripeness Progress
                </span>
                <span className="text-[9px] font-bold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-full mt-1.5 uppercase border border-amber-100">
                  Monitored • Perfect
                </span>
              </div>

            </div>

            {/* REAL-TIME LEDGER LOG STREAM PANEL */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 font-mono text-[10px] text-emerald-400">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="flex items-center gap-1.5 font-bold uppercase text-slate-400">
                  <Radio className="w-3.5 h-3.5 text-[#2A9D8F] animate-pulse" />
                  GCC TransitNet Node Telemetry Logs
                </span>
                <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">Streaming Live</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                {logPackets.map((log, i) => (
                  <div key={i} className="leading-relaxed flex items-start gap-1.5">
                    <span className="text-slate-600 select-none">{">"}</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
            <span>REEFER CONTAINER CONGESTION RISK FACTOR: OPTIMAL FLOW</span>
            <span>TRANSMITTING FREQUENCY: 868 MHz LORA MESH</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Futuristic 3D Telemetry Monitor (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[8px] font-bold text-[#2A9D8F] bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Real-time Perspective Projection
                </span>
                <h3 className="text-base font-black tracking-tight mt-1 font-sans flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#2A9D8F]" />
                  3D Telemetry Graph
                </h3>
              </div>
              <Timer className="w-4 h-4 text-slate-500 animate-spin" />
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Multi-axial 3D representation showing environmental indicators over time (Traffic, Humidity, and Fruit Ripeness). Projected dynamically in isometric space.
            </p>

            {/* THE ISOMETRIC 3D SVG CANVAS */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800/60 p-2 overflow-hidden flex items-center justify-center">
              
              <svg className="w-full max-w-[420px] h-[240px] select-none overflow-visible" viewBox="0 0 420 240">
                
                {/* 3D BACK WALL GRIDS */}
                {/* Floor outline */}
                <polygon 
                  points={`
                    ${project3D(0, 0, 0).x},${project3D(0, 0, 0).y} 
                    ${project3D(4, 0, 0).x},${project3D(4, 0, 0).y} 
                    ${project3D(4, 2, 0).x},${project3D(4, 2, 0).y} 
                    ${project3D(0, 2, 0).x},${project3D(0, 2, 0).y}
                  `}
                  fill="#020617" 
                  stroke="#1e293b" 
                  strokeWidth="1.5"
                />

                {/* Vertical back grid dividers */}
                {Array.from({ length: 5 }).map((_, x) => (
                  <line
                    key={`v-grid-${x}`}
                    x1={project3D(x, 0, 0).x}
                    y1={project3D(x, 0, 0).y}
                    x2={project3D(x, 0, 1).x}
                    y2={project3D(x, 0, 1).y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Back Wall Horizontal Guideline segments */}
                {[0.25, 0.5, 0.75, 1.0].map((zVal) => (
                  <line
                    key={`h-grid-${zVal}`}
                    x1={project3D(0, 0, zVal).x}
                    y1={project3D(0, 0, zVal).y}
                    x2={project3D(4, 0, zVal).x}
                    y2={project3D(4, 0, zVal).y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Floor grids parallel lines */}
                {Array.from({ length: 5 }).map((_, x) => (
                  <line
                    key={`floor-x-${x}`}
                    x1={project3D(x, 0, 0).x}
                    y1={project3D(x, 0, 0).y}
                    x2={project3D(x, 2, 0).x}
                    y2={project3D(x, 2, 0).y}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                ))}
                {Array.from({ length: 3 }).map((_, y) => (
                  <line
                    key={`floor-y-${y}`}
                    x1={project3D(0, y, 0).x}
                    y1={project3D(0, y, 0).y}
                    x2={project3D(4, y, 0).x}
                    y2={project3D(4, y, 0).y}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                ))}

                {/* --- SERIES 2: HUMIDITY (Teal Ribbon, placed in middle layer y=1) --- */}
                {/* 3D area sheet underneath line */}
                <polygon
                  points={`
                    ${project3D(0, 1, 0).x},${project3D(0, 1, 0).y}
                    ${project3D(0, 1, humidityValues[0]).x},${project3D(0, 1, humidityValues[0]).y}
                    ${project3D(1, 1, humidityValues[1]).x},${project3D(1, 1, humidityValues[1]).y}
                    ${project3D(2, 1, humidityValues[2]).x},${project3D(2, 1, humidityValues[2]).y}
                    ${project3D(3, 1, humidityValues[3]).x},${project3D(3, 1, humidityValues[3]).y}
                    ${project3D(4, 1, humidityValues[4]).x},${project3D(4, 1, humidityValues[4]).y}
                    ${project3D(4, 1, 0).x},${project3D(4, 1, 0).y}
                  `}
                  fill="url(#humidityGrad3D)"
                  opacity="0.3"
                />
                {/* Line string */}
                <path
                  d={`
                    M ${project3D(0, 1, humidityValues[0]).x} ${project3D(0, 1, humidityValues[0]).y}
                    L ${project3D(1, 1, humidityValues[1]).x} ${project3D(1, 1, humidityValues[1]).y}
                    L ${project3D(2, 1, humidityValues[2]).x} ${project3D(2, 1, humidityValues[2]).y}
                    L ${project3D(3, 1, humidityValues[3]).x} ${project3D(3, 1, humidityValues[3]).y}
                    L ${project3D(4, 1, humidityValues[4]).x} ${project3D(4, 1, humidityValues[4]).y}
                  `}
                  fill="none"
                  stroke="#2d3748"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`
                    M ${project3D(0, 1, humidityValues[0]).x} ${project3D(0, 1, humidityValues[0]).y}
                    L ${project3D(1, 1, humidityValues[1]).x} ${project3D(1, 1, humidityValues[1]).y}
                    L ${project3D(2, 1, humidityValues[2]).x} ${project3D(2, 1, humidityValues[2]).y}
                    L ${project3D(3, 1, humidityValues[3]).x} ${project3D(3, 1, humidityValues[3]).y}
                    L ${project3D(4, 1, humidityValues[4]).x} ${project3D(4, 1, humidityValues[4]).y}
                  `}
                  fill="none"
                  stroke="#2A9D8F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* --- SERIES 0: TRAFFIC (Cyan Ribbon, placed in back layer y=0) --- */}
                {/* Area under line */}
                <polygon
                  points={`
                    ${project3D(0, 0, 0).x},${project3D(0, 0, 0).y}
                    ${project3D(0, 0, trafficValues[0]).x},${project3D(0, 0, trafficValues[0]).y}
                    ${project3D(1, 0, trafficValues[1]).x},${project3D(1, 0, trafficValues[1]).y}
                    ${project3D(2, 0, trafficValues[2]).x},${project3D(2, 0, trafficValues[2]).y}
                    ${project3D(3, 0, trafficValues[3]).x},${project3D(3, 0, trafficValues[3]).y}
                    ${project3D(4, 0, trafficValues[4]).x},${project3D(4, 0, trafficValues[4]).y}
                    ${project3D(4, 0, 0).x},${project3D(4, 0, 0).y}
                  `}
                  fill="url(#trafficGrad3D)"
                  opacity="0.3"
                />
                {/* Line string */}
                <path
                  d={`
                    M ${project3D(0, 0, trafficValues[0]).x} ${project3D(0, 0, trafficValues[0]).y}
                    L ${project3D(1, 0, trafficValues[1]).x} ${project3D(1, 0, trafficValues[1]).y}
                    L ${project3D(2, 0, trafficValues[2]).x} ${project3D(2, 0, trafficValues[2]).y}
                    L ${project3D(3, 0, trafficValues[3]).x} ${project3D(3, 0, trafficValues[3]).y}
                    L ${project3D(4, 0, trafficValues[4]).x} ${project3D(4, 0, trafficValues[4]).y}
                  `}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`
                    M ${project3D(0, 0, trafficValues[0]).x} ${project3D(0, 0, trafficValues[0]).y}
                    L ${project3D(1, 0, trafficValues[1]).x} ${project3D(1, 0, trafficValues[1]).y}
                    L ${project3D(2, 0, trafficValues[2]).x} ${project3D(2, 0, trafficValues[2]).y}
                    L ${project3D(3, 0, trafficValues[3]).x} ${project3D(3, 0, trafficValues[3]).y}
                    L ${project3D(4, 0, trafficValues[4]).x} ${project3D(4, 0, trafficValues[4]).y}
                  `}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* --- SERIES 2: RIPENESS (Rose Ribbon, placed in front layer y=2) --- */}
                {/* Area under line */}
                <polygon
                  points={`
                    ${project3D(0, 2, 0).x},${project3D(0, 2, 0).y}
                    ${project3D(0, 2, ripenessValues[0]).x},${project3D(0, 2, ripenessValues[0]).y}
                    ${project3D(1, 2, ripenessValues[1]).x},${project3D(1, 2, ripenessValues[1]).y}
                    ${project3D(2, 2, ripenessValues[2]).x},${project3D(2, 2, ripenessValues[2]).y}
                    ${project3D(3, 2, ripenessValues[3]).x},${project3D(3, 2, ripenessValues[3]).y}
                    ${project3D(4, 2, ripenessValues[4]).x},${project3D(4, 2, ripenessValues[4]).y}
                    ${project3D(4, 2, 0).x},${project3D(4, 2, 0).y}
                  `}
                  fill="url(#ripenessGrad3D)"
                  opacity="0.35"
                />
                {/* Line string */}
                <path
                  d={`
                    M ${project3D(0, 2, ripenessValues[0]).x} ${project3D(0, 2, ripenessValues[0]).y}
                    L ${project3D(1, 2, ripenessValues[1]).x} ${project3D(1, 2, ripenessValues[1]).y}
                    L ${project3D(2, 2, ripenessValues[2]).x} ${project3D(2, 2, ripenessValues[2]).y}
                    L ${project3D(3, 2, ripenessValues[3]).x} ${project3D(3, 2, ripenessValues[3]).y}
                    L ${project3D(4, 2, ripenessValues[4]).x} ${project3D(4, 2, ripenessValues[4]).y}
                  `}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`
                    M ${project3D(0, 2, ripenessValues[0]).x} ${project3D(0, 2, ripenessValues[0]).y}
                    L ${project3D(1, 2, ripenessValues[1]).x} ${project3D(1, 2, ripenessValues[1]).y}
                    L ${project3D(2, 2, ripenessValues[2]).x} ${project3D(2, 2, ripenessValues[2]).y}
                    L ${project3D(3, 2, ripenessValues[3]).x} ${project3D(3, 2, ripenessValues[3]).y}
                    L ${project3D(4, 2, ripenessValues[4]).x} ${project3D(4, 2, ripenessValues[4]).y}
                  `}
                  fill="none"
                  stroke="#E63946"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Dots at "Now" step (time step index 4) */}
                <circle cx={project3D(4, 0, trafficValues[4]).x} cy={project3D(4, 0, trafficValues[4]).y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={project3D(4, 1, humidityValues[4]).x} cy={project3D(4, 1, humidityValues[4]).y} r="4" fill="#2A9D8F" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={project3D(4, 2, ripenessValues[4]).x} cy={project3D(4, 2, ripenessValues[4]).y} r="4" fill="#E63946" stroke="#ffffff" strokeWidth="1.5" />

                {/* Axis Time Label tags along the bottom side */}
                {timeLabels.map((label, x) => {
                  const pt = project3D(x, 2, 0);
                  return (
                    <text
                      key={`label-t-${x}`}
                      x={pt.x + 2}
                      y={pt.y + 16}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                      className="font-mono text-center"
                    >
                      {label}
                    </text>
                  );
                })}

                {/* Series labels inside perspective */}
                <text x={project3D(0, 0, 0).x - 12} y={project3D(0, 0, 0).y - 12} fill="#38bdf8" fontSize="8" fontWeight="black" className="font-sans uppercase tracking-widest opacity-80">
                  TRAFFIC
                </text>
                <text x={project3D(0, 1, 0).x - 14} y={project3D(0, 1, 0).y + 5} fill="#2A9D8F" fontSize="8" fontWeight="black" className="font-sans uppercase tracking-widest opacity-80">
                  HUMIDITY
                </text>
                <text x={project3D(0, 2, 0).x - 14} y={project3D(0, 2, 0).y + 20} fill="#E63946" fontSize="8" fontWeight="black" className="font-sans uppercase tracking-widest opacity-80">
                  RIPENESS
                </text>

                {/* SVG DEFINITION OF GRADIENTS FOR GRAPH SHETS */}
                <defs>
                  <linearGradient id="trafficGrad3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="humidityGrad3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#2A9D8F" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ripenessGrad3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E63946" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#E63946" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

              </svg>
            </div>

          </div>

          {/* COLOR LEGEND BAR */}
          <div className="mt-6 border-t border-slate-800 pt-4 flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px] font-bold text-slate-400">
            <span className="text-slate-500 uppercase tracking-wider text-[9px] font-extrabold mr-1">3D Keys:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
              <span>Traffic Index ({trafficCondition})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F]" />
              <span>Humidity ({humidity}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E63946]" />
              <span>Fruit Ripeness ({ripeness}%)</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
