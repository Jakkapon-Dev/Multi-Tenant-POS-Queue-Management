import React, { useState, useEffect } from 'react';
import {
  Grid,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  User as UserIcon,
  Clock,
  Plus,
  Minus,
  Trash2,
  Percent,
  RefreshCw,
  Search,
  Check,
  X,
  Printer,
} from 'lucide-react';
import { Tenant, Category, MenuItem, DiningTable, Order, CartItem, User } from '../../types';
import { api } from '../../services/api';

interface CashierPosViewProps {
  tenant: Tenant;
  currentUser?: User;
}

export const CashierPosView: React.FC<CashierPosViewProps> = ({ tenant, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'menu'>('tables');
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchMenu, setSearchMenu] = useState<string>('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [orderNotes] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Payment state
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PROMPTPAY' | 'CREDIT_CARD'>('PROMPTPAY');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, [tenant.id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tableList, menuList] = await Promise.all([
        api.getTables(tenant.id),
        api.getMenu(tenant.id),
      ]);
      setTables(tableList);
      setCategories(menuList);
    } catch (err) {
      console.error('Error fetching POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table: DiningTable) => {
    setSelectedTable(table);
    if (table.orders && table.orders.length > 0) {
      const active = table.orders[0];
      setActiveOrder(active);
      // Pre-fill cart if active order exists
      setCart([]);
    } else {
      setActiveOrder(null);
    }
    setActiveTab('menu');
  };

  const handleAddItemToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id && i.selectedModifiers.length === 0);
      if (existing) {
        return prev.map((i) =>
          i.cartId === existing.cartId
            ? { ...i, quantity: i.quantity + 1, itemTotalPrice: item.price * (i.quantity + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          cartId: `${item.id}-${Date.now()}`,
          menuItem: item,
          quantity: 1,
          selectedModifiers: [],
          notes: '',
          itemTotalPrice: item.price,
        },
      ];
    });
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.cartId === cartId) {
            const newQty = Math.max(1, i.quantity + delta);
            return { ...i, quantity: newQty, itemTotalPrice: i.menuItem.price * newQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  // Calculations
  const rawSubtotal = activeOrder
    ? activeOrder.subtotal
    : cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const discountAmount = Math.round((rawSubtotal * (discountPercent / 100)) * 100) / 100;
  const taxableAmount = Math.max(0, rawSubtotal - discountAmount);
  const calculatedTax = Math.round((taxableAmount * (tenant.taxRate / 100)) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + calculatedTax) * 100) / 100;

  const handleSendToKitchen = async () => {
    if (cart.length === 0 && !activeOrder) return;
    try {
      setLoading(true);
      const itemsPayload = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        name: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
        notes: c.notes,
        modifiers: c.selectedModifiers,
      }));

      const newOrder = await api.createOrder({
        tenantId: tenant.id,
        tableId: selectedTable?.id || null,
        customerName: selectedTable ? `Table ${selectedTable.tableNumber}` : 'Walk-in Guest',
        orderType: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
        notes: orderNotes,
        items: itemsPayload,
      });

      setActiveOrder(newOrder);
      setCart([]);
      await fetchInitialData();
      alert(`✅ Order ${newOrder.orderNumber} sent directly to Kitchen Display System!`);
    } catch (err: any) {
      alert('Error sending order: ' + (err.message || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    try {
      setLoading(true);
      let targetOrderId = activeOrder?.id;

      // If paying directly without prior order
      if (!targetOrderId && cart.length > 0) {
        const itemsPayload = cart.map((c) => ({
          menuItemId: c.menuItem.id,
          name: c.menuItem.name,
          price: c.menuItem.price,
          quantity: c.quantity,
          notes: c.notes,
          modifiers: c.selectedModifiers,
        }));

        const freshOrder = await api.createOrder({
          tenantId: tenant.id,
          tableId: selectedTable?.id || null,
          customerName: selectedTable ? `Table ${selectedTable.tableNumber}` : 'POS Cashier Direct',
          orderType: selectedTable ? 'DINE_IN' : 'TAKEAWAY',
          items: itemsPayload,
        });
        targetOrderId = freshOrder.id;
      }

      if (!targetOrderId) return;

      const finalized = await api.processPayment(targetOrderId, paymentMethod, discountAmount);
      setCompletedOrder(finalized);
      setIsPayModalOpen(false);
      setIsReceiptModalOpen(true);
      setCart([]);
      setActiveOrder(null);
      setSelectedTable(null);
      await fetchInitialData();
    } catch (err: any) {
      alert('Payment failed: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const allMenuItems = categories.flatMap((c) => c.menuItems);
  const filteredMenuItems = (selectedCategory === 'all'
    ? allMenuItems
    : categories.find((c) => c.id === selectedCategory)?.menuItems || []
  ).filter((i) => i.name.toLowerCase().includes(searchMenu.toLowerCase()));

  // Group tables by zone
  const tableZones = Array.from(new Set(tables.map((t) => t.zone)));

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Top Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"></span>
            <h2 className="font-bold text-base text-white tracking-tight">
              {tenant.name} <span className="text-slate-500 font-normal text-xs ml-2">POS Register v0.3</span>
            </h2>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'tables' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tables Floor Map</span>
              <span className="text-[10px] bg-slate-900/40 px-1.5 py-0.2 rounded-full ml-0.5">
                {tables.filter((t) => t.status === 'OCCUPIED').length}/{tables.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'menu' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Menu Terminal</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInitialData()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh tables and orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-200">{currentUser?.name || 'Sarah Cashier'}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
              CASHIER
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Tables Floor Map OR Menu Catalog */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-slate-950/50">
          
          {activeTab === 'tables' ? (
            /* Tables Floor Map */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Interactive Floor Map</h3>
                  <p className="text-xs text-slate-400">Click any table to open active bill or start a new order</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-300">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-300">Occupied / Dining</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="text-slate-300">Bill Requested</span>
                  </div>
                </div>
              </div>

              {tableZones.map((zone) => {
                const zoneTables = tables.filter((t) => t.zone === zone);
                return (
                  <div key={zone} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{zone}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {zoneTables.map((table) => {
                        const isOccupied = table.status === 'OCCUPIED';
                        const isSelected = selectedTable?.id === table.id;
                        const activeTableOrder = table.orders && table.orders.length > 0 ? table.orders[0] : null;

                        return (
                          <div
                            key={table.id}
                            onClick={() => handleSelectTable(table)}
                            className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden group ${
                              isSelected
                                ? 'ring-2 ring-emerald-500 bg-emerald-950/30 border-emerald-500/50'
                                : isOccupied
                                ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-base text-white">{table.tableNumber}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isOccupied
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {isOccupied ? 'ACTIVE' : 'OPEN'}
                              </span>
                            </div>

                            {isOccupied && activeTableOrder ? (
                              <div className="my-auto">
                                <p className="text-[11px] text-amber-300 font-semibold">{activeTableOrder.orderNumber}</p>
                                <p className="text-xs font-bold text-white mt-0.5">
                                  ฿{activeTableOrder.total.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-400">{activeTableOrder.items.length} items</p>
                              </div>
                            ) : (
                              <div className="my-auto text-[11px] text-slate-500">
                                Capacity: {table.capacity} guests
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                              <span>QR: {table.qrCodeToken}</span>
                              <span className="group-hover:text-emerald-400 transition font-medium">Select →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Menu Terminal Catalog */
            <div className="space-y-4">
              {/* Header & Search */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === 'all'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    All Menus
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                        selectedCategory === c.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{c.icon || '🍽️'}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>

                <div className="w-64 relative flex-shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Quick search dishes..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAddItemToCart(item)}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition active:scale-95 group hover:shadow-lg hover:shadow-emerald-500/5"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-28 rounded-xl object-cover bg-slate-800 mb-2.5 group-hover:scale-102 transition"
                      />
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-slate-800 flex items-center justify-center text-3xl mb-2.5">
                        ☕
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-emerald-400 transition">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                      <span className="font-bold text-xs text-emerald-400">฿{item.price.toLocaleString()}</span>
                      <button className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: POS Cart & Checkout Register */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Current Order</span>
                {selectedTable && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-md font-bold">
                    Table {selectedTable.tableNumber}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeOrder ? `Active Ticket: ${activeOrder.orderNumber}` : 'New Bill Creation'}
              </p>
            </div>
            {selectedTable && (
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setActiveOrder(null);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                Clear Table
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
            {activeOrder && (
              <div className="mb-3 p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Items from Active Order:</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                    {activeOrder.status}
                  </span>
                </div>
                {activeOrder.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs py-1 text-slate-300 border-b border-slate-700/40 last:border-0">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-semibold text-white">฿{i.subtotal}</span>
                  </div>
                ))}
              </div>
            )}

            {cart.length === 0 && !activeOrder ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
                <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">Cart is empty</p>
                <p className="text-[11px] text-slate-600 mt-1">Select a table or click menu items to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-xs text-white">{item.menuItem.name}</h4>
                    <span className="text-[11px] text-emerald-400 font-bold">฿{item.itemTotalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button
                      onClick={() => updateCartQty(item.cartId, -1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.cartId, 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.cartId)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Discount selector */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Discount:
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    discountPercent === pct
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pct === 0 ? '0%' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotals & Pay Action */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal</span>
              <span>฿{rawSubtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-amber-400">
                <span>Discount ({discountPercent}%)</span>
                <span>-฿{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-400">
              <span>VAT ({tenant.taxRate}%)</span>
              <span>฿{calculatedTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="text-emerald-400">฿{grandTotal.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {cart.length > 0 && (
                <button
                  onClick={handleSendToKitchen}
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send to KDS</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCashReceived(grandTotal);
                  setIsPayModalOpen(true);
                }}
                disabled={grandTotal <= 0 || loading}
                className={`${
                  cart.length > 0 ? 'col-span-1' : 'col-span-2'
                } bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Pay & Settle (฿{grandTotal.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Processing Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Checkout & Payment</h3>
                <p className="text-xs text-slate-400">Select payment method for bill settlement</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setPaymentMethod('PROMPTPAY')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'PROMPTPAY'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-6 h-6" />
                <span>PromptPay QR</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span>Cash Payment</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span>Credit Card / EDC</span>
              </button>
            </div>

            {/* PromptPay View */}
            {paymentMethod === 'PROMPTPAY' && (
              <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 text-center space-y-3">
                <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  {/* Generated QR Placeholder */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=promptpay-demo-amount-${grandTotal}`}
                    alt="PromptPay QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Dynamic PromptPay QR Code</p>
                  <p className="text-[11px] text-slate-400">Scan via any Thai Mobile Banking app</p>
                  <p className="text-base font-extrabold text-emerald-400 mt-1">฿{grandTotal.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Cash Calculator View */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Cash Received:</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(amt)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 border border-slate-700"
                    >
                      ฿{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashReceived(grandTotal)}
                    className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/40"
                  >
                    Exact
                  </button>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-700">
                  <span className="text-slate-300">Change Due:</span>
                  <span className={cashReceived >= grandTotal ? 'text-emerald-400' : 'text-rose-400'}>
                    ฿{Math.max(0, cashReceived - grandTotal).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Confirm Payment Action */}
            <button
              onClick={handleCompletePayment}
              disabled={loading || (paymentMethod === 'CASH' && cashReceived < grandTotal)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Print Receipt (฿{grandTotal.toLocaleString()})</span>
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 font-mono">
            <div className="text-center border-b border-slate-300 pb-3">
              <h3 className="font-bold text-base uppercase">{tenant.name}</h3>
              <p className="text-[11px] text-slate-500">Tax Invoice / Receipt</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(completedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>Receipt No:</span>
                <span>{completedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase">{completedOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5 text-xs">
              {completedOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-bold">฿{it.subtotal}</span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>฿{completedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (7%):</span>
                <span>฿{completedOrder.tax}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-300">
                <span>Total Paid:</span>
                <span>฿{completedOrder.total}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2">
              Thank you for dining with us!
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 font-sans"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
