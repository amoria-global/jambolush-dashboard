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
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Transform earnings data for chart - matches API monthlyCommissions structure
  const transformEarningsData = (monthlyCommissions: any) => {
    if (!monthlyCommissions || monthlyCommissions.length === 0) return [];

    return monthlyCommissions.map((item: any) => ({
      month: new Date(item.month + "-01").toLocaleDateString("en-US", {
        month: "short",
      }),
      earnings: item.commission || item.paymentAmount || 0,
      bookings: item.bookings || 0,
    }));
  };

  // Transform transaction performance data for chart
  const transformTransactionData = (transactionBreakdown: any) => {
    if (!transactionBreakdown ||
        (!transactionBreakdown.paymentTransactions && !transactionBreakdown.escrowTransactions)) {
      return [];
    }

    const transactions = [
      ...(transactionBreakdown.paymentTransactions || []),
      ...(transactionBreakdown.escrowTransactions || []),
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
        (!transactionBreakdown.paymentTransactions &&
         !transactionBreakdown.escrowTransactions)) {
      return [];
    }

    const typeCount: any = {};
    const allTransactions = [
      ...(transactionBreakdown.paymentTransactions || []),
      ...(transactionBreakdown.escrowTransactions || []),
    ];

    allTransactions.forEach((transaction: any) => {
      const type = transaction.type || transaction.status || "Other";
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

  // Transform recent activity from API response
  const transformRecentActivity = (recentActivity: any) => {
    if (!recentActivity || recentActivity.length === 0) {
      return [];
    }

    return recentActivity
      .slice(0, 10)
      .map((activity: any) => ({
        client: activity.metadata?.propertyName || activity.description || "Activity",
        message: activity.description || activity.action,
        time: new Date(activity.timestamp).toLocaleTimeString(),
        type: activity.type || "general",
        icon: activity.type === "booking" ? "calendar-check" : activity.type === "property" ? "house-door" : "activity",
      }));
  };

  // Transform recent bookings to upcoming appointments
  const transformUpcomingAppointments = (recentBookings: any) => {
    if (!recentBookings || recentBookings.length === 0) return [];

    return recentBookings.slice(0, 5).map((booking: any) => ({
      title: `Booking #${booking.id.slice(-8)}`,
      time: new Date(booking.bookingDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      client: booking.clientName || "Guest",
      duration: null,
      location: "Property Booking",
      status: booking.commissionStatus || "pending",
      bookingDate: new Date(booking.bookingDate).toLocaleDateString(),
      commission: booking.commission,
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

  // Prepare data for UI using correct API response structure
  const chartEarningsData = transformEarningsData(
    dashboardData?.monthlyCommissions || earningsData?.monthlyCommissions
  );
  const chartTransactionData = transformTransactionData(
    dashboardData?.transactionBreakdown || transactionsData?.transactionBreakdown
  );
  const transactionTypes = getTransactionTypes(
    dashboardData?.transactionBreakdown || transactionsData?.transactionBreakdown
  );
  const recentActivity = transformRecentActivity(
    dashboardData?.recentActivity || []
  );
  const upcomingAppointments = transformUpcomingAppointments(
    dashboardData?.recentBookings || []
  );

  // Summary cards data from API - mapped to match response structure
  const summaryStats = dashboardData?.summaryStats || {};
  const walletOverview = dashboardData?.walletOverview || {};

  const summaryCards = [
    {
      title: "Managed Properties",
      value: summaryStats?.totalManagedProperties?.toString() || "0",
      change: summaryStats?.totalManagedProperties
        ? `${summaryStats.totalManagedProperties} properties`
        : "No properties",
      icon: "house-door-fill",
      percentage: null,
      bgGradient: "from-pink-500 to-rose-400",
    },
    {
      title: "Total Clients",
      value: summaryStats?.totalClients?.toString() || "0",
      change: summaryStats?.activeClients
        ? `${summaryStats.activeClients} active`
        : "No active clients",
      icon: "people-fill",
      percentage: null,
      bgGradient: "from-blue-800 to-blue-600",
    },
    {
      title: "Total Bookings",
      value: summaryStats?.totalBookings?.toString() || "0",
      change: summaryStats?.totalEarnings
        ? `$${summaryStats.totalEarnings.toLocaleString()} earned`
        : "No earnings yet",
      icon: "calendar-check-fill",
      percentage: null,
      bgGradient: "from-green-500 to-emerald-400",
    },
    {
      title: "Wallet Balance",
      value: walletOverview?.availableBalance
        ? `$${walletOverview.availableBalance.toFixed(2)}`
        : "$0.00",
      change: walletOverview?.pendingBalance
        ? `$${walletOverview.pendingBalance} pending`
        : "No pending",
      icon: "wallet2",
      percentage: null,
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
                      <i className={`bi bi-${activity.icon || 'activity'} text-gray-600`} />
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
                      activity.type === 'booking'
                        ? 'bg-green-100 text-green-700'
                        : activity.type === 'property'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
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