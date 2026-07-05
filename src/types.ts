export type UserRole = 'buyer' | 'shipper' | 'driver' | 'admin' | 'maps';

export interface Product {
  id: string;
  name: string;
  category: 'tomato' | 'pepper' | 'other';
  pricePerKgAED: number;
  stockKg: number;
  origin: string;
  description?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyName: string;
  avatarUrl?: string;
}

export interface ColdChainOrder {
  id: string;
  productType: 'tomato_a' | 'tomato_b' | 'pepper_red' | 'pepper_green';
  productName: string;
  quantityKg: number;
  palletsCount: number;
  totalPriceAED: number;
  pricePerKgAED: number;
  incoterm: 'CIF' | 'FOB';
  status: 'pending' | 'approved' | 'in_transit' | 'delivered' | 'claimed' | 'closed';
  pickupDate: string;
  deliveryDate: string;
  createdAt: string;
  buyerName: string;
  shipperName: string;
  driverName?: string;
  vehiclePlate?: string;
  etaMinutes?: number;
  sensorId?: string;
}

export interface IoTTelemetry {
  timestamp: string;
  temperature: number;
  humidity: number;
  ambientTemp: number;
  batteryLevel: number;
  doorStatus: 'open' | 'closed';
  lat: number;
  lng: number;
  speedKmh: number;
}

export interface IoTSensor {
  id: string;
  operatorName: string;
  vehicleId: string;
  batteryLevel: number;
  status: 'optimal' | 'warning' | 'breach' | 'disconnected';
  lastPing: string;
  temperature: number;
  humidity: number;
  doorStatus: 'open' | 'closed';
  sensorType: 'BLE' | '4G' | 'RS485';
}

export interface RouteNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface DijkstraEdge {
  from: string;
  to: string;
  distanceKm: number;
  baseDurationMinutes: number;
  highTempImpactMinutes: number; // additional delay under >40C
}

export interface FruitScanResult {
  id: string;
  fruitType: 'tomato' | 'pepper';
  state: 'fresh' | 'ripe' | 'unripe' | 'rotten';
  confidence: number;
  timestamp: string;
  scannedBy: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  humidity: number;
  windSpeedKph: number;
  condition: string;
  sandstormWarning: boolean;
}
