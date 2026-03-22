import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface DailyStat {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

interface LineChartProps {
  dailyStats: DailyStat[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * Downsample dailyStats to approximately targetPoints if length exceeds threshold.
 * Uses largest-step algorithm to preserve start, end, and key intermediate points.
 */
function downsampleData(data: DailyStat[], targetPoints: number = 30): DailyStat[] {
  if (data.length <= targetPoints) {
    return data;
  }

  const step = Math.max(1, Math.floor(data.length / targetPoints));
  const result: DailyStat[] = [];

  // Always include first point
  result.push(data[0]);

  // Include points at step intervals
  for (let i = step; i < data.length - step; i += step) {
    result.push(data[i]);
  }

  // Always include last point
  result.push(data[data.length - 1]);

  return result;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatYAxis(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return value.toString();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-surface-elevated rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className="text-sm font-medium text-text-primary">
        {payload[0].value.toLocaleString()} views
      </p>
    </div>
  );
}

export default function ChartLine({ dailyStats, loading, error, onRetry }: LineChartProps) {
  if (loading) {
    return (
      <div className="h-[300px] bg-surface-elevated animate-pulse rounded-2xl" />
    );
  }

  if (error) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center">
        <p className="text-text-secondary mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!dailyStats || dailyStats.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-text-muted">No page view data for this period</p>
      </div>
    );
  }

  const chartData = downsampleData(dailyStats);
  const accentColor = 'oklch(70% 0.14 50)';

  return (
    <div className="h-[300px] transition-opacity duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(30% 0.01 260)"
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="oklch(55% 0.01 260)"
            tick={{ fill: 'oklch(55% 0.01 260)', fontSize: 12 }}
            axisLine={{ stroke: 'oklch(30% 0.01 260)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="oklch(55% 0.01 260)"
            tick={{ fill: 'oklch(55% 0.01 260)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="pageViews"
            stroke={accentColor}
            strokeWidth={2}
            fill="url(#areaGradient)"
            animationDuration={300}
            animationEasing="ease-out-quart"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
