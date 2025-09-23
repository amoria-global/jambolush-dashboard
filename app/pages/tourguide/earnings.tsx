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
                setError(null);

                const [
                    earningsRes,      // Tour guide earnings summary
                    breakdownRes,     // Tour-wise earnings breakdown
                    analyticsRes,     // Analytics data for charts
                    bankAccountsRes,  // User's registered bank accounts
                    mobileAccountsRes // User's registered mobile money accounts
                ] = await Promise.all([
                    api.get('/tours/guide/earnings'),
                    api.get('/tours/guide/earnings/breakdown'),
                    api.get('/tours/guide/analytics'),
                    api.get('/payments/mobile-providers'),
                    api.get('/payments/mobile-providers')
                ]);

                // Process earnings summary response
                if (earningsRes?.data?.success && earningsRes.data.data) {
                    setSummaryData(earningsRes.data.data);
                } else {
                    console.warn("Invalid earnings summary response:", earningsRes?.data);
                }

                // Process tour breakdown response
                if (breakdownRes?.data?.success && Array.isArray(breakdownRes.data.data)) {
                    setTourBreakdown(breakdownRes.data.data);
                } else {
                    console.warn("Invalid tour breakdown response:", breakdownRes?.data);
                    setTourBreakdown([]);
                }

                // Process analytics response
                if (analyticsRes?.data?.success && analyticsRes.data.data) {
                    setAnalyticsData(analyticsRes.data.data);
                } else {
                    console.warn("Invalid analytics response:", analyticsRes?.data);
                }

                // Process bank accounts response
                if (bankAccountsRes?.data?.success && Array.isArray(bankAccountsRes.data.data)) {
                    setBankAccounts(bankAccountsRes.data.data);
                } else {
                    console.warn("Invalid bank accounts response:", bankAccountsRes?.data);
                    setBankAccounts([]);
                }

                // Process mobile accounts response
                if (mobileAccountsRes?.data?.success && Array.isArray(mobileAccountsRes.data.data)) {
                    setMobileAccounts(mobileAccountsRes.data.data);
                } else {
                    console.warn("Invalid mobile accounts response:", mobileAccountsRes?.data);
                    setMobileAccounts([]);
                }
                
            } catch (err: any) {
                console.error("Failed to fetch earnings data:", err);
                
                // Provide more specific error messages
                let errorMessage = "Couldn't load your earnings dashboard. Please try again later.";
                
                if (err.response?.status === 401) {
                    errorMessage = "Your session has expired. Please log in again.";
                } else if (err.response?.status === 403) {
                    errorMessage = "You don't have permission to access this data.";
                } else if (err.response?.status === 404) {
                    errorMessage = "Earnings data not found. You may need to complete some tours first. "+JSON.stringify(err);
                } else if (err.response?.status >= 500) {
                    errorMessage = "Server error. Our team has been notified. Please try again later.";
                } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                    errorMessage = "Network connection error. Please check your internet connection.";
                }
                
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEarningsData();
    }, []);

    // --- WITHDRAWAL HANDLING ---
    const handleWithdrawal = async () => {
        // Validation checks
        if (!withdrawalAmount || !selectedAccountId) {
            alert('Please fill in all required fields');
            return;
        }

        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        if (summaryData && amount > summaryData.pendingPayouts) {
            alert(`Withdrawal amount ($${amount.toLocaleString()}) cannot exceed available balance ($${summaryData.pendingPayouts.toLocaleString()})`);
            return;
        }

        // Minimum withdrawal amount check (optional - adjust as needed)
        const minimumWithdrawal = 10; // $10 minimum
        if (amount < minimumWithdrawal) {
            alert(`Minimum withdrawal amount is $${minimumWithdrawal}`);
            return;
        }

        try {
            setIsProcessingWithdrawal(true);
            setError(null);
            
            // Prepare withdrawal request data
            const withdrawalData: WithdrawalRequest = {
                amount: amount,
                method: withdrawalMethod,
                ...(withdrawalMethod === 'bank' 
                    ? { bankAccountId: selectedAccountId }
                    : { mobileAccountId: selectedAccountId }
                )
            };

            console.log('Submitting withdrawal request:', {
                ...withdrawalData,
                // Don't log sensitive account IDs in production
                ...(process.env.NODE_ENV === 'development' && { accountId: selectedAccountId })
            });

            const response = await api.post('/escrow/withdrawals', withdrawalData);

            if (response?.data?.success) {
                // Success handling
                const message = response.data.message || 'Withdrawal request submitted successfully!';
                alert(`${message}\n\nYour withdrawal of $${amount.toLocaleString()} has been queued for processing.`);
                
                // Reset modal state
                setShowWithdrawalModal(false);
                setWithdrawalAmount('');
                setSelectedAccountId('');
                
                // Refresh earnings data to reflect updated balance
                try {
                    const earningsRes = await api.get('/tours/guide/earnings');
                    if (earningsRes?.data?.success && earningsRes.data.data) {
                        setSummaryData(earningsRes.data.data);
                        console.log('Earnings data refreshed after withdrawal');
                    }
                } catch (refreshError) {
                    console.warn('Failed to refresh earnings after withdrawal:', refreshError);
                    // Don't show error to user since withdrawal was successful
                }
                
            } else {
                // Handle API success: false responses
                const errorMessage = response?.data?.message || response?.data?.error?.message || 'Withdrawal request failed';
                alert(`Withdrawal Failed: ${errorMessage}`);
            }
            
        } catch (err: any) {
            console.error('Withdrawal error:', err);
            
            // Provide specific error messages based on response
            let errorMessage = 'Withdrawal failed. Please try again.';
            
            if (err.response?.status === 400) {
                errorMessage = err.response.data?.message || err.response.data?.error?.message || 'Invalid withdrawal request. Please check your details.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Your session has expired. Please log in again.';
            } else if (err.response?.status === 403) {
                errorMessage = 'You are not authorized to perform this withdrawal.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Selected account not found. Please choose a different account.';
            } else if (err.response?.status === 422) {
                errorMessage = err.response.data?.message || 'Validation failed. Please check your withdrawal details.';
            } else if (err.response?.status === 429) {
                errorMessage = 'Too many withdrawal requests. Please wait before trying again.';
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error processing withdrawal. Please try again later.';
            } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.response?.data?.error?.code) {
                // Handle specific error codes from your API
                switch (err.response.data.error.code) {
                    case 'INSUFFICIENT_FUNDS':
                        errorMessage = 'Insufficient funds available for withdrawal.';
                        break;
                    case 'ACCOUNT_VERIFICATION_REQUIRED':
                        errorMessage = 'Account verification required before withdrawal. Please contact support.';
                        break;
                    case 'WITHDRAWAL_LIMIT_EXCEEDED':
                        errorMessage = 'Withdrawal limit exceeded. Please try a smaller amount.';
                        break;
                    case 'ACCOUNT_SUSPENDED':
                        errorMessage = 'Your account is suspended. Please contact support.';
                        break;
                    default:
                        errorMessage = err.response.data.error.message || errorMessage;
                }
            }
            
            alert(`Withdrawal Error: ${errorMessage}`);
            
        } finally {
            setIsProcessingWithdrawal(false);
        }
    };

    // --- HELPER FUNCTION: REFRESH EARNINGS DATA ---
    const refreshEarningsData = async () => {
        try {
            setError(null);
            const earningsRes = await api.get('/tours/guide/earnings');
            
            if (earningsRes?.data?.success && earningsRes.data.data) {
                setSummaryData(earningsRes.data.data);
                return true;
            } else {
                console.warn("Failed to refresh earnings data:", earningsRes?.data);
                return false;
            }
        } catch (err) {
            console.error('Error refreshing earnings data:', err);
            return false;
        }
    };

    // --- HELPER FUNCTION: VALIDATE WITHDRAWAL FORM ---
    const validateWithdrawalForm = (): boolean => {
        if (!withdrawalAmount.trim()) {
            alert('Please enter withdrawal amount');
            return false;
        }
        
        if (!selectedAccountId) {
            alert(`Please select a ${withdrawalMethod === 'bank' ? 'bank account' : 'mobile money account'}`);
            return false;
        }
        
        const amount = parseFloat(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return false;
        }
        
        return true;
    };

    // --- ALTERNATIVE WITHDRAWAL HANDLER WITH CONFIRMATION ---
    const handleWithdrawalWithConfirmation = async () => {
        if (!validateWithdrawalForm()) return;
        
        const amount = parseFloat(withdrawalAmount);
        const selectedAccount: any = withdrawalMethod === 'bank' 
            ? bankAccounts.find(acc => acc.id === selectedAccountId)
            : mobileAccounts.find(acc => acc.id === selectedAccountId);
        
        const accountInfo = withdrawalMethod === 'bank'
            ? `${selectedAccount?.bankName} - ${selectedAccount?.accountNumber}`
            : `${selectedAccount?.provider} - ${selectedAccount?.phoneNumber}`;
        
        const confirmMessage = `Confirm Withdrawal:\n\nAmount: $${amount.toLocaleString()}\nTo: ${accountInfo}\n\nProceed with withdrawal?`;
        
        if (window.confirm(confirmMessage)) {
            await handleWithdrawal();
        }
    };

    // --- CONDITIONAL RENDERING ---
    if (isLoading) {
        return (
            <div className="mt-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600 font-semibold">Loading your earnings dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center py-12">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <div className="text-red-600 text-lg font-semibold mb-2">Unable to Load Dashboard</div>
                            <p className="text-red-700">{error}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
            <div className="max-w-7xl mx-auto px-4">
                {summaryData && (
                    <>
                        {/* Header with Withdraw Button */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
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
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Pending Payouts</p>
                                    <p className="text-2xl font-bold text-black">${summaryData.pendingPayouts.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}>
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Monthly Earnings</p>
                                    <p className="text-2xl font-bold text-black">${summaryData.monthlyEarnings.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                                    <p className="text-2xl font-bold text-black">{(summaryData.conversionRate * 100).toFixed(1)}%</p>
                                </div>
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black">
                                    <span className="text-white font-bold text-lg">%</span>
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
                    {tourBreakdown.length > 0 ? (
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
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No tour performance data available yet.</p>
                            <p className="text-sm mt-2">Complete some tours to see your breakdown here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full">
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
                                min="10"
                                step="0.01"
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
                            {/* No Accounts Available Message */}
                            {withdrawalMethod === 'bank' && bankAccounts.length === 0 && (
                                <p className="mt-2 text-sm text-orange-600">
                                    No bank accounts found. Please add a bank account first.
                                </p>
                            )}
                            {withdrawalMethod === 'mobile' && mobileAccounts.length === 0 && (
                                <p className="mt-2 text-sm text-orange-600">
                                    No mobile money accounts found. Please add a mobile account first.
                                </p>
                            )}
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
                                onClick={handleWithdrawalWithConfirmation}
                                disabled={
                                    isProcessingWithdrawal || 
                                    !withdrawalAmount || 
                                    !selectedAccountId ||
                                    (withdrawalMethod === 'bank' && bankAccounts.length === 0) ||
                                    (withdrawalMethod === 'mobile' && mobileAccounts.length === 0)
                                }
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