import { useState, useEffect } from 'react'
import { useTranslation } from '../../i18n'
import { getOrderList, getOrderDetail } from '../../services/api'

function Orders() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const result = await getOrderList()
      if (result.code === 200) {
        setOrders(result.data || [])
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const viewOrderDetail = async (orderNo) => {
    try {
      const result = await getOrderDetail(orderNo)
      if (result.code === 200) {
        setSelectedOrder(result.data)
      }
    } catch (err) {
      console.error('Failed to load order detail:', err)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-500/20 text-yellow-600',
      PAYING: 'bg-blue-500/20 text-blue-600',
      PAID: 'bg-green-500/20 text-green-600',
      REFUNDING: 'bg-orange-500/20 text-orange-600',
      REFUNDED: 'bg-gray-500/20 text-gray-600',
      FAILED: 'bg-red-500/20 text-red-600',
      CANCELLED: 'bg-gray-500/20 text-gray-600',
      EXPIRED: 'bg-red-500/20 text-red-600',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-600'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-text-primary">{t('myOrders')}</h1>
          <button
            onClick={loadOrders}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-600 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">{t('noOrdersYet')}</h3>
            <p className="text-secondary">{t('yourPurchaseHistory')}</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => viewOrderDetail(order.orderNo)}
                className="bg-surface rounded-2xl p-6 border border-border cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-text-primary">{order.templateName}</p>
                    <p className="text-sm text-secondary font-mono">{order.orderNo}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {order.statusText}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-secondary">
                    <p>{formatDate(order.createTime)}</p>
                  </div>
                  <p className="text-lg font-semibold text-text-primary">¥{order.amount}</p>
                </div>

                {order.expireTime && order.status === 'PENDING' && (
                  <div className="mt-3 pt-3 border-t border-border text-sm">
                    <span className="text-secondary">{t('expiresIn')}: </span>
                    <span className="text-orange-500">{formatDate(order.expireTime)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative bg-surface rounded-3xl p-8 max-w-lg w-full border border-border shadow-xl">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-secondary hover:text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-text-primary mb-6">{t('orderDetailsTitle')}</h2>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-secondary">{t('orderNo')}</span>
                  <span className="font-mono text-sm text-text-primary">{selectedOrder.orderNo}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-secondary">{t('template')}</span>
                  <span className="text-text-primary">{selectedOrder.templateName}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-secondary">{t('amount')}</span>
                  <span className="font-semibold text-text-primary">¥{selectedOrder.amount}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-secondary">{t('status')}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.statusText}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-secondary">{t('paymentMethod')}</span>
                  <span className="capitalize text-text-primary">{selectedOrder.paymentMethod}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-secondary">{t('created')}</span>
                  <span className="text-text-primary">{formatDate(selectedOrder.createTime)}</span>
                </div>

                {selectedOrder.payTime && (
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-secondary">{t('paidAt')}</span>
                    <span className="text-text-primary">{formatDate(selectedOrder.payTime)}</span>
                  </div>
                )}

                {selectedOrder.tradeNo && (
                  <div className="py-3">
                    <span className="text-secondary block mb-1">{t('tradeNo')}</span>
                    <span className="font-mono text-sm text-muted">{selectedOrder.tradeNo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Orders
