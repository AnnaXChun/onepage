import api from './api';
import type { ApiResponse } from '@/types/api';

export interface BlogSummary {
  id: number;
  title: string;
  coverImage: string | null;
  shareCode: string;
  publishTime: string;
  featured: boolean;
}

export interface ProfileData {
  username: string;
  avatar: string | null;
  bio: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  vipStatus: boolean;
  vipExpireTime: string | null;
  blogs: BlogSummary[];
  totalVisitors: number;
}

export const fetchProfile = async (username: string): Promise<ApiResponse<ProfileData>> => {
  const response = await api.get(`/user/profile/${encodeURIComponent(username)}`);
  return response.data;
};