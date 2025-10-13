'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/app/api/apiService';

const EnhancedAgentDashboard = () => {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [enhancedData, setEnhancedData] = useState<any>(null);
    const [transactionsData, setTransactionsData] = useState<any>([]);
    const [earningsData, setEarningsData] = useState<any>([]);
    const [propertiesData, setPropertiesData] = useState<any>([]);
    const [loading, setLoading] = useState<any>(true);
    const [error, setError] = useState<any>(null);
    const [userName, setUserName] = useState('Agent');
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [referralData, setReferralData] = useState<any>({
        referrals: [],
        totalPages: 1,
        currentPage: 1,
        totalReferrals: 0
    });
    const [referralLoading, setReferralLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [walletData, setWalletData] = useState<any>(null);
    const [walletLoading, setWalletLoading] = useState(false);

    useEffect(() => {
        if (showReferralModal) {
            fetchReferralData();
        }
    }, [showReferralModal]);

    const fetchWalletData = async () => {
        try {
            setWalletLoading(true);
            const user = JSON.parse(localStorage.getItem('userSession') || '{}');
            const userId = user.id || user.userId;

            if (userId) {
                const walletResponse = await api.get(`/transactions/wallet/${userId}`);
                if (walletResponse.data.success) {
                    setWalletData(walletResponse.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setWalletLoading(false);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('userSession') || '{}');
                if (user.name || user.firstName) {
                    setUserName(user.firstName || user.name);
                }

                const dashboardResponse = await api.get('/properties/agent/dashboard');
                const dashboard = dashboardResponse.data.data;
                setDashboardData(dashboard);

                const enhancedResponse = await api.get('/properties/agent/dashboard/enhanced');
                const enhanced = enhancedResponse.data.data;
                setEnhancedData(enhanced);

                const transactionsResponse = await api.get('/properties/agent/transactions/monitoring');
                setTransactionsData(transactionsResponse.data.data);

                const earningsResponse = await api.get('/bookings/agent/commissions');
                setEarningsData(earningsResponse.data.data);

                const clientBookingsResponse = await api.get('/bookings/agent/clients').catch(() => null);

                const propertiesResponse = await api.get('/properties/agent/properties');
                setPropertiesData(propertiesResponse.data.data.properties);

                // Fetch wallet data
                await fetchWalletData();
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Set up interval to refresh wallet data every 30 seconds
        const walletInterval = setInterval(fetchWalletData, 30000);

        return () => clearInterval(walletInterval);
    }, []);

    const transformEarningsData = (monthlyCommissions: any) => {
        if (!monthlyCommissions || monthlyCommissions.length === 0) {
            return [
                { month: 'Jan', earnings: 0 },
                { month: 'Feb', earnings: 0 },
                { month: 'Mar', earnings: 0 },
                { month: 'Apr', earnings: 0 },
                { month: 'May', earnings: 0 },
                { month: 'Jun', earnings: 0 },
            ];
        }

        return monthlyCommissions.map((item: any) => ({
            month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
            earnings: item.commission || item.earnings || 0
        }));
    };

    const transformTransactionData = (transactionBreakdown: any) => {
        if (!transactionBreakdown || !transactionBreakdown.escrowTransactions) {
            return [
                { day: 'Mon', transactions: 0 },
                { day: 'Tue', transactions: 0 },
                { day: 'Wed', transactions: 0 },
                { day: 'Thu', transactions: 0 },
                { day: 'Fri', transactions: 0 },
                { day: 'Sat', transactions: 0 },
                { day: 'Sun', transactions: 0 },
            ];
        }

        const transactions = [
            ...(transactionBreakdown.escrowTransactions || []),
            ...(transactionBreakdown.paymentTransactions || [])
        ];

        const dayCount: any = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        transactions.forEach((transaction: any) => {
            const day = new Date(transaction.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
            if (dayCount.hasOwnProperty(day)) {
                dayCount[day] += 1;
            }
        });

        return Object.entries(dayCount).map(([day, count]) => ({
            day,
            transactions: count
        }));
    };

    const getTransactionTypes = (transactionBreakdown: any) => {
        if (!transactionBreakdown || (!transactionBreakdown.escrowTransactions && !transactionBreakdown.paymentTransactions)) {
            return [{ name: 'No Transactions', value: 1, color: '#E5E7EB' }];
        }

        const typeCount: any = {};
        const allTransactions = [
            ...(transactionBreakdown.escrowTransactions || []),
            ...(transactionBreakdown.paymentTransactions || [])
        ];

        allTransactions.forEach((transaction: any) => {
            const type = transaction.status || transaction.type || 'Other';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        const colors = ['#083A85', '#F20C8F', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        return Object.entries(typeCount).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    };

    const transformRecentActivity = (transactionBreakdown: any) => {
        if (!transactionBreakdown || (!transactionBreakdown.escrowTransactions && !transactionBreakdown.paymentTransactions)) return [];

        const allTransactions = [
            ...(transactionBreakdown.escrowTransactions || []).map((t: any) => ({ ...t, source: 'escrow' })),
            ...(transactionBreakdown.paymentTransactions || []).map((t: any) => ({ ...t, source: 'payment' }))
        ];

        return allTransactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4)
            .map((transaction: any) => ({
                client: transaction.clientName || transaction.user?.name || 'Client',
                message: transaction.description || transaction.notes || `${transaction.source} transaction ${transaction.status}`,
                time: new Date(transaction.createdAt).toLocaleTimeString(),
                type: transaction.status === 'RELEASED' || transaction.status === 'completed' ? 'commission' : transaction.status
            }));
    };

    const transformUpcomingAppointments = (properties: any) => {
        if (!properties || properties.length === 0) return [];
        return properties.slice(0, 3).map((property: any) => ({
            title: property.title || property.name,
            time: property.nextViewing ? new Date(property.nextViewing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00',
            client: property.interestedClient || 'Potential Client',
            duration: '1 hr',
            location: property.location || property.address,
            status: property.status || 'confirmed'
        }));
    };

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const generateReferralLink = () => {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        const agentId = user.id || user.userId || 'default';
        return `https://jambolush.com/all/become-host?ref=${agentId}`;
    };

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(generateReferralLink());
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const fetchReferralData = async (page = 1) => {
        setReferralLoading(true);
        try {
            const response = await api.get(`/auth/agent/referrals?page=${page}&limit=10`);
            setReferralData(response.data.data);
        } catch (error: any) {
            console.error('Error fetching referral data:', error);
            setReferralData({
                referrals: [],
                totalPages: 1,
                currentPage: page,
                totalReferrals: 0
            });
        } finally {
            setReferralLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                            <i className="bi bi-exclamation-triangle text-red-600 text-xl" />
                        </div>
                        <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Dashboard</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#083A85] text-white px-6 py-3 rounded-lg hover:bg-[#062d6b] transition-colors font-medium"
                        >
                            <i className="bi bi-arrow-clockwise mr-2" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const chartEarningsData = transformEarningsData(dashboardData?.monthlyCommissions || earningsData?.monthlyCommissions);
    const chartTransactionData = transformTransactionData(transactionsData?.transactionBreakdown || dashboardData?.transactionBreakdown);
    const transactionTypes = getTransactionTypes(transactionsData?.transactionBreakdown || dashboardData?.transactionBreakdown);
    const recentActivity = transformRecentActivity(transactionsData?.transactionBreakdown || dashboardData?.transactionBreakdown);
    const upcomingAppointments = transformUpcomingAppointments(propertiesData || dashboardData?.upcomingAppointments);

    const summaryCards = [
        {
            title: 'Active Properties',
            value: dashboardData?.activeProperties?.toString() || '0',
            change: `${dashboardData?.totalProperties || 0} total`,
            icon: 'house',
            iconBg: 'bg-blue-50',
            iconColor: 'text-[#083A85]',
        },
        {
            title: 'Total Clients',
            value: dashboardData?.totalClients?.toString() || '0',
            change: `${dashboardData?.activeClients || 0} active`,
            icon: 'people',
            iconBg: 'bg-pink-50',
            iconColor: 'text-pink-500',
        },
        {
            title: 'Total Commissions',
            value: `$${dashboardData?.totalCommissions?.toLocaleString() || '0'}`,
            change: 'All time',
            icon: 'currency-dollar',
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            title: 'Success Rate',
            value: `${dashboardData?.successRate?.toFixed(1) || '85.0'}%`,
            change: `${dashboardData?.pendingDeals || 0} pending`,
            icon: 'graph-up-arrow',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
        },
    ];

    const recentFeedback = (transactionsData?.transactionBreakdown?.escrowTransactions || [])
        .filter((transaction: any) => transaction.feedback || transaction.rating)
        .slice(0, 3)
        .map((transaction: any) => ({
            client: transaction.clientName || transaction.user?.name || 'Anonymous',
            rating: transaction.rating || 5,
            comment: transaction.feedback?.comment || transaction.notes || 'Professional service!',
            property: transaction.property?.title || transaction.propertyName || 'Property',
            date: new Date(transaction.feedback?.createdAt || transaction.createdAt).toLocaleDateString()
        }));

    const quickStats = [
        {
            label: 'Deals Closed',
            value: dashboardData?.totalDeals?.toString() || '0',
            icon: 'check-circle'
        },
        {
            label: 'Response Rate',
            value: '98%',
            icon: 'chat-dots'
        },
        {
            label: 'Repeat Clients',
            value: '34%',
            icon: 'arrow-repeat'
        },
        {
            label: 'Avg Commission',
            value: `$${dashboardData?.avgCommissionPerBooking?.toFixed(0) || '0'}`,
            icon: 'cash-coin'
        },
    ];

    const ReferralModal = () => {
        if (!showReferralModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[22px] font-medium text-gray-900">Refer a Friend</h2>
                            <button
                                onClick={() => setShowReferralModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i className="bi bi-x-lg text-xl" />
                            </button>
                        </div>
                        <p className="text-gray-600 mt-2">
                            Share your referral link and earn rewards when friends join as hosts!
                        </p>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Your Referral Link</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    readOnly
                                    value={generateReferralLink()}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                                />
                                <button
                                    onClick={copyReferralLink}
                                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                                        copySuccess
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-[#083A85] text-white hover:bg-[#062d6b]'
                                    }`}
                                >
                                    <i className={`bi ${copySuccess ? 'bi-check-lg' : 'bi-copy'} mr-2`} />
                                    {copySuccess ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Referred Users</h3>
                                <span className="text-sm text-gray-600">
                                    Total: {referralData.totalReferrals} referrals
                                </span>
                            </div>

                            {referralLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083A85]"></div>
                                </div>
                            ) : (
                                <>
                                    {referralData.referrals.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {referralData.referrals.map((referral: any) => (
                                                            <tr key={referral.id}>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{referral.fullName}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{referral.email}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{referral.phone}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                        referral.status === 'Active'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : referral.status === 'Pending'
                                                                            ? 'bg-yellow-100 text-yellow-700'
                                                                            : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                        {referral.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {new Date(referral.joinedAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {referralData.totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-6">
                                                    <div className="text-sm text-gray-700">
                                                        Page {referralData.currentPage} of {referralData.totalPages}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => fetchReferralData(referralData.currentPage - 1)}
                                                            disabled={referralData.currentPage === 1}
                                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => fetchReferralData(referralData.currentPage + 1)}
                                                            disabled={referralData.currentPage === referralData.totalPages}
                                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                <i className="bi bi-person-plus text-gray-400 text-2xl" />
                                            </div>
                                            <p className="text-gray-500 mb-1">No referrals yet</p>
                                            <p className="text-sm text-gray-400">
                                                Share your referral link to start earning rewards!
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[32px] font-semibold text-gray-900 mb-2">
                        {getTimeBasedGreeting()}, {userName}
                    </h1>
                    <p className="text-gray-600">Welcome to your agent dashboard</p>
                </div>

                {/* Wallet Section */}
                <div className="mb-6 bg-gradient-to-r from-[#083A85] to-[#062d6b] rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <i className="bi bi-wallet2 text-white text-xl" />
                                </div>
                                <h3 className="text-white/90 text-sm font-medium">Wallet Balance</h3>
                            </div>
                            {walletLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span className="text-white/70 text-sm">Loading...</span>
                                </div>
                            ) : walletData ? (
                                <div className="space-y-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-white">
                                            {walletData.totalBalance?.toLocaleString() || '0'}
                                        </span>
                                        <span className="text-white/80 text-sm">{walletData.currency || 'RWF'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="text-white/70">Available: </span>
                                            <span className="text-white font-medium">{walletData.availableBalance?.toLocaleString() || '0'}</span>
                                        </div>
                                        {walletData.pendingBalance > 0 && (
                                            <div>
                                                <span className="text-white/70">Pending: </span>
                                                <span className="text-yellow-300 font-medium">{walletData.pendingBalance?.toLocaleString() || '0'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-white/70 text-sm">No wallet data available</div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => router.push('/agent/earnings')}
                                className="px-4 py-2 bg-white text-[#083A85] rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <i className="bi bi-arrow-right-circle" />
                                View Details
                            </button>
                            <button
                                onClick={fetchWalletData}
                                disabled={walletLoading}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <i className={`bi bi-arrow-clockwise ${walletLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Referral Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="px-4 py-2 text-sm font-medium bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors flex items-center gap-2"
                    >
                        <i className="bi bi-person-plus" />
                        Refer a friend
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {summaryCards.map((card, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                    <i className={`bi bi-${card.icon} ${card.iconColor} text-xl`} />
                                </div>
                                <span className="text-2xl font-semibold text-gray-900">{card.value}</span>
                            </div>
                            <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                            <p className="text-xs text-gray-500">{card.change}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* Left Column */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Commissions Chart */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-6 border-b">
                                    <h2 className="text-[22px] font-medium text-gray-900">Monthly Commissions</h2>
                                </div>
                                <div className="p-6">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="earnings" stroke="#083A85" strokeWidth={2} dot={{ fill: '#083A85', r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Activity Chart */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-6 border-b">
                                    <h2 className="text-[22px] font-medium text-gray-900">Weekly Activity</h2>
                                </div>
                                <div className="p-6">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartTransactionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip />
                                                <Bar dataKey="transactions" fill="#F20C8F" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[22px] font-medium text-gray-900">Recent Activity</h2>
                                    <button className="text-sm text-[#083A85] hover:underline font-medium">
                                        View all
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {recentActivity.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentActivity.map((activity: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <i className={`bi bi-${activity.type === 'commission' ? 'cash-coin' : 'clock-history'} text-[#083A85] text-lg`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{activity.client}</p>
                                                        <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                                                        activity.type === 'commission' ? 'bg-green-100 text-green-700' :
                                                        activity.type === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {activity.type}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <i className="bi bi-chat-square-dots text-gray-400 text-2xl" />
                                        </div>
                                        <p className="text-gray-500 mb-1">No recent activity</p>
                                        <p className="text-sm text-gray-400">Your activity will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <h2 className="text-[22px] font-medium text-gray-900">Performance Stats</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {quickStats.map((stat, index) => (
                                        <div key={index} className="text-center">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                                <i className={`bi bi-${stat.icon} text-gray-600`} />
                                            </div>
                                            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Today's Schedule */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[22px] font-medium text-gray-900">Today's Schedule</h2>
                                    <button
                                        onClick={() => router.push('/agent/schedule')}
                                        className="text-sm text-[#083A85] hover:underline font-medium"
                                    >
                                        View calendar
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {upcomingAppointments.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingAppointments.map((appointment: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <i className="bi bi-calendar-check text-green-600 text-sm" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {appointment.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {appointment.location}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                                                    <p className="text-xs text-gray-600">{appointment.client}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <i className="bi bi-calendar-x text-gray-400 text-xl" />
                                        </div>
                                        <p className="text-gray-500 mb-1">No appointments</p>
                                        <p className="text-sm text-gray-400">Appointments will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transaction Types */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <h2 className="text-[22px] font-medium text-gray-900">Transaction Types</h2>
                            </div>
                            <div className="p-6">
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={transactionTypes}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {transactionTypes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 mt-4">
                                    {transactionTypes.map((type: any, index) => (
                                        <div key={index} className="flex items-center text-sm">
                                            <div className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: type.color }}></div>
                                            {type.name} ({type.value})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Client Feedback */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[22px] font-medium text-gray-900">Client Feedback</h2>
                                    <button
                                        onClick={() => router.push('/agent/reviews')}
                                        className="text-sm text-[#083A85] hover:underline font-medium"
                                    >
                                        View all
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {recentFeedback.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentFeedback.map((feedback: any, index: number) => (
                                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-medium text-gray-900">{feedback.client}</p>
                                                    <div className="flex items-center">
                                                        {[...Array(feedback.rating)].map((_, i) => (
                                                            <i key={i} className="bi bi-star-fill text-yellow-500 text-xs" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{feedback.comment}</p>
                                                <p className="text-xs text-gray-500">{feedback.property} • {feedback.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <i className="bi bi-star text-gray-400 text-xl" />
                                        </div>
                                        <p className="text-gray-500 mb-1">No feedback yet</p>
                                        <p className="text-sm text-gray-400">Feedback will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReferralModal />
        </div>
    );
};

export default EnhancedAgentDashboard;