"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/app/api/apiService';
import { GuestUnlockStats } from '@/app/types/addressUnlock';
import { formatCurrency } from '@/app/services/addressUnlockService';

const UnlockStatsWidget = () => {
  const router = useRouter();
  const [stats, setStats] = useState<GuestUnlockStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnlockStats();
  }, []);

  const loadUnlockStats = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('userSession') || '{}');
      const response = await api.getUserUnlockHistory(user.id);
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading unlock stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalUnlocked === 0) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-pink-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#F20C8F] to-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="bi bi-unlock-fill text-white text-xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Unlock Property Addresses
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get full access to property addresses and host contact information
            </p>
            <button
              onClick={() => router.push('/spaces')}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#F20C8F] to-rose-400 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
            >
              Browse Properties
              <i className="bi bi-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-[#F20C8F] to-rose-400 p-6">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-bold mb-1">Address Unlocks</h3>
            <p className="text-white/90 text-sm">Your unlocked properties</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <i className="bi bi-unlock-fill text-2xl"></i>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalUnlocked}</div>
            <div className="text-xs text-gray-500 mt-1">Unlocked</div>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.activeDealCodes}</div>
            <div className="text-xs text-gray-500 mt-1">Deal Codes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(stats.totalSpent, stats.currency as any || 'RWF').replace(' RWF', '')}
            </div>
            <div className="text-xs text-gray-500 mt-1">Spent</div>
          </div>
        </div>

        {/* Recent Unlocks Preview */}
        {stats.recentUnlocks && stats.recentUnlocks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">Recent Unlocks</div>
            {stats.recentUnlocks.slice(0, 2).map((unlock) => (
              <div
                key={unlock.id}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                onClick={() => router.push(`/spaces/${unlock.propertyId}`)}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={unlock.propertyImage || '/placeholder-property.jpg'}
                    alt={unlock.propertyTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {unlock.propertyTitle}
                  </div>
                  <div className="text-xs text-gray-500">
                    {unlock.address.city}, {unlock.address.country}
                  </div>
                </div>
                <i className="bi bi-chevron-right text-gray-400"></i>
              </div>
            ))}
          </div>
        )}

        {/* Active Deal Code */}
        {stats.dealCodes && stats.dealCodes.length > 0 && stats.dealCodes[0].isActive && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700">Active Deal Code</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                {stats.dealCodes[0].remainingUnlocks} left
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-gray-900">
              {stats.dealCodes[0].code}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => router.push('/pages/guest/unlock-history')}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
          >
            <i className="bi bi-clock-history mr-2"></i>
            History
          </button>
          <button
            onClick={() => router.push('/spaces')}
            className="px-4 py-2.5 bg-gradient-to-r from-[#083A85] to-blue-600 hover:from-[#F20C8F] hover:to-rose-400 text-white font-medium rounded-xl transition-all duration-300 text-sm"
          >
            <i className="bi bi-search mr-2"></i>
            Browse
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default UnlockStatsWidget;
