import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Grid,
  ChefHat,
  LayoutDashboard,
  Layers,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DemoRoleSwitcher: React.FC = () => {
  const {
    tenants,
    currentTenant,
    activeView,
    setActiveView,
    switchTenant,
    switchRole,
  } = useAuth();

  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentTenant) return null;

  return (
    <aside aria-label="Command Center Toolbar" className="bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-50 select-none">
      
      {/* Brand & Store Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-orange-500/20">
            OP
          </div>
          <div>
            <div className="font-extrabold text-white text-xs tracking-tight flex items-center gap-1.5">
              <span>OmniPOS Suite</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">v0.3.0 Enterprise</p>
          </div>
        </div>

        {/* Store selector dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1">
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] text-slate-400">Store:</span>
          <select
            value={currentTenant.id}
            onChange={(e) => switchTenant(e.target.value)}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Screen Switcher Navigation */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/[0.08] shadow-inner">
        
        {/* Customer QR */}
        <button
          onClick={() => {
            switchRole('CUSTOMER');
            setActiveView('CUSTOMER');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeView === 'CUSTOMER'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>1. QR Menu</span>
        </button>

        {/* Cashier POS */}
        <button
          onClick={() => {
            switchRole('CASHIER');
            setActiveView('POS');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeView === 'POS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>2. POS Floor Map</span>
        </button>

        {/* Kitchen KDS */}
        <button
          onClick={() => {
            switchRole('KITCHEN');
            setActiveView('KDS');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeView === 'KDS'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>3. Kitchen (KDS)</span>
        </button>

        {/* Owner Analytics */}
        <button
          onClick={() => {
            switchRole('OWNER');
            setActiveView('DASHBOARD');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeView === 'DASHBOARD'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>4. Executive BI</span>
        </button>

        {/* Stock & Recipes */}
        <button
          onClick={() => {
            switchRole('OWNER');
            setActiveView('INVENTORY');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeView === 'INVENTORY'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>5. Recipe & Stock</span>
        </button>

      </div>

      {/* System Telemetry & Live Clock */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/[0.06] px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300">WS Live</span>
          <span className="text-slate-500">• 14ms</span>
        </div>

        <div className="font-mono text-xs font-bold text-slate-200 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg">
          {time}
        </div>
      </div>

    </aside>
  );
};
