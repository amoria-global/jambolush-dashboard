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

  const [userName, setUserName] = useState('Valued Customer');

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
            // Wishlist items array
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
            // Wishlist items array
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
        // Refresh dashboard data after successful payment
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <i className="bi bi-exclamation-triangle text-red-600 text-xl" />
            </div>
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
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
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();

    // Early Morning (5-7 AM)
    const earlyMorningMessages = [
      `🌅 Rise and shine, early bird!`,
      `☕ First coffee, first victory!`,
      `🐦 The world is yours this early!`,
      `🌄 Conquer mountains today!`,
      `⏰ Early start, early success!`,
      `🌤 Dawn brings new possibilities!`,
      `💪 Power up for greatness!`,
      `🔥 Ignite your potential now!`,
      `✨ Magic happens in the morning!`,
      `🎯 Aim high from the start!`
    ];

    // Morning (7-12 PM)
    const morningMessages = [
      `🌅 Good morning!`,
      `☕ Coffee time!`,
      `💡 Fresh ideas start now!`,
      `🏃 Start strong today!`,
      `📅 New goals, new wins!`,
      `🌞 Shine bright today!`,
      `🤝 Connect and grow!`,
      `📈 Progress starts early!`,
      `🎨 Paint your day beautiful!`,
      `🚀 Launch into excellence!`,
      `🌱 Plant seeds of success!`,
      `⭐ Half the day, full potential!`,
      `🎪 Make today spectacular!`,
      `🏆 Champion mindset activated!`,
      `🎵 Start with good vibes!`
    ];

    // Afternoon (12-17 PM)
    const afternoonMessages = [
      `☀️ Good afternoon!`,
      `🚀 Keep the momentum!`,
      `🔥 Stay on fire!`,
      `🌱 Keep growing strong!`,
      `📊 Productivity boost!`,
      `💪 Power through the day!`,
      `🎯 Focus on your targets!`,
      `⚡ Energy check—stay sharp!`,
      `🌻 Bloom where you're planted!`,
      `🎪 Make magic happen now!`,
      `🏃‍♂️ Sprint to your goals!`,
      `🎨 Create something amazing!`,
      `🔮 Afternoon gems await you!`,
      `🌊 Flow with the rhythm!`,
      `🎭 Performance time!`,
      `🏅 Excellence is calling!`
    ];

    // Evening (17-21 PM)
    const eveningMessages = [
      `🌇 Good evening!`,
      `📖 Reflect and recharge!`,
      `🌟 You did amazing today!`,
      `🎶 Relax with good vibes!`,
      `🍵 Slow down, breathe easy!`,
      `🙌 Celebrate small wins!`,
      `🛋 Enjoy your comfort zone!`,
      `🌌 Night is settling in—peace ahead!`,
      `🍷 Unwind and appreciate!`,
      `🎨 Evening creativity flows!`,
      `🧘‍♀️ Find your inner calm!`,
      `🎬 Enjoy life's moments!`,
      `🌹 Beauty in the twilight!`,
      `📚 Knowledge before rest!`,
      `🕯 Light up the evening!`,
      `🎭 Evening entertainment!`
    ];

    // Night (21-24 PM)
    const nightMessages = [
      `🌙 Good night!`,
      `🛌 Rest well, dream big!`,
      `✨ Tomorrow holds magic!`,
      `😴 Recharge your soul!`,
      `🔕 Disconnect and rest!`,
      `💤 Deep sleep matters!`,
      `🌠 Drift into dreams!`,
      `🛡 Safe and sound tonight!`,
      `🌜 Let the moon guide your dreams!`,
      `🎶 Lullabies of the night!`,
      `🏰 Build castles in your sleep!`,
      `🌌 Cosmic dreams await!`,
      `🛏 Home sweet dreams!`,
      `🔮 Crystal clear rest ahead!`
    ];

    // Late Night/Midnight (0-5 AM)
    const lateNightMessages = [
      `🌃 Burning the midnight oil?`,
      `🦉 Night owl vibes!`,
      `⭐ Stars are your companions!`,
      `🌙 Midnight magic hour!`,
      `💻 Late night productivity!`,
      `🎧 Night sounds and focus!`,
      `🔥 Burning bright at night!`,
      `🌌 Limitless night energy!`,
      `☕ Midnight fuel running!`,
      `🎯 Sharp focus in the dark!`,
      `🚀 Launch into the night!`,
      `🎪 Night circus performance!`,
      `🔬 Deep dive discoveries!`,
      `🎨 Creative night sessions!`
    ];

    const pickRandom = (messages: string[]) =>
      messages[Math.floor(Math.random() * messages.length)];

    if (hour >= 0 && hour < 5) return pickRandom(lateNightMessages);
    if (hour >= 5 && hour < 7) return pickRandom(earlyMorningMessages);
    if (hour >= 7 && hour < 12) return pickRandom(morningMessages);
    if (hour >= 12 && hour < 17) return pickRandom(afternoonMessages);
    if (hour >= 17 && hour < 21) return pickRandom(eveningMessages);
    return pickRandom(nightMessages);
  };

  return (
    <div className="pb-6 px-2 sm:px-3 lg:px-4">
      <div className="">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">
            {getTimeBasedGreeting()}, {userName}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">Track bookings, wishlist & activity</p>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="bi bi-calendar-check text-white text-sm" />
              <span className="text-xs text-blue-50">Bookings</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">{totalBookings}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="bi bi-heart-fill text-white text-sm" />
              <span className="text-xs text-pink-50">Wishlist</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">{dashboardData.bookings.wishlist?.length || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="bi bi-clock-history text-white text-sm" />
              <span className="text-xs text-orange-50">Pending</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">{pendingTransactions.length}</p>
          </div>
        </div>

        {/* Main Content - Compact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Left Column - Bookings & Transactions */}
          <div className="lg:col-span-2 space-y-3">

            {/* Recent Bookings - Compact */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <i className="bi bi-house-door text-[#083A85] text-sm" />
                  Recent Bookings
                </h2>
                {totalBookings > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">{totalBookings}</span>
                )}
              </div>

              <div className="space-y-1.5">
                {[...dashboardData.bookings.properties, ...dashboardData.bookings.tours].slice(0, 4).map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-all">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <i className={`bi bi-${booking.property ? 'house' : 'geo-alt'} text-blue-600 text-xs`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {booking.property?.name || booking.tour?.title || 'Booking'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(booking.checkIn || booking.startDate || booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-900">${booking.totalPrice || booking.price || 0}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}

                {totalBookings === 0 && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                      <i className="bi bi-calendar-x text-gray-400 text-sm" />
                    </div>
                    <p className="text-xs text-gray-500">No bookings yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions - Compact */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100" id="transactions-section">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <i className="bi bi-receipt text-[#F20C8F] text-sm" />
                  Recent Transactions
                </h2>
                {dashboardData.payments.transactions?.length > 0 && (
                  <button className="text-xs text-[#083A85] hover:underline font-medium">View All</button>
                )}
              </div>

              <div className="space-y-1.5">
                {dashboardData.payments.transactions?.slice(0, 5).map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        transaction.status === 'completed' ? 'bg-green-100' :
                        transaction.status === 'pending' ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        <i className={`bi bi-${
                          transaction.status === 'completed' ? 'check-circle' :
                          transaction.status === 'pending' ? 'clock' :
                          'x-circle'
                        } text-xs ${
                          transaction.status === 'completed' ? 'text-green-600' :
                          transaction.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {transaction.description || transaction.type || 'Transaction'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(transaction.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-bold text-gray-900">
                        ${transaction.amount || 0}
                      </p>
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handlePayNow(transaction.id, transaction.amount)}
                          className="text-[10px] text-blue-600 hover:underline font-medium"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {!dashboardData.payments.transactions?.length && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                      <i className="bi bi-receipt text-gray-400 text-sm" />
                    </div>
                    <p className="text-xs text-gray-500">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Wishlist & Quick Actions - Compact */}
          <div className="space-y-3">

            {/* Wishlist Preview - Compact */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <i className="bi bi-heart text-pink-500 text-sm" />
                  Wishlist
                </h2>
                <span className="text-xs text-gray-500 font-medium">{dashboardData.bookings.wishlist?.length || 0}</span>
              </div>

              <div className="space-y-1.5">
                {dashboardData.bookings.wishlist?.slice(0, 4).map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-all">
                    <div className="w-6 h-6 rounded-md bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <i className="bi bi-house-heart text-pink-600 text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.itemDetails?.name || 'Property'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        ${item.itemDetails?.price || 0}
                      </p>
                    </div>
                  </div>
                ))}

                {(!dashboardData.bookings.wishlist || dashboardData.bookings.wishlist.length === 0) && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                      <i className="bi bi-heart text-gray-400 text-sm" />
                    </div>
                    <p className="text-xs text-gray-500">No items saved</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions - Compact */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <h2 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <i className="bi bi-lightning-charge text-yellow-500 text-sm" />
                Quick Actions
              </h2>

              <div className="space-y-1.5">
                <button className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md transition-all text-left group">
                  <i className="bi bi-house-add text-blue-600 text-sm" />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">Book Property</span>
                  <i className="bi bi-arrow-right ml-auto text-gray-400 text-xs group-hover:text-gray-600" />
                </button>

                <button className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md transition-all text-left group">
                  <i className="bi bi-geo-alt text-green-600 text-sm" />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">Book Tour</span>
                  <i className="bi bi-arrow-right ml-auto text-gray-400 text-xs group-hover:text-gray-600" />
                </button>

                <button className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-md transition-all text-left group">
                  <i className="bi bi-calendar-check text-purple-600 text-sm" />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">My Bookings</span>
                  <i className="bi bi-arrow-right ml-auto text-gray-400 text-xs group-hover:text-gray-600" />
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