export type MarketType = 'Crypto' | 'Forex' | 'Stocks' | 'Options' | 'Futures';
export type TradeType = 'BUY' | 'SELL';
export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface TradeChecklist {
  trendConfirmed: boolean;
  riskCalculated: boolean;
  stopLossPlaced: boolean;
  targetIdentified: boolean;
  positionSizeCorrect: boolean;
  newsChecked: boolean;
  followedStrategy: boolean;
}

export interface TradeComment {
  id: string;
  author: string;
  text: string;
  date: string; // ISO string
}

export interface Trade {
  id?: string; // Optional because Dexie auto-generates if we want, or we assign UUID
  userId: string;
  tradeNumber: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  market: MarketType;
  exchange: string;
  assetName: string;
  symbol: string;
  type: TradeType;
  direction: TradeDirection;
  strategyUsed: string;
  setupName: string;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  quantity: number;
  riskPercent: number;
  rewardRatio: number;
  positionSize: number;
  fees: number;
  pnl: number;
  pnlPercent: number;
  status: TradeStatus;
  emotionBefore: string;
  emotionAfter: string;
  confidence: number; // 1-10
  mistakes: string[];
  lessonsLearned: string;
  notes: string;
  images: string[]; // Base64 strings or URLs
  checklist: TradeChecklist;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
  comments?: TradeComment[];
  createdAt: string; // ISO string
}

export type NoteType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PSYCHOLOGY' | 'GOALS';

export interface Note {
  id: string;
  userId: string;
  title: string;
  type: NoteType;
  content: string; // Rich Text / Markdown HTML
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface PerformanceGoal {
  id?: string;
  userId: string;
  monthlyProfitTarget: number;
  maxDailyLoss: number;
  weeklyWinRateTarget: number;
  tradeCountTarget: number;
  period: string; // YYYY-MM
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  passwordHash?: string; // Excluded in frontend profile updates
  tradingStyle: string;
  yearsOfExperience: number;
  preferredMarkets: MarketType[];
  profilePicture?: string; // Base64
  startingBalance?: number;
  isOnboarded?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
