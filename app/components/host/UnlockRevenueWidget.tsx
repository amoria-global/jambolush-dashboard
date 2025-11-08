"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/app/api/apiService';
import { HostUnlockAnalytics } from '@/app/types/addressUnlock';
import { formatCurrency } from '@/app/services/addressUnlockService';

const UnlockRevenueWidget = () => {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<HostUnlockAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnlockAnalytics();
  }, []);

  const loadUnlockAnalytics = async () => {
    try {
      const response = await api.get('/properties/host/unlock-analytics?range=month');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error loading unlock analytics:', error);
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

  if (!analytics || analytics.totalUnlocks === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#083A85] to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="bi bi-graph-up-arrow text-white text-xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Address Unlock Revenue
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Earn additional income when guests unlock your property addresses
            </p>
            <div className="text-xs text-gray-500">
              No unlocks yet - promote your properties to start earning!
            </div>
          </div>
        </div>
      </div>
    );
  }

  const appreciationRate = analytics.totalUnlocks > 0
    ? Math.round((analytics.appreciationStats.appreciated / analytics.totalUnlocks) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-[#083A85] to-blue-600 p-6">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-bold mb-1">Unlock Revenue</h3>
            <p className="text-white/90 text-sm">This month's performance</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <i className="bi bi-cash-stack text-2xl"></i>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-green-700 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.revenue.total, analytics.revenue.currency as any || 'RWF')}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i className="bi bi-graph-up text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900">{analytics.totalUnlocks}</div>
            <div className="text-xs text-gray-500 mt-1">Total Unlocks</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-green-600">{appreciationRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Satisfied</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900">
              {analytics.topUnlockedProperties?.length || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Properties</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Revenue Breakdown</div>

          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#F20C8F] rounded-full"></div>
              <span className="text-sm text-gray-700">Non-Refundable</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(analytics.revenue.nonRefundable, analytics.revenue.currency as any || 'RWF')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#083A85] rounded-full"></div>
              <span className="text-sm text-gray-700">30% Booking</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(analytics.revenue.monthlyBooking, analytics.revenue.currency as any || 'RWF')}
            </span>
          </div>
        </div>

        {/* Top Property */}
        {analytics.topUnlockedProperties && analytics.topUnlockedProperties.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <i className="bi bi-star-fill text-amber-500"></i>
              <span className="text-xs font-medium text-amber-700">Top Property</span>
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {analytics.topUnlockedProperties[0].title}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-600">
                {analytics.topUnlockedProperties[0].unlockCount} unlocks
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(analytics.topUnlockedProperties[0].revenue, analytics.revenue.currency as any || 'RWF')}
              </span>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {analytics.recentUnlocks && analytics.recentUnlocks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">Recent Unlocks</div>
            {analytics.recentUnlocks.slice(0, 2).map((unlock) => (
              <div
                key={unlock.id}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#F20C8F] to-rose-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-unlock-fill text-white text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {unlock.propertyTitle}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(unlock.amountPaid, unlock.currency as any)}
                  </div>
                </div>
                {unlock.appreciationSubmitted && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <i className="bi bi-check-circle-fill mr-1"></i>
                      Feedback
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => router.push('/pages/host/unlock-analytics')}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-[#083A85] to-blue-600 hover:from-[#F20C8F] hover:to-rose-400 text-white font-medium rounded-xl transition-all duration-300"
        >
          View Full Analytics
          <i className="bi bi-arrow-right ml-2"></i>
        </button>
      </div>
    </motion.div>
  );
};

export default UnlockRevenueWidget;
