/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  getDocFromServer,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { 
  CheckCircle2,
  Camera, 
  ArrowLeft,
  QrCode,
  Sparkles,
  LogOut,
  Languages,
  ImageIcon,
  Save,
  MapPin,
  Upload,
  AlertCircle,
  Truck,
  User,
  MessageSquare,
  Phone,
  Settings,
  X,
  Palette,
  Star,
  ShieldCheck,
  Info,
  Calendar,
  Trash2,
  Music,
  ClipboardList,
  LogIn
} from 'lucide-react';
import { auth, db, DATA_PATH } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/utils';
import { Product, Customer, Greeting, Customization, Order, ShopConfig } from './types';

// --- Admin Credentials ---
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

// --- Inventory Limits ---
const STOCK_LIMITS: Record<string, number> = {
  tiramisu: 12,
  bracelet: 3,
  mystery: 12,
  art: Infinity
};

// --- Localization ---
const I18N: Record<string, any> = {
  en: {
    shopTitle: "CvL Co.",
    shopSub: "Limited Student Dessert & Handcraft Pre-order",
    pickupLocation: "ADDA HEIGHTS",
    pickupDates: "May 3 / May 4",
    pickupAvailable: "Pickup available on May 3 and May 4",
    itemsTitle: "Our Creations",
    fillOrder: "1. Order Details",
    deliveryTitle: "Delivery Method",
    selfPickup: "Self Pickup",
    lalamove: "Lalamove Delivery",
    lalamoveNote: "Note: Delivery fee will be paid by customer separately.",
    lalamoveContact: "Please contact shop owner before arranging delivery.",
    nameLabel: "Full Name",
    igLabel: "Instagram (IG) Username",
    phoneLabel: "Phone Number (WhatsApp)",
    cardService: "Greeting Card Service",
    noCard: "No Card",
    standardCard: "Greeting Card (+RM0.5)",
    messageLabel: "Message for the card",
    messagePlaceholder: "Write your wishes here...",
    grandTotal: "Total Amount",
    placeOrder: "PROCEED TO PAYMENT",
    backToEdit: "Back to Edit",
    waitingPayment: "2. Scan to Pay",
    paymentInstruct: "Please complete payment and upload your receipt",
    contactOwner: "After payment, please contact the shop owner via WhatsApp to confirm your order:",
    uploadProof: "3. Upload Payment Screenshot",
    submitProof: "COMPLETE TRANSACTION",
    orderSuccess: "Order Received!",
    successMsg: "Payment proof submitted. We will verify your transaction shortly.",
    successContact: "Please contact the shop owner via WhatsApp to confirm your order: 014-3655393",
    adminLogin: "Admin Access",
    dashboard: "Admin Dashboard",
    assetsTitle: "Shop Management",
    updateSuccess: "Settings Updated!",
    mustUpload: "Payment proof is required to complete the order.",
    artUploadLabel: "Upload image for your custom art",
    artUploadRequired: "Please upload a reference image for Abstract Mini Art",
    soldOut: "SOLD OUT",
    safetyWarning: "Please ensure all details are correct before submitting order.",
    kpopOption: "K-pop version (韩娱版本)",
    stockError: "Sorry, some items are now out of stock.",
    loginRequired: "Login to Place Order",
    loginBtn: "Sign in with Google",
    welcome: "Welcome,",
    logout: "Logout"
  },
  zh: {
    shopTitle: "CvL Co.",
    shopSub: "学生手工甜点与创意周边限量预订",
    pickupLocation: "ADDA HEIGHTS",
    pickupDates: "5月3日 / 5月4日",
    pickupAvailable: "自取日期：5月3日 及 5月4日",
    itemsTitle: "本期好物",
    fillOrder: "1. 填写订购信息",
    deliveryTitle: "配送方式",
    selfPickup: "到店自取",
    lalamove: "Lalamove 送货",
    lalamoveNote: "提示：送货费用需由客户在收货时自行支付给司机。",
    lalamoveContact: "在安排送货前请先联系店主沟通。",
    nameLabel: "姓名",
    igLabel: "Instagram (IG) 账号",
    phoneLabel: "电话号码 (WhatsApp)",
    cardService: "寄语卡片服务",
    noCard: "不需要卡片",
    standardCard: "精美小卡 (+RM0.5)",
    messageLabel: "卡片寄语内容",
    messagePlaceholder: "在这里写下您的祝愿...",
    grandTotal: "应付总额",
    placeOrder: "前往支付页面",
    backToEdit: "返回修改",
    waitingPayment: "2. 扫码支付",
    paymentInstruct: "请完成支付并上传您的支付截图凭证",
    contactOwner: "支付完成后，请联系店主确认订单详情：",
    uploadProof: "3. 上传支付成功截图",
    submitProof: "完成交易并提交",
    orderSuccess: "下单成功！",
    successMsg: "支付凭证已提交，我们将尽快核验您的转账。",
    successContact: "请点击下方按钮联系店主 WhatsApp 以确认您的订单：014-3655393",
    adminLogin: "管理员入口",
    dashboard: "后台管理",
    assetsTitle: "店铺管理",
    updateSuccess: "店铺设置已更新！",
    mustUpload: "必须上传支付凭证才能完成订单。",
    artUploadLabel: "上传您的定制画参考图",
    artUploadRequired: "选择抽象画需上传参考图",
    soldOut: "已售罄",
    safetyWarning: "提交订单前请确保所有信息准确无误。",
    kpopOption: "K-pop version (韩娱版本)",
    stockError: "抱歉，部分商品库存不足。",
    loginRequired: "请登录以预订",
    loginBtn: "使用 Google 账号登录",
    welcome: "欢迎,",
    logout: "登出"
  }
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'tiramisu', nameEn: 'Tiramisu', nameZh: '提拉米苏', price: 12, img: "" },
  { id: 'bracelet', nameEn: 'Beaded Bracelet Mystery Box', nameZh: '串珠手链盲盒', price: 2, img: "" },
  { id: 'mystery', nameEn: 'Small Item Mystery Box', nameZh: '小废物盲盒', price: 3, img: "" },
  { id: 'art', nameEn: 'Abstract Mini Art', nameZh: '抽象画', price: 2, img: "" }
];

export default function App() {
  const [lang, setLang] = useState('zh');
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(true);

  const [assets, setAssets] = useState<ShopConfig>({
    products: DEFAULT_PRODUCTS,
    qrCodes: { duitNow: '', tng: '' }
  });

  const [cart, setCart] = useState<Record<string, number>>({ tiramisu: 0, bracelet: 0, mystery: 0, art: 0 });
  const [customer, setCustomer] = useState<Customer>({ name: '', ig: '', phone: '', delivery: 'Self Pickup' });
  const [greeting, setGreeting] = useState<Greeting>({ type: 'none', message: '' });
  const [customization, setCustomization] = useState<Customization>({ artImage: '', isKpop: false });
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState('');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  const t = I18N[lang];

  // --- Real-time Stock Sync ---
  const stockLevels = useMemo(() => {
    const levels: Record<string, number> = { tiramisu: 0, bracelet: 0, mystery: 0, art: 0 };
    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        Object.entries(order.cart || {}).forEach(([id, qty]) => {
          if (levels.hasOwnProperty(id)) levels[id] += Number(qty);
        });
      }
    });
    return levels;
  }, [orders]);

  // --- Initialize Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        console.log("Authenticated as:", u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setActionLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
      showToast("Identification failed");
    }
    setActionLoading(false);
  };

  // --- Validate Connection ---
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // --- Data Listeners ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const configRef = doc(db, `${DATA_PATH}/settings/config`);
    const unsubConfig = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAssets(prev => ({
          ...prev,
          qrCodes: data.qrCodes || prev.qrCodes
        }));
      }
    }, (err) => {
      console.warn("Config listener error:", err);
    });

    const productsRef = collection(db, `${DATA_PATH}/products`);
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      const data = snapshot.docs.map(d => d.data() as Product);
      if (data.length > 0) {
        setAssets(prev => ({ ...prev, products: data }));
      }
      setLoading(false);
    }, (err) => {
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, `${DATA_PATH}/products`);
    });

    const ordersCollection = collection(db, `${DATA_PATH}/orders`);
    // CRITICAL: Only allow listing if user is the known admin email, 
    // otherwise filter by their own UID to avoid permission error.
    const isActuallyAdmin = user?.email === 'yinxhuen@gmail.com';
    const ordersQuery = isActuallyAdmin ? ordersCollection : query(ordersCollection, where("uid", "==", user.uid));
    
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      setOrders(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `${DATA_PATH}/orders`);
    });

    return () => { unsubConfig(); unsubProducts(); unsubOrders(); };
  }, [user]);

  const totals = useMemo(() => {
    const itemsTotal = assets.products.reduce((sum: number, p) => sum + (Number(cart[p.id]) || 0) * p.price, 0);
    const cardPrice = greeting.type === 'hasCard' ? 0.5 : 0;
    return { 
      final: Math.max(0, itemsTotal + cardPrice),
      count: Object.values(cart).reduce((a: number, b: number) => a + b, 0)
    };
  }, [cart, greeting, assets.products]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) { 
      showToast(lang === 'zh' ? "图片过大（最大800KB）" : "Image too large (Max 800KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => callback(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const updateShopConfig = async (newConfig: ShopConfig) => {
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Save Config (QR Codes)
      const configRef = doc(db, `${DATA_PATH}/settings/config`);
      batch.set(configRef, { qrCodes: newConfig.qrCodes }, { merge: true });
      
      // Save Products individually
      newConfig.products.forEach(p => {
        const pRef = doc(db, `${DATA_PATH}/products/${p.id}`);
        batch.set(pRef, p);
      });
      
      await batch.commit();
      showToast(t.updateSuccess);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, DATA_PATH);
    }
    setActionLoading(false);
  };

  const generateWhatsAppLink = () => {
    const itemsStr = assets.products
      .filter(p => cart[p.id] > 0)
      .map(p => `${p.nameEn} x${cart[p.id]}${p.id === 'mystery' && customization.isKpop ? ' (K-Pop Ver)' : ''}`)
      .join(', ');
    
    const message = `Hi CvL Co.!
Order: ${itemsStr}
Total: RM${totals.final.toFixed(2)}
Customer: ${customer.name} (@${customer.ig})`;

    return `https://wa.me/60143655393?text=${encodeURIComponent(message)}`;
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totals.count === 0) return showToast(lang === 'zh' ? "请至少选择一件商品" : "Select at least one item");
    
    // Inventory Verification
    let isOversold = false;
    Object.entries(cart).forEach(([id, qty]) => {
      const q = Number(qty);
      if (q > 0 && ((stockLevels[id] || 0) + q) > STOCK_LIMITS[id]) {
        isOversold = true;
      }
    });

    if (isOversold) return showToast(t.stockError);
    if (cart.art > 0 && !customization.artImage) return showToast(t.artUploadRequired);

    setActionLoading(true);
    const path = `${DATA_PATH}/orders`;
    try {
      const orderData: Omit<Order, 'id'> = {
        customer, 
        cart, 
        greeting: {
          type: greeting.type,
          message: greeting.message
        }, 
        customization, 
        totals, 
        status: 'pending_payment', 
        createdAt: serverTimestamp(), 
        uid: user?.uid || 'anon'
      };
      const docRef = await addDoc(collection(db, path), orderData);
      setCurrentOrderId(docRef.id);
      setView('payment');
    } catch (err) { 
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    setActionLoading(false);
  };

  const completeTransaction = async () => {
    if (!paymentProof) return showToast(t.mustUpload);
    if (!currentOrderId) return;

    setActionLoading(true);
    const path = `${DATA_PATH}/orders/${currentOrderId}`;
    try {
      await updateDoc(doc(db, path), {
        paymentProof, 
        status: 'awaiting_verification', 
        completedAt: serverTimestamp()
      });
      setView('success');
      window.open(generateWhatsAppLink(), '_blank');
    } catch (err) { 
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    setActionLoading(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#D4B996] animate-pulse italic">CVL CO. IS LOADING...</div>;

  return (
    <div className="min-h-screen">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#2D241E] text-white px-8 py-4 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <AlertCircle size={16} className="text-[#D4B996]" />
          {toast}
        </div>
      )}

      {/* --- HOME VIEW --- */}
      {view === 'home' && (
        <div className="max-w-xl mx-auto px-6 py-12">
          <header className="flex justify-between items-center mb-16">
            <div className="w-10" />
            <div className="text-center">
              <h1 className="text-6xl font-serif tracking-tighter text-[#2D241E] mb-2">{t.shopTitle}</h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#D4B996] font-bold">{t.shopSub}</p>
            </div>
            <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="p-3 bg-white text-[#D4B996] rounded-full shadow-sm">
              <Languages size={20} />
            </button>
          </header>

          <section className="space-y-6 mb-16">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4B996] flex items-center gap-3">
              <Sparkles size={14}/> {t.itemsTitle}
            </h2>
            <div className="grid grid-cols-1 gap-5">
              {assets.products.map(p => {
                const isSoldOut = stockLevels[p.id] >= STOCK_LIMITS[p.id];
                return (
                  <div key={p.id} className={`bg-white rounded-[2.5rem] p-5 flex flex-col shadow-sm border border-gray-100 overflow-hidden transition-all ${isSoldOut ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100 relative">
                        {p.img ? <img src={p.img} className="w-full h-full object-cover" /> : <div className="p-4 bg-gray-50"><ImageIcon size={30} className="text-[#D4B996]/40" /></div>}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{t.soldOut}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg text-[#2D241E]">{lang === 'en' ? p.nameEn : p.nameZh}</h3>
                        <p className="text-[#8B4513] font-bold">RM{p.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 bg-[#FAF9F6] rounded-3xl p-2">
                        <button 
                          disabled={isSoldOut || (stockLevels[p.id] + (cart[p.id] || 0) >= STOCK_LIMITS[p.id])}
                          onClick={() => setCart(c => ({...c, [p.id]: (c[p.id]||0) + 1}))} 
                          className="w-8 h-8 rounded-xl bg-white font-bold disabled:opacity-20 shadow-sm"
                        >
                          +
                        </button>
                        <span className="font-black text-xs">{cart[p.id] || 0}</span>
                        <button 
                          onClick={() => setCart(c => ({...c, [p.id]: Math.max(0, (c[p.id]||0) - 1)}))} 
                          className="w-8 h-8 rounded-xl bg-white font-bold shadow-sm"
                        >
                          -
                        </button>
                      </div>
                    </div>
                    {/* Mystery Box Specific Option */}
                    {p.id === 'mystery' && cart.mystery > 0 && (
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between px-2">
                        <span className="text-[10px] font-black uppercase text-[#D4B996] tracking-widest flex items-center gap-2">
                          <Music size={12}/> {t.kpopOption}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setCustomization(prev => ({...prev, isKpop: !prev.isKpop}))}
                          className={`w-10 h-6 rounded-full transition-all relative ${customization.isKpop ? 'bg-[#D4B996]' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${customization.isKpop ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <form onSubmit={handleOrder} className="bg-white rounded-[3rem] p-10 shadow-2xl space-y-10 border border-gray-100">
            <h2 className="text-3xl font-serif text-center text-[#2D241E]">{t.fillOrder}</h2>
            
            {!user ? (
              <div className="bg-[#FAF9F6] p-10 rounded-[2rem] border-2 border-dashed border-[#D4B996]/30 text-center space-y-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <User size={30} className="text-[#D4B996]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-serif text-[#2D241E]">{t.loginRequired}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    We use Google Sign-In to secure your order and provide updates.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={handleLogin}
                  disabled={actionLoading}
                  className="w-full bg-white text-[#2D241E] py-5 rounded-2xl font-black text-xs tracking-widest shadow-md border border-gray-100 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-[#D4B996] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn size={18}/>
                  )}
                  {t.loginBtn}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-2xl border border-green-100">
                <ShieldCheck size={18} className="text-green-500" />
                <span className="text-[10px] font-black uppercase text-green-700">
                  {t.welcome} {user.displayName || 'Authorized User'}
                </span>
                <button 
                  type="button"
                  onClick={() => auth.signOut()}
                  className="ml-auto text-[10px] font-black text-gray-400 uppercase hover:text-red-500 transition-colors"
                >
                  {t.logout || 'Logout'}
                </button>
              </div>
            )}

            <div className={`space-y-8 ${!user ? 'opacity-40 pointer-events-none' : ''}`}>
              {cart.art > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#8B4513] flex items-center gap-2">
                    <Palette size={14}/> {t.artUploadLabel} *
                  </label>
                  <div className="relative border-2 border-dashed border-[#D4B996]/40 rounded-[2rem] p-8 bg-[#FAF9F6] flex flex-col items-center text-center">
                    <input type="file" required accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, (base64) => setCustomization(prev => ({...prev, artImage: base64})))} />
                    {customization.artImage ? (
                      <img src={customization.artImage} className="h-32 rounded-xl shadow-lg" alt="Custom Art"/>
                    ) : (
                      <>
                        <Upload size={24} className="mb-2 text-[#D4B996]"/>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Click to upload reference image</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-1 px-2">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#D4B996]">{t.deliveryTitle}</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setCustomer({...customer, delivery: 'Self Pickup'})} className={`flex flex-col items-center gap-2 p-5 rounded-[1.5rem] border-2 transition-all ${customer.delivery === 'Self Pickup' ? 'border-[#D4B996] bg-[#FAF9F6]' : 'border-gray-50 bg-white'}`}>
                    <User size={20} className={customer.delivery === 'Self Pickup' ? 'text-[#D4B996]' : 'text-gray-300'} />
                    <span className="text-[10px] font-bold uppercase">{t.selfPickup}</span>
                  </button>
                  <button type="button" onClick={() => setCustomer({...customer, delivery: 'Lalamove Delivery'})} className={`flex flex-col items-center gap-2 p-5 rounded-[1.5rem] border-2 transition-all ${customer.delivery === 'Lalamove Delivery' ? 'border-[#D4B996] bg-[#FAF9F6]' : 'border-gray-50 bg-white'}`}>
                    <Truck size={20} className={customer.delivery === 'Lalamove Delivery' ? 'text-[#D4B996]' : 'text-gray-300'} />
                    <span className="text-[10px] font-bold uppercase">{t.lalamove}</span>
                  </button>
                </div>

                <div className="px-2 pt-2">
                  {customer.delivery === 'Self Pickup' ? (
                    <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#D4B996]/20 space-y-2">
                      <div className="flex items-center gap-2 text-[#8B4513]">
                        <MapPin size={14} />
                        <span className="text-xs font-black uppercase tracking-widest">{t.pickupLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#D4B996]">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold">{t.pickupAvailable}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-blue-100 space-y-2">
                      <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase">
                        {t.lalamoveNote}
                      </p>
                      <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                        {t.lalamoveContact}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#D4B996] px-2">{t.nameLabel}</label>
                  <input required className="w-full bg-[#FAF9F6] rounded-[1.5rem] px-6 py-5 text-sm outline-none border-2 border-transparent focus:border-[#D4B996]" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#D4B996] px-2">{t.igLabel}</label>
                    <input required placeholder="@username" className="w-full bg-[#FAF9F6] rounded-[1.5rem] px-6 py-5 text-sm outline-none border-2 border-transparent focus:border-[#D4B996]" value={customer.ig} onChange={e => setCustomer({...customer, ig: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#D4B996] px-2">{t.phoneLabel}</label>
                    <input required type="tel" className="w-full bg-[#FAF9F6] rounded-[1.5rem] px-6 py-5 text-sm outline-none border-2 border-transparent focus:border-[#D4B996]" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-50 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest">{t.cardService}</span>
                    <select className="bg-[#FAF9F6] text-xs px-5 py-3 rounded-full outline-none font-bold" value={greeting.type} onChange={e => setGreeting({...greeting, type: e.target.value})}>
                      <option value="none">{t.noCard}</option>
                      <option value="hasCard">{t.standardCard}</option>
                    </select>
                  </div>
                  {greeting.type !== 'none' && (
                    <textarea placeholder={t.messagePlaceholder} className="w-full bg-[#FAF9F6] rounded-[1.5rem] p-6 text-sm h-32 outline-none border-2 border-transparent focus:border-[#D4B996] resize-none" value={greeting.message} onChange={e => setGreeting({...greeting, message: e.target.value})} />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4B996] font-black mb-2">{t.grandTotal}</p>
                <p className="text-5xl font-serif text-[#8B4513]">RM{totals.final.toFixed(2)}</p>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-[#2D241E] text-white py-7 rounded-[2rem] font-black text-sm tracking-widest shadow-xl cursor-pointer hover:bg-[#3D342E] transition-colors disabled:opacity-50">
                {actionLoading ? 'PROCESSING...' : t.placeOrder}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PAYMENT VIEW --- */}
      {view === 'payment' && (
        <div className="max-w-xl mx-auto px-6 py-12">
          <button onClick={() => setView('home')} className="mb-8 flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-widest">
            <ArrowLeft size={16}/> {t.backToEdit}
          </button>
          <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-[#D4B996] p-12 text-white text-center">
              <p className="text-xs uppercase tracking-[0.3em] font-black opacity-80 mb-3">{t.waitingPayment}</p>
              <h2 className="text-6xl font-serif mb-4">RM{totals.final.toFixed(2)}</h2>
            </div>
            
            <div className="p-10 space-y-12">
              <div className="grid grid-cols-2 gap-8">
                {(['duitNow', 'tng'] as const).map(key => {
                  const name = key === 'duitNow' ? 'DuitNow' : 'TNG';
                  return (
                    <div key={key} className="flex flex-col items-center gap-4">
                      <div className="w-full aspect-square bg-[#FAF9F6] rounded-[2rem] border-2 border-dashed border-[#D4B996]/30 flex items-center justify-center overflow-hidden p-4">
                        {assets.qrCodes[key] ? (
                          <img src={assets.qrCodes[key]} className="w-full h-full object-contain" alt={`${name} QR`} />
                        ) : (
                          <QrCode size={40} className="text-gray-200" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4B996]">{name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#FAF9F6] border-l-4 border-[#8B4513] p-8 rounded-r-[2rem] space-y-4">
                <p className="text-xs font-bold leading-relaxed uppercase">{t.contactOwner}</p>
                <div className="flex items-center gap-4 text-[#8B4513]">
                  <div className="bg-[#8B4513] p-3 rounded-full text-white"><Phone size={20}/></div>
                  <span className="text-2xl font-black tracking-tighter">014-3655393</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#2D241E]">{t.uploadProof}</h3>
                <div className="relative border-2 border-dashed border-[#D4B996]/40 rounded-[2.5rem] p-12 bg-[#FAF9F6] flex flex-col items-center">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, setPaymentProof)} />
                  {paymentProof ? (
                    <img src={paymentProof} className="h-48 rounded-2xl shadow-xl" alt="Payment Proof"/>
                  ) : (
                    <Camera size={40} className="mb-4 text-[#D4B996] opacity-50" />
                  )}
                </div>
              </div>

              <button 
                onClick={completeTransaction} 
                disabled={actionLoading || !paymentProof} 
                className="w-full bg-[#8B4513] text-white py-7 rounded-[2rem] font-black text-sm tracking-widest shadow-xl disabled:opacity-20 transition-all cursor-pointer hover:bg-[#9B5523]"
              >
                {actionLoading ? 'PROCESSING...' : t.submitProof}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS VIEW --- */}
      {view === 'success' && (
        <div className="h-screen flex items-center justify-center text-center p-6 bg-white">
          <div className="max-w-md space-y-10">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={50} className="text-green-500" />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-serif text-[#2D241E]">{t.orderSuccess}</h2>
              <div className="bg-green-50 p-8 rounded-[2rem] border border-green-200">
                <p className="text-sm font-black text-green-800 leading-relaxed uppercase">
                  {t.successContact}
                </p>
              </div>
              <button 
                onClick={() => window.open(generateWhatsAppLink(), '_blank')}
                className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-xs tracking-widest shadow-lg flex items-center justify-center gap-3 cursor-pointer hover:bg-[#1DA851] transition-colors"
              >
                <MessageSquare size={18}/> CONTACT WHATSAPP
              </button>
            </div>
            <button onClick={() => {
              setCart({ tiramisu: 0, bracelet: 0, mystery: 0, art: 0 });
              setCustomization({ artImage: '', isKpop: false });
              setPaymentProof('');
              setGreeting({ type: 'none', message: '' });
              setView('home');
            }} className="text-xs font-black uppercase text-[#D4B996] tracking-widest cursor-pointer">Return to Shop</button>
          </div>
        </div>
      )}

      {/* --- ADMIN VIEWS --- */}
      {view === 'admin-login' && (
        <div className="h-screen flex items-center justify-center p-6 bg-[#2D241E]">
          <div className="w-full max-w-sm bg-white p-12 rounded-[3.5rem] shadow-2xl space-y-10">
            <h2 className="text-3xl font-serif text-center text-[#2D241E]">Admin Access</h2>
            <div className="space-y-5">
              <input type="text" placeholder="Username" id="adm-u" className="w-full bg-[#FAF9F6] px-6 py-5 rounded-2xl outline-none border-2 border-transparent focus:border-[#D4B996]" />
              <input type="password" placeholder="Password" id="adm-p" className="w-full bg-[#FAF9F6] px-6 py-5 rounded-2xl outline-none border-2 border-transparent focus:border-[#D4B996]" />
            </div>
            <button onClick={() => {
              const u = (document.getElementById('adm-u') as HTMLInputElement).value;
              const p = (document.getElementById('adm-p') as HTMLInputElement).value;
              if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
                setIsAdmin(true); setView('admin-dashboard');
              } else showToast("Denied");
            }} className="w-full bg-[#2D241E] text-white py-5 rounded-2xl font-black text-xs cursor-pointer">AUTHENTICATE</button>
            <button onClick={() => setView('home')} className="w-full text-center text-xs text-gray-400 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {view === 'admin-dashboard' && isAdmin && (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm">
            <div>
              <p className="text-[10px] font-black text-[#D4B996] uppercase mb-2 tracking-[0.3em]">Administrator</p>
              <h1 className="text-5xl font-serif text-[#2D241E]">Dashboard</h1>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setView('admin-settings')} className="p-5 bg-blue-50 text-blue-500 rounded-[1.5rem] cursor-pointer hover:bg-blue-100"><Settings size={20}/></button>
              <button 
                onClick={() => { 
                  setIsAdmin(false); 
                  setView('home'); 
                }} 
                className="p-5 bg-red-50 text-red-500 rounded-[1.5rem] cursor-pointer hover:bg-red-100"
              >
                <LogOut size={20}/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {orders.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center text-gray-400 italic">No orders yet.</div>
            ) : (
              orders.slice().sort((a: any, b: any) => {
                const timeB: number = b.createdAt?.toMillis?.() || 0;
                const timeA: number = a.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
              }).map(order => {
                console.log("Order Customization Data:", order.id, order.customization);
                return (
                <div key={order.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#2D241E]">{order.customer?.name}</h3>
                      <p className="text-sm text-[#D4B996] font-bold">IG: {order.customer?.ig} | WA: {order.customer?.phone}</p>
                      <p className="text-[10px] font-black uppercase text-blue-500 mt-1">{order.customer?.delivery}</p>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${order.status === 'awaiting_verification' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {order.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-[#FAF9F6] p-6 rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4B996] mb-4 border-b border-gray-200 pb-2">Order Items</h4>
                        {Object.entries(order.cart || {}).map(([id, qty]) => {
                          const q = Number(qty);
                          if (q === 0) return null;
                          const prod = assets.products.find(p => p.id === id);
                          return (
                            <div key={id} className="flex flex-col gap-1 mb-2">
                              <div className="flex justify-between text-xs font-bold">
                                <span>{prod?.nameEn} x {q}</span>
                                <span>RM{((prod?.price || 0) * q).toFixed(2)}</span>
                              </div>
                              {id === 'mystery' && order.customization?.isKpop && (
                                <span className="text-[9px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full self-start font-black uppercase">K-Pop Version</span>
                              )}
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-sm text-[#8B4513]">
                          <span>Total</span>
                          <span>RM{order.totals?.final?.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-[#FAF9F6] p-6 rounded-2xl border-l-4 border-[#D4B996]">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4B996] mb-3 flex items-center gap-2">
                          <ClipboardList size={12}/> Greeting Card Information
                        </h4>
                        <div className="space-y-2">
                          <p className="text-xs font-bold">
                            Purchased Card: <span className={order.greeting?.type === 'hasCard' ? 'text-green-600' : 'text-gray-400'}>
                              {order.greeting?.type === 'hasCard' ? 'YES' : 'NO'}
                            </span>
                          </p>
                          {order.greeting?.message && (
                            <div className="mt-3 p-4 bg-white rounded-xl border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Message Content:</p>
                              <p className="text-xs leading-relaxed italic text-[#4A4036]">
                                "{order.greeting.message}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {order.customization?.artImage && (
                        <div className="bg-[#FAF9F6] p-6 rounded-2xl">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4B996] mb-3">Custom Art Reference</h4>
                           <img src={order.customization.artImage} className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-sm" alt="Art Reference"/>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center bg-[#FAF9F6] rounded-3xl p-6 border-2 border-dashed border-gray-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4B996] mb-4">Payment Proof</h4>
                      {order.paymentProof ? (
                        <img 
                          src={order.paymentProof} 
                          className="max-h-80 rounded-xl shadow-md cursor-pointer hover:scale-[1.02] transition-transform" 
                          onClick={() => window.open(order.paymentProof)} 
                          alt="Proof"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-300">
                           <ImageIcon size={40}/>
                           <span className="text-xs italic">No proof uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    )}

      {view === 'admin-settings' && isAdmin && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button onClick={() => setView('admin-dashboard')} className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer">
            <ArrowLeft size={16}/> Back
          </button>
          
          <div className="bg-white rounded-[3rem] p-10 shadow-xl space-y-12">
            <div>
              <h2 className="text-2xl font-serif text-[#2D241E] mb-6">Products & QRs</h2>
              <div className="grid grid-cols-1 gap-6">
                {assets.products.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 bg-[#FAF9F6] rounded-3xl">
                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border">
                      {p.img ? <img src={p.img} className="w-full h-full object-cover" alt={p.nameEn} /> : <ImageIcon className="text-gray-200" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">{p.nameEn}</p>
                      <p className="text-[10px] text-gray-400">Stock Used: {stockLevels[p.id]} / {STOCK_LIMITS[p.id]}</p>
                    </div>
                    <label className="p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-blue-50">
                      <Upload size={16} className="text-blue-500" />
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, (base64) => {
                          const n = [...assets.products]; 
                          n[idx].img = base64; 
                          setAssets({...assets, products: n});
                        })} 
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t grid grid-cols-2 gap-8">
              {(['duitNow', 'tng'] as const).map(key => (
                <div key={key} className="text-center space-y-4">
                  <p className="text-[10px] font-black uppercase text-[#D4B996]">{key}</p>
                  <div className="aspect-square bg-[#FAF9F6] rounded-2xl flex items-center justify-center border p-2">
                    {assets.qrCodes[key] ? (
                      <img src={assets.qrCodes[key]} className="w-full h-full object-contain" alt={`${key} QR`}/>
                    ) : (
                      <QrCode size={30} className="text-gray-200" />
                    )}
                  </div>
                  <label className="inline-flex px-4 py-2 bg-white rounded-full text-[10px] font-bold shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors">
                    Change
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, (base64) => setAssets({
                        ...assets, 
                        qrCodes: {...assets.qrCodes, [key]: base64}
                      }))} 
                    />
                  </label>
                </div>
              ))}
            </div>

            <button 
              onClick={() => updateShopConfig(assets)} 
              disabled={actionLoading}
              className="w-full bg-[#2D241E] text-white py-6 rounded-2xl font-black text-sm tracking-widest shadow-lg cursor-pointer hover:bg-[#3D342E] transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'SAVING...' : 'SAVE ALL CHANGES'}
            </button>
          </div>
        </div>
      )}

      {view === 'home' && (
        <footer className="py-24 text-center">
          <button onClick={() => setView('admin-login')} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4B996] cursor-pointer hover:text-[#2D241E] transition-colors">Admin Login</button>
        </footer>
      )}
    </div>
  );
}
