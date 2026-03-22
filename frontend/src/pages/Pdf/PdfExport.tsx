import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { requestPdfPreview, exportPdf } from '../../services/api';
import { useEditorStore } from '../../stores/editorStore';

type Tab = 'preview' | 'export';

export default function PdfExport() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ jobId: string; url?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blogId = useEditorStore((s) => s.blogId);

  const handlePreview = async () => {
    if (!blogId) {
      setError('No blog selected. Please open a blog first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await requestPdfPreview(blogId);
      setResult({ jobId: data.jobId, url: data.previewUrl });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request PDF preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!blogId) {
      setError('No blog selected. Please open a blog first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await exportPdf(blogId);
      setResult({ jobId: data.jobId, message: `PDF export queued. Cost: ${data.creditCost} credits` });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
          <h1 className="text-lg font-semibold text-text-primary">{t('pdfExport') || 'PDF Export'}</h1>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-6">{t('exportPdf') || 'Export Your Blog'}</h2>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors btn-hover ${
                activeTab === 'preview'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-secondary hover:text-text-primary'
              }`}
            >
              {t('freePreview') || 'Free Preview'}
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors btn-hover ${
                activeTab === 'export'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-secondary hover:text-text-primary'
              }`}
            >
              {t('exportCredits') || 'Export (0.3 Credits)'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="font-medium text-green-600">
                {result.message || 'PDF Preview Ready'}
              </p>
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded-lg btn-hover"
                >
                  {t('viewPreview') || 'View Preview'}
                </a>
              )}
              <p className="mt-2 text-sm text-green-600">
                Job ID: {result.jobId}
              </p>
            </div>
          )}

          <div className="bg-surface rounded-xl p-6 border border-border">
            {activeTab === 'preview' ? (
              <div>
                <p className="text-secondary mb-4">
                  {t('previewDesc') || 'Get a free low-resolution PDF preview of your blog. The preview link expires in 1 hour.'}
                </p>
                <button
                  onClick={handlePreview}
                  disabled={loading || !blogId}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold btn-hover disabled:opacity-50"
                >
                  {loading ? (t('generating') || 'Generating Preview...') : (t('generatePreview') || 'Generate Free Preview')}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-secondary mb-4">
                  {t('exportDesc') || 'Export a full high-resolution PDF of your blog. This will deduct 0.3 credits from your balance.'}
                </p>
                <button
                  onClick={handleExport}
                  disabled={loading || !blogId}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold btn-hover disabled:opacity-50"
                >
                  {loading ? (t('exporting') || 'Exporting...') : (t('exportPdf') || 'Export PDF (0.3 Credits)')}
                </button>
              </div>
            )}

            {!blogId && (
              <p className="mt-4 text-sm text-amber-500">
                {t('openBlogFirst') || 'Please open a blog in the editor to export or preview its PDF.'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
