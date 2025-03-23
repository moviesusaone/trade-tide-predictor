
import { motion } from 'framer-motion';
import { CornerUpRightIcon, CornerDownRightIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface CurrencySummaryProps {
  pair: string;
  currentPrice: number;
  dailyChange: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
}

const CurrencySummary = ({ pair, currentPrice, dailyChange, recommendation }: CurrencySummaryProps) => {
  const isPositiveChange = dailyChange >= 0;
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };
  
  return (
    <motion.div 
      className="trading-card p-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="flex flex-col md:flex-row md:items-center justify-between" variants={item}>
        <div className="flex items-center mb-4 md:mb-0">
          <div className="currency-icon mr-4">
            <motion.div 
              className="flex items-center justify-center"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, repeatType: 'reverse' }}
            >
              <span className="text-xl font-bold">€/$</span>
            </motion.div>
          </div>
          
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{pair}</h2>
            <div className="flex items-center mt-1">
              <span className="text-gray-500 dark:text-gray-400 text-sm mr-2">Euro / US Dollar</span>
              <span className={`price-tag ${isPositiveChange ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                {isPositiveChange ? '+' : ''}{dailyChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-center">
            <span className="text-3xl md:text-4xl font-bold mr-2">{currentPrice.toFixed(5)}</span>
            {isPositiveChange ? (
              <TrendingUpIcon className="h-6 w-6 text-trader-buy" />
            ) : (
              <TrendingDownIcon className="h-6 w-6 text-trader-sell" />
            )}
          </div>
          
          <div className="flex items-center mt-2">
            <motion.div 
              className={`px-3 py-1 rounded-full flex items-center ${
                recommendation === 'BUY' 
                  ? 'bg-trader-buy text-white' 
                  : recommendation === 'SELL' 
                    ? 'bg-trader-sell text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {recommendation === 'BUY' && <CornerUpRightIcon className="h-4 w-4 mr-1" />}
              {recommendation === 'SELL' && <CornerDownRightIcon className="h-4 w-4 mr-1" />}
              <span className="font-semibold">{recommendation}</span>
            </motion.div>
            
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {new Date().toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CurrencySummary;
