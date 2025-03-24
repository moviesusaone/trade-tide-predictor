import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RecommendationData } from '@/types/trading';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, BookmarkIcon } from 'lucide-react';

interface NotificationSystemProps {
  recommendations: RecommendationData[];
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
}

interface SavedNotification {
  id: string;
  pair: string;
  action: string;
  currentPrice: number;
  targetPrice: number;
  confidence: number;
  timestamp: string;
  potentialProfit: string;
}

const NotificationSystem = ({ recommendations, setNotifications }: NotificationSystemProps) => {
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  const [savedNotifications, setSavedNotifications] = useState<SavedNotification[]>([]);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  
  const shouldSendNotification = useCallback((recommendation: RecommendationData) => {
    if (notifiedIds.includes(recommendation.id)) {
      return false;
    }
    
    if (recommendation.confidence < 75) {
      console.log(`Skipping notification for ${recommendation.pair} as confidence (${recommendation.confidence}%) is below threshold`);
      return false;
    }
    
    const currentTime = Date.now();
    const timeSinceLastNotification = currentTime - lastNotificationTime;
    if (timeSinceLastNotification < 30 * 60 * 1000) {
      console.log(`Skipping notification as last one was shown ${Math.floor(timeSinceLastNotification/60000)} minutes ago`);
      return false;
    }
    
    const existingSimilarNotification = savedNotifications.find(
      n => n.pair === recommendation.pair && n.action === recommendation.recommendation
    );
    
    if (existingSimilarNotification) {
      const existingTime = new Date(existingSimilarNotification.timestamp).getTime();
      if (currentTime - existingTime < 6 * 60 * 60 * 1000) {
        console.log(`Skipping similar notification for ${recommendation.pair} as we already have a recent one`);
        return false;
      }
    }
    
    return true;
  }, [notifiedIds, lastNotificationTime, savedNotifications]);
  
  const showNotification = useCallback((recommendation: RecommendationData) => {
    if (!shouldSendNotification(recommendation)) {
      return;
    }
    
    const { pair, recommendation: action, currentPrice, targetPrice, confidence } = recommendation;
    
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
    
    const newSavedNotification: SavedNotification = {
      id: recommendation.id,
      pair,
      action,
      currentPrice,
      targetPrice,
      confidence,
      timestamp: new Date().toISOString(),
      potentialProfit
    };
    
    setSavedNotifications(prev => {
      const updatedNotifications = [newSavedNotification, ...prev];
      return updatedNotifications.slice(0, 20);
    });
    
    toast.custom((id) => (
      <div className={`rounded-lg overflow-hidden shadow-xl max-w-md w-full bg-gradient-to-r ${bgColor} backdrop-blur-md border border-white/10 animate-fade-in`}>
        <div className="px-4 py-3 flex items-center">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white flex items-center">
              {action} SIGNAL: {pair}
              <BookmarkIcon className="h-4 w-4 ml-2 text-white/70" title="Saved to important opportunities" />
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
      duration: 15000,
      position: 'top-right',
    });
    
    setNotifiedIds(prev => [...prev, recommendation.id]);
    setNotifications(prev => prev + 1);
    setLastNotificationTime(Date.now());
    
    try {
      const soundUrl = 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 0.7;
      audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [notifiedIds, setNotifications, shouldSendNotification]);
  
  useEffect(() => {
    const checkDailyOpportunities = () => {
      const currentHour = new Date().getHours();
      const isMarketActiveHour = currentHour >= 8 && currentHour <= 16;
      
      const highQualityRecommendations = recommendations
        .filter(rec => rec.confidence >= 80)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 2);
      
      highQualityRecommendations.forEach(rec => {
        const isRecentRec = new Date(rec.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000;
        
        if (isRecentRec && (rec.confidence >= 85 || isMarketActiveHour)) {
          console.log(`Processing ${rec.recommendation} recommendation for ${rec.pair} with ${rec.confidence}% confidence`);
          showNotification(rec);
        }
      });
    };
    
    checkDailyOpportunities();
    
    const intervalId = setInterval(() => {
      checkDailyOpportunities();
    }, 3 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [recommendations, showNotification]);
  
  return null;
};

export default NotificationSystem;
