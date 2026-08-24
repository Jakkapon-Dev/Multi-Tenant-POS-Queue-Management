import React, { useState } from 'react';
import {
  QrCode,
  Banknote,
  CreditCard,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Tenant, Order } from '../../types';

interface PaymentModalProps {
  tenant: Tenant;
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaySuccess: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  tenant,
  order,
  isOpen,
  onClose,
  onPaySuccess,
}) => {
  const [method, setMethod] = useState<'PROMPTPAY' | 'CASH' | 'CREDIT_CARD'>('PROMPTPAY');
  const [cashTendered, setCashTendered] = useState<number>(order.total);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const paidOrder: Order = {
        ...order,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: method,
      };
      onPaySuccess(paidOrder);
    }, 1200);
  };

  const changeDue = Math.max(0, cashTendered - order.total);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">Payment Checkout Simulation</h3>
            <p className="text-xs text-slate-400">Order {order.orderNumber} • {tenant.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Picker */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMethod('PROMPTPAY')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
              method === 'PROMPTPAY'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>PromptPay</span>
          </button>

          <button
            onClick={() => setMethod('CASH')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
              method === 'CASH'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setMethod('CREDIT_CARD')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
              method === 'CREDIT_CARD'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Credit Card</span>
          </button>
        </div>

        {/* Dynamic Display Area */}
        {method === 'PROMPTPAY' && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-center space-y-3">
            <div className="w-40 h-40 mx-auto bg-white p-2.5 rounded-2xl shadow-inner flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=promptpay-omnipos-${order.id}-${order.total}`}
                alt="PromptPay Dynamic QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Scan via Any Banking App</p>
              <p className="text-base font-extrabold text-emerald-400 mt-1">฿{order.total.toLocaleString()}</p>
            </div>
          </div>
        )}

        {method === 'CASH' && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Cash Received:</span>
              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setCashTendered(val)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 border border-slate-700"
                >
                  ฿{val}
                </button>
              ))}
              <button
                onClick={() => setCashTendered(order.total)}
                className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/40"
              >
                Exact
              </button>
            </div>
            <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-700">
              <span className="text-slate-400">Change Due:</span>
              <span className="text-emerald-400 font-extrabold text-sm">฿{changeDue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {method === 'CREDIT_CARD' && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Tap / Insert / Swipe Card</p>
              <p className="text-[11px] text-slate-400 mt-0.5">EDC Terminal Connected • Visa / Mastercard</p>
              <p className="text-base font-extrabold text-blue-400 mt-1">฿{order.total.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSimulatePayment}
          disabled={isProcessing || (method === 'CASH' && cashTendered < order.total)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-500/25"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              Authorizing Payment...
            </span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Pay ฿{order.total.toLocaleString()}</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
