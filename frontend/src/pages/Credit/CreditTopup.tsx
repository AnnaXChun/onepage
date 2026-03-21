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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Credit Top-up</h1>

      {!qrcodeUrl ? (
        <div className="grid gap-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.credits}
              onClick={() => setSelectedPackage(pkg)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedPackage.credits === pkg.credits
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-borderLight'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{pkg.name}</span>
                <span className="text-lg font-bold">¥{pkg.price}</span>
              </div>
            </button>
          ))}
          <button
            onClick={handleTopup}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating Order...' : `Pay ¥${selectedPackage.price} for ${selectedPackage.credits} Credits`}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-4">Scan QR Code to Pay</h2>
          <div className="bg-white p-4 rounded-xl inline-block">
            {qrcodeUrl && (
              <img src={qrcodeUrl} alt="Payment QR Code" className="w-48 h-48" />
            )}
          </div>
          <p className="text-muted mt-4">Order: {orderNo}</p>
          <p className="text-sm text-muted mt-2">Credits will be added automatically after payment</p>
        </div>
      )}
    </div>
  );
}
