import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, Plus, Minus, Check, X } from 'lucide-react';
import { Tenant, Category, MenuItem, DiningTable, CartItem, Order } from '../../types';
import { api } from '../../services/api';

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
  }, [tenant.id, table?.id]);

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
    
    // Default required modifiers
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
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      alert('Order failed: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items
  const allItems = categories.flatMap((c) => c.menuItems);
  const displayedItems = (selectedCategoryId === 'all'
    ? allItems
    : categories.find((c) => c.id === selectedCategoryId)?.menuItems || []
  ).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center pb-24 selection:bg-brand-500">
      <div className="w-full max-w-md bg-slate-900 border-x border-slate-800 flex flex-col min-h-screen relative shadow-2xl">
        
        {/* Header Bar */}
        <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && (
              <img src={tenant.logoUrl} alt={tenant.name} className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/30" />
            )}
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-none">{tenant.name}</h1>
              <span className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {table ? `Table: ${table.tableNumber} (${table.zone})` : 'Takeaway / QR Self-Order'}
              </span>
            </div>
          </div>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              Exit Demo
            </button>
          )}
        </div>

        {/* Active Order Banner if order in progress */}
        {activeOrder && activeOrder.status !== 'COMPLETED' && (
          <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {activeOrder.orderNumber}
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-300">Order Placed & Live</p>
                <p className="text-[11px] text-slate-400">
                  Status:{' '}
                  <span className="text-emerald-400 font-bold uppercase">{activeOrder.status}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-white">฿{activeOrder.total.toLocaleString()}</span>
              <span className="block text-[10px] text-slate-400">{activeOrder.items.length} items</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 mt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search coffee, croissants, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Tab Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar border-b border-slate-800/60">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedCategoryId === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🌟 All Menus
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                selectedCategoryId === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{cat.icon || '🍽️'}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Menu Items Grid / List */}
        <div className="flex-1 px-4 py-3 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Loading delicious menu...</div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No menu items found</div>
          ) : (
            displayedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-3 flex gap-3.5 cursor-pointer transition active:scale-[0.98] group"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-700 flex-shrink-0 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 text-xl flex-shrink-0">
                    ☕
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm text-white">฿{item.price.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      {item.prepTimeMinutes}m
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Cart Button (Mobile Sticky Bottom) */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-xl shadow-emerald-500/25 transition transform active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-slate-950/20 px-2.5 py-0.5 rounded-lg text-xs font-extrabold">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </div>
                <span className="text-sm">View Cart ({cart.length} items)</span>
              </div>
              <span className="text-sm font-extrabold tracking-tight">฿{cartTotal.toLocaleString()}</span>
            </button>
          </div>
        )}

        {/* Item Customizer Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              
              {/* Modal Image Header */}
              <div className="relative h-44 bg-slate-800 flex-shrink-0">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full backdrop-blur-sm transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-white">{selectedItem.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedItem.description}</p>
                  <p className="text-sm font-bold text-emerald-400 mt-2">฿{selectedItem.price.toLocaleString()}</p>
                </div>

                {/* Modifiers */}
                {selectedItem.modifierGroups && selectedItem.modifierGroups.map((group) => (
                  <div key={group.name} className="border-t border-slate-800 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-200">{group.name}</span>
                      {group.isRequired && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Required</span>
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
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>
                            {opt.extraPrice > 0 && (
                              <span className="text-slate-400">+฿{opt.extraPrice}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Special Instructions */}
                <div className="border-t border-slate-800 pt-3">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Special Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Extra hot, separate sauce, allergy alerts..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
                <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
                  <button
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition shadow-lg shadow-emerald-500/20"
                >
                  <span>Add to Order</span>
                  <span>฿{calculateItemModalPrice().toLocaleString()}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Drawer Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-bold text-sm text-white">Your Cart ({cart.length} items)</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {cart.map((item) => (
                  <div key={item.cartId} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-white">{item.menuItem.name}</h4>
                        <span className="font-bold text-xs text-emerald-400">฿{item.itemTotalPrice.toLocaleString()}</span>
                      </div>
                      {item.selectedModifiers.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-amber-300/80 italic mt-0.5">Note: "{item.notes}"</p>
                      )}
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.cartId)}
                      className="text-slate-500 hover:text-rose-400 p-1 self-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary & Confirm */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>฿{cartSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>VAT ({tenant.taxRate}%)</span>
                  <span>฿{cartTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">฿{cartTotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  {isSubmitting ? (
                    <span>Sending to Kitchen...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Send Order to Kitchen</span>
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
