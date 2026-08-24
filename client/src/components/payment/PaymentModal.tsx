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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Payment Checkout Simulation</h3>
            <p className="text-xs text-slate-500 font-mono">Order {order.orderNumber} • {tenant.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Picker */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMethod('PROMPTPAY')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
              method === 'PROMPTPAY'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-5 h-5 text-emerald-600" />
            <span>PromptPay</span>
          </button>

          <button
            onClick={() => setMethod('CASH')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
              method === 'CASH'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setMethod('CREDIT_CARD')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
              method === 'CREDIT_CARD'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Credit Card</span>
          </button>
        </div>

        {/* Dynamic Display Area */}
        {method === 'PROMPTPAY' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-40 h-40 mx-auto bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=promptpay-omnipos-${order.id}-${order.total}`}
                alt="PromptPay Dynamic QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Scan via Any Banking App</p>
              <p className="text-base font-black text-emerald-700 mt-1 font-mono">฿{order.total.toLocaleString()}</p>
            </div>
          </div>
        )}

        {method === 'CASH' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Cash Received:</span>
              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-right font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono shadow-xs"
              />
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setCashTendered(val)}
                  className="flex-1 py-1.5 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-800 border border-slate-200 shadow-xs"
                >
                  ฿{val}
                </button>
              ))}
              <button
                onClick={() => setCashTendered(order.total)}
                className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-black border border-emerald-300"
              >
                Exact
              </button>
            </div>
            <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-600">Change Due:</span>
              <span className="text-emerald-700 font-black text-sm font-mono">฿{changeDue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {method === 'CREDIT_CARD' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Tap / Insert / Swipe Card</p>
              <p className="text-[11px] text-slate-500 mt-0.5">EDC Terminal Connected • Visa / Mastercard</p>
              <p className="text-base font-black text-blue-600 mt-1 font-mono">฿{order.total.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSimulatePayment}
          disabled={isProcessing || (method === 'CASH' && cashTendered < order.total)}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Authorizing Payment...
            </span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Confirm & Pay ฿{order.total.toLocaleString()}</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
