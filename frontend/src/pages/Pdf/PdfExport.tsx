import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { requestPdfPreview, exportPdf, getPdfJobStatus } from '../../services/api';
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">PDF Export</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-primary text-white'
              : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
          }`}
        >
          Free Preview
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'export'
              ? 'bg-primary text-white'
              : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
          }`}
        >
          Export (0.3 Credits)
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="font-medium text-green-800 dark:text-green-200">
            {result.message || 'PDF Preview Ready'}
          </p>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View Preview
            </a>
          )}
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Job ID: {result.jobId}
          </p>
        </div>
      )}

      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6">
        {activeTab === 'preview' ? (
          <div>
            <p className="text-secondary mb-4">
              Get a free low-resolution PDF preview of your blog. The preview link expires in 1 hour.
            </p>
            <button
              onClick={handlePreview}
              disabled={loading || !blogId}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Generating Preview...' : 'Generate Free Preview'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-secondary mb-4">
              Export a full high-resolution PDF of your blog. This will deduct 0.3 credits from your balance.
            </p>
            <button
              onClick={handleExport}
              disabled={loading || !blogId}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Export PDF (0.3 Credits)'}
            </button>
          </div>
        )}

        {!blogId && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Please open a blog in the editor to export or preview its PDF.
          </p>
        )}
      </div>
    </div>
  );
}