import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateOrderRequest,
  PaymentQRCodeRequest,
  RefundRequest,
  CancelOrderRequest,
} from '@/types/api';
import type { Blog, Order, Template, GenerateBlogRequest, ShareLink } from '@/types/models';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('user-auth-change'));
    }
    return Promise.reject(error);
  }
);

// Upload image
export const uploadImage = async (file: File): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Get available templates
export const getTemplates = async (): Promise<ApiResponse<Template[]>> => {
  const response = await api.get('/templates');
  return response.data;
};

// Generate blog
export const generateBlog = async (data: GenerateBlogRequest): Promise<ApiResponse<Blog>> => {
  const response = await api.post('/generate', data);
  return response.data;
};

// Payment - create order
export const createOrder = async (
  templateId: string,
  templateName: string,
  amount: number,
  paymentMethod: string
): Promise<ApiResponse<Order>> => {
  const request: CreateOrderRequest = { templateId, templateName, amount, paymentMethod };
  const response = await api.post('/payment/create', request);
  return response.data;
};

// Payment - get QR code
export const getPaymentQRCode = async (
  orderNo: string,
  paymentMethod: string
): Promise<ApiResponse<{ qrCode: string }>> => {
  const request: PaymentQRCodeRequest = { orderNo, paymentMethod };
  const response = await api.post('/payment/qrcode', request);
  return response.data;
};

// Payment - query status
export const queryPaymentStatus = async (orderNo: string): Promise<ApiResponse<{ status: number }>> => {
  const response = await api.get(`/payment/status/${orderNo}`);
  return response.data;
};

// Refund
export const applyRefund = async (orderNo: string, reason: string): Promise<ApiResponse> => {
  const request: RefundRequest = { orderNo, reason };
  const response = await api.post('/payment/refund', request);
  return response.data;
};

// Cancel order
export const cancelOrder = async (orderNo: string): Promise<ApiResponse> => {
  const request: CancelOrderRequest = { orderNo };
  const response = await api.post('/payment/cancel', request);
  return response.data;
};

// Get order detail
export const getOrderDetail = async (orderNo: string): Promise<ApiResponse<Order>> => {
  const response = await api.get(`/payment/detail/${orderNo}`);
  return response.data;
};

// Get order list
export const getOrderList = async (): Promise<ApiResponse<Order[]>> => {
  const response = await api.get('/payment/list');
  return response.data;
};

// Process payment
export const processPayment = async (
  templateId: string,
  paymentMethod: string
): Promise<ApiResponse> => {
  const response = await api.post('/payment', { templateId, paymentMethod });
  return response.data;
};

// Get share link
export const getShareLink = async (blogId: number): Promise<ApiResponse<ShareLink>> => {
  const response = await api.get(`/share/${blogId}`);
  return response.data;
};

// Get blog by share code
export const getBlogByShareCode = async (shareCode: string): Promise<ApiResponse<Blog>> => {
  const response = await api.get(`/blog/share/${shareCode}`);
  return response.data;
};

// Create blog
export const createBlog = async (blogData: Partial<Blog>): Promise<ApiResponse<Blog>> => {
  const response = await api.post('/blog/create', blogData);
  return response.data;
};

// Get blog by ID
export const getBlogById = async (blogId: number | string): Promise<ApiResponse<Blog>> => {
  const response = await api.get(`/blog/${blogId}`);
  return response.data;
};

// Login
export const login = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post('/user/login', data);
  return response.data;
};

// Register
export const register = async (data: RegisterRequest): Promise<ApiResponse> => {
  const response = await api.post('/user/register', data);
  return response.data;
};

// Get user info
export const getUserInfo = async (): Promise<ApiResponse<{ user: import('@/types/models').User }>> => {
  const response = await api.get('/user/info');
  // Update localStorage with full user data
  if (response.data.code === 200) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data;
};

// Resend verification email
export const resendVerification = async (emailOrUsername: string): Promise<ApiResponse> => {
  const response = await api.post('/user/resend-verification', { email: emailOrUsername });
  return response.data;
};

// Verify email with token
export const verifyEmail = async (token: string): Promise<ApiResponse> => {
  const response = await api.post('/user/verify-email', null, { params: { token } });
  return response.data;
};

// Update user email
export const updateEmail = async (email: string): Promise<ApiResponse> => {
  const response = await api.put('/user/email', { email });
  return response.data;
};

// Logout
export const logout = async (): Promise<void> => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get user credits balance
export const getCredits = async (): Promise<number> => {
  const response = await api.get('/user/credits');
  return response.data.data || 0;
};

// Credit top-up
export const createCreditTopup = async (credits: number) => {
  const response = await api.post('/credit/topup', { credits });
  return response.data.data;
};

// PDF Export
export const requestPdfPreview = async (blogId: number): Promise<{ jobId: string; previewUrl: string }> => {
  const response = await api.post(`/pdf/preview/${blogId}`);
  return response.data.data;
};

export const exportPdf = async (blogId: number): Promise<{ jobId: string; creditCost: number }> => {
  const response = await api.post(`/pdf/export/${blogId}`);
  return response.data.data;
};

export const getPdfJobStatus = async (jobId: string): Promise<{ status: string; downloadUrl?: string }> => {
  const response = await api.get(`/pdf/job/${jobId}`);
  return response.data.data;
};

// SEO types
export interface SeoData {
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * Update SEO settings for a blog.
 * PUT /api/blog/{id}/seo
 * SEO-01
 */
export const updateBlogSeo = async (blogId: number, seoData: SeoData): Promise<void> => {
  const response = await api.put(`/blog/${blogId}/seo`, seoData);
  return response.data;
};

/**
 * Get blog SEO settings.
 * GET /api/blog/{id}
 * SEO-01
 */
export const getBlogSeo = async (blogId: number): Promise<SeoData> => {
  const response = await api.get(`/blog/${blogId}`);
  const blog = response.data.data;
  return {
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
  };
};

/**
 * Update user robots.txt content.
 * PUT /api/user/robots
 * SEO-03
 */
export const updateRobotsTxt = async (robotsTxt: string): Promise<void> => {
  const response = await api.put('/user/robots', { robotsTxt });
  return response.data;
};

// Analytics types
export interface RefererSource {
  source: 'Direct' | 'Search Engine' | 'Social' | 'Referral' | 'Other';
  displayName: string;
  pageViews: number;
  percentage: number;
}

export interface AnalyticsData {
  blogId: number;
  blogTitle: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
  dailyStats: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }>;
  refererSources: RefererSource[];
}

// Get user analytics
export const getUserAnalytics = async (period: string = '7d'): Promise<ApiResponse<AnalyticsData[]>> => {
  const response = await api.get('/analytics', { params: { period } });
  return response.data;
};

// Get blog analytics
export const getBlogAnalytics = async (blogId: number, period: string = '7d'): Promise<ApiResponse<AnalyticsData>> => {
  const response = await api.get(`/analytics/blog/${blogId}`, { params: { period } });
  return response.data;
};

export default api;
