"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/app/api/apiService";

const EnhancedAgentDashboard = () => {
  const router = useRouter();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [transactionsData, setTransactionsData] = useState<any>([]);
  const [earningsData, setEarningsData] = useState<any>([]);
  const [propertiesData, setPropertiesData] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  const [userName, setUserName] = useState("Agent");

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const user = JSON.parse(localStorage.getItem("userSession") || "{}");
        if (user.name || user.firstName) {
          setUserName(user.firstName || user.name);
        }

        // Fetch basic dashboard data
        const dashboardResponse = await api.get("/properties/agent/dashboard");
        const dashboard = dashboardResponse.data.data;
        setDashboardData(dashboard);

        // Fetch transaction monitoring data
        const transactionsResponse = await api.get(
          "/properties/agent/transactions/monitoring"
        );
        setTransactionsData(transactionsResponse.data.data);

        // Fetch earnings data with transactions
        const earningsResponse = await api.get("/properties/agent/earnings");
        setEarningsData(earningsResponse.data.data);

        // Fetch agent's properties
        const propertiesResponse = await api.get(
          "/properties/agent/properties"
        );
        setPropertiesData(propertiesResponse.data.data.properties);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Transform earnings data for chart
  const transformEarningsData = (monthlyCommissions: any) => {
    if (!monthlyCommissions || monthlyCommissions.length === 0) return [];

    return monthlyCommissions.map((item: any) => ({
      month: new Date(item.month + "-01").toLocaleDateString("en-US", {
        month: "short",
      }),
      earnings: item.commission || item.earnings || 0,
    }));
  };

  // Transform transaction performance data for chart
  const transformTransactionData = (transactionBreakdown: any) => {
    if (!transactionBreakdown || !transactionBreakdown.escrowTransactions) {
      return [];
    }

    const transactions = [
      ...(transactionBreakdown.escrowTransactions || []),
      ...(transactionBreakdown.paymentTransactions || []),
    ];

    const dayCount: any = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };
    
    transactions.forEach((transaction: any) => {
      const day = new Date(transaction.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (dayCount.hasOwnProperty(day)) {
        dayCount[day] += 1;
      }
    });

    return Object.entries(dayCount).map(([day, count]) => ({
      day,
      transactions: count,
    }));
  };

  // Get transaction types from transaction data
  const getTransactionTypes = (transactionBreakdown: any) => {
    if (!transactionBreakdown ||
        (!transactionBreakdown.escrowTransactions &&
         !transactionBreakdown.paymentTransactions)) {
      return [];
    }

    const typeCount: any = {};
    const allTransactions = [
      ...(transactionBreakdown.escrowTransactions || []),
      ...(transactionBreakdown.paymentTransactions || []),
    ];

    allTransactions.forEach((transaction: any) => {
      const type = transaction.status || transaction.type || "Other";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = [
      "#F20C8F",
      "#083A85",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
    ];
    
    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  // Transform recent transactions for activity section
  const transformRecentActivity = (transactionBreakdown: any) => {
    if (!transactionBreakdown ||
        (!transactionBreakdown.escrowTransactions &&
         !transactionBreakdown.paymentTransactions)) {
      return [];
    }

    const allTransactions = [
      ...(transactionBreakdown.escrowTransactions || []).map((t: any) => ({
        ...t,
        source: "escrow",
      })),
      ...(transactionBreakdown.paymentTransactions || []).map((t: any) => ({
        ...t,
        source: "payment",
      })),
    ];

    return allTransactions
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 4)
      .map((transaction: any) => ({
        client: transaction.clientName || transaction.user?.name || "Client",
        message:
          transaction.description ||
          transaction.notes ||
          `${transaction.source} transaction ${transaction.status}`,
        time: new Date(transaction.createdAt).toLocaleTimeString(),
        type:
          transaction.status === "RELEASED" ||
          transaction.status === "completed"
            ? "commission"
            : transaction.status,
      }));
  };

  // Transform upcoming appointments
  const transformUpcomingAppointments = (properties: any) => {
    if (!properties || properties.length === 0) return [];

    return properties.slice(0, 3).map((property: any) => ({
      title: property.title || property.name,
      time: property.nextViewing
        ? new Date(property.nextViewing).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      client: property.interestedClient || "Client",
      duration: property.viewingDuration || null,
      location: property.location || property.address,
      status: property.status || "pending",
    }));
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <i className="bi bi-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transform transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for UI
  const chartEarningsData = transformEarningsData(
    dashboardData?.monthlyCommissions || earningsData?.monthlyCommissions
  );
  const chartTransactionData = transformTransactionData(
    transactionsData?.transactionBreakdown ||
      dashboardData?.transactionBreakdown
  );
  const transactionTypes = getTransactionTypes(
    transactionsData?.transactionBreakdown ||
      dashboardData?.transactionBreakdown
  );
  const recentActivity = transformRecentActivity(
    transactionsData?.transactionBreakdown ||
      dashboardData?.transactionBreakdown
  );
  const upcomingAppointments = transformUpcomingAppointments(
    propertiesData || dashboardData?.upcomingAppointments
  );

  // Summary cards data from API
  const summaryCards = [
    {
      title: "Active Properties",
      value: dashboardData?.activeProperties?.toString() || "0",
      change: dashboardData?.totalProperties 
        ? `${dashboardData.totalProperties} total` 
        : "No data",
      icon: "house-door-fill",
      percentage: dashboardData?.propertyGrowth 
        ? `+${dashboardData.propertyGrowth}%` 
        : null,
      bgGradient: "from-pink-500 to-rose-400",
    },
    {
      title: "Total Clients",
      value: dashboardData?.totalClients?.toString() || "0",
      change: dashboardData?.activeClients 
        ? `${dashboardData.activeClients} active` 
        : "No data",
      icon: "people-fill",
      percentage: dashboardData?.clientGrowth 
        ? `+${dashboardData.clientGrowth}%` 
        : null,
      bgGradient: "from-blue-800 to-blue-600",
    },
    {
      title: "Total Commissions",
      value: dashboardData?.totalCommissions 
        ? `$${dashboardData.totalCommissions.toLocaleString()}` 
        : "$0",
      change: "All time earnings",
      icon: "cash-stack",
      percentage: dashboardData?.commissionGrowth 
        ? `+${dashboardData.commissionGrowth}%` 
        : null,
      bgGradient: "from-green-500 to-emerald-400",
    },
    {
      title: "Success Rate",
      value: dashboardData?.successRate 
        ? `${dashboardData.successRate.toFixed(1)}%` 
        : "0%",
      change: dashboardData?.pendingDeals 
        ? `${dashboardData.pendingDeals} pending` 
        : "No pending deals",
      icon: "graph-up-arrow",
      percentage: dashboardData?.successGrowth 
        ? `+${dashboardData.successGrowth}%` 
        : null,
      bgGradient: "from-amber-500 to-orange-400",
    },
  ];

  // Recent reviews from transaction data
  const recentFeedback = (
    transactionsData?.transactionBreakdown?.escrowTransactions || []
  )
    .filter((transaction: any) => transaction.feedback || transaction.rating)
    .slice(0, 3)
    .map((transaction: any) => ({
      client: transaction.clientName || transaction.user?.name || "Anonymous",
      rating: transaction.rating || 0,
      comment:
        transaction.feedback?.comment ||
        transaction.notes ||
        "No comment provided",
      property:
        transaction.property?.title || transaction.propertyName || "Property",
      date: new Date(
        transaction.feedback?.createdAt || transaction.createdAt
      ).toLocaleDateString(),
    }));


  return (
    <div className="p-1">
      <div className="max-w-9xl mx-auto px-3 sm:px-3 lg:px-4">
        {/* Header Section */}
        <div className="mb-8 md:mb-10 bg-white shadow-sm rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl  text-gray-900">
                {getTimeBasedGreeting()}, <span className="font-semibold">{userName}</span>
              </h1>
              <p className="mt-2 ml-2 text-base sm:text-lg text-gray-600">
                Here's your business overview for today
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient} shadow-lg`}>
                    <i className={`bi bi-${card.icon} text-white text-lg`} />
                  </div>
                  {card.percentage && (
                    <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <i className="bi bi-arrow-up-short mr-0.5" />
                      {card.percentage}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {card.value}
                </p>
                <p className="text-sm text-gray-500">{card.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        {(chartEarningsData.length > 0 || chartTransactionData.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Earnings Chart */}
            {chartEarningsData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Monthly Earnings
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Your commission trends
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <i className="bi bi-three-dots text-gray-400" />
                  </button>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartEarningsData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F20C8F" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F20C8F" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="earnings"
                        stroke="#F20C8F"
                        strokeWidth={3}
                        fill="url(#colorEarnings)"
                        dot={{ fill: '#F20C8F', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Activity Chart */}
            {chartTransactionData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Weekly Activity
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Transaction volume by day
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <i className="bi bi-three-dots text-gray-400" />
                  </button>
                </div>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartTransactionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar
                        dataKey="transactions"
                        fill="#083A85"
                        radius={[8, 8, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Today's Schedule
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your upcoming bookings
                </p>
              </div>
              <Link
                href="/all/agent/bookings"
                className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => router.push("/all/agent/bookings")}
                    className="group p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <h4 className="font-semibold text-gray-900">
                            {apt.title}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {apt.time && (
                            <span className="flex items-center">
                              <i className="bi bi-clock mr-1.5" />
                              {apt.time} {apt.duration && `• ${apt.duration}`}
                            </span>
                          )}
                          <span className="flex items-center">
                            <i className="bi bi-person mr-1.5" />
                            {apt.client}
                          </span>
                          {apt.location && (
                            <span className="flex items-center">
                              <i className="bi bi-geo-alt mr-1.5" />
                              {apt.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-100 rounded-lg">
                        <i className="bi bi-arrow-right text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bi bi-calendar-x text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    No appointments scheduled for today
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Overview */}
          {transactionTypes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Transaction Overview
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Distribution by type
                </p>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transactionTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
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
              <div className="space-y-2 mt-6">
                {transactionTypes.map((type: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm text-gray-600">{type.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {type.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Latest transactions
                  </p>
                </div>
                <Link href="/all/agent/bookings" className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors cursor-pointer">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity: any, index: number) => (
                  <div key={index} onClick={() => router.push("/all/agent/bookings")} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className={`bi bi-${
                        activity.type === 'commission' ? 'cash' :
                        activity.type === 'PENDING' ? 'clock' : 'activity'
                      } text-gray-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {activity.client}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      activity.type === 'commission'
                        ? 'bg-green-100 text-green-700'
                        : activity.type === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {activity.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Reviews */}
          {recentFeedback.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Client Reviews
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Recent feedback</p>
                </div>
                <Link
                  href="/all/agent/performance"
                  className="text-sm font-medium text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {recentFeedback.map((review: any, index: number) => (
                  <div key={index} onClick={() => router.push("/all/agent/performance")} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {review.client}
                        </p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`bi bi-star${i < review.rating ? '-fill' : ''} text-sm ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {review.property}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAgentDashboard;