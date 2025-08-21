'use client';

import { ro } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AgentDashboard = () => {
    const router = useRouter();

    // Sample data for field agent charts
    const earningsData = [
        { month: 'Jan', commission: 3200, bonus: 500 },
        { month: 'Feb', commission: 4100, bonus: 800 },
        { month: 'Mar', commission: 3800, bonus: 600 },
        { month: 'Apr', commission: 5200, bonus: 1200 },
        { month: 'May', commission: 4800, bonus: 900 },
        { month: 'Jun', commission: 6100, bonus: 1500 },
    ];

    const clientAcquisitionData = [
        { week: 'Week 1', clients: 3 },
        { week: 'Week 2', clients: 5 },
        { week: 'Week 3', clients: 2 },
        { week: 'Week 4', clients: 7 },
    ];

    const propertyCategories = [
        { name: 'Luxury Villas', value: 8, color: '#F20C8F' },
        { name: 'City Apartments', value: 15, color: '#083A85' },
        { name: 'Beach Houses', value: 6, color: '#10B981' },
        { name: 'Mountain Cabins', value: 4, color: '#F59E0B' },
    ];

    const summaryCards = [
        {
            title: 'Active Clients',
            value: '47',
            change: '+8 this month',
            icon: 'people',
            bgColor: 'bg-pink-500',
            iconBg: '#F20C8F',
        },
        {
            title: 'Total Earnings',
            value: '$27,500',
            change: '+15.2% vs last month',
            icon: 'currency-dollar',
            bgColor: 'bg-blue-800',
            iconBg: '#083A85',
        },
        {
            title: 'Properties Managed',
            value: '33',
            change: '+2 new listings',
            icon: 'house-door',
            bgColor: 'bg-green-500',
            iconBg: '#10B981',
        },
        {
            title: 'Performance Score',
            value: '94%',
            change: 'Top 5% this month',
            icon: 'graph-up-arrow',
            bgColor: 'bg-amber-500',
            iconBg: '#F59E0B',
        },
    ];

    const recentActivities = [
        { icon: 'person-plus', text: 'New client onboarded: Maria Santos', time: '30 min ago', color: 'text-green-500' },
        { icon: 'house-add', text: 'Listed new property: Ocean View Villa', time: '2 hours ago', color: 'text-blue-600' },
        { icon: 'calendar-check', text: 'Site visit scheduled with John Smith', time: '4 hours ago', color: 'text-pink-500' },
        { icon: 'cash-coin', text: 'Commission payment received: $1,200', time: '1 day ago', color: 'text-green-600' },
    ];

    const upcomingAppointments = [
        { client: 'Sarah Johnson', property: 'Downtown Penthouse', time: '2:00 PM', type: 'Property Viewing', priority: 'high' },
        { client: 'Michael Chen', property: 'Riverside Apartment', time: '4:30 PM', type: 'Contract Signing', priority: 'high' },
        { client: 'Emma Wilson', property: 'Garden Villa', time: '10:00 AM Tomorrow', type: 'Initial Consultation', priority: 'medium' },
    ];

    const topProperties = [
        { name: 'Sunset Villa', bookings: 28, revenue: '$8,400', rating: '4.9', location: 'Malibu' },
        { name: 'City Loft', bookings: 24, revenue: '$6,720', rating: '4.8', location: 'Downtown' },
        { name: 'Beach House', bookings: 19, revenue: '$9,500', rating: '4.7', location: 'Santa Monica' },
    ];

    const quickStats = [
        { label: 'Conversion Rate', value: '68%', icon: 'arrow-up-circle' },
        { label: 'Avg. Deal Size', value: '$2,850', icon: 'currency-dollar' },
        { label: 'Response Time', value: '< 15m', icon: 'clock' },
        { label: 'Client Satisfaction', value: '4.8/5', icon: 'star-fill' },
    ];

    return (
        <div className="mt-10">
            <div className="max-w-7xl mx-auto">
                 {/* Header */}
                <div className="mb-8">
                    <h1 className="text-lg lg:text-xl font-semibold text-[#083A85] mb-2">Welcome back, Sarah!</h1>
                    <p className="text-gray-600 text-sm">Here's what's happening with your travels</p>
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
                        </div>
                    </div>

                    {/* Client Acquisition Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                Weekly Client Acquisition
                            </h3>
                            <div className="text-xs text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
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
                                Today's Appointments
                            </h3>
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={() => {router.push('/agent/schedule')}}>
                                View Calendar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingAppointments.map((appointment, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-sm">{appointment.client}</h4>
                                            <p className="text-xs text-gray-600 mt-1">{appointment.property}</p>
                                            <p className="text-xs text-gray-500 mt-1">{appointment.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-medium text-gray-800">{appointment.time}</span>
                                            <span className={`block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                appointment.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {appointment.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Properties */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-trophy mr-2 text-amber-500" />
                                Top Performing Properties
                            </h3>
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={() => router.push('/agent/properties')}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {topProperties.map((property, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-sm">{property.name}</h4>
                                            <p className="text-xs text-gray-600 mt-1">{property.location}</p>
                                            <p className="text-xs text-gray-500 mt-1">{property.bookings} bookings</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-green-600">{property.revenue}</span>
                                            <div className="flex items-center mt-1">
                                                <i className="bi bi-star-fill text-yellow-500 text-xs mr-1" />
                                                <span className="text-xs text-gray-600">{property.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                            {propertyCategories.map((type, index) => (
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

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-clock-history mr-2 text-gray-800" />
                                Recent Activity
                            </h3>
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={() => router.push('/agent/logs')}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className={`mr-3 ${activity.color}`}>
                                        <i className={`bi bi-${activity.icon} text-lg`} />
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-gray-700">{activity.text}</span>
                                    <span className="text-gray-400 text-xs font-medium">{activity.time}</span>
                                </div>
                            ))}
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
                                <div className="text-xs lg:text-sm text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;