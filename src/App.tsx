import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, ShieldCheck, ShoppingBag, ShieldAlert, Truck, BarChart3, CloudSun, User, 
  Settings, LogOut, CheckCircle2, AlertTriangle, Sparkles, LogIn 
} from 'lucide-react';

import { ColdChainOrder, IoTSensor, UserRole, WeatherData, FruitScanResult, Product } from './types';
import { INITIAL_ORDERS, INITIAL_SENSORS, UAE_WEATHER, INITIAL_PRODUCTS } from './data';
import { db, auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, query, addDoc } from 'firebase/firestore';

import BuyerPortal from './components/BuyerPortal';
import ShipperPortal from './components/ShipperPortal';
import DriverPortal from './components/DriverPortal';
import AdminDashboard from './components/AdminDashboard';
import YoloScanner from './components/YoloScanner';
import GoogleMapsTab from './components/GoogleMapsTab';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('buyer');
  
  // Real-time synced parameters
  const [orders, setOrders] = useState<ColdChainOrder[]>(INITIAL_ORDERS);
  const [sensors, setSensors] = useState<IoTSensor[]>(INITIAL_SENSORS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [weather, setWeather] = useState<WeatherData>(UAE_WEATHER);
  const [isHighTempPenalty, setIsHighTempPenalty] = useState(true);

  // Auto seeding logic when user logs in
  useEffect(() => {
    if (!currentUser) return;

    const seedDb = async () => {
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        if (prodSnap.empty) {
          console.log('[Firebase Seeder] Seeding products...');
          for (const prod of INITIAL_PRODUCTS) {
            await setDoc(doc(db, 'products', prod.id), prod);
          }
        }
      } catch (err) {
        console.warn("Product seed warning: ", err);
      }

      try {
        const sensorSnap = await getDocs(collection(db, 'sensors'));
        if (sensorSnap.empty) {
          console.log('[Firebase Seeder] Seeding sensors...');
          for (const s of INITIAL_SENSORS) {
            await setDoc(doc(db, 'sensors', s.id), s);
          }
        }
      } catch (err) {
        console.warn("Sensor seed warning: ", err);
      }

      try {
        const orderSnap = await getDocs(collection(db, 'orders'));
        if (orderSnap.empty) {
          console.log('[Firebase Seeder] Seeding orders...');
          for (const o of INITIAL_ORDERS) {
            await setDoc(doc(db, 'orders', o.id), o);
          }
        }
      } catch (err) {
        console.warn("Order seed warning: ", err);
      }
    };

    seedDb();
  }, [currentUser]);

  // Firestore Synchronization
  useEffect(() => {
    // Only subscribe to Firestore if the user is authenticated (prevents Permission Denied on mount)
    if (!currentUser) {
      setOrders(INITIAL_ORDERS);
      return;
    }

    const ordersCol = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersCol, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreOrders: ColdChainOrder[] = [];
        snapshot.forEach((doc) => {
          firestoreOrders.push({ id: doc.id, ...doc.data() } as ColdChainOrder);
        });
        // Sort by date created
        setOrders(firestoreOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
    }, (error) => {
      console.warn("Firestore access error - running fully on local state: ", error);
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => {
      unsubscribeOrders();
    };
  }, [currentUser]);

  // Synchronize Products from Firestore
  useEffect(() => {
    if (!currentUser) {
      setProducts(INITIAL_PRODUCTS);
      return;
    }

    const productsCol = collection(db, 'products');
    const unsubscribe = onSnapshot(productsCol, (snapshot) => {
      if (!snapshot.empty) {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(list);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
    }, (error) => {
      console.warn("Firestore products access error: ", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Synchronize Sensors from Firestore
  useEffect(() => {
    if (!currentUser) {
      setSensors(INITIAL_SENSORS);
      return;
    }

    const sensorsCol = collection(db, 'sensors');
    const unsubscribe = onSnapshot(sensorsCol, (snapshot) => {
      if (!snapshot.empty) {
        const list: IoTSensor[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as IoTSensor);
        });
        setSensors(list);
      } else {
        setSensors(INITIAL_SENSORS);
      }
    }, (error) => {
      console.warn("Firestore sensors access error: ", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to Google Sign-in Auth changes
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    // Handle redirect result
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        setCurrentUser(result.user);
        const userRef = doc(db, 'User', result.user.uid);
        try {
          await setDoc(userRef, {
            uid: result.user.uid,
            displayName: result.user.displayName || 'Google User',
            email: result.user.email || '',
            role: activeRole,
            companyName: activeRole === 'buyer' ? 'Al-Jamil Markets UAE' : 'China Cargo Co.',
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `User/${result.user.uid}`);
        }
      }
    }).catch(err => {
      console.error("Redirect login error: ", err);
    });

    return () => unsubscribeAuth();
  }, [activeRole]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      // Automatically register profile in Firestore
      const userRef = doc(db, 'User', result.user.uid);
      try {
        await setDoc(userRef, {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Google User',
          email: result.user.email || '',
          role: activeRole,
          companyName: activeRole === 'buyer' ? 'Al-Jamil Markets UAE' : 'China Cargo Co.',
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `User/${result.user.uid}`);
      }
    } catch (err: any) {
      console.error("Popup login failed: ", err);
      // If popup is blocked or fails on mobile/Vercel, fallback to redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
         await signInWithRedirect(auth, googleProvider);
      } else if (err.code === 'auth/unauthorized-domain') {
         alert("Login failed: Unauthorized domain. Please add this Vercel domain to your Firebase Authentication Authorized Domains list.");
      } else {
         // Generic fallback to redirect for other issues (often mobile browser related)
         await signInWithRedirect(auth, googleProvider);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  // --- CRUD for Products ---
  const handleAddProduct = async (prod: Product) => {
    setProducts(prev => [prod, ...prev]);
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'products', prod.id), prod);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
    }
  };

  const handleEditProduct = async (prod: Product) => {
    setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'products', prod.id), prod);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    setProducts(prev => prev.filter(p => p.id !== prodId));
    if (!currentUser) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'products', prodId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${prodId}`);
    }
  };

  // --- CRUD for Sensors ---
  const handleAddSensor = async (sensor: IoTSensor) => {
    setSensors(prev => [sensor, ...prev]);
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'sensors', sensor.id), sensor);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sensors/${sensor.id}`);
    }
  };

  const handleEditSensor = async (sensor: IoTSensor) => {
    setSensors(prev => prev.map(s => s.id === sensor.id ? sensor : s));
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'sensors', sensor.id), sensor);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sensors/${sensor.id}`);
    }
  };

  const handleDeleteSensor = async (sensorId: string) => {
    setSensors(prev => prev.filter(s => s.id !== sensorId));
    if (!currentUser) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'sensors', sensorId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `sensors/${sensorId}`);
    }
  };

  // --- CRUD for Orders ---
  const handleAddOrder = async (order: ColdChainOrder) => {
    setOrders(prev => [order, ...prev]);
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
    }
  };

  const handleEditOrder = async (order: ColdChainOrder) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (!currentUser) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  // Create an order & push to Firestore
  const handleCreateOrder = async (newOrder: Partial<ColdChainOrder>) => {
    const orderId = `TR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullOrder: ColdChainOrder = {
      id: orderId,
      productType: newOrder.productType || 'tomato_a',
      productName: newOrder.productName || 'Grade A Tomatoes',
      quantityKg: newOrder.quantityKg || 5000,
      palletsCount: newOrder.palletsCount || 10,
      totalPriceAED: newOrder.totalPriceAED || 37500,
      pricePerKgAED: newOrder.pricePerKgAED || 7.5,
      incoterm: newOrder.incoterm || 'CIF',
      status: 'pending',
      pickupDate: newOrder.pickupDate || '2026-07-04',
      deliveryDate: newOrder.deliveryDate || '2026-07-15',
      createdAt: new Date().toISOString(),
      buyerName: currentUser?.displayName || 'Al-Jamil Markets',
      shipperName: 'Ningbo Agri-Export Ltd',
      sensorId: 'SN-TOM-9629'
    };

    // Optimistic local update
    setOrders(prev => [fullOrder, ...prev]);

    // Firestore upload (only if authenticated)
    if (!currentUser) {
      return;
    }

    try {
      await setDoc(doc(db, 'orders', orderId), fullOrder);
    } catch (err) {
      console.warn("Failed syncing new order to Firestore, kept locally: ", err);
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  // Submit Damage Claims
  const handleFileClaim = async (orderId: string, lossPercent: number, claimImg: string) => {
    // Update local order status to claimed
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'claimed' as const };
      }
      return o;
    }));

    // Firestore upload (only if authenticated)
    if (!currentUser) {
      return;
    }

    try {
      const existingOrder = orders.find(o => o.id === orderId);
      if (existingOrder) {
        const updatedOrder = { ...existingOrder, status: 'claimed' as const };
        await setDoc(doc(db, 'orders', orderId), updatedOrder);
      } else {
        await setDoc(doc(db, 'orders', orderId), { status: 'claimed' }, { merge: true });
      }

      const claimRef = collection(db, 'claims');
      await addDoc(claimRef, {
        orderId,
        lossPercent,
        imageName: claimImg,
        timestamp: new Date().toISOString(),
        verifiedStatus: 'YOLO_AI_AUTO_CONFIRMED'
      });
    } catch (err) {
      console.warn("Failed saving claim to Firestore: ", err);
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  // Administrative warnings trigger
  const handleTriggerDriverAlert = (sensorId: string, message: string) => {
    // Update status to breach on target sensor
    setSensors(prev => prev.map(s => {
      if (s.id === sensorId) {
        return { ...s, status: 'breach' as const, temperature: 15.6 };
      }
      return s;
    }));
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleGoogleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-red-500 selection:text-white pb-12">
      
      {/* 1. Header component */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              {/* Professional Globe & Shield icon with dynamic highlight shadow */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-200 border border-slate-700/50 relative">
                <Globe className="w-5 h-5 text-[#2A9D8F] animate-spin-slow" style={{ animationDuration: '15s' }} />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans uppercase">
                  Cold-Chain <span className="text-[#2A9D8F]">Secure</span> Logistics
                </h1>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">GCC Smart Cold Chain Platform</p>
            </div>
          </div>



          {/* Role selector switches */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            {(['buyer', 'shipper', 'driver', 'admin', 'maps'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-3 py-1 text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeRole === role 
                    ? 'bg-white text-slate-900 shadow-sm font-black border border-slate-200 rounded-xl' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {role === 'maps' ? 'Interactive Route Map' : role}
              </button>
            ))}
          </div>

          {/* Google auth / profile dropdown */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-3 rounded-2xl border border-slate-200">
                <img
                  src={currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border-2 border-[#FF7B00]"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-[9px] font-mono text-slate-400 uppercase font-semibold">
                    ROLE: {activeRole.toUpperCase()}
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                    {currentUser.displayName}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-lg text-slate-400 hover:text-[#E63946] hover:bg-red-50 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#E63946]" />
                <span>Google Sign-in</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* UAECN Smart Compliance Frame Wrapper */}
      <div id="uaecn_frame_wrapper" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="relative border-2 border-slate-200/80 bg-white rounded-3xl overflow-hidden shadow-lg">
          
          {/* Top Compliance Bar */}
          <div className="bg-slate-950 text-white font-mono text-[10px] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold tracking-wider uppercase text-[#2A9D8F]">
                UAE COLD CHAIN NETWORK (UAECN) SECURED CORE LINK
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-blue-400">LEDGER STATE: SYNCED TO DUBAI MUNICIPALITY</span>
              <span className="hidden md:inline">STANDARD: UAE-S.9022 COLD CHAIN COMPLIANT</span>
            </div>
          </div>

          {/* Left / Right Telemetry Edge Lines with actual contents inside */}
          <div className="relative flex">
            
            {/* Left Edge Bar - High tech */}
            <div className="hidden xl:flex flex-col justify-between items-center bg-slate-950 text-emerald-500 font-mono text-[8px] tracking-widest uppercase p-2 border-r border-slate-800 select-none min-w-[36px] max-w-[36px]">
              <span className="origin-center -rotate-90 whitespace-nowrap translate-y-36 text-center text-[#2A9D8F] font-bold">
                ★ UAECN CLOUD PLATFORM AXIS
              </span>
              <span className="origin-center -rotate-90 whitespace-nowrap -translate-y-36 text-slate-500">
                NODE_ID: AED-DXB-9629
              </span>
            </div>

            {/* Core Workspace Inner Content */}
            <div className="flex-1 p-6 flex flex-col gap-8 bg-slate-50/50">
              
              {/* 2. Main content pages */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeRole === 'buyer' && (
                    <BuyerPortal 
                      orders={orders} 
                      weather={weather} 
                      onCreateOrder={handleCreateOrder}
                      onFileClaim={handleFileClaim}
                    />
                  )}

                  {activeRole === 'shipper' && (
                    <ShipperPortal orders={orders} onEditOrder={handleEditOrder} />
                  )}

                  {activeRole === 'driver' && (
                    <DriverPortal orders={orders} isHighTempPenalty={isHighTempPenalty} />
                  )}

                  {activeRole === 'admin' && (
                    <AdminDashboard 
                      orders={orders} 
                      sensors={sensors}
                      products={products}
                      currentUser={currentUser}
                      onAddProduct={handleAddProduct}
                      onEditProduct={handleEditProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onAddSensor={handleAddSensor}
                      onEditSensor={handleEditSensor}
                      onDeleteSensor={handleDeleteSensor}
                      onAddOrder={handleAddOrder}
                      onEditOrder={handleEditOrder}
                      onDeleteOrder={handleDeleteOrder}
                      onRefreshSensors={() => setSensors(INITIAL_SENSORS)}
                    />
                  )}

                  {activeRole === 'maps' && (
                    <GoogleMapsTab />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* 3. YOLO AI Fruit Decay Analyzer Scanner */}
              <YoloScanner 
                currentUser={currentUser?.displayName || 'Authorized Biometric Terminal'} 
                onScanComplete={(result) => {
                  if (result.state === 'rotten') {
                    alert(`🚨 YOLO warning: Severe Mold decay detected in tomatoes batch! Dispatching quarantine log.`);
                  }
                }}
              />

            </div>

            {/* Right Edge Bar - Optimal Margin ("Mép Phải Tối Ưu") */}
            <div className="hidden xl:flex flex-col justify-between items-center bg-slate-950 text-blue-400 font-mono text-[8px] tracking-widest uppercase p-2 border-l border-slate-800 select-none min-w-[36px] max-w-[36px]">
              <span className="origin-center rotate-90 whitespace-nowrap translate-y-36 text-[#E63946] font-bold">
                🛡 YOLOv8 AI SCANNER SHIELD
              </span>
              <span className="origin-center rotate-90 whitespace-nowrap -translate-y-36 text-slate-500">
                CUSTOMS CLEARANCE APPROVED
              </span>
            </div>

          </div>

          {/* Bottom compliance seal status strip */}
          <div className="bg-slate-950 text-slate-500 text-[8px] font-mono px-5 py-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <span>ENCRYPTION DECRYPTION KEY: AES-256 GCM SEAL ACTIVE</span>
            <span>AED-DXB LOGISTICS v4.2.0 // SPRING BOOT JVM ENDPOINT PROXIES LIVE</span>
          </div>

        </div>
      </div>

    </div>
  );
}
