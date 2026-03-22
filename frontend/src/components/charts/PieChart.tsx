import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RefererSource {
  source: 'Direct' | 'Search Engine' | 'Social' | 'Referral' | 'Other';
  displayName: string;
  pageViews: number;
  percentage: number;
}

interface PieChartComponentProps {
  refererSources: RefererSource[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

// Pie chart segment colors (5 categories)
const COLORS = {
  Direct: '#b85c38',         // accent coral
  'Search Engine': '#7c6cbc', // primary purple
  Social: '#4caf50',           // success green
  Referral: '#5c8cc4',        // cool blue
  Other: '#6e6e6e',            // muted neutral
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { percentage: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  return (
    <div className="bg-surface-elevated rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-text-primary mb-1">{data.name}</p>
      <p className="text-sm text-text-secondary">
        {data.value.toLocaleString()} views ({data.payload.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

export default function PieChartComponent({ refererSources, loading, error, onRetry }: PieChartComponentProps) {
  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="w-[200px] h-[200px] bg-surface-elevated animate-pulse rounded-full" />
      </div>
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

  if (!refererSources || refererSources.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-text-muted">No traffic source data</p>
      </div>
    );
  }

  const chartData = refererSources.map((source) => ({
    name: source.displayName || source.source,
    value: source.pageViews,
    percentage: source.percentage,
    source: source.source,
  }));

  return (
    <div className="flex flex-col items-center transition-opacity duration-300">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={0}
              dataKey="value"
              animationDuration={300}
              animationEasing="ease-out-quart"
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
              labelLine={{ stroke: 'oklch(55% 0.01 260)', strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.source as keyof typeof COLORS] || COLORS.Other}
                  stroke="oklch(20% 0.015 260)"
                  strokeWidth={2}
                  style={{
                    filter: 'hover' ? 'brightness(1.05)' : 'none',
                    transition: 'filter 150ms ease-out',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {chartData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[entry.source as keyof typeof COLORS] || COLORS.Other }}
            />
            <span className="text-sm text-text-secondary">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
