import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function BalanceDisplay() {
  const { token } = useAuth();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchBalance();
    }
  }, [token]);

  const fetchBalance = async () => {
    try {
      const response = await axios.get('/api/pdf/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.data || '0');
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !token) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">Credits:</span>
      <span className="font-medium text-gray-900">{balance}</span>
      <button
        onClick={() => window.location.href = '/payment/credits'}
        className="text-indigo-600 hover:text-indigo-700 text-xs"
      >
        Buy More
      </button>
    </div>
  );
}