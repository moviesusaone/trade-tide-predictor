
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  MinusIcon,
  RefreshCwIcon,
  TargetIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  BrainIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TradingRecommendation {
  id: string;
  date: string;
  pair: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  current_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  technical_indicators: any;
  created_at: string;
}

interface EurUsdData {
  id: string;
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume?: number;
  change_percent?: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  rsi?: number;
  created_at: string;
}

const TradingAI = () => {
  const [recommendation, setRecommendation] = useState<TradingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<EurUsdData[]>([]);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    loadLatestRecommendation();
    loadHistoricalData();
  }, []);

  const isDarkMode = mounted && theme === 'dark';
  const toggleTheme = () => setTheme(isDarkMode ? 'light' : 'dark');

  const loadLatestRecommendation = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_recommendations')
        .select('*')
        .eq('pair', 'EURUSD')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading recommendation:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setRecommendation(data[0] as TradingRecommendation);
      }
    } catch (error) {
      console.error('Error loading recommendation:', error);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const { data, error } = await supabase
        .from('eurusd_data')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (error) {
        console.error('Error loading historical data:', error);
        return;
      }
      
      setHistoricalData((data as EurUsdData[]) || []);
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const generateNewRecommendation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trading-ai');
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      if (data?.success && data?.recommendation) {
        toast.success('تم إنشاء توصية جديدة بنجاح');
        await loadLatestRecommendation();
        await loadHistoricalData();
      } else {
        throw new Error(data?.error || 'فشل في إنشاء التوصية');
      }
    } catch (error) {
      console.error('Error generating recommendation:', error);
      toast.error('حدث خطأ في إنشاء التوصية');
    } finally {
      setLoading(false);
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUpIcon className="h-6 w-6 text-green-500" />;
      case 'SELL':
        return <TrendingDownIcon className="h-6 w-6 text-red-500" />;
      default:
        return <MinusIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-500 text-white';
      case 'SELL':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header 
        toggleTheme={toggleTheme} 
        isDarkMode={isDarkMode} 
        notifications={0}
      />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              مُحلل التداول الذكي
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              توصيات تداول ذكية لزوج EUR/USD باستخدام التحليل الفني المتقدم والذكاء الاصطناعي
            </p>
          </div>
        </motion.div>
        
        <NavigationBar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Recommendation */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <BrainIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <CardTitle className="text-2xl">التوصية الحالية</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    آخر تحديث: {recommendation ? format(new Date(recommendation.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }) : 'لا يوجد'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={generateNewRecommendation} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'جاري التحليل...' : 'تحديث التوصية'}
              </Button>
            </CardHeader>
            
            <CardContent>
              {recommendation ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Signal */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      {getSignalIcon(recommendation.signal)}
                    </div>
                    <Badge className={`text-lg px-4 py-2 ${getSignalColor(recommendation.signal)}`}>
                      {recommendation.signal}
                    </Badge>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      الإشارة
                    </p>
                  </div>

                  {/* Price Info */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {recommendation.current_price.toFixed(5)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">السعر الحالي</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-500">
                          <TargetIcon className="h-4 w-4" />
                          <span className="font-semibold">{recommendation.target_price.toFixed(5)}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">الهدف</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-500">
                          <AlertTriangleIcon className="h-4 w-4" />
                          <span className="font-semibold">{recommendation.stop_loss.toFixed(5)}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">وقف الخسارة</p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence & Analysis */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                        {recommendation.confidence.toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">نسبة الثقة</p>
                    </div>
                    
                    {recommendation.technical_indicators && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>MA5: {recommendation.technical_indicators.ma5 || 'N/A'}</div>
                        <div>MA10: {recommendation.technical_indicators.ma10 || 'N/A'}</div>
                        <div>MA20: {recommendation.technical_indicators.ma20 || 'N/A'}</div>
                        <div>RSI: {recommendation.technical_indicators.rsi || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BrainIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                    لا توجد توصية متاحة حالياً
                  </p>
                  <Button onClick={generateNewRecommendation} disabled={loading}>
                    إنشاء توصية جديدة
                  </Button>
                </div>
              )}
              
              {recommendation?.reasoning && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">التحليل الفني:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {recommendation.reasoning}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historical Data */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3Icon className="h-6 w-6 text-green-500" />
                <CardTitle>البيانات التاريخية (آخر 7 أيام)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-2">التاريخ</th>
                        <th className="text-right p-2">الإغلاق</th>
                        <th className="text-right p-2">التغير %</th>
                        <th className="text-right p-2">MA5</th>
                        <th className="text-right p-2">MA10</th>
                        <th className="text-right p-2">RSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{format(new Date(item.date), 'dd/MM', { locale: ar })}</td>
                          <td className="p-2 font-semibold">{item.close_price?.toFixed(5) || 'N/A'}</td>
                          <td className={`p-2 ${(item.change_percent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {item.change_percent ? `${item.change_percent.toFixed(2)}%` : 'N/A'}
                          </td>
                          <td className="p-2">{item.ma5?.toFixed(5) || 'N/A'}</td>
                          <td className="p-2">{item.ma10?.toFixed(5) || 'N/A'}</td>
                          <td className="p-2">{item.rsi?.toFixed(1) || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات تاريخية متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TradingAI;
