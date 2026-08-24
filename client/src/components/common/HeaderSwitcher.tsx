import React from 'react';
import { Store, Grid, ChefHat, Smartphone, Layers, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HeaderSwitcher: React.FC = () => {
  const {
    tenants,
    currentTenant,
    currentRole,
    activeView,
    setActiveView,
    switchTenant,
    switchRole,
  } = useAuth();

  if (!currentTenant) return null;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      
      {/* Multi-Tenant Store Selector */}
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-emerald-400" />
        <span className="text-slate-400 font-medium">Active Store:</span>
        <select
          value={currentTenant.id}
          onChange={(e) => switchTenant(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Screen Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            switchRole('CUSTOMER');
            setActiveView('CUSTOMER');
          }}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'CUSTOMER'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Customer QR</span>
        </button>

        <button
          onClick={() => {
            switchRole('CASHIER');
            setActiveView('POS');
          }}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'POS'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>POS Register</span>
        </button>

        <button
          onClick={() => {
            switchRole('KITCHEN');
            setActiveView('KDS');
          }}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'KDS'
              ? 'bg-orange-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Kitchen (KDS)</span>
        </button>

        <button
          onClick={() => {
            switchRole('OWNER');
            setActiveView('DASHBOARD');
          }}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'DASHBOARD'
              ? 'bg-blue-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Owner Analytics</span>
        </button>

        <button
          onClick={() => {
            switchRole('OWNER');
            setActiveView('INVENTORY');
          }}
          className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
            activeView === 'INVENTORY'
              ? 'bg-purple-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stock & Recipe</span>
        </button>
      </div>

      {/* Role Badge Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400">Current Role:</span>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase">
          {currentRole}
        </span>
      </div>

    </div>
  );
};
