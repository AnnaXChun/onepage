import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { getUserAnalytics, AnalyticsData } from '../../services/api';

type Period = '7d' | '30d' | '90d';

interface StatCardProps {
  label: string;
  value: number;
  trend?: number;
}

function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-6 min-h-[120px] flex flex-col justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-semibold text-accent">
          {value.toLocaleString()}
        </span>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserAnalytics(period);
      if (response.code === 200) {
        setAnalytics(response.data || []);
      } else {
        setError(response.message || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalVisitors = analytics.reduce((sum, a) => sum + a.totalUniqueVisitors, 0);
  const totalPageViews = analytics.reduce((sum, a) => sum + a.totalPageViews, 0);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-8 w-32 bg-surface rounded mb-8 animate-pulse" />
        <div className="flex gap-4 mb-8">
          <div className="flex-1 h-32 bg-surface rounded-2xl animate-pulse" />
          <div className="flex-1 h-32 bg-surface rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-8">Analytics</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-16 h-16 text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-semibold text-text-primary mb-2">No analytics yet</h2>
          <p className="text-text-secondary max-w-sm">Publish your site to start tracking visitors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="inline-flex bg-surface rounded-lg p-1">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === p
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Visitors" value={totalVisitors} />
        <StatCard label="Page Views" value={totalPageViews} />
      </div>

      <div className="bg-surface rounded-2xl overflow-hidden">
        <div className="bg-surface-elevated px-6 py-4 text-left text-sm font-medium text-text-secondary">
          Site
        </div>
        {analytics.map((item, index) => (
          <div
            key={item.blogId}
            className={`px-6 py-4 border-t border-border ${
              index % 2 === 0 ? 'bg-surface' : 'bg-surface/50'
            } hover:bg-background transition-colors`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-primary">{item.blogTitle}</span>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <span className="font-mono text-sm text-text-secondary">Visitors</span>
                  <span className="ml-2 font-mono text-sm font-medium">
                    {item.totalUniqueVisitors.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-sm text-text-secondary">Views</span>
                  <span className="ml-2 font-mono text-sm font-medium">
                    {item.totalPageViews.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}