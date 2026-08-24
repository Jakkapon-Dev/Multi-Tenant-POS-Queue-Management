import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  Plus,
  Minus,
  Check,
  X,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Tenant, Category, MenuItem, DiningTable, CartItem, Order } from '../../types';
import { api } from '../../services/api';
import { getSocket, joinTenantRoom, joinOrderRoom } from '../../services/socket';

interface CustomerViewProps {
  tenant: Tenant;
  table?: DiningTable;
  onBackToApp?: () => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({ tenant, table, onBackToApp }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  // Modifier selection state
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, { optionName: string; extraPrice: number }>>({});
  const [itemNotes, setItemNotes] = useState<string>('');
  const [modalQuantity, setModalQuantity] = useState<number>(1);

  // Cart & Order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMenu();
    if (table?.orders && table.orders.length > 0) {
      setActiveOrder(table.orders[0]);
    }

    const socket = getSocket();
    joinTenantRoom(tenant.id);

    const handleCustomerOrderUpdate = (updated: Order) => {
      if (activeOrder && updated.id === activeOrder.id) {
        setActiveOrder(updated);
      }
    };

    socket.on('order:customer_update', handleCustomerOrderUpdate);
    socket.on('order:status_updated', (ord: Order) => {
      if (activeOrder && ord.id === activeOrder.id) {
        setActiveOrder(ord);
      }
    });

    return () => {
      socket.off('order:customer_update', handleCustomerOrderUpdate);
    };
  }, [tenant.id, table?.id, activeOrder?.id]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await api.getMenu(tenant.id);
      setCategories(data);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = (item: MenuItem) => {
    setSelectedItem(item);
    setModalQuantity(1);
    setItemNotes('');
    
    const defaultMods: Record<string, { optionName: string; extraPrice: number }> = {};
    if (item.modifierGroups) {
      item.modifierGroups.forEach((g) => {
        if (g.isRequired && g.options.length > 0) {
          defaultMods[g.name] = { optionName: g.options[0].name, extraPrice: g.options[0].extraPrice };
        }
      });
    }
    setSelectedModifiers(defaultMods);
  };

  const calculateItemModalPrice = (): number => {
    if (!selectedItem) return 0;
    const modsTotal = Object.values(selectedModifiers).reduce((sum, mod) => sum + mod.extraPrice, 0);
    return (selectedItem.price + modsTotal) * modalQuantity;
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const formattedModifiers = Object.entries(selectedModifiers).map(([groupName, val]) => ({
      groupName,
      optionName: val.optionName,
      extraPrice: val.extraPrice,
    }));

    const modsTotal = formattedModifiers.reduce((sum, m) => sum + m.extraPrice, 0);
    const itemTotalPrice = (selectedItem.price + modsTotal) * modalQuantity;

    const newCartItem: CartItem = {
      cartId: `${selectedItem.id}-${Date.now()}`,
      menuItem: selectedItem,
      quantity: modalQuantity,
      selectedModifiers: formattedModifiers,
      notes: itemNotes,
      itemTotalPrice,
    };

    setCart((prev) => [...prev, newCartItem]);
    setSelectedItem(null);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const cartTax = Math.round((cartSubtotal * (tenant.taxRate / 100)) * 100) / 100;
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      setIsSubmitting(true);
      const itemsPayload = cart.map((c) => ({
        menuItemId: c.menuItem.id,
        name: c.menuItem.name,
        price: c.menuItem.price + c.selectedModifiers.reduce((s, m) => s + m.extraPrice, 0),
        quantity: c.quantity,
        notes: c.notes,
        modifiers: c.selectedModifiers,
      }));

      const order = await api.createOrder({
        tenantId: tenant.id,
        tableId: table?.id || null,
        customerName: table ? `Table ${table.tableNumber}` : 'Guest',
        orderType: table ? 'DINE_IN' : 'TAKEAWAY',
        items: itemsPayload,
      });

      setActiveOrder(order);
      joinOrderRoom(order.id);
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      alert('Order failed: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const allItems = categories.flatMap((c) => c.menuItems);
  const displayedItems = (selectedCategoryId === 'all'
    ? allItems
    : categories.find((c) => c.id === selectedCategoryId)?.menuItems || []
  ).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center pb-28 font-sans">
      <div className="w-full max-w-md bg-white border-x border-slate-200 flex flex-col min-h-screen relative shadow-md">
        
        {/* Clean Light Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base border border-emerald-100">
                ☕
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">{tenant.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {table ? `Table ${table.tableNumber} (${table.zone})` : 'QR Table Order'}
                </span>
              </div>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-[11px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
            >
              Exit View
            </button>
          )}
        </div>

        {/* Live Order Tracker Banner */}
        {activeOrder && activeOrder.status !== 'COMPLETED' && (
          <div className="mx-4 mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {activeOrder.orderNumber}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-slate-900">Live Kitchen Ticket</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Status:{' '}
                  <span className="text-emerald-700 font-black uppercase tracking-wide">
                    {activeOrder.status === 'PENDING' ? '⏳ Queued in Kitchen' : activeOrder.status === 'PREPARING' ? '🔥 Cooking Now' : '✨ Ready to Serve!'}
                  </span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-slate-900">฿{activeOrder.total.toLocaleString()}</span>
              <span className="block text-[10px] text-slate-500 font-medium">{activeOrder.items.length} items</span>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="px-4 mt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search coffee, pastries, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Tab Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar border-b border-slate-100">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⭐ All Menus
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
                selectedCategoryId === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon || '🍽️'}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="flex-1 px-4 py-3 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading fresh menu...</div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No items match your search</div>
          ) : (
            displayedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 rounded-3xl p-3 flex gap-3.5 cursor-pointer transition-all duration-200 active:scale-[0.98] group shadow-xs hover:shadow-sm"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 rounded-2xl object-cover bg-slate-100 flex-shrink-0 group-hover:scale-105 transition duration-300 shadow-xs"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl flex-shrink-0">
                    ☕
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                    <span className="font-extrabold text-sm text-slate-900">฿{item.price.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg font-medium">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      {item.prepTimeMinutes}m
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Cart Pill */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-xl transition transform active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-xl text-xs font-black">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </div>
                <span className="text-xs tracking-tight">Review Cart</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono">฿{cartTotal.toLocaleString()}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Item Customizer Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
              
              <div className="relative h-48 bg-slate-100 flex-shrink-0">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full backdrop-blur-sm transition shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{selectedItem.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{selectedItem.description}</p>
                  <p className="text-sm font-extrabold text-emerald-700 mt-2 font-mono">฿{selectedItem.price.toLocaleString()}</p>
                </div>

                {selectedItem.modifierGroups && selectedItem.modifierGroups.map((group) => (
                  <div key={group.name} className="border-t border-slate-100 pt-3.5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-800">{group.name}</span>
                      {group.isRequired && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {group.options.map((opt) => {
                        const isSelected = selectedModifiers[group.name]?.optionName === opt.name;
                        return (
                          <label
                            key={opt.name}
                            onClick={() => setSelectedModifiers((prev) => ({
                              ...prev,
                              [group.name]: { optionName: opt.name, extraPrice: opt.extraPrice },
                            }))}
                            className={`flex items-center justify-between p-3 rounded-2xl border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>
                            {opt.extraPrice > 0 && (
                              <span className="text-slate-500 font-mono">+฿{opt.extraPrice}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3.5">
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">Special Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Extra hot, separate sauce, allergies..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center bg-white rounded-2xl border border-slate-200 p-1">
                  <button
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-slate-900">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-between transition shadow-md"
                >
                  <span>Add to Order</span>
                  <span className="font-mono">฿{calculateItemModalPrice().toLocaleString()}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Drawer Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-extrabold text-sm text-slate-900">Your Order Summary ({cart.length} items)</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {cart.map((item) => (
                  <div key={item.cartId} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900">{item.menuItem.name}</h4>
                        <span className="font-extrabold text-xs text-slate-900 font-mono">฿{item.itemTotalPrice.toLocaleString()}</span>
                      </div>
                      {item.selectedModifiers.length > 0 && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-amber-700 italic mt-0.5">Note: "{item.notes}"</p>
                      )}
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
                        <span>Quantity: {item.quantity}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.cartId)}
                      className="text-slate-400 hover:text-rose-600 p-1 self-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">฿{cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>VAT ({tenant.taxRate}%)</span>
                  <span className="font-mono">฿{cartTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-emerald-700 font-mono text-base font-black">฿{cartTotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <span>Sending Ticket to Kitchen...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Send Order to Kitchen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
