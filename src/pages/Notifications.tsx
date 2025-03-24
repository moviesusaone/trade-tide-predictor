
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SavedNotification, getSavedNotifications, updateSavedNotifications } from '@/components/NotificationSystem';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon, 
  Trash2Icon,
  BellOffIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<SavedNotification[]>(getSavedNotifications());
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      updateSavedNotifications(updated);
      return updated;
    });
    toast.success("تم حذف الإشعار بنجاح");
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    updateSavedNotifications([]);
    toast.success("تم حذف جميع الإشعارات بنجاح");
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      updateSavedNotifications(updated);
      return updated;
    });
    toast.success("تم تحديد جميع الإشعارات كمقروءة");
  };
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <ArrowUpIcon className="h-4 w-4 text-trader-buy" />;
      case 'SELL':
        return <ArrowDownIcon className="h-4 w-4 text-trader-sell" />;
      default:
        return <MinusIcon className="h-4 w-4 text-trader-neutral" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
            الإشعارات
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            عرض جميع إشعارات التداول والتوصيات التي تلقيتها
          </p>
        </motion.div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">التوصيات السابقة</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {notifications.length} إشعار
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={markAllAsRead}
                  disabled={notifications.every(n => n.read)}
                >
                  <BellOffIcon className="h-4 w-4 ml-2" />
                  تحديد الكل كمقروء
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2Icon className="h-4 w-4 ml-2" />
                  حذف الكل
                </Button>
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد إشعارات حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التوصية</TableHead>
                      <TableHead>الزوج</TableHead>
                      <TableHead>السعر الحالي</TableHead>
                      <TableHead>السعر المستهدف</TableHead>
                      <TableHead>الربح المتوقع</TableHead>
                      <TableHead>نسبة الثقة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow 
                        key={notification.id}
                        className={notification.read ? "" : "bg-blue-50/50 dark:bg-blue-900/20"}
                      >
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {getActionIcon(notification.action)}
                            <span>{notification.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>{notification.pair}</TableCell>
                        <TableCell>{notification.currentPrice.toFixed(5)}</TableCell>
                        <TableCell>{notification.targetPrice.toFixed(5)}</TableCell>
                        <TableCell 
                          className={
                            notification.potentialProfit.startsWith('+') 
                              ? 'text-trader-buy' 
                              : notification.potentialProfit.startsWith('-') 
                              ? 'text-trader-sell' 
                              : ''
                          }
                        >
                          {notification.potentialProfit}
                        </TableCell>
                        <TableCell>{notification.confidence}%</TableCell>
                        <TableCell>
                          {format(new Date(notification.timestamp), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteNotification(notification.id)}
                            aria-label="حذف"
                          >
                            <Trash2Icon className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotificationsPage;
