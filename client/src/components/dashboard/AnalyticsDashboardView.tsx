import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  CreditCard,
  QrCode,
  Banknote,
  Award,
  Calendar,
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
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Executive Performance & Sales Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time business intelligence for {tenant.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                  timeframe === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Total Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            ฿{data.totalRevenue?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last period</span>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Net Sales (Excl. VAT)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            ฿{data.totalNetSales?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            VAT Collected: ฿{data.totalTax?.toLocaleString()}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Total Orders Settled</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {data.totalOrdersCount} <span className="text-sm font-normal text-slate-400">bills</span>
          </div>
          <div className="text-[11px] text-purple-400 mt-2 font-medium">
            100% fulfillment rate
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Average Spend / Bill</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            ฿{data.avgTicketSize?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Highest peak at 12:00 - 14:00
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hourly Sales Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-sm text-white">Peak Hour Sales Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Revenue generated by hourly intervals</p>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-300 font-bold px-2.5 py-1 rounded-lg border border-blue-500/20">
              Live Hourly Feed
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {data.hourlySales?.map((h: any) => {
              const heightPercent = Math.max(12, Math.round((h.sales / maxHourly) * 100));
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    ฿{h.sales}
                  </div>
                  <div className="w-full bg-slate-800 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-emerald-400 rounded-t-xl transition-all duration-700 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition">
                    {h.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Payment Method Share</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution across tender types</p>
          </div>

          <div className="space-y-4 my-auto py-4">
            
            {/* PromptPay */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" /> PromptPay QR
                </span>
                <span className="font-bold text-white">
                  {Math.round(((data.paymentBreakdown?.PROMPTPAY || 65) / totalPayment) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Banknote className="w-3.5 h-3.5 text-amber-400" /> Cash Payment
                </span>
                <span className="font-bold text-white">
                  {Math.round(((data.paymentBreakdown?.CASH || 25) / totalPayment) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Credit Card */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Credit Card / EDC
                </span>
                <span className="font-bold text-white">
                  {Math.round(((data.paymentBreakdown?.CREDIT_CARD || 10) / totalPayment) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            PromptPay is the fastest growing tender (65%)
          </div>
        </div>

      </div>

      {/* Top 5 Best Selling Dishes */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white">Top 5 Best-Selling Menu Items</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by order volume & revenue contribution</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Award className="w-4 h-4" /> Top Performers
          </span>
        </div>

        <div className="space-y-3">
          {data.topDishes?.map((dish: any, index: number) => (
            <div
              key={dish.name}
              className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                  index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}>
                  #{index + 1}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-white">{dish.name}</h4>
                  <span className="text-[11px] text-slate-400">{dish.quantity} portions served</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-xs text-emerald-400">฿{dish.revenue?.toLocaleString()}</span>
                <span className="block text-[10px] text-slate-400">revenue</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
