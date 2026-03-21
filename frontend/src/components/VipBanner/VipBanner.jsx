import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function VipBanner() {
  const { user } = useAuth();

  if (!user || user.vipStatus) {
    return null;
  }

  return (
    <div className="bg-[#8B5CF6] text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-300">VIP</span>
          <span className="text-sm">
            Upgrade to access all templates for just 10 RMB/month
          </span>
        </div>
        <button
          onClick={() => window.location.href = '/payment/vip'}
          className="bg-white text-purple-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );
}