"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '@/app/api/apiService';
import type { HostUnlockAnalytics, UnlockHistoryEntry } from '@/app/types/addressUnlock';
import { formatCurrency, formatDateTime, getTimeAgo } from '@/app/services/addressUnlockService';

const HostUnlockAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<HostUnlockAnalytics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch host unlock requests (privacy-first): GET /api/properties/host/unlock-requests
      const response: any = await api.getHostUnlockRequests();

      if (response.data && response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const appreciationColors = {
    appreciated: '#10B981',
    neutral: '#F59E0B',
    notAppreciated: '#EF4444',
  };

  const appreciationData = analytics?.appreciationStats ? [
    { name: 'Appreciated', value: analytics.appreciationStats.appreciated, color: appreciationColors.appreciated },
    { name: 'Neutral', value: analytics.appreciationStats.neutral, color: appreciationColors.neutral },
    { name: 'Not Appreciated', value: analytics.appreciationStats.notAppreciated, color: appreciationColors.notAppreciated },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#F20C8F] animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Address Unlock Analytics
              </h1>
              <p className="text-sm text-gray-600">
                Track your property unlocks and guest engagement
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex gap-2 bg-white rounded-xl p-2 shadow-sm">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range as any)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all duration-300 ${
                    selectedTimeRange === range
                      ? 'bg-gradient-to-r from-[#F20C8F] to-rose-400 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#F20C8F] to-rose-400 rounded-xl shadow-lg">
                <i className="bi bi-unlock-fill text-white text-2xl"></i>
              </div>
              <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <i className="bi bi-arrow-up-short mr-0.5"></i>
                +12%
              </span>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Total Unlocks</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics?.totalUnlocks || 0}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#083A85] to-blue-600 rounded-xl shadow-lg">
                <i className="bi bi-people-fill text-white text-2xl"></i>
              </div>
              <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <i className="bi bi-arrow-up-short mr-0.5"></i>
                +8%
              </span>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Total Requests</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.totalUnlocks || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Address requests</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl shadow-lg">
                <i className="bi bi-hand-thumbs-up-fill text-white text-2xl"></i>
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Appreciation Rate</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.appreciationStats
                ? Math.round((analytics.appreciationStats.appreciated / analytics.totalUnlocks) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Guest satisfaction</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl shadow-lg">
                <i className="bi bi-star-fill text-white text-2xl"></i>
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 mb-1">Top Property</h3>
            <p className="text-base font-bold text-gray-900 truncate">
              {analytics?.topUnlockedProperties?.[0]?.title || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics?.topUnlockedProperties?.[0]?.unlockCount || 0} unlocks
            </p>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Request Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Request Summary</h3>
                <p className="text-xs text-gray-500 mt-1">Address unlock requests</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Requests</span>
                  <i className="bi bi-envelope-fill text-[#F20C8F]"></i>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalUnlocks || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Contact Requests</span>
                  <i className="bi bi-telephone-fill text-[#083A85]"></i>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.totalUnlocks || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Guests contacted</p>
              </div>
            </div>
          </motion.div>

          {/* Appreciation Feedback */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Guest Feedback</h3>
                <p className="text-sm text-gray-500 mt-1">Appreciation distribution</p>
              </div>
            </div>
            {appreciationData.length > 0 ? (
              <div className="flex items-center">
                <div className="h-48 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appreciationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {appreciationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 ml-4">
                  {appreciationData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-4">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No feedback data available
              </div>
            )}
          </motion.div>
        </div>

        {/* Top Unlocked Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Unlocked Properties</h3>
              <p className="text-sm text-gray-500 mt-1">Most popular properties</p>
            </div>
          </div>

          <div className="space-y-4">
            {analytics?.topUnlockedProperties && analytics.topUnlockedProperties.length > 0 ? (
              analytics.topUnlockedProperties.map((property, index) => (
                <div
                  key={property.propertyId}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-[#F20C8F] to-rose-400' :
                      index === 1 ? 'bg-gradient-to-br from-[#083A85] to-blue-600' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{property.title}</h4>
                      <p className="text-sm text-gray-500">{property.unlockCount} unlocks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      {property.unlockCount} requests
                    </p>
                    <p className="text-xs text-gray-500">Address unlocks</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No unlock data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Unlocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Unlocks</h3>
              <p className="text-sm text-gray-500 mt-1">Latest property unlocks</p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics?.recentUnlocks && analytics.recentUnlocks.length > 0 ? (
              analytics.recentUnlocks.slice(0, 10).map((unlock: any, index: number) => (
                <div
                  key={unlock.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md rounded-xl transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F20C8F] to-rose-400 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    {unlock.guest?.profileImage ? (
                      <img src={unlock.guest.profileImage} alt={unlock.guest.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <i className="bi bi-person-fill"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {unlock.propertyTitle}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="font-medium">{unlock.guest?.name || 'Unknown Guest'}</span>
                      <span>•</span>
                      <span>{getTimeAgo(unlock.unlockDate)}</span>
                    </div>
                    {/* Only show payment details if payment method contains 30_booking or monthly_booking */}
                    {(unlock.paymentMethod?.includes('30_booking') || unlock.paymentMethod?.includes('monthly_booking')) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {unlock.paymentMethod && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {unlock.paymentMethod.replace(/_/g, ' ')}
                          </span>
                        )}
                        {unlock.paymentStatus && (
                          <span className={`px-2 py-0.5 rounded ${
                            unlock.paymentStatus === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                            unlock.paymentStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {unlock.paymentStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {unlock.guest?.email && (
                      <button
                        className="px-3 py-1.5 bg-[#083A85] hover:bg-[#062d65] text-white rounded-lg text-xs font-medium transition-colors"
                        title={`Contact ${unlock.guest.name}`}
                        onClick={() => window.location.href = `mailto:${unlock.guest.email}`}
                      >
                        <i className="bi bi-envelope-fill mr-1"></i>
                        Email
                      </button>
                    )}
                    {unlock.guest?.phone && (
                      <button
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                        title={`Call ${unlock.guest.name}`}
                        onClick={() => window.location.href = `tel:${unlock.guest.phone}`}
                      >
                        <i className="bi bi-telephone-fill mr-1"></i>
                        Call
                      </button>
                    )}
                    {unlock.appreciationSubmitted && (
                      <span className="inline-flex items-center px-2 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                        <i className="bi bi-check-circle-fill mr-1"></i>
                        Feedback
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="bi bi-inbox text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">No recent unlocks</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HostUnlockAnalytics;
