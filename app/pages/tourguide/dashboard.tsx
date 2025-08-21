'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TourGuideDashboard = () => {
    const router = useRouter();

    // Sample data for tour guide charts
    const earningsData = [
        { month: 'Jan', earnings: 2800 },
        { month: 'Feb', earnings: 3200 },
        { month: 'Mar', earnings: 3800 },
        { month: 'Apr', earnings: 4100 },
        { month: 'May', earnings: 5200 },
        { month: 'Jun', earnings: 4800 },
    ];

    const tourBookingsData = [
        { day: 'Mon', tours: 3 },
        { day: 'Tue', tours: 2 },
        { day: 'Wed', tours: 4 },
        { day: 'Thu', tours: 3 },
        { day: 'Fri', tours: 5 },
        { day: 'Sat', tours: 6 },
        { day: 'Sun', tours: 4 },
    ];

    const tourTypes = [
        { name: 'City Walking', value: 18, color: '#F20C8F' },
        { name: 'Food Tours', value: 12, color: '#083A85' },
        { name: 'Historical Sites', value: 8, color: '#10B981' },
        { name: 'Nature Hikes', value: 6, color: '#F59E0B' },
    ];

    const summaryCards = [
        {
            title: 'Active Tours',
            value: '44',
            change: '+6 this month',
            icon: 'map',
            bgColor: 'bg-pink-500',
            iconBg: '#F20C8F',
        },
        {
            title: 'Total Guests',
            value: '326',
            change: '+28 this week',
            icon: 'people',
            bgColor: 'bg-blue-800',
            iconBg: '#083A85',
        },
        {
            title: 'Monthly Earnings',
            value: '$4,800',
            change: '+18.5% vs last month',
            icon: 'currency-dollar',
            bgColor: 'bg-green-500',
            iconBg: '#10B981',
        },
        {
            title: 'Average Rating',
            value: '4.9',
            change: 'Top rated guide',
            icon: 'star',
            bgColor: 'bg-amber-500',
            iconBg: '#F59E0B',
        },
    ];

    const recentMessages = [
        { guest: 'Emma Wilson', message: 'Amazing food tour! Thank you for the recommendations.', time: '10 min ago', type: 'review' },
        { guest: 'John Martinez', message: 'Can we extend the city tour by 30 minutes?', time: '45 min ago', type: 'inquiry' },
        { guest: 'Sarah Kim', message: 'Where should we meet for tomorrow\'s hike?', time: '2 hours ago', type: 'question' },
        { guest: 'Mike Chen', message: 'Perfect timing and great knowledge! 5 stars!', time: '3 hours ago', type: 'review' },
    ];

    const upcomingTours = [
        { 
            title: 'Historic Downtown Walking Tour', 
            time: '9:00 AM', 
            guests: 8, 
            duration: '2.5 hrs',
            meetingPoint: 'City Hall Steps',
            status: 'confirmed'
        },
        { 
            title: 'Food & Culture Experience', 
            time: '2:00 PM', 
            guests: 6, 
            duration: '3 hrs',
            meetingPoint: 'Central Market',
            status: 'confirmed'
        },
        { 
            title: 'Sunset Photography Tour', 
            time: '6:30 PM', 
            guests: 4, 
            duration: '2 hrs',
            meetingPoint: 'Observation Deck',
            status: 'pending'
        },
    ];

    const recentReviews = [
        { guest: 'Alice Johnson', rating: 5, comment: 'Exceptional guide with deep local knowledge. Highly recommend!', tour: 'Historical Sites Tour', date: '2 days ago' },
        { guest: 'Robert Davis', rating: 5, comment: 'Perfect mix of history and fun. Great storytelling!', tour: 'City Walking Tour', date: '3 days ago' },
        { guest: 'Lisa Park', rating: 4, comment: 'Very informative and well organized. Would book again.', tour: 'Food Experience', date: '1 week ago' },
    ];

    const quickStats = [
        { label: 'Tours Completed', value: '187', icon: 'check-circle' },
        { label: 'Response Rate', value: '98%', icon: 'chat-dots' },
        { label: 'Repeat Customers', value: '34%', icon: 'arrow-repeat' },
        { label: 'Languages', value: '3', icon: 'translate' },
    ];

    return (
        <div className="mt-10">
            <div className="max-w-7xl mx-auto">
               
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
                                    <i className={`bi bi-${card.icon} text-sm sm:text-base`}/>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-600 font-medium">{card.title}</span>
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 text-gray-800">{card.value}</div>
                            <div className="text-xs sm:text-sm text-green-600 flex items-center font-medium">
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
                            <div className="text-xs text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={earningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                            <div className="text-xs text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tourBookingsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/tourguide/schedule')}}>
                                View Calendar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingTours.map((tour, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-sm">{tour.title}</h4>
                                            <p className="text-xs text-gray-600 mt-1">{tour.meetingPoint}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            tour.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {tour.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{tour.time} • {tour.duration}</span>
                                        <span>{tour.guests} guests</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Messages */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-chat-dots mr-2 text-blue-600" />
                                Recent Messages
                            </h3>
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentMessages.map((message, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-sm">{message.guest}</h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{message.message}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            message.type === 'review' ? 'bg-green-100 text-green-800' : 
                                            message.type === 'inquiry' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {message.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{message.time}</div>
                                </div>
                            ))}
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
                            {tourTypes.map((type, index) => (
                                <div key={index} className="flex items-center text-xs font-medium">
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
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/tourguide/reviews')}}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentReviews.map((review, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                                <h4 className="font-medium text-gray-800 text-sm mr-2">{review.guest}</h4>
                                                <div className="flex items-center">
                                                    {[...Array(review.rating)].map((_, i) => (
                                                        <i key={i} className="bi bi-star-fill text-yellow-500 text-xs" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1">{review.comment}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{review.tour}</span>
                                                <span>{review.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                <div className="text-xs lg:text-sm text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourGuideDashboard;