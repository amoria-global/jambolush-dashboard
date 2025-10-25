'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/app/api/apiService';

interface DashboardData {
    summaryStats: {
        totalBookings: number;
        totalEarnings: number;
        totalManagedProperties: number;
        totalEarningsOverall: number;
        totalClients: number;
        activeClients: number;
    };
    recentBookings: Array<{
        id: string;
        clientName: string;
        bookingType: string;
        commission: number;
        commissionStatus: string;
        bookingDate: string;
        createdAt: string;
        transactionData: {
            escrowTransaction: any;
            paymentTransaction: any;
            hasActiveTransaction: boolean;
            transactionStatus: string;
        };
    }>;
    recentManagedProperties: Array<{
        id: number;
        name: string;
        location: string;
        type: string;
        category: string;
        pricePerNight: number;
        status: string;
        images: string;
        averageRating: number;
        rating: number;
        totalBookings: number;
        totalReviews: number;
        createdAt: string;
        updatedAt: string;
    }>;
    recentEarnings: Array<any>;
    recentActivity: Array<{
        type: string;
        action: string;
        description: string;
        timestamp: string;
        metadata: any;
    }>;
    walletOverview: {
        availableBalance: number;
        pendingBalance: number;
        heldBalance: number;
        totalEarned: number;
        pendingWithdrawals: number;
        currency: string;
        lastUpdated: string;
    };
    commissions: {
        total: number;
        pending: number;
        paid: number;
        failed: number;
        escrowHeld: number;
        avgPerBooking: number;
    };
    monthlyCommissions: Array<{
        month: string;
        commission: number;
        bookings: number;
        escrowAmount: number;
        paymentAmount: number;
        pendingAmount: number;
        paidAmount: number;
        failedAmount: number;
    }>;
    transactionBreakdown: {
        escrowTransactions: Array<any>;
        paymentTransactions: Array<any>;
    };
}

const EnhancedAgentDashboard = () => {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState('Agent');
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            const user = JSON.parse(localStorage.getItem('userSession') || '{}');
            if (user.name || user.firstName) {
                setUserName(user.firstName || user.name);
            }

            // Single API call to get all dashboard data
            const response = await api.get('/properties/agent/dashboard');

            if (response.data.success) {
                setDashboardData(response.data.data);
                setError(null);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setError(error?.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Refresh data every 60 seconds
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        if (currency === 'RWF') {
            return `${amount.toLocaleString()} RWF`;
        }
        return `$${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getPropertyImage = (imagesJson: string) => {
        try {
            const images = JSON.parse(imagesJson);
            const allImages = [
                ...(images.exterior || []),
                ...(images.livingRoom || []),
                ...(images.bedroom || []),
                ...(images.kitchen || [])
            ];
            return allImages[0] || '/placeholder-property.jpg';
        } catch {
            return '/placeholder-property.jpg';
        }
    };

    const transformMonthlyData = () => {
        if (!dashboardData?.monthlyCommissions) return [];

        return dashboardData.monthlyCommissions.map(item => ({
            month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
            earnings: item.paidAmount,
            bookings: item.bookings,
            pending: item.pendingAmount
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                            <i className="bi bi-exclamation-triangle text-red-600 text-xl" />
                        </div>
                        <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Dashboard</h2>
                        <p className="text-red-600 mb-6">{error || 'Something went wrong'}</p>
                        <button
                            onClick={fetchDashboardData}
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

    const { summaryStats, recentBookings, recentManagedProperties, recentEarnings, recentActivity, walletOverview, commissions } = dashboardData;
    const chartData = transformMonthlyData();

    return (
        <div className="">
            <div className="w-full mx-auto px-4 sm:px-3 lg:px-4 py-4">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-[32px] font-semibold text-gray-900 mb-2">
                            {getTimeBasedGreeting()}, {userName}
                        </h1>
                        <p className="text-gray-600">Here's what's happening with your properties today</p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        disabled={refreshing}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <i className={`bi bi-arrow-clockwise ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Wallet Overview - Featured Section */}
                <div className="mb-8 bg-gradient-to-br from-[#083A85] via-[#062d6b] to-[#041f4a] rounded-2xl p-8 shadow-xl text-white">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <i className="bi bi-wallet2 text-white text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-white/90 text-sm font-medium uppercase tracking-wide">Wallet Balance</h2>
                                    <p className="text-white/70 text-xs">Last updated: {formatTime(walletOverview.lastUpdated)}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/agent/earnings')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            View Details
                            <i className="bi bi-arrow-right" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <p className="text-white/70 text-sm mb-2">Available Balance</p>
                            <p className="text-3xl font-bold text-white">
                                {formatCurrency(walletOverview.availableBalance, walletOverview.currency)}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <p className="text-white/70 text-sm mb-2">Pending Balance</p>
                            <p className="text-3xl font-bold text-yellow-300">
                                {formatCurrency(walletOverview.pendingBalance, walletOverview.currency)}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <p className="text-white/70 text-sm mb-2">Held Balance</p>
                            <p className="text-3xl font-bold text-orange-300">
                                {formatCurrency(walletOverview.heldBalance, walletOverview.currency)}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <p className="text-white/70 text-sm mb-2">Total Earned</p>
                            <p className="text-3xl font-bold text-green-300">
                                {formatCurrency(walletOverview.totalEarned, walletOverview.currency)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <i className="bi bi-calendar-check text-[#083A85] text-xl" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{summaryStats.totalBookings}</span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Total Bookings</h3>
                        <p className="text-xs text-gray-500">All time bookings</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <i className="bi bi-currency-dollar text-green-600 text-xl" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">
                                {formatCurrency(summaryStats.totalEarningsOverall, walletOverview.currency)}
                            </span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Total Earnings Overall</h3>
                        <p className="text-xs text-gray-500">Lifetime earnings</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <i className="bi bi-house text-purple-600 text-xl" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{summaryStats.totalManagedProperties}</span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Managing Properties</h3>
                        <p className="text-xs text-gray-500">Active properties</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                                <i className="bi bi-people text-pink-500 text-xl" />
                            </div>
                            <span className="text-3xl font-bold text-gray-900">{summaryStats.totalClients}</span>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">Total Clients</h3>
                        <p className="text-xs text-gray-500">{summaryStats.activeClients} active</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - 2/3 width */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Recent Bookings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                                    <button
                                        onClick={() => router.push('/agent/bookings')}
                                        className="text-sm text-[#083A85] hover:underline font-medium"
                                    >
                                        View all
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {recentBookings && recentBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentBookings.slice(0, 5).map((booking) => (
                                            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <i className="bi bi-bookmark-check text-[#083A85] text-lg" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{booking.clientName}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {booking.bookingType} • {formatDate(booking.bookingDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        {formatCurrency(booking.commission, walletOverview.currency)}
                                                    </p>
                                                    <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                                                        booking.commissionStatus === 'active' ? 'bg-green-100 text-green-700' :
                                                        booking.commissionStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {booking.commissionStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <i className="bi bi-bookmark text-gray-400 text-2xl" />
                                        </div>
                                        <p className="text-gray-500 mb-1">No recent bookings</p>
                                        <p className="text-sm text-gray-400">Bookings will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Earnings Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">Monthly Earnings</h2>
                            </div>
                            <div className="p-6">
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="earnings" fill="#083A85" name="Paid" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Recent Managed Properties */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">Recent Managed Properties</h2>
                                    <button
                                        onClick={() => router.push('/agent/properties')}
                                        className="text-sm text-[#083A85] hover:underline font-medium"
                                    >
                                        View all
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {recentManagedProperties && recentManagedProperties.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {recentManagedProperties.slice(0, 6).map((property) => (
                                            <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer">
                                                <div className="h-40 bg-gray-200 overflow-hidden">
                                                    <img
                                                        src={getPropertyImage(property.images)}
                                                        alt={property.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{property.name}</h3>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            property.status === 'active' ? 'bg-green-100 text-green-700' :
                                                            property.status === 'suspended' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {property.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                                                        <i className="bi bi-geo-alt mr-1" />
                                                        {property.location}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-[#083A85]">
                                                            {formatCurrency(property.pricePerNight, walletOverview.currency)}/night
                                                        </span>
                                                        <span className="text-gray-600">{property.totalBookings} bookings</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <i className="bi bi-house text-gray-400 text-2xl" />
                                        </div>
                                        <p className="text-gray-500 mb-1">No managed properties</p>
                                        <p className="text-sm text-gray-400">Properties you manage will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column - 1/3 width */}
                    <div className="space-y-8">

                        {/* Commission Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">Commission Overview</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Total Commission</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(commissions.total, walletOverview.currency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Pending</span>
                                    <span className="font-semibold text-yellow-600">
                                        {formatCurrency(commissions.pending, walletOverview.currency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Paid</span>
                                    <span className="font-semibold text-green-600">
                                        {formatCurrency(commissions.paid, walletOverview.currency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Escrow Held</span>
                                    <span className="font-semibold text-blue-600">
                                        {formatCurrency(commissions.escrowHeld, walletOverview.currency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Failed</span>
                                    <span className="font-semibold text-red-600">
                                        {formatCurrency(commissions.failed, walletOverview.currency)}
                                    </span>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Avg per Booking</span>
                                        <span className="font-bold text-[#083A85]">
                                            {formatCurrency(commissions.avgPerBooking, walletOverview.currency)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                            </div>
                            <div className="p-6">
                                {recentActivity && recentActivity.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {recentActivity.map((activity, index) => (
                                            <div key={index} className="flex gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    activity.type === 'property' ? 'bg-purple-100' :
                                                    activity.type === 'booking' ? 'bg-blue-100' :
                                                    activity.type === 'commission' ? 'bg-green-100' :
                                                    'bg-gray-100'
                                                }`}>
                                                    <i className={`bi ${
                                                        activity.type === 'property' ? 'bi-house' :
                                                        activity.type === 'booking' ? 'bi-bookmark-check' :
                                                        activity.type === 'commission' ? 'bi-cash-coin' :
                                                        'bi-clock-history'
                                                    } ${
                                                        activity.type === 'property' ? 'text-purple-600' :
                                                        activity.type === 'booking' ? 'text-blue-600' :
                                                        activity.type === 'commission' ? 'text-green-600' :
                                                        'text-gray-600'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <i className="bi bi-clock-history text-gray-400 text-xl" />
                                        </div>
                                        <p className="text-gray-500 mb-1">No recent activity</p>
                                        <p className="text-sm text-gray-400">Activity will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Earnings */}
                        {recentEarnings && recentEarnings.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-6 border-b">
                                    <h2 className="text-xl font-semibold text-gray-900">Recent Earnings</h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {recentEarnings.map((earning, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <i className="bi bi-cash-coin text-green-600 text-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{earning.description}</p>
                                                        <p className="text-xs text-gray-600">{formatDate(earning.date)}</p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(earning.amount, walletOverview.currency)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default EnhancedAgentDashboard;
