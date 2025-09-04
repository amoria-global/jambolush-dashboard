'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GuestDashboard = () => {
    const router = useRouter();

    // Sample data for guest charts
    const spendingData = [
        { month: 'Jan', amount: 850 },
        { month: 'Feb', amount: 1200 },
        { month: 'Mar', amount: 950 },
        { month: 'Apr', amount: 1800 },
        { month: 'May', amount: 2200 },
        { month: 'Jun', amount: 1650 },
    ];

    const bookingTrendsData = [
        { month: 'Jan', bookings: 2 },
        { month: 'Feb', bookings: 1 },
        { month: 'Mar', bookings: 3 },
        { month: 'Apr', bookings: 2 },
        { month: 'May', bookings: 4 },
        { month: 'Jun', bookings: 3 },
    ];

    const experienceTypes = [
        { name: 'Hotels', value: 8, color: '#F20C8F' },
        { name: 'Tours', value: 5, color: '#083A85' },
        { name: 'Experiences', value: 3, color: '#10B981' },
        { name: 'Restaurants', value: 6, color: '#F59E0B' },
    ];

    const summaryCards = [
        {
            title: 'Total Bookings',
            value: '15',
            change: '+3 this month',
            icon: 'calendar-check',
            bgColor: 'bg-pink-500',
            iconBg: '#F20C8F',
        },
        {
            title: 'Upcoming Trips',
            value: '2',
            change: 'Next: July 15',
            icon: 'suitcase-lg',
            bgColor: 'bg-blue-800',
            iconBg: '#083A85',
        },
        {
            title: 'Total Spent',
            value: '$8,650',
            change: '+$1,200 this month',
            icon: 'credit-card',
            bgColor: 'bg-green-500',
            iconBg: '#10B981',
        },
        {
            title: 'Wishlist Items',
            value: '12',
            change: '+2 new',
            icon: 'heart',
            bgColor: 'bg-amber-500',
            iconBg: '#F59E0B',
        },
    ];

    const recentActivities = [
        { icon: 'check-circle', text: 'Confirmed booking for Bali Resort', time: '1 hour ago', color: 'text-green-500' },
        { icon: 'heart-fill', text: 'Added Tokyo Tour to wishlist', time: '3 hours ago', color: 'text-pink-500' },
        { icon: 'star-fill', text: 'Left review for Paris Experience', time: '1 day ago', color: 'text-amber-500' },
        { icon: 'credit-card', text: 'Payment confirmed for Beach Villa', time: '2 days ago', color: 'text-blue-600' },
    ];

    const upcomingSchedule = [
        { title: 'Beach Villa Check-in', date: 'July 15, 2025', time: '3:00 PM', location: 'Santorini, Greece', status: 'Confirmed' },
        { title: 'Sunset Tour', date: 'July 16, 2025', time: '6:30 PM', location: 'Santorini, Greece', status: 'Confirmed' },
        { title: 'City Walking Tour', date: 'July 22, 2025', time: '10:00 AM', location: 'Rome, Italy', status: 'Pending' },
    ];

    const quickStats = [
        { label: 'Trip Days', value: '45', icon: 'calendar' },
        { label: 'Countries Visited', value: '8', icon: 'globe' },
        { label: 'Avg. Rating Given', value: '4.6', icon: 'star-fill' },
        { label: 'Loyalty Points', value: '2,450', icon: 'trophy' },
    ];

    const wishlistItems = [
        { name: 'Swiss Alps Chalet', location: 'Switzerland', price: '$320/night', saved: '2 days ago' },
        { name: 'Tokyo Food Tour', location: 'Japan', price: '$85/person', saved: '1 week ago' },
        { name: 'Safari Experience', location: 'Kenya', price: '$450/person', saved: '2 weeks ago' },
    ];

    return (
        <div className="mt-18">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-18">
                    <h1 className="text-lg lg:text-3xl font-semibold text-[#083A85] mb-2">Welcome back, Sarah!</h1>
                    <p className="text-gray-600 text-md">Here's what's happening with your travels</p>
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
                    {/* Spending Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-graph-up mr-2 text-pink-500" />
                                Monthly Spending
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={spendingData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                                        dataKey="amount" 
                                        stroke="#F20C8F" 
                                        strokeWidth={3} 
                                        dot={{ fill: '#F20C8F', strokeWidth: 2, r: 4 }} 
                                        activeDot={{ r: 6, stroke: '#F20C8F', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Booking Trends Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                Booking Trends
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bookingTrendsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                                    <Bar dataKey="bookings" fill="#083A85" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Upcoming Schedule & Wishlist */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    {/* Upcoming Schedule */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-calendar-week mr-2 text-blue-600" />
                                Upcoming Schedule
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/agent/schedule')}}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingSchedule.map((event, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{event.title}</h4>
                                            <p className="text-md text-gray-600 mt-1">{event.location}</p>
                                            <p className="text-md text-gray-500 mt-1">{event.date} at {event.time}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-md font-medium ${
                                            event.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Wishlist */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-heart mr-2 text-pink-500" />
                                Recent Wishlist
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/agent/wishlist')}}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {wishlistItems.map((item, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{item.name}</h4>
                                            <p className="text-md text-gray-600 mt-1">{item.location}</p>
                                            <p className="text-md text-gray-500 mt-1">Saved {item.saved}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-md font-medium text-gray-800">{item.price}</span>
                                            <button className="block mt-1 text-md text-pink-600 hover:text-pink-800">
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Experience Types */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                Experience Types
                            </h3>
                        </div>
                        <div className="h-48 sm:h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={experienceTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {experienceTypes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                            {experienceTypes.map((type, index) => (
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

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-clock-history mr-2 text-gray-800" />
                                Recent Activity
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/agent/logs')}}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className={`mr-3 ${activity.color}`}>
                                        <i className={`bi bi-${activity.icon} text-lg`} />
                                    </div>
                                    <span className="flex-1 text-md font-medium text-gray-700">{activity.text}</span>
                                    <span className="text-gray-400 text-md font-medium">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-base lg:text-lg font-semibold mb-4 text-gray-800">Travel Stats</h3>
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

export default GuestDashboard;