'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/app/api/apiService';

const HostDashboard = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [bookingsData, setBookingsData] = useState<any>([]);
  const [earningsData, setEarningsData] = useState<any>([]);
  const [propertiesData, setPropertiesData] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  const [userName, setUserName] = useState('Host');
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      const user = JSON.parse(localStorage.getItem('userSession') || '{}');
      const userId = user.id || user.userId;

      if (userId) {
        const walletResponse = await api.get(`/transactions/wallet/${userId}`);
        if (walletResponse.data.success) {
          setWalletData(walletResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        if (user.name) {
          setUserName(user.name);
        }

        const dashboardResponse = await api.get('/properties/host/dashboard');
        const dashboard = dashboardResponse.data.data;
        setDashboardData(dashboard);

        const enhancedResponse = await api.get('/properties/host/dashboard/enhanced');
        const enhanced = enhancedResponse.data.data;
        setEnhancedData(enhanced);

        const bookingsResponse = await api.get('/bookings/host/guest-bookings');
        setBookingsData(bookingsResponse.data.data.bookings || bookingsResponse.data.data);

        const earningsResponse = await api.get('/properties/host/earnings');
        setEarningsData(earningsResponse.data.data);

        const propertiesResponse = await api.get('/properties/host/my-properties');
        setPropertiesData(propertiesResponse.data.data.properties);

        // Fetch wallet data
        await fetchWalletData();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up interval to refresh wallet data every 30 seconds
    const walletInterval = setInterval(fetchWalletData, 30000);

    return () => clearInterval(walletInterval);
  }, []);

  const transformEarningsData = (monthlyEarnings: any) => {
    if (!monthlyEarnings || monthlyEarnings.length === 0) {
      return [
        { month: 'Jan', earnings: 0 },
        { month: 'Feb', earnings: 0 },
        { month: 'Mar', earnings: 0 },
        { month: 'Apr', earnings: 0 },
        { month: 'May', earnings: 0 },
        { month: 'Jun', earnings: 0 },
      ];
    }

    return monthlyEarnings.map((item: any) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      earnings: item.earnings || 0
    }));
  };

  const transformPropertyBookingsData = (propertyPerformance: any) => {
    if (!propertyPerformance || propertyPerformance.length === 0) {
      return [
        { day: 'Mon', bookings: 0 },
        { day: 'Tue', bookings: 0 },
        { day: 'Wed', bookings: 0 },
        { day: 'Thu', bookings: 0 },
        { day: 'Fri', bookings: 0 },
        { day: 'Sat', bookings: 0 },
        { day: 'Sun', bookings: 0 },
      ];
    }

    return propertyPerformance.slice(0, 7).map((item: any, index: number) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      bookings: item.bookings || 0
    }));
  };

  const getPropertyTypes = (properties: any) => {
    if (!properties || properties.length === 0) {
      return [{ name: 'No Properties', value: 1, color: '#E5E7EB' }];
    }

    const typeCount: any = {};
    properties.forEach((property: any) => {
      const type = property.type || property.category || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = ['#083A85', '#F20C8F', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const transformRecentActivity = (bookings: any) => {
    if (!bookings || bookings.length === 0) return [];
    return bookings.slice(0, 4).map((booking: any) => ({
      guest: booking.guestName || booking.user?.name || 'Guest',
      message: booking.specialRequests || booking.notes || 'New booking confirmed',
      time: new Date(booking.createdAt).toLocaleTimeString(),
      type: booking.status === 'confirmed' ? 'booking' : 'inquiry'
    }));
  };

  const transformUpcomingCheckIns = (checkIns: any) => {
    if (!checkIns || checkIns.length === 0) return [];
    return checkIns.slice(0, 3).map((checkin: any) => ({
      title: checkin.propertyName || checkin.property?.name,
      time: new Date(checkin.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      guests: checkin.guests || checkin.numberOfGuests || 0,
      duration: `${checkin.nights || 1} nights`,
      guest: checkin.guestName || 'Guest',
      status: checkin.status || 'confirmed'
    }));
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
              onClick={() => window.location.reload()}
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

  const chartEarningsData = transformEarningsData(dashboardData?.monthlyEarnings);
  const chartBookingsData = transformPropertyBookingsData(dashboardData?.propertyPerformance);
  const propertyTypes = getPropertyTypes(propertiesData);
  const recentActivity = transformRecentActivity(bookingsData);
  const upcomingCheckIns = transformUpcomingCheckIns(dashboardData?.upcomingCheckIns);

  const summaryCards = [
    {
      title: 'Active Properties',
      value: dashboardData?.activeProperties?.toString() || '0',
      change: `${dashboardData?.totalProperties || 0} total`,
      icon: 'house-door',
      iconBg: 'bg-blue-50',
      iconColor: 'text-[#083A85]',
    },
    {
      title: 'Total Guests',
      value: dashboardData?.totalGuests?.toString() || '0',
      change: `${dashboardData?.totalBookings || 0} bookings`,
      icon: 'people',
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-500',
    },
    {
      title: 'Total Revenue',
      value: `$${dashboardData?.totalRevenue?.toLocaleString() || '0'}`,
      change: 'All time',
      icon: 'currency-dollar',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Average Rating',
      value: dashboardData?.averageRating?.toFixed(1) || '0.0',
      change: `${dashboardData?.pendingReviews || 0} pending`,
      icon: 'star',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
  ];

  const recentReviews = bookingsData
    .filter((booking: any) => booking.review)
    .slice(0, 3)
    .map((booking: any) => ({
      guest: booking.guestName || booking.user?.name || 'Anonymous',
      rating: booking.review?.rating || 5,
      comment: booking.review?.comment || 'Great experience!',
      property: booking.property?.name || booking.propertyName || 'Property',
      date: new Date(booking.review?.createdAt || booking.createdAt).toLocaleDateString()
    }));

  return (
    <div className="">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold text-gray-900 mb-2">
            {getTimeBasedGreeting()}, {userName}
          </h1>
          <p className="text-gray-600">Welcome to your host dashboard</p>
        </div>

        {/* Wallet Section */}
        <div className="mb-6 bg-gradient-to-r from-[#083A85] to-[#062d6b] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="bi bi-wallet2 text-white text-xl" />
                </div>
                <h3 className="text-white/90 text-sm font-medium">Wallet Balance</h3>
              </div>
              {walletLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-white/70 text-sm">Loading...</span>
                </div>
              ) : walletData ? (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {walletData.totalBalance?.toLocaleString() || '0'}
                    </span>
                    <span className="text-white/80 text-sm">{walletData.currency || 'RWF'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-white/70">Available: </span>
                      <span className="text-white font-medium">{walletData.availableBalance?.toLocaleString() || '0'}</span>
                    </div>
                    {walletData.pendingBalance > 0 && (
                      <div>
                        <span className="text-white/70">Pending: </span>
                        <span className="text-yellow-300 font-medium">{walletData.pendingBalance?.toLocaleString() || '0'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-white/70 text-sm">No wallet data available</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/host/wallet')}
                className="px-4 py-2 bg-white text-[#083A85] rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <i className="bi bi-arrow-right-circle" />
                View Details
              </button>
              <button
                onClick={fetchWalletData}
                disabled={walletLoading}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <i className={`bi bi-arrow-clockwise ${walletLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {summaryCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                  <i className={`bi bi-${card.icon} ${card.iconColor} text-xl`} />
                </div>
                <span className="text-2xl font-semibold text-gray-900">{card.value}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">{card.change}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Earnings Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b">
                  <h2 className="text-[22px] font-medium text-gray-900">Monthly Earnings</h2>
                </div>
                <div className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="earnings" stroke="#083A85" strokeWidth={2} dot={{ fill: '#083A85', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bookings Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b">
                  <h2 className="text-[22px] font-medium text-gray-900">Weekly Bookings</h2>
                </div>
                <div className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartBookingsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#F20C8F" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-medium text-gray-900">Recent Activity</h2>
                  <button className="text-sm text-[#083A85] hover:underline font-medium">
                    View all
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <i className={`bi bi-${activity.type === 'booking' ? 'calendar-check' : 'chat-dots'} text-[#083A85] text-lg`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activity.guest}</p>
                            <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                            activity.type === 'booking' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <i className="bi bi-chat-square-dots text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-500 mb-1">No recent activity</p>
                    <p className="text-sm text-gray-400">Your activity will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Upcoming Check-ins */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-medium text-gray-900">Upcoming Check-ins</h2>
                  <button 
                    onClick={() => router.push('/host/calendar')}
                    className="text-sm text-[#083A85] hover:underline font-medium"
                  >
                    View calendar
                  </button>
                </div>
              </div>
              <div className="p-6">
                {upcomingCheckIns.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingCheckIns.map((checkin: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <i className="bi bi-calendar-check text-[#083A85] text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {checkin.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {checkin.guest} • {checkin.guests} guests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{checkin.time}</p>
                          <p className="text-xs text-gray-600">{checkin.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <i className="bi bi-calendar-x text-gray-400 text-xl" />
                    </div>
                    <p className="text-gray-500 mb-1">No upcoming check-ins</p>
                    <p className="text-sm text-gray-400">Check-ins will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Property Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <h2 className="text-[22px] font-medium text-gray-900">Property Types</h2>
              </div>
              <div className="p-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {propertyTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {propertyTypes.map((type: any, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: type.color }}></div>
                      {type.name} ({type.value})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-medium text-gray-900">Recent Reviews</h2>
                  <button 
                    onClick={() => router.push('/host/reviews')}
                    className="text-sm text-[#083A85] hover:underline font-medium"
                  >
                    View all
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentReviews.length > 0 ? (
                  <div className="space-y-3">
                    {recentReviews.map((review: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-gray-900">{review.guest}</p>
                          <div className="flex items-center">
                            {[...Array(review.rating)].map((_, i) => (
                              <i key={i} className="bi bi-star-fill text-yellow-500 text-xs" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{review.comment}</p>
                        <p className="text-xs text-gray-500">{review.property} • {review.date}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <i className="bi bi-star text-gray-400 text-xl" />
                    </div>
                    <p className="text-gray-500 mb-1">No reviews yet</p>
                    <p className="text-sm text-gray-400">Reviews will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;