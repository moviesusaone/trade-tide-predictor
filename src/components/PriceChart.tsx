
import { useEffect, useRef } from 'react';
import { PriceData } from '@/types/trading';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface PriceChartProps {
  data: PriceData[];
  recommendation: 'BUY' | 'SELL' | 'HOLD';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {payload[0].value.toFixed(5)}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
          <span className="text-gray-600 dark:text-gray-400">O: {data.open.toFixed(5)}</span>
          <span className="text-gray-600 dark:text-gray-400">C: {data.close.toFixed(5)}</span>
          <span className="text-green-500">H: {data.high.toFixed(5)}</span>
          <span className="text-red-500">L: {data.low.toFixed(5)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data, recommendation }: PriceChartProps) => {
  const chartColor = recommendation === 'BUY' 
    ? '#3ABAB4' // green for buy
    : recommendation === 'SELL' 
      ? '#EB4A4A' // red for sell
      : '#A3A3A3'; // gray for hold
  
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add animation or effects if needed
    const chart = chartRef.current;
    if (chart) {
      // You could add some effects here
    }
  }, [data, recommendation]);

  return (
    <motion.div 
      ref={chartRef} 
      className="chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.5} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="timestamp" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['dataMin - 0.005', 'dataMax + 0.005']}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke={chartColor} 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default PriceChart;
