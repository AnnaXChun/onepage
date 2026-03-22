import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { createCreditTopup } from '../../services/api';

const PACKAGES = [
  { credits: 10, price: 10, name: '10 Credits' },
  { credits: 50, price: 45, name: '50 Credits (10% off)' },
  { credits: 100, price: 80, name: '100 Credits (20% off)' },
];

export default function CreditTopup() {
  const { t } = useTranslation();
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTopup = async () => {
    setLoading(true);
    try {
      const result = await createCreditTopup(selectedPackage.credits);
      setQrcodeUrl(result.qrcodeUrl);
      setOrderNo(result.orderNo);
    } catch (error) {
      console.error('Failed to create topup order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center">
          <h1 className="text-lg font-semibold text-text-primary">{t('creditTopup') || 'Credit Top-up'}</h1>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-6">{t('selectCredits') || 'Select Credits Package'}</h2>

          {!qrcodeUrl ? (
            <div className="grid gap-4">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.credits}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-xl border-2 text-left transition-all btn-hover ${
                    selectedPackage.credits === pkg.credits
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-borderLight bg-surface'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text-primary">{pkg.name}</span>
                    <span className="text-lg font-bold text-text-primary">¥{pkg.price}</span>
                  </div>
                </button>
              ))}
              <button
                onClick={handleTopup}
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold btn-hover disabled:opacity-50"
              >
                {loading ? (t('creatingOrder') || 'Creating Order...') : `${t('pay')} ¥${selectedPackage.price} ${t('for')} ${selectedPackage.credits} ${t('credits')}`}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('scanToPay') || 'Scan QR Code to Pay'}</h2>
              <div className="bg-white p-4 rounded-xl inline-block shadow-md">
                {qrcodeUrl && (
                  <img src={qrcodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                )}
              </div>
              <p className="text-secondary mt-4">{t('order')}: {orderNo}</p>
              <p className="text-sm text-muted mt-2">{t('creditsAutoAdded') || 'Credits will be added automatically after payment'}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
