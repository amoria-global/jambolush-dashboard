"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '@/app/api/apiService';

// Types based on your backend service
interface EnhancedHostDashboard {
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  recentBookings: Array<{
    id: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    status: string;
  }>;
  propertyPerformance: Array<{
    id: number;
    name: string;
    bookings: number;
    revenue: number;
    occupancy: number;
    rating: number;
  }>;
  upcomingCheckIns: Array<{
    id: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    guests: number;
  }>;
  pendingReviews: number;
  quickStats?: {
    todayCheckIns: number;
    todayCheckOuts: number;
    occupiedProperties: number;
    pendingActions: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'booking' | 'review' | 'check_in' | 'check_out' | 'cancellation';
    title: string;
    description: string;
    timestamp: string;
    propertyId?: number;
    bookingId?: string;
    isRead: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    action?: string;
    actionUrl?: string;
  }>;
  marketTrends: {
    demandTrend: 'increasing' | 'stable' | 'decreasing';
    averagePrice: number;
    competitorActivity: string;
  };
}

interface EarningsOverview {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  averageNightlyRate: number;
  occupancyRate: number;
  revenueGrowth: number;
}

interface EarningsBreakdown {
  propertyId: number;
  propertyName: string;
  totalEarnings: number;
  monthlyEarnings: number;
  bookingsCount: number;
  averageBookingValue: number;
  occupancyRate: number;
  lastBooking?: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  
  // States
  const [dashboardData, setDashboardData] = useState<EnhancedHostDashboard | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsOverview | null>(null);
  const [earningsBreakdown, setEarningsBreakdown] = useState<EarningsBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Chart data state
  const [chartData, setChartData] = useState({
    earnings: [] as Array<{ month: string; amount: number; bookings: number }>,
    bookings: [] as Array<{ day: string; bookings: number; revenue: number }>,
    propertyTypes: [] as Array<{ name: string; value: number; color: string }>
  });

  // Default/fallback data for missing properties
  const getDefaultQuickStats = () => ({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    occupiedProperties: 0,
    pendingActions: 0
  });

  const getDefaultDashboardData = (): Partial<EnhancedHostDashboard> => ({
    totalProperties: 0,
    activeProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    recentBookings: [],
    propertyPerformance: [],
    upcomingCheckIns: [],
    pendingReviews: 0,
    quickStats: getDefaultQuickStats(),
    recentActivity: [],
    alerts: [],
    marketTrends: {
      demandTrend: 'stable' as const,
      averagePrice: 0,
      competitorActivity: ''
    }
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize with default data
      let tempDashboardData = getDefaultDashboardData() as EnhancedHostDashboard;
      let dashboardResponse: any = null; // Declare the variable here

      try {
        // Fetch enhanced dashboard data
        dashboardResponse = await api.get('/properties/host/dashboard/enhanced');
        if (dashboardResponse.data) {
          tempDashboardData = {
            ...tempDashboardData,
            ...dashboardResponse.data,
            quickStats: dashboardResponse.data.quickStats || getDefaultQuickStats()
          };
        }
      } catch (err) {
        console.warn('Enhanced dashboard data not available:', err);
      }

      try {
        // Fetch earnings overview
        const earningsResponse = await api.get('/properties/host/earnings');
        if (earningsResponse.data) {
          setEarningsData(earningsResponse.data);
        }
      } catch (err) {
        console.warn('Earnings overview not available:', err);
      }

      try {
        // Fetch earnings breakdown
        const breakdownResponse = await api.get('/properties/host/earnings/breakdown');
        if (breakdownResponse.data) {
          setEarningsBreakdown(breakdownResponse.data);
          
          // If we don't have dashboard data, derive some stats from earnings breakdown
          if (!dashboardResponse?.data) {
            tempDashboardData.totalProperties = breakdownResponse.data.length;
            tempDashboardData.activeProperties = breakdownResponse.data.filter(
              (prop: EarningsBreakdown) => prop.totalEarnings > 0
            ).length;
            tempDashboardData.totalRevenue = breakdownResponse.data.reduce(
              (sum: number, prop: EarningsBreakdown) => sum + prop.totalEarnings, 0
            );
          }
        }
      } catch (err) {
        console.warn('Earnings breakdown not available:', err);
      }

      setDashboardData(tempDashboardData);

      // Generate chart data (you might want to fetch this from specific endpoints)
      generateChartData();

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Generate sample chart data (replace with API data)
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const earnings = months.map(month => ({
      month,
      amount: Math.floor(Math.random() * 5000) + 2000,
      bookings: Math.floor(Math.random() * 50) + 10
    }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bookings = days.map(day => ({
      day,
      bookings: Math.floor(Math.random() * 30) + 5,
      revenue: Math.floor(Math.random() * 2000) + 500
    }));

    const propertyTypes = [
      { name: 'Houses', value: 12, color: '#F20C8F' },
      { name: 'Apartments', value: 8, color: '#083A85' },
      { name: 'Villas', value: 4, color: '#10B981' },
    ];

    setChartData({ earnings, bookings, propertyTypes });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return 'bi-calendar-plus';
      case 'review': return 'bi-star-fill';
      case 'check_in': return 'bi-box-arrow-in-right';
      case 'check_out': return 'bi-box-arrow-right';
      case 'cancellation': return 'bi-x-circle';
      default: return 'bi-bell';
    }
  };

  // Get activity color
  const getActivityColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600';
    
    switch (type) {
      case 'booking': return 'text-green-600';
      case 'review': return 'text-yellow-600';
      case 'check_in': return 'text-blue-600';
      case 'check_out': return 'text-purple-600';
      case 'cancellation': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('amount') || entry.name.includes('revenue') ? '$' : ''}{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <i className="bi bi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">No dashboard data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Safe access to nested properties with fallbacks
  const quickStats = dashboardData.quickStats || getDefaultQuickStats();
  const alerts = dashboardData.alerts || [];
  const recentActivity = dashboardData.recentActivity || [];
  const propertyPerformance = dashboardData.propertyPerformance || [];
  const recentBookings = dashboardData.recentBookings || [];
  const upcomingCheckIns = dashboardData.upcomingCheckIns || [];

  return (
    <div className="pt-14">
      <div className="mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Host Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your properties.</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                alert.type === 'error' ? 'bg-red-50 border-red-200' :
                alert.type === 'success' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  {alert.action && (
                    <button
                      onClick={() => alert.actionUrl && router.push(alert.actionUrl)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      {alert.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Check-ins</p>
                <p className="text-2xl font-bold text-blue-600">{quickStats.todayCheckIns}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="bi bi-box-arrow-in-right text-xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Check-outs</p>
                <p className="text-2xl font-bold text-green-600">{quickStats.todayCheckOuts}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="bi bi-box-arrow-right text-xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Occupied Properties</p>
                <p className="text-2xl font-bold text-purple-600">{quickStats.occupiedProperties}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="bi bi-house-check text-xl text-purple-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Actions</p>
                <p className="text-2xl font-bold text-orange-600">{quickStats.pendingActions}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <i className="bi bi-exclamation-triangle text-xl text-orange-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(earningsData?.totalEarnings || dashboardData.totalRevenue || 0)}</p>
                {earningsData?.revenueGrowth && (
                  <p className="text-sm text-green-600 mt-1">+{earningsData.revenueGrowth.toFixed(1)}% growth</p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="bi bi-currency-dollar text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.totalProperties || 0}</p>
                <p className="text-sm text-blue-600 mt-1">{dashboardData.activeProperties || 0} active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="bi bi-house-door text-2xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.totalBookings || 0}</p>
                <p className="text-sm text-purple-600 mt-1">This {selectedTimeRange}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="bi bi-calendar-check text-2xl text-purple-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{(dashboardData.averageRating || 0).toFixed(1)}</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="bi bi-star-fill text-xs"></i>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{dashboardData.pendingReviews || 0} pending</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="bi bi-star-fill text-2xl text-yellow-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Earnings Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-graph-up mr-2 text-green-600"></i>
                Monthly Earnings
              </h3>
              <button
                onClick={() => router.push('/host/analytics')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.earnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-bar-chart mr-2 text-blue-600"></i>
                Weekly Bookings
              </h3>
              <button
                onClick={() => router.push('/host/bookings')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.bookings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" fill="#083A85" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Property Performance & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Property Performance */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-house mr-2 text-purple-600"></i>
                Property Performance
              </h3>
              <button
                onClick={() => router.push('/host/properties')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage Properties
              </button>
            </div>
            <div className="space-y-4">
              {propertyPerformance.length > 0 ? propertyPerformance.slice(0, 4).map((property) => (
                <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{property.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{property.bookings} bookings</span>
                      <span>{formatCurrency(property.revenue)}</span>
                      <div className="flex items-center">
                        <i className="bi bi-star-fill text-yellow-400 mr-1"></i>
                        {property.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{property.occupancy.toFixed(0)}%</div>
                    <div className="text-xs text-gray-500">occupancy</div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="bi bi-house text-4xl mb-2"></i>
                  <p>No property performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-clock-history mr-2 text-orange-600"></i>
                Recent Activity
              </h3>
              <button
                onClick={() => router.push('/host/activity')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`mr-3 mt-1 ${getActivityColor(activity.type, activity.priority)}`}>
                    <i className={`bi ${getActivityIcon(activity.type)} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                  </div>
                  {!activity.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  )}
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="bi bi-clock-history text-4xl mb-2"></i>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings & Upcoming Check-ins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-calendar-plus mr-2 text-green-600"></i>
                Recent Bookings
              </h3>
              <button
                onClick={() => router.push('/host/bookings')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentBookings.length > 0 ? recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{booking.guestName}</h4>
                    <p className="text-sm text-gray-600">{booking.propertyName}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(booking.totalPrice)}</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="bi bi-calendar-plus text-4xl mb-2"></i>
                  <p>No recent bookings</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Check-ins */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-calendar-event mr-2 text-blue-600"></i>
                Upcoming Check-ins
              </h3>
              <button
                onClick={() => router.push('/host/calendar')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Calendar
              </button>
            </div>
            <div className="space-y-3">
              {upcomingCheckIns.length > 0 ? upcomingCheckIns.slice(0, 5).map((checkin) => (
                <div key={checkin.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{checkin.guestName}</h4>
                    <p className="text-sm text-gray-600">{checkin.propertyName}</p>
                    <p className="text-xs text-gray-500">{checkin.guests} guests</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">{formatDate(checkin.checkIn)}</div>
                    <div className="text-xs text-gray-500">check-in</div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <i className="bi bi-calendar-event text-4xl mb-2"></i>
                  <p>No upcoming check-ins</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Earnings Overview */}
        {earningsData && (
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <i className="bi bi-graph-up-arrow mr-2 text-green-600"></i>
                Earnings Overview
              </h3>
              <button
                onClick={() => router.push('/host/earnings')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Monthly Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earningsData.monthlyEarnings)}</p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Avg. Nightly Rate</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(earningsData.averageNightlyRate)}</p>
                <p className="text-xs text-gray-500">per night</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
                <p className="text-2xl font-bold text-purple-600">{earningsData.occupancyRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">of available nights</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Revenue Growth</p>
                <p className={`text-2xl font-bold ${earningsData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {earningsData.revenueGrowth >= 0 ? '+' : ''}{earningsData.revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">this month</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            <i className="bi bi-lightning mr-2 text-yellow-600"></i>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/host/properties/add')}
              className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <i className="bi bi-plus-circle text-2xl text-blue-600 mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900">Add Property</p>
            </button>
            <button
              onClick={() => router.push('/host/guests')}
              className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <i className="bi bi-people text-2xl text-green-600 mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900">Manage Guests</p>
            </button>
            <button
              onClick={() => router.push('/host/calendar')}
              className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <i className="bi bi-calendar text-2xl text-purple-600 mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900">View Calendar</p>
            </button>
            <button
              onClick={() => router.push('/host/analytics')}
              className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <i className="bi bi-bar-chart text-2xl text-orange-600 mb-2 group-hover:scale-110 transition-transform"></i>
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;