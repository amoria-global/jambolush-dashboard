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

    // Transform revenue data for chart - no fallback data
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

    // Transform booking trends data for chart - no fallback data
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

    // Transform property revenue breakdown - no fallback data
    const getPropertyRevenueBreakdown = (properties: any) => {
        if (!properties || properties.length === 0) {
            return [];
        }

        const colors = ['#F20C8F', '#083A85', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
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
            <div className="mt-20 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-20 flex items-center justify-center min-h-screen">
                <div className="text-center text-red-600">
                    <i className="bi bi-exclamation-triangle text-4xl mb-4"></i>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const revenueChartData = transformRevenueData(analyticsData?.revenueAnalytics);
    const bookingTrendsData = transformBookingTrends(analyticsData?.bookingTrends);
    const propertyBreakdown = getPropertyRevenueBreakdown(propertiesData);

    // Overview stats - no fallback values
    const overview = analyticsData?.overview || {};
    const marketComparison = analyticsData?.marketComparison || {};
    const guestInsights = analyticsData?.guestInsights || guestData || {};

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.name.toLowerCase().includes('revenue') ? '$' : ''}{entry.value?.toLocaleString() || 0}
                            {entry.name.toLowerCase().includes('rate') ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };
    
    return (
        <div className="mt-20">
            <div className="max-w-7xl mx-auto">
                          
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-lg lg:text-3xl font-semibold text-[#083A85] mb-2">
                                Analytics Dashboard
                            </h1>
                            <p className="text-gray-600 text-md">Detailed insights into your property performance</p>
                        </div>
                        
                        {/* Time Range Selector */}
                        <div className="flex gap-2">
                            {['week', 'month', 'quarter', 'year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
               
                {/* Overview Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-5 text-4xl sm:text-5xl lg:text-6xl">
                            <i className="bi bi-currency-dollar" />
                        </div>
                        <div className="flex items-center mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 text-white bg-green-500">
                                <i className="bi bi-currency-dollar text-md sm:text-base"/>
                            </div>
                            <span className="text-md sm:text-md text-gray-600 font-medium">Total Revenue</span>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 text-gray-800">
                            ${(overview.totalRevenue || earningsData?.totalEarnings || 0).toLocaleString()}
                        </div>
                        {overview.revenueGrowth !== undefined && (
                            <div className={`text-md sm:text-md ${overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center font-medium`}>
                                <i className={`bi ${overview.revenueGrowth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                                {overview.revenueGrowth >= 0 ? '+' : ''}{overview.revenueGrowth}% vs last period
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-5 text-4xl sm:text-5xl lg:text-6xl">
                            <i className="bi bi-calendar-check" />
                        </div>
                        <div className="flex items-center mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 text-white bg-blue-800">
                                <i className="bi bi-calendar-check text-md sm:text-base"/>
                            </div>
                            <span className="text-md sm:text-md text-gray-600 font-medium">Total Bookings</span>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 text-gray-800">
                            {overview.totalBookings || bookingsData?.length || 0}
                        </div>
                        {overview.bookingGrowth !== undefined && (
                            <div className={`text-md sm:text-md ${overview.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center font-medium`}>
                                <i className={`bi ${overview.bookingGrowth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                                {overview.bookingGrowth >= 0 ? '+' : ''}{overview.bookingGrowth}% vs last period
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-5 text-4xl sm:text-5xl lg:text-6xl">
                            <i className="bi bi-bar-chart" />
                        </div>
                        <div className="flex items-center mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 text-white bg-purple-600">
                                <i className="bi bi-bar-chart text-md sm:text-base"/>
                            </div>
                            <span className="text-md sm:text-md text-gray-600 font-medium">Occupancy Rate</span>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 text-gray-800">
                            {(overview.occupancyRate || earningsData?.occupancyRate || 0).toFixed(1)}%
                        </div>
                        {overview.occupancyGrowth !== undefined && (
                            <div className={`text-md sm:text-md ${overview.occupancyGrowth >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center font-medium`}>
                                <i className={`bi ${overview.occupancyGrowth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                                {overview.occupancyGrowth >= 0 ? '+' : ''}{overview.occupancyGrowth}% vs last period
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-5 text-4xl sm:text-5xl lg:text-6xl">
                            <i className="bi bi-star" />
                        </div>
                        <div className="flex items-center mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 text-white bg-amber-500">
                                <i className="bi bi-star text-md sm:text-base"/>
                            </div>
                            <span className="text-md sm:text-md text-gray-600 font-medium">Average Rating</span>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 text-gray-800">
                            {overview.averageRating ? overview.averageRating.toFixed(1) : 'N/A'}
                        </div>
                        {overview.ratingGrowth !== undefined && (
                            <div className={`text-md sm:text-md ${overview.ratingGrowth >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center font-medium`}>
                                <i className={`bi ${overview.ratingGrowth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                                {overview.ratingGrowth >= 0 ? '+' : ''}{overview.ratingGrowth} vs last period
                            </div>
                        )}
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    {/* Revenue Trends Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-graph-up mr-2 text-pink-500" />
                                Revenue Trends
                            </h3>
                            <div className="flex gap-2">
                                {['revenue', 'bookings'].map((metric) => (
                                    <button
                                        key={metric}
                                        onClick={() => setSelectedMetric(metric)}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            selectedMetric === metric
                                                ? 'bg-pink-100 text-pink-700'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            {revenueChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey={selectedMetric}
                                            stroke="#F20C8F"
                                            fill="#F20C8F"
                                            fillOpacity={0.1}
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <i className="bi bi-graph-up text-3xl mb-2" />
                                        <p>No revenue data available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Performance Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                Booking Performance
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            {bookingTrendsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bookingTrendsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="bookings" fill="#083A85" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="cancellations" fill="#EF4444" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <i className="bi bi-bar-chart text-3xl mb-2" />
                                        <p>No booking data available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Property Performance Table */}
                <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                            <i className="bi bi-house mr-2 text-purple-600" />
                            Property Performance
                        </h3>
                        <button 
                            className="text-md text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => router.push('/host/properties')}
                        >
                            View All
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Property</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bookings</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Occupancy</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Avg. Booking</th>
                                </tr>
                            </thead>
                            <tbody>
                                {propertiesData && propertiesData.length > 0 ? (
                                    propertiesData.slice(0, 5).map((property: any, index: number) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900">{property.propertyName || `Property ${index + 1}`}</div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-700">{property.bookingsCount || 0}</td>
                                            <td className="py-3 px-4 text-gray-700">${(property.totalEarnings || 0).toLocaleString()}</td>
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
                                                {property.averageRating ? (
                                                    <div className="flex items-center">
                                                        <i className="bi bi-star-fill text-yellow-400 mr-1"></i>
                                                        <span className="text-gray-700">{property.averageRating.toFixed(1)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-gray-700">${(property.averageBookingValue || 0).toFixed(0)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            <i className="bi bi-house text-3xl mb-2" />
                                            <p>No property performance data available</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Guest Analytics */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow h-max">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-people mr-2 text-blue-600" />
                                Guest Analytics
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xl font-bold text-gray-900">{guestInsights.totalGuests || 0}</p>
                                <p className="text-sm text-gray-600">Total Guests</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <p className="text-xl font-bold text-green-600">{guestInsights.returningGuests || 0}</p>
                                <p className="text-sm text-gray-600">Returning</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(guestInsights.guestSatisfaction?.averageRating || overview.averageRating) && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Guest Satisfaction</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className="bi bi-star-fill text-sm"></i>
                                            ))}
                                        </div>
                                        <span className="font-medium">{(guestInsights.guestSatisfaction?.averageRating || overview.averageRating).toFixed(1)}</span>
                                        <span className="text-gray-600 text-sm">average rating</span>
                                    </div>
                                </div>
                            )}

                            {guestInsights.averageStayDuration && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Average Stay</h4>
                                    <p className="text-xl font-bold text-blue-600">{guestInsights.averageStayDuration.toFixed(1)} days</p>
                                </div>
                            )}

                            {!guestInsights.totalGuests && !guestInsights.returningGuests && (
                                <div className="text-center py-4 text-gray-500">
                                    <i className="bi bi-people text-2xl mb-2" />
                                    <p>No guest data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                Revenue by Property
                            </h3>
                        </div>
                        {propertyBreakdown.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-48 sm:h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={propertyBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={70}
                                                paddingAngle={5}
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
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: property.color }}
                                                ></div>
                                                <span className="text-sm font-medium text-gray-700">{property.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">${property.value.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">{property.percentage.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="bi bi-pie-chart text-3xl mb-2" />
                                <p>No revenue data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Market Comparison */}
                {marketComparison && Object.keys(marketComparison).length > 0 && marketComparison.averagePrice > 0 && (
                    <div className="mt-6 bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base lg:text-lg font-semibold mb-4 text-gray-800">Market Comparison</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Your Average Price</p>
                                <p className="text-2xl font-bold text-blue-600">${(marketComparison.myAveragePrice || 0).toFixed(0)}</p>
                                <p className="text-sm text-gray-500">vs ${(marketComparison.averagePrice || 0).toFixed(0)} market avg</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Your Occupancy Rate</p>
                                <p className="text-2xl font-bold text-green-600">{(marketComparison.myOccupancyRate || 0).toFixed(1)}%</p>
                                <p className="text-sm text-gray-500">vs {(marketComparison.occupancyRate || 0).toFixed(1)}% market avg</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Market Position</p>
                                <p className="text-2xl font-bold text-purple-600 capitalize">
                                    {(marketComparison.marketPosition || 'Unknown').replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-500">{marketComparison.competitorCount || 0} competitors nearby</p>
                            </div>
                        </div>
                        
                        {marketComparison.opportunities && marketComparison.opportunities.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                                    <i className="bi bi-lightbulb mr-2"></i>
                                    Growth Opportunities
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {marketComparison.opportunities.map((opportunity: string, index: number) => (
                                        <div key={index} className="text-sm text-blue-800 flex items-start">
                                            <i className="bi bi-arrow-right mr-2 mt-1 flex-shrink-0"></i>
                                            <span>{opportunity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Performance Insights */}
                <div className="mt-6 bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-base lg:text-lg font-semibold mb-4 text-gray-800">Key Performance Insights</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
                        <div className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl lg:text-3xl mb-2 text-gray-600">
                                <i className="bi bi-check-circle" />
                            </div>
                            <div className="text-lg lg:text-xl font-bold text-gray-800 mb-1">
                                {overview.completedBookings || bookingsData?.filter((b: any) => b.status === 'completed').length || 0}
                            </div>
                            <div className="text-md lg:text-md text-gray-600 font-medium">Completed Bookings</div>
                        </div>
                        <div className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl lg:text-3xl mb-2 text-gray-600">
                                <i className="bi bi-graph-up" />
                            </div>
                            <div className="text-lg lg:text-xl font-bold text-gray-800 mb-1">
                                {overview.conversionRate ? `${overview.conversionRate.toFixed(1)}%` : 'N/A'}
                            </div>
                            <div className="text-md lg:text-md text-gray-600 font-medium">Conversion Rate</div>
                        </div>
                        <div className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl lg:text-3xl mb-2 text-gray-600">
                                <i className="bi bi-arrow-repeat" />
                            </div>
                            <div className="text-lg lg:text-xl font-bold text-gray-800 mb-1">
                                {overview.repeatGuestRate ? `${overview.repeatGuestRate.toFixed(1)}%` : 'N/A'}
                            </div>
                            <div className="text-md lg:text-md text-gray-600 font-medium">Repeat Guests</div>
                        </div>
                        <div className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl lg:text-3xl mb-2 text-gray-600">
                                <i className="bi bi-clock" />
                            </div>
                            <div className="text-lg lg:text-xl font-bold text-gray-800 mb-1">
                                {earningsData?.averageNightlyRate ? `${earningsData.averageNightlyRate.toFixed(0)}` : 'N/A'}
                            </div>
                            <div className="text-md lg:text-md text-gray-600 font-medium">Avg. Nightly Rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostAnalyticsPage;