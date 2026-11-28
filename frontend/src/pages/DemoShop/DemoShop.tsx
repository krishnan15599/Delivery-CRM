import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Star,
  Plus,
  Minus,
  Trash2,
  X,
  Key,
  CheckCircle2,
  ExternalLink,
  Truck,
  ShieldCheck,
  Sparkles,
  Settings2,
  Package,
} from 'lucide-react';
import { Button, Input, FormField, Modal } from '../../components/common';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://delivery-crm-7fl4.onrender.com/api';

const shopApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  badge?: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface PlacedOrderResult {
  id: string;
  trackingNumber: string;
  trackingToken: string;
  trackingUrl: string;
  externalOrderId: string;
  status: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'PRD-1',
    name: 'Studio ANC Wireless Headphones',
    brand: 'SoundCraft',
    category: 'Electronics',
    price: 2499,
    mrp: 3499,
    rating: 4.8,
    reviews: 312,
    description: '40h battery life, hybrid active noise cancellation & USB-C fast charge.',
    image: '/assets/shop/headphones.jpg',
    badge: 'Bestseller',
  },
  {
    id: 'PRD-2',
    name: 'Compact 65% Mechanical Keyboard',
    brand: 'KeyForge',
    category: 'Electronics',
    price: 2999,
    mrp: 3999,
    rating: 4.7,
    reviews: 184,
    description: 'Hot-swappable tactile switches, PBT keycaps & dual-mode wireless.',
    image: '/assets/shop/keyboard.jpg',
    badge: 'New Arrival',
  },
  {
    id: 'PRD-3',
    name: 'Emerald Handloom Cotton Kurta Set',
    brand: 'Vastra Studio',
    category: 'Apparel',
    price: 1299,
    mrp: 1799,
    rating: 4.6,
    reviews: 97,
    description: 'Breathable pure cotton kurta with mandarin collar & tailored trousers.',
    image: '/assets/shop/kurta.jpg',
  },
  {
    id: 'PRD-4',
    name: 'Artisan Matte Ceramic Mug Set (4 pcs)',
    brand: 'Clay & Oak',
    category: 'Home & Kitchen',
    price: 899,
    mrp: 1299,
    rating: 4.9,
    reviews: 245,
    description: 'Hand-glazed stoneware mugs in earthy tones, microwave & dishwasher safe.',
    image: '/assets/shop/mugs.jpg',
    badge: 'Top Rated',
  },
  {
    id: 'PRD-5',
    name: 'Botanical Radiance Skincare Gift Box',
    brand: 'PureLeaf',
    category: 'Beauty',
    price: 1599,
    mrp: 2199,
    rating: 4.8,
    reviews: 156,
    description: 'Vitamin-C glow serum & hydrating barrier cream in a keepsake gift box.',
    image: '/assets/shop/skincare.jpg',
  },
];

const CATEGORIES = ['All', 'Electronics', 'Apparel', 'Home & Kitchen', 'Beauty'];
const API_KEY_STORAGE = 'delivery_crm_demo_shop_api_key';

export const DemoShop: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem(API_KEY_STORAGE) || ''
  );
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([{ product: PRODUCTS[0], qty: 1 }]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState('Karthik Subramanian');
  const [customerPhone, setCustomerPhone] = useState('+91 98401 11223');
  const [deliveryAddress, setDeliveryAddress] = useState('14, Anna Nagar East, 2nd Main Road');
  const [city, setCity] = useState('Chennai');
  const [pincode, setPincode] = useState('600102');
  const [paymentMode, setPaymentMode] = useState<'COD' | 'Paid'>('COD');

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderResult | null>(null);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem(API_KEY_STORAGE, val);
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, search]);

  const getCartQty = (productId: string) =>
    cart.find((c) => c.product.id === productId)?.qty || 0;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const totalItems = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);
  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [cart]
  );

  const handleOpenCheckout = () => {
    setPlacedOrder(null);
    setError(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apiKey.trim()) {
      setError('Merchant API Key is required. Click "API Settings" above or paste it below.');
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!customerName.trim() || !deliveryAddress.trim()) {
      setError('Customer name and delivery address are required.');
      return;
    }

    const externalOrderId = `FK-${Date.now().toString().slice(-6)}`;
    const itemDescription = cart
      .map((c) => `${c.product.name} x${c.qty}`)
      .join(', ');

    try {
      setPlacing(true);
      const res = await shopApi.post<{ data: PlacedOrderResult }>(
        '/integrations/orders',
        {
          externalOrderId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          city: city.trim() || 'Chennai',
          pincode: pincode.trim(),
          packageType: cart[0].product.category,
          itemDescription,
          amount: totalAmount,
          codAmount: paymentMode === 'COD' ? totalAmount : 0,
          paymentStatus: paymentMode === 'COD' ? 'Pending' : 'Paid',
          notes: 'Order placed via FreshKart Storefront',
        },
        {
          headers: { 'x-api-key': apiKey.trim() },
        }
      );

      setPlacedOrder(res.data.data);
      setCart([]);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to place order. Please check your Merchant API Key.'
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Announcement Strip */}
      <div className="bg-[#0A1F22] text-emerald-200 text-[11px] font-medium py-1.5 px-4 text-center">
        Free Express Courier Delivery on orders above ₹999 • Live Tracking Enabled
      </div>

      {/* Sticky Storefront Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#0F2A2E] text-emerald-300 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                FreshKart
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 -mt-1">
                Express Lifestyle Store
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search headphones, keyboards, apparel..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-400 rounded-full outline-none transition-all"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsApiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              title="Configure Merchant API Key"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiKey.trim() ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">
                {apiKey.trim() ? 'Store Connected' : 'Connect Store Key'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F2A2E] hover:bg-[#173f45] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-400 text-slate-900">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Hero Promo Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#0F2A2E] via-[#133C42] to-[#1D4ED8] text-white p-6 sm:p-10 shadow-md">
          <div className="max-w-xl space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Weekend Express Sale • Up to 30% Off
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Curated Tech, Fashion &amp; Home Essentials.
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Every order is dispatched straight to our courier hub with live barcode tracking and doorstep updates.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Same-Day Hub Dispatch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Cash on Delivery Available
              </span>
            </div>
          </div>
        </section>

        {/* Category Filter Bar */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredProducts.length} products
          </span>
        </section>

        {/* Product Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
            const qty = getCartQty(p.id);
            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[10px] font-bold uppercase tracking-wider">
                      {p.badge}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-bold">
                    {discount}% OFF
                  </span>
                </div>

                {/* Product Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold uppercase tracking-wide">{p.brand}</span>
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {p.rating} <span className="text-slate-400 font-normal">({p.reviews})</span>
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{p.price.toLocaleString()}
                      </span>
                      <span className="ml-2 text-xs text-slate-400 line-through">
                        ₹{p.mrp.toLocaleString()}
                      </span>
                    </div>

                    {qty === 0 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                        onClick={() => addToCart(p)}
                      >
                        Add to Cart
                      </Button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateQty(p.id, -1)}
                          className="p-1 rounded hover:bg-indigo-100 text-indigo-700"
                          aria-label={`Decrease ${p.name} quantity`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-indigo-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(p.id, 1)}
                          className="p-1 rounded hover:bg-indigo-100 text-indigo-700"
                          aria-label={`Increase ${p.name} quantity`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 text-center text-xs text-slate-500">
        FreshKart Demo Storefront • Connected to{' '}
        <Link to="/merchants" className="text-indigo-600 hover:underline font-medium">
          Delivery CRM Merchants
        </Link>
      </footer>

      {/* Slide-Over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                Shopping Bag ({totalItems})
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">Your bag is empty</p>
                  <p className="text-xs text-slate-400">Add items from the store to checkout.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ₹{item.product.price.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, -1)}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, 1)}
                          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product.id, -item.qty)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <Button
                  variant="primary"
                  className="w-full py-3"
                  onClick={handleOpenCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout & Order Confirmation Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={placedOrder ? 'Order Confirmed!' : 'Express Checkout'}
        description={
          placedOrder
            ? 'Your order has been dispatched to our courier partner.'
            : 'Enter your delivery details to place your order.'
        }
        size="lg"
      >
        {placedOrder ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Thank you for your order!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Order <span className="font-mono font-semibold">{placedOrder.externalOrderId}</span> is now registered with Delivery CRM Express.
              </p>
            </div>
            <div className="max-w-sm mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Number</span>
                <span className="font-mono font-bold text-slate-900">
                  {placedOrder.trackingNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status</span>
                <span className="font-semibold text-indigo-700">{placedOrder.status}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {placedOrder.trackingToken && (
                <Link to={`/track/${placedOrder.trackingToken}`}>
                  <Button
                    variant="primary"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Track Your Order Live
                  </Button>
                </Link>
              )}
              <Link to="/hub-scan">
                <Button variant="outline" leftIcon={<Package className="w-4 h-4" />}>
                  Open Hub Scan
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {!apiKey.trim() && (
              <FormField
                label="Merchant API Key"
                required
                helperText="Paste your key from CRM → Merchants → API Keys"
              >
                <Input
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="dk_live_..."
                  leftIcon={<Key className="w-4 h-4 text-slate-400" />}
                  className="font-mono text-xs"
                  required
                />
              </FormField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Full Name" required>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Mobile Number">
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Delivery Address" required>
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="City">
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </FormField>
              <FormField label="Pincode">
                <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </FormField>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'COD'}
                    onChange={() => setPaymentMode('COD')}
                  />
                  Cash on Delivery
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="paymentMode"
                    checked={paymentMode === 'Paid'}
                    onChange={() => setPaymentMode('Paid')}
                  />
                  Prepaid (UPI / Card)
                </label>
              </div>
              <div className="font-extrabold text-slate-900 text-sm">
                Total: ₹{totalAmount.toLocaleString()}
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={placing}>
                Place Order (₹{totalAmount.toLocaleString()})
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Store API Key Settings Modal */}
      <Modal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        title="Storefront API Connection"
        description="Link this demo store to a Merchant in your Delivery CRM."
        size="md"
      >
        <div className="space-y-4">
          <FormField
            label="Merchant API Key"
            helperText="Generated in Delivery CRM → Merchants → API Keys"
          >
            <Input
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="dk_live_..."
              leftIcon={<Key className="w-4 h-4 text-slate-400" />}
              className="font-mono text-xs"
            />
          </FormField>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsApiModalOpen(false)}>
              Save &amp; Continue Shopping
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DemoShop;
