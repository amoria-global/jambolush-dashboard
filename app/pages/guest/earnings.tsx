'use client';

import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- TYPE DEFINITIONS ---
// Data structure for monthly spending.
type MonthlySpending = {
    month: string;
    spent: number;
    bookings: number;
};

// Data structure for spending by category.
type CategorySpending = {
    name: string;
    spent: number;
};

// Data structure for a single payment transaction.
type Payment = {
    id: string;
    property: string;
    date: string;
    amount: number;
    status: 'Completed' | 'Upcoming';
};

// --- GUEST PAYMENTS COMPONENT ---
const Payments = () => {
    // --- MOCK DATA ---
    const upcomingPayments = 450.00; // Mock data for a user's upcoming payment.

    // Mock summary data for guest spending.
    const summaryData = {
        totalSpentYTD: 15725,
        totalBookings: 8,
        favoriteProperty: 'Mountain Cabin',
    };

    // Mock data for the "Spending Over Time" area chart.
    const monthlySpendingData: MonthlySpending[] = [
        { month: 'Jan', spent: 1250, bookings: 1 }, { month: 'Feb', spent: 1500, bookings: 1 },
        { month: 'Mar', spent: 0, bookings: 0 }, { month: 'Apr', spent: 2100, bookings: 2 },
        { month: 'May', spent: 1875, bookings: 1 }, { month: 'Jun', spent: 3400, bookings: 1 },
        { month: 'Jul', spent: 2800, bookings: 1 }, { month: 'Aug', spent: 2800, bookings: 1 },
    ];

    // Mock data for the "Spending by Category" bar chart.
    const categorySpendingData: CategorySpending[] = [
        { name: 'Mountain', spent: 6200 }, { name: 'Beachfront', spent: 5400 },
        { name: 'Urban', spent: 3125 }, { name: 'Lakeside', spent: 1000 },
    ];
    
    // Mock data for the "Recent Payments" table.
    const recentPayments: Payment[] = [
        { id: 'PAY-005', property: 'Lakeside Cottage', date: '2025-08-25', amount: 450.00, status: 'Upcoming' },
        { id: 'PAY-004', property: 'Beachfront Villa', date: '2025-08-20', amount: 2450.00, status: 'Completed' },
        { id: 'PAY-003', property: 'Downtown Loft', date: '2025-08-18', amount: 1800.50, status: 'Completed' },
        { id: 'PAY-002', property: 'Mountain Cabin', date: '2025-08-15', amount: 1230.00, status: 'Completed' },
        { id: 'PAY-001', property: 'Suburban Home', date: '2025-08-12', amount: 980.75, status: 'Completed' },
    ];

    // --- RENDER ---
    return (
        <div className="mt-20 font-inter">
            <div className="max-w-7xl mx-auto p-4 md:p-0">
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                    {/* Upcoming Payments Card */}
                    <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-md flex flex-col justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Upcoming Payments</p>
                            <p className="text-3xl font-bold text-black">${upcomingPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <button className="w-full mt-3 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer" style={{backgroundColor: '#083A85'}}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check inline-block mr-2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
                            View Schedule
                        </button>
                    </div>
                    {/* Summary Cards */}
                    <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Total Spent YTD</p>
                                <p className="text-xl font-bold text-black">${summaryData.totalSpentYTD.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card text-white"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Total Bookings</p>
                                <p className="text-xl font-bold text-black">{summaryData.totalBookings}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: '#083A85' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-plus text-white"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 16v6"/><path d="M9 19h6"/></svg>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Favorite Property</p>
                                <p className="text-xl font-bold text-black truncate">{summaryData.favoriteProperty}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Spending Over Time Chart */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-base font-semibold text-black mb-2">Spending Over Time</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlySpendingData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '8px', fontSize: '12px', color: 'white' }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                    <Legend wrapperStyle={{fontSize: "12px"}} />
                                    <Area type="monotone" dataKey="spent" stackId="1" stroke="#F20C8F" fill="#F20C8F" fillOpacity={0.8} />
                                    <Area type="monotone" dataKey="bookings" stackId="1" stroke="#083A85" fill="#083A85" fillOpacity={0.9} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Spending by Category Chart */}
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-base font-semibold text-black mb-2">Spending by Category</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categorySpendingData} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: '8px', fontSize: '12px' }} />
                                    <Bar dataKey="spent" fill="#F20C8F" radius={[0, 8, 8, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                {/* Recent Payments Table */}
                <div className="mt-4 bg-white p-4 rounded-xl shadow-md">
                    <h2 className="text-base font-semibold text-black mb-2">Recent Payments</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-2 text-xs font-semibold text-gray-500">Transaction ID</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500">Property</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500">Date</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500 text-right">Amount</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-2 text-xs text-black font-mono">{payment.id}</td>
                                        <td className="p-2 text-xs text-gray-700">{payment.property}</td>
                                        <td className="p-2 text-xs text-gray-700">{payment.date}</td>
                                        <td className="p-2 text-xs text-black font-medium text-right">${payment.amount.toFixed(2)}</td>
                                        <td className="p-2 text-xs text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ payment.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payments;
