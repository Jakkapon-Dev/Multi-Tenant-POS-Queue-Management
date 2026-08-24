import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoRoleSwitcher } from './components/demo/DemoRoleSwitcher';
import { CustomerView } from './components/customer/CustomerView';
import { CashierPosView } from './components/pos/CashierPosView';
import { KitchenDisplayView } from './components/kds/KitchenDisplayView';
import { AnalyticsDashboardView } from './components/dashboard/AnalyticsDashboardView';
import { InventoryView } from './components/inventory/InventoryView';

const MainApp: React.FC = () => {
  const { currentTenant, currentUser, activeView, setActiveView, loading } = useAuth();

  if (loading || !currentTenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Loading OmniPOS Platform...</p>
      </div>
    );
  }

  // Get first available table for Customer View simulation
  const sampleTable = currentTenant.tables && currentTenant.tables.length > 0
    ? currentTenant.tables[0]
    : undefined;

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden select-none">
      
      {/* Demo Switcher Bar at Top */}
      <DemoRoleSwitcher />

      {/* Main Screen View */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'CUSTOMER' && (
          <CustomerView
            tenant={currentTenant}
            table={sampleTable}
            onBackToApp={() => setActiveView('POS')}
          />
        )}

        {activeView === 'POS' && (
          <CashierPosView
            tenant={currentTenant}
            currentUser={currentUser || undefined}
          />
        )}

        {activeView === 'KDS' && (
          <KitchenDisplayView
            tenant={currentTenant}
            currentUser={currentUser || undefined}
          />
        )}

        {activeView === 'DASHBOARD' && (
          <AnalyticsDashboardView
            tenant={currentTenant}
          />
        )}

        {activeView === 'INVENTORY' && (
          <InventoryView
            tenant={currentTenant}
          />
        )}
      </main>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
