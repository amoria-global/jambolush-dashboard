'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import  api  from '@/app/api/apiService'; // Adjust path as needed

const AgentDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [propertiesData, setPropertiesData] = useState<any>(null);
    const [earningsData, setEarningsData] = useState<any>(null);
    const [userName, setUserName] = useState('Agent');

    // Get time-based greeting
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        if (hour < 21) return 'Good evening';
        return 'Good night';
    };

    // Load all dashboard data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load user name from localStorage or context
                const user = JSON.parse(localStorage.getItem('userSession') || '{}');
                if (user.name) {
                    setUserName(user.name);
                }

                // Fetch all required data concurrently
                const [dashboardResponse, propertiesResponse, earningsResponse]: any = await Promise.all([
                    api.get('/properties/agent/dashboard'),
                    api.get('/properties/agent/properties'),
                    api.get('/properties/agent/earnings')
                ]);

                if (dashboardResponse.success) {
                    setDashboardData(dashboardResponse.data);
                }

                if (propertiesResponse.success) {
                    setPropertiesData(propertiesResponse.data);
                }

                if (earningsResponse.success) {
                    setEarningsData(earningsResponse.data);
                }

            } catch (err: Error | any) {
                console.error('Error loading dashboard data:', err);
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    // Transform monthly commissions data for chart
    const getMonthlyEarningsData = () => {
        if (!dashboardData?.monthlyCommissions) return [];
        
        return dashboardData.monthlyCommissions.map((item: any) => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
            commission: item.commission || 0,
            bonus: item.bonus || 0
        }));
    };

    // Transform recent bookings for client acquisition chart
    const getClientAcquisitionData = () => {
        if (!dashboardData?.recentBookings) return [];
        
        // Group bookings by week
        const weeklyData: { [key: string]: number } = {};
        dashboardData.recentBookings.forEach((booking: any, index: number) => {
            const weekKey = `Week ${Math.floor(index / 7) + 1}`;
            weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
        });

        return Object.entries(weeklyData).map(([week, clients]) => ({
            week,
            clients
        }));
    };

    // Get summary cards data
    const getSummaryCards = () => {
        if (!dashboardData) return [];

        return [
            {
                title: 'Active Clients',
                value: dashboardData.activeClients?.toString() || '0',
                change: `${dashboardData.totalClients || 0} total clients`,
                icon: 'people',
                iconBg: '#F20C8F',
            },
            {
                title: 'Total Earnings',
                value: `$${dashboardData.totalCommissions?.toLocaleString() || '0'}`,
                change: `$${dashboardData.pendingCommissions?.toLocaleString() || '0'} pending`,
                icon: 'currency-dollar',
                iconBg: '#083A85',
            },
            {
                title: 'Properties Managed',
                value: propertiesData?.total?.toString() || '0',
                change: `${propertiesData?.properties?.length || 0} active listings`,
                icon: 'house-door',
                iconBg: '#10B981',
            },
            {
                title: 'Avg Commission',
                value: `$${dashboardData.avgCommissionPerBooking?.toFixed(0) || '0'}`,
                change: 'per booking',
                icon: 'graph-up-arrow',
                iconBg: '#F59E0B',
            },
        ];
    };

    // Get recent activities from bookings
    const getRecentActivities = () => {
        if (!dashboardData?.recentBookings) return [];
        
        return dashboardData.recentBookings.slice(0, 4).map((booking: any, index: number) => ({
            icon: index % 4 === 0 ? 'person-plus' : index % 4 === 1 ? 'house-add' : index % 4 === 2 ? 'calendar-check' : 'cash-coin',
            text: `${booking.guestName ? 'New booking from ' + booking.guestName : 'New booking received'}${booking.propertyName ? ' for ' + booking.propertyName : ''}`,
            time: new Date(booking.createdAt || booking.checkIn).toLocaleDateString(),
            color: index % 4 === 0 ? 'text-green-500' : index % 4 === 1 ? 'text-blue-600' : index % 4 === 2 ? 'text-pink-500' : 'text-green-600'
        }));
    };

    // Get upcoming appointments from recent bookings
    const getUpcomingAppointments = () => {
        if (!dashboardData?.recentBookings) return [];
        
        return dashboardData.recentBookings.slice(0, 3).map((booking: any, index: number) => ({
            client: booking.guestName || `Client ${index + 1}`,
            property: booking.propertyName || 'Property Viewing',
            time: new Date(booking.checkIn).toLocaleDateString(),
            type: index % 3 === 0 ? 'Property Viewing' : index % 3 === 1 ? 'Contract Signing' : 'Initial Consultation',
            priority: index < 2 ? 'high' : 'medium'
        }));
    };

    // Get top properties
    const getTopProperties = () => {
        if (!propertiesData?.properties) return [];

        return propertiesData.properties.slice(0, 3).map((property: any, index: number) => ({
            name: property.name || `Property ${index + 1}`,
            bookings: property.totalBookings || 0,
            revenue: `$${property.totalRevenue?.toLocaleString() || '0'}`,
            rating: property.averageRating?.toFixed(1) || '4.5',
            location: property.location || property.city || 'Location'
        }));
    };

    // Property categories for pie chart
    const getPropertyCategories = () => {
        if (!propertiesData?.properties) return [];

        const categories: { [key: string]: number } = {};
        propertiesData.properties.forEach((property: any) => {
            const type = property.propertyType || 'Other';
            categories[type] = (categories[type] || 0) + 1;
        });

        const colors = ['#F20C8F', '#083A85', '#10B981', '#F59E0B', '#8B5CF6'];
        return Object.entries(categories).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    };

    // Quick stats
    const getQuickStats = () => [
        { 
            label: 'Conversion Rate', 
            value: earningsData?.totalBookings > 0 ? `${((earningsData.totalBookings / (dashboardData?.totalClients || 1)) * 100).toFixed(0)}%` : '0%', 
            icon: 'arrow-up-circle' 
        },
        { 
            label: 'Avg. Deal Size', 
            value: `$${(earningsData?.totalEarnings / Math.max(earningsData?.totalBookings || 1, 1))?.toFixed(0) || '0'}`, 
            icon: 'currency-dollar' 
        },
        { 
            label: 'Total Bookings', 
            value: earningsData?.totalBookings?.toString() || '0', 
            icon: 'calendar-check' 
        },
        { 
            label: 'Client Satisfaction', 
            value: '4.8/5', 
            icon: 'star-fill' 
        },
    ];

    if (loading) {
        return (
            <div className="mt-18">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-18">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center">
                            <i className="bi bi-exclamation-triangle text-red-500 text-xl mr-3"></i>
                            <div>
                                <h3 className="text-red-800 font-semibold">Error Loading Dashboard</h3>
                                <p className="text-red-600 mt-1">{error}</p>
                                <button 
                                    onClick={() => window.location.reload()} 
                                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const monthlyEarningsData = getMonthlyEarningsData();
    const clientAcquisitionData = getClientAcquisitionData();
    const summaryCards = getSummaryCards();
    const recentActivities = getRecentActivities();
    const upcomingAppointments = getUpcomingAppointments();
    const topProperties = getTopProperties();
    const propertyCategories = getPropertyCategories();
    const quickStats = getQuickStats();

    return (
        <div className="mt-18">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-lg lg:text-3xl font-semibold text-[#083A85] mb-2">
                        {getTimeBasedGreeting()}, {userName}!
                    </h1>
                    <p className="text-gray-600 text-md">Here's what's happening with your property business</p>
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
                            {monthlyEarningsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                                            dataKey="commission" 
                                            stroke="#F20C8F" 
                                            strokeWidth={3} 
                                            dot={{ fill: '#F20C8F', strokeWidth: 2, r: 4 }} 
                                            name="Commission"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="bonus" 
                                            stroke="#083A85" 
                                            strokeWidth={2} 
                                            dot={{ fill: '#083A85', strokeWidth: 2, r: 3 }} 
                                            name="Bonus"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <i className="bi bi-graph-up text-3xl mb-2"></i>
                                        <p>No earnings data available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Acquisition Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                Weekly Client Activity
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            {clientAcquisitionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={clientAcquisitionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'white', 
                                                border: '1px solid #e5e7eb', 
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }} 
                                        />
                                        <Bar dataKey="clients" fill="#083A85" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <i className="bi bi-bar-chart text-3xl mb-2"></i>
                                        <p>No client activity data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Appointments & Properties */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-calendar-event mr-2 text-blue-600" />
                                Recent Bookings
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/agent/schedule')}}>
                                View Calendar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{appointment.client}</h4>
                                            <p className="text-md text-gray-600 mt-1">{appointment.property}</p>
                                            <p className="text-md text-gray-500 mt-1">{appointment.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-md font-medium text-gray-800">{appointment.time}</span>
                                            <span className={`block mt-1 px-2 py-1 rounded-full text-md font-medium ${
                                                appointment.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {appointment.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-calendar-x text-3xl mb-2"></i>
                                    <p>No recent bookings</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Properties */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-trophy mr-2 text-amber-500" />
                                Top Performing Properties
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => router.push('/agent/properties')}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {topProperties.length > 0 ? topProperties.map((property: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{property.name}</h4>
                                            <p className="text-md text-gray-600 mt-1">{property.location}</p>
                                            <p className="text-md text-gray-500 mt-1">{property.bookings} bookings</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-md font-bold text-green-600">{property.revenue}</span>
                                            <div className="flex items-center mt-1">
                                                <i className="bi bi-star-fill text-yellow-500 text-md mr-1" />
                                                <span className="text-md text-gray-600">{property.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-house-x text-3xl mb-2"></i>
                                    <p>No properties available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Property Categories */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                Property Portfolio
                            </h3>
                        </div>
                        <div className="h-48 sm:h-56">
                            {propertyCategories.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={propertyCategories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {propertyCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap justify-center gap-3 mt-3">
                                        {propertyCategories.map((type, index) => (
                                            <div key={index} className="flex items-center text-md font-medium">
                                                <div 
                                                    className="w-3 h-3 mr-2 rounded-sm"
                                                    style={{ backgroundColor: type.color }}
                                                ></div>
                                                {type.name} ({type.value})
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <i className="bi bi-pie-chart text-3xl mb-2"></i>
                                        <p>No property data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-clock-history mr-2 text-gray-800" />
                                Recent Activity
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => router.push('/agent/logs')}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentActivities.length > 0 ? recentActivities.map((activity: any, index: number) => (
                                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className={`mr-3 ${activity.color}`}>
                                        <i className={`bi bi-${activity.icon} text-lg`} />
                                    </div>
                                    <span className="flex-1 text-md font-medium text-gray-700">{activity.text}</span>
                                    <span className="text-gray-400 text-md font-medium">{activity.time}</span>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-clock-history text-3xl mb-2"></i>
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-base lg:text-lg font-semibold mb-4 text-gray-800">Performance Metrics</h3>
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

export default AgentDashboard;