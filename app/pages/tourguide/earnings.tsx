'use client';

import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- TYPE DEFINITIONS ---
type MonthlyEarning = {
  month: string;
  bookings: number;
  tips: number;
};

type TourPerformance = {
  name: string;
  value: number;
};

type Payout = {
  id: string;
  tour: string;
  date: string;
  amount: number;
  tip: number;
};

const COLORS = ['#083A85', '#F20C8F', '#333333', '#666666', '#999999'];

// --- TOUR GUIDE EARNINGS  COMPONENT ---
const TourGuideEarnings = () => {
    // --- MOCK DATA ---
    const summaryData = {
        totalEarnings: 28400,
        upcomingPayout: 3200,
        avgTipPerBooking: 25,
        bookingsThisMonth: 42,
    };

    const monthlyEarningsData: MonthlyEarning[] = [
        { month: 'Jan', bookings: 2800, tips: 450 },
        { month: 'Feb', bookings: 2500, tips: 400 },
        { month: 'Mar', bookings: 3200, tips: 550 },
        { month: 'Apr', bookings: 3500, tips: 600 },
        { month: 'May', bookings: 4100, tips: 750 },
        { month: 'Jun', bookings: 4800, tips: 850 },
        { month: 'Jul', bookings: 5300, tips: 950 },
    ];

    const tourPerformanceData: TourPerformance[] = [
        { name: 'City History Walk', value: 12500 },
        { name: 'Food & Drink Tour', value: 8800 },
        { name: 'Mountain Hiking', value: 4500 },
        { name: 'Art Gallery Tour', value: 2600 },
    ];
    
    const recentPayouts: Payout[] = [
        { id: 'PAY-T-71', tour: 'City History Walk', date: '2025-08-19', amount: 850.00, tip: 120.00 },
        { id: 'PAY-T-72', tour: 'Food & Drink Tour', date: '2025-08-17', amount: 680.00, tip: 95.00 },
        { id: 'PAY-T-73', tour: 'Mountain Hiking', date: '2025-08-14', amount: 450.50, tip: 60.00 },
        { id: 'PAY-T-74', tour: 'City History Walk', date: '2025-08-12', amount: 920.00, tip: 150.00 },
    ];

    // --- RENDER ---
    return (
        <div className="mt-20">
            <div className="max-w-7xl mx-auto">
            

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
                            <p className="text-2xl font-bold text-black">${summaryData.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#083A85' }}>
                            <i className="bi bi-wallet2 text-white text-2xl"></i>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Upcoming Payout</p>
                            <p className="text-2xl font-bold text-black">${summaryData.upcomingPayout.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}>
                            <i className="bi bi-calendar-check text-white text-2xl"></i>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Avg. Tip / Booking</p>
                            <p className="text-2xl font-bold text-black">${summaryData.avgTipPerBooking}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800">
                            <i className="bi bi-gift text-white text-2xl"></i>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Bookings This Month</p>
                            <p className="text-2xl font-bold text-black">{summaryData.bookingsThisMonth}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black">
                            <i className="bi bi-person-check text-white text-2xl"></i>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Earnings Over Time Chart */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-md">
                        <h2 className="text-lg font-semibold text-black mb-4">Monthly Earnings (Bookings vs Tips)</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyEarningsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '10px', color: 'white' }}
                                        formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                                    />
                                    <Legend wrapperStyle={{fontSize: "14px"}} />
                                    <Line type="monotone" dataKey="bookings" stroke="#083A85" strokeWidth={3} />
                                    <Line type="monotone" dataKey="tips" stroke="#F20C8F" strokeWidth={2} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tour Performance */}
                    <div className="bg-white p-5 rounded-xl shadow-md">
                        <h2 className="text-lg font-semibold text-black mb-4">Tour Performance</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tourPerformanceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={(entry) => entry?.value !== undefined ? `${(((entry.value) / summaryData.totalEarnings) * 100).toFixed(0)}%` : ''}
                                    >
                                        {tourPerformanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                    <Legend iconSize={10} wrapperStyle={{fontSize: "12px", bottom: -10}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                {/* Recent Payouts Table */}
                <div className="mt-6 bg-white p-5 rounded-xl shadow-md">
                     <h2 className="text-lg font-semibold text-black mb-4">Payout History</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-3 text-sm font-semibold text-gray-500">Payout ID</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500">Tour/Event</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500">Date</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Booking Amount</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Tips</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayouts.map((payout) => (
                                    <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-sm text-black font-mono">{payout.id}</td>
                                        <td className="p-3 text-sm text-gray-700">{payout.tour}</td>
                                        <td className="p-3 text-sm text-gray-700">{payout.date}</td>
                                        <td className="p-3 text-sm text-gray-700 text-right">${payout.amount.toFixed(2)}</td>
                                        <td className="p-3 text-sm text-green-600 font-medium text-right">+${payout.tip.toFixed(2)}</td>
                                        <td className="p-3 text-sm text-black font-bold text-right">${(payout.amount + payout.tip).toFixed(2)}</td>
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

export default TourGuideEarnings;
