import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, CheckCircle, AlertTriangle, Layers, BarChart3, 
  ArrowUpDown, ArrowUp, ArrowDown, History, Check, Clock, 
  Truck, ShieldCheck, Box, PackageOpen, RefreshCw, Layers3, Search, Play, FileText, Settings
} from 'lucide-react';
import { ColdChainOrder } from '../types';

interface ShipperPortalProps {
  orders: ColdChainOrder[];
  onEditOrder?: (order: ColdChainOrder) => Promise<void>;
}

interface InventoryItem {
  key: 'tomato_a' | 'tomato_b' | 'pepper_red' | 'pepper_green';
  name: string;
  category: 'tomato' | 'pepper';
  stockKg: number;
  maxCapacityKg: number;
  bayNumber: string;
  temperatureCelsius: number;
  allocatedKg: number;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    key: 'tomato_a',
    name: 'Grade A Tomatoes',
    category: 'tomato',
    stockKg: 12500,
    maxCapacityKg: 20000,
    bayNumber: 'BAY-04-COLD',
    temperatureCelsius: 12.5,
    allocatedKg: 4200,
  },
  {
    key: 'tomato_b',
    name: 'Grade B Tomatoes',
    category: 'tomato',
    stockKg: 8500, // Under 10,000kg warning limit
    maxCapacityKg: 20000,
    bayNumber: 'BAY-05-COLD',
    temperatureCelsius: 13.0,
    allocatedKg: 6800,
  },
  {
    key: 'pepper_red',
    name: 'Premium Red Peppers',
    category: 'pepper',
    stockKg: 18000,
    maxCapacityKg: 25000,
    bayNumber: 'BAY-08-COOL',
    temperatureCelsius: 8.8,
    allocatedKg: 3000,
  },
  {
    key: 'pepper_green',
    name: 'Sweet Green Peppers',
    category: 'pepper',
    stockKg: 6400, // Under 10,000kg warning limit
    maxCapacityKg: 15000,
    bayNumber: 'BAY-09-COOL',
    temperatureCelsius: 9.1,
    allocatedKg: 1200,
  }
];

const CARRIERS = [
  { id: 'dhl', name: 'DHL Express Cold Chain', type: 'Air Freight', speed: 'Extremely Fast (< 24h)', rating: 4.9, icon: '✈️' },
  { id: 'maersk', name: 'Maersk ColdShield', type: 'Sea Freight', speed: 'Reliable Sea Line (5-7 days)', rating: 4.8, icon: '🚢' },
  { id: 'cosco', name: 'COSCO Express Reefer', type: 'Sea Freight', speed: 'Economical Sea Line (6-8 days)', rating: 4.7, icon: '⚓' },
  { id: 'aramex', name: 'Aramex Fresh Logistics', type: 'Land Express', speed: 'Fast Regional Land (2-3 days)', rating: 4.6, icon: '🚛' },
  { id: 'al_jamil', name: 'Al-Jamil Regional Fleet', type: 'Local Transport', speed: 'Intra-City Delivery (< 12h)', rating: 4.5, icon: '🚚' }
];

export default function ShipperPortal({ orders, onEditOrder }: ShipperPortalProps) {
  // Warehouse inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [restockAmount, setRestockAmount] = useState<string>('5000');
  const [selectedRestockProduct, setSelectedRestockProduct] = useState<'tomato_a' | 'tomato_b' | 'pepper_red' | 'pepper_green'>('tomato_a');
  
  // Custom interactive system alert / banner feedback
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  
  // Active selection for label station
  const [selectedLabelOrderId, setSelectedLabelOrderId] = useState<string>(orders[0]?.id || '');
  const [currentPalletIndex, setCurrentPalletIndex] = useState<number>(1);
  const [labelCopies, setLabelCopies] = useState<number>(1);
  const [printDensity, setPrintDensity] = useState<string>('300 DPI');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Search & history states
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  
  // Manual Priority adjustments (holds order IDs in customized sequence overrides)
  const [priorityOverrideIds, setPriorityOverrideIds] = useState<string[]>([]);
  const [assignedCarriers, setAssignedCarriers] = useState<Record<string, string>>({});
  const [isDispatching, setIsDispatching] = useState<Record<string, boolean>>({});

  // Trigger banner message
  const showBannerMessage = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4500);
  };

  // Helper: Restock inventory
  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(restockAmount);
    if (isNaN(amt) || amt <= 0) return;

    setInventory(prev => prev.map(item => {
      if (item.key === selectedRestockProduct) {
        const newStock = Math.min(item.maxCapacityKg, item.stockKg + amt);
        return {
          ...item,
          stockKg: newStock
        };
      }
      return item;
    }));
    
    const prodName = inventory.find(i => i.key === selectedRestockProduct)?.name || 'Product';
    showBannerMessage(`Successfully replenished cold storage inventory! Received +${amt.toLocaleString()} kg of ${prodName}.`);
  };

  // Process sorting / priority sequencing of orders that are present
  const getActiveOrdersWithPriority = () => {
    const activeStates = ['pending', 'approved', 'in_transit'];
    const activeList = orders.filter(o => activeStates.includes(o.status));

    // Calculate priority metrics for each order
    const scoredList = activeList.map(order => {
      let baseScore = 50; // standard base

      // Factor 1: Perishability & Vulnerability
      // Tomatoes decay much faster than peppers, and Grade B Tomatoes are highly sensitive
      let vulnerabilityBonus = 0;
      let vulnerabilityReason = '';
      if (order.productType === 'tomato_b') {
        vulnerabilityBonus = 35;
        vulnerabilityReason = 'Extreme Perishability (Grade B Tomatoes require urgent transit cooling)';
      } else if (order.productType === 'tomato_a') {
        vulnerabilityBonus = 25;
        vulnerabilityReason = 'High Perishability (Grade A fresh tomatoes)';
      } else if (order.productType === 'pepper_red') {
        vulnerabilityBonus = 15;
        vulnerabilityReason = 'Medium Perishability (Ripe red sweet peppers)';
      } else {
        vulnerabilityBonus = 8;
        vulnerabilityReason = 'Standard Perishability (Fresh green bell peppers)';
      }
      baseScore += vulnerabilityBonus;

      // Factor 2: Proximity to Delivery Deadline (Urgency)
      // If deliveryDate is close, score increases dramatically. 
      // Since current time is July 4, 2026:
      let deadlineBonus = 0;
      let deadlineReason = 'Standard fulfillment window';
      try {
        const delivery = new Date(order.deliveryDate);
        const now = new Date('2026-07-04T23:40:00');
        const diffMs = delivery.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 36) {
          deadlineBonus = 45;
          deadlineReason = `Critical Timeline (< ${Math.round(diffHours)} hours remaining to SLA)`;
        } else if (diffHours > 0 && diffHours <= 72) {
          deadlineBonus = 25;
          deadlineReason = `Urgent Timeline (< ${Math.round(diffHours / 24)} days remaining to SLA)`;
        } else if (diffHours <= 0) {
          deadlineBonus = 50; // Past due
          deadlineReason = 'OVERDUE: Exceeded target SLA delivery schedule!';
        } else {
          deadlineBonus = 5;
          deadlineReason = `${Math.round(diffHours / 24)} days buffer space`;
        }
      } catch (e) {
        deadlineBonus = 10;
      }
      baseScore += deadlineBonus;

      // Factor 3: Order scale/value
      if (order.quantityKg > 10000) {
        baseScore += 10;
      }

      // Recommended courier logic based on urgency and scale
      let recommendedCarrier = 'COSCO Express Reefer';
      if (baseScore >= 110) {
        recommendedCarrier = 'DHL Express Cold Chain (Premium Air Freight)';
      } else if (baseScore >= 85) {
        recommendedCarrier = 'Maersk ColdShield (Optimal Sea Line)';
      } else if (order.quantityKg < 4000) {
        recommendedCarrier = 'Aramex Fresh Logistics (Land Freight)';
      } else {
        recommendedCarrier = 'COSCO Express Reefer (Standard Maritime)';
      }

      return {
        ...order,
        priorityScore: Math.min(100, Math.max(0, baseScore)),
        vulnerabilityReason,
        deadlineReason,
        recommendedCarrier
      };
    });

    // Handle manual sequence sorting
    // We sort by score descending first
    scoredList.sort((a, b) => b.priorityScore - a.priorityScore);

    // Apply manual override position if set in priorityOverrideIds
    if (priorityOverrideIds.length > 0) {
      // Re-order list according to the order of override IDs if they exist
      const prioritizedOverridden: typeof scoredList = [];
      const remaining: typeof scoredList = [];

      priorityOverrideIds.forEach(id => {
        const found = scoredList.find(o => o.id === id);
        if (found) prioritizedOverridden.push(found);
      });

      scoredList.forEach(o => {
        if (!priorityOverrideIds.includes(o.id)) {
          remaining.push(o);
        }
      });

      return [...prioritizedOverridden, ...remaining];
    }

    return scoredList;
  };

  // Helper: Shift priorities manually in UI
  const handleShiftPriority = (orderId: string, direction: 'up' | 'down') => {
    const currentList = getActiveOrdersWithPriority();
    const ids = currentList.map(o => o.id);
    const index = ids.indexOf(orderId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const newIds = [...ids];
      // Swap with previous
      const temp = newIds[index];
      newIds[index] = newIds[index - 1];
      newIds[index - 1] = temp;
      setPriorityOverrideIds(newIds);
      showBannerMessage(`Adjusted sequence priority of ${orderId} upward.`);
    } else if (direction === 'down' && index < ids.length - 1) {
      const newIds = [...ids];
      // Swap with next
      const temp = newIds[index];
      newIds[index] = newIds[index + 1];
      newIds[index + 1] = temp;
      setPriorityOverrideIds(newIds);
      showBannerMessage(`Adjusted sequence priority of ${orderId} downward.`);
    }
  };

  const handlePinToTop = (orderId: string) => {
    const currentList = getActiveOrdersWithPriority();
    const ids = currentList.map(o => o.id);
    const filtered = ids.filter(id => id !== orderId);
    setPriorityOverrideIds([orderId, ...filtered]);
    showBannerMessage(`Pinned order ${orderId} to absolute top priority.`);
  };

  // Dispatches a shipment (updating it to 'in_transit' or similar)
  const handleDispatchOrder = async (orderId: string, carrierName: string) => {
    setIsDispatching(prev => ({ ...prev, [orderId]: true }));
    
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) {
      setIsDispatching(prev => ({ ...prev, [orderId]: false }));
      return;
    }

    // Prepare updated order structure
    const updatedOrder: ColdChainOrder = {
      ...targetOrder,
      status: 'in_transit',
      shipperName: carrierName, // set carrier as the shipperName
      pickupDate: new Date().toISOString().split('T')[0]
    };

    try {
      if (onEditOrder) {
        await onEditOrder(updatedOrder);
      }
      showBannerMessage(`Order ${orderId} successfully dispatched via ${carrierName}! Status set to IN TRANSIT.`);
    } catch (err) {
      console.error('Error dispatching order:', err);
    } finally {
      setIsDispatching(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Fetch completed / historic orders
  const getCompletedOrders = () => {
    const completedStates = ['delivered', 'claimed', 'closed'];
    const completedList = orders.filter(o => completedStates.includes(o.status));

    if (historySearchQuery.trim() !== '') {
      const query = historySearchQuery.toLowerCase();
      return completedList.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.productName.toLowerCase().includes(query) ||
        o.buyerName.toLowerCase().includes(query) ||
        (o.shipperName && o.shipperName.toLowerCase().includes(query))
      );
    }

    return completedList;
  };

  // Active label station order
  const activeLabelOrder = orders.find(o => o.id === selectedLabelOrderId) || orders[0];

  // Simulated print trigger
  const handleSimulatedPrint = () => {
    if (!activeLabelOrder) return;
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      showBannerMessage(`✓ Thermal printed pallet label ${currentPalletIndex}/${activeLabelOrder.palletsCount} for shipment ${activeLabelOrder.id} successfully queued.`);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Dynamic Success Toast Message Notification Banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white font-sans text-xs font-bold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/30 gap-4"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-white shrink-0 animate-bounce" />
              <span>{successBanner}</span>
            </div>
            <button 
              onClick={() => setSuccessBanner(null)} 
              className="text-emerald-200 hover:text-white font-extrabold text-sm ml-auto focus:outline-none"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (LG: 5 spans): Label printing, Warehouse inventory */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Section A: Pallet Label & QR Printing Station */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-[#E63946]" /> Pallet Label & QR Station
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generate high-density thermal barcodes for physical reefer pallets
                </p>
              </div>
              <span className="bg-red-50 text-[#E63946] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-lg">
                ONLINE
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Select Freight Shipment ID</label>
                <select
                  value={selectedLabelOrderId}
                  onChange={(e) => {
                    setSelectedLabelOrderId(e.target.value);
                    setCurrentPalletIndex(1);
                  }}
                  className="w-full py-2.5 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E63946] bg-white cursor-pointer font-semibold text-slate-700"
                >
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>{order.id} - {order.productName} ({order.palletsCount} Pallets)</option>
                  ))}
                </select>
              </div>

              {activeLabelOrder ? (
                <div className="flex flex-col gap-4">
                  
                  {/* Dynamic Customization options */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Pallet Range</label>
                      <select 
                        value={currentPalletIndex}
                        onChange={(e) => setCurrentPalletIndex(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      >
                        {Array.from({ length: activeLabelOrder.palletsCount }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>Pallet {num} of {activeLabelOrder.palletsCount}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Print Copies</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10"
                        value={labelCopies} 
                        onChange={(e) => setLabelCopies(Math.max(1, Number(e.target.value)))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-center"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Thermal Settings</label>
                      <div className="flex gap-2">
                        {['203 DPI', '300 DPI', '600 DPI'].map(dpi => (
                          <button
                            key={dpi}
                            type="button"
                            onClick={() => setPrintDensity(dpi)}
                            className={`flex-1 py-1 px-2 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                              printDensity === dpi 
                                ? 'bg-slate-900 border-slate-950 text-white' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {dpi}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Physical Thermal Label Preview */}
                  <div className="border border-slate-300 rounded-2xl p-4.5 bg-amber-50/5 font-mono text-slate-800 text-xs shadow-sm relative flex flex-col gap-3 border-dashed">
                    
                    {/* Top Stripe */}
                    <div className="border-b border-dashed border-slate-300 pb-2 text-center relative">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider">PALLET SECURITY LOGISTICS PASSPORT</div>
                      <div className="text-base font-black tracking-widest text-slate-900 mt-0.5">
                        {activeLabelOrder.id}-P{String(currentPalletIndex).padStart(2, '0')}
                      </div>
                      <div className="absolute right-0 top-0 text-xl opacity-60">🏷️</div>
                    </div>

                    {/* Metadata Specs for pallet */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-700 leading-tight">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Produce Line</span>
                        <strong className="text-slate-900 font-bold">{activeLabelOrder.productName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Pallet weight</span>
                        <strong className="text-slate-900">
                          {Math.round(activeLabelOrder.quantityKg / activeLabelOrder.palletsCount).toLocaleString()} kg
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Temp Envelope</span>
                        <strong className="text-emerald-700 font-bold">
                          {activeLabelOrder.productType.startsWith('tomato') ? '+12.0°C to +14.0°C' : '+8.0°C to +10.0°C'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Transit Routing</span>
                        <strong className="text-slate-900 uppercase">{activeLabelOrder.incoterm || 'CIF'} / CN-UAE</strong>
                      </div>
                    </div>

                    {/* Serial Barcode Simulator */}
                    <div className="flex flex-col items-center justify-center py-2 bg-white rounded-xl border border-slate-150 gap-1 select-none">
                      <div className="flex h-10 items-end gap-[1.5px] px-4 w-full justify-center">
                        {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 3, 1, 2, 4, 1].map((width, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-900 h-full" 
                            style={{ width: `${width}px` }} 
                          />
                        ))}
                      </div>
                      <span className="text-[8px] tracking-widest font-mono text-slate-400 uppercase">
                        *DM-{activeLabelOrder.id}-PLT{currentPalletIndex}*
                      </span>
                    </div>

                    {/* Cryptographic QR Code containing authentic shipment parameters */}
                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-150">
                      
                      <div className="shrink-0">
                        <svg className="w-20 h-20" viewBox="0 0 100 100">
                          <rect x="5" y="5" width="90" height="90" fill="none" stroke="#0f172a" strokeWidth="2.5" />
                          
                          {/* Inner blocks */}
                          <rect x="12" y="12" width="20" height="20" fill="#0f172a" />
                          <rect x="16" y="16" width="12" height="12" fill="#fff" />
                          <rect x="19" y="19" width="6" height="6" fill="#0f172a" />

                          <rect x="68" y="12" width="20" height="20" fill="#0f172a" />
                          <rect x="72" y="16" width="12" height="12" fill="#fff" />
                          <rect x="75" y="19" width="6" height="6" fill="#0f172a" />

                          <rect x="12" y="68" width="20" height="20" fill="#0f172a" />
                          <rect x="16" y="72" width="12" height="12" fill="#fff" />
                          <rect x="19" y="75" width="6" height="6" fill="#0f172a" />

                          {/* Center locator anchor */}
                          <rect x="44" y="44" width="12" height="12" fill="#0f172a" />

                          {/* Custom Noise simulation */}
                          <rect x="38" y="12" width="4" height="12" fill="#0f172a" />
                          <rect x="48" y="18" width="8" height="4" fill="#0f172a" />
                          <rect x="60" y="12" width="4" height="8" fill="#0f172a" />
                          <rect x="38" y="28" width="12" height="4" fill="#0f172a" />
                          <rect x="54" y="28" width="10" height="10" fill="#0f172a" />
                          
                          <rect x="68" y="38" width="8" height="4" fill="#0f172a" />
                          <rect x="80" y="44" width="8" height="12" fill="#0f172a" />
                          <rect x="68" y="60" width="14" height="4" fill="#0f172a" />

                          <rect x="12" y="38" width="4" height="12" fill="#0f172a" />
                          <rect x="24" y="44" width="12" height="4" fill="#0f172a" />
                          <rect x="18" y="56" width="12" height="6" fill="#0f172a" />

                          <rect x="38" y="68" width="12" height="10" fill="#0f172a" />
                          <rect x="54" y="74" width="8" height="4" fill="#0f172a" />
                          <rect x="68" y="68" width="12" height="12" fill="#0f172a" />
                        </svg>
                      </div>

                      <div className="flex-1 text-[9px] text-slate-500 font-mono leading-normal flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 text-[10px]">QR Verification String:</span>
                        <div className="truncate max-w-[170px] text-slate-600 bg-slate-50 p-1 rounded border">
                          {`{"id":"${activeLabelOrder.id}","plt":${currentPalletIndex},"wt":${Math.round(activeLabelOrder.quantityKg/activeLabelOrder.palletsCount)},"temp":"${activeLabelOrder.productType.startsWith('tomato')?'12-14C':'8-10C'}","v_hash":"sha256_df78391ab"}`}
                        </div>
                        <span className="text-[8px] text-[#E63946] font-bold mt-1">✓ GCC SMART TAG REGISTERED</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSimulatedPrint}
                        disabled={isPrinting}
                        className="w-full bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-black py-2.5 px-4 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> 
                        {isPrinting ? 'PRINTING LABEL...' : 'Trigger Thermal Pallet Print'}
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No active orders found to print labels
                </div>
              )}

            </div>
          </div>

          {/* Section B: Warehouse Cold-Storage Inventory */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600 animate-pulse" /> Warehouse Cold-Storage
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Consolidated produce balance currently in central stock
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg">
                STOCK CONTROL
              </span>
            </div>

            {/* Bars */}
            <div className="flex flex-col gap-4">
              {inventory.map(item => {
                const percentage = Math.round((item.stockKg / item.maxCapacityKg) * 100);
                const isLow = item.stockKg < 10000;

                return (
                  <div key={item.key} className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between font-medium items-center">
                      <span className="text-slate-800 font-bold flex items-center gap-1.5">
                        {item.category === 'tomato' ? '🍅' : '🌶️'} {item.name}
                        <span className="text-[9px] font-mono font-normal text-slate-400">({item.bayNumber})</span>
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">
                        {item.stockKg.toLocaleString()} kg / {item.maxCapacityKg.toLocaleString()} kg
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/30">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow 
                            ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Detailed info lines */}
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5 px-0.5">
                      <span>BAY TEMP: <strong className="text-slate-600">{item.temperatureCelsius}°C</strong></span>
                      <span>COMMITTED / ALLOCATED: <strong className="text-slate-600">{item.allocatedKg.toLocaleString()} kg</strong></span>
                      <span>AVAILABLE SPACE: <strong className="text-slate-600">{(item.maxCapacityKg - item.stockKg).toLocaleString()} kg</strong></span>
                    </div>

                    {isLow && (
                      <div className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 mt-1 bg-red-50/60 p-2 rounded-xl border border-red-100/60 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> 
                        <span>Safety threshold alert: Stock level critically below 10 tons!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Receival Stock Simulation Panel */}
            <form onSubmit={handleRestock} className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Receive & Stock Replenishment Simulator
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedRestockProduct}
                  onChange={(e) => setSelectedRestockProduct(e.target.value as any)}
                  className="py-1.5 px-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  {inventory.map(item => (
                    <option key={item.key} value={item.key}>{item.name}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <input 
                    type="number" 
                    placeholder="Amount (kg)"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                  />
                  <span className="text-xs self-center text-slate-400 font-mono">kg</span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Replenish Stock / Receive Inventory
              </button>
            </form>

          </div>

        </div>

        {/* RIGHT COLUMN (LG: 7 spans): Sequences & Orders, Dispatch History */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Section C: Prioritized Shipment Dispatch Queue */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Layers3 className="w-5 h-5 text-indigo-600" /> Priority Dispatch Sequence
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Algorithmic queuing of pending shipments based on commodity decay vulnerability and deadline countdowns
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-indigo-50 text-indigo-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg">
                  SLA ALGORITHM v2.1
                </span>
              </div>
            </div>

            {/* List of Prioritized Orders */}
            <div className="flex flex-col gap-4">
              {getActiveOrdersWithPriority().length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-3">
                  <PackageOpen className="w-10 h-10 text-slate-300" />
                  <span>No orders are currently waiting in the pending queue.</span>
                </div>
              ) : (
                getActiveOrdersWithPriority().map((order, idx) => {
                  const currentCarrier = assignedCarriers[order.id] || order.recommendedCarrier.split(' (')[0];
                  const priorityClass = order.priorityScore >= 85 
                    ? 'border-l-4 border-l-red-500 bg-red-50/10' 
                    : order.priorityScore >= 65 
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/10' 
                    : 'border-l-4 border-l-slate-200';

                  return (
                    <div 
                      key={order.id} 
                      className={`border border-slate-200/70 p-4.5 rounded-2xl flex flex-col gap-3 transition-all hover:shadow-md ${priorityClass}`}
                    >
                      {/* Top Rank, ID, Status bar */}
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black font-mono">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-800 tracking-wider">
                            {order.id}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                            order.status === 'pending' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                              : order.status === 'approved' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Priority Score badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">Priority Index:</span>
                          <span className={`text-xs font-mono font-black py-0.5 px-2.5 rounded-lg ${
                            order.priorityScore >= 85 
                              ? 'bg-red-100 text-red-800' 
                              : order.priorityScore >= 65 
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {order.priorityScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Content Specs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-dashed border-slate-100 pb-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[9px] uppercase block">Consignment</span>
                          <strong className="text-slate-800 font-bold">{order.productName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] uppercase block">Volume & Pallets</span>
                          <strong className="text-slate-800">{order.quantityKg.toLocaleString()} kg ({order.palletsCount} plt)</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] uppercase block">Delivery Target</span>
                          <strong className="text-slate-800 font-mono">{order.deliveryDate}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] uppercase block">Consignee</span>
                          <strong className="text-slate-800 truncate block">{order.buyerName}</strong>
                        </div>
                      </div>

                      {/* AI Priority Reasoning details */}
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-[10px] leading-relaxed flex flex-col gap-1.5 text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>SEQUENCE DECISION METRIC</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-500">
                          <div>• <strong className="text-slate-600">Vulnerability:</strong> {order.vulnerabilityReason}</div>
                          <div>• <strong className="text-slate-600">Timeline:</strong> {order.deadlineReason}</div>
                        </div>
                      </div>

                      {/* Carrier assignment & action controls */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                        
                        {/* Carrier Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Carrier:</span>
                          <select
                            value={currentCarrier}
                            onChange={(e) => setAssignedCarriers(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="bg-white border border-slate-200 py-1 px-2 rounded-lg text-xs font-medium cursor-pointer focus:outline-none"
                          >
                            {CARRIERS.map(c => (
                              <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Interactive sequences adjuster & Action */}
                        <div className="flex items-center gap-1.5 self-end md:self-auto">
                          
                          {/* Manual shift buttons */}
                          <div className="flex gap-1" title="Adjust sequencing manually">
                            <button
                              type="button"
                              onClick={() => handleShiftPriority(order.id, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                              title="Move sequence up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftPriority(order.id, 'down')}
                              disabled={idx === getActiveOrdersWithPriority().length - 1}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                              title="Move sequence down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePinToTop(order.id)}
                              className="px-2 py-1 text-[9px] uppercase font-bold border border-indigo-200 text-indigo-700 rounded-lg bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer"
                              title="Force pin order to rank #1 priority"
                            >
                              Pin Top
                            </button>
                          </div>

                          {/* Dispatch action button */}
                          <button
                            type="button"
                            onClick={() => handleDispatchOrder(order.id, currentCarrier)}
                            disabled={isDispatching[order.id] || order.status === 'in_transit'}
                            className={`py-1.5 px-3 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1 ${
                              order.status === 'in_transit'
                                ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            {isDispatching[order.id] ? 'DISPATCHING...' : order.status === 'in_transit' ? 'DISPATCHED' : 'Dispatch Shipment'}
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Section D: Dispatch & Completed Orders History */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600 animate-spin-slow" style={{ animationDuration: '20s' }} /> Completed Dispatches History
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Archived shipment ledger of delivered and closed cold-chain freight consignments
                </p>
              </div>
              <div className="relative shrink-0 w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-600 font-medium"
                />
              </div>
            </div>

            {/* List of completed/delivered orders */}
            <div className="overflow-x-auto">
              {getCompletedOrders().length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-mono">
                  No completed delivery records found in archive.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                      <th className="py-2.5 px-3">Shipment ID</th>
                      <th className="py-2.5 px-3">Commodity Type</th>
                      <th className="py-2.5 px-3">Delivered Weight</th>
                      <th className="py-2.5 px-3">Courier Carrier</th>
                      <th className="py-2.5 px-3">Completion Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCompletedOrders().map(o => (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.id}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700">{o.productName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {o.quantityKg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-600 flex items-center gap-1">
                          🚚 {o.shipperName || 'Registered Courier'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 border border-emerald-100">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
