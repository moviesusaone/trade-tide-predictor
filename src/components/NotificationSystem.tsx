
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RecommendationData } from '@/types/trading';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon, 
  BookmarkIcon, 
  BellRingIcon, 
  Trash2Icon, 
  CheckCircle2Icon 
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationSystemProps {
  recommendations: RecommendationData[];
  setNotifications: React.Dispatch<React.SetStateAction<number>>;
}

export interface SavedNotification {
  id: string;
  pair: string;
  action: string;
  currentPrice: number;
  targetPrice: number;
  confidence: number;
  timestamp: string;
  potentialProfit: string;
  read: boolean;
  targetReached?: boolean;
}

// Create a function to get local storage notifications
export const getSavedNotifications = (): SavedNotification[] => {
  const saved = localStorage.getItem('tradeTideNotifications');
  return saved ? JSON.parse(saved) : [];
};

// Update local storage with new notifications
export const updateSavedNotifications = (notifications: SavedNotification[]) => {
  localStorage.setItem('tradeTideNotifications', JSON.stringify(notifications));
};

const NotificationSystem = ({ recommendations, setNotifications }: NotificationSystemProps) => {
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  const [savedNotifications, setSavedNotifications] = useState<SavedNotification[]>(getSavedNotifications());
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  
  // Update local storage whenever savedNotifications changes
  useEffect(() => {
    updateSavedNotifications(savedNotifications);
    setNotifications(savedNotifications.filter(n => !n.read).length);
  }, [savedNotifications, setNotifications]);
  
  const shouldSendNotification = useCallback((recommendation: RecommendationData) => {
    if (notifiedIds.includes(recommendation.id)) {
      return false;
    }
    
    // Only notify for extremely high-confidence opportunities (85%+)
    if (recommendation.confidence < 85) {
      console.log(`Skipping notification for ${recommendation.pair} as confidence (${recommendation.confidence}%) is below high threshold`);
      return false;
    }
    
    // Calculate profit percentage
    const priceDiff = ((recommendation.targetPrice - recommendation.currentPrice) / recommendation.currentPrice * 100);
    const absoluteProfitPercentage = Math.abs(priceDiff);
    
    // Only notify if potential profit is significant (0.5%+)
    if (absoluteProfitPercentage < 0.5) {
      console.log(`Skipping notification for ${recommendation.pair} as potential profit (${absoluteProfitPercentage.toFixed(2)}%) is below threshold`);
      return false;
    }
    
    // Limit notifications frequency to once per 8 hours
    const currentTime = Date.now();
    const timeSinceLastNotification = currentTime - lastNotificationTime;
    if (timeSinceLastNotification < 8 * 60 * 60 * 1000) {
      console.log(`Skipping notification as last one was shown ${Math.floor(timeSinceLastNotification/60000)} minutes ago`);
      return false;
    }
    
    // Avoid duplicate recommendations for same pair/action within 24 hours
    const existingSimilarNotification = savedNotifications.find(
      n => n.pair === recommendation.pair && n.action === recommendation.recommendation
    );
    
    if (existingSimilarNotification) {
      const existingTime = new Date(existingSimilarNotification.timestamp).getTime();
      if (currentTime - existingTime < 24 * 60 * 60 * 1000) {
        console.log(`Skipping similar notification for ${recommendation.pair} as we already have one within 24 hours`);
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
    const currentTime = new Date();
    const formattedTime = format(currentTime, 'yyyy-MM-dd HH:mm:ss');
    
    const newSavedNotification: SavedNotification = {
      id: recommendation.id,
      pair,
      action,
      currentPrice,
      targetPrice,
      confidence,
      timestamp: currentTime.toISOString(),
      potentialProfit,
      read: false,
      targetReached: false
    };
    
    setSavedNotifications(prev => {
      const updatedNotifications = [newSavedNotification, ...prev];
      return updatedNotifications.slice(0, 50); // Keep up to 50 notifications
    });
    
    toast.custom((id) => (
      <div className={`rounded-lg overflow-hidden shadow-xl max-w-md w-full bg-gradient-to-r ${bgColor} backdrop-blur-md border border-white/10 animate-fade-in`}>
        <div className="px-4 py-3 flex items-center">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white flex items-center">
              فرصة ممتازة: {action} {pair}
              <span className="ml-2 flex items-center">
                <BellRingIcon className="h-4 w-4 text-white/70" aria-label="توصية مؤكدة" />
              </span>
            </h3>
            <p className="text-sm text-white/80">
              السعر الحالي: {currentPrice.toFixed(5)} | الهدف: {targetPrice.toFixed(5)}
            </p>
            <p className="text-xs text-white/70 mt-1">
              نسبة الثقة: {confidence}% - الربح المتوقع: {potentialProfit}
            </p>
            <p className="text-xs text-white/70 mt-1 flex items-center justify-end">
              <span>{format(currentTime, 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
            </p>
          </div>
        </div>
      </div>
    ), {
      duration: 25000,
      position: 'top-right',
    });
    
    setNotifiedIds(prev => [...prev, recommendation.id]);
    setNotifications(prev => prev + 1);
    setLastNotificationTime(Date.now());
    
    try {
      // Use a more distinct sound for premium opportunities
      const soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 0.8;
      audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [notifiedIds, setNotifications, shouldSendNotification]);

  // Check if target price is reached and send notification
  const checkTargetPriceReached = useCallback((currentMarketPrice: number) => {
    const notificationsToUpdate: SavedNotification[] = [];

    savedNotifications.forEach(notification => {
      if (!notification.targetReached) {
        const isTargetReached = 
          (notification.action === 'BUY' && currentMarketPrice >= notification.targetPrice) || 
          (notification.action === 'SELL' && currentMarketPrice <= notification.targetPrice);
        
        if (isTargetReached) {
          notificationsToUpdate.push({
            ...notification,
            targetReached: true
          });

          // Send toast notification
          const bgColor = 'from-green-500/90 to-green-600/70';
          toast.custom((id) => (
            <div className={`rounded-lg overflow-hidden shadow-xl max-w-md w-full bg-gradient-to-r ${bgColor} backdrop-blur-md border border-white/10 animate-fade-in`}>
              <div className="px-4 py-3 flex items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                  <CheckCircle2Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white flex items-center">
                    تم الوصول للسعر المستهدف: {notification.pair}
                    <span className="ml-2 flex items-center">
                      <CheckCircle2Icon className="h-4 w-4 text-white/70" aria-label="تم الوصول للهدف" />
                    </span>
                  </h3>
                  <p className="text-sm text-white/80">
                    السعر الحالي: {currentMarketPrice.toFixed(5)} | الهدف: {notification.targetPrice.toFixed(5)}
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    توصية: {notification.action} - تحققت بنجاح!
                  </p>
                </div>
              </div>
            </div>
          ), {
            duration: 30000,
            position: 'top-right',
          });

          try {
            // Success sound for target reached
            const successSoundUrl = 'https://assets.mixkit.co/active_storage/sfx/2877/2877-preview.mp3';
            const audio = new Audio(successSoundUrl);
            audio.volume = 0.9;
            audio.play();
          } catch (error) {
            console.error('Failed to play target reached sound:', error);
          }
        }
      }
    });

    if (notificationsToUpdate.length > 0) {
      setSavedNotifications(prev => 
        prev.map(notification => {
          const updated = notificationsToUpdate.find(n => n.id === notification.id);
          return updated || notification;
        })
      );
    }
  }, [savedNotifications]);
  
  useEffect(() => {
    const checkPremiumOpportunities = () => {
      console.log("Checking for premium trading opportunities...");
      
      // Filter for only the highest quality recommendations
      const premiumRecommendations = recommendations
        .filter(rec => {
          // Calculate profit percentage
          const priceDiff = ((rec.targetPrice - rec.currentPrice) / rec.currentPrice * 100);
          const absoluteProfitPercentage = Math.abs(priceDiff);
          
          // Check if this is a premium opportunity (high confidence + good profit potential)
          const isPremium = rec.confidence >= 85 && absoluteProfitPercentage >= 0.5;
          
          if (isPremium) {
            console.log(`Found premium ${rec.recommendation} opportunity for ${rec.pair} with ${rec.confidence}% confidence and ${absoluteProfitPercentage.toFixed(2)}% potential profit`);
          }
          
          return isPremium;
        })
        .sort((a, b) => b.confidence - a.confidence);
      
      if (premiumRecommendations.length > 0) {
        // Only show the single best opportunity
        const bestOpportunity = premiumRecommendations[0];
        const isRecentRec = new Date(bestOpportunity.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000;
        
        if (isRecentRec) {
          console.log(`Processing premium ${bestOpportunity.recommendation} recommendation for ${bestOpportunity.pair} with ${bestOpportunity.confidence}% confidence`);
          showNotification(bestOpportunity);
        }

        // Check if any target prices have been reached
        if (premiumRecommendations.length > 0 && premiumRecommendations[0].currentPrice) {
          checkTargetPriceReached(premiumRecommendations[0].currentPrice);
        }
      } else {
        console.log("No premium opportunities found at this time");
      }
    };
    
    // Initial check
    checkPremiumOpportunities();
    
    // Set up daily checks at market open (approx 8-9 AM)
    const intervalId = setInterval(() => {
      const currentHour = new Date().getHours();
      const isMarketOpeningTime = currentHour >= 8 && currentHour <= 9;
      
      if (isMarketOpeningTime || Math.random() < 0.1) { // Occasionally check outside market hours too
        checkPremiumOpportunities();
      }
    }, 24 * 60 * 60 * 1000 / 4); // Check roughly 4 times per day
    
    // Set up more frequent checks for target price reached (every 5 minutes)
    const targetCheckIntervalId = setInterval(() => {
      if (recommendations.length > 0 && recommendations[0].currentPrice) {
        checkTargetPriceReached(recommendations[0].currentPrice);
      }
    }, 5 * 60 * 1000); 
    
    return () => {
      clearInterval(intervalId);
      clearInterval(targetCheckIntervalId);
    };
  }, [recommendations, showNotification, checkTargetPriceReached]);
  
  return null;
};

export default NotificationSystem;
