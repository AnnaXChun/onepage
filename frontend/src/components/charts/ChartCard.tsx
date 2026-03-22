interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function ChartCard({ title, children, loading, error, onRetry }: ChartCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <span className="text-base font-medium text-text-primary">{title}</span>
        </div>
        <div className="p-6">
          <div className="h-[300px] bg-surface animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <span className="text-base font-medium text-text-primary">{title}</span>
        </div>
        <div className="p-6 flex flex-col items-center justify-center h-[300px]">
          <p className="text-text-secondary mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium btn-hover transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <span className="text-base font-medium text-text-primary">{title}</span>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
