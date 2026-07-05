import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, Calendar, Clock, CloudSun, Leaf, ShieldCheck, Ship, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ColdChainOrder, WeatherData } from '../types';
import { predictFreshnessLoss } from '../utils';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface BuyerPortalProps {
  orders: ColdChainOrder[];
  weather: WeatherData;
  onCreateOrder: (newOrder: Partial<ColdChainOrder>) => void;
  onFileClaim: (orderId: string, lossPercent: number, claimImg: string) => void;
}

export default function BuyerPortal({ orders, weather, onCreateOrder, onFileClaim }: BuyerPortalProps) {
  // Order form state
  const [productType, setProductType] = useState<'tomato_a' | 'tomato_b' | 'pepper_red' | 'pepper_green'>('tomato_a');
  const [quantity, setQuantity] = useState<number>(5000);
  const [incoterm, setIncoterm] = useState<'CIF' | 'FOB'>('CIF');
  const [shippingDate, setShippingDate] = useState<string>('2026-08-15');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  // Product metadata with engaging descriptions and high-quality images
  const productsMeta = {
    tomato_a: { 
      name: 'Grade A Premium Tomatoes', 
      price: 7.5, 
      optimalTemp: '12°C - 14°C', 
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
      description: 'Hand-picked, perfectly ripe tomatoes ideal for premium retail. Guaranteed vibrant color and firm texture upon delivery.'
    },
    tomato_b: { 
      name: 'Grade B Fresh Tomatoes', 
      price: 5.5, 
      optimalTemp: '12°C - 14°C', 
      image: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Tomato.jpg',
      description: 'Excellent for processing, sauces, and culinary use. Cost-effective with maintained freshness standards.'
    },
    pepper_red: { 
      name: 'Premium Red Hot Peppers', 
      price: 9.0, 
      optimalTemp: '8°C - 10°C', 
      image: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Red_capsicum_and_cross_section.jpg',
      description: 'Spicy, bright, and crisp. Cultivated for peak capsaicin levels and robust flavor profiles.'
    },
    pepper_green: { 
      name: 'Sweet Green Bell Peppers', 
      price: 6.0, 
      optimalTemp: '8°C - 10°C', 
      image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Green-Yellow-Red-Pepper-2009.jpg',
      description: 'Crunchy and sweet bell peppers. High water content preserved through our strict cold chain protocol.'
    }
  };

  const pallets = Math.ceil(quantity / 500);
  const pricePerKg = productsMeta[productType].price;
  const baseCost = quantity * pricePerKg;
  const shippingCost = incoterm === 'CIF' ? pallets * 1250 : 0;
  const insuranceCost = incoterm === 'CIF' ? baseCost * 0.03 : 0;
  const totalCostAED = baseCost + shippingCost + insuranceCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderStatus('processing');

    try {
      // Save Bill to Firestore
      await addDoc(collection(db, 'Bill'), {
        orderSummary: {
          produceCost: baseCost,
          marineFreight: shippingCost,
          cargoInsurance: insuranceCost,
          quantity: quantity,
          incoterm: incoterm,
          deliveryDate: shippingDate
        },
        productCode: productType,
        totalBill: totalCostAED,
        timestamp: new Date().toISOString(),
        buyerName: 'Al-Jamil Markets'
      });

      // Existing local order creation logic
      onCreateOrder({
        productType,
        productName: productsMeta[productType].name,
        quantityKg: quantity,
        palletsCount: pallets,
        totalPriceAED: totalCostAED,
        pricePerKgAED: pricePerKg,
        incoterm,
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: shippingDate,
        buyerName: 'Al-Jamil Markets',
        shipperName: 'Ningbo Agri-Export Ltd'
      });
      
      setOrderStatus('completed');
      
      // Return to Place Secure Order after 3 seconds
      setTimeout(() => {
        setOrderStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error("Error creating bill:", error);
      alert("Failed to place order. Please try again.");
      setOrderStatus('idle');
    }
  };

  // Run Random Forest predicted freshness decay
  const currentLossPrediction = predictFreshnessLoss(
    productType,
    13.4, // avg temp
    360, // 15 days sea route in hours
    72 // avg humidity
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-8 md:p-12 shadow-xl border border-emerald-500/20">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=1600')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1.5 w-max">
              <Leaf className="w-3.5 h-3.5" /> Premium Fresh Produce
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-white font-sans leading-tight">
              Direct from Farms to Your Facilities
            </h1>
            <p className="text-base text-slate-300 mt-4 leading-relaxed">
              Experience unparalleled transparency with our Smart Cold Chain platform. We guarantee the freshness of every shipment from our agricultural terminals directly to Jebel Ali Port.
            </p>
          </div>

          {/* Destination Weather Widget */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 flex items-center gap-5 shadow-2xl shrink-0">
            <CloudSun className="w-12 h-12 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-widest font-mono font-bold mb-1">Jebel Ali Destination</div>
              <div className="text-sm text-slate-200 flex items-center gap-1.5 mt-1">
                <span>Humidity {weather.humidity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us / Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Guaranteed Freshness</h3>
          <p className="text-sm text-slate-500 leading-relaxed">AI-driven predictive loss models ensure you only pay for usable, fresh produce upon arrival.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
            <Ship className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Seamless Logistics</h3>
          <p className="text-sm text-slate-500 leading-relaxed">End-to-end handling from port to port. We manage the reefers, you manage your business.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Real-time Visibility</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Monitor your shipment's temperature, location, and humidity 24/7 during transit.</p>
        </div>
      </div>

      {/* Main Order Section */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Select Your Produce
          </h2>
          <p className="text-slate-500 text-sm">Choose from our freshly harvested selections, carefully maintained at optimal temperatures.</p>
        </div>

        {/* Visual Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(productsMeta).map(([type, meta]) => {
            const isSelected = productType === type;
            return (
              <button
                type="button"
                key={type}
                onClick={() => setProductType(type as any)}
                className={`flex flex-col text-left transition-all duration-300 rounded-3xl overflow-hidden cursor-pointer relative group ${
                  isSelected 
                    ? 'ring-4 ring-emerald-500 ring-offset-4 shadow-xl scale-[1.02]' 
                    : 'border border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                  <img src={meta.image} alt={meta.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black text-slate-900 shadow-sm">
                    AED {meta.price} <span className="text-slate-500 font-normal">/ KG</span>
                  </div>
                </div>
                <div className="p-5 bg-white flex flex-col flex-1">
                  <h3 className={`font-bold text-lg mb-2 ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>{meta.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 flex-1 leading-relaxed">{meta.description}</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-mono font-semibold w-max border border-slate-100">
                    <CloudSun className="w-3.5 h-3.5" /> Optimal: {meta.optimalTemp}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg z-10 animate-bounce">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Order Details & Submission Form */}
        <div className="mt-6 pt-10 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" /> Purchase Order Details
              </h3>
              
              <div className="flex flex-col gap-6">
                {/* Quantity Slider */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Procurement Quantity</label>
                      <span className="text-xs text-slate-500 mt-1 block">Adjust the required volume in kilograms</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-2xl font-black text-emerald-600">{quantity.toLocaleString()}</span>
                      <span className="text-slate-500 text-sm font-bold ml-1">KG</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-3 font-mono font-semibold">
                    <span>Min: 1,000 kg</span>
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Requires {pallets} Pallets (500kg/plt)</span>
                    <span>Max: 20,000 kg</span>
                  </div>
                </div>

                {/* Date & Incoterms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-bold text-slate-700">Required Delivery Date</label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3" />
                      <input
                        type="date"
                        value={shippingDate}
                        onChange={(e) => setShippingDate(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700 shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-bold text-slate-700">Incoterms Strategy</label>
                    <select
                      value={incoterm}
                      onChange={(e) => setIncoterm(e.target.value as any)}
                      className="w-full py-3 px-4 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer font-medium text-slate-700 shadow-sm appearance-none"
                    >
                      <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                      <option value="FOB">FOB (Free on Board - Self Freight)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 p-24 bg-blue-500/10 rounded-full blur-3xl" />
              
              <h3 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2">
                Order Summary
              </h3>

              <div className="flex flex-col gap-4 text-sm relative z-10">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-slate-400">Produce Selected</span>
                  <span className="font-semibold text-right max-w-[150px] truncate">{productsMeta[productType].name}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-slate-400">Produce Cost ({quantity.toLocaleString()} kg)</span>
                  <span className="font-mono">AED {baseCost.toLocaleString()}</span>
                </div>
                
                {incoterm === 'CIF' && (
                  <>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-slate-400">Marine Freight ({pallets} plts)</span>
                      <span className="font-mono">AED {shippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-slate-400">Cargo Insurance (3%)</span>
                      <span className="font-mono">AED {insuranceCost.toLocaleString()}</span>
                    </div>
                  </>
                )}

                <div className="pt-4 flex justify-between items-center mt-2">
                  <span className="text-lg text-slate-300">Total Bill</span>
                  <span className="font-mono text-3xl font-black text-emerald-400">AED {totalCostAED.toLocaleString()}</span>
                </div>
              </div>

              {/* AI Prediction Widget */}
              <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl relative z-10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">AI Freshness Predictor</div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">Based on the shipping route and current parameters, our Random Forest model predicts a minimal freshness loss of only <strong className="text-white">{currentLossPrediction.lossPercent}%</strong> upon arrival.</p>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                      {currentLossPrediction.riskLevel} Risk Profile
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={orderStatus !== 'idle'}
                className={`w-full font-black text-base py-4 px-6 rounded-2xl transition-all shadow-lg mt-8 cursor-pointer flex items-center justify-center gap-2 relative z-10 ${
                  orderStatus === 'completed'
                    ? 'bg-emerald-400 text-white shadow-emerald-400/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20'
                } disabled:opacity-70`}
              >
                {orderStatus === 'processing' && 'PROCESSING...'}
                {orderStatus === 'completed' && (
                  <>COMPLETED <CheckCircle2 className="w-5 h-5" /></>
                )}
                {orderStatus === 'idle' && (
                  <>PLACE SECURE ORDER <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
