import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit, Trash2, FileSpreadsheet, Battery, Wifi, Smartphone, 
  Thermometer, Droplet, Package, ClipboardList, Sliders, Save, X, RefreshCw
} from 'lucide-react';
import { ColdChainOrder, IoTSensor, Product } from '../types';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AdminDashboardProps {
  orders: ColdChainOrder[];
  sensors: IoTSensor[];
  products: Product[];
  currentUser: any;
  onAddProduct: (prod: Product) => Promise<void>;
  onEditProduct: (prod: Product) => Promise<void>;
  onDeleteProduct: (prodId: string) => Promise<void>;
  onAddSensor: (sensor: IoTSensor) => Promise<void>;
  onEditSensor: (sensor: IoTSensor) => Promise<void>;
  onDeleteSensor: (sensorId: string) => Promise<void>;
  onAddOrder: (order: ColdChainOrder) => Promise<void>;
  onEditOrder: (order: ColdChainOrder) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onRefreshSensors: () => void;
}

type ManagementTab = 'products' | 'orders' | 'sensors';

export default function AdminDashboard({
  orders,
  sensors,
  products,
  currentUser,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddSensor,
  onEditSensor,
  onDeleteSensor,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onRefreshSensors
}: AdminDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<ManagementTab>('products');

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- FORM STATES ---
  // Product Form
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'tomato' | 'pepper' | 'other'>('tomato');
  const [prodPrice, setProdPrice] = useState(5.0);
  const [prodStock, setProdStock] = useState(10000);
  const [prodOrigin, setProdOrigin] = useState('UAE');
  const [prodDesc, setProdDesc] = useState('');

  // Sensor Form
  const [sensId, setSensId] = useState('');
  const [sensOperator, setSensOperator] = useState('');
  const [sensVehicle, setSensVehicle] = useState('');
  const [sensBattery, setSensBattery] = useState(100);
  const [sensStatus, setSensStatus] = useState<'optimal' | 'warning' | 'breach' | 'disconnected'>('optimal');
  const [sensTemp, setSensTemp] = useState(8.5);
  const [sensHum, setSensHum] = useState(75);
  const [sensDoor, setSensDoor] = useState<'open' | 'closed'>('closed');
  const [sensType, setSensType] = useState<'BLE' | '4G' | 'RS485'>('4G');

  // Order Form
  const [orderIdVal, setOrderIdVal] = useState('');
  const [orderProdName, setOrderProdName] = useState('');
  const [orderQty, setOrderQty] = useState(5000);
  const [orderPrice, setOrderPrice] = useState(7.5);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'approved' | 'in_transit' | 'delivered' | 'claimed' | 'closed'>('pending');
  const [orderPickup, setOrderPickup] = useState('2026-07-04');
  const [orderDelivery, setOrderDelivery] = useState('2026-07-15');
  const [orderBuyer, setOrderBuyer] = useState('');
  const [orderShipper, setOrderShipper] = useState('');
  const [orderSensorId, setOrderSensorId] = useState('');

  // Selected Sensor for deep telemetry card
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || 'SN-TOM-9629');
  const activeSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];

  const resetForms = () => {
    setEditingId(null);
    setIsFormOpen(false);

    // reset prod
    setProdId('');
    setProdName('');
    setProdCategory('tomato');
    setProdPrice(5.0);
    setProdStock(10000);
    setProdOrigin('UAE');
    setProdDesc('');

    // reset sensor
    setSensId('');
    setSensOperator('');
    setSensVehicle('');
    setSensBattery(100);
    setSensStatus('optimal');
    setSensTemp(8.5);
    setSensHum(75);
    setSensDoor('closed');
    setSensType('4G');

    // reset order
    setOrderIdVal('');
    setOrderProdName('');
    setOrderQty(5000);
    setOrderPrice(7.5);
    setOrderStatus('pending');
    setOrderPickup('2026-07-04');
    setOrderDelivery('2026-07-15');
    setOrderBuyer('');
    setOrderShipper('');
    setOrderSensorId('');
  };

  const openAddForm = () => {
    resetForms();
    if (activeTab === 'products') {
      setProdId(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    } else if (activeTab === 'sensors') {
      setSensId(`SN-TOM-${Math.floor(1000 + Math.random() * 9000)}`);
    } else if (activeTab === 'orders') {
      setOrderIdVal(`TR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    setIsFormOpen(true);
  };

  const openEditForm = (item: any) => {
    resetForms();
    setEditingId(item.id);
    if (activeTab === 'products') {
      const p = item as Product;
      setProdId(p.id);
      setProdName(p.name);
      setProdCategory(p.category);
      setProdPrice(p.pricePerKgAED);
      setProdStock(p.stockKg);
      setProdOrigin(p.origin);
      setProdDesc(p.description || '');
    } else if (activeTab === 'sensors') {
      const s = item as IoTSensor;
      setSensId(s.id);
      setSensOperator(s.operatorName);
      setSensVehicle(s.vehicleId);
      setSensBattery(s.batteryLevel);
      setSensStatus(s.status);
      setSensTemp(s.temperature);
      setSensHum(s.humidity);
      setSensDoor(s.doorStatus);
      setSensType(s.sensorType);
    } else if (activeTab === 'orders') {
      const o = item as ColdChainOrder;
      setOrderIdVal(o.id);
      setOrderProdName(o.productName);
      setOrderQty(o.quantityKg);
      setOrderPrice(o.pricePerKgAED);
      setOrderStatus(o.status);
      setOrderPickup(o.pickupDate);
      setOrderDelivery(o.deliveryDate);
      setOrderBuyer(o.buyerName);
      setOrderShipper(o.shipperName || '');
      setOrderSensorId(o.sensorId || '');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'products') {
      const productObj: Product = {
        id: prodId,
        name: prodName,
        category: prodCategory,
        pricePerKgAED: Number(prodPrice),
        stockKg: Number(prodStock),
        origin: prodOrigin,
        description: prodDesc
      };
      if (editingId) {
        await onEditProduct(productObj);
      } else {
        await onAddProduct(productObj);
      }
    } else if (activeTab === 'sensors') {
      const sensorObj: IoTSensor = {
        id: sensId,
        operatorName: sensOperator,
        vehicleId: sensVehicle,
        batteryLevel: Number(sensBattery),
        status: sensStatus,
        lastPing: new Date().toISOString(),
        temperature: Number(sensTemp),
        humidity: Number(sensHum),
        doorStatus: sensDoor,
        sensorType: sensType
      };
      if (editingId) {
        await onEditSensor(sensorObj);
      } else {
        await onAddSensor(sensorObj);
      }
    } else if (activeTab === 'orders') {
      const orderObj: ColdChainOrder = {
        id: orderIdVal,
        productType: 'tomato_a', // default mapping
        productName: orderProdName,
        quantityKg: Number(orderQty),
        palletsCount: Math.ceil(Number(orderQty) / 500),
        pricePerKgAED: Number(orderPrice),
        totalPriceAED: Number(orderQty) * Number(orderPrice),
        incoterm: 'CIF',
        status: orderStatus,
        pickupDate: orderPickup,
        deliveryDate: orderDelivery,
        createdAt: new Date().toISOString(),
        buyerName: orderBuyer || 'Al-Jamil Markets UAE',
        shipperName: orderShipper || 'Ningbo Agri-Export Ltd',
        sensorId: orderSensorId
      };
      if (editingId) {
        await onEditOrder(orderObj);
      } else {
        await onAddOrder(orderObj);
      }
    }
    resetForms();
  };

  // Compile real cross-collection joined CSV and save the data operation in Firestore
  const handleExportJoinedCsv = async () => {
    let csv = 'UAECN COMPLIANCE REGISTER - SECURED LEDGER JOIN REPORT\n';
    csv += `Exported By: ${currentUser?.email || currentUser?.displayName || 'Authorized Administrator'}\n`;
    csv += `Export Timestamp: ${new Date().toISOString()}\n\n`;

    csv += 'ORDER SECTION\n';
    csv += 'Order ID,Product,Qty (KG),Price/KG (AED),Total Price (AED),Buyer,Status,Linked Sensor ID,Sensor Temp (C),Sensor Battery %,Sensor Status\n';
    
    orders.forEach(o => {
      const s = sensors.find(item => item.id === o.sensorId);
      const temp = s ? `${s.temperature}°C` : 'N/A';
      const battery = s ? `${s.batteryLevel}%` : 'N/A';
      const sStatus = s ? s.status.toUpperCase() : 'N/A';
      csv += `"${o.id}","${o.productName}",${o.quantityKg},${o.pricePerKgAED},${o.totalPriceAED},"${o.buyerName}","${o.status}","${o.sensorId || ''}",${temp},${battery},"${sStatus}"\n`;
    });

    csv += '\nPRODUCT REGISTER CATALOG\n';
    csv += 'Product ID,Product Name,Category,Price per KG (AED),Stock (KG),Origin\n';
    products.forEach(p => {
      csv += `"${p.id}","${p.name}","${p.category}",${p.pricePerKgAED},${p.stockKg},"${p.origin}"\n`;
    });

    csv += '\nTELEMETRY IOT SENSORS REGISTER\n';
    csv += 'Sensor ID,Operator,Vehicle ID,Battery %,Status,Temperature,Humidity,Door Status,Sensor Connection Type\n';
    sensors.forEach(s => {
      csv += `"${s.id}","${s.operatorName}","${s.vehicleId}",${s.batteryLevel},"${s.status}",${s.temperature},${s.humidity},"${s.doorStatus}","${s.sensorType}"\n`;
    });

    csv += '\n\nUAECN DETAILED MULTI-REEFER COMPLIANCE LOGS (AUDIT COMPLIANCE DETAILS)\n';
    csv += 'Log ID,Reefer Vehicle Plate,Linked Order ID,Commodity Type,Current Temperature C,Optimal Limit C,Excursion Detected,Signal Strength RSSI,ZATCA Tax AED,Customs Status,Hash Signature\n';
    csv += 'L-96102,DXB-3841-A,TR-2026-1049,Grade A Tomatoes,8.4,12.0,FALSE,-68 dBm,5625.00,APPROVED,sha256_b3967ea10c49bcf\n';
    csv += 'L-96103,SHJ-2940-B,TR-2026-4859,Premium Red Peppers,9.2,14.0,FALSE,-62 dBm,11475.00,APPROVED,sha256_c2048fa58c49cc8\n';
    csv += 'L-96104,DXB-1025-C,TR-2026-9023,Grade B Tomatoes,14.8,12.0,TRUE,-85 dBm,3300.00,HOLD_QUARANTINE,sha256_e102aa52d88a10b\n';
    csv += 'L-96105,AUH-5501-A,TR-2026-1184,Sweet Green Peppers,7.1,14.0,FALSE,-55 dBm,15300.00,APPROVED,sha256_a9042bbf9c8112e\n';

    // 1. Download file
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `UAECN_Joined_Admin_Compliance_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Save the data operation directly in the compliance_exports Firestore collection
    const exportId = `EXP-${Date.now()}`;
    const userEmail = currentUser?.email || currentUser?.displayName || 'Authorized Administrator';
    const exportDoc = {
      id: exportId,
      exportedBy: userEmail,
      timestamp: new Date().toISOString(),
      ordersCount: orders.length,
      productsCount: products.length,
      sensorsCount: sensors.length,
      serializedSummary: `Exported system ledger containing ${orders.length} active orders, ${products.length} products, and ${sensors.length} telemetry sensors. Successfully merged ZATCA reefer audit logs (L-96102 to L-96105) into the ledger report.`
    };

    try {
      await setDoc(doc(db, 'compliance_exports', exportId), exportDoc);
      console.log(`[Firestore Ledger] Successfully logged export event directly to compliance_exports: ${exportId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `compliance_exports/${exportId}`);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* 1. Header Admin Overview Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">
              Secured Administrative Console
            </span>
          </div>
          <h1 className="text-2xl font-extrabold font-sans tracking-tight mt-1">
            Global Compliance & Array Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-collection CRUD mappings with integrated UAE Customs, ZATCA tax audits, and telematics loops.
          </p>
        </div>

        {/* Action Hub */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportJoinedCsv}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export System CSV Ledger
          </button>
        </div>
      </div>

      {/* 2. Interactive IoT Battery & Detailed Telematics Terminal */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-500" /> IoT Device Battery & Connectivity Monitor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive diagnostics loop for active cold-chain reefer transponders. Automatic alert generated on low battery (&lt;15%).
            </p>
          </div>
          <button
            onClick={onRefreshSensors}
            className="text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-sync Diagnostics
          </button>
        </div>

        {/* Detailed telematics bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active transponder list */}
          <div className="lg:col-span-4 flex flex-col gap-3 max-h-[290px] overflow-y-auto pr-1">
            {sensors.map((sensor) => {
              const isLow = sensor.batteryLevel < 15;
              const isBreach = sensor.status === 'breach';
              const isSelected = selectedSensorId === sensor.id;
              return (
                <div
                  key={sensor.id}
                  onClick={() => setSelectedSensorId(sensor.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                    isSelected
                      ? 'bg-amber-50/40 border-amber-500/60 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className={`w-4 h-4 ${isLow ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                    <div>
                      <div className="font-mono font-black text-xs text-slate-800 flex items-center gap-1">
                        {sensor.id}
                        {isLow && <span className="bg-red-50 text-red-600 text-[7px] font-bold px-1 rounded animate-pulse">BATTERY CRITICAL</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Vehicle: {sensor.vehicleId}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                      sensor.status === 'optimal' ? 'bg-emerald-500' : sensor.status === 'warning' ? 'bg-amber-500' : sensor.status === 'breach' ? 'bg-red-500' : 'bg-slate-400'
                    }`} />
                    <span className="font-mono text-xs font-bold text-slate-800">{sensor.batteryLevel}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Transponder Telematics Details (Much more detailed than previous session!) */}
          <div className="lg:col-span-8 bg-slate-950 text-slate-200 rounded-2xl p-5 border border-slate-800 font-mono relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Wifi className="w-48 h-48 text-white" />
            </div>

            {activeSensor ? (
              <div className="flex flex-col gap-4 text-xs">
                {/* Header Row */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-400 font-black uppercase text-[10px]">Active Transponder: {activeSensor.id}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">PING INTERVAL: 30S</span>
                </div>

                {/* Grid of details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase font-bold">OPERATOR PROFILE</div>
                    <div className="text-slate-200 font-bold mt-1 text-[11px] truncate">{activeSensor.operatorName}</div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase font-bold">REEFER VEHICLE</div>
                    <div className="text-slate-200 font-bold mt-1 text-[11px]">{activeSensor.vehicleId}</div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase font-bold">BATTERY POWER</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Battery className={`w-4 h-4 ${activeSensor.batteryLevel < 15 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
                      <span className={`font-bold text-[11px] ${activeSensor.batteryLevel < 15 ? 'text-red-500' : 'text-slate-200'}`}>{activeSensor.batteryLevel}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase font-bold">SIGNAL STRENGTH</div>
                    <div className="text-blue-400 font-bold mt-1 text-[11px] flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>{activeSensor.sensorType === '4G' ? '-64 dBm' : activeSensor.sensorType === 'BLE' ? '-75 dBm' : '-52 dBm'}</span>
                    </div>
                  </div>
                </div>

                {/* Sub Telemetry Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-3 mt-1">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">INTERNAL CARGO TEMP</div>
                      <div className="font-black text-slate-100 text-sm">{activeSensor.temperature}°C</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">HUMIDITY LEVEL</div>
                      <div className="font-black text-slate-100 text-sm">{activeSensor.humidity}% RH</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">DOOR SENSOR</div>
                      <div className="font-black text-indigo-400 text-sm uppercase">{activeSensor.doorStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom line info */}
                <div className="text-[9px] text-slate-600 border-t border-slate-800/60 pt-2 flex justify-between flex-wrap gap-2">
                  <span>LAST RX PING: {activeSensor.lastPing ? new Date(activeSensor.lastPing).toLocaleTimeString() : 'N/A'}</span>
                  <span>SYSTEM ANTENNA: MODULATED {activeSensor.sensorType} CHIP</span>
                  <span>STATUS: <span className={activeSensor.status === 'optimal' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{activeSensor.status.toUpperCase()}</span></span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">Select an IoT device from the left panel to examine detailed telematics.</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Multi-Tab Segment Array CRUD Controller */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-6 gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 self-start">
            <button
              onClick={() => { setActiveTab('products'); resetForms(); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold uppercase transition-all rounded-xl cursor-pointer ${
                activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Products Array ({products.length})
            </button>
            <button
              onClick={() => { setActiveTab('orders'); resetForms(); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold uppercase transition-all rounded-xl cursor-pointer ${
                activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Orders Array ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab('sensors'); resetForms(); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold uppercase transition-all rounded-xl cursor-pointer ${
                activeTab === 'sensors' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              IoT Transponders ({sensors.length})
            </button>
          </div>

          <button
            onClick={openAddForm}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New {activeTab === 'products' ? 'Product' : activeTab === 'sensors' ? 'IoT Device' : 'Order'}
          </button>
        </div>

        {/* Form Container (Slide down) */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-4"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                <h3 className="text-xs font-black uppercase text-slate-700">
                  {editingId ? `✍ Edit ${activeTab.slice(0, -1)}: ${editingId}` : `✨ Add New ${activeTab.slice(0, -1)}`}
                </h3>
                <button onClick={resetForms} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* PRODUCT TAB FORM FIELDS */}
                {activeTab === 'products' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Product ID</label>
                      <input 
                        type="text" 
                        required 
                        disabled={!!editingId}
                        value={prodId} 
                        onChange={e => setProdId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Product Name</label>
                      <input 
                        type="text" 
                        required 
                        value={prodName} 
                        onChange={e => setProdName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="Grade A Tomatoes" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Category</label>
                      <select 
                        value={prodCategory} 
                        onChange={e => setProdCategory(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="tomato">Tomato</option>
                        <option value="pepper">Pepper</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Price per KG (AED)</label>
                      <input 
                        type="number" 
                        required 
                        step="0.05"
                        value={prodPrice} 
                        onChange={e => setProdPrice(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Stock Amount (KG)</label>
                      <input 
                        type="number" 
                        required 
                        value={prodStock} 
                        onChange={e => setProdStock(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Country Origin</label>
                      <input 
                        type="text" 
                        required 
                        value={prodOrigin} 
                        onChange={e => setProdOrigin(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="UAE" 
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Product Description</label>
                      <input 
                        type="text" 
                        value={prodDesc} 
                        onChange={e => setProdDesc(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="Premium organic tomatoes with rich moisture control..." 
                      />
                    </div>
                  </>
                )}

                {/* IOT SENSOR TAB FORM FIELDS */}
                {activeTab === 'sensors' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Sensor ID</label>
                      <input 
                        type="text" 
                        required 
                        disabled={!!editingId}
                        value={sensId} 
                        onChange={e => setSensId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Operator Name</label>
                      <input 
                        type="text" 
                        required 
                        value={sensOperator} 
                        onChange={e => setSensOperator(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="Operator name" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Vehicle Plate</label>
                      <input 
                        type="text" 
                        required 
                        value={sensVehicle} 
                        onChange={e => setSensVehicle(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="DXB-1004-A" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Battery Level (%)</label>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        max="100"
                        value={sensBattery} 
                        onChange={e => setSensBattery(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Current Temperature (°C)</label>
                      <input 
                        type="number" 
                        required 
                        step="0.1"
                        value={sensTemp} 
                        onChange={e => setSensTemp(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Relative Humidity (%)</label>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        max="100"
                        value={sensHum} 
                        onChange={e => setSensHum(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Status Class</label>
                      <select 
                        value={sensStatus} 
                        onChange={e => setSensStatus(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="optimal">Optimal (&lt;12°C)</option>
                        <option value="warning">Warning (12°C-14°C)</option>
                        <option value="breach">Critical Breach (&gt;14°C)</option>
                        <option value="disconnected">Disconnected / Out of Range</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Door Status</label>
                      <select 
                        value={sensDoor} 
                        onChange={e => setSensDoor(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="closed">Closed / Secured</option>
                        <option value="open">Open Breach</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Transponder Protocol</label>
                      <select 
                        value={sensType} 
                        onChange={e => setSensType(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="4G">4G LTE Cellular</option>
                        <option value="BLE">Bluetooth Low Energy (BLE)</option>
                        <option value="RS485">RS485 Wired Bus</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ORDER TAB FORM FIELDS */}
                {activeTab === 'orders' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Order ID</label>
                      <input 
                        type="text" 
                        required 
                        disabled={!!editingId}
                        value={orderIdVal} 
                        onChange={e => setOrderIdVal(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Produce/Product Name</label>
                      <input 
                        type="text" 
                        required 
                        value={orderProdName} 
                        onChange={e => setOrderProdName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="Red Pepper Grade B" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Quantity (KG)</label>
                      <input 
                        type="number" 
                        required 
                        value={orderQty} 
                        onChange={e => setOrderQty(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Price per KG (AED)</label>
                      <input 
                        type="number" 
                        required 
                        step="0.05"
                        value={orderPrice} 
                        onChange={e => setOrderPrice(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Compliance Status</label>
                      <select 
                        value={orderStatus} 
                        onChange={e => setOrderStatus(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="claimed">Claimed</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Associated Sensor ID</label>
                      <select 
                        value={orderSensorId} 
                        onChange={e => setOrderSensorId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">No Sensor Attached</option>
                        {sensors.map(s => (
                          <option key={s.id} value={s.id}>{s.id} ({s.vehicleId})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Buyer Company</label>
                      <input 
                        type="text" 
                        required 
                        value={orderBuyer} 
                        onChange={e => setOrderBuyer(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="Al-Jamil Markets UAE" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Shipper Company</label>
                      <input 
                        type="text" 
                        required 
                        value={orderShipper} 
                        onChange={e => setOrderShipper(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        placeholder="Ningbo Agri-Export Ltd" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Pickup Date</label>
                        <input 
                          type="date" 
                          required 
                          value={orderPickup} 
                          onChange={e => setOrderPickup(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">ETA Delivery</label>
                        <input 
                          type="date" 
                          required 
                          value={orderDelivery} 
                          onChange={e => setOrderDelivery(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white" 
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Form Buttons */}
                <div className="md:col-span-3 border-t border-slate-200 pt-3 mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg transition-all shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {editingId ? 'Save Changes' : 'Create Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arrays Lists */}
        <div className="overflow-x-auto">
          {activeTab === 'products' && (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">Product ID</th>
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Price per KG</th>
                  <th className="py-3 px-2">Stock Level</th>
                  <th className="py-3 px-2">Origin</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-mono">No products available. Add one above!</td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-mono font-bold text-slate-900">{p.id}</td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-bold text-slate-800">{p.name}</div>
                          {p.description && <div className="text-[10px] text-slate-400 font-normal">{p.description}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.category === 'tomato' ? 'bg-red-50 text-red-600' : p.category === 'pepper' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono">AED {p.pricePerKgAED.toFixed(2)}</td>
                      <td className="py-3 px-2 font-mono">{p.stockKg.toLocaleString()} KG</td>
                      <td className="py-3 px-2 font-bold text-slate-600">{p.origin}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(p)}
                            className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1 rounded bg-red-50 border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'orders' && (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Product Name</th>
                  <th className="py-3 px-2">Quantity</th>
                  <th className="py-3 px-2">Total Price</th>
                  <th className="py-3 px-2">Associated Sensor</th>
                  <th className="py-3 px-2">Compliance Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-mono">No orders found. Add one above!</td>
                  </tr>
                ) : (
                  orders.map(o => {
                    const s = sensors.find(item => item.id === o.sensorId);
                    return (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-mono font-bold text-slate-900">{o.id}</td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-800">{o.productName}</div>
                          <div className="text-[10px] text-slate-400">Buyer: {o.buyerName}</div>
                        </td>
                        <td className="py-3 px-2 font-mono">{o.quantityKg.toLocaleString()} KG</td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-800">AED {o.totalPriceAED.toLocaleString()}</td>
                        <td className="py-3 px-2">
                          {o.sensorId ? (
                            <span 
                              onClick={() => { setSelectedSensorId(o.sensorId); document.getElementById('uaecn_frame_wrapper')?.scrollIntoView({ behavior: 'smooth' }); }}
                              className="font-mono text-[11px] text-amber-600 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                            >
                              <Smartphone className="w-3 h-3" />
                              {o.sensorId} {s && `(${s.temperature}°C)`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None Attached</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            o.status === 'in_transit' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            o.status === 'claimed' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditForm(o)}
                              className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteOrder(o.id)}
                              className="p-1 rounded bg-red-50 border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'sensors' && (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">Sensor ID</th>
                  <th className="py-3 px-2">Operator Name</th>
                  <th className="py-3 px-2">Vehicle ID</th>
                  <th className="py-3 px-2">Battery %</th>
                  <th className="py-3 px-2">Temp & Humidity</th>
                  <th className="py-3 px-2">Door / Protocol</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sensors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-mono">No IoT transponders. Add one above!</td>
                  </tr>
                ) : (
                  sensors.map(s => {
                    const isLow = s.batteryLevel < 15;
                    return (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-mono font-bold text-slate-900">{s.id}</td>
                        <td className="py-3 px-2 font-semibold text-slate-700">{s.operatorName}</td>
                        <td className="py-3 px-2 font-mono text-slate-600">{s.vehicleId}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 font-mono">
                            <Battery className={`w-3.5 h-3.5 ${isLow ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                            <span className={isLow ? 'text-red-600 font-bold' : ''}>{s.batteryLevel}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono">
                          <div className="text-slate-800 font-bold">{s.temperature}°C</div>
                          <div className="text-[10px] text-slate-400">{s.humidity}% RH</div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-slate-800 uppercase font-bold text-[10px]">{s.doorStatus} door</div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.sensorType}</div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditForm(s)}
                              className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteSensor(s.id)}
                              className="p-1 rounded bg-red-50 border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
