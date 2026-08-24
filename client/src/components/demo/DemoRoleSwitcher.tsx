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
    <aside aria-label="Command Center Toolbar" className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-50 select-none shadow-sm">
      
      {/* Brand & Store Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            OP
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
              <span>OmniPOS</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">v0.3.0 Enterprise</p>
          </div>
        </div>

        {/* Store selector dropdown */}
        <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1">
          <Store className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] text-slate-600 font-medium">Store:</span>
          <select
            value={currentTenant.id}
            onChange={(e) => switchTenant(e.target.value)}
            className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer pr-1"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id} className="bg-white text-slate-900">
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Screen Switcher Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
        
        {/* Customer QR */}
        <button
          onClick={() => {
            switchRole('CUSTOMER');
            setActiveView('CUSTOMER');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeView === 'CUSTOMER'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>5. Recipe & Stock</span>
        </button>

      </div>

      {/* System Telemetry & Live Clock */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">WS Live</span>
          <span className="text-slate-400">• 14ms</span>
        </div>

        <div className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
          {time}
        </div>
      </div>

    </aside>
  );
};
