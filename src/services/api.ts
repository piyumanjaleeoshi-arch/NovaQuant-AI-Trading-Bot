import {
  MarketData,
  Candle,
  TechnicalAnalysisResult,
  AIConsensusResult,
  RiskCheckResult,
  ActiveTrade,
  ClosedTrade,
  AnalyticsPerformance,
  RiskSettings,
  TradeDirection,
  AIEngineDecision
} from '../types';

export async function fetchMarketData(symbol: string): Promise<MarketData> {
  const res = await fetch(`/api/market-data/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch market data');
  return res.json();
}

export async function fetchCandles(symbol: string): Promise<Candle[]> {
  const res = await fetch(`/api/candles/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch candles');
  return res.json();
}

export async function fetchTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysisResult> {
  const res = await fetch(`/api/analysis/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch analysis');
  return res.json();
}

export async function runAIAnalysis(symbol: string): Promise<{
  symbol: string;
  technical: TechnicalAnalysisResult;
  openai: AIEngineDecision;
  gemini: AIEngineDecision;
}> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error('Failed to run AI analysis');
  return res.json();
}

export async function evaluateConsensus(payload: {
  openai_decision: TradeDirection;
  gemini_decision: TradeDirection;
  technical_decision: TradeDirection;
  openai_confidence?: number;
  gemini_confidence?: number;
  technical_confidence?: number;
}): Promise<AIConsensusResult> {
  const res = await fetch('/api/consensus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to evaluate consensus');
  return res.json();
}

export async function checkRisk(payload: {
  symbol: string;
  direction: TradeDirection;
  entryPrice?: number;
  customStopLoss?: number;
  customTakeProfit?: number;
}): Promise<RiskCheckResult> {
  const res = await fetch('/api/risk/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to check risk');
  return res.json();
}

export async function openTrade(payload: {
  symbol: string;
  direction: TradeDirection;
  position_size: number;
  stop_loss: number;
  take_profit: number;
  exchange?: string;
  consensusScore?: number;
}): Promise<{ success: boolean; trade: ActiveTrade }> {
  const res = await fetch('/api/trades/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to open trade');
  }
  return res.json();
}

export interface BotSyncResponse {
  activeTrades: ActiveTrade[];
  tradeHistory: ClosedTrade[];
  analytics: AnalyticsPerformance;
  botStatus: import('../types').BotStatus;
  prices: Record<string, number>;
  marketData: MarketData;
  timestamp: number;
}

export async function syncBotState(symbol: string): Promise<BotSyncResponse> {
  const res = await fetch(`/api/bot/sync?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to sync bot state');
  return res.json();
}

export async function fetchActiveTrades(): Promise<ActiveTrade[]> {
  const res = await fetch('/api/trades/active');
  if (!res.ok) throw new Error('Failed to fetch active trades');
  return res.json();
}

export async function fetchTradeHistory(): Promise<ClosedTrade[]> {
  const res = await fetch('/api/trades/history');
  if (!res.ok) throw new Error('Failed to fetch trade history');
  return res.json();
}

export async function closeActiveTrade(tradeId: string): Promise<{ success: boolean; trade: ClosedTrade }> {
  const res = await fetch(`/api/trades/${tradeId}/close`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to close trade');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsPerformance> {
  const res = await fetch('/api/analytics/performance');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchRiskSettings(): Promise<{ settings: RiskSettings; tradingMode: 'DEMO' | 'LIVE' }> {
  const res = await fetch('/api/settings/risk');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveRiskSettings(payload: {
  settings: Partial<RiskSettings>;
  tradingMode?: 'DEMO' | 'LIVE';
}): Promise<any> {
  const res = await fetch('/api/settings/risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function fetchBotStatus(): Promise<{ status: import('../types').BotStatus; timestamp: number }> {
  const res = await fetch('/api/bot/status');
  if (!res.ok) throw new Error('Failed to fetch bot status');
  return res.json();
}

export async function updateBotStatus(
  status: import('../types').BotStatus,
  action?: 'START' | 'STOP' | 'PAUSE' | 'RESUME'
): Promise<{ status: import('../types').BotStatus; message: string }> {
  const resolvedAction =
    action ||
    (status === 'RUNNING' ? 'START' : status === 'PAUSED' ? 'PAUSE' : 'STOP');

  const requestPayload = { status, action: resolvedAction };

  // 1. Primary Attempt: Standard POST /api/bot/status
  try {
    const res = await fetch('/api/bot/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    // Try parsing server response
    let serverErrText = '';
    try {
      const errJson = await res.json();
      serverErrText = errJson.error || errJson.message;
    } catch {
      serverErrText = await res.text().catch(() => '');
    }
    console.warn(`[API] /api/bot/status returned ${res.status}:`, serverErrText);
  } catch (initialErr) {
    console.warn('[API] Initial fetch to /api/bot/status failed with network error:', initialErr);
  }

  // 2. Secondary Attempt: Direct dedicated route (/api/bot/stop, /api/bot/start, /api/bot/pause, /api/bot/resume)
  const endpointMap: Record<string, string> = {
    RUNNING: resolvedAction === 'RESUME' ? '/api/bot/resume' : '/api/bot/start',
    STOPPED: '/api/bot/stop',
    PAUSED: '/api/bot/pause',
  };
  const fallbackEndpoint = endpointMap[status] || '/api/bot/status';

  try {
    const fallbackRes = await fetch(fallbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data;
    }

    let fallbackErrMsg = '';
    try {
      const errJson = await fallbackRes.json();
      fallbackErrMsg = errJson.error || errJson.message;
    } catch {
      fallbackErrMsg = await fallbackRes.text().catch(() => '');
    }

    throw new Error(fallbackErrMsg || `Failed to update bot status (HTTP ${fallbackRes.status})`);
  } catch (fallbackErr: any) {
    console.error(`[API ERROR] All bot status endpoints failed for target status "${status}":`, fallbackErr);
    throw new Error(fallbackErr?.message || 'Failed to update bot status');
  }
}

export async function fetchExchangeConnections(): Promise<import('../types').ExchangeConnectionsResponse> {
  const res = await fetch('/api/exchanges/connections');
  if (!res.ok) throw new Error('Failed to fetch exchange connections');
  return res.json();
}

export async function connectExchange(payload: {
  exchange: import('../types').SupportedExchange;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  trustIPsOnly?: boolean;
  selectedMode?: 'SPOT' | 'FUTURES';
}): Promise<{
  success: boolean;
  message: string;
  exchange: string;
  status: string;
  pingMs: number;
  balance?: import('../types').ExchangeAccountBalance;
  botCapital?: number;
}> {
  const res = await fetch('/api/exchanges/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to connect exchange API');
  }
  return res.json();
}

export async function disconnectExchange(exchange: import('../types').SupportedExchange): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/exchanges/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exchange }),
  });
  if (!res.ok) throw new Error('Failed to disconnect exchange');
  return res.json();
}

export async function fetchExchangeBalances(): Promise<import('../types').AllExchangeBalancesResponse> {
  const fallbackBalances: import('../types').AllExchangeBalancesResponse = {
    activeExchange: null,
    activeTradingMarket: 'SPOT',
    totalBotCapital: 0,
    balances: {
      Binance: { exchange: 'Binance', connected: false, lastSyncedAt: 0, spot: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, currency: 'USDT' }, futures: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, marginUsed: 0, unrealizedPnl: 0, currency: 'USDT' }, selectedMode: 'SPOT', activeBotCapital: 0 },
      Bybit: { exchange: 'Bybit', connected: false, lastSyncedAt: 0, spot: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, currency: 'USDT' }, futures: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, marginUsed: 0, unrealizedPnl: 0, currency: 'USDT' }, selectedMode: 'SPOT', activeBotCapital: 0 },
      Bitget: { exchange: 'Bitget', connected: false, lastSyncedAt: 0, spot: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, currency: 'USDT' }, futures: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, marginUsed: 0, unrealizedPnl: 0, currency: 'USDT' }, selectedMode: 'SPOT', activeBotCapital: 0 },
    },
    syncedAt: Date.now(),
  };

  try {
    const res = await fetch('/api/exchanges/balances');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Retry once after 600ms if server is warming up or temporarily restarting
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const retryRes = await fetch('/api/exchanges/balances');
      if (retryRes.ok) {
        return await retryRes.json();
      }
    } catch {
      // Return safe fallback on failure
      return fallbackBalances;
    }
  }
  return fallbackBalances;
}

export async function refreshExchangeBalances(exchange?: import('../types').SupportedExchange): Promise<{
  success: boolean;
  message: string;
  balance?: import('../types').ExchangeAccountBalance;
  balances?: Record<import('../types').SupportedExchange, import('../types').ExchangeAccountBalance>;
  activeBotCapital?: number;
}> {
  const res = await fetch('/api/exchanges/balances/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exchange }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to refresh exchange balances');
  }
  return res.json();
}

export async function selectExchangeTradingMarket(
  exchange: import('../types').SupportedExchange,
  market: 'SPOT' | 'FUTURES'
): Promise<{ success: boolean; activeTradingMarket: 'SPOT' | 'FUTURES'; balance: import('../types').ExchangeAccountBalance }> {
  const res = await fetch('/api/exchanges/balances/select-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exchange, market }),
  });
  if (!res.ok) throw new Error('Failed to select trading market');
  return res.json();
}

