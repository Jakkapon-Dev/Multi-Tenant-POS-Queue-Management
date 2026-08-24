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
  RotateCcw,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Tenant, Order, OrderItem, User } from '../../types';
import { api } from '../../services/api';
import { getSocket, joinTenantRoom } from '../../services/socket';

interface KitchenDisplayViewProps {
  tenant: Tenant;
  currentUser?: User;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({ tenant, currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Synth chime for incoming orders
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio context alert:', e);
    }
  };

  useEffect(() => {
    fetchKdsOrders();
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);

    // Setup Socket connection
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

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (createdAt: string): number => {
    const start = new Date(createdAt).getTime();
    const now = currentTime.getTime();
    return Math.max(0, Math.floor((now - start) / 60000));
  };

  const displayedOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* Top KDS Navbar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                Kitchen Display System (KDS)
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </h2>
              <p className="text-[11px] text-slate-400">{tenant.name} • Live Queue</p>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 ml-4">
            {(['ALL', 'PENDING', 'PREPARING', 'READY'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterStatus === status
                    ? 'bg-orange-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {status} ({orders.filter((o) => (status === 'ALL' ? true : o.status === status)).length})
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-800/40 border-slate-800 text-slate-500'
            }`}
            title="Toggle alert chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={fetchKdsOrders}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-orange-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>Chef Station</span>
          </div>
        </div>
      </header>

      {/* Kanban Ticket Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-950/60">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
            <UtensilsCrossed className="w-16 h-16 mb-3 stroke-1 text-slate-600 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-300">All Kitchen Orders Cleared!</h3>
            <p className="text-xs text-slate-500 mt-1">New incoming orders will appear here in real-time.</p>
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
                  className={`w-80 flex-shrink-0 bg-slate-900 border rounded-3xl flex flex-col max-h-full shadow-2xl transition overflow-hidden ${
                    order.status === 'PENDING'
                      ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                      : order.status === 'PREPARING'
                      ? 'border-orange-500/60 ring-1 ring-orange-500/30'
                      : 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-4 flex items-center justify-between border-b ${
                      order.status === 'PENDING'
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : order.status === 'PREPARING'
                        ? 'bg-orange-500/10 border-orange-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white">{order.orderNumber}</span>
                        <span className="text-xs bg-slate-950/40 text-slate-300 font-bold px-2 py-0.5 rounded-lg border border-slate-700">
                          {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{order.customerName}</p>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-xl ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m</span>
                    </div>
                  </div>

                  {/* Order Notes if any */}
                  {order.notes && (
                    <div className="bg-amber-950/30 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Note: {order.notes}</span>
                    </div>
                  )}

                  {/* Item Checklist */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
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
                                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                  : 'border-slate-600 group-hover:border-orange-400'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-white">
                                {item.quantity}x {item.name}
                              </span>
                              {parsedModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parsedModifiers.map((m, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                                    >
                                      {m.optionName || m}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-[10px] text-amber-300 italic mt-0.5">"{item.notes}"</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Footer Action Buttons */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="flex-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-orange-500/20"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready / Bump</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                        className="flex-1 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-blue-500/20"
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
