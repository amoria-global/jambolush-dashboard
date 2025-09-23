'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
                const dashboardResponse = await api.get('/tours/guide/dashboard');
                const dashboard = dashboardResponse.data.data;
                setDashboardData(dashboard);

                // Fetch enhanced dashboard data
                const enhancedResponse = await api.get('/tours/guide/dashboard/enhanced');
                const enhanced = enhancedResponse.data.data;
                setEnhancedData(enhanced);

                // Fetch recent bookings
                const bookingsResponse = await api.get('/tours/guide/bookings');
                setBookingsData(bookingsResponse.data.data.bookings);

                // Fetch earnings data
                const earningsResponse = await api.get('/tours/guide/earnings');
                setEarningsData(earningsResponse.data.data);

                // Fetch guide's tours
                const toursResponse = await api.get('/tours/guide/my-tours');
                setToursData(toursResponse.data.data.tours);

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
            // Fallback data if no earnings data
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

    // Transform tour performance data for chart
    const transformTourBookingsData = (tourPerformance: any) => {
        if (!tourPerformance || tourPerformance.length === 0) {
            // Fallback weekly data
            return [
                { day: 'Mon', tours: 0 },
                { day: 'Tue', tours: 0 },
                { day: 'Wed', tours: 0 },
                { day: 'Thu', tours: 0 },
                { day: 'Fri', tours: 0 },
                { day: 'Sat', tours: 0 },
                { day: 'Sun', tours: 0 },
            ];
        }
        
        return tourPerformance.slice(0, 7).map((item: any, index: number) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
            tours: item.bookings || 0
        }));
    };

    // Get tour types from tours data
    const getTourTypes = (tours: any) => {
        if (!tours || tours.length === 0) {
            return [
                { name: 'No Tours', value: 1, color: '#E5E7EB' }
            ];
        }

        const typeCount: any = {};
        tours.forEach((tour: any) => {
            const type = tour.category || 'Other';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        const colors = ['#F20C8F', '#083A85', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        return Object.entries(typeCount).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    };

    // Transform recent bookings for messages section
    const transformRecentMessages = (bookings: any) => {
        if (!bookings || bookings.length === 0) return [];
        
        return bookings.slice(0, 4).map((booking: any) => ({
            guest: booking.guestName || booking.user?.name || 'Guest',
            message: booking.specialRequests || booking.notes || 'Booking confirmed',
            time: new Date(booking.createdAt).toLocaleTimeString(),
            type: booking.status === 'confirmed' ? 'review' : 'inquiry'
        }));
    };

    // Transform upcoming tours
    const transformUpcomingTours = (tours: any) => {
        if (!tours || tours.length === 0) return [];
        
        return tours.slice(0, 3).map((tour: any) => ({
            title: tour.title || tour.name,
            time: new Date(tour.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            guests: tour.bookedSpots || tour.participants || 0,
            duration: tour.duration || '2 hrs',
            meetingPoint: tour.meetingPoint || 'TBD',
            status: tour.status || 'confirmed'
        }));
    };

    if (loading) {
        return (
            <div className="mt-20 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
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

    // Prepare data for UI
    const chartEarningsData = transformEarningsData(dashboardData?.monthlyEarnings);
    const chartBookingsData = transformTourBookingsData(dashboardData?.tourPerformance);
    const tourTypes = getTourTypes(toursData);
    const recentMessages = transformRecentMessages(bookingsData);
    const upcomingTours = transformUpcomingTours(dashboardData?.upcomingTours);

    // Summary cards data
    const summaryCards = [
        {
            title: 'Active Tours',
            value: dashboardData?.activeTours?.toString() || '0',
            change: `${dashboardData?.totalTours || 0} total tours`,
            icon: 'map',
            bgColor: 'bg-pink-500',
            iconBg: '#F20C8F',
        },
        {
            title: 'Total Guests',
            value: dashboardData?.totalParticipants?.toString() || '0',
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
            tour: booking.tour?.title || booking.tourName || 'Tour',
            date: new Date(booking.review?.createdAt || booking.createdAt).toLocaleDateString()
        }));

    // Quick stats
    const quickStats = [
        { 
            label: 'Tours Completed', 
            value: dashboardData?.totalBookings?.toString() || '0', 
            icon: 'check-circle' 
        },
        { 
            label: 'Response Rate', 
            value: '98%', // This might need a separate endpoint
            icon: 'chat-dots' 
        },
        { 
            label: 'Repeat Customers', 
            value: '34%', // This might need calculation from bookings
            icon: 'arrow-repeat' 
        },
        { 
            label: 'Active Tours', 
            value: dashboardData?.activeTours?.toString() || '0', 
            icon: 'translate' 
        },
    ];
    
   const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    // Early Morning (5-7 AM)
    const earlyMorningMessages = [
        `🌅 <i class="bi bi-sunrise-fill text-warning"></i> Rise and shine, early bird!`,
        `☕ <i class="bi bi-cup-hot text-danger"></i> First coffee, first victory!`,
        `🐦 <i class="bi bi-feather text-info"></i> The world is yours this early!`,
        `🌄 <i class="bi bi-mountain text-success"></i> Conquer mountains today!`,
        `⏰ <i class="bi bi-alarm text-warning"></i> Early start, early success!`,
        `🌤 <i class="bi bi-cloud-sun text-primary"></i> Dawn brings new possibilities!`,
        `💪 <i class="bi bi-lightning-charge text-danger"></i> Power up for greatness!`,
        `🔥 <i class="bi bi-fire text-warning"></i> Ignite your potential now!`,
        `✨ <i class="bi bi-sparkle text-info"></i> Magic happens in the morning!`,
        `🎯 <i class="bi bi-target text-success"></i> Aim high from the start!`
    ];

    // Morning (7-12 PM)
    const morningMessages = [
        `🌅 <i class="bi bi-sunrise-fill text-warning"></i> Good morning!`,
        `☕ <i class="bi bi-cup-hot text-danger"></i> Coffee time!`,
        `💡 <i class="bi bi-lightbulb-fill text-warning"></i> Fresh ideas start now!`,
        `🏃 <i class="bi bi-lightning-charge-fill text-primary"></i> Start strong today!`,
        `📅 <i class="bi bi-calendar-check text-success"></i> New goals, new wins!`,
        `🌞 <i class="bi bi-brightness-alt-high-fill text-warning"></i> Shine bright today!`,
        `🤝 <i class="bi bi-people-fill text-info"></i> Connect and grow!`,
        `📈 <i class="bi bi-graph-up-arrow text-success"></i> Progress starts early!`,
        `🎨 <i class="bi bi-palette-fill text-primary"></i> Paint your day beautiful!`,
        `🚀 <i class="bi bi-rocket text-danger"></i> Launch into excellence!`,
        `🌱 <i class="bi bi-seedling text-success"></i> Plant seeds of success!`,
        `⭐ <i class="bi bi-star-half text-warning"></i> Half the day, full potential!`,
        `🎪 <i class="bi bi-balloon-heart text-danger"></i> Make today spectacular!`,
        `🏆 <i class="bi bi-trophy text-warning"></i> Champion mindset activated!`,
        `🎵 <i class="bi bi-music-note text-info"></i> Start with good vibes!`
    ];

    // Afternoon (12-17 PM)
    const afternoonMessages = [
        `☀️ <i class="bi bi-brightness-high-fill text-primary"></i> Good afternoon!`,
        `🚀 <i class="bi bi-rocket-takeoff-fill text-success"></i> Keep the momentum!`,
        `🔥 <i class="bi bi-fire text-danger"></i> Stay on fire!`,
        `🌱 <i class="bi bi-tree-fill text-success"></i> Keep growing strong!`,
        `📊 <i class="bi bi-bar-chart-line-fill text-info"></i> Productivity boost!`,
        `💪 <i class="bi bi-shield-check text-success"></i> Power through the day!`,
        `🎯 <i class="bi bi-bullseye text-danger"></i> Focus on your targets!`,
        `⚡ <i class="bi bi-lightning-fill text-warning"></i> Energy check—stay sharp!`,
        `🌻 <i class="bi bi-flower1 text-warning"></i> Bloom where you're planted!`,
        `🎪 <i class="bi bi-circus text-primary"></i> Make magic happen now!`,
        `🏃‍♂️ <i class="bi bi-person-running text-success"></i> Sprint to your goals!`,
        `🎨 <i class="bi bi-brush text-danger"></i> Create something amazing!`,
        `🔮 <i class="bi bi-gem text-info"></i> Afternoon gems await you!`,
        `🌊 <i class="bi bi-water text-primary"></i> Flow with the rhythm!`,
        `🎭 <i class="bi bi-mask-happy text-warning"></i> Performance time!`,
        `🏅 <i class="bi bi-award text-success"></i> Excellence is calling!`
    ];

    // Evening (17-21 PM)
    const eveningMessages = [
        `🌇 <i class="bi bi-moon-stars-fill text-info"></i> Good evening!`,
        `📖 <i class="bi bi-journal-richtext text-secondary"></i> Reflect and recharge!`,
        `🌟 <i class="bi bi-star-fill text-warning"></i> You did amazing today!`,
        `🎶 <i class="bi bi-music-note-beamed text-primary"></i> Relax with good vibes!`,
        `🍵 <i class="bi bi-cup-straw text-success"></i> Slow down, breathe easy!`,
        `🙌 <i class="bi bi-emoji-smile-fill text-warning"></i> Celebrate small wins!`,
        `🛋 <i class="bi bi-house-heart-fill text-danger"></i> Enjoy your comfort zone!`,
        `🌌 <i class="bi bi-cloud-moon text-info"></i> Night is settling in—peace ahead!`,
        `🍷 <i class="bi bi-cup text-danger"></i> Unwind and appreciate!`,
        `🎨 <i class="bi bi-easel text-primary"></i> Evening creativity flows!`,
        `🧘‍♀️ <i class="bi bi-peace text-success"></i> Find your inner calm!`,
        `🎬 <i class="bi bi-camera-reels text-warning"></i> Enjoy life's moments!`,
        `🌹 <i class="bi bi-flower2 text-danger"></i> Beauty in the twilight!`,
        `📚 <i class="bi bi-book text-info"></i> Knowledge before rest!`,
        `🕯 <i class="bi bi-candle text-warning"></i> Light up the evening!`,
        `🎭 <i class="bi bi-drama-masks text-secondary"></i> Evening entertainment!`
    ];

    // Night (21-24 PM)
    const nightMessages = [
        `🌙 <i class="bi bi-stars text-light"></i> Good night!`,
        `🛌 <i class="bi bi-moon-fill text-info"></i> Rest well, dream big!`,
        `✨ <i class="bi bi-magic text-warning"></i> Tomorrow holds magic!`,
        `😴 <i class="bi bi-cloud-moon-fill text-secondary"></i> Recharge your soul!`,
        `🔕 <i class="bi bi-bell-slash-fill text-muted"></i> Disconnect and rest!`,
        `💤 <i class="bi bi-clouds-fill text-light"></i> Deep sleep matters!`,
        `🌠 <i class="bi bi-star text-warning"></i> Drift into dreams!`,
        `🛡 <i class="bi bi-shield-lock-fill text-success"></i> Safe and sound tonight!`,
        `🌜 <i class="bi bi-moon text-info"></i> Let the moon guide your dreams!`,
        `🎶 <i class="bi bi-music-note-list text-secondary"></i> Lullabies of the night!`,
        `🏰 <i class="bi bi-castle text-primary"></i> Build castles in your sleep!`,
        `🌌 <i class="bi bi-stars text-warning"></i> Cosmic dreams await!`,
        `🛏 <i class="bi bi-house text-success"></i> Home sweet dreams!`,
        `🔮 <i class="bi bi-crystal text-info"></i> Crystal clear rest ahead!`
    ];

    // Late Night/Midnight (0-5 AM)
    const lateNightMessages = [
        `🌃 <i class="bi bi-city text-primary"></i> Burning the midnight oil?`,
        `🦉 <i class="bi bi-moon-stars text-info"></i> Night owl vibes!`,
        `⭐ <i class="bi bi-stars text-warning"></i> Stars are your companions!`,
        `🌙 <i class="bi bi-moon text-secondary"></i> Midnight magic hour!`,
        `💻 <i class="bi bi-laptop text-primary"></i> Late night productivity!`,
        `🎧 <i class="bi bi-headphones text-info"></i> Night sounds and focus!`,
        `🔥 <i class="bi bi-flame text-danger"></i> Burning bright at night!`,
        `🌌 <i class="bi bi-infinity text-warning"></i> Limitless night energy!`,
        `☕ <i class="bi bi-cup-hot text-warning"></i> Midnight fuel running!`,
        `🎯 <i class="bi bi-crosshair text-success"></i> Sharp focus in the dark!`,
        `🚀 <i class="bi bi-rocket-takeoff text-primary"></i> Launch into the night!`,
        `🎪 <i class="bi bi-tent text-danger"></i> Night circus performance!`,
        `🔬 <i class="bi bi-microscope text-info"></i> Deep dive discoveries!`,
        `🎨 <i class="bi bi-paint-bucket text-warning"></i> Creative night sessions!`
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
    // Load user name from localStorage or context
               
    
    return (
        <div className="mt-20">
            <div className="max-w-7xl mx-auto">
                          
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-lg lg:text-3xl font-semibold text-[#083A85] mb-2">
                        {getTimeBasedGreeting()}, {userName}!
                    </h1>
                    <p className="text-gray-600 text-md">Here's what's happening with your tours experience</p>
                </div>
               
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
                    {summaryCards.map((card, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-2 right-2 opacity-5 text-4xl sm:text-5xl lg:text-6xl">
                                <i className={`bi bi-${card.icon}`} />
                            </div>
                            <div className="flex items-center mb-3">
                                <div 
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 text-white"
                                    style={{ backgroundColor: card.iconBg }}
                                >
                                    <i className={`bi bi-${card.icon} text-md sm:text-base`}/>
                                </div>
                                <span className="text-md sm:text-md text-gray-600 font-medium">{card.title}</span>
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 text-gray-800">{card.value}</div>
                            <div className="text-md sm:text-md text-green-600 flex items-center font-medium">
                                <i className="bi bi-arrow-up mr-1" />
                                {card.change}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    {/* Earnings Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-graph-up mr-2 text-pink-500" />
                                Monthly Earnings
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '8px',
                                            fontSize: '12px'
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

                    {/* Tour Bookings Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                Weekly Tour Bookings
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartBookingsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }} 
                                    />
                                    <Bar dataKey="tours" fill="#083A85" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Tours & Messages */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    {/* Today's Tours */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow h-max">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-calendar-week mr-2 text-green-600" />
                                Today's Schedule
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/tourguide/schedule')}}>
                                View Calendar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingTours.length > 0 ? upcomingTours.map((tour: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{tour.title}</h4>
                                            <p className="text-md text-gray-600 mt-1">{tour.meetingPoint}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-md font-medium ${
                                            tour.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {tour.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-md text-gray-500">
                                        <span>{tour.time} • {tour.duration}</span>
                                        <span>{tour.guests} guests</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-calendar-x text-3xl mb-2" />
                                    <p>No tours scheduled for today</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Messages */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-chat-dots mr-2 text-blue-600" />
                                Recent Activity
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium">
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentMessages.length > 0 ? recentMessages.map((message: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{message.guest}</h4>
                                            <p className="text-md text-gray-600 mt-1 line-clamp-2">{message.message}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-md font-medium ${
                                            message.type === 'review' ? 'bg-green-100 text-green-800' : 
                                            message.type === 'inquiry' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {message.type}
                                        </span>
                                    </div>
                                    <div className="text-md text-gray-500">{message.time}</div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-chat-square-dots text-3xl mb-2" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Tour Types */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow h-max">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                Tour Types
                            </h3>
                        </div>
                        <div className="h-48 sm:h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tourTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={70}
                                        paddingAngle={5}
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
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                            {tourTypes.map((type: any, index) => (
                                <div key={index} className="flex items-center text-md font-medium">
                                    <div 
                                        className="w-3 h-3 mr-2 rounded-sm"
                                        style={{ backgroundColor: type.color }}
                                    ></div>
                                    {type.name} ({type.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Reviews */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-star mr-2 text-amber-500" />
                                Recent Reviews
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/tourguide/reviews')}}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentReviews.length > 0 ? recentReviews.map((review: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                                <h4 className="font-medium text-gray-800 text-md mr-2">{review.guest}</h4>
                                                <div className="flex items-center">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <i key={i} className="bi bi-star-fill text-yellow-500 text-md" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-md text-gray-600 mb-1">{review.comment}</p>
                                            <div className="flex items-center justify-between text-md text-gray-500">
                                                <span>{review.tour}</span>
                                                <span>{review.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-star text-3xl mb-2" />
                                    <p>No reviews yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-base lg:text-lg font-semibold mb-4 text-gray-800">Performance Stats</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="text-2xl lg:text-3xl mb-2 text-gray-600">
                                    <i className={`bi bi-${stat.icon}`} />
                                </div>
                                <div className="text-lg lg:text-xl font-bold text-gray-800 mb-1">{stat.value}</div>
                                <div className="text-md lg:text-md text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourGuideDashboard;