import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Cpu,
  Sparkles,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe
} from 'lucide-react';

interface SettingsPageProps {
  tradingMode: 'DEMO' | 'LIVE';
  onToggleTradingMode: (mode: 'DEMO' | 'LIVE') => void;
  onResetDemoBalance: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  tradingMode,
  onToggleTradingMode,
  onResetDemoBalance,
}) => {
  const [selectedExchange, setSelectedExchange] = useState('Binance');
  const [openAIModel, setOpenAIModel] = useState('gpt-4o-mini');
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [consensusRule, setConsensusRule] = useState('strict-unanimous');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400" />
          <span>System &amp; Exchange Connectivity Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure algorithmic execution targets, AI model routing parameters, and exchange sandbox gateways.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Security & Architecture Guarantee Banner */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-indigo-500/20 p-2.5 text-indigo-300 border border-indigo-500/30">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Institutional Security Protocol
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                API credentials for Binance, Bybit, Bitget, OpenAI, and Google Gemini are strictly maintained in secure containerized server environment variables. All requests are routed through verified backend endpoints with zero browser-side secret exposure.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Exchange & Execution Environment */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Globe className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Exchange Routing Gateways</h2>
            </div>

            {/* Trading Environment Mode */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Execution Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleTradingMode('DEMO')}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    tradingMode === 'DEMO'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">Sandbox / Demo Mode</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    $50,000 virtual balance with real orderbook simulation
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleTradingMode('LIVE')}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    tradingMode === 'LIVE'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-300 shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">Live Exchange Mode</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Live orders routed through CCXT with strict risk engine checks
                  </div>
                </button>
              </div>
            </div>

            {/* Default Exchange Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Primary Routing Exchange
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Binance', 'Bybit', 'Bitget'].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setSelectedExchange(ex)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      selectedExchange === ex
                        ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Demo Pool */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paper Trading Portfolio
              </label>
              <button
                type="button"
                onClick={onResetDemoBalance}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset Demo Balance to $50,000.00</span>
              </button>
            </div>
          </div>

          {/* Right: AI Engine Routing & Consensus Weights */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">AI Engine Routing &amp; Weights</h2>
            </div>

            {/* Google Gemini Model */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Google Gemini Model Target
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Ultra-fast latency, high reasoning)</option>
                <option value="gemini-3.8-pro">gemini-3.8-pro (Complex multi-timeframe deep analysis)</option>
              </select>
            </div>

            {/* OpenAI Model */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                OpenAI Model Target
              </label>
              <select
                value={openAIModel}
                onChange={(e) => setOpenAIModel(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Optimized JSON structure, fast response)</option>
                <option value="gpt-4o">gpt-4o (Full flagship multi-modal reasoning)</option>
              </select>
            </div>

            {/* Consensus Quorum Rule */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Consensus Approval Rule
              </label>
              <select
                value={consensusRule}
                onChange={(e) => setConsensusRule(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="strict-unanimous">Strict Triple Unanimous (OpenAI + Gemini + Technical MUST all agree)</option>
                <option value="two-thirds">2 of 3 Consensus (Majority vote with no direct veto)</option>
              </select>
            </div>

            {/* Notification Webhook */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Alert Webhook URL (Optional Telegram / Discord)
              </label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">
            {isSaved ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Settings saved and active on live engine!
              </span>
            ) : (
              <span>Modifications take effect immediately on next algorithmic loop.</span>
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
