'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';



const Dashboard = () => {
    const router = useRouter();
    // Sample data for charts
    const earningsData = [
        { month: 'Jan', amount: 4200 },
        { month: 'Feb', amount: 5300 },
        { month: 'Mar', amount: 6100 },
        { month: 'Apr', amount: 5800 },
        { month: 'May', amount: 7200 },
        { month: 'Jun', amount: 8500 },
    ];

    const bookingsData = [
        { day: 'Mon', bookings: 12 },
        { day: 'Tue', bookings: 19 },
        { day: 'Wed', bookings: 15 },
        { day: 'Thu', bookings: 22 },
        { day: 'Fri', bookings: 28 },
        { day: 'Sat', bookings: 35 },
        { day: 'Sun', bookings: 30 },
    ];

    const propertyTypes = [
        { name: 'Houses', value: 12, color: '#F20C8F' },
        { name: 'Apartments', value: 8, color: '#083A85' },
        { name: 'Villas', value: 4, color: '#666' },
    ];

    const summaryCards = [
        {
            title: 'Total Earnings',
            value: '$36,900',
            change: '+12.5%',
            icon: 'currency-dollar',
            bgColor: 'bg-pink-500',
            iconBg: '#F20C8F',
        },
        {
            title: 'Properties',
            value: '24',
            change: '+3 new',
            icon: 'house-door',
            bgColor: 'bg-blue-800',
            iconBg: '#083A85',
        },
        {
            title: 'Active Bookings',
            value: '142',
            change: '+18%',
            icon: 'calendar-check',
            bgColor: 'bg-gray-600',
            iconBg: '#666',
        },
        {
            title: 'Total Guests',
            value: '1,284',
            change: '+24%',
            icon: 'people',
            bgColor: 'bg-gray-800',
            iconBg: '#333',
        },
    ];

    const recentActivities = [
        { icon: 'check-circle', text: 'New booking for Villa Marina', time: '2 min ago', color: 'text-green-500' },
        { icon: 'star-fill', text: '5-star review received', time: '1 hour ago', color: 'text-pink-500' },
        { icon: 'person-plus', text: 'New guest registered', time: '3 hours ago', color: 'text-blue-800' },
        { icon: 'x-circle', text: 'Cancellation for Apt 203', time: '5 hours ago', color: 'text-red-500' },
    ];

    const quickStats = [
        { label: 'Occupancy Rate', value: '87%', icon: 'bar-chart' },
        { label: 'Avg. Rating', value: '4.8', icon: 'star-fill' },
        { label: 'Response Time', value: '< 1h', icon: 'clock' },
        { label: 'Superhost Status', value: 'Active', icon: 'trophy' },
    ];

    return (
        <>

            <div className="mt-20">
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

                        {/* Bookings Chart */}
                        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                    <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                    Weekly Bookings
                                </h3>
                                <div className="text-md text-gray-500">
                                    <i className="bi bi-three-dots" />
                                </div>
                            </div>
                            <div className="h-48 sm:h-56 lg:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bookingsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                                        <Bar dataKey="bookings" fill="#083A85" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        {/* Property Distribution */}
                        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                    <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                    Property Types
                                </h3>
                            </div>
                            <div className="h-48 sm:h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={propertyTypes}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {propertyTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-3">
                                {propertyTypes.map((type, index) => (
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
                                <button className="text-md text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/host/logs')}}>
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
                        <h3 className="text-base lg:text-lg font-semibold mb-4 text-gray-800">Quick Stats</h3>
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
        </>
    );
};

export default Dashboard;