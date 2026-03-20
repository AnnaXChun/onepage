import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 上传图片
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// 获取可用模板
export const getTemplates = async () => {
  const response = await api.get('/templates')
  return response.data
}

// 生成博客
export const generateBlog = async (data) => {
  const response = await api.post('/generate', data)
  return response.data
}

// 支付 - 创建订单
export const createOrder = async (templateId, templateName, amount, paymentMethod) => {
  const response = await api.post('/payment/create', {
    templateId,
    templateName,
    amount,
    paymentMethod,
  })
  return response.data
}

// 支付 - 获取二维码
export const getPaymentQRCode = async (orderNo, paymentMethod) => {
  const response = await api.post('/payment/qrcode', {
    orderNo,
    paymentMethod,
  })
  return response.data
}

// 支付 - 查询状态
export const queryPaymentStatus = async (orderNo) => {
  const response = await api.get(`/payment/status/${orderNo}`)
  return response.data
}

// 退款
export const applyRefund = async (orderNo, reason) => {
  const response = await api.post('/payment/refund', { orderNo, reason })
  return response.data
}

// 取消订单
export const cancelOrder = async (orderNo) => {
  const response = await api.post('/payment/cancel', { orderNo })
  return response.data
}

// 获取订单详情
export const getOrderDetail = async (orderNo) => {
  const response = await api.get(`/payment/detail/${orderNo}`)
  return response.data
}

// 获取订单列表
export const getOrderList = async () => {
  const response = await api.get('/payment/list')
  return response.data
}

// 支付
export const processPayment = async (templateId, paymentMethod) => {
  const response = await api.post('/payment', { templateId, paymentMethod })
  return response.data
}

// 获取分享链接
export const getShareLink = async (blogId) => {
  const response = await api.get(`/share/${blogId}`)
  return response.data
}

// 获取博客内容 by shareCode
export const getBlogByShareCode = async (shareCode) => {
  const response = await api.get(`/blog/share/${shareCode}`)
  return response.data
}

// 创建博客
export const createBlog = async (blogData) => {
  const response = await api.post('/blog/create', blogData)
  return response.data
}

export default api
