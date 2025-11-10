'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/app/api/apiService';

const TourGuideDashboard = () => {
    const router = useRouter();
    
    // State for dashboard data
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [enhancedData, setEnhancedData] = useState<any>(null);
    const [bookingsData, setBookingsData] = useState<any>([]);
    const [earningsData, setEarningsData] = useState<any>([]);
    const [toursData, setToursData] = useState<any>([]);
    const [loading, setLoading] = useState<any>(true);
    const [error, setError] = useState<any>(null);
    const [userName, setUserName] = useState('Tour Guide');
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
                if (user.name || user.firstName) {
                    setUserName(user.firstName || user.name);
                }

                const dashboardResponse = await api.get('/tours/guide/dashboard');
                const dashboard = dashboardResponse.data.data;
                setDashboardData(dashboard);

                const enhancedResponse = await api.get('/tours/guide/dashboard/enhanced');
                const enhanced = enhancedResponse.data.data;
                setEnhancedData(enhanced);

                const bookingsResponse = await api.get('/tours/guide/bookings');
                setBookingsData(bookingsResponse.data.data.bookings);

                const earningsResponse = await api.get('/tours/guide/earnings');
                setEarningsData(earningsResponse.data.data);

                const toursResponse = await api.get('/tours/guide/my-tours');
                setToursData(toursResponse.data.data.tours);

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

    // Transform earnings data for chart
    const transformEarningsData = (monthlyEarnings: any) => {
        if (!monthlyEarnings || monthlyEarnings.length === 0) {
            return [];
        }

        return monthlyEarnings.slice(-6).map((item: any) => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
            earnings: item.earnings || 0
        }));
    };

    // Transform tour bookings data for chart
    const transformTourBookingsData = (tourPerformance: any) => {
        if (!tourPerformance || tourPerformance.length === 0) {
            return [];
        }

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return tourPerformance.slice(0, 7).map((item: any, index: number) => ({
            day: days[index] || days[0],
            tours: item.bookings || 0
        }));
    };

    // Get tour types from tours data
    const getTourTypes = (tours: any) => {
        if (!tours || tours.length === 0) {
            return [];
        }

        const typeCount: any = {};
        tours.forEach((tour: any) => {
            const type = tour.category || 'Other';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        const colors = ['#083A85', '#0C4DA2', '#1565C0', '#42A5F5', '#90CAF9', '#BBDEFB'];
        return Object.entries(typeCount).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    };

    // Transform recent activity
    const transformRecentActivity = (bookings: any) => {
        if (!bookings || bookings.length === 0) return [];
        
        return bookings.slice(0, 5).map((booking: any) => ({
            guest: booking.guestName || booking.user?.name || 'Guest',
            tour: booking.tour?.title || booking.tourName || 'Tour',
            message: booking.specialRequests || booking.notes || 
                    `${booking.status === 'confirmed' ? 'Tour booking confirmed' : 
                     booking.status === 'completed' ? 'Tour completed' : 
                     'New inquiry received'}`,
            time: new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: booking.status === 'confirmed' ? 'booking' : 
                  booking.status === 'inquiry' ? 'inquiry' : 
                  booking.status === 'completed' ? 'completed' : 'message',
            amount: booking.totalAmount ? `USD ${booking.totalAmount.toLocaleString()}` : null
        }));
    };

    // Transform upcoming tours with better structure
    const transformUpcomingTours = (tours: any) => {
        if (!tours || tours.length === 0) return [];
        
        return tours.slice(0, 4).map((tour: any) => ({
            title: tour.title || tour.name || 'Tour',
            time: tour.startTime ? new Date(tour.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            guests: tour.bookedSpots || tour.participants || 0,
            duration: tour.duration || '2 hrs',
            meetingPoint: tour.meetingPoint || 'TBD',
            status: tour.status || 'confirmed',
            amount: tour.price ? `USD ${tour.price.toLocaleString()}` : null
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-[#083A85] animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-normal">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                        <i className="bi bi-exclamation-circle text-3xl text-red-600"></i>
                    </div>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-3 bg-[#083A85] text-white rounded-lg font-medium hover:bg-[#062d6b] transition-all duration-200"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Prepare data for UI
    const chartEarningsData = transformEarningsData(dashboardData?.monthlyEarnings);
    const chartBookingsData = transformTourBookingsData(dashboardData?.tourPerformance);
    const tourTypes = getTourTypes(toursData);
    const recentActivity = transformRecentActivity(bookingsData);
    const upcomingTours = transformUpcomingTours(dashboardData?.upcomingTours);

    // Summary cards data with Airbnb-style icons
    const summaryCards = [
        {
            title: 'Total Revenue',
            value: `USD ${dashboardData?.totalRevenue?.toLocaleString() || '0'}`,
            change: dashboardData?.revenueGrowth 
                ? `${dashboardData.revenueGrowth > 0 ? '+' : ''}${dashboardData.revenueGrowth}%`
                : 'All time',
            icon: 'bi-wallet2',
            trend: dashboardData?.revenueGrowth > 0 ? 'up' : 'stable',
        },
        {
            title: 'Active Tours',
            value: dashboardData?.activeTours?.toString() || '0',
            change: `${dashboardData?.totalTours || 0} total`,
            icon: 'bi-map',
            trend: dashboardData?.tourGrowth > 0 ? 'up' : 'stable',
        },
        {
            title: 'Total Guests',
            value: dashboardData?.totalParticipants?.toString() || '0',
            change: `${dashboardData?.totalBookings || 0} bookings`,
            icon: 'bi-people',
            trend: dashboardData?.participantGrowth > 0 ? 'up' : 'stable',
        },
        {
            title: 'Average Rating',
            value: dashboardData?.averageRating ? dashboardData.averageRating.toFixed(1) : 'N/A',
            change: `${dashboardData?.totalReviews || 0} reviews`,
            icon: 'bi-star',
            trend: dashboardData?.ratingGrowth > 0 ? 'up' : 'stable',
        },
    ];

    // Performance metrics
    const performanceMetrics = [
        { 
            label: 'Tours Completed', 
            value: dashboardData?.completedTours?.toString() || '0',
            icon: 'bi-check-circle',
            trend: dashboardData?.completedToursTrend || 'stable'
        },
        { 
            label: 'Response Rate', 
            value: dashboardData?.responseRate ? `${dashboardData.responseRate}%` : 'N/A',
            icon: 'bi-chat-dots',
            trend: dashboardData?.responseRateTrend || 'stable'
        },
        { 
            label: 'Repeat Guests', 
            value: dashboardData?.repeatCustomerRate ? `${dashboardData.repeatCustomerRate}%` : 'N/A',
            icon: 'bi-arrow-repeat',
            trend: dashboardData?.repeatCustomerTrend || 'stable'
        },
        { 
            label: 'Cancellation Rate', 
            value: dashboardData?.cancellationRate ? `${dashboardData.cancellationRate}%` : 'N/A', 
            icon: 'bi-x-circle',
            trend: dashboardData?.cancellationTrend || 'stable'
        },
    ];

    // Recent reviews
    const recentReviews = bookingsData
        .filter((booking: any) => booking.review)
        .slice(0, 3)
        .map((booking: any) => ({
            guest: booking.guestName || booking.user?.name || 'Anonymous',
            rating: booking.review?.rating || 0,
            comment: booking.review?.comment || 'No comment provided',
            tour: booking.tour?.title || booking.tourName || 'Tour',
            date: new Date(booking.review?.createdAt || booking.createdAt).toLocaleDateString()
        }));
    
    return (
        <div className="">
            <div className="px-4">
                          
                {/* Header Section - Airbnb Style */}
                <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                        {getTimeBasedGreeting()}, {userName}
                    </h1>
                    <p className="mt-1 text-gray-600">
                        {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                {/* Wallet Section - Airbnb Card Style */}
                {walletData && (
                    <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        <i className="bi bi-wallet2 text-[#083A85] text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 text-lg font-medium">Wallet Balance</h3>
                                        <p className="text-gray-500 text-sm">Your current earnings</p>
                                    </div>
                                </div>
                                {walletLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#083A85]"></div>
                                        <span className="text-gray-500 text-sm">Updating...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-semibold text-gray-900">
                                                {walletData.currency || 'USD'} {walletData.totalBalance?.toLocaleString() || '0'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-gray-500">Available: </span>
                                                <span className="text-gray-900 font-medium">
                                                    {walletData.currency || 'USD'} {walletData.availableBalance?.toLocaleString() || '0'}
                                                </span>
                                            </div>
                                            {walletData.pendingBalance > 0 && (
                                                <div>
                                                    <span className="text-gray-500">Pending: </span>
                                                    <span className="text-orange-600 font-medium">
                                                        {walletData.currency || 'USD'} {walletData.pendingBalance?.toLocaleString() || '0'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 ml-6">
                                <Link
                                    href="/all/tourguide/earnings"
                                    className="px-5 py-2.5 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    View Details
                                    <i className="bi bi-arrow-right" />
                                </Link>
                                <button
                                    onClick={fetchWalletData}
                                    disabled={walletLoading}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    <i className={`bi bi-arrow-clockwise ${walletLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                )}
               
                {/* Summary Cards - Airbnb Grid Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {summaryCards.map((card, index) => (
                        <div 
                            key={index} 
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <i className={`${card.icon} text-[#083A85] text-xl`} />
                                </div>
                                {card.trend === 'up' && (
                                    <span className="text-green-600 text-sm font-medium">
                                        <i className="bi bi-arrow-up" /> {card.change}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-sm font-normal text-gray-600 mb-1">
                                {card.title}
                            </h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {card.value}
                            </p>
                            {card.trend === 'stable' && (
                                <p className="text-sm text-gray-500 mt-1">{card.change}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Charts Section - Airbnb Clean Style */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Earnings Chart */}
                    {chartEarningsData.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Monthly Earnings
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Your revenue over time
                                </p>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                        <defs>
                                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#083A85" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#083A85" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="month" 
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
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)',
                                            }} 
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="earnings" 
                                            stroke="#083A85" 
                                            strokeWidth={2}
                                            fill="url(#colorEarnings)"
                                            dot={{ fill: '#083A85', strokeWidth: 0, r: 4 }} 
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Tour Bookings Chart */}
                    {chartBookingsData.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Weekly Bookings
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tour bookings by day
                                </p>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartBookingsData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)',
                                            }} 
                                        />
                                        <Bar 
                                            dataKey="tours" 
                                            fill="#083A85" 
                                            radius={[6, 6, 0, 0]}
                                            barSize={30}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Activity Grid - Airbnb Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Upcoming Tours - Takes 2 columns */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Today's Schedule
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Upcoming tours and activities
                                </p>
                            </div>
                            <Link
                                href="/all/tourguide/schedule"
                                className="text-sm font-medium text-[#083A85] hover:text-[#062d6b] transition-colors"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {upcomingTours.length > 0 ? upcomingTours.map((tour: any, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => router.push('/all/tourguide/schedule')}
                                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                {tour.title}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <i className="bi bi-clock mr-1.5 text-gray-400" />
                                                    {tour.time}
                                                </span>
                                                <span className="flex items-center">
                                                    <i className="bi bi-hourglass mr-1.5 text-gray-400" />
                                                    {tour.duration}
                                                </span>
                                                <span className="flex items-center">
                                                    <i className="bi bi-people mr-1.5 text-gray-400" />
                                                    {tour.guests} guests
                                                </span>
                                            </div>
                                            <div className="flex items-center mt-2 text-sm text-gray-500">
                                                <i className="bi bi-geo-alt mr-1.5 text-gray-400" />
                                                {tour.meetingPoint}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {tour.amount && (
                                                <p className="font-medium text-gray-900 mb-2">
                                                    {tour.amount}
                                                </p>
                                            )}
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${
                                                tour.status === 'confirmed' 
                                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                            }`}>
                                                {tour.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="bi bi-calendar-x text-2xl text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No tours scheduled for today</p>
                                    <Link href="/all/tourguide/tours/create" className="mt-4 inline-block text-sm font-medium text-[#083A85] hover:text-[#062d6b]">
                                        Create a tour →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tour Categories - Takes 1 column */}
                    {tourTypes.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Tour Categories
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Distribution by type
                                </p>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={tourTypes}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {tourTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-6">
                                {tourTypes.map((type: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div 
                                                className="w-3 h-3 rounded-full mr-3"
                                                style={{ backgroundColor: type.color }}
                                            />
                                            <span className="text-sm text-gray-700">{type.name}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {type.value} tours
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Activity & Performance - Airbnb Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Recent Activity
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Latest bookings and inquiries
                                </p>
                            </div>
                            <Link
                                href="/all/tourguide/reservations"
                                className="text-sm font-medium text-[#083A85] hover:text-[#062d6b] transition-colors"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentActivity.length > 0 ? recentActivity.map((activity: any, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => router.push('/all/tourguide/reservations')}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        activity.type === 'booking' ? 'bg-green-50' :
                                        activity.type === 'inquiry' ? 'bg-blue-50' :
                                        activity.type === 'completed' ? 'bg-purple-50' :
                                        'bg-gray-50'
                                    }`}>
                                        <i className={`bi ${
                                            activity.type === 'booking' ? 'bi-calendar-check text-green-600' :
                                            activity.type === 'inquiry' ? 'bi-chat-dots text-blue-600' :
                                            activity.type === 'completed' ? 'bi-check-circle text-purple-600' :
                                            'bi-bell text-gray-600'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.guest}
                                        </p>
                                        <p className="text-sm text-gray-600 line-clamp-1">
                                            {activity.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-500">
                                                {activity.time}
                                            </span>
                                            {activity.amount && (
                                                <span className="text-xs font-medium text-gray-900">
                                                    {activity.amount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="bi bi-inbox text-2xl text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Performance
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Your guide statistics
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {performanceMetrics.map((metric, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className={`${metric.icon} text-[#083A85]`} />
                                        <span className="text-xs text-gray-600">{metric.label}</span>
                                    </div>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {metric.value}
                                    </p>
                                    {metric.trend !== 'stable' && (
                                        <p className={`text-xs mt-1 ${
                                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            <i className={`bi bi-arrow-${metric.trend}`} /> from last month
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Reviews - Airbnb Style */}
                {recentReviews.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Recent Reviews
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    What guests are saying
                                </p>
                            </div>
                            <Link
                                href="/all/tourguide/reviews"
                                className="text-sm font-medium text-[#083A85] hover:text-[#062d6b] transition-colors"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentReviews.map((review: any, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => router.push('/all/tourguide/reviews')}
                                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {review.guest}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {review.date}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <i
                                                    key={i}
                                                    className={`bi bi-star${i < review.rating ? '-fill' : ''} text-xs ${
                                                        i < review.rating ? 'text-[#083A85]' : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                                        {review.comment}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {review.tour}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TourGuideDashboard;