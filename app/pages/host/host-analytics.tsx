//app/pages/host/host-analytics.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '@/app/api/apiService';

// Types based on your backend service
interface AnalyticsOverview {
  totalViews: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  occupancyRate: number;
  conversionRate: number;
  repeatGuestRate: number;
  timeRange: string;
}

interface PropertyPerformanceMetrics {
  propertyId: number;
  propertyName: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  occupancyRate: number;
  views: number;
  conversionRate: number;
}

interface BookingTrendData {
  date: string;
  bookings: number;
  revenue: number;
  cancellations: number;
}

interface GuestAnalytics {
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  averageStayDuration: number;
  guestDemographics: {
    ageGroups: Array<{ group: string; count: number }>;
    countries: Array<{ country: string; count: number }>;
    purposes: Array<{ purpose: string; count: number }>;
  };
  guestSatisfaction: {
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
    commonComplaints: string[];
    commonPraises: string[];
  };
}

interface RevenueAnalytics {
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  revenueByProperty: Array<{ propertyName: string; revenue: number; percentage: number }>;
  seasonalTrends: Array<{ season: string; revenue: number; bookings: number }>;
  pricingOptimization: Array<{ suggestion: string; impact: string }>;
}

interface HostAnalytics {
  overview: AnalyticsOverview;
  propertyPerformance: PropertyPerformanceMetrics[];
  bookingTrends: BookingTrendData[];
  guestInsights: GuestAnalytics;
  revenueAnalytics: RevenueAnalytics;
  marketComparison: {
    averagePrice: number;
    myAveragePrice: number;
    occupancyRate: number;
    myOccupancyRate: number;
    competitorCount: number;
    marketPosition: 'premium' | 'mid_range' | 'budget';
    opportunities: string[];
  };
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const HostAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<HostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'occupancy'>('revenue');

  // Default values for missing data
  const defaultOverview: AnalyticsOverview = {
    totalViews: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    occupancyRate: 0,
    conversionRate: 0,
    repeatGuestRate: 0,
    timeRange: 'month'
  };

  const defaultGuestInsights: GuestAnalytics = {
    totalGuests: 0,
    newGuests: 0,
    returningGuests: 0,
    averageStayDuration: 0,
    guestDemographics: {
      ageGroups: [],
      countries: [],
      purposes: []
    },
    guestSatisfaction: {
      averageRating: 0,
      ratingDistribution: [],
      commonComplaints: [],
      commonPraises: []
    }
  };

  const defaultRevenueAnalytics: RevenueAnalytics = {
    monthlyRevenue: [],
    revenueByProperty: [],
    seasonalTrends: [],
    pricingOptimization: []
  };

  const defaultMarketComparison = {
    averagePrice: 0,
    myAveragePrice: 0,
    occupancyRate: 0,
    myOccupancyRate: 0,
    competitorCount: 0,
    marketPosition: 'mid_range' as const,
    opportunities: []
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/properties/host/analytics', {
        params: { timeRange }
      });

      if (response.data) {
        // Ensure all required properties exist with default values
        const safeAnalytics: HostAnalytics = {
          overview: { ...defaultOverview, ...response.data.overview },
          propertyPerformance: response.data.propertyPerformance || [],
          bookingTrends: response.data.bookingTrends || [],
          guestInsights: { 
            ...defaultGuestInsights, 
            ...response.data.guestInsights,
            guestDemographics: {
              ...defaultGuestInsights.guestDemographics,
              ...response.data.guestInsights?.guestDemographics
            },
            guestSatisfaction: {
              ...defaultGuestInsights.guestSatisfaction,
              ...response.data.guestInsights?.guestSatisfaction
            }
          },
          revenueAnalytics: { ...defaultRevenueAnalytics, ...response.data.revenueAnalytics },
          marketComparison: { ...defaultMarketComparison, ...response.data.marketComparison }
        };
        
        setAnalytics(safeAnalytics);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? '$' : ''}{entry.value?.toLocaleString() || 0}
              {entry.name.includes('Rate') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <span className="ml-3 text-lg text-gray-600">Loading analytics...</span>
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
            <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Additional safety check - ensure analytics and its properties exist
  if (!analytics || !analytics.overview) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">No analytics data available</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe access with default values
  const overview = analytics.overview || defaultOverview;
  const guestInsights = analytics.guestInsights || defaultGuestInsights;
  const revenueAnalytics = analytics.revenueAnalytics || defaultRevenueAnalytics;
  const marketComparison = analytics.marketComparison || defaultMarketComparison;

  return (
    <div className="pt-14">
      <div className="mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Detailed insights into your property performance</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${(overview.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">+12.5% vs last period</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="bi bi-currency-dollar text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{overview.totalBookings || 0}</p>
                <p className="text-sm text-blue-600 mt-1">+8.3% vs last period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="bi bi-calendar-check text-2xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
                <p className="text-3xl font-bold text-gray-900">{(overview.occupancyRate || 0).toFixed(1)}%</p>
                <p className="text-sm text-purple-600 mt-1">+5.2% vs last period</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="bi bi-bar-chart text-2xl text-purple-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{(overview.averageRating || 0).toFixed(1)}</p>
                <p className="text-sm text-yellow-600 mt-1">+0.2 vs last period</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="bi bi-star-fill text-2xl text-yellow-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
              <div className="flex gap-2">
                {(['revenue', 'bookings'] as const).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric as any)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedMetric === metric
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueAnalytics.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#083A85"
                    fill="#083A85"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.bookingTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" fill="#F20C8F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancellations" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Property Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Property</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Bookings</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Occupancy</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.propertyPerformance || []).length > 0 ? (
                  analytics.propertyPerformance.map((property, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{property.propertyName}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{property.totalBookings}</td>
                      <td className="py-3 px-4 text-gray-700">${(property.totalRevenue || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${property.occupancyRate || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">{(property.occupancyRate || 0).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <i className="bi bi-star-fill text-yellow-400 mr-1"></i>
                          <span className="text-gray-700">{(property.averageRating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{(property.conversionRate || 0).toFixed(1)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No property performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Row - Guest Analytics and Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Guest Demographics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Guest Analytics</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{guestInsights.totalGuests || 0}</p>
                <p className="text-sm text-gray-600">Total Guests</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{guestInsights.returningGuests || 0}</p>
                <p className="text-sm text-gray-600">Returning Guests</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Guest Satisfaction</h4>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="bi bi-star-fill"></i>
                    ))}
                  </div>
                  <span className="font-medium">{(guestInsights.guestSatisfaction?.averageRating || 0).toFixed(1)}</span>
                  <span className="text-gray-600">average rating</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Average Stay Duration</h4>
                <p className="text-2xl font-bold text-blue-600">{(guestInsights.averageStayDuration || 0).toFixed(1)} days</p>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Property</h3>
            {revenueAnalytics.revenueByProperty && revenueAnalytics.revenueByProperty.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueAnalytics.revenueByProperty}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {revenueAnalytics.revenueByProperty.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#083A85', '#F20C8F', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {revenueAnalytics.revenueByProperty.slice(0, 3).map((property, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ['#083A85', '#F20C8F', '#10B981'][index] }}
                        ></div>
                        <span className="text-sm text-gray-700">{property.propertyName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{(property.percentage || 0).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Market Comparison */}
        {marketComparison && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Your Average Price</p>
                <p className="text-2xl font-bold text-blue-600">${(marketComparison.myAveragePrice || 0).toFixed(0)}</p>
                <p className="text-sm text-gray-500">vs ${(marketComparison.averagePrice || 0).toFixed(0)} market avg</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Your Occupancy Rate</p>
                <p className="text-2xl font-bold text-green-600">{(marketComparison.myOccupancyRate || 0).toFixed(1)}%</p>
                <p className="text-sm text-gray-500">vs {(marketComparison.occupancyRate || 0).toFixed(1)}% market avg</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Market Position</p>
                <p className="text-2xl font-bold text-purple-600 capitalize">{(marketComparison.marketPosition || 'mid_range').replace('_', ' ')}</p>
                <p className="text-sm text-gray-500">{marketComparison.competitorCount || 0} competitors nearby</p>
              </div>
            </div>
            
            {marketComparison.opportunities && marketComparison.opportunities.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Growth Opportunities</h4>
                <ul className="space-y-1">
                  {marketComparison.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-center">
                      <i className="bi bi-lightbulb mr-2"></i>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostAnalyticsPage;