"use client";

import api from '@/app/api/apiService';
import React, { useState, useEffect } from 'react';

const GuestDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>({
    bookings: {
      properties: [],
      tours: [],
      stats: null,
      wishlist: []
    },
    payments: {
      wallet: null,
      transactions: []
    }
  });

  const [userName, setUserName] = useState('Guest');

  // Load guest dashboard data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (user.name) {
      setUserName(user.name);
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [
        api.get('/bookings/guest/dashboard').catch(() => null),
        api.get('/payments/wallet').catch(() => null),
        api.get('/payments/transactions').catch(() => null),
        api.get('/bookings/guest/history').catch(() => null),
        api.get('/bookings/guest/tours').catch(() => null),
        api.get('/bookings/wishlist').catch(() => null)
      ];

      const results = await Promise.all(promises);
      const [bookingStats, wallet, transactions, propertyBookings, tourBookings, wishlist] = results;

      // Helper function to safely extract array data
      const extractArray = (data: any): any[] => {
        if (!data) return [];

        // Handle nested API response structure
        if (data.data && data.data.data) {
          if (data.data.data.bookings && Array.isArray(data.data.data.bookings)) {
            return data.data.data.bookings;
          }
          if (data.data.data.transactions && Array.isArray(data.data.data.transactions)) {
            return data.data.data.transactions;
          }
          if (data.data.data.items && Array.isArray(data.data.data.items)) {
            return data.data.data.items;
          }
          if (data.data.data.wishlist && Array.isArray(data.data.data.wishlist)) {
            return data.data.data.wishlist;
          }
          if (Array.isArray(data.data.data)) {
            return data.data.data;
          }
        }

        if (data.data) {
          if (data.data.bookings && Array.isArray(data.data.bookings)) {
            return data.data.bookings;
          }
          if (data.data.transactions && Array.isArray(data.data.transactions)) {
            return data.data.transactions;
          }
          if (data.data.items && Array.isArray(data.data.items)) {
            return data.data.items;
          }
          if (data.data.wishlist && Array.isArray(data.data.wishlist)) {
            return data.data.wishlist;
          }
          if (Array.isArray(data.data)) {
            return data.data;
          }
        }

        if (Array.isArray(data)) {
          return data;
        }

        return [];
      };

      // Helper function to safely extract object data
      const extractObject = (data: any): any => {
        if (!data) return null;

        if (data.data && data.data.data && typeof data.data.data === 'object' && !Array.isArray(data.data.data)) {
          return data.data.data;
        }

        if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          return data.data;
        }

        return data;
      };

      setDashboardData({
        bookings: {
          stats: extractObject(bookingStats),
          properties: extractArray(propertyBookings),
          tours: extractArray(tourBookings),
          wishlist: extractArray(wishlist)
        },
        payments: {
          wallet: extractObject(wallet),
          transactions: extractArray(transactions)
        }
      });

    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to load dashboard. Please try again.';
      setError(errorMessage);
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (transactionId: string, amount: number) => {
    try {
      setLoading(true);
      const response = await api.post(`/payments/${transactionId}/pay`, {
        amount: amount
      });

      if (response.data.success) {
        await loadDashboardData();
        alert('Payment successful!');
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <i className="bi bi-exclamation-triangle text-red-600 text-xl" />
            </div>
            <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={refreshData}
              className="bg-[#083A85] text-white px-6 py-3 rounded-lg hover:bg-[#062d6b] transition-colors font-medium"
            >
              <i className="bi bi-arrow-clockwise mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalBookings = (dashboardData.bookings.properties?.length || 0) + (dashboardData.bookings.tours?.length || 0);
  const pendingTransactions = dashboardData.payments.transactions?.filter((t: any) => t.status === 'pending') || [];

  return (
    <div className="">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold text-gray-900 mb-2">
            {getTimeBasedGreeting()}, {userName}
          </h1>
          <p className="text-gray-600">Welcome back to your dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <i className="bi bi-calendar-check text-[#083A85] text-xl" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">{totalBookings}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Bookings</h3>
            <p className="text-xs text-gray-500">Properties & Tours</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                <i className="bi bi-heart-fill text-pink-500 text-xl" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">{dashboardData.bookings.wishlist?.length || 0}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Wishlist Items</h3>
            <p className="text-xs text-gray-500">Saved for later</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <i className="bi bi-clock-history text-orange-500 text-xl" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">{pendingTransactions.length}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Payments</h3>
            <p className="text-xs text-gray-500">Requires action</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left Column - Bookings & Transactions */}
          <div className="lg:col-span-3 space-y-8">

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-medium text-gray-900">Recent Bookings</h2>
                  {totalBookings > 0 && (
                    <button className="text-sm text-[#083A85] hover:underline font-medium">
                      View all
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {totalBookings > 0 ? (
                  <div className="space-y-4">
                    {[...dashboardData.bookings.properties, ...dashboardData.bookings.tours].slice(0, 5).map((booking, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <i className={`bi bi-${booking.property ? 'house-door' : 'geo-alt'} text-[#083A85] text-lg`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.property?.name || booking.tour?.title || 'Booking'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(booking.checkIn || booking.startDate || booking.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${booking.totalPrice || booking.price || 0}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <i className="bi bi-calendar-x text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-500 mb-1">No bookings yet</p>
                    <p className="text-sm text-gray-400">Your bookings will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-medium text-gray-900">Recent Transactions</h2>
                  {dashboardData.payments.transactions?.length > 0 && (
                    <button className="text-sm text-[#083A85] hover:underline font-medium">
                      View all
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {dashboardData.payments.transactions?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.payments.transactions.slice(0, 5).map((transaction: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.status === 'completed' ? 'bg-green-100' :
                            transaction.status === 'pending' ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}>
                            <i className={`bi bi-${
                              transaction.status === 'completed' ? 'check-circle' :
                              transaction.status === 'pending' ? 'clock' :
                              'x-circle'
                            } ${
                              transaction.status === 'completed' ? 'text-green-600' :
                              transaction.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description || transaction.type || 'Transaction'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            RF{transaction.amount || 0}
                          </p>
                          {transaction.status === 'pending' && (
                            <button
                              onClick={() => handlePayNow(transaction.id, transaction.amount)}
                              className="text-sm text-[#083A85] hover:underline font-medium mt-1"
                            >
                              Pay now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <i className="bi bi-receipt text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-500 mb-1">No transactions yet</p>
                    <p className="text-sm text-gray-400">Your payment history will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Wishlist & Quick Actions */}
          <div className="lg:col-span-2 space-y-8">

            {/* Wishlist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-medium text-gray-900">Wishlist</h2>
                  <span className="text-sm text-gray-500">{dashboardData.bookings.wishlist?.length || 0} items</span>
                </div>
              </div>

              <div className="p-6">
                {dashboardData.bookings.wishlist?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.bookings.wishlist.slice(0, 4).map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                          <i className="bi bi-heart-fill text-pink-500 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.itemDetails?.name || 'Property'}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${item.itemDetails?.price || 0}/night
                          </p>
                        </div>
                      </div>
                    ))}
                    {dashboardData.bookings.wishlist.length > 4 && (
                      <button className="w-full text-center text-sm text-[#083A85] hover:underline font-medium pt-2">
                        View all {dashboardData.bookings.wishlist.length} items
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <i className="bi bi-heart text-gray-400 text-xl" />
                    </div>
                    <p className="text-gray-500 mb-1">No saved items</p>
                    <p className="text-sm text-gray-400">Save your favorite places</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <h2 className="text-[22px] font-medium text-gray-900">Quick Actions</h2>
              </div>

              <div className="p-6 space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <i className="bi bi-house-add text-[#083A85] text-lg" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Book Property</p>
                      <p className="text-sm text-gray-600">Find your next stay</p>
                    </div>
                  </div>
                  <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <i className="bi bi-geo-alt text-green-600 text-lg" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Book Tour</p>
                      <p className="text-sm text-gray-600">Explore new experiences</p>
                    </div>
                  </div>
                  <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <i className="bi bi-calendar-check text-purple-600 text-lg" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">My Bookings</p>
                      <p className="text-sm text-gray-600">View all reservations</p>
                    </div>
                  </div>
                  <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <i className="bi bi-person-circle text-orange-600 text-lg" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">My Profile</p>
                      <p className="text-sm text-gray-600">Manage your account</p>
                    </div>
                  </div>
                  <i className="bi bi-arrow-right text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;