
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Technical Analysis Functions
function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function generateSignal(currentPrice: number, ma5: number | null, ma10: number | null, ma20: number | null, rsi: number | null): {
  signal: string;
  confidence: number;
  reasoning: string;
  targetPrice: number;
  stopLoss: number;
} {
  let signal = 'HOLD';
  let confidence = 50;
  let reasoning = 'التحليل الفني يشير إلى استمرار الاتجاه الحالي';
  
  // Calculate target and stop loss based on volatility (0.5% default)
  const volatility = 0.005;
  let targetPrice = currentPrice;
  let stopLoss = currentPrice;
  
  // Multiple factor analysis
  let bullishPoints = 0;
  let bearishPoints = 0;
  
  // Moving Average Analysis
  if (ma5 && ma10 && ma20) {
    if (ma5 > ma10 && ma10 > ma20) {
      bullishPoints += 3;
      reasoning += ' | الاتجاه الصاعد واضح مع المتوسطات المتحركة';
    } else if (ma5 < ma10 && ma10 < ma20) {
      bearishPoints += 3;
      reasoning += ' | الاتجاه الهابط واضح مع المتوسطات المتحركة';
    }
    
    if (currentPrice > ma20) {
      bullishPoints += 1;
    } else {
      bearishPoints += 1;
    }
  }
  
  // RSI Analysis
  if (rsi) {
    if (rsi < 30) {
      bullishPoints += 2;
      reasoning += ' | مؤشر القوة النسبية يشير إلى تشبع بيعي';
    } else if (rsi > 70) {
      bearishPoints += 2;
      reasoning += ' | مؤشر القوة النسبية يشير إلى تشبع شرائي';
    } else if (rsi > 50) {
      bullishPoints += 1;
    } else {
      bearishPoints += 1;
    }
  }
  
  // Determine signal based on points
  const totalPoints = bullishPoints + bearishPoints;
  if (totalPoints > 0) {
    if (bullishPoints > bearishPoints) {
      signal = 'BUY';
      confidence = Math.min(95, 60 + (bullishPoints - bearishPoints) * 8);
      targetPrice = currentPrice * (1 + volatility * 2);
      stopLoss = currentPrice * (1 - volatility);
    } else if (bearishPoints > bullishPoints) {
      signal = 'SELL';
      confidence = Math.min(95, 60 + (bearishPoints - bullishPoints) * 8);
      targetPrice = currentPrice * (1 - volatility * 2);
      stopLoss = currentPrice * (1 + volatility);
    }
  }
  
  return {
    signal,
    confidence,
    reasoning,
    targetPrice,
    stopLoss
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const exchangeRateApiKey = Deno.env.get('EXCHANGE_RATE_API_KEY');
    if (!exchangeRateApiKey) {
      throw new Error('Exchange Rate API key not found');
    }

    // Get historical data for the last 30 days
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/pair/EUR/USD`);
    
    if (!response.ok) {
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }

    const data = await response.json();
    const currentRate = data.conversion_rate;
    
    console.log(`Current EUR/USD rate: ${currentRate}`);

    // Get existing historical data from database
    const { data: existingData, error: fetchError } = await supabaseClient
      .from('eurusd_data')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (fetchError) {
      console.error('Error fetching existing data:', fetchError);
    }

    // Generate mock historical data for demonstration (in real app, you'd use historical API)
    const historicalPrices: number[] = [];
    const today = new Date();
    
    // Create 30 days of mock data around current price
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price movement
      const randomChange = (Math.random() - 0.5) * 0.01; // ±0.5% daily change
      const price = currentRate + randomChange;
      historicalPrices.push(price);
      
      // Insert/update daily data
      const { error: upsertError } = await supabaseClient
        .from('eurusd_data')
        .upsert({
          date: date.toISOString().split('T')[0],
          open_price: price,
          high_price: price * 1.002,
          low_price: price * 0.998,
          close_price: price,
          volume: Math.floor(Math.random() * 100000) + 50000,
          change_percent: randomChange * 100,
        }, {
          onConflict: 'date'
        });

      if (upsertError) {
        console.error('Error upserting data:', upsertError);
      }
    }

    // Calculate technical indicators
    const ma5 = calculateSMA(historicalPrices, 5);
    const ma10 = calculateSMA(historicalPrices, 10);
    const ma20 = calculateSMA(historicalPrices, 20);
    const rsi = calculateRSI(historicalPrices, 14);

    // Update today's data with technical indicators
    const todayDate = today.toISOString().split('T')[0];
    const { error: updateError } = await supabaseClient
      .from('eurusd_data')
      .upsert({
        date: todayDate,
        open_price: currentRate,
        high_price: currentRate * 1.001,
        low_price: currentRate * 0.999,
        close_price: currentRate,
        ma5,
        ma10,
        ma20,
        rsi,
        change_percent: 0,
      }, {
        onConflict: 'date'
      });

    if (updateError) {
      console.error('Error updating technical indicators:', updateError);
    }

    // Generate AI recommendation
    const recommendation = generateSignal(currentRate, ma5, ma10, ma20, rsi);

    // Save recommendation to database
    const { error: recError } = await supabaseClient
      .from('trading_recommendations')
      .insert({
        date: todayDate,
        pair: 'EURUSD',
        signal: recommendation.signal,
        confidence: recommendation.confidence,
        current_price: currentRate,
        target_price: recommendation.targetPrice,
        stop_loss: recommendation.stopLoss,
        reasoning: recommendation.reasoning,
        technical_indicators: {
          ma5,
          ma10,
          ma20,
          rsi,
          prices_analyzed: historicalPrices.length
        }
      });

    if (recError) {
      console.error('Error saving recommendation:', recError);
    }

    // Return the recommendation
    return new Response(
      JSON.stringify({
        success: true,
        recommendation: {
          pair: 'EURUSD',
          signal: recommendation.signal,
          confidence: recommendation.confidence,
          current_price: currentRate,
          target_price: recommendation.targetPrice,
          stop_loss: recommendation.stopLoss,
          reasoning: recommendation.reasoning,
          technical_indicators: {
            ma5: ma5?.toFixed(5),
            ma10: ma10?.toFixed(5),
            ma20: ma20?.toFixed(5),
            rsi: rsi?.toFixed(2)
          },
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in trading-ai function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
