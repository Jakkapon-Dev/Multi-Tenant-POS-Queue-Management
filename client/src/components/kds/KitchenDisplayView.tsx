import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  RefreshCw,
  Flame,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import { Tenant, Order } from '../../types';
import { api } from '../../services/api';
import { getSocket, joinTenantRoom } from '../../services/socket';

interface KitchenDisplayViewProps {
  tenant: Tenant;
  currentUser?: any;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({ tenant }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const [search, setSearch] = useState('');
  const [oldestFirst, setOldestFirst] = useState(true);
  const searchInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio alert:', e);
    }
  };

  useEffect(() => {
    fetchKdsOrders();
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);

    const socket = getSocket();
    joinTenantRoom(tenant.id);

    const handleNewOrder = (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      playNewOrderChime();
    };

    const handleStatusUpdate = (updatedOrder: Order) => {
      setOrders((prev) => {
        if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
          return prev.filter((o) => o.id !== updatedOrder.id);
        }
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (exists) {
          return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        }
        return [updatedOrder, ...prev];
      });
    };

    socket.on('order:created', handleNewOrder);
    socket.on('kds:new_order', handleNewOrder);
    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      clearInterval(interval);
      socket.off('order:created', handleNewOrder);
      socket.off('kds:new_order', handleNewOrder);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [tenant.id]);

  const fetchKdsOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getKdsOrders(tenant.id);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load KDS orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus);
      if (nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleToggleItemStatus = async (itemId?: string, currentStatus?: string) => {
    if (!itemId) return;
    const next = currentStatus === 'DONE' ? 'QUEUED' : 'DONE';
    try {
      await api.updateOrderItemStatus(itemId, next);
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((it) => (it.id === itemId ? { ...it, status: next } : it)),
        }))
      );
    } catch (err) {
      console.error('Failed to toggle item status:', err);
    }
  };

  const getElapsedMinutes = (createdAt: string): number => {
    const start = new Date(createdAt).getTime();
    const now = currentTime.getTime();
    return Math.max(0, Math.floor((now - start) / 60000));
  };

  const query = search.trim().toLowerCase();
  const matchingOrders = orders.filter((order) => {
    const fields = [order.orderNumber, order.table?.tableNumber, ...order.items.map((item) => item.name)];
    return fields.some((field) => field?.toLowerCase().includes(query));
  });
  const displayedOrders = matchingOrders
    .filter((order) => filterStatus === 'ALL' || order.status === filterStatus)
    .sort((a, b) => oldestFirst
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      
      {/* Top KDS Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                Kitchen Display System (KDS)
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">{tenant.name} • Live Ticket Stream</p>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 ml-4">
            {(['ALL', 'PENDING', 'PREPARING', 'READY'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-1 rounded-lg text-xs font-black transition ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status} ({matchingOrders.filter((o) => (status === 'ALL' ? true : o.status === status)).length})
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound alert switch */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Chime {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={fetchKdsOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-700 flex items-center gap-1.5 font-mono">
            <Flame className="w-3.5 h-3.5" />
            <span>Chef Station</span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-white border-b border-slate-200">
        <label htmlFor="ticket-search" className="text-xs font-bold">Find a ticket</label>
        <input
          id="ticket-search"
          ref={searchInput}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Order, table, or dish"
          className="min-w-0 w-48 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              searchInput.current?.focus();
            }}
            className="px-2 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Clear search
          </button>
        )}
        <label className="text-xs font-bold">Ticket order
          <select value={oldestFirst ? 'oldest' : 'newest'} onChange={(event) => setOldestFirst(event.target.value === 'oldest')}
            className="ml-2 px-2 py-1.5 rounded-lg border border-slate-300">
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
        <span role="status" className="text-xs text-slate-500">
          {displayedOrders.length} {displayedOrders.length === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>

      {/* Kanban Ticket Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-100">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
            <UtensilsCrossed className="w-14 h-14 mb-3 stroke-1 text-slate-300 animate-bounce" />
            <h3 className="text-base font-extrabold text-slate-700">
              {query ? 'No tickets match your search' : 'No tickets in this status'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {query ? 'Try another order, table, or dish.' : 'Incoming orders will appear here as they arrive.'}
            </p>
          </div>
        ) : (
          <div className="flex gap-5 h-full items-start">
            {displayedOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed > 10;
              const isWarning = elapsed > 5 && elapsed <= 10;

              return (
                <div
                  key={order.id}
                  className={`w-80 flex-shrink-0 bg-white border rounded-3xl flex flex-col max-h-full shadow-md transition overflow-hidden ${
                    order.status === 'PENDING'
                      ? 'border-amber-400 ring-2 ring-amber-100'
                      : order.status === 'PREPARING'
                      ? 'border-orange-400 ring-2 ring-orange-100'
                      : 'border-emerald-500 ring-2 ring-emerald-100'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-4 flex items-center justify-between border-b ${
                      order.status === 'PENDING'
                        ? 'bg-amber-50 border-amber-200'
                        : order.status === 'PREPARING'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-slate-900 font-mono">{order.orderNumber}</span>
                        <span className="text-xs bg-white text-slate-800 font-bold px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{order.customerName}</p>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`flex items-center gap-1 text-xs font-mono font-black px-2.5 py-1 rounded-xl ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : isWarning
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m</span>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Note: {order.notes}</span>
                    </div>
                  )}

                  {/* Item Checklist */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
                    {order.items.map((item) => {
                      const isDone = item.status === 'DONE';
                      let parsedModifiers: any[] = [];
                      try {
                        if (item.modifiers) {
                          parsedModifiers = typeof item.modifiers === 'string' ? JSON.parse(item.modifiers) : item.modifiers;
                        }
                      } catch (e) {}

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItemStatus(item.id, item.status)}
                          className={`pt-2.5 first:pt-0 flex items-start justify-between gap-3 cursor-pointer group transition select-none ${
                            isDone ? 'opacity-40 line-through' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 transition ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 group-hover:border-orange-500 bg-slate-50'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900">
                                {item.quantity}x {item.name}
                              </span>
                              {parsedModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parsedModifiers.map((m, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                    >
                                      {m.optionName || m}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-amber-700 italic mt-0.5">"{item.notes}"</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready / Bump</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Served to Table</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
