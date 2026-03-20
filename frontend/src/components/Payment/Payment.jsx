import { useState, useEffect, useRef } from 'react'
import { createOrder, getPaymentQRCode, queryPaymentStatus, getOrderDetail } from '../../services/api'

function Payment({ template, onSuccess, onBack }) {
  const [paymentMethod, setPaymentMethod] = useState('wechat')
  const [processing, setProcessing] = useState(false)
  const [orderNo, setOrderNo] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [expireMinutes, setExpireMinutes] = useState(30)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [error, setError] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const pollRef = useRef(null)

  // 创建订单
  const handleInitPayment = async () => {
    try {
      setProcessing(true)
      setError(null)

      // 1. 创建订单
      const createResult = await createOrder(
        template.id,
        template.name,
        template.price,
        paymentMethod
      )

      if (!createResult.success) {
        setError(createResult.message || '创建订单失败')
        setProcessing(false)
        return
      }

      const order = createResult.data
      setOrderNo(order.orderNo)
      setOrderDetail(order)

      // 2. 获取支付二维码
      const qrResult = await getPaymentQRCode(order.orderNo, paymentMethod)

      if (qrResult.success) {
        setQrCodeUrl(qrResult.data.qrcodeUrl)
        setExpireMinutes(qrResult.data.expireMinutes || 30)

        // 3. 开始轮询支付状态
        startPolling(order.orderNo)
      } else {
        setError(qrResult.message || '获取支付码失败')
        setProcessing(false)
      }
    } catch (err) {
      console.error('支付初始化失败:', err)
      setError(err.message || '支付初始化失败，请重试')
      setProcessing(false)
    }
  }

  // 轮询支付状态
  const startPolling = (orderNo) => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }

    pollRef.current = setInterval(async () => {
      try {
        const statusResult = await queryPaymentStatus(orderNo)

        if (statusResult.success) {
          const status = statusResult.data.status
          setPaymentStatus(status)
          setExpireMinutes(statusResult.data.expireMinutes || 0)

          if (status === 'PAID') {
            // 支付成功
            clearInterval(pollRef.current)
            pollRef.current = null
            // 获取完整订单详情
            const detailResult = await getOrderDetail(orderNo)
            if (detailResult.success) {
              setOrderDetail(detailResult.data)
            }
            setTimeout(() => onSuccess(), 1500)
          } else if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'FAILED') {
            // 支付失败/取消/过期
            clearInterval(pollRef.current)
            pollRef.current = null
            setError('支付已取消或过期')
          }
        }
      } catch (err) {
        console.error('查询支付状态失败:', err)
      }
    }, 2000)
  }

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  // 处理支付
  const handlePay = async () => {
    if (!orderNo) {
      await handleInitPayment()
    }
  }

  // 重新发起支付
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
      name: 'WeChat Pay',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.89.31 1.87.5 2.91.5.34 0 .67-.02 1-.05-.1-.32-.2-.67-.2-1.05 0-1.54.91-2.79 2.16-3.22-.29-.45-.46-.99-.46-1.58 0-1.34 1.26-2.2 2.91-2.2.18 0 .35.01.53.03C14.16 5.32 11.97 4 9.5 4zm-5 3c.83 0 1.5.67 1.5 1.5S5.33 10 4.5 10 3 9.33 3 8.5 3.67 7 4.5 7zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm4.5 1c-1.1 0-2 .67-2 1.5s.9 1.5 2 1.5 2-.67 2-1.5-.9-1.5-2-1.5z"/>
        </svg>
      ),
    },
    {
      id: 'alipay',
      name: 'Alipay',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.3 8.5c-.3.6-.9 1.1-1.7 1.4-.5.2-1 .3-1.5.3H8.5c-.6 0-1.1-.1-1.5-.3-.8-.3-1.4-.8-1.7-1.4-.3-.5-.4-1.1-.4-1.7 0-1.5 1.3-2.5 3.4-2.8 1.7-.2 3.3.3 4.3 1.2.9-.9 2.4-1.4 4-1.2 2 .3 3.4 1.3 3.4 2.8 0 .6-.1 1.2-.4 1.7zM8.5 13c-.5 0-1 .4-1 1s.5 1 1 1 1-.4 1-1-.5-1-1-1zm7 0c-.5 0-1 .4-1 1s.5 1 1 1 1-.4 1-1-.5-1-1-1z"/>
        </svg>
      ),
    },
  ]

  // 渲染二维码展示
  const renderQRCode = () => (
    <div className="text-center">
      <div className="mb-4">
        {qrCodeUrl && (
          <div className="relative inline-block">
            {/* 模拟二维码展示 */}
            <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center">
              {paymentMethod === 'wechat' ? (
                <div className="text-black text-center p-4">
                  <svg className="w-24 h-24 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.89.31 1.87.5 2.91.5.34 0 .67-.02 1-.05-.1-.32-.2-.67-.2-1.05 0-1.54.91-2.79 2.16-3.22-.29-.45-.46-.99-.46-1.58 0-1.34 1.26-2.2 2.91-2.2.18 0 .35.01.53.03C14.16 5.32 11.97 4 9.5 4z"/>
                  </svg>
                  <p className="text-xs text-gray-500">WeChat Scan to Pay</p>
                </div>
              ) : (
                <div className="text-black text-center p-4">
                  <svg className="w-24 h-24 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.3 8.5c-.3.6-.9 1.1-1.7 1.4-.5.2-1 .3-1.5.3H8.5c-.6 0-1.1-.1-1.5-.3-.8-.3-1.4-.8-1.7-1.4-.3-.5-.4-1.1-.4-1.7 0-1.5 1.3-2.5 3.4-2.8 1.7-.2 3.3.3 4.3 1.2.9-.9 2.4-1.4 4-1.2 2 .3 3.4 1.3 3.4 2.8 0 .6-.1 1.2-.4 1.7z"/>
                  </svg>
                  <p className="text-xs text-gray-500">Alipay Scan to Pay</p>
                </div>
              )}
            </div>
            {/* 超时提示 */}
            {expireMinutes <= 5 && expireMinutes > 0 && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <p className="text-red-400 font-medium">Expiring soon</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-400 text-sm mb-4">
        {paymentMethod === 'wechat' ? 'Scan with WeChat to pay' : 'Scan with Alipay to pay'}
      </p>

      <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
        <span>Order: {orderNo}</span>
        <span className={expireMinutes <= 5 ? 'text-red-400' : ''}>
          Expires in: {expireMinutes}:00
        </span>
      </div>

      {/* 支付状态 */}
      {paymentStatus === 'PAID' && (
        <div className="bg-green-500/20 text-green-400 py-3 px-6 rounded-full inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Payment Successful!
        </div>
      )}

      {/* 订单详情 */}
      {orderDetail && (
        <div className="mt-6 bg-zinc-800/50 rounded-xl p-4 text-left">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Order Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Template</span>
              <span>{orderDetail.templateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span>${orderDetail.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="text-green-400">{orderDetail.statusText}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => {
              if (pollRef.current) {
                clearInterval(pollRef.current)
              }
              onBack()
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Checkout</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-md">
          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* 订单信息 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden bg-zinc-800">
              {template?.thumbnail && (
                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{template?.name} Template</h2>
            <p className="text-gray-500">Premium template purchase</p>
          </div>

          {/* 未发起支付时显示支付选项 */}
          {!orderNo && (
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
                      disabled={processing}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
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
          )}

          {/* 发起支付后显示二维码 */}
          {orderNo && renderQRCode()}

          {/* 重新支付按钮 */}
          {orderNo && (paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') && (
            <button
              onClick={handleRetry}
              className="w-full mt-6 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300"
            >
              Try Again
            </button>
          )}

          {/* 返回按钮 */}
          {orderNo && paymentStatus !== 'PAID' && (
            <button
              onClick={() => {
                if (pollRef.current) {
                  clearInterval(pollRef.current)
                }
                onBack()
              }}
              className="w-full mt-4 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Cancel and go back
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

export default Payment
