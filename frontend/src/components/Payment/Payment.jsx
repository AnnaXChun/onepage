import { useState } from 'react'

function Payment({ template, onSuccess, onBack }) {
  const [paymentMethod, setPaymentMethod] = useState('alipay')
  const [processing, setProcessing] = useState(false)

  const handlePay = () => {
    setProcessing(true)
    // Simulate payment
    setTimeout(() => {
      onSuccess()
    }, 1500)
  }

  const paymentMethods = [
    {
      id: 'alipay',
      name: 'Alipay',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 2C6.72 2 2 6.72 2 12.5S6.72 23 12.5 23 23 18.28 23 12.5 18.28 2 12.5 2zm0 4c3.03 0 5.5 2.47 5.5 5.5 0 1.6-.7 3.03-1.8 4.01L20 18H4l3.3-6.49C6.2 10.53 5.5 9.1 5.5 7.5 5.5 4.47 8.47 4 12.5 4z"/>
        </svg>
      ),
    },
    {
      id: 'wechat',
      name: 'WeChat',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 11c-.83 0-1.5.67-1.5 1.5S7.67 14 8.5 14s1.5-.67 1.5-1.5S9.33 11 8.5 11zm7 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.18 1.88 5.82L2 22l4.18-1.88C7.82 21.31 9.83 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Upgrade</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden bg-zinc-800">
              {template?.thumbnail && (
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{template?.name} Template</h2>
            <p className="text-gray-500">Unlock premium features</p>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-800">
              <span className="text-gray-400">Total</span>
              <span className="text-3xl font-bold">${template?.price || 0}</span>
            </div>

            {/* Payment methods */}
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-4">Select payment method</p>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-white bg-white/10'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <div className="text-gray-400">{method.icon}</div>
                    <span className="font-medium">{method.name}</span>
                    {paymentMethod === method.id && (
                      <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay $${template?.price || 0}`
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Payment
