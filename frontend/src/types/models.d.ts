export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  status: number;
}

export interface Blog {
  id: number;
  userId: number;
  title: string;
  content?: string;
  coverImage?: string;
  templateId: string;
  shareCode: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  templateId?: string;
  templateName?: string;
  amount: number;
  paymentMethod?: string;
  status: number;
  createdAt: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  category: number;
  price: number;
}

export interface GenerateBlogRequest {
  image: string;
  templateId: string;
  title?: string;
}

export interface ShareLink {
  url: string;
  shareCode: string;
}
