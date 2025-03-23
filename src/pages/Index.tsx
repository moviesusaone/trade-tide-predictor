
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import PriceChart from '@/components/PriceChart';
import RecommendationCard from '@/components/RecommendationCard';
import CurrencySummary from '@/components/CurrencySummary';
import NotificationSystem from '@/components/NotificationSystem';
import { fetchMarketData } from '@/api/tradingApi';
import { RecommendationData, PriceData } from '@/types/trading';
import { Loader2Icon } from 'lucide-react';

const Index = () => {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  // Calculate daily change
  const calculateDailyChange = (prices: PriceData[]) => {
    if (prices.length < 2) return 0;
    const latestPrice = prices[prices.length - 1].close;
    const yesterdayPrice = prices[prices.length - 2].close;
    return ((latestPrice - yesterdayPrice) / yesterdayPrice) * 100;
  };

  // Fetch data initially
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchMarketData();
        
        if (response.success && response.data) {
          setPriceData(response.data.prices);
          setDailyChange(calculateDailyChange(response.data.prices));
          
          if (response.data.recommendations) {
            setRecommendations(response.data.recommendations);
          }
        }
      } catch (error) {
        console.error('Error loading market data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Set up interval to fetch new data periodically
    const intervalId = setInterval(() => {
      loadData();
    }, 30000); // Fetch every 30 seconds
    
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    
    return () => clearInterval(intervalId);
  }, []);

  // Early return if loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2Icon className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Loading market data...</h2>
      </div>
    );
  }

  const latestRecommendation = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Header 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
        notifications={notifications} 
      />
      
      {latestRecommendation && (
        <NotificationSystem 
          recommendations={recommendations} 
          setNotifications={setNotifications} 
        />
      )}
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
            EUR/USD Predictions
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Advanced trading recommendations and price analysis for the Euro/US Dollar currency pair
          </p>
        </motion.div>
        
        {latestRecommendation && (
          <div className="grid grid-cols-1 gap-6 mb-10">
            <CurrencySummary 
              pair="EUR/USD" 
              currentPrice={latestRecommendation.currentPrice}
              dailyChange={dailyChange}
              recommendation={latestRecommendation.recommendation}
            />
          </div>
        )}
        
        {priceData.length > 0 && latestRecommendation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2">
              <PriceChart 
                data={priceData} 
                recommendation={latestRecommendation.recommendation} 
              />
            </div>
            
            <div>
              <RecommendationCard recommendation={latestRecommendation} />
            </div>
          </div>
        )}
        
        <motion.div 
          className="p-6 rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4">About Daily Recommendations</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Our trading recommendations are generated using advanced machine learning algorithms that analyze market trends, technical indicators, and economic data to provide high-confidence predictions for the EUR/USD currency pair.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            A new recommendation is generated once per day, typically between 00:00-01:00 UTC. Our system also monitors the market for significant changes and may issue updated recommendations when volatility increases.
          </p>
        </motion.div>
      </main>
      
      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} TradeTide. All rights reserved. 
            <span className="block mt-1 text-xs">
              Powered by API Key: <span className="font-mono">XDM8WCEOLKCX...</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
