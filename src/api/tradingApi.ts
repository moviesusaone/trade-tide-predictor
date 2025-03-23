
import { RecommendationData, PriceData, MarketDataResponse } from '@/types/trading';

const API_KEY = 'XDM8WCEOLKCXLJFL';
const PAIR = 'EURUSD';

// Utility function to format date for API requests
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Fetch historical price data
export const fetchPriceData = async (days = 30): Promise<PriceData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // For development, we're using mock data instead of real API calls
    // In a production app, you would make actual API calls here
    console.log(`Fetching ${PAIR} price data from ${formatDate(startDate)} to ${formatDate(endDate)}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock price data
    const mockPrices: PriceData[] = [];
    let currentDate = new Date(startDate);
    let lastClose = 1.05 + Math.random() * 0.1; // Start around 1.05-1.15

    while (currentDate <= endDate) {
      const volatility = 0.002 + Math.random() * 0.003;
      const change = (Math.random() - 0.5) * volatility;
      const open = lastClose;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      
      mockPrices.push({
        timestamp: new Date(currentDate).toISOString(),
        open: parseFloat(open.toFixed(5)),
        high: parseFloat(high.toFixed(5)),
        low: parseFloat(low.toFixed(5)),
        close: parseFloat(close.toFixed(5)),
        volume: Math.floor(Math.random() * 10000) + 5000
      });
      
      lastClose = close;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return mockPrices;
  } catch (error) {
    console.error('Error fetching price data:', error);
    throw new Error('Failed to fetch price data');
  }
};

// Get trading recommendation
export const fetchRecommendation = async (): Promise<RecommendationData> => {
  try {
    // Log API key being used (in real app, don't log API keys)
    console.log(`Using API key: ${API_KEY} to fetch recommendation for ${PAIR}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Current timestamp
    const timestamp = new Date().toISOString();
    
    // Mock current price - in reality this would come from the API
    const currentPrice = 1.05 + Math.random() * 0.1;
    
    // Random recommendation logic for demo
    const recommendationOptions = ['BUY', 'SELL', 'HOLD'] as const;
    const recommendation = recommendationOptions[Math.floor(Math.random() * 2)]; // Mostly BUY or SELL
    
    // Calculate target and stop loss based on recommendation
    const volatilityFactor = 0.005 + Math.random() * 0.005;
    const targetPrice = recommendation === 'BUY' 
      ? currentPrice * (1 + volatilityFactor)
      : recommendation === 'SELL'
        ? currentPrice * (1 - volatilityFactor)
        : currentPrice;
        
    const stopLoss = recommendation === 'BUY'
      ? currentPrice * (1 - volatilityFactor * 0.5)
      : recommendation === 'SELL'
        ? currentPrice * (1 + volatilityFactor * 0.5)
        : currentPrice;
    
    const confidenceLevel = Math.floor(Math.random() * 30) + 70; // 70-100%
    
    // Generate reasoning based on recommendation
    const reasons = {
      BUY: [
        "Technical indicators suggest bullish momentum with RSI showing oversold conditions.",
        "Golden cross pattern observed with strong support levels.",
        "Positive economic outlook for EUR compared to USD based on recent data.",
        "Chart patterns indicate potential upward breakout from recent consolidation.",
      ],
      SELL: [
        "Technical analysis indicates bearish divergence on multiple timeframes.",
        "Death cross pattern formed with key resistance level rejection.",
        "Recent negative economic data from Eurozone compared to USD strength.",
        "Chart showing potential head and shoulders pattern with breakdown signals.",
      ],
      HOLD: [
        "Markets showing sideways movement with no clear direction.",
        "Mixed economic signals from both EUR and USD regions.",
        "Key support and resistance levels intact with no breakout signals.",
        "Low volatility environment suggesting ranging market conditions."
      ]
    };
    
    const randomReason = reasons[recommendation][Math.floor(Math.random() * reasons[recommendation].length)];
    
    return {
      pair: PAIR,
      timestamp,
      recommendation,
      confidence: confidenceLevel,
      targetPrice: parseFloat(targetPrice.toFixed(5)),
      stopLoss: parseFloat(stopLoss.toFixed(5)),
      currentPrice: parseFloat(currentPrice.toFixed(5)),
      id: `rec-${Date.now()}`,
      reasoning: randomReason
    };
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    throw new Error('Failed to fetch trading recommendation');
  }
};

// Get both historical prices and current recommendation
export const fetchMarketData = async (): Promise<MarketDataResponse> => {
  try {
    const [prices, recommendation] = await Promise.all([
      fetchPriceData(30),
      fetchRecommendation()
    ]);
    
    return {
      success: true,
      data: {
        prices,
        recommendations: [recommendation]
      }
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return {
      success: false,
      data: {
        prices: []
      }
    };
  }
};
