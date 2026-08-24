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
  Users,
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

  const tableZones = Array.from(new Set(tables.map((t) => t.zone)));

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
              {tenant.name} <span className="text-slate-400 font-normal text-xs ml-1">Terminal #01</span>
            </h2>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'tables' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Floor Plan</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-full font-mono">
                {tables.filter((t) => t.status === 'OCCUPIED').length}/{tables.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fast Order</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInitialData()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
            title="Refresh tables and orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">{currentUser?.name || 'Sarah Cashier'}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
              CASHIER
            </span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-slate-100/60">
          
          {activeTab === 'tables' ? (
            /* Tables Floor Map */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Dining Floor Map</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click table to view active ticket or create new bill</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Open Table</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600">Occupied / Dining</span>
                  </div>
                </div>
              </div>

              {tableZones.map((zone) => {
                const zoneTables = tables.filter((t) => t.zone === zone);
                return (
                  <div key={zone} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">{zone}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                      {zoneTables.map((table) => {
                        const isOccupied = table.status === 'OCCUPIED';
                        const isSelected = selectedTable?.id === table.id;
                        const activeTableOrder = table.orders && table.orders.length > 0 ? table.orders[0] : null;

                        return (
                          <div
                            key={table.id}
                            onClick={() => handleSelectTable(table)}
                            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden group ${
                              isSelected
                                ? 'ring-2 ring-emerald-600 bg-emerald-50/50 border-emerald-500'
                                : isOccupied
                                ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-base text-slate-900">{table.tableNumber}</span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  isOccupied
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isOccupied ? 'OCCUPIED' : 'OPEN'}
                              </span>
                            </div>

                            {isOccupied && activeTableOrder ? (
                              <div className="my-auto">
                                <p className="text-[11px] text-amber-800 font-bold font-mono">{activeTableOrder.orderNumber}</p>
                                <p className="text-sm font-black text-slate-900 mt-0.5">
                                  ฿{activeTableOrder.total.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-slate-500">{activeTableOrder.items.length} items</p>
                              </div>
                            ) : (
                              <div className="my-auto text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{table.capacity} Seats</span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-mono">{table.qrCodeToken}</span>
                              <span className="group-hover:text-emerald-700 transition font-bold">Select →</span>
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
            /* Menu Catalog */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    All Menus
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
                        selectedCategory === c.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
                    placeholder="Search dishes..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAddItemToCart(item)}
                    className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition active:scale-95 group shadow-xs hover:shadow-sm"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-28 rounded-xl object-cover bg-slate-100 mb-2.5 group-hover:scale-102 transition"
                      />
                    ) : (
                      <div className="w-full h-28 rounded-xl bg-slate-100 flex items-center justify-center text-3xl mb-2.5">
                        ☕
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <span className="font-black text-xs text-slate-900 font-mono">฿{item.price.toLocaleString()}</span>
                      <button className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side POS Cart & Register */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 shadow-xs">
          
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Active Register</span>
                {selectedTable && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-black">
                    Table {selectedTable.tableNumber}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {activeOrder ? `Bill Ref: ${activeOrder.orderNumber}` : 'New Order Checkout'}
              </p>
            </div>
            {selectedTable && (
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setActiveOrder(null);
                }}
                className="text-xs text-slate-400 hover:text-rose-600 transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
            {activeOrder && (
              <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-amber-900">Current Table Items:</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black uppercase font-mono">
                    {activeOrder.status}
                  </span>
                </div>
                {activeOrder.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs py-1 text-slate-800 border-b border-amber-200/60 last:border-0">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-black text-slate-900 font-mono">฿{i.subtotal}</span>
                  </div>
                ))}
              </div>
            )}

            {cart.length === 0 && !activeOrder ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-1">Select table or click dish items to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-slate-900">{item.menuItem.name}</h4>
                    <span className="text-[11px] text-slate-900 font-black font-mono">฿{item.itemTotalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => updateCartQty(item.cartId, -1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-black text-xs text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.cartId, 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.cartId)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Discount Selector */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5">
            <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
              <Percent className="w-3 h-3 text-emerald-600" /> Discount:
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold transition ${
                    discountPercent === pct
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {pct === 0 ? '0%' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotals & Pay Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono">฿{rawSubtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Discount ({discountPercent}%)</span>
                <span className="font-mono">-฿{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>VAT ({tenant.taxRate}%)</span>
              <span className="font-mono">฿{calculatedTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-emerald-700 font-mono text-lg">฿{grandTotal.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {cart.length > 0 && (
                <button
                  onClick={handleSendToKitchen}
                  disabled={loading}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
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
                } bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Pay (฿{grandTotal.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Processing Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Payment Settlement</h3>
                <p className="text-xs text-slate-500 font-mono">Invoice Total: ฿{grandTotal.toLocaleString()}</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setPaymentMethod('PROMPTPAY')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'PROMPTPAY'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-6 h-6 text-emerald-600" />
                <span>PromptPay QR</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span>Cash Payment</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-6 h-6 text-emerald-600" />
                <span>Credit / EDC</span>
              </button>
            </div>

            {/* PromptPay View */}
            {paymentMethod === 'PROMPTPAY' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
                <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-xs border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=promptpay-demo-amount-${grandTotal}`}
                    alt="PromptPay QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dynamic PromptPay QR Code</p>
                  <p className="text-[11px] text-slate-500">Scan via any Mobile Banking App</p>
                  <p className="text-base font-black text-emerald-700 mt-1 font-mono">฿{grandTotal.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Cash Calculator View */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-semibold">Cash Tendered:</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-right font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm shadow-xs"
                  />
                </div>
                <div className="flex gap-2">
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(amt)}
                      className="flex-1 py-1.5 bg-white hover:bg-slate-100 rounded-xl text-xs font-extrabold text-slate-800 border border-slate-200 shadow-xs"
                    >
                      ฿{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashReceived(grandTotal)}
                    className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-black border border-emerald-300"
                  >
                    Exact
                  </button>
                </div>
                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Change Due:</span>
                  <span className={cashReceived >= grandTotal ? 'text-emerald-700 font-black font-mono' : 'text-rose-600 font-black font-mono'}>
                    ฿{Math.max(0, cashReceived - grandTotal).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Confirm Payment Action */}
            <button
              onClick={handleCompletePayment}
              disabled={loading || (paymentMethod === 'CASH' && cashReceived < grandTotal)}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm & Print Thermal Receipt (฿{grandTotal.toLocaleString()})</span>
            </button>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {isReceiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm receipt-paper rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="text-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-base uppercase tracking-wider text-slate-900">{tenant.name}</h3>
              <p className="text-[11px] text-slate-500">Official Tax Invoice / Receipt</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(completedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between font-bold">
                <span>Receipt Ref:</span>
                <span>{completedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-bold">{completedOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5 text-xs font-mono">
              {completedOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-bold">฿{it.subtotal}</span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>฿{completedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (7%):</span>
                <span>฿{completedOrder.tax}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200 text-slate-900">
                <span>Total Amount:</span>
                <span>฿{completedOrder.total}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2 font-sans">
              Thank you for visiting! Please visit us again.
            </div>

            <div className="flex gap-2 pt-2 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition border border-slate-200"
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
