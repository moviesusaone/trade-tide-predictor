
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RecommendationData } from '@/types/trading';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface NotificationSystemProps {
  recommendations: RecommendationData[];
  setNotifications: (count: number) => void;
}

const NotificationSystem = ({ recommendations, setNotifications }: NotificationSystemProps) => {
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  
  const showNotification = useCallback((recommendation: RecommendationData) => {
    if (notifiedIds.includes(recommendation.id)) {
      return;
    }
    
    const { pair, recommendation: action, currentPrice, targetPrice } = recommendation;
    
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
              Current: {currentPrice.toFixed(5)} | Target: {targetPrice.toFixed(5)} ({priceDirection}{Math.abs(parseFloat(priceDiff))}%)
            </p>
          </div>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-right',
    });
    
    setNotifiedIds(prev => [...prev, recommendation.id]);
    setNotifications(prev => prev + 1);
    
    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [notifiedIds, setNotifications]);
  
  useEffect(() => {
    // Process new recommendations
    recommendations.forEach(rec => {
      const isRecent = new Date(rec.timestamp).getTime() > Date.now() - 10 * 60 * 1000;
      if (isRecent) {
        showNotification(rec);
      }
    });
  }, [recommendations, showNotification]);
  
  return null; // This component doesn't render anything, it just shows notifications
};

export default NotificationSystem;
