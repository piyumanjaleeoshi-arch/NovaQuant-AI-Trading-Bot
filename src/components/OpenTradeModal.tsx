import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import { TradeDirection, RiskCheckResult } from '../types';

interface OpenTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  direction: TradeDirection;
  currentPrice: number;
  riskCheck: RiskCheckResult | null;
  consensusScore: number;
  onConfirmOrder: (tradeParams: {
    symbol: string;
    direction: TradeDirection;
    position_size: number;
    stop_loss: number;
    take_profit: number;
    exchange: string;
    consensusScore: number;
  }) => Promise<void>;
}

export const OpenTradeModal: React.FC<OpenTradeModalProps> = ({
  isOpen,
  onClose,
  symbol,
  direction,
  currentPrice,
  riskCheck,
  consensusScore,
  onConfirmOrder,
}) => {
  const [exchange, setExchange] = useState('Binance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isApproved = riskCheck?.approved ?? false;

  const handleSubmit = async () => {
    if (!isApproved || !riskCheck) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirmOrder({
        symbol,
        direction,
        position_size: riskCheck.position_size,
        stop_loss: riskCheck.stop_loss,
        take_profit: riskCheck.take_profit,
        exchange,
        consensusScore,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Order execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                direction === 'LONG'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {direction === 'LONG' ? (
                <ArrowUpRight className="h-6 w-6" />
              ) : (
                <ArrowDownRight className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Execute Order: {direction} {symbol}</span>
              </h3>
              <div className="text-xs text-slate-400">
                Entry Mark: <span className="font-mono text-slate-200">${currentPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Risk Engine Approval Banner */}
        <div className="mt-4">
          <div
            className={`flex items-start gap-3 rounded-xl p-3.5 border ${
              isApproved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertOctagon className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {isApproved ? 'Risk Management: APPROVED' : 'Risk Management: REJECTED'}
              </div>
              <p className="mt-0.5 text-xs text-slate-300">
                {riskCheck?.reason || 'Validating institutional risk parameters...'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        {riskCheck && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-400">Position Size</span>
              <div className="mt-1 font-mono font-bold text-white text-sm">
                {riskCheck.position_size} {symbol.split('/')[0]}
              </div>
              <span className="text-[10px] text-slate-400">
                ≈ ${riskCheck.position_value?.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-400">Risk / Reward Ratio</span>
              <div
                className={`mt-1 font-mono font-bold text-sm ${
                  riskCheck.risk_reward_ratio >= 2.0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                1 : {riskCheck.risk_reward_ratio}
              </div>
              <span className="text-[10px] text-slate-400">Target Min 1:2.0</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-400">Stop Loss (ATR Protected)</span>
              <div className="mt-1 font-mono font-bold text-rose-400 text-sm">
                ${riskCheck.stop_loss.toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-400/80">
                Max Loss: -${riskCheck.risk_amount}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-400">Take Profit (Target)</span>
              <div className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                ${riskCheck.take_profit.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400/80">
                Gain: +${riskCheck.potential_profit}
              </span>
            </div>
          </div>
        )}

        {/* Exchange Destination Selector */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-300">Routing Exchange (Sandbox)</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {['Binance', 'Bybit', 'Bitget'].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setExchange(ex)}
                className={`rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                  exchange === ex
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg bg-rose-500/20 p-2.5 text-xs text-rose-300 border border-rose-500/30">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isApproved || isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? 'Submitting to Order Manager...' : 'Confirm & Open Trade'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
