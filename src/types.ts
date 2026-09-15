export type TradeDirection = 'LONG' | 'SHORT' | 'HOLD';
export type ConsensusDecision = 'LONG' | 'SHORT' | 'NO TRADE';
export type TradeStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'REJECTED';
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';
export type SupportedExchange = 'Binance' | 'Bybit' | 'Bitget';

export interface ExchangeConnectionInfo {
  exchange: SupportedExchange;
  apiKeyMasked: string;
  hasSecret: boolean;
  hasPassphrase?: boolean;
  connectedAt?: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  trustedIPsOnly: boolean;
  pingMs: number;
  permissions: {
    read: boolean;
    spotTrading: boolean;
    futuresTrading: boolean;
    withdrawals: boolean; // Always false for strict security
  };
}

export interface ExchangeConnectionsResponse {
  connections: Record<SupportedExchange, ExchangeConnectionInfo>;
  trustedIPs: string[];
  recommendedNotice: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema9: number;
  ema21: number;
  ema50: number;
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr: number;
}

export interface MarketData {
  symbol: string;
  timeframe: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  trend: MarketTrend;
  rsi: number;
  macd: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ema: number;
  volume: number;
  atr: number;
  timestamp: number;
}

export interface TechnicalAnalysisResult {
  decision: TradeDirection;
  confidence: number;
  trend: MarketTrend;
  indicators: TechnicalIndicators;
  reasons: string[];
}

export interface AIEngineDecision {
  engine: 'OpenAI' | 'Gemini';
  decision: TradeDirection;
  confidence: number;
  reason: string;
  model: string;
  latencyMs: number;
  timestamp: number;
}

export interface AIConsensusResult {
  openai_decision: TradeDirection;
  gemini_decision: TradeDirection;
  technical_decision: TradeDirection;
  final_consensus: ConsensusDecision;
  approved_for_risk_check: boolean;
  consensusScore: number; // 0 - 100
  weights: {
    openai: number;
    gemini: number;
    technical: number;
  };
  reasoning: string;
  timestamp: number;
}

export interface RiskCheckParams {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  accountBalance: number;
  customStopLoss?: number;
  customTakeProfit?: number;
}

export interface RiskCheckResult {
  approved: boolean;
  reason: string;
  position_size: number; // e.g. in BTC
  position_value: number; // in USDT
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  risk_amount: number;
  potential_profit: number;
  leverage: number;
  warnings: string[];
}

export interface ActiveTrade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  currentPrice: number;
  positionSize: number;
  positionValue: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercentage: number;
  status: TradeStatus;
  openedAt: number;
  exchange: 'Binance' | 'Bybit' | 'Bitget';
  mode: 'DEMO' | 'LIVE';
  consensusScore: number;
  duration?: string;
  riskRewardRatio?: number;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  pnl: number;
  pnlPercentage: number;
  result: 'WIN' | 'LOSS';
  openedAt: number;
  closedAt: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'RISK_TIMEOUT';
  openai_confidence: number;
  gemini_confidence: number;
  technical_decision: TradeDirection;
  final_consensus: ConsensusDecision;
  rsi: number;
  trend: MarketTrend;
  feedbackInsight: string;
  exchange?: string;
  aiDecisionDetails?: {
    openaiConfidence?: number;
    geminiConfidence?: number;
  };
}

export interface LearningInsight {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'OPTIMIZATION' | 'RISK_ADJUSTMENT' | 'LESSON_LEARNED';
}

export interface AnalyticsPerformance {
  accountBalance: number;
  startingBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  dailyPnL: number;
  dailyPnLPercentage: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: { time: string; balance: number }[];
  aiAccuracy: {
    openaiAccuracy: number;
    geminiAccuracy: number;
    technicalAccuracy: number;
    consensusAccuracy: number;
  };
  aiModelAccuracy?: {
    openai: number;
    gemini: number;
    technical: number;
    consensus: number;
  };
  averageWin?: number;
  learningInsights?: LearningInsight[];
}

export interface RiskSettings {
  maxRiskPerTradePercent: number; // e.g., 1.5%
  maxPositionSizePercent: number; // e.g., 15%
  minRiskRewardRatio: number; // e.g., 2.0
  maxOpenTrades: number; // e.g., 3
  dailyLossLimitPercent: number; // e.g., 3.0%
  maxLeverage: number; // e.g., 10x
  atrMultiplierSL: number; // e.g., 1.5
  atrMultiplierTP: number; // e.g., 3.0
  tradingMode: 'DEMO' | 'LIVE';
}

export interface MarketBalanceInfo {
  capital: number;
  botCapital: number;
  available: number;
  lockedInOrders: number;
  marginUsed?: number;
  unrealizedPnl?: number;
  currency: string;
}

export interface ExchangeAccountBalance {
  exchange: SupportedExchange;
  connected: boolean;
  lastSyncedAt: number;
  spot: MarketBalanceInfo;
  futures: MarketBalanceInfo;
  selectedMode: 'SPOT' | 'FUTURES';
  activeBotCapital: number;
  rawSummary?: string;
  error?: string;
}

export interface AllExchangeBalancesResponse {
  activeExchange: SupportedExchange | null;
  activeTradingMarket: 'SPOT' | 'FUTURES';
  totalBotCapital: number;
  balances: Record<SupportedExchange, ExchangeAccountBalance>;
  syncedAt: number;
}

