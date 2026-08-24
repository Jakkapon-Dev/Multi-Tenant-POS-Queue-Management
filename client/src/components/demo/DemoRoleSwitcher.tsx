import React from 'react';
import {
  Smartphone,
  Grid,
  ChefHat,
  LayoutDashboard,
  Layers,
  Store,
  Zap,
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

  if (!currentTenant) return null;

  return (
    <aside aria-label="Demo Controller" className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-emerald-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg z-50">
      
      {/* Brand & Recruiter Guide Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-xs shadow-md shadow-emerald-500/20">
          <Zap className="w-3.5 h-3.5 fill-current" />
        </div>
        <div>
          <span className="font-extrabold text-white tracking-wide">OmniPOS Portfolio Demo</span>
          <span className="text-[10px] text-emerald-400 font-semibold ml-2 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            One-Click Role Switcher
          </span>
        </div>
      </div>

      {/* Multi-Tenant Switcher */}
      <div className="flex items-center gap-2">
        <Store className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400 font-semibold">Store:</span>
        <select
          value={currentTenant.id}
          onChange={(e) => switchTenant(e.target.value)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
      </div>

      {/* 5 Screen Role Switcher Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        
        {/* Customer QR */}
        <button
          onClick={() => {
            switchRole('CUSTOMER');
            setActiveView('CUSTOMER');
          }}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'CUSTOMER'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Customer Mobile QR self-order experience"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>1. Customer QR</span>
        </button>

        {/* Cashier POS */}
        <button
          onClick={() => {
            switchRole('CASHIER');
            setActiveView('POS');
          }}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'POS'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Cashier POS Table Map & Register"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>2. POS Register</span>
        </button>

        {/* Kitchen KDS */}
        <button
          onClick={() => {
            switchRole('KITCHEN');
            setActiveView('KDS');
          }}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'KDS'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Real-Time Kitchen Display Kanban"
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
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'DASHBOARD'
              ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Executive Revenue & Best-Sellers Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>4. Analytics</span>
        </button>

        {/* Inventory & Recipes */}
        <button
          onClick={() => {
            switchRole('OWNER');
            setActiveView('INVENTORY');
          }}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'INVENTORY'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Raw Ingredients & Recipe Auto-Deduction"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>5. Stock & Recipes</span>
        </button>

      </div>

    </aside>
  );
};
