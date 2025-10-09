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

                // Fetch earnings/commission data
                const earningsResponse = await api.get('/bookings/agent/commissions');
                setEarningsData(earningsResponse.data.data);

                // Fetch client bookings
                const clientBookingsResponse = await api.get('/bookings/agent/clients').catch(() => null);

                // Fetch agent's properties
                const propertiesResponse = await api.get('/properties/agent/properties');
                setPropertiesData(propertiesResponse.data.data.properties);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Transform earnings data for chart
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

    // Transform transaction performance data for chart
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F20C8F] mx-auto mb-3"></div>
                    <p className="text-gray-600 text-xs">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-20 flex items-center justify-center min-h-screen">
                <div className="text-center max-w-md">
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-xl p-3 shadow-md">
                        <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-red-100 rounded-xl">
                            <i className="bi bi-exclamation-triangle text-red-600 text-sm" />
                        </div>
                        <h2 className="text-red-800 font-semibold mb-2 text-sm">Error Loading Dashboard</h2>
                        <p className="text-red-600 mb-2 text-xs">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-[#F20C8F] to-[#d10a7a] text-white px-3 py-2 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#F20C8F]/20 focus:border-transparent"
                        >
                            <i className="bi bi-arrow-clockwise mr-2" />
                            Retry
                        </button>
                    </div>
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
            iconBg: '#F20C8F',
        },
        {
            title: 'Total Clients',
            value: dashboardData?.totalClients?.toString() || '0',
            change: `${dashboardData?.activeClients || 0} active clients`,
            icon: 'people',
            iconBg: '#083A85',
        },
        {
            title: 'Total Commissions',
            value: `$${dashboardData?.totalCommissions?.toLocaleString() || '0'}`,
            change: 'All time earnings',
            icon: 'currency-dollar',
            iconBg: '#10B981',
        },
        {
            title: 'Success Rate',
            value: `${dashboardData?.successRate?.toFixed(1) || '85.0'}%`,
            change: `${dashboardData?.pendingDeals || 0} pending deals`,
            icon: 'graph-up-arrow',
            iconBg: '#F59E0B',
        },
    ];

    // Recent reviews/feedback
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

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();

        const earlyMorningMessages = [`🌅 Rise and shine, early bird!`, `☕ First coffee, first victory!`, `🐦 The world is yours this early!`, `🌄 Conquer mountains today!`, `⏰ Early start, early success!`, `🌤 Dawn brings new possibilities!`, `💪 Power up for greatness!`, `🔥 Ignite your potential now!`, `✨ Magic happens in the morning!`, `🎯 Aim high from the start!`];
        const morningMessages = [`🌅 Good morning!`, `☕ Coffee time!`, `💡 Fresh ideas start now!`, `🏃 Start strong today!`, `📅 New goals, new wins!`, `🌞 Shine bright today!`, `🤝 Connect and grow!`, `📈 Progress starts early!`, `🎨 Paint your day beautiful!`, `🚀 Launch into excellence!`, `🌱 Plant seeds of success!`, `⭐ Half the day, full potential!`, `🎪 Make today spectacular!`, `🏆 Champion mindset activated!`, `🎵 Start with good vibes!`];
        const afternoonMessages = [`☀️ Good afternoon!`, `🚀 Keep the momentum!`, `🔥 Stay on fire!`, `🌱 Keep growing strong!`, `📊 Productivity boost!`, `💪 Power through the day!`, `🎯 Focus on your targets!`, `⚡ Energy check—stay sharp!`, `🌻 Bloom where you're planted!`, `🎪 Make magic happen now!`, `🏃‍♂️ Sprint to your goals!`, `🎨 Create something amazing!`, `🔮 Afternoon gems await you!`, `🌊 Flow with the rhythm!`, `🎭 Performance time!`, `🏅 Excellence is calling!`];
        const eveningMessages = [`🌇 Good evening!`, `📖 Reflect and recharge!`, `🌟 You did amazing today!`, `🎶 Relax with good vibes!`, `🍵 Slow down, breathe easy!`, `🙌 Celebrate small wins!`, `🛋 Enjoy your comfort zone!`, `🌌 Night is settling in—peace ahead!`, `🍷 Unwind and appreciate!`, `🎨 Evening creativity flows!`, `🧘‍♀️ Find your inner calm!`, `🎬 Enjoy life's moments!`, `🌹 Beauty in the twilight!`, `📚 Knowledge before rest!`, `🕯 Light up the evening!`, `🎭 Evening entertainment!`];
        const nightMessages = [`🌙 Good night!`, `🛌 Rest well, dream big!`, `✨ Tomorrow holds magic!`, `😴 Recharge your soul!`, `🔕 Disconnect and rest!`, `💤 Deep sleep matters!`, `🌠 Drift into dreams!`, `🛡 Safe and sound tonight!`, `🌜 Let the moon guide your dreams!`, `🎶 Lullabies of the night!`, `🏰 Build castles in your sleep!`, `🌌 Cosmic dreams await!`, `🛏 Home sweet dreams!`, `🔮 Crystal clear rest ahead!`];
        const lateNightMessages = [`🌃 Burning the midnight oil?`, `🦉 Night owl vibes!`, `⭐ Stars are your companions!`, `🌙 Midnight magic hour!`, `💻 Late night productivity!`, `🎧 Night sounds and focus!`, `🔥 Burning bright at night!`, `🌌 Limitless night energy!`, `☕ Midnight fuel running!`, `🎯 Sharp focus in the dark!`, `🚀 Launch into the night!`, `🎪 Night circus performance!`, `🔬 Deep dive discoveries!`, `🎨 Creative night sessions!`];

        const pickRandom = (messages: string[]) => messages[Math.floor(Math.random() * messages.length)];

        if (hour >= 0 && hour < 5) return pickRandom(lateNightMessages);
        if (hour >= 5 && hour < 7) return pickRandom(earlyMorningMessages);
        if (hour >= 7 && hour < 12) return pickRandom(morningMessages);
        if (hour >= 12 && hour < 17) return pickRandom(afternoonMessages);
        if (hour >= 17 && hour < 21) return pickRandom(eveningMessages);
        return pickRandom(nightMessages);
    };

    // Generate referral link
    const generateReferralLink = () => {
        const user = JSON.parse(localStorage.getItem('userSession') || '{}');
        const agentId = user.id || user.userId || 'default';
        return `https://jambolush.com/all/become-host?ref=${agentId}`;
    };

    // Copy referral link
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
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-3 z-50">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
                    <div className="p-3 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#083A85] flex items-center gap-2">
                                <i className="bi bi-person-plus" />
                                Refer a Friend
                            </h2>
                            <button
                                onClick={() => setShowReferralModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-all duration-200"
                            >
                                <i className="bi bi-x-lg text-sm" />
                            </button>
                        </div>
                        <p className="text-gray-600 mt-1 text-xs">
                            Share your referral link and earn rewards when friends join as hosts!
                        </p>
                    </div>

                    <div className="p-3 overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="mb-5">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">Your Referral Link</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={generateReferralLink()}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#083A85]/20 focus:border-transparent text-xs transition-all duration-200"
                                />
                                <button
                                    onClick={copyReferralLink}
                                    className={`px-3 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 text-xs hover:-translate-y-0.5 ${
                                        copySuccess
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                            : 'bg-gradient-to-r from-[#083A85] to-[#0a4fa0] text-white hover:shadow-lg'
                                    }`}
                                >
                                    <i className={`bi ${copySuccess ? 'bi-check-lg' : 'bi-copy'}`} />
                                    {copySuccess ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-800">Referred Users</h3>
                                <span className="text-xs text-gray-600 font-medium">
                                    Total: {referralData.totalReferrals} referrals
                                </span>
                            </div>

                            {referralLoading ? (
                                <div className="flex justify-center py-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083A85]"></div>
                                </div>
                            ) : (
                                <>
                                    {referralData.referrals.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-white border border-gray-100 rounded-xl shadow-md">
                                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Joined</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {referralData.referrals.map((referral: any) => (
                                                            <tr key={referral.id} className="hover:bg-gray-50/80 transition-all duration-200">
                                                                <td className="px-3 py-2 text-xs font-medium text-gray-900">{referral.fullName}</td>
                                                                <td className="px-3 py-2 text-xs text-gray-900">{referral.email}</td>
                                                                <td className="px-3 py-2 text-xs text-gray-900">{referral.phone}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                                        referral.status === 'Active'
                                                                            ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800'
                                                                            : referral.status === 'Pending'
                                                                            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800'
                                                                            : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {referral.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs text-gray-900">
                                                                    {new Date(referral.joinedAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {referralData.totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="text-xs text-gray-700">
                                                        Page {referralData.currentPage} of {referralData.totalPages}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => fetchReferralData(referralData.currentPage - 1)}
                                                            disabled={referralData.currentPage === 1}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => fetchReferralData(referralData.currentPage + 1)}
                                                            disabled={referralData.currentPage === referralData.totalPages}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-10">
                                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-xl">
                                                <i className="bi bi-person-plus text-gray-400 text-lg" />
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900 mb-1">No referrals yet</h3>
                                            <p className="text-gray-500 text-xs">
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
            <div className="max-w-7xl mx-auto px-3">

                <div className="mb-3">
                    <h1 className="text-base lg:text-lg font-semibold text-[#083A85] mb-1">
                        {getTimeBasedGreeting()}, {userName}
                    </h1>
                    <p className="text-gray-600 text-xs">Here's what's happening with your real estate business</p>
                </div>

                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="px-3 py-2 text-xs font-semibold bg-gradient-to-r from-[#083A85] to-[#0a4fa0] text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#083A85]/20 focus:border-transparent"
                    >
                        <i className="bi bi-person-plus" />
                        Refer a friend
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    {summaryCards.map((card, index) => (
                        <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden border border-gray-100">
                            <div className="absolute top-1 right-1 opacity-5 text-2xl">
                                <i className={`bi bi-${card.icon}`} />
                            </div>
                            <div className="flex items-center mb-2">
                                <div
                                    className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 text-white shadow-sm bg-gradient-to-br"
                                    style={{ background: `linear-gradient(to bottom right, ${card.iconBg}, ${card.iconBg}dd)` }}
                                >
                                    <i className={`bi bi-${card.icon} text-xs`} />
                                </div>
                                <span className="text-xs text-gray-600 font-semibold">{card.title}</span>
                            </div>
                            <div className="text-base lg:text-lg font-bold mb-1 text-gray-800">{card.value}</div>
                            <div className="text-xs text-green-600 flex items-center font-semibold">
                                <i className="bi bi-arrow-up mr-1" />
                                {card.change}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center text-gray-800">
                                <i className="bi bi-graph-up mr-2 text-[#F20C8F]" />
                                Monthly Commissions
                            </h3>
                            <div className="text-xs text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-44 sm:h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartEarningsData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '10px' }} />
                                    <Line type="monotone" dataKey="earnings" stroke="#F20C8F" strokeWidth={3} dot={{ fill: '#F20C8F', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#F20C8F', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center text-gray-800">
                                <i className="bi bi-bar-chart mr-2 text-[#083A85]" />
                                Weekly Transaction Activity
                            </h3>
                            <div className="text-xs text-gray-500">
                                <i className="bi bi-three-dots" />
                            </div>
                        </div>
                        <div className="h-44 sm:h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartTransactionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '10px' }} />
                                    <Bar dataKey="transactions" fill="#083A85" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 h-max border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center text-gray-800">
                                <i className="bi bi-calendar-week mr-2 text-green-600" />
                                Today's Schedule
                            </h3>
                            <button className="text-xs text-[#083A85] hover:text-blue-900 font-semibold transition-all duration-200 hover:-translate-y-0.5" onClick={() => router.push('/agent/schedule')}>
                                View Calendar
                            </button>
                        </div>
                        <div className="space-y-2">
                            {upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment: any, index: number) => (
                                <div key={index} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all duration-200">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 text-xs">{appointment.title}</h4>
                                            <p className="text-xs text-gray-600 mt-0.5">{appointment.location}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appointment.status === 'confirmed' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800' : 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800'}`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{appointment.time} • {appointment.duration}</span>
                                        <span>{appointment.client}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-gray-500">
                                    <i className="bi bi-calendar-x text-lg mb-2" />
                                    <p className="text-xs">No appointments scheduled</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center text-gray-800">
                                <i className="bi bi-chat-dots mr-2 text-blue-600" />
                                Recent Activity
                            </h3>
                            <button className="text-xs text-[#083A85] hover:text-blue-900 font-semibold transition-all duration-200 hover:-translate-y-0.5">
                                View All
                            </button>
                        </div>
                        <div className="space-y-2">
                            {recentActivity.length > 0 ? recentActivity.map((activity: any, index: number) => (
                                <div key={index} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all duration-200">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 text-xs">{activity.client}</h4>
                                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{activity.message}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activity.type === 'commission' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800' :
                                            activity.type === 'PENDING' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800' : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800'}`}>
                                            {activity.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{activity.time}</div>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-gray-500">
                                    <i className="bi bi-chat-square-dots text-lg mb-2" />
                                    <p className="text-xs">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 h-max border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center text-gray-800">
                                <i className="bi bi-pie-chart mr-2 text-gray-600" />
                                Transaction Types
                            </h3>
                        </div>
                        <div className="h-40 sm:h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={transactionTypes} cx="50%" cy="50%" innerRadius={25} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {transactionTypes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {transactionTypes.map((type: any, index) => (
                                <div key={index} className="flex items-center text-xs font-semibold">
                                    <div className="w-2.5 h-2.5 mr-1 rounded-sm" style={{ backgroundColor: type.color }}></div>
                                    {type.name} ({type.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 lg:col-span-2 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center text-gray-800">
                                <i className="bi bi-star mr-2 text-amber-500" />
                                Recent Client Feedback
                            </h3>
                            <button className="text-xs text-[#083A85] hover:text-blue-900 font-semibold transition-all duration-200 hover:-translate-y-0.5" onClick={() => router.push('/agent/reviews')}>
                                View All
                            </button>
                        </div>
                        <div className="space-y-2">
                            {recentFeedback.length > 0 ? recentFeedback.map((feedback: any, index: number) => (
                                <div key={index} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-all duration-200">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-1">
                                                <h4 className="font-semibold text-gray-800 text-xs mr-2">{feedback.client}</h4>
                                                <div className="flex items-center">
                                                    {[...Array(feedback.rating)].map((_, i) => (
                                                        <i key={i} className="bi bi-star-fill text-yellow-500 text-xs" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1">{feedback.comment}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{feedback.property}</span>
                                                <span>{feedback.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-gray-500">
                                    <i className="bi bi-star text-lg mb-2" />
                                    <p className="text-xs">No feedback yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-3 bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
                    <h3 className="text-sm font-semibold mb-2 text-gray-800">Performance Stats</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="text-center p-2 rounded-xl hover:bg-gray-50/80 transition-all duration-200">
                                <div className="text-base lg:text-lg mb-1 text-gray-600">
                                    <i className={`bi bi-${stat.icon}`} />
                                </div>
                                <div className="text-sm lg:text-base font-bold text-gray-800 mb-1">{stat.value}</div>
                                <div className="text-xs text-gray-600 font-semibold">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ReferralModal />
        </div>
    );
};

export default EnhancedAgentDashboard;
