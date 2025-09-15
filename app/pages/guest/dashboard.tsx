"use client";

import api from '@/app/api/apiService';
import React, { useState, useEffect } from 'react';

const GuestDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'guest' | 'host' | 'agent' | 'tourguide'>('guest');
  const [dashboardData, setDashboardData] = useState<any>({
    bookings: {
      properties: [],
      tours: [],
      stats: null,
      calendar: null
    },
    properties: {
      myProperties: [],
      dashboard: null,
      earnings: null
    },
    payments: {
      wallet: null,
      transactions: [],
      analytics: null
    }
  });

  // Detect user type and load appropriate data
  useEffect(() => {
    loadDashboardData();
  }, [userType]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // Common data for all users
      promises.push(
        api.get('/bookings/stats').catch(() => null),
        api.get('/bookings/calendar').catch(() => null),
        api.get('/payments/wallet').catch(() => null),
        api.get('/payments/transactions').catch(() => null)
      );

      // User type specific data
      if (userType === 'host') {
        promises.push(
          api.get('/properties/host/dashboard').catch(() => null),
          api.get('/properties/host/my-properties').catch(() => null),
          api.get('/properties/host/earnings').catch(() => null),
          api.get('/bookings/properties').catch(() => null)
        );
      } else if (userType === 'agent') {
        promises.push(
          api.get('/properties/agent/dashboard').catch(() => null),
          api.get('/properties/agent/properties').catch(() => null),
          api.get('/properties/agent/earnings').catch(() => null),
          api.get('/bookings/agent/clients').catch(() => null)
        );
      } else if (userType === 'tourguide') {
        promises.push(
          api.get('/bookings/tourguide/bookings').catch(() => null),
          api.get('/bookings/tours').catch(() => null)
        );
      } else {
        // Guest
        promises.push(
          api.get('/bookings/properties').catch(() => null),
          api.get('/bookings/tours').catch(() => null),
          api.get('/bookings/wishlist').catch(() => null)
        );
      }

      const results = await Promise.all(promises);

      // Debug logging
      console.log('Raw API results:', results);

      // Parse results based on user type - FIXED: removed .data
      const [bookingStats, calendar, wallet, transactions] = results.slice(0, 4);
      const additionalData = results.slice(4);

      // Debug specific data
      console.log('Transactions raw data:', transactions);
      console.log('Wallet raw data:', wallet);

      // Helper function to safely extract array data - UPDATED TO HANDLE NESTED STRUCTURE
      const extractArray = (data: any, fallback: any[] = []): any[] => {
        if (!data) {
          console.log('No data provided, returning fallback:', fallback);
          return fallback;
        }
        
        // Handle nested API response structure: { data: { data: { bookings: [...] } } }
        if (data.data && data.data.data) {
          if (data.data.data.bookings && Array.isArray(data.data.data.bookings)) {
            console.log('Found array in data.data.data.bookings:', data.data.data.bookings);
            return data.data.data.bookings;
          }
          if (data.data.data.transactions && Array.isArray(data.data.data.transactions)) {
            console.log('Found array in data.data.data.transactions:', data.data.data.transactions);
            return data.data.data.transactions;
          }
          if (data.data.data.properties && Array.isArray(data.data.data.properties)) {
            console.log('Found array in data.data.data.properties:', data.data.data.properties);
            return data.data.data.properties;
          }
          if (data.data.data.tours && Array.isArray(data.data.data.tours)) {
            console.log('Found array in data.data.data.tours:', data.data.data.tours);
            return data.data.data.tours;
          }
          if (data.data.data.wishlist && Array.isArray(data.data.data.wishlist)) {
            console.log('Found array in data.data.data.wishlist:', data.data.data.wishlist);
            return data.data.data.wishlist;
          }
          if (Array.isArray(data.data.data)) {
            console.log('Found array in data.data.data:', data.data.data);
            return data.data.data;
          }
        }
        
        // Handle structure: { data: { bookings: [...] } }
        if (data.data) {
          if (data.data.bookings && Array.isArray(data.data.bookings)) {
            console.log('Found array in data.data.bookings:', data.data.bookings);
            return data.data.bookings;
          }
          if (data.data.transactions && Array.isArray(data.data.transactions)) {
            console.log('Found array in data.data.transactions:', data.data.transactions);
            return data.data.transactions;
          }
          if (data.data.properties && Array.isArray(data.data.properties)) {
            console.log('Found array in data.data.properties:', data.data.properties);
            return data.data.properties;
          }
          if (data.data.tours && Array.isArray(data.data.tours)) {
            console.log('Found array in data.data.tours:', data.data.tours);
            return data.data.tours;
          }
          if (data.data.wishlist && Array.isArray(data.data.wishlist)) {
            console.log('Found array in data.data.wishlist:', data.data.wishlist);
            return data.data.wishlist;
          }
          if (Array.isArray(data.data)) {
            console.log('Found array in data.data:', data.data);
            return data.data;
          }
        }
        
        // If data itself is an array
        if (Array.isArray(data)) {
          console.log('Data itself is array:', data);
          return data;
        }
        
        // Check root level properties
        if (data.transactions && Array.isArray(data.transactions)) {
          console.log('Found array in data.transactions:', data.transactions);
          return data.transactions;
        }
        if (data.bookings && Array.isArray(data.bookings)) {
          console.log('Found array in data.bookings:', data.bookings);
          return data.bookings;
        }
        if (data.properties && Array.isArray(data.properties)) {
          console.log('Found array in data.properties:', data.properties);
          return data.properties;
        }
        if (data.tours && Array.isArray(data.tours)) {
          console.log('Found array in data.tours:', data.tours);
          return data.tours;
        }
        if (data.wishlist && Array.isArray(data.wishlist)) {
          console.log('Found array in data.wishlist:', data.wishlist);
          return data.wishlist;
        }
        
        console.log('No array found, returning fallback. Data structure:', typeof data, data);
        return fallback;
      };

      // Helper function to safely extract object data - UPDATED TO HANDLE NESTED STRUCTURE
      const extractObject = (data: any, fallback: any = null): any => {
        if (!data) return fallback;
        
        // Handle nested structure: { data: { data: { ... } } }
        if (data.data && data.data.data && typeof data.data.data === 'object' && !Array.isArray(data.data.data)) {
          return data.data.data;
        }
        
        // Handle structure: { data: { ... } }
        if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          return data.data;
        }
        
        return data || fallback;
      };

      // Extract data safely with proper type handling
      const extractedTransactions = extractArray(transactions);
      
      // Extract properties and tours based on user type and API response structure
      let extractedProperties = [];
      let extractedTours = [];
      let extractedMyProperties = [];

      if (userType === 'host') {
        extractedMyProperties = extractArray(additionalData[1]); // my-properties
        extractedProperties = extractArray(additionalData[3]);   // bookings/properties
      } else if (userType === 'agent') {
        extractedMyProperties = extractArray(additionalData[1]); // agent/properties
        extractedProperties = extractArray(additionalData[3]);   // agent/clients
      } else if (userType === 'tourguide') {
        extractedProperties = extractArray(additionalData[0]);   // tourguide/bookings
        extractedTours = extractArray(additionalData[1]);        // tours
      } else {
        // Guest
        extractedProperties = extractArray(additionalData[0]);   // bookings/properties
        extractedTours = extractArray(additionalData[1]);        // bookings/tours
      }

      console.log('Extracted data summary:');
      console.log('- Transactions:', extractedTransactions);
      console.log('- Properties:', extractedProperties);
      console.log('- Tours:', extractedTours);
      console.log('- My Properties:', extractedMyProperties);

      const newDashboardData = {
        bookings: {
          stats: extractObject(bookingStats),
          calendar: extractObject(calendar),
          properties: extractedProperties,
          tours: extractedTours
        },
        properties: {
          dashboard: extractObject(additionalData[0]),
          myProperties: extractedMyProperties,
          earnings: extractObject(additionalData[2])
        },
        payments: {
          wallet: extractObject(wallet),
          transactions: extractedTransactions,
          analytics: null
        }
      };

      console.log('Final dashboard data:', newDashboardData);
      setDashboardData(newDashboardData);

      console.log('Successfully loaded dashboard data for', userType);

    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to load dashboard. Please try again.';
      setError(errorMessage);
      console.error('Dashboard loading error:', err);
      
      // Handle authentication errors
      if (err?.status === 401) {
        console.log('Unauthorized access - user needs to login');
        // Optional: Add redirect logic here if needed
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  // Helper function to safely get array length
  const getArrayLength = (arr: any): number => {
    return Array.isArray(arr) ? arr.length : 0;
  };

  // Helper function to safely get array items
  const getArrayItems = (arr: any): any[] => {
    return Array.isArray(arr) ? arr : [];
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-[#083A85] mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back to your {userType} dashboard</p>
            </div>
            <div className="flex space-x-4">
              <select 
                value={userType} 
                onChange={(e) => setUserType(e.target.value as 'guest' | 'host' | 'agent' | 'tourguide')}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-colors"
              >
                <option value="guest">Guest</option>
                <option value="host">Host</option>
                <option value="agent">Agent</option>
                <option value="tourguide">Tour Guide</option>
              </select>
              <button 
                onClick={refreshData}
                className="bg-[#083A85] text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors font-medium shadow-sm"
              >
                <i className="bi bi-arrow-clockwise mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard 
            title="Total Bookings" 
            value={dashboardData.bookings.stats?.totalBookings || 0}
            change="+12%"
            color="blue"
            icon="calendar-check"
          />
          <StatCard 
            title="Total Earnings" 
            value={`${dashboardData.payments.wallet?.balance || 0} ${dashboardData.payments.wallet?.currency || 'KES'}`}
            change="+8%"
            color="green"
            icon="currency-dollar"
          />
          <StatCard 
            title="Active Properties" 
            value={getArrayLength(dashboardData.properties.myProperties)}
            change="+2"
            color="purple"
            icon="house"
          />
          <StatCard 
            title="Completion Rate" 
            value={`${dashboardData.bookings.stats?.completedBookings || 0}%`}
            change="+5%"
            color="orange"
            icon="check-circle"
          />
        </div>

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
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {getArrayLength(dashboardData.bookings.properties) + getArrayLength(dashboardData.bookings.tours)} total
                </span>
              </div>
              <div className="space-y-3">
                {[...getArrayItems(dashboardData.bookings.properties), ...getArrayItems(dashboardData.bookings.tours)]
                  .slice(0, 5)
                  .map((booking, index) => (
                  <BookingItem key={booking.id || index} booking={booking} />
                ))}
                {(getArrayLength(dashboardData.bookings.properties) + getArrayLength(dashboardData.bookings.tours)) === 0 && (
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
                    {dashboardData.payments.wallet?.balance || 0} {dashboardData.payments.wallet?.currency || 'KES'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700 font-medium flex items-center">
                    <i className="bi bi-clock mr-2 text-orange-600" />
                    Pending
                  </span>
                  <span className="text-orange-600 font-bold">
                    {dashboardData.payments.wallet?.pendingBalance || 0} {dashboardData.payments.wallet?.currency || 'KES'}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center p-3 bg-[#083A85] bg-opacity-10 rounded-lg">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-bold text-lg text-[#083A85]">
                      {(dashboardData.payments.wallet?.balance || 0) + (dashboardData.payments.wallet?.pendingBalance || 0)} {dashboardData.payments.wallet?.currency || 'KES'}
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
                {userType === 'host' && (
                  <>
                    <ActionButton text="Add New Property" icon="plus-circle" onClick={() => console.log('Add property')} />
                    <ActionButton text="View Earnings" icon="graph-up" onClick={() => console.log('View earnings')} />
                    <ActionButton text="Manage Bookings" icon="calendar-check" onClick={() => console.log('Manage bookings')} />
                  </>
                )}
                {userType === 'agent' && (
                  <>
                    <ActionButton text="Add Client Property" icon="building-add" onClick={() => console.log('Add client property')} />
                    <ActionButton text="View Commissions" icon="currency-dollar" onClick={() => console.log('View commissions')} />
                    <ActionButton text="Manage Client Bookings" icon="people" onClick={() => console.log('Manage client bookings')} />
                  </>
                )}
                {userType === 'guest' && (
                  <>
                    <ActionButton text="Book Property" icon="house-add" onClick={() => console.log('Book property')} />
                    <ActionButton text="Book Tour" icon="geo-alt" onClick={() => console.log('Book tour')} />
                    <ActionButton text="View Wishlist" icon="heart" onClick={() => console.log('View wishlist')} />
                  </>
                )}
                {userType === 'tourguide' && (
                  <>
                    <ActionButton text="Manage Tours" icon="map" onClick={() => console.log('Manage tours')} />
                    <ActionButton text="Check-in Participants" icon="person-check" onClick={() => console.log('Check-in participants')} />
                    <ActionButton text="View Schedule" icon="calendar-week" onClick={() => console.log('View schedule')} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold flex items-center text-gray-800">
                <i className="bi bi-credit-card mr-2 text-[#F20C8F]" />
                Recent Transactions
              </h2>
              <button className="text-[#083A85] hover:text-blue-900 font-medium transition-colors">
                <i className="bi bi-arrow-right mr-1" />
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {getArrayItems(dashboardData.payments.transactions).map((transaction: any, index: number) => (
                    <TransactionRow key={transaction.id || index} transaction={transaction} />
                  ))}
                  {getArrayLength(dashboardData.payments.transactions) === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
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
  change: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, color, icon }) => {
  const colorConfig = {
    blue: { bg: '#083A85', bgLight: '#083A85', textColor: 'text-blue-800' },
    green: { bg: '#10B981', bgLight: '#10B981', textColor: 'text-green-800' },
    purple: { bg: '#F20C8F', bgLight: '#F20C8F', textColor: 'text-pink-800' },
    orange: { bg: '#F59E0B', bgLight: '#F59E0B', textColor: 'text-amber-800' }
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
      <div className="text-sm text-green-600 flex items-center font-medium">
        <i className="bi bi-arrow-up mr-1" />
        {change}
      </div>
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

  // Handle both property and tour bookings based on actual API structure
  const bookingName = booking.property?.name || booking.tour?.title || booking.tour?.name || 'Booking';
  const bookingLocation = booking.property?.location || booking.tour?.location || '';
  const bookingDate = booking.checkIn || booking.startDate || booking.schedule?.startDate || booking.createdAt;
  const bookingPrice = booking.totalPrice || booking.totalAmount || booking.price || 0;
  const currency = booking.currency || 'KES';

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
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
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
          {transaction.type || 'Transaction'}
        </div>
      </td>
      <td className="py-4 px-2 font-semibold text-gray-800">
        {transaction.amount || 0} {transaction.currency || 'KES'}
      </td>
      <td className="py-4 px-2">{getStatusBadge(transaction.status)}</td>
      <td className="py-4 px-2 text-gray-600">{new Date(transaction.createdAt || Date.now()).toLocaleDateString()}</td>
    </tr>
  );
};

export default GuestDashboard;