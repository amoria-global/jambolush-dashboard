'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '@/app/api/apiService';

const HostAnalyticsPage = () => {
    const router = useRouter();
    
    // State for analytics data
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [earningsData, setEarningsData] = useState<any>(null);
    const [propertiesData, setPropertiesData] = useState<any>([]);
    const [bookingsData, setBookingsData] = useState<any>([]);
    const [guestData, setGuestData] = useState<any>(null);
    const [loading, setLoading] = useState<any>(true);
    const [error, setError] = useState<any>(null);
    const [timeRange, setTimeRange] = useState('month');
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    const [userName, setUserName] = useState('Host');

    // Fetch all analytics data
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);

                const user = JSON.parse(localStorage.getItem('userSession') || '{}');
                if (user.name) {
                    setUserName(user.name);
                }

                // Fetch main analytics data
                const analyticsResponse = await api.get('/properties/host/analytics', {
                    params: { timeRange }
                });
                setAnalyticsData(analyticsResponse.data.data);

                // Fetch earnings data
                const earningsResponse = await api.get('/properties/host/earnings');
                setEarningsData(earningsResponse.data.data);

                // Fetch earnings breakdown
                const breakdownResponse = await api.get('/properties/host/earnings/breakdown');
                setPropertiesData(breakdownResponse.data.data);

                // Fetch bookings data
                const bookingsResponse = await api.get('/properties/host/bookings');
                setBookingsData(bookingsResponse.data.data.bookings);

                // Fetch guest data
                const guestResponse = await api.get('/properties/host/guests');
                setGuestData(guestResponse.data.data);

            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [timeRange]);

    // Transform revenue data for chart
    const transformRevenueData = (revenueData: any) => {
        if (!revenueData?.monthlyRevenue || revenueData.monthlyRevenue.length === 0) {
            return [];
        }
        
        return revenueData.monthlyRevenue.map((item: any) => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
            revenue: item.revenue || 0,
            bookings: item.bookings || 0
        }));
    };

    // Transform booking trends data for chart
    const transformBookingTrends = (bookingTrends: any) => {
        if (!bookingTrends || bookingTrends.length === 0) {
            return [];
        }
        
        return bookingTrends.map((item: any, index: number) => ({
            date: item.date || `Day ${index + 1}`,
            bookings: item.bookings || 0,
            cancellations: item.cancellations || 0
        }));
    };

    // Transform property revenue breakdown
    const getPropertyRevenueBreakdown = (properties: any) => {
        if (!properties || properties.length === 0) {
            return [];
        }

        const colors = ['#14B8A6', '#083A85', '#F20C8F', '#6B7280', '#8B5CF6', '#EF4444'];
        const totalRevenue = properties.reduce((sum: number, prop: any) => sum + (prop.totalEarnings || 0), 0);
        
        return properties.map((property: any, index: number) => ({
            name: property.propertyName || `Property ${index + 1}`,
            value: property.totalEarnings || 0,
            percentage: totalRevenue > 0 ? ((property.totalEarnings || 0) / totalRevenue * 100) : 0,
            color: colors[index % colors.length]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading your insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="bi bi-exclamation-triangle text-2xl text-red-500"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load analytics</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2 bg-gradient-to-r from-[#F20C8F] to-pink-500 text-white font-medium rounded-full hover:shadow-lg transition-all duration-200"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const revenueChartData = transformRevenueData(analyticsData?.revenueAnalytics);
    const bookingTrendsData = transformBookingTrends(analyticsData?.bookingTrends);
    const propertyBreakdown = getPropertyRevenueBreakdown(propertiesData);

    // Overview stats
    const overview = analyticsData?.overview || {};
    const marketComparison = analyticsData?.marketComparison || {};
    const guestInsights = analyticsData?.guestInsights || guestData || {};

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-4 py-3 rounded-xl shadow-xl border border-gray-100">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm flex items-center justify-between gap-3">
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-medium" style={{ color: entry.color }}>
                                {entry.name.toLowerCase().includes('revenue') ? '$' : ''}{entry.value?.toLocaleString() || 0}
                                {entry.name.toLowerCase().includes('rate') ? '%' : ''}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    
    return (
        <div className="py-8">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                          

                {/* Time Range Pills */}
                <div className="mb-8">
                    <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
                        {['week', 'month', 'quarter', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                    timeRange === range
                                        ? 'bg-gradient-to-r from-[#14B8A6] to-teal-500 text-white shadow-md'
                                        : 'text-gray-700 hover:text-gray-900'
                                }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
               
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl flex items-center justify-center">
                                <i className="bi bi-currency-dollar text-xl text-teal-600"/>
                            </div>
                            {overview.revenueGrowth !== undefined && (
                                <span className={`text-sm font-semibold ${overview.revenueGrowth >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                                    {overview.revenueGrowth >= 0 ? '+' : ''}{overview.revenueGrowth}%
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Total revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            ${(overview.totalRevenue || earningsData?.totalEarnings || 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                                <i className="bi bi-calendar-check text-xl text-[#083A85]"/>
                            </div>
                            {overview.bookingGrowth !== undefined && (
                                <span className={`text-sm font-semibold ${overview.bookingGrowth >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                                    {overview.bookingGrowth >= 0 ? '+' : ''}{overview.bookingGrowth}%
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Total bookings</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {overview.totalBookings || bookingsData?.length || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl flex items-center justify-center">
                                <i className="bi bi-bar-chart text-xl text-[#F20C8F]"/>
                            </div>
                            {overview.occupancyGrowth !== undefined && (
                                <span className={`text-sm font-semibold ${overview.occupancyGrowth >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                                    {overview.occupancyGrowth >= 0 ? '+' : ''}{overview.occupancyGrowth}%
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Occupancy rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {(overview.occupancyRate || earningsData?.occupancyRate || 0).toFixed(1)}%
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center">
                                <i className="bi bi-star-fill text-xl text-amber-500"/>
                            </div>
                            {overview.ratingGrowth !== undefined && (
                                <span className={`text-sm font-semibold ${overview.ratingGrowth >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                                    {overview.ratingGrowth >= 0 ? '+' : ''}{overview.ratingGrowth}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Average rating</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {overview.averageRating ? (
                                <>
                                    {overview.averageRating.toFixed(1)}
                                    <span className="text-sm text-gray-500 ml-1">/ 5.0</span>
                                </>
                            ) : (
                                'N/A'
                            )}
                        </p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Trends */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Revenue trends</h3>
                                <p className="text-sm text-gray-600 mt-1">Monthly performance overview</p>
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['revenue', 'bookings'].map((metric) => (
                                    <button
                                        key={metric}
                                        onClick={() => setSelectedMetric(metric)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                            selectedMetric === metric
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-64">
                            {revenueChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey="month" 
                                            tick={{ fontSize: 12, fill: '#6B7280' }} 
                                            axisLine={{ stroke: '#E5E7EB' }} 
                                            tickLine={false} 
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 12, fill: '#6B7280' }} 
                                            axisLine={{ stroke: '#E5E7EB' }} 
                                            tickLine={false} 
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey={selectedMetric}
                                            stroke="#14B8A6"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <i className="bi bi-graph-up text-4xl mb-3" />
                                    <p className="text-sm">No data available for this period</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Performance */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Booking performance</h3>
                            <p className="text-sm text-gray-600 mt-1">Bookings vs cancellations</p>
                        </div>
                        <div className="h-64">
                            {bookingTrendsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bookingTrendsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 12, fill: '#6B7280' }} 
                                            axisLine={{ stroke: '#E5E7EB' }} 
                                            tickLine={false} 
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 12, fill: '#6B7280' }} 
                                            axisLine={{ stroke: '#E5E7EB' }} 
                                            tickLine={false} 
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="bookings" fill="#083A85" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="cancellations" fill="#F20C8F" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <i className="bi bi-bar-chart text-4xl mb-3" />
                                    <p className="text-sm">No data available for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Properties Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Property performance</h3>
                                <p className="text-sm text-gray-600 mt-1">Your top performing properties</p>
                            </div>
                            <button 
                                className="text-sm font-medium text-[#14B8A6] hover:text-teal-700 transition-colors"
                                onClick={() => router.push('/host/properties')}
                            >
                                View all properties →
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-700 uppercase tracking-wider">Property</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-700 uppercase tracking-wider">Bookings</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-700 uppercase tracking-wider">Revenue</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-700 uppercase tracking-wider">Occupancy</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-700 uppercase tracking-wider">Rating</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-700 uppercase tracking-wider">Avg/Night</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {propertiesData && propertiesData.length > 0 ? (
                                    propertiesData.slice(0, 5).map((property: any, index: number) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900">{property.propertyName || `Property ${index + 1}`}</div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-700">{property.bookingsCount || 0}</td>
                                            <td className="py-4 px-6 text-gray-900 font-medium">${(property.totalEarnings || 0).toLocaleString()}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-[#14B8A6] to-teal-500 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${property.occupancyRate || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 w-12">{(property.occupancyRate || 0).toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {property.averageRating ? (
                                                    <div className="flex items-center gap-1">
                                                        <i className="bi bi-star-fill text-amber-400"></i>
                                                        <span className="font-medium text-gray-900">{property.averageRating.toFixed(1)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-gray-700">${(property.averageBookingValue || 0).toFixed(0)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="flex flex-col items-center text-gray-400">
                                                <i className="bi bi-house text-4xl mb-3" />
                                                <p className="text-sm">No properties to display</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Guest Insights */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Guest insights</h3>
                            <p className="text-sm text-gray-600 mt-1">Understanding your guests</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-gray-900">{guestInsights.totalGuests || 0}</p>
                                <p className="text-xs text-gray-600 mt-1">Total guests</p>
                            </div>
                            <div className="bg-teal-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-teal-600">{guestInsights.returningGuests || 0}</p>
                                <p className="text-xs text-gray-600 mt-1">Returning</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(guestInsights.guestSatisfaction?.averageRating || overview.averageRating) && (
                                <div className="pb-4 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Guest satisfaction</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`bi bi-star-fill text-sm ${
                                                    i < Math.floor(guestInsights.guestSatisfaction?.averageRating || overview.averageRating || 0) 
                                                        ? 'text-amber-400' 
                                                        : 'text-gray-200'
                                                }`}></i>
                                            ))}
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            {(guestInsights.guestSatisfaction?.averageRating || overview.averageRating).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {guestInsights.averageStayDuration && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Average stay duration</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900">{guestInsights.averageStayDuration.toFixed(1)}</span>
                                        <span className="text-sm text-gray-600">nights</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Distribution */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 lg:col-span-2">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Revenue distribution</h3>
                            <p className="text-sm text-gray-600 mt-1">Income breakdown by property</p>
                        </div>
                        {propertyBreakdown.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={propertyBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {propertyBreakdown.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3">
                                    {propertyBreakdown.slice(0, 5).map((property: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: property.color }}
                                                ></div>
                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                    {property.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">${property.value.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{property.percentage.toFixed(0)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <i className="bi bi-pie-chart text-4xl mb-3" />
                                <p className="text-sm">No revenue data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostAnalyticsPage;