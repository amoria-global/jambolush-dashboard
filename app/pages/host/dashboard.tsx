'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/app/api/apiService';

const HostDashboard = () => {
  const router = useRouter();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [bookingsData, setBookingsData] = useState<any>([]);
  const [earningsData, setEarningsData] = useState<any>([]);
  const [propertiesData, setPropertiesData] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  const [userName, setUserName] = useState('Host');

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        if (user.name) {
          setUserName(user.name);
        }

        // Fetch basic dashboard data
        const dashboardResponse = await api.get('/properties/host/dashboard');
        const dashboard = dashboardResponse.data.data;
        setDashboardData(dashboard);

        // Fetch enhanced dashboard data
        const enhancedResponse = await api.get('/properties/host/dashboard/enhanced');
        const enhanced = enhancedResponse.data.data;
        setEnhancedData(enhanced);

        // Fetch recent bookings (guest bookings for host's properties)
        const bookingsResponse = await api.get('/bookings/host/guest-bookings');
        setBookingsData(bookingsResponse.data.data.bookings || bookingsResponse.data.data);

        // Fetch earnings data
        const earningsResponse = await api.get('/properties/host/earnings');
        setEarningsData(earningsResponse.data.data);

        // Fetch host's properties
        const propertiesResponse = await api.get('/properties/host/my-properties');
        setPropertiesData(propertiesResponse.data.data.properties);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Transform earnings data for chart
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

  // Transform property bookings data for chart
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

  // Get property types from properties data
  const getPropertyTypes = (properties: any) => {
    if (!properties || properties.length === 0) {
      return [
        { name: 'No Properties', value: 1, color: '#E5E7EB' }
      ];
    }

    const typeCount: any = {};
    properties.forEach((property: any) => {
      const type = property.type || property.category || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = ['#F20C8F', '#083A85', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  // Transform recent bookings for activity section
  const transformRecentActivity = (bookings: any) => {
    if (!bookings || bookings.length === 0) return [];

    return bookings.slice(0, 4).map((booking: any) => ({
      guest: booking.guestName || booking.user?.name || 'Guest',
      message: booking.specialRequests || booking.notes || 'New booking confirmed',
      time: new Date(booking.createdAt).toLocaleTimeString(),
      type: booking.status === 'confirmed' ? 'booking' : 'inquiry'
    }));
  };

  // Transform upcoming check-ins
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

  if (loading) {
    return (
      <div className="mt-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F20C8F] mx-auto mb-2"></div>
          <p className="text-gray-600 text-xs">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-red-100 rounded-xl">
              <i className="bi bi-exclamation-triangle text-red-600 text-base" />
            </div>
            <h2 className="text-red-800 font-semibold mb-2 text-sm">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-2 text-xs">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-[#F20C8F] to-[#d10a7a] text-white px-3 py-2 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs focus:border-transparent"
            >
              <i className="bi bi-arrow-clockwise mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for UI
  const chartEarningsData = transformEarningsData(dashboardData?.monthlyEarnings);
  const chartBookingsData = transformPropertyBookingsData(dashboardData?.propertyPerformance);
  const propertyTypes = getPropertyTypes(propertiesData);
  const recentActivity = transformRecentActivity(bookingsData);
  const upcomingCheckIns = transformUpcomingCheckIns(dashboardData?.upcomingCheckIns);

  // Summary cards data
  const summaryCards = [
    {
      title: 'Active Properties',
      value: dashboardData?.activeProperties?.toString() || '0',
      change: `${dashboardData?.totalProperties || 0} total properties`,
      icon: 'house-door',
      bgColor: 'bg-pink-500',
      iconBg: '#F20C8F',
    },
    {
      title: 'Total Guests',
      value: dashboardData?.totalGuests?.toString() || '0',
      change: `${dashboardData?.totalBookings || 0} bookings`,
      icon: 'people',
      bgColor: 'bg-blue-800',
      iconBg: '#083A85',
    },
    {
      title: 'Total Revenue',
      value: `$${dashboardData?.totalRevenue?.toLocaleString() || '0'}`,
      change: 'All time earnings',
      icon: 'currency-dollar',
      bgColor: 'bg-green-500',
      iconBg: '#10B981',
    },
    {
      title: 'Average Rating',
      value: dashboardData?.averageRating?.toFixed(1) || '0.0',
      change: `${dashboardData?.pendingReviews || 0} pending reviews`,
      icon: 'star',
      bgColor: 'bg-amber-500',
      iconBg: '#F59E0B',
    },
  ];

  // Recent reviews (from recent bookings with reviews)
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

  // Quick stats
  const quickStats = [
    {
      label: 'Bookings Completed',
      value: dashboardData?.completedBookings?.toString() || '0',
      icon: 'check-circle'
    },
    {
      label: 'Occupancy Rate',
      value: `${dashboardData?.occupancyRate || 0}%`,
      icon: 'graph-up'
    },
    {
      label: 'Repeat Guests',
      value: `${dashboardData?.repeatGuestRate || 0}%`,
      icon: 'arrow-repeat'
    },
    {
      label: 'Response Time',
      value: dashboardData?.averageResponseTime || '< 1hr',
      icon: 'clock'
    },
  ];

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
    <div className="mt-20">
      <div className="max-w-7xl mx-auto px-3">

        {/* Header */}
        <div className="mb-3">
          <h1 className="text-base lg:text-lg font-semibold text-[#083A85] mb-1">
            {getTimeBasedGreeting()}, {userName}
          </h1>
          <p className="text-gray-600 text-xs">Here's what's happening with your property business</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {summaryCards.map((card, index) => (
            <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden border border-gray-100">
              <div className="absolute top-1 right-1 opacity-5 text-2xl">
                <i className={`bi bi-${card.icon}`} />
              </div>
              <div className="flex items-center mb-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 text-white shadow-md bg-gradient-to-br"
                  style={{ background: `linear-gradient(to bottom right, ${card.iconBg}, ${card.iconBg}dd)` }}
                >
                  <i className={`bi bi-${card.icon} text-xs`} />
                </div>
                <span className="text-xs text-gray-600 font-semibold">{card.title}</span>
              </div>
              <div className="text-base lg:text-lg font-bold mb-1 text-gray-800">{card.value}</div>
              <div className="text-xs text-green-600 flex items-center font-semibold">
                <i className="bi bi-arrow-up mr-1" />
                {card.change}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
          {/* Earnings Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center text-gray-800">
                <i className="bi bi-graph-up mr-2 text-[#F20C8F]" />
                Monthly Earnings
              </h3>
              <div className="text-xs text-gray-500">
                <i className="bi bi-three-dots" />
              </div>
            </div>
            <div className="h-48 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#F20C8F"
                    strokeWidth={3}
                    dot={{ fill: '#F20C8F', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#F20C8F', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Property Bookings Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center text-gray-800">
                <i className="bi bi-bar-chart mr-2 text-[#083A85]" />
                Weekly Property Bookings
              </h3>
              <div className="text-xs text-gray-500">
                <i className="bi bi-three-dots" />
              </div>
            </div>
            <div className="h-48 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartBookingsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="bookings" fill="#083A85" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Properties & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* Today's Check-ins */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 h-max border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center text-gray-800">
                <i className="bi bi-calendar-week mr-2 text-green-600" />
                Upcoming Check-ins
              </h3>
              <button className="text-xs text-[#083A85] hover:text-blue-900 hover:shadow-md hover:-translate-y-0.5 font-semibold cursor-pointer transition-all duration-200 focus:border-transparent" onClick={() => { router.push('/host/calendar') }}>
                View Calendar
              </button>
            </div>
            <div className="space-y-2">
              {upcomingCheckIns.length > 0 ? upcomingCheckIns.map((checkin: any, index: number) => (
                <div key={index} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all duration-200">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-xs">{checkin.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{checkin.guest}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${checkin.status === 'confirmed' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800' : 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800'
                      }`}>
                      {checkin.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{checkin.time} • {checkin.duration}</span>
                    <span>{checkin.guests} guests</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="bi bi-calendar-x text-xl mb-2" />
                  <p className="text-xs">No upcoming check-ins</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center text-gray-800">
                <i className="bi bi-chat-dots mr-2 text-blue-600" />
                Recent Activity
              </h3>
              <button className="text-xs text-[#083A85] hover:text-blue-900 hover:shadow-md hover:-translate-y-0.5 font-semibold cursor-pointer transition-all duration-200 focus:border-transparent" onClick={() => { router.push('/host/bookings') }}>
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.length > 0 ? recentActivity.map((activity: any, index: number) => (
                <div key={index} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all duration-200">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-xs">{activity.guest}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.message}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activity.type === 'booking' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800' :
                        activity.type === 'inquiry' ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800' : 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800'
                      }`}>
                      {activity.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="bi bi-chat-square-dots text-xl mb-2" />
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Property Types */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 h-max border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center text-gray-800">
                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                Property Types
              </h3>
            </div>
            <div className="h-44 sm:h-48">
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
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {propertyTypes.map((type: any, index) => (
                <div key={index} className="flex items-center text-xs font-semibold">
                  <div
                    className="w-3 h-3 mr-1 rounded-sm"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  {type.name} ({type.value})
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 lg:col-span-2 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center text-gray-800">
                <i className="bi bi-star mr-2 text-amber-500" />
                Recent Reviews
              </h3>
              <button className="text-xs text-[#083A85] hover:text-blue-900 hover:shadow-md hover:-translate-y-0.5 font-semibold cursor-pointer transition-all duration-200 focus:border-transparent" onClick={() => { router.push('/host/reviews') }}>
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentReviews.length > 0 ? recentReviews.map((review: any, index: number) => (
                <div key={index} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all duration-200">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="font-semibold text-gray-800 text-xs mr-2">{review.guest}</h4>
                        <div className="flex items-center">
                          {[...Array(review.rating)].map((_, i) => (
                            <i key={i} className="bi bi-star-fill text-yellow-500 text-xs" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{review.comment}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{review.property}</span>
                        <span>{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="bi bi-star text-xl mb-2" />
                  <p className="text-xs">No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">Performance Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center p-2 rounded-xl hover:bg-gray-50/80 transition-all duration-200">
                <div className="text-lg lg:text-xl mb-1 text-gray-600">
                  <i className={`bi bi-${stat.icon}`} />
                </div>
                <div className="text-sm lg:text-base font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;