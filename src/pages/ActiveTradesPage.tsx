import React from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { ActiveTrade } from '../types';

interface ActiveTradesPageProps {
  trades: ActiveTrade[];
  onCloseTrade: (tradeId: string) => Promise<void>;
  onNavigateTab: (tab: any) => void;
}

export const ActiveTradesPage: React.FC<ActiveTradesPageProps> = ({
  trades,
  onCloseTrade,
  onNavigateTab,
}) => {
  const totalUnrealizedPnL = trades.reduce((acc, t) => acc + t.pnl, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <span>Live Position Monitor &amp; Execution Watcher</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuously tracking order fills, real-time mark prices, ATR-trailing stops, and take profit limit orders.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Unrealized P&amp;L</span>
            <div
              className={`font-mono text-lg font-bold ${
                totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Trades Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
        {trades.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Open Positions</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              All previous orders have either hit their target, stop loss, or were safely closed.
            </p>
            <button
              onClick={() => onNavigateTab('ai-decisions')}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Scan for Consensus Setups
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Position</th>
                  <th className="pb-3 font-semibold">Size</th>
                  <th className="pb-3 font-semibold">Entry Mark</th>
                  <th className="pb-3 font-semibold">Live Price</th>
                  <th className="pb-3 font-semibold">Stop Loss</th>
                  <th className="pb-3 font-semibold">Take Profit</th>
                  <th className="pb-3 font-semibold">R:R Ratio</th>
                  <th className="pb-3 font-semibold">Unrealized P&amp;L</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trades.map((t) => {
                  const isLong = t.direction === 'LONG';
                  const isProfit = t.pnl >= 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-lg p-1.5 ${
                              isLong
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isLong ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          </span>
                          <div>
                            <div className="font-bold text-white">{t.symbol}</div>
                            <div className="text-[10px] text-slate-400">
                              {t.exchange} • {t.mode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono">
                        <div className="font-bold text-slate-200">
                          {t.positionSize} {t.symbol.split('/')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ≈ ${(t.positionSize * t.currentPrice).toFixed(0)}
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-slate-300">
                        ${t.entryPrice.toLocaleString()}
                      </td>

                      <td className="py-3.5 font-mono font-bold text-white">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                          ${t.currentPrice.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono text-rose-400">
                        ${t.stopLoss.toLocaleString()}
                      </td>

                      <td className="py-3.5 font-mono text-emerald-400">
                        ${t.takeProfit.toLocaleString()}
                      </td>

                      <td className="py-3.5 font-mono text-slate-300 font-semibold">
                        1 : {t.riskRewardRatio ?? (Math.abs(t.takeProfit - t.entryPrice) / Math.max(0.0001, Math.abs(t.entryPrice - t.stopLoss))).toFixed(1)}
                      </td>

                      <td className="py-3.5 font-mono font-bold">
                        <div className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}${t.pnl.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isProfit ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {isProfit ? '+' : ''}{t.pnlPercentage}%
                        </div>
                      </td>

                      <td className="py-3.5 text-slate-400 text-[11px] font-mono">
                        {t.duration || `${Math.max(1, Math.round((Date.now() - (t.openedAt || Date.now())) / 60000))}m`}
                      </td>

                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => onCloseTrade(t.id)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 hover:border-rose-700 border border-slate-700 transition-colors cursor-pointer"
                        >
                          Close Now
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automated Protection Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>
            Server-side event loop monitors price feeds every 2 seconds. When price crosses Stop Loss or Take Profit, trade automatically liquidates and triggers the Learning Feedback Loop.
          </span>
        </div>
        <span className="font-mono text-emerald-400 font-semibold shrink-0">SL/TP DAEMON ACTIVE</span>
      </div>
    </div>
  );
};
