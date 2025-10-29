import React, { useEffect, useState } from "react";
import api from "@/app/api/apiService";
import { set } from "date-fns";

// --- ENHANCED INTERFACES ---
interface EnhancedAgentDashboard {
  totalClients: number;
  activeClients: number;
  totalCommissions: number;
  pendingCommissions: number;
  avgCommissionPerBooking: number;
  recentBookings: AgentBookingInfo[];
  monthlyCommissions: MonthlyCommissionData[];
  additionalKPIs: AdditionalAgentKPIs;
  performanceTrends: {
    conversionTrend: Array<{ month: string; rate: number }>;
    retentionTrend: Array<{ month: string; rate: number }>;
    revenueTrend: Array<{ month: string; revenue: number }>;
    satisfactionTrend: Array<{ month: string; score: number }>;
  };
  competitiveMetrics: {
    marketRanking: number;
    totalAgentsInMarket: number;
    marketSharePercentage: number;
    competitorComparison: {
      averageCommission: number;
      averageProperties: number;
      averageClientRetention: number;
    };
  };
  clientSegmentation: {
    newClients: number;
    repeatClients: number;
    vipClients: number;
    inactiveClients: number;
  };
}

interface AdditionalAgentKPIs {
  conversionRate: number;
  averageResponseTime: number;
  customerRetentionRate: number;
  revenuePerClient: number;
  bookingSuccessRate: number;
  portfolioGrowthRate: number;
  leadGenerationRate: number;
  commissionGrowthRate: number;
  averageDaysOnMarket: number;
  propertyViewsToBookingRatio: number;
  clientSatisfactionScore: number;
  marketPenetration: number;
  averageCommissionPerProperty: number;
  propertyUtilizationRate: number;
  crossSellingSuccess: number;
}

interface AgentBookingInfo {
  id: string;
  clientName: string;
  bookingType: string;
  commission: number;
  commissionStatus: string;
  bookingDate: string;
  createdAt: string;
}

interface MonthlyCommissionData {
  month: string;
  commission: number;
  bookings: number;
}

interface AgentEarnings {
  totalEarnings: number;
  totalBookings: number;
  periodEarnings: number;
  periodBookings: number;
  commissionBreakdown: CommissionBreakdown[];
  timeRange: string;
}

interface CommissionBreakdown {
  bookingType: string;
  totalCommission: number;
  bookingCount: number;
}

interface PropertyPerformance {
  propertyId: number;
  propertyName: string;
  bookings: number;
  revenue: number;
  occupancyRate: number;
  agentCommission: number;
  averageRating: number;
}

type ViewMode = "overview" | "kpis" | "earnings" | "performance";
type TabMode =
  | "overview"
  | "financial"
  | "operational"
  | "goals"
  | "properties";

const MetricCard = ({
  title,
  value,
  subValue,
  icon,
  color = "blue",
  trend,
  format = "number",
}: {
  title: string;
  value: number;
  subValue?: string;
  icon: string;
  color?: string;
  trend?: number;
  format?: "number" | "currency" | "percentage";
}) => {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  const formatValue = (val: number): string => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`;
      case "percentage":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <i className={`bi ${icon} text-xl`}></i>
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div
            className={`flex items-center text-sm font-medium ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <i
              className={`bi ${
                trend >= 0 ? "bi-arrow-up" : "bi-arrow-down"
              } mr-1`}
            ></i>
            {Math.abs(trend).toFixed(1)}% from last period
          </div>
        </div>
      )}
    </div>
  );
};

const RadialProgress = ({
  value,
  max = 100,
  size = 120,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
}) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => setProgress(value), 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const percentage = Math.min(100, (progress / max) * 100);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const viewBox = `0 0 ${size} ${size}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={viewBox}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#083A85"
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="#1f2937"
        >
          {percentage.toFixed(0)}%
        </text>
      </svg>
      {label && <p className="mt-2 text-sm text-gray-600">{label}</p>}
    </div>
  );
};

const ProgressBar = ({
  current,
  target,
  label,
  color = "blue",
}: {
  current: number;
  target: number;
  label: string;
  color?: string;
}) => {
  const percentage = Math.min(100, (current / target) * 100);
  const isOnTrack = percentage >= 75;

  const colorMap: any = {
    blue: "bg-[#083A85]",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            {current.toLocaleString()} / {target.toLocaleString()}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isOnTrack
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            colorMap[color] || "bg-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const CategoryRadar = ({ categories }: { categories: any }) => {
  const maxScore = 100;
  const size = 200;
  const center = size / 2;
  const radius = size / 2 - 40;

  const categoryData = [
    { name: "Quality", value: categories.quality, color: "#3b82f6" },
    { name: "Productivity", value: categories.productivity, color: "#10b981" },
    { name: "Reliability", value: categories.reliability, color: "#8b5cf6" },
    { name: "Financial", value: categories.financialImpact, color: "#f59e0b" },
    { name: "Compliance", value: categories.compliance, color: "#ef4444" },
  ];

  const angleStep = (2 * Math.PI) / categoryData.length;

  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxScore) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const pathData =
    categoryData
      .map((cat: any, i) => {
        const point = getPoint(cat.value, i);
        return `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`;
      })
      .join(" ") + " Z";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Performance Categories
      </h3>
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="mb-4">
          {/* Background circles */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * scale}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {categoryData.map((_, i) => {
            const endpoint = getPoint(maxScore, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={endpoint.x}
                y2={endpoint.y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <path
            d={pathData}
            fill="rgba(8, 58, 133, 0.2)"
            stroke="#083A85"
            strokeWidth="2"
          />

          {/* Data points */}
          {categoryData.map((cat: any, i) => {
            const point = getPoint(cat.value, i);
            return (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={cat.color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Labels */}
          {categoryData.map((cat: any, i) => {
            const labelPoint = getPoint(maxScore + 20, i);
            return (
              <text
                key={i}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-gray-700"
              >
                {cat.name}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {categoryData.map((cat: any, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                ></div>
                <span className="text-xs text-gray-600">{cat.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {cat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MonthlyPerformanceChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="bi bi-graph-up text-4xl mb-2"></i>
        <p>No monthly data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.commission || 0)) * 1.2;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">
        Monthly Commission Trend
      </h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage =
            maxValue > 0 ? (item.commission / maxValue) * 100 : 0;
          const monthName = new Date(item.month + "-01").toLocaleDateString(
            "en-US",
            {
              month: "short",
              year: "numeric",
            }
          );

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {monthName}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    ${item.commission.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({item.bookings} bookings)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    background: "linear-gradient(to right, #083A85, #0a4ba0)",
                  }}
                ></div>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>Paid: ${item.paidAmount.toLocaleString()}</span>
                <span>Pending: ${item.pendingAmount.toLocaleString()}</span>
                {item.failedAmount > 0 && (
                  <span className="text-red-600">
                    Failed: ${item.failedAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScoreCircle = ({
  score,
  label,
  maxScore = 100,
}: {
  score: number;
  label: string;
  maxScore?: number;
}) => {
  const percentage = (score / maxScore) * 100;
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 75) return "#10b981"; // green
    if (score >= 50) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">of {maxScore}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700">{label}</p>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getFirstPropertyImage = (
  images: string | string[] | undefined
): string => {
  if (!images) return "/placeholder-property.jpg";
  if (typeof images === "string") return images;
  if (Array.isArray(images) && images.length > 0) return images[0];
  return "/placeholder-property.jpg";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UnifiedAgentPerformance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [activeTab, setActiveTab] = useState<TabMode>("overview");
  const [timeRange, setTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // Data states
  const [dashboard, setDashboard] = useState<EnhancedAgentDashboard | null>(
    null
  );
  const [earnings, setEarnings] = useState<AgentEarnings | null>(null);
  const [propertyPerformance, setPropertyPerformance] = useState<
    PropertyPerformance[]
  >([]);

  // Fetch enhanced agent dashboard data
  const fetchEnhancedDashboard = async () => {
    try {
      const response = await api.get("/properties/agent/dashboard");
      if (response.data && response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch dashboard data");
    }
  };

  // Fetch agent earnings
  const fetchEarnings = async () => {
    try {
      const response = await api.get("/properties/agent/earnings", {
        params: { timeRange },
      });
      if (response.data && response.data.success) {
        setEarnings(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch earnings data");
    }
  };

  // Fetch property performance
  const fetchPropertyPerformance = async () => {
    try {
      const response = await api.get(
        "/properties/agent/properties/performance",
        {
          params: { timeRange },
        }
      );
      if (response.data && response.data.success) {
        setPropertyPerformance(response.data.data.properties || []);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch property performance data"
      );
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchEnhancedDashboard(),
        fetchEarnings(),
        fetchPropertyPerformance(),
      ]);
    } catch (err) {
      setError("An unexpected error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <i className="bi bi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-bold text-red-800 mb-2">
              Error Loading Data
            </h3>
            <p className="text-red-600 mb-4">
              {error || "Unknown error occurred"}
            </p>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure dashboard has required properties or use defaults
  const dashboardData: any = {
    ...(dashboard || {}),
    recentBookings:
      (dashboard as any)?.recentBookings || dashboard?.recentBookings || [],
    topAgents: (dashboard as any)?.topAgents || [],
    recentManagedProperties: (dashboard as any)?.recentManagedProperties || [],
  };

  // Extract available data or use placeholders
  const profile = {
    name: "Agent",
    agentId: "",
    rating: 0,
    avatar: "/default-avatar.png",
    location: "",
    tier: "Standard",
    status: "active",
    joinDate: new Date().toISOString(),
  };
  const coreMetrics = {
    score: 0,
    rank: 0,
    finalScore: { current: 0, change: 0 },
    tier: { current: "Standard", change: 0 },
    agentRank: { current: 0, total: 0, change: 0, position: 0, totalAgents: 0 },
  };
  const financialKPIs = {
    totalEarningsOverall: dashboard.totalCommissions || 0,
    availableBalance: 0,
    pendingBalance: dashboard.pendingCommissions || 0,
    heldBalance: 0,
    monthlyIncome: { value: 0, change: 0 },
    totalCommissionsPaid: dashboard.totalCommissions || 0,
    totalCommissionsPending: dashboard.pendingCommissions || 0,
    totalCommissionsFailed: 0,
    escrowHeld: 0,
    totalRevenueGenerated: 0,
    totalRevenue: 0,
    avgBookingValue: dashboard.avgCommissionPerBooking || 0,
    avgCommissionPerBooking: dashboard.avgCommissionPerBooking || 0,
    commissionRate: 0,
  };
  const operationalKPIs = {
    totalBookings: dashboardData.recentBookings?.length || 0,
    totalManagedProperties: 0,
    listingsLive: 0,
    totalClients: dashboard.totalClients || 0,
    activeClients: dashboard.activeClients || 0,
    leadsGenerated: 0,
    engagementRate: { value: 0, change: 0 },
    ownerRating: { value: 0, change: 0 },
    dropRate: { value: 0, change: 0 },
  };
  const categoryBreakdown = {
    quality: 0,
    productivity: 0,
    reliability: 0,
    financialImpact: 0,
    compliance: 0,
  };
  const goals = {
    engagementRate: { current: 0, target: 100, progress: 0 },
    listingSuccess: { current: 0, target: 100, progress: 0 },
    monthlyIncome: { current: 0, target: 10000, progress: 0 },
    dropRate: { current: 0, target: 5, progress: 0 },
  };
  const monthlyPerformance: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div
          className="rounded-2xl shadow-xl p-8 mb-6 text-white"
          style={{ background: "linear-gradient(to right, #083A85, #0a4ba0)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
                <p className="text-blue-100 flex items-center gap-2">
                  <i className="bi bi-geo-alt"></i>
                  {profile.location}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium text-black/80">
                    {profile.tier} Tier
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile.status === "active"
                        ? "bg-green-500 bg-opacity-90"
                        : "bg-red-500 bg-opacity-90"
                    }`}
                  >
                    {profile.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Final Score</p>
                  <p className="text-4xl font-bold">
                    {coreMetrics.finalScore.current.toFixed(1)}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      coreMetrics.finalScore.change >= 0
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {coreMetrics.finalScore.change >= 0 ? "+" : ""}
                    {coreMetrics.finalScore.change.toFixed(1)}%
                  </p>
                </div>
                <div className="border-l border-white border-opacity-30 pl-6">
                  <p className="text-blue-100 text-sm mb-1">Rank</p>
                  <p className="text-4xl font-bold">
                    #{coreMetrics.agentRank.position}
                  </p>
                  <p className="text-sm text-blue-100 mt-1">
                    of {coreMetrics.agentRank.totalAgents} agents
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(
              [
                { key: "overview", label: "Overview", icon: "bi-speedometer2" },
                {
                  key: "financial",
                  label: "Financial",
                  icon: "bi-currency-dollar",
                },
                {
                  key: "operational",
                  label: "Operational",
                  icon: "bi-graph-up",
                },
                { key: "goals", label: "Goals", icon: "bi-bullseye" },
                { key: "properties", label: "Properties", icon: "bi-house" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabMode)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                }`}
                style={
                  activeTab === tab.key ? { backgroundColor: "#083A85" } : {}
                }
              >
                <i className={`bi ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Earnings"
                value={financialKPIs.totalEarningsOverall}
                subValue="Lifetime earnings"
                trend={financialKPIs.monthlyIncome.change}
                icon="bi-wallet2"
                color="green"
                format="currency"
              />
              <MetricCard
                title="Available Balance"
                value={financialKPIs.availableBalance}
                subValue="Ready to withdraw"
                icon="bi-cash-stack"
                color="blue"
                format="currency"
              />
              <MetricCard
                title="Total Bookings"
                value={operationalKPIs.totalBookings}
                subValue="All time"
                icon="bi-calendar-check"
                color="purple"
              />
              <MetricCard
                title="Active Properties"
                value={operationalKPIs.totalManagedProperties}
                subValue={`${operationalKPIs.listingsLive} live listings`}
                icon="bi-house-door"
                color="orange"
              />
            </div>

            {/* Score and Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
                <ScoreCircle
                  score={coreMetrics.finalScore.current}
                  label="Performance Score"
                />
              </div>
              <div className="lg:col-span-2">
                <CategoryRadar categories={categoryBreakdown} />
              </div>
            </div>

            {/* Monthly Performance */}
            <MonthlyPerformanceChart data={monthlyPerformance} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Engagement Rate"
                value={operationalKPIs.engagementRate.value}
                trend={operationalKPIs.engagementRate.change}
                icon="bi-people"
                color="indigo"
                format="percentage"
              />
              <MetricCard
                title="Owner Rating"
                value={operationalKPIs.ownerRating.value}
                trend={operationalKPIs.ownerRating.change}
                icon="bi-star-fill"
                color="yellow"
              />
              <MetricCard
                title="Drop Rate"
                value={operationalKPIs.dropRate.value}
                trend={-operationalKPIs.dropRate.change}
                icon="bi-arrow-down-circle"
                color="red"
                format="percentage"
              />
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && (
          <div className="space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Available Balance"
                value={financialKPIs.availableBalance}
                icon="bi-wallet2"
                color="green"
                format="currency"
              />
              <MetricCard
                title="Pending Balance"
                value={financialKPIs.pendingBalance}
                icon="bi-hourglass-split"
                color="orange"
                format="currency"
              />
              <MetricCard
                title="Held in Escrow"
                value={financialKPIs.heldBalance}
                icon="bi-shield-lock"
                color="purple"
                format="currency"
              />
              <MetricCard
                title="Total Earned"
                value={financialKPIs.totalEarningsOverall}
                icon="bi-trophy"
                color="blue"
                format="currency"
              />
            </div>

            {/* Commission Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Commission Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="bi bi-check-circle-fill text-2xl text-green-600"></i>
                      <span className="font-medium text-gray-700">Paid</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      ${financialKPIs.totalCommissionsPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="bi bi-clock-fill text-2xl text-yellow-600"></i>
                      <span className="font-medium text-gray-700">Pending</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      ${financialKPIs.totalCommissionsPending.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="bi bi-x-circle-fill text-2xl text-red-600"></i>
                      <span className="font-medium text-gray-700">Failed</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      ${financialKPIs.totalCommissionsFailed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <i className="bi bi-shield-check text-2xl text-purple-600"></i>
                      <span className="font-medium text-gray-700">Escrow</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      ${financialKPIs.escrowHeld.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Financial Insights
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Avg Commission per Booking
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${financialKPIs.avgCommissionPerBooking.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Based on {operationalKPIs.totalBookings} total bookings
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Monthly Income Target
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        ${goals.monthlyIncome.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            goals.monthlyIncome.progress
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${goals.monthlyIncome.current.toLocaleString()} earned (
                      {goals.monthlyIncome.progress.toFixed(0)}%)
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">This Month</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${financialKPIs.monthlyIncome.value.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">
                          Total Lifetime
                        </p>
                        <p className="text-lg font-bold text-purple-600">
                          ${financialKPIs.totalEarningsOverall.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Performance */}
            <MonthlyPerformanceChart data={monthlyPerformance} />
          </div>
        )}

        {/* Operational Tab */}
        {activeTab === "operational" && (
          <div className="space-y-6">
            {/* Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Bookings"
                value={operationalKPIs.totalBookings}
                icon="bi-calendar-check"
                color="blue"
              />
              <MetricCard
                title="Managed Properties"
                value={operationalKPIs.totalManagedProperties}
                subValue={`${operationalKPIs.listingsLive} active`}
                icon="bi-building"
                color="purple"
              />
              <MetricCard
                title="Total Clients"
                value={operationalKPIs.totalClients}
                subValue={`${operationalKPIs.activeClients} active`}
                icon="bi-people"
                color="green"
              />
              <MetricCard
                title="Leads Generated"
                value={operationalKPIs.leadsGenerated}
                subValue="This month"
                icon="bi-graph-up-arrow"
                color="orange"
              />
            </div>

            {/* Performance Rates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Engagement Rate
                  </h3>
                  <i className="bi bi-heart-fill text-2xl text-indigo-500"></i>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {operationalKPIs.engagementRate.value.toFixed(1)}%
                  </p>
                  <div
                    className={`text-sm font-medium ${
                      operationalKPIs.engagementRate.change >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <i
                      className={`bi ${
                        operationalKPIs.engagementRate.change >= 0
                          ? "bi-arrow-up"
                          : "bi-arrow-down"
                      }`}
                    ></i>
                    {Math.abs(operationalKPIs.engagementRate.change).toFixed(1)}
                    % change
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Owner Rating
                  </h3>
                  <i className="bi bi-star-fill text-2xl text-yellow-500"></i>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {operationalKPIs.ownerRating.value.toFixed(1)}/5.0
                  </p>
                  <div
                    className={`text-sm font-medium ${
                      operationalKPIs.ownerRating.change >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <i
                      className={`bi ${
                        operationalKPIs.ownerRating.change >= 0
                          ? "bi-arrow-up"
                          : "bi-arrow-down"
                      }`}
                    ></i>
                    {Math.abs(operationalKPIs.ownerRating.change).toFixed(1)}{" "}
                    change
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Drop Rate
                  </h3>
                  <i className="bi bi-arrow-down-circle text-2xl text-red-500"></i>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {operationalKPIs.dropRate.value.toFixed(1)}%
                  </p>
                  <div
                    className={`text-sm font-medium ${
                      operationalKPIs.dropRate.change <= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <i
                      className={`bi ${
                        operationalKPIs.dropRate.change <= 0
                          ? "bi-arrow-down"
                          : "bi-arrow-up"
                      }`}
                    ></i>
                    {Math.abs(operationalKPIs.dropRate.change).toFixed(1)}%
                    change
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryRadar categories={categoryBreakdown} />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Category Scores
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      name: "Quality",
                      value: categoryBreakdown.quality,
                      icon: "bi-gem",
                      color: "blue",
                    },
                    {
                      name: "Productivity",
                      value: categoryBreakdown.productivity,
                      icon: "bi-speedometer",
                      color: "green",
                    },
                    {
                      name: "Reliability",
                      value: categoryBreakdown.reliability,
                      icon: "bi-shield-check",
                      color: "purple",
                    },
                    {
                      name: "Financial Impact",
                      value: categoryBreakdown.financialImpact,
                      icon: "bi-graph-up",
                      color: "orange",
                    },
                    {
                      name: "Compliance",
                      value: categoryBreakdown.compliance,
                      icon: "bi-clipboard-check",
                      color: "red",
                    },
                  ].map((cat: any) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <i
                            className={`bi ${cat.icon} text-${cat.color}-600`}
                          ></i>
                          <span className="text-sm font-medium text-gray-700">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {cat.value}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${cat.color}-500`}
                          style={{ width: `${cat.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Recent Bookings
              </h3>
              {dashboardData.recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentBookings
                    .slice(0, 5)
                    .map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {booking.clientName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.bookingDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ${booking.commission.toLocaleString()}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              booking.commissionStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : booking.commissionStatus === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {booking.commissionStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No recent bookings
                </p>
              )}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Performance Goals
              </h3>
              <div className="space-y-6">
                <ProgressBar
                  current={goals.engagementRate.current}
                  target={goals.engagementRate.target}
                  label="Engagement Rate (%)"
                  color="blue"
                />
                <ProgressBar
                  current={goals.listingSuccess.current}
                  target={goals.listingSuccess.target}
                  label="Listing Success Rate (%)"
                  color="green"
                />
                <ProgressBar
                  current={goals.monthlyIncome.current}
                  target={goals.monthlyIncome.target}
                  label="Monthly Income ($)"
                  color="orange"
                />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Drop Rate (Lower is Better)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {goals.dropRate.current.toFixed(1)}% /{" "}
                        {goals.dropRate.target.toFixed(1)}%
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          goals.dropRate.current <= goals.dropRate.target
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {goals.dropRate.current <= goals.dropRate.target
                          ? "On Track"
                          : "Needs Improvement"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        goals.dropRate.current <= goals.dropRate.target
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(100, goals.dropRate.progress)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <i className="bi bi-heart-fill text-3xl mb-3 opacity-80"></i>
                <h4 className="text-sm font-medium opacity-90 mb-2">
                  Engagement Goal
                </h4>
                <p className="text-3xl font-bold mb-1">
                  {goals.engagementRate.progress.toFixed(0)}%
                </p>
                <p className="text-sm opacity-80">
                  {goals.engagementRate.current}% /{" "}
                  {goals.engagementRate.target}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <i className="bi bi-trophy-fill text-3xl mb-3 opacity-80"></i>
                <h4 className="text-sm font-medium opacity-90 mb-2">
                  Listing Success
                </h4>
                <p className="text-3xl font-bold mb-1">
                  {goals.listingSuccess.progress.toFixed(0)}%
                </p>
                <p className="text-sm opacity-80">
                  {goals.listingSuccess.current}% /{" "}
                  {goals.listingSuccess.target}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <i className="bi bi-currency-dollar text-3xl mb-3 opacity-80"></i>
                <h4 className="text-sm font-medium opacity-90 mb-2">
                  Monthly Income
                </h4>
                <p className="text-3xl font-bold mb-1">
                  {goals.monthlyIncome.progress.toFixed(0)}%
                </p>
                <p className="text-sm opacity-80">
                  ${goals.monthlyIncome.current} / ${goals.monthlyIncome.target}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                <i className="bi bi-arrow-down-circle-fill text-3xl mb-3 opacity-80"></i>
                <h4 className="text-sm font-medium opacity-90 mb-2">
                  Drop Rate Control
                </h4>
                <p className="text-3xl font-bold mb-1">
                  {goals.dropRate.current <= goals.dropRate.target ? "✓" : "✗"}
                </p>
                <p className="text-sm opacity-80">
                  {goals.dropRate.current.toFixed(1)}% /{" "}
                  {goals.dropRate.target.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Top Performers
              </h3>
              <div className="space-y-3">
                {dashboardData.topAgents.map((agent: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      agent.name === profile.name
                        ? "bg-blue-50 border-2"
                        : "bg-gray-50"
                    }`}
                    style={
                      agent.name === profile.name
                        ? { borderColor: "#083A85" }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {agent.name}
                          {agent.name === profile.name && (
                            <span
                              className="ml-2 text-xs text-white px-2 py-1 rounded-full"
                              style={{ backgroundColor: "#083A85" }}
                            >
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {agent.tier} Tier
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {agent.finalScore.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${agent.income.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <MetricCard
                title="Total Properties"
                value={operationalKPIs.totalManagedProperties}
                icon="bi-building"
                color="blue"
              />
              <MetricCard
                title="Active Listings"
                value={operationalKPIs.listingsLive}
                icon="bi-house-check"
                color="green"
              />
              <MetricCard
                title="Total Bookings"
                value={operationalKPIs.totalBookings}
                icon="bi-calendar-event"
                color="purple"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Managed Properties
              </h3>
              {dashboardData.recentManagedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.recentManagedProperties.map(
                    (property: any) => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                      >
                        {/* Property Image */}
                        <img
                          src={getFirstPropertyImage(property.images)}
                          alt={property.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop";
                          }}
                        />

                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {property.name}
                              </h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <i className="bi bi-geo-alt"></i>
                                {property.location}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                property.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {property.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600">Type</p>
                              <p className="font-medium text-gray-900 capitalize">
                                {property.type}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600">Category</p>
                              <p className="font-medium text-gray-900 capitalize">
                                {property.category.replace("_", " ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <div>
                              <p className="text-xs text-gray-600">
                                Price/Night
                              </p>
                              <p
                                className="text-lg font-bold"
                                style={{ color: "#083A85" }}
                              >
                                ${property.pricePerNight.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Bookings</p>
                              <p className="text-lg font-bold text-gray-900">
                                {property.totalBookings}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Rating</p>
                              <p className="text-lg font-bold text-yellow-600 flex items-center gap-1">
                                {property.averageRating.toFixed(1)}
                                <i className="bi bi-star-fill text-sm"></i>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No properties found
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedAgentPerformance;
