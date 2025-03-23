
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RecommendationData } from '@/types/trading';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface NotificationSystemProps {
  recommendations: RecommendationData[];
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationSystem = ({ recommendations, setNotifications }: NotificationSystemProps) => {
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  
  const showNotification = useCallback((recommendation: RecommendationData) => {
    if (notifiedIds.includes(recommendation.id)) {
      return;
    }
    
    const { pair, recommendation: action, currentPrice, targetPrice, confidence } = recommendation;
    
    // Only show notifications for high-confidence opportunities
    const isProfitableOpportunity = confidence >= 70;
    
    if (!isProfitableOpportunity) {
      console.log(`Skipping notification for ${pair} as confidence (${confidence}%) is below threshold`);
      return;
    }
    
    let icon;
    let bgColor;
    
    switch (action) {
      case 'BUY':
        icon = <ArrowUpIcon className="h-5 w-5 text-white" />;
        bgColor = 'from-trader-buy/90 to-trader-buy/70';
        break;
      case 'SELL':
        icon = <ArrowDownIcon className="h-5 w-5 text-white" />;
        bgColor = 'from-trader-sell/90 to-trader-sell/70';
        break;
      default:
        icon = <MinusIcon className="h-5 w-5 text-white" />;
        bgColor = 'from-trader-neutral/90 to-trader-neutral/70';
    }
    
    const priceDiff = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
    const priceDirection = action === 'BUY' ? '+' : action === 'SELL' ? '-' : '±';
    
    const potentialProfit = `${priceDirection}${Math.abs(parseFloat(priceDiff))}%`;
    
    toast.custom((id) => (
      <div className={`rounded-lg overflow-hidden shadow-xl max-w-md w-full bg-gradient-to-r ${bgColor} backdrop-blur-md border border-white/10 animate-fade-in`}>
        <div className="px-4 py-3 flex items-center">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">
              {action} SIGNAL: {pair}
            </h3>
            <p className="text-sm text-white/80">
              Current: {currentPrice.toFixed(5)} | Target: {targetPrice.toFixed(5)} ({potentialProfit})
            </p>
            <p className="text-xs text-white/70 mt-1">
              Confidence: {confidence}% - فرصة مربحة للتداول!
            </p>
          </div>
        </div>
      </div>
    ), {
      duration: 10000, // Longer duration for important signals
      position: 'top-right',
    });
    
    setNotifiedIds(prev => [...prev, recommendation.id]);
    setNotifications(prev => prev + 1);
    
    // Play notification sound - different sound for high-confidence opportunities
    try {
      // Use a more attention-grabbing sound for profitable opportunities
      const soundUrl = isProfitableOpportunity 
        ? 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3'  // More attention-grabbing sound
        : 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Default sound
      
      const audio = new Audio(soundUrl);
      audio.volume = 0.6; // Slightly louder for important notifications
      audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [notifiedIds, setNotifications]);
  
  useEffect(() => {
    // Get current hour to check if it's trading time
    const checkDailyOpportunities = () => {
      const currentHour = new Date().getHours();
      const isMarketActiveHour = currentHour >= 8 && currentHour <= 16; // Common trading hours (8 AM - 4 PM)
      
      // Filter recent recommendations and only high-quality ones
      recommendations.forEach(rec => {
        const isRecentRec = new Date(rec.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Within last 24 hours
        const isHighQuality = rec.confidence >= 75; // High confidence recs only
        
        if (isRecentRec && (isHighQuality || isMarketActiveHour)) {
          console.log(`Processing ${rec.recommendation} recommendation for ${rec.pair} with ${rec.confidence}% confidence`);
          showNotification(rec);
        }
      });
    };
    
    // Check immediately and then set up a daily check
    checkDailyOpportunities();
    
    // Set up interval to check for opportunities every 3 hours during market hours
    const intervalId = setInterval(() => {
      checkDailyOpportunities();
    }, 3 * 60 * 60 * 1000); // Every 3 hours
    
    return () => clearInterval(intervalId);
  }, [recommendations, showNotification]);
  
  return null; // This component doesn't render anything, it just shows notifications
};

export default NotificationSystem;
