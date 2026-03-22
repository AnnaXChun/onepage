import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createBlog, createOrder, getPaymentQRCode, queryPaymentStatus } from '../../services/api';
import { useTranslation } from '../../i18n';
import { PREVIEW_URL } from '../../config/env';
import type { TemplateConfig } from '../../config/templates';

interface Blog {
  id: number;
  shareCode: string;
  title?: string;
  content?: string;
  coverImage?: string;
}

interface PreviewProps {
  blogId?: string;
  blog?: Blog | null;
  image?: string | null;
  template?: TemplateConfig | null;
  onGenerated?: (blog: Blog) => void;
  onBack?: () => void;
  onSuccess?: (blog: Blog) => void;
  onEdit?: (blog: Blog) => void;
}

function Preview({ blogId, blog: existingBlog, image, template, onGenerated, onBack, onSuccess, onEdit }: PreviewProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedBlog, setGeneratedBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const [blogCreated, setBlogCreated] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [processing, setProcessing] = useState(false);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [expireMinutes, setExpireMinutes] = useState(30);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPaidTemplate = template?.price != null && template.price > 0;

  const defaultContent = 'Welcome to my personal blog! This is a blog generated from your image.\n\nWith advanced AI technology, we extract colors, style, and atmosphere from your photo to create a unique personal blog site. No coding knowledge required.\n\nShare your story with the world.';

  const shortPreviewUrl = `${PREVIEW_URL}/preview?template=${template?.slug || 'minimal-simple'}`;
  const localPreviewUrl = image
    ? `${PREVIEW_URL}/preview?template=${template?.slug || 'minimal-simple'}&name=${encodeURIComponent('My Blog')}&bio=${encodeURIComponent('Welcome to my blog')}&content=${encodeURIComponent(generatedBlog?.content || defaultContent)}&image=${encodeURIComponent(image)}`
    : shortPreviewUrl;

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const shareUrl = generatedBlog?.shareCode
    ? isLocalhost
      ? `http://localhost:5173/blog/${generatedBlog.shareCode}`
      : `https://vibe.page/blog/${generatedBlog.shareCode}`
    : null;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || localPreviewUrl || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenPreview = () => {
    if (localPreviewUrl) {
      window.open(localPreviewUrl, '_blank');
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // Handle existing blog from props
  useEffect(() => {
    if (existingBlog) {
      setGeneratedBlog(existingBlog);
      setLoading(false);
      setBlogCreated(true);
    }
  }, [existingBlog]);

  // Reset blog creation when template changes (for re-creation with new template)
  useEffect(() => {
    if (blogCreated && template) {
      console.log('[Preview] Template changed, resetting blogCreated to allow re-creation');
      setBlogCreated(false);
      setGeneratedBlog(null);
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  // Create new blog if needed
  useEffect(() => {
    // Skip if: already created, no image/template, or existing blog
    if (blogCreated) {
      return;
    }
    if (!image || !template) {
      setLoading(false);
      return;
    }
    if (existingBlog) {
      return;
    }

    console.log('[Preview] Starting blog creation with image:', !!image, 'template:', template?.name);

    const timer = setTimeout(async () => {
      try {
        const blogData = {
          title: 'My Blog',
          content: defaultContent,
          coverImage: image,
          templateId: template?.slug || 'minimal-simple',
        };
        console.log('[Preview] API call - templateId:', blogData.templateId);
        const response = await createBlog(blogData);
        console.log('[Preview] API response:', response);
        if (response.code === 200 && response.data) {
          setGeneratedBlog(response.data);
          setBlogCreated(true);
          onGenerated?.(response.data);
        } else {
          setError(response.message || t('failedToCreateBlog'));
        }
      } catch (err) {
        setError(t('failedToCreateBlogTryAgain'));
        console.error('Error creating blog:', err);
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [image, template, existingBlog, blogCreated]);

  const handlePurchase = async () => {
    if (!template) return;

    try {
      setProcessing(true);
      setPaymentError(null);

      const createResult = await createOrder(template.id, template.name, template.price, paymentMethod);

      if (createResult.code !== 200) {
        setPaymentError(createResult.message || t('createOrderFailed'));
        setProcessing(false);
        return;
      }

      const order = createResult.data;
      setOrderNo(order.orderNo);

      const qrResult = await getPaymentQRCode(order.orderNo, paymentMethod);

      if (qrResult.code === 200) {
        setQrCodeUrl(qrResult.data?.qrcodeUrl);
        setExpireMinutes(qrResult.data?.expireMinutes || 30);
        startPolling(order.orderNo);
      } else {
        setPaymentError(qrResult.message || t('getQRCodeFailed'));
        setProcessing(false);
      }
    } catch (err) {
      console.error(t('paymentInitFailed'), err);
      setPaymentError(err instanceof Error ? err.message : t('paymentInitFailedRetry'));
      setProcessing(false);
    }
  };

  const startPolling = (orderNo: string) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = setInterval(async () => {
      try {
        const statusResult = await queryPaymentStatus(orderNo);

        if (statusResult.code === 200) {
          const status = statusResult.data?.status;
          setPaymentStatus(status);
          setExpireMinutes(statusResult.data?.expireMinutes || 0);

          if (status === 'PAID') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setTimeout(() => onSuccess?.(), 1500);
          } else if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'FAILED') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setPaymentError(t('paymentCancelledOrExpired'));
          }
        }
      } catch (err) {
        console.error(t('queryPaymentStatusFailed'), err);
      }
    }, 2000);
  };

  const paymentMethods = [
    {
      id: 'wechat',
      name: t('weChatPay'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.89.31 1.87.5 2.91.5.34 0 .67-.02 1-.05-.1-.32-.2-.67-.2-1.05 0-1.54.91-2.79 2.16-3.22-.29-.45-.46-.99-.46-1.58 0-1.34 1.26-2.2 2.91-2.2.18 0 .35.01.53.03C14.16 5.32 11.97 4 9.5 4z" />
        </svg>
      ),
    },
    {
      id: 'alipay',
      name: t('alipay'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.3 8.5c-.3.6-.9 1.1-1.7 1.4-.5.2-1 .3-1.5.3H8.5c-.6 0-1.1-.1-1.5-.3-.8-.3-1.4-.8-1.7-1.4-.3-.5-.4-1.1-.4-1.7 0-1.5 1.3-2.5 3.4-2.8 1.7-.2 3.3.3 4.3 1.2.9-.9 2.4-1.4 4-1.2 2 .3 3.4 1.3 3.4 2.8 0 .6-.1 1.2-.4 1.7zM8.5 13c-.5 0-1 .4-1 1s.5 1 1 1 1-.4 1-1-.5-1-1-1zm7 0c-.5 0-1 .4-1 1s.5 1 1 1 1-.4 1-1-.5-1-1-1z" />
        </svg>
      ),
    },
  ];

  const renderPaymentSidebar = () => (
    <div className="w-80 flex-shrink-0">
      <div className="sticky top-24 bg-surface/80 backdrop-blur-2xl rounded-2xl border border-border p-6 animate-slide-up">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-900">
            {template?.thumbnail && (
              <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <p className="text-sm text-text-muted">{t('template')}</p>
            <p className="font-semibold text-text-primary">{template?.name}</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-text-muted mb-1">{t('price')}</p>
          <p className="text-4xl font-bold text-text-primary">${template?.price}</p>
        </div>

        {paymentError && (
          <div className="mb-4 bg-error/20 border border-error/30 text-error px-4 py-3 rounded-xl text-sm animate-fade-in">
            {paymentError}
          </div>
        )}

        {!orderNo ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-text-muted mb-3">{t('paymentMethod')}</p>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    disabled={processing}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 ${
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-borderLight'
                    }`}
                  >
                    <div className="text-text-secondary">{method.icon}</div>
                    <span className="font-medium text-text-primary text-sm">{method.name}</span>
                    {paymentMethod === method.id && (
                      <svg className="w-4 h-4 ml-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={processing}
              className="w-full py-4 bg-primary text-background font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('processing')}
                  </>
                ) : (
                  `${t('buyNow')} - $${template?.price}`
                )}
              </span>
            </button>
          </>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="mb-4">
              {qrCodeUrl && (
                <div className="relative inline-block">
                  <div className="w-48 h-48 bg-white mx-auto rounded-2xl flex items-center justify-center p-2 shadow-lg">
                    <QRCodeSVG
                      value={qrCodeUrl}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  {expireMinutes <= 5 && expireMinutes > 0 && (
                    <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center">
                      <p className="text-error font-medium">{t('expiringSoon')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm text-text-muted mb-3">
              {paymentMethod === 'wechat' ? t('scanWithWeChat') : t('scanWithAlipay')}
            </p>

            <div className="flex justify-between items-center text-sm text-text-muted mb-4">
              <span>{t('order')}: {orderNo?.slice(-8)}</span>
              <span className={expireMinutes <= 5 ? 'text-error font-medium' : ''}>
                {expireMinutes}:00
              </span>
            </div>

            {paymentStatus === 'PAID' && (
              <div className="bg-success/20 text-success py-3 px-4 rounded-xl inline-flex items-center gap-2 animate-scale-in">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('paymentSuccessful')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderShareLinkSidebar = () => (
    <div className="w-80 flex-shrink-0">
      <div className="sticky top-24 bg-surface/80 backdrop-blur-2xl rounded-2xl border border-border p-6 animate-slide-up">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-text-muted">{t('shareYourPage')}</p>
            <p className="font-semibold text-text-primary">{t('shareLink')}</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
          <p className="text-xs text-primary font-medium">
            {generatedBlog?.id ? `Blog ID: ${generatedBlog.id}` : 'Blog will be created on publish'}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs text-text-muted mb-2">Local Preview (Port 3000)</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={localPreviewUrl || ''}
              readOnly
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-xs font-mono truncate"
            />
            <button
              onClick={handleOpenPreview}
              className="px-3 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Open
            </button>
          </div>
        </div>

        {shareUrl && (
          <div className="mb-4">
            <p className="text-xs text-text-muted mb-2">Share Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-xs font-mono truncate"
              />
              <button
                onClick={handleCopyShareLink}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  copied ? 'bg-success text-white' : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
          </div>
        )}

        {localPreviewUrl && localPreviewUrl.length < 500 && (
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-text-muted mb-3">Scan to Preview</p>
            <div className="w-32 h-32 mx-auto bg-white rounded-xl flex items-center justify-center p-2">
              <QRCodeSVG
                value={shortPreviewUrl}
                size={112}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border space-y-3">
          {onEdit && (
            <button
              onClick={() => generatedBlog && onEdit?.(generatedBlog)}
              className="w-full py-3 bg-surface border border-border text-text-primary font-medium rounded-xl hover:bg-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!generatedBlog}
            >
              {t('editYourPage') || 'Edit Your Page'}
            </button>
          )}
          <button
            onClick={() => generatedBlog && onSuccess?.(generatedBlog)}
            className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!generatedBlog}
          >
            {t('publishYourPage') || 'Publish Your Page'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-primary flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-borderLight transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">{t('generating')}</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-8 pt-24">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-8 relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-t-accent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
            </div>
            <h2 className="text-2xl font-bold mb-4 animate-fade-in">{t('creatingYourPage')}</h2>
            <p className="text-text-muted animate-fade-in stagger-1">{t('thisOnlyTakes')}</p>

            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-glow-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-borderLight transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t('preview')}</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-24 pb-12 px-8">
        <div className="max-w-6xl mx-auto flex gap-8">
          <div className="flex-1 max-w-4xl">
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-12 h-0.5 bg-border" />
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-12 h-0.5 bg-border" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>

            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-widest text-text-muted mb-3">{t('step3of3')}</p>
              <h2 className="text-fluid-lg font-bold mb-4">{t('yourPageIsReady')}</h2>
              <p className="text-text-secondary">{t('hereIsPreview')}</p>
            </div>

            <div className="rounded-3xl overflow-hidden bg-surface border border-border animate-scale-in max-w-4xl mx-auto">
              <div className="relative h-72">
                {image && (
                  <img
                    src={image}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h1 className="text-3xl font-bold">My Blog</h1>
                </div>
              </div>

              <div className="p-8">
                <p className="text-text-secondary leading-relaxed mb-6">
                  Welcome to my personal blog! This is a blog generated from your image.
                  With advanced AI technology, we extract colors, style, and atmosphere from your photo
                  to create a unique personal blog site. No coding knowledge required.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Share your story with the world. Your unique link will be ready after publishing.
                </p>

                <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template?.color || 'from-zinc-700 to-zinc-900'}`}>
                    {template?.thumbnail && (
                      <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded-xl" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">{t('template')}</p>
                    <p className="font-semibold text-text-primary">{template?.name || 'Minimal'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="px-6 py-3 border border-border text-text-secondary font-medium rounded-full hover:border-borderLight hover:text-text-primary transition-all"
              >
                {t('goBack')}
              </button>
            </div>
          </div>

          {!isPaidTemplate && renderShareLinkSidebar()}
          {isPaidTemplate && renderPaymentSidebar()}
        </div>
      </main>
    </div>
  );
}

export default Preview;
