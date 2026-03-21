// API Response wrapper
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: import('./models').User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Payment types
export interface CreateOrderRequest {
  templateId: string;
  templateName: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentQRCodeRequest {
  orderNo: string;
  paymentMethod: string;
}

export interface RefundRequest {
  orderNo: string;
  reason: string;
}

export interface CancelOrderRequest {
  orderNo: string;
}
