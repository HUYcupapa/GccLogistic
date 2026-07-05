import { LOGISTICS_NODES, DIJKSTRA_EDGES } from './data';
import { RouteNode } from './types';

// Dijkstra calculation
export interface DijkstraResult {
  path: RouteNode[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

export function calculateDijkstra(
  startNodeId: string,
  endNodeId: string,
  isHighTempPenalty: boolean
): DijkstraResult {
  const nodes = LOGISTICS_NODES;
  const edges = DIJKSTRA_EDGES;

  // Initial distances and predecessors
  const distances: Record<string, number> = {};
  const durations: Record<string, number> = {};
  const predecessors: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const node of nodes) {
    distances[node.id] = Infinity;
    durations[node.id] = Infinity;
    predecessors[node.id] = null;
    unvisited.add(node.id);
  }

  distances[startNodeId] = 0;
  durations[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find node in unvisited with smallest distance
    let currentNodeId: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNodeId = nodeId;
      }
    }

    if (currentNodeId === null || currentNodeId === endNodeId) {
      break; // End node reached or unreachable
    }

    unvisited.delete(currentNodeId);

    // Get outgoing edges
    const relevantEdges = edges.filter(
      e => e.from === currentNodeId || e.to === currentNodeId
    );

    for (const edge of relevantEdges) {
      const neighborId = edge.from === currentNodeId ? edge.to : edge.from;
      if (!unvisited.has(neighborId)) continue;

      const edgeDistance = edge.distanceKm;
      // Calculate duration considering hot climate conditions
      const penalty = isHighTempPenalty ? edge.highTempImpactMinutes : 0;
      const edgeDuration = edge.baseDurationMinutes + penalty;

      const tentativeDistance = distances[currentNodeId] + edgeDistance;
      const tentativeDuration = durations[currentNodeId] + edgeDuration;

      // We optimize for duration primarily in real-time transit
      if (tentativeDuration < durations[neighborId]) {
        distances[neighborId] = tentativeDistance;
        durations[neighborId] = tentativeDuration;
        predecessors[neighborId] = currentNodeId;
      }
    }
  }

  // Reconstruct path
  const pathNodes: RouteNode[] = [];
  let stepId: string | null = endNodeId;

  while (stepId !== null) {
    const node = nodes.find(n => n.id === stepId);
    if (node) {
      pathNodes.unshift(node);
    }
    stepId = predecessors[stepId];
  }

  // Handle case when no path exists
  if (pathNodes.length === 0 || pathNodes[0].id !== startNodeId) {
    return {
      path: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0
    };
  }

  return {
    path: pathNodes,
    totalDistanceKm: distances[endNodeId],
    totalDurationMinutes: durations[endNodeId]
  };
}

/**
 * Random Forest simulated product freshness decay calculator.
 * Predicts percentage loss based on temperature, duration hours, and ambient humidity.
 */
export function predictFreshnessLoss(
  productType: 'tomato_a' | 'tomato_b' | 'pepper_red' | 'pepper_green',
  avgTempCelsius: number,
  durationHours: number,
  humidity: number
): {
  lossPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
} {
  // Simple simulation of Random Forest decision trees
  let baseLoss = 0.5; // base percentage decay

  // Tree 1: Temperature effect
  if (productType.startsWith('tomato')) {
    if (avgTempCelsius > 14) {
      baseLoss += (avgTempCelsius - 14) * 1.5;
    } else if (avgTempCelsius < 10) {
      baseLoss += (10 - avgTempCelsius) * 0.8; // chill injury
    }
  } else {
    // Peppers prefer 8C - 10C
    if (avgTempCelsius > 10) {
      baseLoss += (avgTempCelsius - 10) * 1.8;
    } else if (avgTempCelsius < 7) {
      baseLoss += (7 - avgTempCelsius) * 1.0;
    }
  }

  // Tree 2: Duration effect
  baseLoss += durationHours * 0.15;

  // Tree 3: Humidity effect (excessive humidity leads to mold)
  if (humidity > 85) {
    baseLoss += (humidity - 85) * 0.1;
  } else if (humidity < 50) {
    baseLoss += (50 - humidity) * 0.05; // drying out
  }

  const lossPercent = Math.min(100, Math.max(0, parseFloat(baseLoss.toFixed(2))));
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (lossPercent > 8) {
    riskLevel = 'HIGH';
  } else if (lossPercent > 4) {
    riskLevel = 'MEDIUM';
  }

  let explanation = '';
  if (riskLevel === 'HIGH') {
    explanation = 'High thermal breaches recorded during transit. Active cellular senescence and decay risks predicted.';
  } else if (riskLevel === 'MEDIUM') {
    explanation = 'Minor temperature spikes. Mild moisture loss with low sensory depreciation.';
  } else {
    explanation = 'Strict temperature compliance maintained. Cargo freshness fully preserved.';
  }

  return { lossPercent, riskLevel, explanation };
}

// Generate QR Code simulated payload string
export function generateQRPayload(orderId: string, tempReq: string, weight: number): string {
  const data = {
    orderId,
    tempRequirement: tempReq,
    grossWeightKg: weight,
    origin: 'China Port',
    destination: 'Jebel Ali Port UAE',
    sealCertified: 'ZATCA-E-9902'
  };
  return JSON.stringify(data);
}
