
export interface PriceData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface RecommendationData {
  pair: string;
  timestamp: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  targetPrice: number;
  stopLoss: number;
  currentPrice: number;
  id: string;
  reasoning: string;
}

export interface MarketDataResponse {
  success: boolean;
  data: {
    prices: PriceData[];
    recommendations?: RecommendationData[];
  };
}
