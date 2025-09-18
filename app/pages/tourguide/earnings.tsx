'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/app/api/apiService'; // Your API service middleware

// --- TYPE DEFINITIONS ---
type SummaryData = {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  averageTourPrice: number;
  conversionRate: number;
  revenueGrowth: number;
};

type TourBreakdown = {
  tourId: string;
  tourTitle: string;
  totalEarnings: number;
  monthlyEarnings: number;
  bookingsCount: number;
  averageBookingValue: number;
  conversionRate: number;
};

type AnalyticsData = {
  overview: {
    totalViews: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalParticipants: number;
    conversionRate: number;
    repeatGuestRate: number;
    timeRange: string;
  };
  tourPerformance: Array<{name: string; value: number}>;
  bookingTrends: Array<{month: string; bookings: number; revenue: number}>;
  revenueAnalytics: {
    monthlyRevenue: Array<{month: string; amount: number}>;
  };
};

type WithdrawalRequest = {
  amount: number;
  bankAccountId?: string;
  mobileAccountId?: string;
  method: 'bank' | 'mobile';
};

type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type MobileAccount = {
  id: string;
  provider: string;
  phoneNumber: string;
  accountName: string;
};

const COLORS = ['#083A85', '#F20C8F', '#333333', '#666666', '#999999', '#FF6B6B', '#4ECDC4'];

// --- TOUR GUIDE EARNINGS COMPONENT ---
const TourGuideEarnings = () => {
    // --- STATE MANAGEMENT ---
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [tourBreakdown, setTourBreakdown] = useState<TourBreakdown[]>([]);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [mobileAccounts, setMobileAccounts] = useState<MobileAccount[]>([]);
    
    // States for loading and error handling
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Withdrawal modal states
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalMethod, setWithdrawalMethod] = useState<'bank' | 'mobile'>('bank');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setIsLoading(true);
                const [
                    earningsRes,      // Basic earnings summary
                    breakdownRes,     // Tour-wise breakdown
                    analyticsRes,     // Analytics data
                    bankAccountsRes,  // User's bank accounts
                    mobileAccountsRes // User's mobile money accounts
                ] = await Promise.all([
                    api.get('/tours/guide/earnings'),
                    api.get('/tours/guide/earnings/breakdown'),
                    api.get('/tours/guide/analytics'),
                    api.get('/payments/bank-accounts'),
                    api.get('/payments/mobile-accounts')
                ]);

                // Extract data from API responses
                if (earningsRes.data.success) {
                    setSummaryData(earningsRes.data.data);
                }

                if (breakdownRes.data.success) {
                    setTourBreakdown(breakdownRes.data.data);
                }

                if (analyticsRes.data.success) {
                    setAnalyticsData(analyticsRes.data.data);
                }

                if (bankAccountsRes.data.success) {
                    setBankAccounts(bankAccountsRes.data.data || []);
                }

                if (mobileAccountsRes.data.success) {
                    setMobileAccounts(mobileAccountsRes.data.data || []);
                }
                
            } catch (err) {
                console.error("Failed to fetch earnings data:", err);
                setError("Couldn't load your earnings dashboard. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEarningsData();
    }, []);

    // --- WITHDRAWAL HANDLING ---
    const handleWithdrawal = async () => {
        if (!withdrawalAmount || !selectedAccountId) {
            alert('Please fill in all required fields');
            return;
        }

        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (summaryData && amount > summaryData.pendingPayouts) {
            alert('Withdrawal amount cannot exceed pending payouts');
            return;
        }

        try {
            setIsProcessingWithdrawal(true);
            
            const withdrawalData: WithdrawalRequest = {
                amount,
                method: withdrawalMethod,
                ...(withdrawalMethod === 'bank' 
                    ? { bankAccountId: selectedAccountId }
                    : { mobileAccountId: selectedAccountId }
                )
            };

            const response = await api.post('/payments/withdraw', withdrawalData);

            if (response.data.success) {
                alert('Withdrawal request submitted successfully!');
                setShowWithdrawalModal(false);
                setWithdrawalAmount('');
                setSelectedAccountId('');
                
                // Refresh earnings data
                const earningsRes = await api.get('/tours/guide/earnings');
                if (earningsRes.data.success) {
                    setSummaryData(earningsRes.data.data);
                }
            } else {
                alert(response.data.message || 'Withdrawal failed');
            }
        } catch (err: any) {
            console.error('Withdrawal error:', err);
            alert(err.response?.data?.message || 'Withdrawal failed. Please try again.');
        } finally {
            setIsProcessingWithdrawal(false);
        }
    };

    // --- CONDITIONAL RENDERING ---
    if (isLoading) {
        return <div className="mt-20 text-center font-semibold">Loading your earnings dashboard...</div>;
    }

    if (error) {
        return <div className="mt-20 text-center text-red-600">{error}</div>;
    }

    // Prepare chart data
    const monthlyEarningsData = analyticsData?.bookingTrends?.map(trend => ({
        month: trend.month,
        bookings: trend.bookings,
        revenue: trend.revenue
    })) || [];

    const tourPerformanceData = analyticsData?.tourPerformance || 
        tourBreakdown.map(tour => ({
            name: tour.tourTitle.length > 20 ? tour.tourTitle.substring(0, 20) + '...' : tour.tourTitle,
            value: tour.totalEarnings
        }));

    const totalTourEarnings = tourPerformanceData.reduce((sum, tour) => sum + tour.value, 0);

    // --- RENDER ---
    return (
        <div className="mt-20">
            <div className="max-w-7xl mx-auto">
                {summaryData && (
                    <>
                        {/* Header with Withdraw Button */}
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-xl sm:text-2xl font-bold text-[#083A85]">Earnings Dashboard</h1>
                            <button 
                                onClick={() => setShowWithdrawalModal(true)}
                                disabled={!summaryData.pendingPayouts || summaryData.pendingPayouts <= 0}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Withdraw Funds
                            </button>
                        </div>

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
                                    <p className="text-sm text-gray-500 font-medium">Pending Payouts</p>
                                    <p className="text-2xl font-bold text-black">${summaryData.pendingPayouts.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}>
                                    <i className="bi bi-clock text-white text-2xl"></i>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Monthly Earnings</p>
                                    <p className="text-2xl font-bold text-black">${summaryData.monthlyEarnings.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800">
                                    <i className="bi bi-graph-up text-white text-2xl"></i>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                                    <p className="text-2xl font-bold text-black">{(summaryData.conversionRate * 100).toFixed(1)}%</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black">
                                    <i className="bi bi-percent text-white text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Earnings Over Time Chart */}
                            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-md">
                                <h2 className="text-lg font-semibold text-black mb-4">Monthly Performance</h2>
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
                                            <Line type="monotone" dataKey="bookings" stroke="#083A85" strokeWidth={3} name="Bookings" />
                                            <Line type="monotone" dataKey="revenue" stroke="#F20C8F" strokeWidth={2} strokeDasharray="5 5" name="Revenue" />
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
                                                label={(entry) => entry?.value !== undefined && totalTourEarnings > 0 ? `${((Number(entry.value) / totalTourEarnings) * 100).toFixed(0)}%` : ''}
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
                
                {/* Tour Breakdown Table */}
                <div className="mt-6 bg-white p-5 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold text-black mb-4">Tour Performance Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-3 text-sm font-semibold text-gray-500">Tour</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Total Earnings</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Monthly Earnings</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Bookings</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Avg. Value</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Conversion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tourBreakdown.map((tour) => (
                                    <tr key={tour.tourId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-sm text-gray-700">{tour.tourTitle}</td>
                                        <td className="p-3 text-sm text-black font-bold text-right">${tour.totalEarnings.toFixed(2)}</td>
                                        <td className="p-3 text-sm text-gray-700 text-right">${tour.monthlyEarnings.toFixed(2)}</td>
                                        <td className="p-3 text-sm text-gray-700 text-right">{tour.bookingsCount}</td>
                                        <td className="p-3 text-sm text-gray-700 text-right">${tour.averageBookingValue.toFixed(2)}</td>
                                        <td className="p-3 text-sm text-green-600 font-medium text-right">{(tour.conversionRate * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Available Balance: ${summaryData?.pendingPayouts?.toLocaleString() || 0}
                            </label>
                            <input
                                type="number"
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                max={summaryData?.pendingPayouts || 0}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                            <select
                                value={withdrawalMethod}
                                onChange={(e) => {
                                    setWithdrawalMethod(e.target.value as 'bank' | 'mobile');
                                    setSelectedAccountId('');
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="bank">Bank Transfer</option>
                                <option value="mobile">Mobile Money</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select {withdrawalMethod === 'bank' ? 'Bank Account' : 'Mobile Account'}
                            </label>
                            <select
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select an account</option>
                                {withdrawalMethod === 'bank' 
                                    ? bankAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.bankName} - {account.accountNumber}
                                        </option>
                                      ))
                                    : mobileAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.provider} - {account.phoneNumber}
                                        </option>
                                      ))
                                }
                            </select>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowWithdrawalModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                                disabled={isProcessingWithdrawal}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdrawal}
                                disabled={isProcessingWithdrawal || !withdrawalAmount || !selectedAccountId}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                {isProcessingWithdrawal ? 'Processing...' : 'Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourGuideEarnings;