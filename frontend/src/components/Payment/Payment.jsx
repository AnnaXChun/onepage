import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../../i18n'
import { createOrder, getPaymentQRCode, queryPaymentStatus, getOrderDetail, getUserInfo } from '../../services/api'

function Payment({ template, onSuccess, onBack }) {
  const { t } = useTranslation()
  const [paymentMethod, setPaymentMethod] = useState('wechat')
  const [processing, setProcessing] = useState(false)
  const [orderNo, setOrderNo] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [expireMinutes, setExpireMinutes] = useState(30)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [error, setError] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const pollRef = useRef(null)

  const handleInitPayment = async () => {
    try {
      setProcessing(true)
      setError(null)

      const createResult = await createOrder(
        template.id,
        template.name,
        template.price,
        paymentMethod
      )

      if (createResult.code !== 200) {
        setError(createResult.message || t('createOrderFailed'))
        setProcessing(false)
        return
      }

      const order = createResult.data
      setOrderNo(order.orderNo)
      setOrderDetail(order)

      const qrResult = await getPaymentQRCode(order.orderNo, paymentMethod)

      if (qrResult.code === 200) {
        setQrCodeUrl(qrResult.data?.qrcodeUrl)
        setExpireMinutes(qrResult.data?.expireMinutes || 30)
        startPolling(order.orderNo)
      } else {
        setError(qrResult.message || t('getQRCodeFailed'))
        setProcessing(false)
      }
    } catch (err) {
      console.error(t('paymentInitFailed'), err)
      setError(err.message || t('paymentInitFailedRetry'))
      setProcessing(false)
    }
  }

  const startPolling = (orderNo) => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }

    pollRef.current = setInterval(async () => {
      try {
        const statusResult = await queryPaymentStatus(orderNo)

        if (statusResult.code === 200) {
          const status = statusResult.data?.status
          setPaymentStatus(status)
          setExpireMinutes(statusResult.data?.expireMinutes || 0)

          if (status === 'PAID') {
            clearInterval(pollRef.current)
            pollRef.current = null
            const detailResult = await getOrderDetail(orderNo)
            if (detailResult.code === 200) {
              setOrderDetail(detailResult.data)
            }
            // Refresh user context so VIP status and credits balance are updated
            try {
              const userInfoResult = await getUserInfo()
              if (userInfoResult.code === 200 && userInfoResult.data) {
                // Update localStorage with fresh user data
                localStorage.setItem('user', JSON.stringify(userInfoResult.data))
                window.dispatchEvent(new Event('user-auth-change'))
              }
            } catch (err) {
              console.error('Failed to refresh user context:', err)
            }
            setTimeout(() => onSuccess(), 1500)
          } else if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'FAILED') {
            clearInterval(pollRef.current)
            pollRef.current = null
            setError(t('paymentCancelledOrExpired'))
          }
        }
      } catch (err) {
        console.error(t('queryPaymentStatusFailed'), err)
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  const handlePay = async () => {
    if (!orderNo) {
      await handleInitPayment()
    }
  }

  const handleRetry = () => {
    setOrderNo(null)
    setQrCodeUrl(null)
    setPaymentStatus(null)
    setError(null)
    setProcessing(false)
  }

  const paymentMethods = [
    {
      id: 'wechat',
      name: t('weChatPay'),
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.89.31 1.87.5 2.91.5.34 0 .67-.02 1-.05-.1-.32-.2-.67-.2-1.05 0-1.54.91-2.79 2.16-3.22-.29-.45-.46-.99-.46-1.58 0-1.34 1.26-2.2 2.91-2.2.18 0 .35.01.53.03C14.16 5.32 11.97 4 9.5 4z"/>
        </svg>
      ),
    },
    {
      id: 'alipay',
      name: t('alipay'),
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.3 8.5c-.3.6-.9 1.1-1.7 1.4-.5.2-1 .3-1.5.3H8.5c-.6 0-1.1-.1-1.5-.3-.8-.3-1.4-.8-1.7-1.4-.3-.5-.4-1.1-.4-1.7 0-1.5 1.3-2.5 3.4-2.8 1.7-.2 3.3.3 4.3 1.2.9-.9 2.4-1.4 4-1.2 2 .3 3.4 1.3 3.4 2.8 0 .6-.1 1.2-.4 1.7zM8.5 13c-.5 0-1 .4-1 1s.5 1 1 1 1-.4 1-1-.5-1-1-1zm7 0c-.5 0-1 .4-1 1s.5 1 1 1 1-.4 1-1-.5-1-1-1z"/>
        </svg>
      ),
    },
  ]

  const renderQRCode = () => (
    <div className="text-center animate-fade-in">
      <div className="mb-6">
        {qrCodeUrl && (
          <div className="relative inline-block">
            <div className="w-56 h-56 bg-white mx-auto rounded-2xl flex items-center justify-center p-4 shadow-2xl">
              {paymentMethod === 'wechat' ? (
                <div className="text-background text-center">
                  <svg className="w-28 h-28 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.89.31 1.87.5 2.91.5.34 0 .67-.02 1-.05-.1-.32-.2-.67-.2-1.05 0-1.54.91-2.79 2.16-3.22-.29-.45-.46-.99-.46-1.58 0-1.34 1.26-2.2 2.91-2.2.18 0 .35.01.53.03C14.16 5.32 11.97 4 9.5 4z"/>
                  </svg>
                  <p className="text-xs text-gray-500">{t('weChatScanToPay')}</p>
                </div>
              ) : (
                <div className="text-background text-center">
                  <svg className="w-28 h-28 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.3 8.5c-.3.6-.9 1.1-1.7 1.4-.5.2-1 .3-1.5.3H8.5c-.6 0-1.1-.1-1.5-.3-.8-.3-1.4-.8-1.7-1.4-.3-.5-.4-1.1-.4-1.7 0-1.5 1.3-2.5 3.4-2.8 1.7-.2 3.3.3 4.3 1.2.9-.9 2.4-1.4 4-1.2 2 .3 3.4 1.3 3.4 2.8 0 .6-.1 1.2-.4 1.7z"/>
                  </svg>
                  <p className="text-xs text-gray-500">{t('alipayScanToPay')}</p>
                </div>
              )}
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl -z-10" />

            {expireMinutes <= 5 && expireMinutes > 0 && (
              <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center">
                <p className="text-error font-medium">{t('expiringSoon')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-secondary text-sm mb-4">
        {paymentMethod === 'wechat' ? t('scanWithWeChat') : t('scanWithAlipay')}
      </p>

      <div className="flex justify-between items-center text-sm text-muted mb-6">
        <span>{t('order')}: {orderNo?.slice(-8)}</span>
        <span className={expireMinutes <= 5 ? 'text-error font-medium' : ''}>
          {t('expiresIn')}: {expireMinutes}:00
        </span>
      </div>

      {paymentStatus === 'PAID' && (
        <div className="bg-success/20 text-success py-3 px-6 rounded-full inline-flex items-center gap-2 animate-scale-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('paymentSuccessful')}
        </div>
      )}

      {orderDetail && (
        <div className="mt-6 bg-surface rounded-xl p-4 text-left border border-border">
          <h4 className="text-sm font-medium text-muted mb-3">{t('orderDetails')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t('template')}</span>
              <span className="text-primary">{orderDetail.templateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('amount')}</span>
              <span className="text-primary font-semibold">${orderDetail.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('status')}</span>
              <span className="text-success">{orderDetail.statusText}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => {
              if (pollRef.current) {
                clearInterval(pollRef.current)
              }
              onBack()
            }}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary hover:text-primary hover:border-borderLight transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t('checkout')}</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 pt-24 pb-12">
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-6 bg-error/20 border border-error/30 text-error px-4 py-3 rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <div className="text-center mb-8 animate-slide-up">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden bg-surface border border-border">
              {template?.thumbnail && (
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{template?.name} {t('template')}</h2>
            <p className="text-muted">{t('premiumTemplate')}</p>
          </div>

          {!orderNo && (
            <div className="bg-surface rounded-3xl p-8 border border-border animate-slide-up stagger-1">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-border">
                <span className="text-secondary">{t('total')}</span>
                <span className="text-3xl font-bold">${template?.price || 0}</span>
              </div>

              <div className="mb-8">
                <p className="text-sm text-muted mb-4">{t('selectPaymentMethod')}</p>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      disabled={processing}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 ${
                        paymentMethod === method.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-borderLight'
                      }`}
                    >
                      <div className="text-secondary">{method.icon}</div>
                      <span className="font-medium text-primary">{method.name}</span>
                      {paymentMethod === method.id && (
                        <svg className="w-5 h-5 ml-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={processing}
                className="group w-full py-4 bg-primary text-text-primary-btn font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
                    `${t('pay')} $${template?.price || 0}`
                  )}
                </span>
              </button>
            </div>
          )}

          {orderNo && renderQRCode()}

          {orderNo && (paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') && (
            <button
              onClick={handleRetry}
              className="w-full mt-6 py-4 bg-primary text-text-primary-btn font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              {t('tryAgain')}
            </button>
          )}

          {orderNo && paymentStatus !== 'PAID' && (
            <button
              onClick={() => {
                if (pollRef.current) {
                  clearInterval(pollRef.current)
                }
                onBack()
              }}
              className="w-full mt-4 py-3 text-muted hover:text-primary transition-colors"
            >
              {t('cancelAndGoBack')}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

export default Payment
