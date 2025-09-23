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
        api.get('/bookings/stats').catch(() => null),
        api.get('/payments/wallet').catch(() => null),
        api.get('/payments/transactions').catch(() => null),
        api.get('/bookings/properties').catch(() => null),
        api.get('/bookings/tours').catch(() => null),
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
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        if (hour < 21) return 'Good evening';
        return 'Good night';
    };
  return (
    <div className="py-14">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           {/* Header */}
                <div className="mb-8">
                    <h1 className="text-lg lg:text-3xl font-semibold text-[#083A85] mb-2">
                        {getTimeBasedGreeting()}, {userName}!
                    </h1>
                    <p className="text-gray-600 text-md">Here's your dashboard summary</p>
                </div>
        </div>
      </div>

      <div className="p-2">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard 
            title="Total Bookings" 
            value={totalBookings}
            color="blue"
            icon="calendar-check"
          />
          <StatCard 
            title="Wallet Balance" 
            value={dashboardData.payments.wallet?.balance ? `${dashboardData.payments.wallet.balance} ${dashboardData.payments.wallet.currency || 'USD'}` : '0 USD'}
            color="green"
            icon="wallet2"
          />
          <StatCard 
            title="Wishlist Items" 
            value={dashboardData.bookings.wishlist?.length || 0}
            color="purple"
            icon="heart"
          />
          <StatCard 
            title="Pending Payments" 
            value={pendingTransactions.length}
            color="orange"
            icon="clock"
          />
        </div>

        {/* Pending Payments Alert */}
        {pendingTransactions.length > 0 && (
          <div className="mb-8 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle text-orange-400 text-xl mr-3" />
              <div className="flex-1">
                <h3 className="text-orange-800 font-semibold">Pending Payments</h3>
                <p className="text-orange-700 text-sm mt-1">
                  You have {pendingTransactions.length} pending payment{pendingTransactions.length > 1 ? 's' : ''} that require your attention.
                </p>
              </div>
              <button 
                onClick={() => document.getElementById('transactions-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                View Payments
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center text-gray-800">
                  <i className="bi bi-clock-history mr-2 text-[#083A85]" />
                  Recent Bookings
                </h2>
                {totalBookings > 0 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {totalBookings} total
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {[...dashboardData.bookings.properties, ...dashboardData.bookings.tours]
                  .slice(0, 5)
                  .map((booking, index) => (
                  <BookingItem key={booking.id || index} booking={booking} />
                ))}
                {totalBookings === 0 && (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                      <i className="bi bi-calendar-x text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-500 font-medium">No bookings found</p>
                    <p className="text-gray-400 text-sm mt-1">Your recent bookings will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Wallet */}
          <div className="space-y-6">
            {/* Wallet Summary */}
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <i className="bi bi-wallet2 mr-2 text-[#10B981]" />
                Wallet Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700 font-medium flex items-center">
                    <i className="bi bi-check-circle mr-2 text-green-600" />
                    Available Balance
                  </span>
                  <span className="font-bold text-lg text-gray-800">
                    {dashboardData.payments.wallet?.balance || 0} {dashboardData.payments.wallet?.currency || 'USD'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700 font-medium flex items-center">
                    <i className="bi bi-clock mr-2 text-orange-600" />
                    Pending
                  </span>
                  <span className="text-orange-600 font-bold">
                    {dashboardData.payments.wallet?.pendingBalance || 0} {dashboardData.payments.wallet?.currency || 'USD'}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center p-3 bg-[#083A85] bg-opacity-10 rounded-lg">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-bold text-lg text-[#083A85]">
                      {(dashboardData.payments.wallet?.balance || 0) + (dashboardData.payments.wallet?.pendingBalance || 0)} {dashboardData.payments.wallet?.currency || 'USD'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                <i className="bi bi-lightning mr-2 text-[#F59E0B]" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <ActionButton text="Book Property" icon="house-add" onClick={() => console.log('Book property')} />
                <ActionButton text="Book Tour" icon="geo-alt" onClick={() => console.log('Book tour')} />
                <ActionButton text="View Wishlist" icon="heart" onClick={() => console.log('View wishlist')} />
                <ActionButton text="My Bookings" icon="calendar-check" onClick={() => console.log('My bookings')} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8" id="transactions-section">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold flex items-center text-gray-800">
                <i className="bi bi-credit-card mr-2 text-[#F20C8F]" />
                Recent Transactions
              </h2>
              {dashboardData.payments.transactions?.length > 0 && (
                <button className="text-[#083A85] hover:text-blue-900 font-medium transition-colors">
                  <i className="bi bi-arrow-right mr-1" />
                  View All
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.payments.transactions?.map((transaction: any, index: number) => (
                    <TransactionRow 
                      key={transaction.id || index} 
                      transaction={transaction} 
                      onPayNow={handlePayNow}
                    />
                  ))}
                  {!dashboardData.payments.transactions?.length && (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                          <i className="bi bi-receipt text-gray-400 text-2xl" />
                        </div>
                        <p className="text-gray-500 font-medium">No transactions found</p>
                        <p className="text-gray-400 text-sm mt-1">Your transaction history will appear here</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Components
interface StatCardProps {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => {
  const colorConfig = {
    blue: { bg: '#083A85' },
    green: { bg: '#10B981' },
    purple: { bg: '#F20C8F' },
    orange: { bg: '#F59E0B' }
  };

  const config = colorConfig[color];

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden">
      <div className="absolute top-2 right-2 opacity-5 text-5xl">
        <i className={`bi bi-${icon}`} />
      </div>
      <div className="flex items-center mb-4">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 text-white"
          style={{ backgroundColor: config.bg }}
        >
          <i className={`bi bi-${icon} text-base`}/>
        </div>
        <span className="text-sm text-gray-600 font-medium">{title}</span>
      </div>
      <div className="text-2xl lg:text-3xl font-bold mb-2 text-gray-800">{value}</div>
    </div>
  );
};

interface BookingItemProps {
  booking: any;
}

const BookingItem: React.FC<BookingItemProps> = ({ booking }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: 'clock' },
      confirmed: { class: 'bg-green-100 text-green-800', icon: 'check-circle' },
      cancelled: { class: 'bg-red-100 text-red-800', icon: 'x-circle' },
      completed: { class: 'bg-blue-100 text-blue-800', icon: 'check2-circle' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { class: 'bg-gray-100 text-gray-800', icon: 'circle' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${config.class}`}>
        <i className={`bi bi-${config.icon} mr-1`} />
        {status}
      </span>
    );
  };

  const bookingName = booking.property?.name || booking.tour?.title || booking.tour?.name || 'Booking';
  const bookingLocation = booking.property?.location || booking.tour?.location || '';
  const bookingDate = booking.checkIn || booking.startDate || booking.schedule?.startDate || booking.createdAt;
  const bookingPrice = booking.totalPrice || booking.totalAmount || booking.price || 0;
  const currency = booking.currency || 'USD';

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-[#083A85] bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
          <i className={`bi bi-${booking.property ? 'house' : 'geo-alt'} text-[#083A85]`} />
        </div>
        <div>
          <p className="font-medium text-gray-800">{bookingName}</p>
          <p className="text-sm text-gray-600 flex items-center">
            <i className="bi bi-calendar mr-1" />
            {new Date(bookingDate).toLocaleDateString()}
            {bookingLocation && (
              <>
                <i className="bi bi-geo-alt ml-2 mr-1" />
                <span className="truncate max-w-32">{bookingLocation}</span>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-gray-800 mb-1">{bookingPrice} {currency}</p>
        {getStatusBadge(booking.status)}
      </div>
    </div>
  );
};

interface ActionButtonProps {
  text: string;
  icon: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-[#083A85] transition-all font-medium"
  >
    <i className={`bi bi-${icon} mr-3 text-[#083A85]`} />
    {text}
  </button>
);

interface TransactionRowProps {
  transaction: any;
  onPayNow: (transactionId: string, amount: number) => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onPayNow }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { class: 'bg-green-100 text-green-800', icon: 'check-circle' },
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: 'clock' },
      failed: { class: 'bg-red-100 text-red-800', icon: 'x-circle' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { class: 'bg-gray-100 text-gray-800', icon: 'circle' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${config.class}`}>
        <i className={`bi bi-${config.icon} mr-1`} />
        {status}
      </span>
    );
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-4 px-2">
        <div className="flex items-center">
          <i className="bi bi-arrow-right-circle mr-2 text-gray-400" />
          {transaction.type || 'Payment'}
        </div>
      </td>
      <td className="py-4 px-2 text-gray-700">
        {transaction.description || transaction.reference || 'Transaction'}
      </td>
      <td className="py-4 px-2 font-semibold text-gray-800">
        {transaction.amount || 0} {transaction.currency || 'USD'}
      </td>
      <td className="py-4 px-2">{getStatusBadge(transaction.status)}</td>
      <td className="py-4 px-2 text-gray-600">{new Date(transaction.createdAt || Date.now()).toLocaleDateString()}</td>
      <td className="py-4 px-2">
        {transaction.status === 'pending' && (
          <button
            onClick={() => onPayNow(transaction.id, transaction.amount)}
            className="bg-[#083A85] text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-900 transition-colors"
          >
            Pay Now
          </button>
        )}
      </td>
    </tr>
  );
};

export default GuestDashboard;