import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Layers,
  X,
} from 'lucide-react';
import { Tenant } from '../../types';
import { api } from '../../services/api';

interface InventoryViewProps {
  tenant: Tenant;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ tenant }) => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(500);

  useEffect(() => {
    fetchIngredients();
  }, [tenant.id]);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const data = await api.getIngredients(tenant.id);
      setIngredients(data);
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedIngredient || restockAmount <= 0) return;
    try {
      await api.restockIngredient(selectedIngredient.id, restockAmount);
      setSelectedIngredient(null);
      await fetchIngredients();
    } catch (err: any) {
      alert('Restock failed: ' + (err.message || 'Error'));
    }
  };

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minStockAlert).length;
  const totalStockValue = ingredients.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-900 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Raw Ingredients & Automated Recipe Deduction
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock ledger with automatic recipe deduction on fulfilled orders
          </p>
        </div>
        <button
          onClick={fetchIngredients}
          className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Total Tracked Ingredients</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{ingredients.length} SKU</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Low Stock Warnings</span>
          <div className={`text-2xl font-black mt-1 font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {lowStockCount} items
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Est. Raw Asset Value</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ฿{Math.round(totalStockValue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ing) => {
          const isLow = ing.currentStock <= ing.minStockAlert;
          const ratio = Math.min(100, Math.round((ing.currentStock / (ing.minStockAlert * 3)) * 100));

          return (
            <div
              key={ing.id}
              className={`bg-white border rounded-3xl p-5 flex flex-col justify-between transition shadow-xs ${
                isLow ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{ing.name}</h4>
                  {isLow && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3 h-3" /> LOW STOCK
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-black text-slate-900">
                    {ing.currentStock.toLocaleString()}{' '}
                    <span className="text-xs font-semibold text-slate-500 font-sans">{ing.unit}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    Threshold: {ing.minStockAlert} {ing.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>

                {/* Linked Dishes */}
                {ing.recipeItems && ing.recipeItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-bold block mb-1.5">
                      Auto-deducted in recipes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ing.recipeItems.map((r: any) => (
                        <span
                          key={r.id}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono"
                        >
                          {r.menuItem?.name} (-{r.quantityRequired}{ing.unit})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Unit Cost: ฿{ing.costPerUnit}/{ing.unit}</span>
                <button
                  onClick={() => {
                    setSelectedIngredient(ing);
                    setRestockAmount(ing.unit === 'g' || ing.unit === 'ml' ? 1000 : 20);
                  }}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Restock</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Stock In Ledger</h3>
                <p className="text-xs text-slate-500">{selectedIngredient.name}</p>
              </div>
              <button onClick={() => setSelectedIngredient(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-600 font-semibold">Quantity to Add ({selectedIngredient.unit}):</label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono shadow-xs"
              />
            </div>

            <div className="flex gap-2 font-mono">
              {[500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setRestockAmount(amt)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 border border-slate-200"
                >
                  +{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleRestock}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-2xl text-xs transition shadow-md"
            >
              Confirm Restock (+{restockAmount} {selectedIngredient.unit})
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
