import { RouteNode, DijkstraEdge, IoTSensor, ColdChainOrder, WeatherData } from './types';

// UAE Logistics Nodes
export const LOGISTICS_NODES: RouteNode[] = [
  { id: 'jebel_ali', name: 'Jebel Ali Port Terminal (Dubai)', lat: 25.0112, lng: 55.0617 },
  { id: 'dubai_central', name: 'Dubai Central Fresh Market', lat: 25.1632, lng: 55.3852 },
  { id: 'abu_dhabi', name: 'Abu Dhabi Fresh Cargo Terminal', lat: 24.4322, lng: 54.4510 },
  { id: 'al_ain', name: 'Al-Ain Agri-Distribution Center', lat: 24.1923, lng: 55.7533 },
  { id: 'sharjah_hub', name: 'Sharjah Cold Chain Gateway', lat: 25.3211, lng: 55.4851 },
  { id: 'fujairah', name: 'Fujairah Port Cold Storage', lat: 25.1215, lng: 56.3610 }
];

// Logistics Connections with weights for Dijkstra
export const DIJKSTRA_EDGES: DijkstraEdge[] = [
  { from: 'jebel_ali', to: 'dubai_central', distanceKm: 42, baseDurationMinutes: 35, highTempImpactMinutes: 10 },
  { from: 'jebel_ali', to: 'abu_dhabi', distanceKm: 115, baseDurationMinutes: 80, highTempImpactMinutes: 25 },
  { from: 'jebel_ali', to: 'sharjah_hub', distanceKm: 55, baseDurationMinutes: 45, highTempImpactMinutes: 15 },
  
  { from: 'dubai_central', to: 'sharjah_hub', distanceKm: 22, baseDurationMinutes: 20, highTempImpactMinutes: 8 },
  { from: 'dubai_central', to: 'al_ain', distanceKm: 135, baseDurationMinutes: 100, highTempImpactMinutes: 30 },
  
  { from: 'abu_dhabi', to: 'al_ain', distanceKm: 160, baseDurationMinutes: 110, highTempImpactMinutes: 35 },
  { from: 'sharjah_hub', to: 'fujairah', distanceKm: 105, baseDurationMinutes: 85, highTempImpactMinutes: 20 },
  { from: 'al_ain', to: 'fujairah', distanceKm: 118, baseDurationMinutes: 95, highTempImpactMinutes: 25 }
];

// Pre-configured cold chain sensors
export const INITIAL_SENSORS: IoTSensor[] = [
  {
    id: 'SN-TOM-9629',
    operatorName: 'Zayed Al-Mansoori',
    vehicleId: 'DXB-4401-REEFER',
    batteryLevel: 94.2,
    status: 'optimal',
    lastPing: 'Just Now',
    temperature: 12.8,
    humidity: 68.2,
    doorStatus: 'closed',
    sensorType: '4G'
  },
  {
    id: 'SN-CHL-2188',
    operatorName: 'Muhammad Khan',
    vehicleId: 'SHJ-2981-COOL',
    batteryLevel: 78.5,
    status: 'optimal',
    lastPing: '2 mins ago',
    temperature: 9.1,
    humidity: 72.4,
    doorStatus: 'closed',
    sensorType: 'BLE'
  },
  {
    id: 'SN-TOM-8951',
    operatorName: 'Faisal Al-Hamad',
    vehicleId: 'AUH-8802-TEMP',
    batteryLevel: 12.1, // Under 15% - will trigger visual alert + email dispatcher simulate
    status: 'warning',
    lastPing: '5 mins ago',
    temperature: 13.6,
    humidity: 82.1,
    doorStatus: 'open',
    sensorType: 'RS485'
  },
  {
    id: 'SN-TOM-1102',
    operatorName: 'Ahmad Jamil',
    vehicleId: 'N/A (Warehouse A)',
    batteryLevel: 11.4, // Under 15% - will trigger email alert
    status: 'warning',
    lastPing: '10 mins ago',
    temperature: 11.4,
    humidity: 74.8,
    doorStatus: 'closed',
    sensorType: 'BLE'
  },
  {
    id: 'SN-CHL-4040',
    operatorName: 'Saeed Al-Ghaithi',
    vehicleId: 'DXB-5590-COOL',
    batteryLevel: 0,
    status: 'disconnected', // Mất kết nối >30p
    lastPing: '34 mins ago',
    temperature: 15.2,
    humidity: 89.0,
    doorStatus: 'closed',
    sensorType: '4G'
  }
];

// Initial mock orders to kickstart the system with data
export const INITIAL_ORDERS: ColdChainOrder[] = [
  {
    id: 'TR-2026-A109',
    productType: 'tomato_a',
    productName: 'Tomatoes (Grade A Premium)',
    quantityKg: 5000,
    palletsCount: 10,
    totalPriceAED: 37500,
    pricePerKgAED: 7.5,
    incoterm: 'CIF',
    status: 'in_transit',
    pickupDate: '2026-07-01',
    deliveryDate: '2026-07-15',
    createdAt: '2026-07-01T08:00:00Z',
    buyerName: 'Al-Jamil Markets',
    shipperName: 'Ningbo Agri-Export Ltd',
    driverName: 'Zayed Al-Mansoori',
    vehiclePlate: 'DXB-4401-REEFER',
    etaMinutes: 89,
    sensorId: 'SN-TOM-9629'
  },
  {
    id: 'TR-2026-B203',
    productType: 'pepper_red',
    productName: 'Premium Red Peppers',
    quantityKg: 3000,
    palletsCount: 6,
    totalPriceAED: 27000,
    pricePerKgAED: 9.0,
    incoterm: 'FOB',
    status: 'approved',
    pickupDate: '2026-07-02',
    deliveryDate: '2026-07-18',
    createdAt: '2026-07-02T10:30:00Z',
    buyerName: 'Dubai Premium Foods',
    shipperName: 'China Single Window Sourcing',
    driverName: 'Muhammad Khan',
    vehiclePlate: 'SHJ-2981-COOL',
    etaMinutes: 145,
    sensorId: 'SN-CHL-2188'
  },
  {
    id: 'TR-2026-C440',
    productType: 'tomato_b',
    productName: 'Tomatoes (Grade B Quality)',
    quantityKg: 8000,
    palletsCount: 16,
    totalPriceAED: 44000,
    pricePerKgAED: 5.5,
    incoterm: 'CIF',
    status: 'delivered',
    pickupDate: '2026-06-25',
    deliveryDate: '2026-07-03',
    createdAt: '2026-06-25T09:15:00Z',
    buyerName: 'Emirates Catering Services',
    shipperName: 'Hebei Fresh Farms Co',
    driverName: 'Faisal Al-Hamad',
    vehiclePlate: 'AUH-8802-TEMP',
    etaMinutes: 0,
    sensorId: 'SN-TOM-8951'
  }
];

// Initial weather data for real-time adjustments
export const UAE_WEATHER: WeatherData = {
  city: 'Jebel Ali Port (Dubai)',
  temp: 44.2, // > 40C triggers auxiliary cooling warning
  humidity: 48,
  windSpeedKph: 24,
  condition: 'Extremely Hot / Sunny',
  sandstormWarning: false
};

// Fruit Scan templates (YOLO images generator/preset simulation)
export interface FruitImageSample {
  id: string;
  name: string;
  type: 'tomato' | 'pepper';
  state: 'fresh' | 'ripe' | 'unripe' | 'rotten';
  imageUrl: string;
  gridData: string; // ASCII or styled SVG path drawing for rendering locally
}

export const FRUIT_SAMPLES: FruitImageSample[] = [
  {
    id: 't_ripe',
    name: 'Perfect Tomato',
    type: 'tomato',
    state: 'ripe',
    imageUrl: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400',
    gridData: 'M 100,60 C 130,60 160,80 160,110 C 160,140 130,160 100,160 C 70,160 40,140 40,110 C 40,80 70,60 100,60 Z'
  },
  {
    id: 't_green',
    name: 'Unripe Tomato',
    type: 'tomato',
    state: 'unripe',
    imageUrl: 'https://images.unsplash.com/photo-1546473533-f0c1b927d547?auto=format&fit=crop&q=80&w=400',
    gridData: 'M 100,60 C 130,60 160,80 160,110 C 160,140 130,160 100,160 C 70,160 40,140 40,110 C 40,80 70,60 100,60 Z'
  },
  {
    id: 't_rotten',
    name: 'Moldy Tomato',
    type: 'tomato',
    state: 'rotten',
    imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400',
    gridData: 'M 100,60 C 130,60 160,80 160,110 C 160,140 130,160 100,160 C 70,160 40,140 40,110 C 40,80 70,60 100,60 Z'
  },
  {
    id: 'p_ripe',
    name: 'Bright Red Chili',
    type: 'pepper',
    state: 'ripe',
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119cb661?auto=format&fit=crop&q=80&w=400',
    gridData: 'M 80,40 C 90,40 100,45 105,50 C 115,70 115,110 105,140 C 95,170 70,190 60,190 C 55,190 60,160 70,130 C 80,100 85,70 80,40 Z'
  },
  {
    id: 'p_rotten',
    name: 'Rotten Wilted Pepper',
    type: 'pepper',
    state: 'rotten',
    imageUrl: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&q=80&w=400',
    gridData: 'M 80,40 C 90,40 100,45 105,50 C 115,70 115,110 105,140 C 95,170 70,190 60,190 C 55,190 60,160 70,130 C 80,100 85,70 80,40 Z'
  }
];

export const INITIAL_PRODUCTS = [
  { id: 'prod_tomato_premium', name: 'Tomatoes (Grade A Premium)', category: 'tomato', pricePerKgAED: 7.5, stockKg: 12000, origin: 'UAE', description: 'Freshly harvested hand-picked premium tomatoes' },
  { id: 'prod_tomato_standard', name: 'Tomatoes (Grade B Quality)', category: 'tomato', pricePerKgAED: 5.5, stockKg: 25000, origin: 'China', description: 'Standard wholesale trade class tomatoes' },
  { id: 'prod_pepper_red', name: 'Premium Red Peppers', category: 'pepper', pricePerKgAED: 9.0, stockKg: 8500, origin: 'Spain', description: 'Chili red sweet peppers with high moisture tolerance' },
  { id: 'prod_pepper_green', name: 'Sweet Green Peppers', category: 'pepper', pricePerKgAED: 6.8, stockKg: 15000, origin: 'UAE', description: 'Organic green bell peppers from Al-Ain greenhouses' }
];
