'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/app/api/apiService';

// TypeScript interfaces for enhanced API response
interface Booking {
    id: string;
    propertyId: number;
    propertyName: string;
    guestId: number;
    guestName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    status: string;
    message: string;
    createdAt: string;
    updatedAt: string;
}

interface PropertyPerformance {
    propertyId: number;
    propertyName: string;
    views: number;
    bookings: number;
    rating: number;
    reviewsCount: number;
    wishlistedBy: number;
    conversionRate: string;
}

interface Earnings {
    totalGross: number;
    totalPlatformFee: number;
    totalNet: number;
    transactionsCount: number;
    byStatus: any[];
}

interface Analytics {
    totalViews: number;
    averageViewDuration: number;
    totalWishlisted: number;
    activeBlockedDates: number;
    pendingPayments: number;
}

interface QuickStats {
    todayCheckIns: number;
    todayCheckOuts: number;
    occupiedProperties: number;
    pendingActions: number;
}

interface RecentActivity {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    propertyId: number;
    bookingId: string;
    isRead: boolean;
    priority: string;
}

interface EnhancedDashboardData {
    totalProperties: number;
    activeProperties: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    recentBookings: Booking[];
    propertyPerformance: PropertyPerformance[];
    upcomingCheckIns: Booking[];
    pendingReviews: number;
    earnings: Earnings;
    analytics: Analytics;
    quickStats: QuickStats;
    recentActivity: RecentActivity[];
    alerts: any[];
    marketTrends: {
        demandTrend: string;
        averagePrice: number;
        competitorActivity: string;
    };
}

const HostDashboard = () => {
    const router = useRouter();

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState<EnhancedDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState('Host');

    // Fetch all dashboard data from enhanced endpoint
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const user = JSON.parse(localStorage.getItem('userSession') || '{}');
                if (user.name || user.firstName) {
                    setUserName(user.firstName || user.name);
                }

                // Fetch enhanced dashboard data (single API call)
                const enhancedResponse = await api.get('/properties/host/dashboard/enhanced');
                const enhanced = enhancedResponse.data.data;
                setDashboardData(enhanced);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Transform property performance data for pie chart
    const getPropertyPerformance = (propertyPerformance: PropertyPerformance[]) => {
        if (!propertyPerformance || propertyPerformance.length === 0) {
            return [];
        }

        const colors = ['#F20C8F', '#083A85', '#10B981', '#F59E0B', '#8B5CF6'];
        return propertyPerformance.slice(0, 5).map((property, index) => ({
            name: property.propertyName,
            value: property.bookings,
            color: colors[index % colors.length]
        }));
    };

    // Transform upcoming check-ins with better structure
    const transformUpcomingCheckIns = (checkIns: Booking[]) => {
        if (!checkIns || checkIns.length === 0) {
            return [];
        }

        return checkIns.slice(0, 4).map((checkin) => {
            const checkInDate = new Date(checkin.checkIn);
            const checkOutDate = new Date(checkin.checkOut);
            const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
                title: checkin.propertyName,
                guest: checkin.guestName,
                time: checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: `${nights} night${nights > 1 ? 's' : ''}`,
                guests: checkin.guests,
                status: checkin.status,
                amount: `$${checkin.totalPrice}`
            };
        });
    };

    // Calculate occupancy data from recent bookings
    const getOccupancyData = (bookings: Booking[]) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        if (!bookings || bookings.length === 0) {
            return days.map(day => ({ day, occupancy: 0 }));
        }

        const dayOccupancy: { [key: string]: number } = {};
        bookings.forEach((booking) => {
            const day = new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short' });
            dayOccupancy[day] = (dayOccupancy[day] || 0) + 1;
        });

        return days.map(day => ({
            day,
            occupancy: ((dayOccupancy[day] || 0) / Math.max(...Object.values(dayOccupancy), 1)) * 100
        }));
    };

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();

        // Early Morning (5-7 AM)
        const earlyMorningMessages = [
            `🌅 Rise and shine, early bird!`,
            `☕ First coffee, first booking!`,
            `🏡 Your properties await!`,
            `🌄 Start strong today!`,
            `⏰ Early host, happy guests!`,
            `🌤 New day, new opportunities!`,
            `💪 Power up your hosting!`,
            `🔥 Ignite your hospitality!`,
            `✨ Morning magic begins!`,
            `🎯 Aim for 5-star reviews!`
        ];

        // Morning (7-12 PM)
        const morningMessages = [
            `🌅 Good morning!`,
            `☕ Coffee and bookings!`,
            `💡 Fresh start today!`,
            `🏃 Let's make it great!`,
            `📅 New bookings await!`,
            `🌞 Shine bright as a host!`,
            `🤝 Connect with guests!`,
            `📈 Growth starts now!`,
            `🎨 Create amazing experiences!`,
            `🚀 Launch into success!`,
            `🌱 Grow your business!`,
            `⭐ Excellence awaits!`,
            `🎪 Make hosting magical!`,
            `🏆 Champion host mode!`,
            `🎵 Start with positivity!`
        ];

        // Afternoon (12-17 PM)
        const afternoonMessages = [
            `☀️ Good afternoon!`,
            `🚀 Keep momentum going!`,
            `🔥 Stay on fire!`,
            `🌱 Growing strong!`,
            `📊 Peak performance time!`,
            `💪 Power through!`,
            `🎯 Hit your targets!`,
            `⚡ Energy boost time!`,
            `🌻 Bloom in hospitality!`,
            `🎪 Afternoon excellence!`,
            `🏃‍♂️ Sprint to success!`,
            `🎨 Create memories!`,
            `🔮 Afternoon magic!`,
            `🌊 Ride the wave!`,
            `🎭 Showtime for hosts!`,
            `🏅 Excellence continues!`
        ];

        // Evening (17-21 PM)
        const eveningMessages = [
            `🌇 Good evening!`,
            `📖 Review your day!`,
            `🌟 You did amazing!`,
            `🎶 Relax and review!`,
            `🍵 Wind down time!`,
            `🙌 Celebrate wins!`,
            `🛋 Comfort for guests!`,
            `🌌 Evening serenity!`,
            `🍷 Unwind gracefully!`,
            `🎨 Evening creativity!`,
            `🧘‍♀️ Find your calm!`,
            `🎬 Review time!`,
            `🌹 Evening elegance!`,
            `📚 Learn and grow!`,
            `🕯 Cozy evening vibes!`,
            `🎭 Evening excellence!`
        ];

        // Night (21-24 PM)
        const nightMessages = [
            `🌙 Good night!`,
            `🛌 Rest well, host!`,
            `✨ Dream of success!`,
            `😴 Recharge for tomorrow!`,
            `🔕 Peace and quiet!`,
            `💤 Sweet dreams!`,
            `🌠 Night inspiration!`,
            `🛡 Safe and sound!`,
            `🌜 Moonlit planning!`,
            `🎶 Peaceful night!`,
            `🏰 Dream big!`,
            `🌌 Starry success!`,
            `🛏 Rest easy!`,
            `🔮 Tomorrow awaits!`
        ];

        // Late Night/Midnight (0-5 AM)
        const lateNightMessages = [
            `🌃 Night owl hosting!`,
            `🦉 Late night warrior!`,
            `⭐ Stars guide you!`,
            `🌙 Midnight momentum!`,
            `💻 Late night planning!`,
            `🎧 Quiet productivity!`,
            `🔥 Burning bright!`,
            `🌌 Limitless potential!`,
            `☕ Midnight fuel!`,
            `🎯 Sharp focus!`,
            `🚀 Night launch!`,
            `🎪 Midnight magic!`,
            `🔬 Deep planning!`,
            `🎨 Creative hours!`
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <i className="bi bi-exclamation-triangle text-3xl text-red-500"></i>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transform transition-all duration-200 hover:scale-105"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Prepare data for UI from enhanced API response
    const propertyPerformance = getPropertyPerformance(dashboardData?.propertyPerformance || []);
    const upcomingCheckIns = transformUpcomingCheckIns(dashboardData?.upcomingCheckIns || []);
    const chartOccupancyData = getOccupancyData(dashboardData?.recentBookings || []);

    // Calculate occupancy rate percentage
    const calculateOccupancyRate = () => {
        if (!dashboardData) return 0;
        const { totalProperties, totalBookings } = dashboardData;
        if (totalProperties === 0) return 0;
        // Simple occupancy calculation: bookings / active properties
        return Math.round((totalBookings / (totalProperties * 30)) * 100); // Assuming 30 days
    };

    // Summary cards data with gradients
    const summaryCards = [
        {
            title: 'Total Revenue',
            value: `$${dashboardData?.totalRevenue?.toLocaleString() || '0'}`,
            change: `${dashboardData?.earnings?.transactionsCount || 0} transactions`,
            icon: 'cash-stack',
            percentage: null,
            bgGradient: 'from-green-500 to-emerald-400',
        },
        {
            title: 'Active Bookings',
            value: dashboardData?.totalBookings?.toString() || '0',
            change: `${dashboardData?.activeProperties || 0} active properties`,
            icon: 'calendar-check-fill',
            percentage: null,
            bgGradient: 'from-pink-500 to-rose-400',
        },
        {
            title: 'Occupancy Rate',
            value: `${calculateOccupancyRate()}%`,
            change: 'Based on current bookings',
            icon: 'house-door-fill',
            percentage: null,
            bgGradient: 'from-blue-800 to-blue-600',
        },
        {
            title: 'Average Rating',
            value: dashboardData?.averageRating ? dashboardData.averageRating.toFixed(1) : 'N/A',
            change: `${dashboardData?.pendingReviews || 0} pending reviews`,
            icon: 'star-fill',
            percentage: null,
            bgGradient: 'from-amber-500 to-orange-400',
        },
    ];

    // Performance metrics from analytics
    const performanceMetrics = [
        {
            label: 'Total Views',
            value: dashboardData?.analytics?.totalViews?.toString() || '0',
            icon: 'eye-fill',
            trend: 'stable'
        },
        {
            label: 'Wishlisted',
            value: dashboardData?.analytics?.totalWishlisted?.toString() || '0',
            icon: 'heart-fill',
            trend: 'stable'
        },
        {
            label: 'Pending Payments',
            value: dashboardData?.analytics?.pendingPayments?.toString() || '0',
            icon: 'credit-card-fill',
            trend: 'stable'
        },
        {
            label: 'Total Properties',
            value: dashboardData?.totalProperties?.toString() || '0',
            icon: 'house-fill',
            trend: 'stable'
        },
    ];
    
    return (
        <div className="p-1">
            <div className="max-w-9xl mx-auto px-3 sm:px-3 lg:px-4">
                          
                {/* Header Section */}
                <div className="mb-8 md:mb-10 bg-white shadow-sm rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl text-gray-900">
                                {getTimeBasedGreeting()}, <span className="font-semibold">{userName}</span>
                            </h1>
                            <p className="mt-2 ml-2 text-base sm:text-lg text-gray-600">
                                Your hosting dashboard overview
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <span className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                </div>
               
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {summaryCards.map((card, index) => (
                        <div 
                            key={index} 
                            className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="p-5 sm:p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient} shadow-lg`}>
                                        <i className={`bi bi-${card.icon} text-white text-lg`} />
                                    </div>
                                    {card.percentage && (
                                        <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <i className="bi bi-arrow-up-short mr-0.5" />
                                            {card.percentage}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">
                                    {card.title}
                                </h3>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                    {card.value}
                                </p>
                                <p className="text-sm text-gray-500">{card.change}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Earnings Overview */}
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Earnings Overview
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Financial summary
                                </p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <i className="bi bi-three-dots text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Gross</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            ${dashboardData?.earnings?.totalGross?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                        <i className="bi bi-cash-stack text-white text-xl" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50">
                                    <p className="text-xs text-gray-500 mb-1">Platform Fee</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        ${dashboardData?.earnings?.totalPlatformFee?.toFixed(2) || '0.00'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50">
                                    <p className="text-xs text-gray-500 mb-1">Net Earnings</p>
                                    <p className="text-xl font-bold text-green-600">
                                        ${dashboardData?.earnings?.totalNet?.toFixed(2) || '0.00'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Transactions</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {dashboardData?.earnings?.transactionsCount || 0}
                                        </p>
                                    </div>
                                    <i className="bi bi-receipt text-3xl text-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Occupancy Rate Chart */}
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Weekly Occupancy
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Property utilization rate
                                </p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <i className="bi bi-three-dots text-gray-400" />
                            </button>
                        </div>
                        <div className="h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartOccupancyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis 
                                        dataKey="day" 
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        }} 
                                    />
                                    <Bar 
                                        dataKey="occupancy" 
                                        fill="#F20C8F" 
                                        radius={[8, 8, 0, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Upcoming Check-ins */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Upcoming Check-ins
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Today's arrivals
                                </p>
                            </div>
                            <Link
                                href="/all/host/bookings"
                                className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {upcomingCheckIns.length > 0 ? upcomingCheckIns.map((checkin: any, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => router.push('/all/host/bookings')}
                                    className="group p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                                                <h4 className="font-semibold text-gray-900">
                                                    {checkin.title}
                                                </h4>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <i className="bi bi-person mr-1.5" />
                                                    {checkin.guest}
                                                </span>
                                                <span className="flex items-center">
                                                    <i className="bi bi-clock mr-1.5" />
                                                    {checkin.time} • {checkin.duration}
                                                </span>
                                                <span className="flex items-center">
                                                    <i className="bi bi-people mr-1.5" />
                                                    {checkin.guests} guests
                                                </span>
                                                {checkin.amount && (
                                                    <span className="font-semibold text-green-600">
                                                        {checkin.amount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            checkin.status === 'confirmed' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {checkin.status}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="bi bi-calendar-x text-2xl text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">
                                        No check-ins scheduled for today
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property Performance */}
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                Top Properties
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                By bookings this month
                            </p>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={propertyPerformance}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {propertyPerformance.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-6">
                            {propertyPerformance.slice(0, 3).map((property: any, index: number) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div 
                                            className="w-3 h-3 rounded-full mr-3"
                                            style={{ backgroundColor: property.color }}
                                        />
                                        <span className="text-sm text-gray-600 truncate max-w-[120px]">
                                            {property.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {property.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity & Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Recent Activity
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Latest updates
                                </p>
                            </div>
                            <Link
                                href="/all/host/bookings"
                                className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ?
                                dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                                <div
                                    key={activity.id || index}
                                    onClick={() => router.push('/all/host/bookings')}
                                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <i className={`bi bi-${
                                            activity.type === 'booking' ? 'calendar-check' :
                                            activity.type === 'inquiry' ? 'chat-dots' :
                                            activity.type === 'checkout' ? 'door-open' :
                                            'bell'
                                        } text-gray-600`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {activity.title}
                                        </p>
                                        <p className="text-sm text-gray-600 line-clamp-1">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-gray-400">
                                                {new Date(activity.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                        activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {activity.type}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-inbox text-3xl mb-2" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                Performance Metrics
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Your hosting stats
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {performanceMetrics.map((metric, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                            <i className={`bi bi-${metric.icon} text-lg ${
                                                metric.trend === 'up' ? 'text-green-500' :
                                                metric.trend === 'down' ? 'text-red-500' :
                                                'text-gray-500'
                                            }`} />
                                        </div>
                                        {metric.trend !== 'stable' && (
                                            <i className={`bi bi-arrow-${metric.trend} text-xs ${
                                                metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                            }`} />
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {metric.value}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {metric.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostDashboard;