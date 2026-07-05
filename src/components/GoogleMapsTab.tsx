import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Play, RefreshCw, AlertTriangle, CheckCircle, Flame, 
  MapPin, Settings, ShieldCheck, Map as MapIcon, Sliders, Info, Zap,
  Navigation, Thermometer, Wind, CloudFog, Car, Gauge, Ship, ArrowRight, Star
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteStep {
  instruction: string;
  roadName: string;
  distanceMeters: number;
  durationSeconds: number;
}

// Full logistics network spanning Dubai, UAE, and Oman land networks, widely spread out
const LOGISTICS_NODES = [
  // Dubai Nodes - Area A
  { id: 'dubai_central', name: 'Dubai Central Fresh Market (Dubai)', lat: 25.1632, lng: 55.3852, type: 'dubai', info: 'Primary regional vegetable distributor in Dubai' },
  { id: 'jebel_ali', name: 'Jebel Ali Port Terminal (Dubai)', lat: 25.0112, lng: 55.0617, type: 'dubai', info: 'Gateway to the Middle East & primary dry port' },
  { id: 'hatta_border', name: 'Hatta Inland Border Depot (Dubai)', lat: 24.7963, lng: 56.1210, type: 'dubai', info: 'Dubai mountainous enclave hub near Oman border' },
  { id: 'dubai_south', name: 'Dubai South Cargo Hub (Dubai)', lat: 24.8962, lng: 55.1610, type: 'dubai', info: 'Smart aerospace and cold cargo logistics hub' },

  // UAE Domestic Nodes - Area B
  { id: 'abu_dhabi', name: 'Abu Dhabi Khalifa Port Depot (UAE)', lat: 24.8425, lng: 54.6183, type: 'uae', info: 'Capital logistics deepwater gate' },
  { id: 'al_ain', name: 'Al-Ain Agri-Distribution Center (UAE)', lat: 24.1923, lng: 55.7533, type: 'uae', info: 'Oasis desert storage farm' },
  { id: 'fujairah', name: 'Fujairah Port Cold Storage (UAE)', lat: 25.1215, lng: 56.3610, type: 'uae', info: 'East Coast deepwater harbor' },
  { id: 'ras_al_khaimah', name: 'Ras Al Khaimah Food Gateway (UAE)', lat: 25.7901, lng: 55.9452, type: 'uae', info: 'Northern agricultural gate' },
  { id: 'madinat_zayed', name: 'Madinat Zayed Desert Food Hub (UAE)', lat: 23.6540, lng: 53.7050, type: 'uae', info: 'Western Region desert security storage' },
  { id: 'ruwais', name: 'Ruwais Cargo Logistics Depot (UAE)', lat: 24.1160, lng: 52.7300, type: 'uae', info: 'Far West regional bulk depot' },

  // Oman Land Gateways - Area C
  { id: 'muscat', name: 'Muscat Central Wholesale Market (Oman)', lat: 23.5859, lng: 58.4059, type: 'oman', info: 'Capital cold chain hub of Oman' },
  { id: 'sohar', name: 'Sohar Port Food Logistics Zone (Oman)', lat: 24.4081, lng: 56.6264, type: 'oman', info: 'Major maritime and land gate in Oman' },
  { id: 'salalah', name: 'Salalah Southern Port Depot (Oman)', lat: 17.0151, lng: 54.0924, type: 'oman', info: 'Southern regional distribution hub' },
  { id: 'nizwa', name: 'Nizwa Agricultural Terminal (Oman)', lat: 22.9333, lng: 57.5333, type: 'oman', info: 'Central cultural oasis storage' },
  { id: 'sur', name: 'Sur Coastal Distribution Center (Oman)', lat: 22.5667, lng: 59.5289, type: 'oman', info: 'Eastern coast seafood logistics hub' },
  { id: 'buraimi', name: 'Al Buraimi Border Depot (Oman)', lat: 24.2504, lng: 55.7831, type: 'oman', info: 'Oman border hub adjacent to Al-Ain' }
];

export default function GoogleMapsTab() {
  const [startNodeId, setStartNodeId] = useState('muscat');
  const [endNodeId, setEndNodeId] = useState('dubai_central');

  // Interactive accumulative Noise Hazards simulation
  const [noiseFog, setNoiseFog] = useState(false);
  const [noiseSandstorm, setNoiseSandstorm] = useState(false);
  const [noiseHeatwave, setNoiseHeatwave] = useState(false);
  const [noiseGridlock, setNoiseGridlock] = useState(false);
  
  const [cargoWeightKg, setCargoWeightKg] = useState(6500);

  // Solving/Optimization states
  const [isSolving, setIsSolving] = useState(false);
  const [routeSolved, setRouteSolved] = useState(false);
  const [loadedFromFirestore, setLoadedFromFirestore] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  
  // Computed detailed metrics
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [calculatedDuration, setCalculatedDuration] = useState(0);
  const [fuelBurnLiters, setFuelBurnLiters] = useState(0);
  const [co2EmissionsKg, setCo2EmissionsKg] = useState(0);
  const [safetyRiskScore, setSafetyRiskScore] = useState(100);
  const [isMarineInvolved, setIsMarineInvolved] = useState(false);

  // Turn-by-Turn routing log instructions
  const [itinerarySteps, setItinerarySteps] = useState<RouteStep[]>([]);

  // Leaflet map hooks
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);

  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const marinePathRef = useRef<any>(null);
  const roadPathRef = useRef<any>(null);
  const animationIntervalsRef = useRef<any[]>([]);

  // Load Leaflet Assets from CDN
  useEffect(() => {
    const linkId = 'leaflet-css';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      script.onerror = () => setMapInitError('Could not load Leaflet OpenStreetMap CDN assets.');
      document.head.appendChild(script);
    } else {
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        script.addEventListener('load', () => setLeafletLoaded(true));
      }
    }
  }, []);

  // Initialize Map canvas
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    try {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Initialize centering near UAE/Oman region to display the land network
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([23.5, 56.5], 6);

      mapRef.current = map;

      // Add high contrast CartoDB Voyager Map Tiles (Light Mode Theme)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Trigger initial markers rendering
      updateStartEndMarkers();

    } catch (err: any) {
      console.error('Leaflet init error:', err);
      setMapInitError(err.message || 'Error configuring Leaflet OpenStreetMap wrapper.');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      clearAllDrawingIntervals();
    };
  }, [leafletLoaded]);

  // Reactive markers update on parameter changes (clears old paths, waits for optimization button)
  useEffect(() => {
    if (leafletLoaded && mapRef.current) {
      updateStartEndMarkers();
    }
  }, [startNodeId, endNodeId, noiseFog, noiseSandstorm, noiseHeatwave, noiseGridlock, cargoWeightKg, leafletLoaded]);

  const clearAllDrawingIntervals = () => {
    animationIntervalsRef.current.forEach(interval => clearInterval(interval));
    animationIntervalsRef.current = [];
  };

  // Renders the static start/end and checkpoint markers, fitting the map bounds
  const updateStartEndMarkers = () => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    clearAllDrawingIntervals();

    // Clear existing markers & paths
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (marinePathRef.current) {
      marinePathRef.current.remove();
      marinePathRef.current = null;
    }
    if (roadPathRef.current) {
      roadPathRef.current.remove();
      roadPathRef.current = null;
    }

    const startNode = LOGISTICS_NODES.find(n => n.id === startNodeId);
    const endNode = LOGISTICS_NODES.find(n => n.id === endNodeId);
    if (!startNode || !endNode) return;

    // Render origin pin
    const originColor = '#10B981'; // Green
    const originHtml = `
      <div style="display:flex;align-items:center;justify-content:center;position:relative;width:28px;height:28px;background-color:${originColor};border:2px solid #fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.25)">
        <span style="font-size:12px;color:#fff;font-weight:900">A</span>
      </div>`;
    const originIcon = L.divIcon({ html: originHtml, className: 'custom-pin', iconSize: [28,28], iconAnchor: [14,14] });
    const originMarker = L.marker([startNode.lat, startNode.lng], { icon: originIcon })
      .bindPopup(`<strong class="text-sm text-slate-800">${startNode.name}</strong><br/><span class="text-[11px] text-slate-500">${startNode.info}</span>`)
      .addTo(mapRef.current);
    markersRef.current.push(originMarker);

    // Render destination pin
    const destColor = '#EF4444'; // Red
    const destHtml = `
      <div style="display:flex;align-items:center;justify-content:center;position:relative;width:28px;height:28px;background-color:${destColor};border:2px solid #fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.25)">
        <span style="font-size:12px;color:#fff;font-weight:900">B</span>
      </div>`;
    const destIcon = L.divIcon({ html: destHtml, className: 'custom-pin', iconSize: [28,28], iconAnchor: [14,14] });
    const destMarker = L.marker([endNode.lat, endNode.lng], { icon: destIcon })
      .bindPopup(`<strong class="text-sm text-slate-800">${endNode.name}</strong><br/><span class="text-[11px] text-slate-500">${endNode.info}</span>`)
      .addTo(mapRef.current);
    markersRef.current.push(destMarker);

    // 1. Determine if a Marine Leg is involved (Always false for domestic UAE/Oman land routes)
    const marineInvolved = false;
    setIsMarineInvolved(marineInvolved);

    // Fit map bounds cleanly to show Start and End clearly
    const bounds = L.latLngBounds([[startNode.lat, startNode.lng], [endNode.lat, endNode.lng]]);
    mapRef.current.fitBounds(bounds, {
      padding: [80, 80],
      animate: true,
      duration: 1.0
    });

    // Reset calculated status so they must press 'Optimize & Solve' button
    setRouteSolved(false);
    setLoadedFromFirestore(false);
    setSavedRouteId(null);
  };

  // Utility to interpolate points for beautiful, highly realistic curved sea voyage arcs
  const generateMaritimePath = (startPortId: string, landingPortId: string): Coordinate[] => {
    const startNode = LOGISTICS_NODES.find(n => n.id === startPortId);
    const landingNode = LOGISTICS_NODES.find(n => n.id === landingPortId);
    if (!startNode || !landingNode) return [];

    const controlPoints: Coordinate[] = [startNode];

    // Regional adjustments depending on Chinese departure port
    if (startPortId === 'tianjin' || startPortId === 'dalian') {
      controlPoints.push({ lat: 36.5, lng: 122.8 }); // Yellow Sea Corridor
    }
    if (startPortId === 'tianjin' || startPortId === 'dalian' || startPortId === 'shanghai' || startPortId === 'ningbo') {
      controlPoints.push({ lat: 28.5, lng: 122.5 }); // East China Sea Lane
    }
    if (startPortId === 'xiamen') {
      controlPoints.push({ lat: 23.8, lng: 117.8 }); // Taiwan Strait exit
    }

    // Common Marine Corridor through South China Sea
    controlPoints.push({ lat: 15.0, lng: 113.2 }); // Central South China Sea
    controlPoints.push({ lat: 8.5, lng: 109.5 });  // Southeast of Vietnam
    controlPoints.push({ lat: 2.2, lng: 105.0 });  // South China Sea Southwest exit

    // Strait of Malacca
    controlPoints.push({ lat: 1.25, lng: 104.15 }); // Singapore Turn
    controlPoints.push({ lat: 2.5, lng: 101.8 });   // Mid Malacca Strait
    controlPoints.push({ lat: 5.6, lng: 96.2 });    // Northern exit near Banda Aceh

    // Crossing Bay of Bengal & South of Sri Lanka (stays off-land)
    controlPoints.push({ lat: 5.2, lng: 88.5 });
    controlPoints.push({ lat: 5.0, lng: 80.5 });    // Crucial Sri Lanka bypass
    controlPoints.push({ lat: 9.0, lng: 74.0 });    // Laccadive Sea (stays safe from India shoreline)

    // Crossing Central Arabian Sea
    controlPoints.push({ lat: 15.0, lng: 66.0 });
    controlPoints.push({ lat: 21.0, lng: 60.5 });   // Gulf of Oman approach

    // Gulf of Oman Entrance
    if (landingPortId === 'fujairah') {
      controlPoints.push({ lat: 25.1215, lng: 56.3610 }); // Direct into Fujairah Port
    } else {
      controlPoints.push({ lat: 24.5, lng: 59.0 });
      controlPoints.push({ lat: 26.35, lng: 56.45 }); // Clear curve through Strait of Hormuz
      controlPoints.push({ lat: 25.0112, lng: 55.0617 }); // Dock at Jebel Ali Port
    }

    const path: Coordinate[] = [];
    // Cubic Bézier curve approximation for smooth water paths
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const p1 = controlPoints[i];
      const p2 = controlPoints[i + 1];

      // Interpolate with 15 segments for organic water curves
      const segments = 15;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const lat = p1.lat + (p2.lat - p1.lat) * t;
        const lng = p1.lng + (p2.lng - p1.lng) * t;

        // Prevent duplicate adjacent coordinates
        if (path.length === 0 || path[path.length - 1].lat !== lat || path[path.length - 1].lng !== lng) {
          path.push({ lat, lng });
        }
      }
    }
    return path;
  };

  // Helper Euclidean distance calculator
  const getDistance = (c1: Coordinate, c2: Coordinate) => {
    const dy = c1.lat - c2.lat;
    const dx = c1.lng - c2.lng;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Core Router Solver algorithm: calculates on demand and animates drawing path
  const handleSolveOptimalRoute = async () => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const startNode = LOGISTICS_NODES.find(n => n.id === startNodeId);
    const endNode = LOGISTICS_NODES.find(n => n.id === endNodeId);
    if (!startNode || !endNode) return;

    if (startNodeId === endNodeId) {
      alert('Origin and Destination points must be distinct!');
      return;
    }

    setIsSolving(true);
    clearAllDrawingIntervals();

    // Clear any previous route paths and markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Re-render the base static markers
    const originColor = '#10B981'; // Green
    const originHtml = `
      <div style="display:flex;align-items:center;justify-content:center;position:relative;width:28px;height:28px;background-color:${originColor};border:2px solid #fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.25)">
        <span style="font-size:12px;color:#fff;font-weight:900">A</span>
      </div>`;
    const originIcon = L.divIcon({ html: originHtml, className: 'custom-pin', iconSize: [28,28], iconAnchor: [14,14] });
    const originMarker = L.marker([startNode.lat, startNode.lng], { icon: originIcon })
      .bindPopup(`<strong class="text-sm text-slate-800">${startNode.name}</strong><br/><span class="text-[11px] text-slate-500">${startNode.info}</span>`)
      .addTo(mapRef.current);
    markersRef.current.push(originMarker);

    const destColor = '#EF4444'; // Red
    const destHtml = `
      <div style="display:flex;align-items:center;justify-content:center;position:relative;width:28px;height:28px;background-color:${destColor};border:2px solid #fff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.25)">
        <span style="font-size:12px;color:#fff;font-weight:900">B</span>
      </div>`;
    const destIcon = L.divIcon({ html: destHtml, className: 'custom-pin', iconSize: [28,28], iconAnchor: [14,14] });
    const destMarker = L.marker([endNode.lat, endNode.lng], { icon: destIcon })
      .bindPopup(`<strong class="text-sm text-slate-800">${endNode.name}</strong><br/><span class="text-[11px] text-slate-500">${endNode.info}</span>`)
      .addTo(mapRef.current);
    markersRef.current.push(destMarker);

    if (marinePathRef.current) {
      marinePathRef.current.remove();
      marinePathRef.current = null;
    }
    if (roadPathRef.current) {
      roadPathRef.current.remove();
      roadPathRef.current = null;
    }

    try {
      const marineInvolved = false;
      let marineCoords: Coordinate[] = [];
      let roadCoords: Coordinate[] = [];
      let finalSteps: RouteStep[] = [];
      
      let baseDistanceKm = 0;
      let baseDurationMins = 0;

      let startRoadNode: any = startNode;

      // 2. RETRIEVE HIGHWAY DRIVING CORRIDOR VIA REAL OSRM API
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startRoadNode.lng},${startRoadNode.lat};${endNode.lng},${endNode.lat}?overview=full&geometries=geojson&steps=true`;

      try {
        const res = await fetch(osrmUrl);
        if (!res.ok) throw new Error('OSRM API non-200');

        const osrmData = await res.json();
        if (osrmData.routes && osrmData.routes[0]) {
          const route = osrmData.routes[0];
          roadCoords = route.geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));

          baseDistanceKm += (route.distance / 1000);
          baseDurationMins += (route.duration / 60);

          if (route.legs && route.legs[0] && route.legs[0].steps) {
            finalSteps.push({
              instruction: `🚚 Dispatch Cold-Chain Container Carrier from ${startRoadNode.name.split(' (')[0]} to ${endNode.name.split(' (')[0]} via direct land transit.`,
              roadName: 'GCC Regional Highway',
              distanceMeters: route.distance,
              durationSeconds: route.duration
            });

            route.legs[0].steps.forEach((step: any) => {
              if (step.maneuver && step.maneuver.instruction && step.distance > 50) {
                let cleanInstruction = step.maneuver.instruction;
                if (step.name) {
                  cleanInstruction += ` onto ${step.name}`;
                }
                finalSteps.push({
                  instruction: cleanInstruction,
                  roadName: step.name || 'Regional Highway Link',
                  distanceMeters: step.distance,
                  durationSeconds: step.duration
                });
              }
            });
          }
        } else {
          throw new Error('No OSRM routes parsed');
        }
      } catch (err) {
        console.warn('OSRM API failed. Reverting to geometric highway calculations.', err);
        roadCoords = [startRoadNode, endNode];
        const dist = getDistance(startRoadNode, endNode) * 111.3;
        baseDistanceKm += dist;
        baseDurationMins += (dist / 80) * 60;

        finalSteps.push({
          instruction: `🚚 Dispatch Carrier directly from ${startRoadNode.name.split(' (')[0]} Hub via Express Highways.`,
          roadName: 'GCC Express Highway Link',
          distanceMeters: dist * 1000,
          durationSeconds: (dist / 80) * 3600
        });
      }

      // Simulate a brief computational delay to make the optimization feel authentic & satisfying
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. APPLY COMBINATORIAL MULTIPLE NOISE HAZARDS SIMULTANEOUSLY (THE NOISE OF THE NOISE)
      let cumulativeTimeMult = 1.0;
      let cumulativeFuelMult = 1.0;
      let safetyHazardPoints = 0;

      // Accumulate penalties if modes are toggled
      if (noiseFog) {
        cumulativeTimeMult += 0.35;
        cumulativeFuelMult += 0.10;
        safetyHazardPoints += 25;
      }
      if (noiseSandstorm) {
        cumulativeTimeMult += 0.55;
        cumulativeFuelMult += 0.15;
        safetyHazardPoints += 35;
      }
      if (noiseHeatwave) {
        cumulativeTimeMult += 0.10;
        cumulativeFuelMult += 0.20; // Massive load on reefer cooling units increases fuel burn
        safetyHazardPoints += 15;
      }
      if (noiseGridlock) {
        cumulativeTimeMult += 0.95; // Almost doubles commute time on highways
        cumulativeFuelMult += 0.40; // Idle engine power waste
        safetyHazardPoints += 10;
      }

      // Base truck fuel consumption per 100km (e.g. 14L/100km + load scaling)
      const baseFuelRate = 14 + (cargoWeightKg / 1000) * 0.8;
      const calculatedDistanceTotal = parseFloat(baseDistanceKm.toFixed(1));

      // Calculate total duration
      const adjustedDurationMins = Math.round(baseDurationMins * cumulativeTimeMult);

      const totalFuelTotal = parseFloat(((calculatedDistanceTotal * (baseFuelRate / 100)) * cumulativeFuelMult).toFixed(1));
      const calculatedCO2 = parseFloat((totalFuelTotal * 2.68).toFixed(1));

      // Safety scale
      const cargoWeightPenalty = Math.max(0, (cargoWeightKg - 3000) / 1000) * 1.5;
      const finalSafetyScore = Math.max(15, Math.round(100 - safetyHazardPoints - cargoWeightPenalty));

      // 4. CREATE FIRESTORE COLLECTION DOCUMENT BEFOREHAND (Required by user)
      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const routeDocData = {
        id: routeId,
        startNodeId,
        endNodeId,
        startNodeName: startNode.name,
        endNodeName: endNode.name,
        distanceKm: calculatedDistanceTotal,
        durationMins: adjustedDurationMins,
        fuelLiters: totalFuelTotal,
        co2Kg: calculatedCO2,
        safetyScore: finalSafetyScore,
        noiseFog,
        noiseSandstorm,
        noiseHeatwave,
        noiseGridlock,
        cargoWeightKg,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'anonymous'
      };

      try {
        const routeDocRef = doc(collection(db, 'routes'), routeId);
        // Create/save the document/collection beforehand
        await setDoc(routeDocRef, routeDocData);
        console.log('Successfully created route optimization in Firestore:', routeId);

        // 4b. LOAD DATA BACK FROM FIRESTORE TO DISPLAY ON THE WEB UI FROM FIRESTORE (Required by user)
        const savedDocSnap = await getDoc(routeDocRef);
        if (savedDocSnap.exists()) {
          const savedData = savedDocSnap.data();
          
          // Display the data on the web UI from the Firestore
          setCalculatedDistance(savedData.distanceKm);
          setCalculatedDuration(savedData.durationMins);
          setFuelBurnLiters(savedData.fuelLiters);
          setCo2EmissionsKg(savedData.co2Kg);
          setSafetyRiskScore(savedData.safetyScore);
          setSavedRouteId(savedData.id);
          setLoadedFromFirestore(true);
        } else {
          throw new Error("Route optimization document was not found after creation.");
        }
      } catch (fErr) {
        console.error('Error with Firestore-backed routing:', fErr);
        handleFirestoreError(fErr, OperationType.CREATE, `routes/${routeId}`);
        
        // Dynamic fallback to local variables if Firestore fails/offline
        setCalculatedDistance(calculatedDistanceTotal);
        setCalculatedDuration(adjustedDurationMins);
        setFuelBurnLiters(totalFuelTotal);
        setCo2EmissionsKg(calculatedCO2);
        setSafetyRiskScore(finalSafetyScore);
        setLoadedFromFirestore(false);
        setSavedRouteId(null);
      }

      // Always set itinerary steps (itinerary steps are local as we do not write them to Firestore to keep strict schema constraint)
      setItinerarySteps(finalSteps);

      // 5. ANIMATE PHYSICAL DRAWING OF PATHS ON MAP (Point-by-point drawing with 🚢/🚚)
      const fullPoints = [...marineCoords, ...roadCoords];
      animateCombinedPath(fullPoints, marineCoords.length, startNode, endNode);

      setRouteSolved(true);

    } catch (err) {
      console.error('Error solving optimization routing:', err);
    } finally {
      setIsSolving(false);
    }
  };

  // Progressive combined polyline drawer with live tracking vehicle marker
  const animateCombinedPath = (
    fullPoints: Coordinate[], 
    marineLength: number, 
    startNode: any, 
    endNode: any
  ) => {
    const L = (window as any).L;
    if (!L || !mapRef.current || fullPoints.length === 0) return;

    clearAllDrawingIntervals();

    const marinePoints = fullPoints.slice(0, marineLength);
    const roadPoints = fullPoints.slice(marineLength);

    // Create marine leg polyline
    const marineLine = L.polyline([], {
      color: '#0ea5e9', // Deep Sky Blue
      weight: 5.0,
      opacity: 0.85,
      dashArray: '6, 8',
      lineJoin: 'round'
    }).addTo(mapRef.current);
    marinePathRef.current = marineLine;

    // Create road leg polyline
    const roadLine = L.polyline([], {
      color: '#f43f5e', // Vibrant coral red
      weight: 6.0,
      opacity: 0.95,
      lineJoin: 'round'
    }).addTo(mapRef.current);
    roadPathRef.current = roadLine;

    // Create custom styled vessel and carrier vehicle icons
    const shipHtml = `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background-color:#0284c7;border:2px solid #fff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:18px;">
        🚢
      </div>`;
    const truckHtml = `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background-color:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.3);font-size:18px;">
        🚚
      </div>`;

    const initialIcon = marineLength > 0 ? shipHtml : truckHtml;
    const vehicleIcon = L.divIcon({
      html: initialIcon,
      className: 'vehicle-tracker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const startPt = fullPoints[0];
    const vehicleMarker = L.marker([startPt.lat, startPt.lng], { icon: vehicleIcon }).addTo(mapRef.current);
    markersRef.current.push(vehicleMarker);

    let currentIdx = 0;
    const totalPoints = fullPoints.length;
    // Step size to make the journey finish beautifully in about 75 ticks (3-4 seconds total)
    const stepSize = Math.max(1, Math.ceil(totalPoints / 75));

    const interval = setInterval(() => {
      currentIdx += stepSize;
      if (currentIdx >= totalPoints) {
        currentIdx = totalPoints - 1;
        clearInterval(interval);
      }

      const activePt = fullPoints[currentIdx];
      vehicleMarker.setLatLng([activePt.lat, activePt.lng]);

      // Update polylines dynamically
      if (currentIdx < marineLength) {
        const marineSegment = fullPoints.slice(0, currentIdx + 1);
        marineLine.setLatLngs(marineSegment.map(p => [p.lat, p.lng]));
        vehicleMarker.setIcon(L.divIcon({
          html: shipHtml,
          className: 'vehicle-tracker',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        }));
      } else {
        if (marineLength > 0) {
          marineLine.setLatLngs(marinePoints.map(p => [p.lat, p.lng]));
        }
        const roadSegment = fullPoints.slice(marineLength, currentIdx + 1);
        roadLine.setLatLngs(roadSegment.map(p => [p.lat, p.lng]));
        vehicleMarker.setIcon(L.divIcon({
          html: truckHtml,
          className: 'vehicle-tracker',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        }));
      }

      // Live tracking viewport panning auto-follows the moving carrier
      const bounds = mapRef.current.getBounds();
      const paddedBounds = bounds.pad(-0.1); // pan before vehicle hits edge
      if (!paddedBounds.contains([activePt.lat, activePt.lng])) {
        mapRef.current.panTo([activePt.lat, activePt.lng], { animate: true, duration: 0.15 });
      }

      if (currentIdx === totalPoints - 1) {
        clearInterval(interval);
        vehicleMarker.bindPopup(`
          <div class="p-1">
            <strong class="text-xs text-slate-800">Destination Reached!</strong>
            <p class="text-[10px] text-slate-500 mt-1">Cargo delivered successfully to ${endNode.name.split(' (')[0]}.</p>
          </div>
        `).openPopup();
      }
    }, 50);

    animationIntervalsRef.current.push(interval);
  };

  const toggleAllNoiseModes = () => {
    // If all are already on, turn all off. Otherwise, turn all on!
    const allActive = noiseFog && noiseSandstorm && noiseHeatwave && noiseGridlock;
    setNoiseFog(!allActive);
    setNoiseSandstorm(!allActive);
    setNoiseHeatwave(!allActive);
    setNoiseGridlock(!allActive);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 flex flex-col gap-6 text-slate-800">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider bg-sky-50 text-sky-600 border border-sky-200 font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <Ship className="w-3 h-3" /> OSRM Engine Active
            </span>
            <span className="text-[10px] font-mono tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <Navigation className="w-3 h-3" /> Turn-by-Turn GPS Loaded
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <MapIcon className="w-5.5 h-5.5 text-emerald-500" /> High-Contrast Interactive Route Solver
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Toggle multiple climate and traffic hazard noise factors simultaneously to solve, simulate, and visually trace the optimal safe passage route on the map.
          </p>
        </div>
      </div>

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column control dock (3 columns) - BRIGHT THEME */}
        <div className="lg:col-span-3 flex flex-col gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Sliders className="w-4 h-4 text-emerald-500" /> Solver Config</span>
            <span className="text-[10px] font-mono text-slate-400">Custom routing</span>
          </div>

          {/* Point A Origin Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Origin Point A:
            </label>
            <select
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-3 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <optgroup label="🇦🇪 Dubai Logistics Hubs">
                {LOGISTICS_NODES.filter(n => n.type === 'dubai').map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
              <optgroup label="🇦🇪 Domestic UAE Distribution Centers">
                {LOGISTICS_NODES.filter(n => n.type === 'uae').map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
              <optgroup label="🇴🇲 Oman Land Gateways">
                {LOGISTICS_NODES.filter(n => n.type === 'oman').map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Point B Destination Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Destination Point B:
            </label>
            <select
              value={endNodeId}
              onChange={(e) => setEndNodeId(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-3 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <optgroup label="🇴🇲 Oman Land Gateways">
                {LOGISTICS_NODES.filter(n => n.type === 'oman').map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
              <optgroup label="🇦🇪 Dubai Logistics Hubs">
                {LOGISTICS_NODES.filter(n => n.type === 'dubai').map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
              <optgroup label="🇦🇪 Domestic UAE Distribution Centers">
                {LOGISTICS_NODES.filter(n => n.type === 'uae').map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Vehicle cargo load weight slider */}
          <div className="flex flex-col gap-1.5 border-t border-slate-200/60 pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Vehicle Cargo Load Weight:</span>
              <span className="font-mono text-emerald-600 font-extrabold">{cargoWeightKg.toLocaleString()} kg</span>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={cargoWeightKg}
              onChange={(e) => setCargoWeightKg(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>1,000 kg</span>
              <span>8,000 kg</span>
              <span>15,000 kg</span>
            </div>
          </div>

          {/* Extreme Environmental & Weather Noise Hazards (Accumulative, Checkbox-style Multi-selection) */}
          <div className="flex flex-col gap-2.5 border-t border-slate-200/60 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Gauge className="w-4 h-4 text-emerald-500" /> Active Noise Hazards (Combinatorial):
              </label>
              <button
                onClick={toggleAllNoiseModes}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                {noiseFog && noiseSandstorm && noiseHeatwave && noiseGridlock ? 'Clear All' : 'Select All (4)'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNoiseFog(prev => !prev)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  noiseFog 
                    ? 'bg-sky-50 border-sky-300 text-sky-700 font-bold shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <CloudFog className={`w-4 h-4 mb-1 ${noiseFog ? 'text-sky-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold">Monsoon Fog</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Time +35%</span>
              </button>

              <button
                type="button"
                onClick={() => setNoiseSandstorm(prev => !prev)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  noiseSandstorm 
                    ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Wind className={`w-4 h-4 mb-1 ${noiseSandstorm ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold">Desert Sandstorm</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Time +55%</span>
              </button>

              <button
                type="button"
                onClick={() => setNoiseHeatwave(prev => !prev)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  noiseHeatwave 
                    ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Flame className={`w-4 h-4 mb-1 ${noiseHeatwave ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold">Extreme Heatwave</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Fuel +20%</span>
              </button>

              <button
                type="button"
                onClick={() => setNoiseGridlock(prev => !prev)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  noiseGridlock 
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Car className={`w-4 h-4 mb-1 ${noiseGridlock ? 'text-rose-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold">Highway Gridlock</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Time +95%</span>
              </button>
            </div>
          </div>

          {/* Prominent Optimization Trigger Button */}
          <button
            onClick={handleSolveOptimalRoute}
            disabled={isSolving}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isSolving 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-95 hover:shadow-lg active:scale-98'
            }`}
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Solving Logistics Sequence...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Run Route Optimization
              </>
            )}
          </button>

        </div>

        {/* Right maps workspace panel (9 columns) - BRIGHT THEME */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Metrics summary widgets - Bright layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Distance</span>
              <div className="text-base font-extrabold text-slate-800 mt-1 font-mono">
                {routeSolved ? (
                  <>
                    {calculatedDistance.toLocaleString()} <span className="text-xs font-semibold text-slate-500">km</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Pending...</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Est. Transit Duration</span>
              <div className="text-base font-extrabold text-slate-800 mt-1 font-mono">
                {routeSolved ? (
                  calculatedDuration >= 1440 ? (
                    <>
                      {Math.floor(calculatedDuration / 1440)}d {Math.round((calculatedDuration % 1440) / 60)}h
                    </>
                  ) : (
                    <>
                      {Math.floor(calculatedDuration / 60)}h {calculatedDuration % 60}m
                    </>
                  )
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Pending...</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Fuel Consumption</span>
              <div className="text-base font-extrabold text-emerald-600 mt-1 font-mono">
                {routeSolved ? (
                  <>
                    {fuelBurnLiters.toLocaleString()} <span className="text-xs font-semibold text-slate-500">L</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Pending...</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Safety Index</span>
              <div className={`text-base font-extrabold mt-1 font-mono ${
                !routeSolved 
                  ? 'text-slate-400' 
                  : safetyRiskScore > 75 
                    ? 'text-emerald-600' 
                    : safetyRiskScore > 50 
                      ? 'text-amber-600' 
                      : 'text-rose-600'
              }`}>
                {routeSolved ? `${safetyRiskScore}%` : <span className="text-xs text-slate-400 font-medium">Pending...</span>}
              </div>
            </div>
          </div>

          {/* Firestore Database Sync Status Banner */}
          {loadedFromFirestore && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] px-4 py-2.5 rounded-xl font-medium flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                <span>
                  <strong>Database Verified:</strong> Route optimization created and loaded live from Firestore collection <code>routes</code>
                </span>
              </div>
              <span className="font-mono text-[9px] bg-emerald-100/80 px-2 py-0.5 rounded text-emerald-700 font-bold uppercase tracking-wider shrink-0 hidden sm:inline">
                ID: {savedRouteId}
              </span>
            </div>
          )}

          {/* Leaflet Map Drawing Panel */}
          <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden h-[450px] shadow-sm">
            {mapInitError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                <AlertTriangle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
                <h3 className="text-sm font-bold uppercase mb-2 text-rose-600">Map Rendering Issue</h3>
                <p className="text-xs text-slate-500 max-w-sm">{mapInitError}</p>
              </div>
            ) : !leafletLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-50">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Compiling OpenStreetMap Engine...</p>
              </div>
            ) : (
              // HTML Canvas for Leaflet
              <div ref={containerRef} className="w-full h-full z-10" />
            )}

            {/* Float Overlay Legend - Light Theme with Glassmorphism */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 border border-slate-200 p-4 rounded-xl shadow-lg flex flex-col gap-2 text-[9px] font-bold text-slate-600 backdrop-blur-sm max-w-[220px]">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500" /> Route Diagnostics
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-5 h-1 bg-rose-500 rounded-full" />
                <span>Domestic Land Network Lane</span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                <span>Origin Point A</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 border border-white" />
                <span>Destination Point B</span>
              </div>
            </div>

            {/* If not solved yet, display a subtle helper badge inviting them to optimize */}
            {!routeSolved && !isSolving && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-emerald-500 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                <Zap className="w-3.5 h-3.5" /> Please click "Run Route Optimization" to trace path & metrics
              </div>
            )}
          </div>

          {/* Turn-by-Turn GPS Highway/Ocean Log Itinerary - Light Theme */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3 max-h-[220px] overflow-y-auto shadow-xs">
            <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-200 pb-2 shrink-0">
              <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-emerald-500" /> Dynamic Itinerary Steps ({routeSolved ? itinerarySteps.length : 0})</span>
              <span className="text-[9px] font-mono text-slate-400">Solved via real-time OSRM engine</span>
            </div>
            
            <div className="flex flex-col gap-2 pr-1">
              <AnimatePresence mode="popLayout">
                {!routeSolved ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Click "Run Route Optimization" to generate turn-by-turn navigation instructions.
                  </div>
                ) : itinerarySteps.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2">Computing GPS routing instructions...</p>
                ) : (
                  itinerarySteps.map((step, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.8) }}
                      key={index}
                      className="bg-white border border-slate-200/80 p-2.5 rounded-lg flex items-start gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 shrink-0 text-slate-500 font-bold text-[9px] font-mono w-6 text-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{step.instruction}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400 font-mono">
                          {step.roadName && (
                            <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-emerald-600 font-bold">
                              🛣️ {step.roadName}
                            </span>
                          )}
                          {step.distanceMeters > 0 && (
                            <span>{(step.distanceMeters / 1000).toFixed(2)} km</span>
                          )}
                          {step.durationSeconds > 0 && (
                            <span>{Math.round(step.durationSeconds / 60)} mins</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
