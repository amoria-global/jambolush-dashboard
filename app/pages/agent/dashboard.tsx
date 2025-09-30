'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/app/api/apiService';

const EnhancedAgentDashboard = () => {
    const router = useRouter();

    // State for dashboard data
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

    // Load referral data when modal opens
    useEffect(() => {
        if (showReferralModal) {
            fetchReferralData();
        }
    }, [showReferralModal]);

    // Fetch all dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const user = JSON.parse(localStorage.getItem('userSession') || '{}');
                if (user.name || user.firstName) {
                    setUserName(user.firstName || user.name);
                }

                // Fetch basic dashboard data
                const dashboardResponse = await api.get('/properties/agent/dashboard');
                const dashboard = dashboardResponse.data.data;
                setDashboardData(dashboard);

                // Fetch enhanced dashboard data
                const enhancedResponse = await api.get('/properties/agent/dashboard/enhanced');
                const enhanced = enhancedResponse.data.data;
                setEnhancedData(enhanced);

                // Fetch transaction monitoring data
                const transactionsResponse = await api.get('/properties/agent/transactions/monitoring');
                setTransactionsData(transactionsResponse.data.data);

                // Fetch earnings data with transactions
                const earningsResponse = await api.get('/properties/agent/earnings');
                setEarningsData(earningsResponse.data.data);

                // Fetch agent's properties
                const propertiesResponse = await api.get('/properties/agent/properties');
                setPropertiesData(propertiesResponse.data.data.properties);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data ' + JSON.stringify(error));
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Transform earnings data for chart
    const transformEarningsData = (monthlyCommissions: any) => {
        if (!monthlyCommissions || monthlyCommissions.length === 0) {
            // Fallback data if no earnings data
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

    // Transform transaction performance data for chart
    const transformTransactionData = (transactionBreakdown: any) => {
        if (!transactionBreakdown || !transactionBreakdown.escrowTransactions) {
            // Fallback weekly data
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

        // Group transactions by day of week from the last 7 days
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

    // Get transaction types from transaction data
    const getTransactionTypes = (transactionBreakdown: any) => {
        if (!transactionBreakdown || (!transactionBreakdown.escrowTransactions && !transactionBreakdown.paymentTransactions)) {
            return [
                { name: 'No Transactions', value: 1, color: '#E5E7EB' }
            ];
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

        const colors = ['#F20C8F', '#083A85', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        return Object.entries(typeCount).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    };

    // Transform recent transactions for messages section
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

    // Transform upcoming appointments
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

    if (loading) {
        return (
            <div className="mt-20 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-20 flex items-center justify-center min-h-screen">
                <div className="text-center text-red-600">
                    <i className="bi bi-exclamation-triangle text-4xl mb-4"></i>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Prepare data for UI
    const chartEarningsData = transformEarningsData(dashboardData?.monthlyCommissions || earningsData?.monthlyCommissions);
    const chartTransactionData = transformTransactionData(transactionsData?.transactionBreakdown || dashboardData?.transactionBreakdown);
    const transactionTypes = getTransactionTypes(transactionsData?.transactionBreakdown || dashboardData?.transactionBreakdown);
    const recentActivity = transformRecentActivity(transactionsData?.transactionBreakdown || dashboardData?.transactionBreakdown);
    const upcomingAppointments = transformUpcomingAppointments(propertiesData || dashboardData?.upcomingAppointments);

    // Summary cards data
    const summaryCards = [
        {
            title: 'Active Properties',
            value: dashboardData?.activeProperties?.toString() || '0',
            change: `${dashboardData?.totalProperties || 0} total properties`,
            icon: 'house',
            bgColor: 'bg-pink-500',
            iconBg: '#F20C8F',
        },
        {
            title: 'Total Clients',
            value: dashboardData?.totalClients?.toString() || '0',
            change: `${dashboardData?.activeClients || 0} active clients`,
            icon: 'people',
            bgColor: 'bg-blue-800',
            iconBg: '#083A85',
        },
        {
            title: 'Total Commissions',
            value: `$${dashboardData?.totalCommissions?.toLocaleString() || '0'}`,
            change: 'All time earnings',
            icon: 'currency-dollar',
            bgColor: 'bg-green-500',
            iconBg: '#10B981',
        },
        {
            title: 'Success Rate',
            value: `${dashboardData?.successRate?.toFixed(1) || '85.0'}%`,
            change: `${dashboardData?.pendingDeals || 0} pending deals`,
            icon: 'graph-up-arrow',
            bgColor: 'bg-amber-500',
            iconBg: '#F59E0B',
        },
    ];

    // Recent reviews/feedback (from recent transactions with feedback)
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

    // Quick stats
    const quickStats = [
        {
            label: 'Deals Closed',
            value: dashboardData?.totalDeals?.toString() || '0',
            icon: 'check-circle'
        },
        {
            label: 'Response Rate',
            value: '98%', // This might need a separate endpoint
            icon: 'chat-dots'
        },
        {
            label: 'Repeat Clients',
            value: '34%', // This might need calculation from transactions
            icon: 'arrow-repeat'
        },
        {
            label: 'Avg Commission',
            value: `$${dashboardData?.avgCommissionPerBooking?.toFixed(0) || '0'}`,
            icon: 'cash-coin'
        },
    ];

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();

        // Early Morning (5-7 AM)
        const earlyMorningMessages = [
            `🌅 Rise and shine, early bird!`,
            `☕ First coffee, first victory!`,
            `🐦 The world is yours this early!`,
            `🌄 Conquer mountains today!`,
            `⏰ Early start, early success!`,
            `🌤 Dawn brings new possibilities!`,
            `💪 Power up for greatness!`,
            `🔥 Ignite your potential now!`,
            `✨ Magic happens in the morning!`,
            `🎯 Aim high from the start!`
        ];

        // Morning (7-12 PM)
        const morningMessages = [
            `🌅 Good morning!`,
            `☕ Coffee time!`,
            `💡 Fresh ideas start now!`,
            `🏃 Start strong today!`,
            `📅 New goals, new wins!`,
            `🌞 Shine bright today!`,
            `🤝 Connect and grow!`,
            `📈 Progress starts early!`,
            `🎨 Paint your day beautiful!`,
            `🚀 Launch into excellence!`,
            `🌱 Plant seeds of success!`,
            `⭐ Half the day, full potential!`,
            `🎪 Make today spectacular!`,
            `🏆 Champion mindset activated!`,
            `🎵 Start with good vibes!`
        ];

        // Afternoon (12-17 PM)
        const afternoonMessages = [
            `☀️ Good afternoon!`,
            `🚀 Keep the momentum!`,
            `🔥 Stay on fire!`,
            `🌱 Keep growing strong!`,
            `📊 Productivity boost!`,
            `💪 Power through the day!`,
            `🎯 Focus on your targets!`,
            `⚡ Energy check—stay sharp!`,
            `🌻 Bloom where you're planted!`,
            `🎪 Make magic happen now!`,
            `🏃‍♂️ Sprint to your goals!`,
            `🎨 Create something amazing!`,
            `🔮 Afternoon gems await you!`,
            `🌊 Flow with the rhythm!`,
            `🎭 Performance time!`,
            `🏅 Excellence is calling!`
        ];

        // Evening (17-21 PM)
        const eveningMessages = [
            `🌇 Good evening!`,
            `📖 Reflect and recharge!`,
            `🌟 You did amazing today!`,
            `🎶 Relax with good vibes!`,
            `🍵 Slow down, breathe easy!`,
            `🙌 Celebrate small wins!`,
            `🛋 Enjoy your comfort zone!`,
            `🌌 Night is settling in—peace ahead!`,
            `🍷 Unwind and appreciate!`,
            `🎨 Evening creativity flows!`,
            `🧘‍♀️ Find your inner calm!`,
            `🎬 Enjoy life's moments!`,
            `🌹 Beauty in the twilight!`,
            `📚 Knowledge before rest!`,
            `🕯 Light up the evening!`,
            `🎭 Evening entertainment!`
        ];

        // Night (21-24 PM)
        const nightMessages = [
            `🌙 Good night!`,
            `🛌 Rest well, dream big!`,
            `✨ Tomorrow holds magic!`,
            `😴 Recharge your soul!`,
            `🔕 Disconnect and rest!`,
            `💤 Deep sleep matters!`,
            `🌠 Drift into dreams!`,
            `🛡 Safe and sound tonight!`,
            `🌜 Let the moon guide your dreams!`,
            `🎶 Lullabies of the night!`,
            `🏰 Build castles in your sleep!`,
            `🌌 Cosmic dreams await!`,
            `🛏 Home sweet dreams!`,
            `🔮 Crystal clear rest ahead!`
        ];

        // Late Night/Midnight (0-5 AM)
        const lateNightMessages = [
            `🌃 Burning the midnight oil?`,
            `🦉 Night owl vibes!`,
            `⭐ Stars are your companions!`,
            `🌙 Midnight magic hour!`,
            `💻 Late night productivity!`,
            `🎧 Night sounds and focus!`,
            `🔥 Burning bright at night!`,
            `🌌 Limitless night energy!`,
            `☕ Midnight fuel running!`,
            `🎯 Sharp focus in the dark!`,
            `🚀 Launch into the night!`,
            `🎪 Night circus performance!`,
            `🔬 Deep dive discoveries!`,
            `🎨 Creative night sessions!`
        ];

        const pickRandom = (messages: string[]) =>
            messages[Math.floor(Math.random() * messages.length)];

        if (hour >= 0 && hour < 5) return pickRandom(lateNightMessages);
        if (hour >= 5 && hour < 7) return pickRandom(earlyMorningMessages);
        if (hour >= 7 && hour < 12) return pickRandom(morningMessages);
        if (hour >= 12 && hour < 17) return pickRandom(afternoonMessages);
        if (hour >= 17 && hour < 21) return pickRandom(eveningMessages);
        return pickRandom(nightMessages);
    };

    // Generate referral link based on agent ID
    const generateReferralLink = () => {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        const agentId = user.id || user.userId || 'default';
        return `https://jambolush.com/all/become-host?ref=${agentId}`;
    };

    // Copy referral link to clipboard
    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(generateReferralLink());
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Fetch referral data
    const fetchReferralData = async (page = 1) => {
        setReferralLoading(true);
        try {
            const response = await api.get(`/auth/agent/referrals?page=${page}&limit=10`);
            setReferralData(response.data.data);
        } catch (error: any) {
            console.error('Error fetching referral data:', error);

            // Handle 404 specifically - endpoint not implemented yet
            if (error.response?.status === 404) {
                console.log('Referrals endpoint not implemented yet');
            }

            // Set empty data on error
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

    // Referral Modal Component
    const ReferralModal = () => {
        if (!showReferralModal) return null;

        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[#083A85] flex items-center gap-2">
                                <i className="bi bi-person-plus" />
                                Refer a Friend
                            </h2>
                            <button
                                onClick={() => setShowReferralModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <i className="bi bi-x-lg text-xl" />
                            </button>
                        </div>
                        <p className="text-gray-600 mt-2">
                            Share your referral link and earn rewards when friends join as hosts!
                        </p>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Referral Link Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Referral Link</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={generateReferralLink()}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                                />
                                <button
                                    onClick={copyReferralLink}
                                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                                        copySuccess
                                            ? 'bg-green-500 text-white'
                                            : 'bg-[#083A85] text-white hover:bg-[#062a63]'
                                    }`}
                                >
                                    <i className={`bi ${copySuccess ? 'bi-check-lg' : 'bi-copy'}`} />
                                    {copySuccess ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Referred Users Table */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Referred Users</h3>
                                <span className="text-sm text-gray-600">
                                    Total: {referralData.totalReferrals} referrals
                                </span>
                            </div>

                            {referralLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083A85]"></div>
                                </div>
                            ) : (
                                <>
                                    {referralData.referrals.length > 0 ? (
                                        <>
                                            {/* Table */}
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Name
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Email
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Phone Number
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Joined Date
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {referralData.referrals.map((referral: any) => (
                                                            <tr key={referral.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {referral.fullName}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{referral.email}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{referral.phone}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        referral.status === 'Active'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : referral.status === 'Pending'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {referral.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {new Date(referral.joinedAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {referralData.totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-6">
                                                    <div className="text-sm text-gray-700">
                                                        Page {referralData.currentPage} of {referralData.totalPages}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => fetchReferralData(referralData.currentPage - 1)}
                                                            disabled={referralData.currentPage === 1}
                                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => fetchReferralData(referralData.currentPage + 1)}
                                                            disabled={referralData.currentPage === referralData.totalPages}
                                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <i className="bi bi-person-plus text-4xl text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                                            <p className="text-gray-500">
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
        <div className="mt-20">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-xl lg:text-3xl font-semibold text-[#083A85] mb-3">
                        {getTimeBasedGreeting()}, {userName}
                    </h1>
                    <p className="text-gray-600 text-md">Here's what's happening with your real estate business</p>
                </div>

                {/* Header with Refer a friend button */}
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="absolute top-20 right-12 m-4 px-6 py-4 text-base font-medium bg-[#083A85] text-white rounded-lg hover:bg-[#062a63] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <i className="bi bi-person-plus" />
                        Refer a friend
                    </button>
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
                                    <i className={`bi bi-${card.icon} text-md sm:text-base`} />
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
                                Monthly Commissions
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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

                    {/* Transaction Activity Chart */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-blue-800" />
                                Weekly Transaction Activity
                            </h3>
                            <div className="text-md text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartTransactionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                                    <Bar dataKey="transactions" fill="#083A85" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Appointments & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    {/* Today's Appointments */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow h-max">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-calendar-week mr-2 text-green-600" />
                                Today's Schedule
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium cursor-pointer" onClick={() => { router.push('/agent/schedule') }}>
                                View Calendar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{appointment.title}</h4>
                                            <p className="text-md text-gray-600 mt-1">{appointment.location}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-md font-medium ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-md text-gray-500">
                                        <span>{appointment.time} • {appointment.duration}</span>
                                        <span>{appointment.client}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-calendar-x text-3xl mb-2" />
                                    <p>No appointments scheduled for today</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibiled flex items-center text-gray-800">
                                <i className="bi bi-chat-dots mr-2 text-blue-600" />
                                Recent Activity
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium">
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentActivity.length > 0 ? recentActivity.map((activity: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-800 text-md">{activity.client}</h4>
                                            <p className="text-md text-gray-600 mt-1 line-clamp-2">{activity.message}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-md font-medium ${activity.type === 'commission' ? 'bg-green-100 text-green-800' :
                                                activity.type === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {activity.type}
                                        </span>
                                    </div>
                                    <div className="text-md text-gray-500">{activity.time}</div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-chat-square-dots text-3xl mb-2" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Transaction Types */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow h-max">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                Transaction Types
                            </h3>
                        </div>
                        <div className="h-48 sm:h-56">
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
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                            {transactionTypes.map((type: any, index) => (
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

                    {/* Recent Client Feedback */}
                    <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base lg:text-lg font-semibold flex items-center text-gray-800">
                                <i className="bi bi-star mr-2 text-amber-500" />
                                Recent Client Feedback
                            </h3>
                            <button className="text-md text-blue-600 hover:text-blue-800 font-medium cursor-pointer" onClick={() => { router.push('/agent/reviews') }}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentFeedback.length > 0 ? recentFeedback.map((feedback: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                                <h4 className="font-medium text-gray-800 text-md mr-2">{feedback.client}</h4>
                                                <div className="flex items-center">
                                                    {[...Array(feedback.rating)].map((_, i) => (
                                                        <i key={i} className="bi bi-star-fill text-yellow-500 text-md" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-md text-gray-600 mb-1">{feedback.comment}</p>
                                            <div className="flex items-center justify-between text-md text-gray-500">
                                                <span>{feedback.property}</span>
                                                <span>{feedback.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="bi bi-star text-3xl mb-2" />
                                    <p>No feedback yet</p>
                                </div>
                            )}
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
                                <div className="text-md lg:text-md text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Referral Modal */}
            <ReferralModal />
        </div>
    );
};

export default EnhancedAgentDashboard;