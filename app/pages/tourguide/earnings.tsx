'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/app/api/apiService'; // Your API service middleware

// --- TYPE DEFINITIONS ---
type SummaryData = {
  totalEarnings: number;
  upcomingPayout: number;
  avgTipPerBooking: number;
  bookingsThisMonth: number;
};

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

// --- TOUR GUIDE EARNINGS COMPONENT ---
const TourGuideEarnings = () => {
    // --- STATE MANAGEMENT ---
    // States to hold data fetched from the API
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [monthlyEarningsData, setMonthlyEarningsData] = useState<MonthlyEarning[]>([]);
    const [tourPerformanceData, setTourPerformanceData] = useState<TourPerformance[]>([]);
    const [recentPayouts, setRecentPayouts] = useState<Payout[]>([]);
    
    // States for loading and error handling
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setIsLoading(true);
                // Using the actual endpoints from your Express router
                const [
                    summaryRes,      // Contains summary and payout history
                    monthlyRes,      // Contains data for the line chart
                    performanceRes   // Contains data for the pie chart
                ] = await Promise.all([
                    // Note: Assuming '/tours' is the base path for this router
                    api.get('/tours/guide/earnings'),
                    api.get('/tours/guide/earnings/breakdown'),
                    api.get('/tours/guide/analytics')
                ]);

                // Update state with data from the API responses
                // IMPORTANT: You might need to adjust the property access (e.g., summaryRes.data.summary)
                // depending on the exact JSON structure your API returns.
                setSummaryData(summaryRes.data.summary); // Example
                setRecentPayouts(summaryRes.data.payouts); // Example
                setMonthlyEarningsData(monthlyRes.data);
                setTourPerformanceData(performanceRes.data);
                
            } catch (err) {
                console.error("Failed to fetch earnings data:", err);
                setError("Couldn't load your earnings. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEarningsData();
    }, []); // The empty dependency array ensures this effect runs only once on mount


    // --- CONDITIONAL RENDERING ---
    // Show a loading message while data is being fetched
    if (isLoading) {
        return <div className="mt-20 text-center font-semibold">Loading your earnings dashboard...</div>;
    }

    // Show an error message if the API call fails
    if (error) {
        return <div className="mt-20 text-center text-red-600">{error}</div>;
    }

    // --- RENDER ---
    return (
        <div className="mt-20">
            <div className="max-w-7xl mx-auto">
                {/* Ensure summaryData is loaded before rendering components that use it */}
                {summaryData && (
                    <>
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
                                                label={(entry) => entry?.value !== undefined ? `${((Number(entry.value) / summaryData.totalEarnings) * 100).toFixed(0)}%` : ''}
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
                    </>
                )}
                
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