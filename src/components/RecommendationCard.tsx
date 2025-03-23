
import { motion } from 'framer-motion';
import { RecommendationData } from '@/types/trading';
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon, AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendationCardProps {
  recommendation: RecommendationData;
}

const RecommendationCard = ({ recommendation }: RecommendationCardProps) => {
  const { pair, recommendation: action, confidence, targetPrice, stopLoss, currentPrice, reasoning } = recommendation;
  
  const isNewRecommendation = new Date(recommendation.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000;
  
  const getRecommendationColor = () => {
    switch (action) {
      case 'BUY': return 'bg-trader-buy text-white';
      case 'SELL': return 'bg-trader-sell text-white';
      case 'HOLD': return 'bg-trader-neutral text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };
  
  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const formatPrice = (price: number) => price.toFixed(5);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div 
      className="trading-card hover-lift"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="currency-icon">
              <span className="text-lg font-bold">€/$</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{pair}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(recommendation.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className={`recommendation-badge ${getRecommendationColor()}`}>
              {action}
            </span>
            {isNewRecommendation && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                NEW
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-lg font-bold">{formatPrice(currentPrice)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
            <p className="text-lg font-bold text-trader-buy">{formatPrice(targetPrice)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</p>
            <p className="text-lg font-bold text-trader-sell">{formatPrice(stopLoss)}</p>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">{reasoning}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <span className="text-sm mr-2">Confidence:</span>
            <span className={`text-sm font-bold ${getConfidenceColor()}`}>{confidence}%</span>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Details <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationCard;
