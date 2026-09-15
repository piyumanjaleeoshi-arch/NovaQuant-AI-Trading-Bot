import React from 'react';
import {
  Zap,
  Activity,
  Shield,
  Radio,
  Cpu,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Play,
  Square,
  Pause,
  Power
} from 'lucide-react';
import { BotStatus } from '../types';

interface NavbarProps {
  tradingMode: 'DEMO' | 'LIVE';
  onToggleMode: (mode: 'DEMO' | 'LIVE') => void;
  botStatus: BotStatus;
  onToggleStartStop: () => void;
  onTogglePauseResume: () => void;
  accountBalance: number;
  dailyPnL: number;
  dailyPnLPct: number;
  prices: Record<string, number>;
  onTriggerScan: () => void;
  isScanning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  tradingMode,
  onToggleMode,
  botStatus,
  onToggleStartStop,
  onTogglePauseResume,
  accountBalance,
  dailyPnL,
  dailyPnLPct,
  prices,
  onTriggerScan,
  isScanning,
}) => {
  const [showModeModal, setShowModeModal] = React.useState(false);

  const handleModeClick = () => {
    if (tradingMode === 'DEMO') {
      setShowModeModal(true);
    } else {
      onToggleMode('DEMO');
    }
  };

  const confirmLiveMode = () => {
    setShowModeModal(false);
    onToggleMode('LIVE');
  };

  const tickerList = [
    { symbol: 'BTC/USDT', name: 'BTC', price: prices['BTC/USDT'] || 67420.5, change: '+2.4%' },
    { symbol: 'ETH/USDT', name: 'ETH', price: prices['ETH/USDT'] || 3540.2, change: '+1.8%' },
    { symbol: 'SOL/USDT', name: 'SOL', price: prices['SOL/USDT'] || 184.8, change: '+4.2%' },
    { symbol: 'BNB/USDT', name: 'BNB', price: prices['BNB/USDT'] || 598.6, change: '-0.3%' },
    { symbol: 'XRP/USDT', name: 'XRP', price: prices['XRP/USDT'] || 0.624, change: '+0.9%' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#bf9b42]/25 bg-[#022824]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Brand Identity with Gold/Emerald Medallion Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center shrink-0">
              <img
                src="/novaquant-logo.jpg"
                alt="NovaQuant Algorithmic Trading"
                className="h-11 w-11 rounded-full object-cover border-2 border-[#bf9b42] shadow-lg shadow-[#bf9b42]/30"
              />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#bf9b42]">NovaQuant</span>
                <span className="rounded bg-[#bf9b42]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#bf9b42] border border-[#bf9b42]/40 uppercase">
                  ALGORITHMIC TRADING
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#e5c158]/85">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>The Quantum Edge &bull; 999 Fine Metal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Real-Time Ticker Strip */}
        <div className="hidden xl:flex items-center gap-2 overflow-x-auto py-1 px-3 rounded-xl bg-[#033631]/80 border border-[#bf9b42]/30">
          {tickerList.map((t) => (
            <div
              key={t.symbol}
              className="flex items-center gap-2 px-2.5 py-1 text-xs transition-colors hover:bg-[#044a43]/60 rounded-lg"
            >
              <span className="font-semibold text-[#f5e6b3]">{t.name}</span>
              <span className="font-mono text-white font-medium">${t.price.toLocaleString()}</span>
              <span
                className={`text-[11px] font-semibold ${
                  t.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {t.change}
              </span>
            </div>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bot Execution Controls (Start/Stop & Pause/Resume in same buttons) */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#033631]/90 border border-[#bf9b42]/30 shadow-inner">
            {/* Status indicator dot + text */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1">
              <span className="relative flex h-2 w-2">
                {botStatus === 'RUNNING' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                )}
                {botStatus === 'PAUSED' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    botStatus === 'RUNNING'
                      ? 'bg-emerald-400'
                      : botStatus === 'PAUSED'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                  botStatus === 'RUNNING'
                    ? 'text-emerald-400'
                    : botStatus === 'PAUSED'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {botStatus}
              </span>
            </div>

            {/* 1. START / STOP BUTTON (Toggles between Start & Stop in same button) */}
            <button
              id="navbar-bot-start-stop-btn"
              onClick={onToggleStartStop}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                botStatus === 'STOPPED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-400 active:scale-95 shadow-emerald-500/10'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30 hover:border-rose-400 active:scale-95 shadow-rose-500/10'
              }`}
              title={
                botStatus === 'STOPPED'
                  ? 'Start the bot algorithm & autonomous execution'
                  : 'Stop the bot algorithm & halt execution'
              }
            >
              {botStatus === 'STOPPED' ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Bot</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop Bot</span>
                </>
              )}
            </button>

            {/* 2. PAUSE / RESUME BUTTON (Toggles between Pause & Resume in same button) */}
            <button
              id="navbar-bot-pause-resume-btn"
              onClick={onTogglePauseResume}
              disabled={botStatus === 'STOPPED'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all border shadow-sm ${
                botStatus === 'STOPPED'
                  ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-500'
                  : botStatus === 'PAUSED'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-400 active:scale-95 cursor-pointer shadow-cyan-500/10 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 hover:border-amber-400 active:scale-95 cursor-pointer shadow-amber-500/10'
              }`}
              title={
                botStatus === 'STOPPED'
                  ? 'Start the bot first to enable pausing'
                  : botStatus === 'PAUSED'
                  ? 'Resume algorithmic bot operations'
                  : 'Pause bot operations without closing open trades'
              }
            >
              {botStatus === 'PAUSED' ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume Bot</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause Bot</span>
                </>
              )}
            </button>
          </div>

          {/* Quick AI Scan Trigger */}
          <button
            onClick={onTriggerScan}
            disabled={isScanning || botStatus === 'STOPPED'}
            className="hidden md:flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#bf9b42] to-[#a08032] px-3 py-1.5 text-xs font-bold text-[#033631] shadow-sm shadow-[#bf9b42]/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">{isScanning ? 'Analyzing...' : 'Run Dual-AI Scan'}</span>
          </button>

          {/* Account Balance Widget */}
          <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-[#bf9b42]/30 bg-[#033631]/80 px-3 py-1.5">
            <Wallet className="h-4 w-4 text-[#bf9b42]" />
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-[#f5e6b3]">
                ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px]">
                <span className="text-[#bf9b42]/80">Daily:</span>
                <span
                  className={`font-semibold ${
                    dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)} ({dailyPnLPct >= 0 ? '+' : ''}{dailyPnLPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* DEMO / LIVE Mode Switcher */}
          <button
            onClick={handleModeClick}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
              tradingMode === 'DEMO'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                tradingMode === 'DEMO' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'
              }`}
            />
            <span>{tradingMode === 'DEMO' ? 'DEMO MODE' : 'LIVE MODE'}</span>
          </button>
        </div>
      </div>

      {/* Safety Modal when switching to LIVE mode */}
      {showModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Switch to LIVE Trading?</h3>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              You are about to switch from sandbox simulation to <span className="font-bold text-rose-400">Live Exchange Execution</span>.
              Real capital will be at risk. Every trade will strictly require Risk Management Engine approval.
            </p>
            <div className="mt-4 rounded-lg bg-slate-950 p-3 text-xs text-slate-400 border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1">Active Safety Constraints:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Mandatory 1:2+ Risk/Reward enforcement</li>
                <li>Daily loss circuit breaker limit enabled (3%)</li>
                <li>Max 1.5% capital risk per trade</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModeModal(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Keep Demo Mode
              </button>
              <button
                onClick={confirmLiveMode}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
              >
                Confirm Live Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
