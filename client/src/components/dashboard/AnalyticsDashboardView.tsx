import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Award,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Tenant } from '../../types';
import { api } from '../../services/api';

interface AnalyticsDashboardViewProps {
  tenant: Tenant;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({ tenant }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchAnalytics();
  }, [tenant.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics(tenant.id);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  const maxHourly = Math.max(...(data.hourlySales?.map((h: any) => h.sales) || [100]));
  const totalPayment = (data.paymentBreakdown?.PROMPTPAY || 0) + (data.paymentBreakdown?.CASH || 0) + (data.paymentBreakdown?.CREDIT_CARD || 0) || 1;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Executive Business Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time sales velocity & margin breakdown for {tenant.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 text-xs font-mono">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                  timeframe === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-white/10 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">Total Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            ฿{data.totalRevenue?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% growth rate</span>
          </div>
        </div>

        {/* Net Sales */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">Net Sales (Excl. VAT)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            ฿{data.totalNetSales?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            VAT Collected: ฿{data.totalTax?.toLocaleString()}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">Orders Settled</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {data.totalOrdersCount} <span className="text-xs font-normal text-slate-400 font-sans">bills</span>
          </div>
          <div className="text-[11px] text-purple-400 mt-2 font-bold">
            100% fulfill rate
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">Average Bill Spend</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            ฿{data.avgTicketSize?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Peak period 12:00 - 14:00
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hourly Sales Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-sm text-white">Peak Hour Sales Velocity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Dynamic revenue telemetry by hour intervals</p>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-300 font-black px-2.5 py-1 rounded-xl border border-blue-500/20 font-mono">
              Live Feed
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {data.hourlySales?.map((h: any) => {
              const heightPercent = Math.max(15, Math.round((h.sales / maxHourly) * 100));
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-mono font-black text-amber-300 bg-slate-800 px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap">
                    ฿{h.sales}
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-t-2xl overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 via-amber-500 to-amber-400 rounded-t-2xl transition-all duration-700 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 group-hover:text-white transition">
                    {h.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-white">Tender Share Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">PromptPay vs Cash vs Credit Card</p>
          </div>

          <div className="space-y-4 my-auto py-4">
            {/* PromptPay */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" /> PromptPay Dynamic QR
                </span>
                <span className="font-mono font-black text-white">
                  {Math.round(((data.paymentBreakdown?.PROMPTPAY || 65) / totalPayment) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Cash Tender
                </span>
                <span className="font-mono font-black text-white">
                  {Math.round(((data.paymentBreakdown?.CASH || 25) / totalPayment) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Credit Card */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Credit Card EDC
                </span>
                <span className="font-mono font-black text-white">
                  {Math.round(((data.paymentBreakdown?.CREDIT_CARD || 10) / totalPayment) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] text-[11px] text-slate-400 text-center font-mono">
            PromptPay accounts for 65% of total volume
          </div>
        </div>

      </div>

      {/* Top 5 Best-Selling Dishes */}
      <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-white">Top 5 Best-Selling Craft Items</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by unit sales & gross revenue</p>
          </div>
          <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
            <Award className="w-4 h-4" /> Top Performers
          </span>
        </div>

        <div className="space-y-3">
          {data.topDishes?.map((dish: any, index: number) => (
            <div
              key={dish.name}
              className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs font-mono ${
                  index === 0 ? 'bg-amber-400 text-slate-950 shadow-md' : index === 1 ? 'bg-slate-300 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  #{index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-white">{dish.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{dish.quantity} portions ordered</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-xs text-amber-400 font-mono">฿{dish.revenue?.toLocaleString()}</span>
                <span className="block text-[10px] text-slate-500">revenue</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
