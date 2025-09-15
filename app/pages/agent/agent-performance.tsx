import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';

// --- INTERFACES ---
interface AgentDashboard {
  totalClients: number;
  activeClients: number;
  totalCommissions: number;
  pendingCommissions: number;
  avgCommissionPerBooking: number;
  recentBookings: AgentBookingInfo[];
  monthlyCommissions: MonthlyCommissionData[];
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

type ViewMode = 'overview' | 'earnings' | 'performance';

const RadialProgress = ({ value, max = 100, size = 120 }: { value: number; max?: number; size?: number }) => {
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
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={viewBox}>
        <circle 
          className="stroke-current text-gray-200" 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        <circle
          className="stroke-current text-[#083A85]"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ 
            strokeDasharray: dashArray, 
            strokeDashoffset: dashOffset, 
            transition: 'stroke-dashoffset 1s ease-out' 
          }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute text-2xl font-bold text-gray-800">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
    </div>
  );
};

const PerformanceChart = ({ data }: { data: MonthlyCommissionData[] }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string }>({ 
    visible: false, x: 0, y: 0, content: '' 
  });

  if (!data || data.length < 2) {
    return (
      <div className="text-center py-8">
        <i className="bi bi-graph-up text-4xl text-gray-300 mb-2"></i>
        <p className="text-gray-500">Insufficient data for chart display</p>
      </div>
    );
  }

  const width = 500;
  const height = 200;
  const padding = 40;
  const yMax = Math.max(...data.map(d => d.commission)) * 1.1;
  const yMin = 0;

  const xScale = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);
  const yScale = (commission: number) => height - padding - ((commission - yMin) / (yMax - yMin)) * (height - padding * 2);

  const handleMouseOver = (e: React.MouseEvent, content: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ 
      visible: true, 
      x: rect.left + window.scrollX, 
      y: rect.top + window.scrollY - 40, 
      content 
    });
  };

  const handleMouseOut = () => setTooltip({ ...tooltip, visible: false });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Monthly Commission Trend</h3>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button 
            onClick={() => setChartType('line')} 
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              chartType === 'line' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Line
          </button>
          <button 
            onClick={() => setChartType('bar')} 
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              chartType === 'bar' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Bar
          </button>
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Y-Axis Labels */}
          {[yMin, yMax / 2, yMax].map(val => (
            <g key={val}>
              <text 
                x={padding - 10} 
                y={yScale(val)} 
                dy="0.3em" 
                textAnchor="end" 
                className="text-[10px] fill-gray-500"
              >
                ${Math.round(val).toLocaleString()}
              </text>
              <line 
                x1={padding} 
                x2={width - padding} 
                y1={yScale(val)} 
                y2={yScale(val)} 
                className="stroke-gray-200" 
                strokeDasharray="2,2" 
              />
            </g>
          ))}
          
          {/* X-Axis Labels */}
          {data.map((d, i) => (
            <text 
              key={d.month} 
              x={xScale(i)} 
              y={height - padding + 15} 
              textAnchor="middle" 
              className="text-[10px] fill-gray-500"
            >
              {new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
            </text>
          ))}

          {/* Chart Content */}
          {chartType === 'line' ? (
            <>
              <path 
                d={`M${data.map((d, i) => `${xScale(i)},${yScale(d.commission)}`).join(' L')}`} 
                fill="none" 
                stroke="#083A85" 
                strokeWidth="2.5" 
              />
              {data.map((d, i) => (
                <circle 
                  key={i} 
                  cx={xScale(i)} 
                  cy={yScale(d.commission)} 
                  r="4" 
                  fill="#083A85" 
                  className="cursor-pointer" 
                  onMouseOver={(e) => handleMouseOver(e, `${d.month}: $${d.commission.toLocaleString()}`)} 
                  onMouseOut={handleMouseOut} 
                />
              ))}
            </>
          ) : (
            data.map((d, i) => {
              const barWidth = (width - padding * 2) / data.length * 0.6;
              return (
                <rect 
                  key={i} 
                  x={xScale(i) - barWidth / 2} 
                  y={yScale(d.commission)} 
                  width={barWidth} 
                  height={height - padding - yScale(d.commission)} 
                  fill="#083A85" 
                  className="cursor-pointer" 
                  onMouseOver={(e) => handleMouseOver(e, `${d.month}: $${d.commission.toLocaleString()}`)} 
                  onMouseOut={handleMouseOut} 
                />
              );
            })
          )}
        </svg>
        {tooltip.visible && (
          <div 
            className="absolute bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none z-10" 
            style={{ 
              top: `${tooltip.y}px`, 
              left: `${tooltip.x}px`, 
              transform: 'translate(-50%, -100%)' 
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
};

const AgentPerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Data states
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [earnings, setEarnings] = useState<AgentEarnings | null>(null);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);

  // Fetch agent dashboard data
  const fetchDashboard = async () => {
    try {
      const response = await api.get('/properties/agent/dashboard');
      if (response.data && response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    }
  };

  // Fetch agent earnings
  const fetchEarnings = async () => {
    try {
      const response = await api.get('/properties/agent/earnings', {
        params: { timeRange }
      });
      if (response.data && response.data.success) {
        setEarnings(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
    }
  };

  // Fetch property performance
  const fetchPropertyPerformance = async () => {
    try {
      const response = await api.get('/properties/agent/properties/performance', {
        params: { timeRange }
      });
      if (response.data && response.data.success) {
        setPropertyPerformance(response.data.data.properties || []);
      }
    } catch (err: any) {
      console.error('Error fetching property performance:', err);
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchDashboard(),
        fetchEarnings(),
        fetchPropertyPerformance()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode === 'earnings') {
      fetchEarnings();
    } else if (viewMode === 'performance') {
      fetchPropertyPerformance();
    }
  }, [timeRange, viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <span className="ml-3 text-lg text-gray-600">Loading agent performance...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <i className="bi bi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Performance Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Performance Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your commission earnings and property management performance</p>
        </div>

        {/* View Mode Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(['overview', 'earnings', 'performance'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-[#083A85] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range Selector for specific views */}
        {(viewMode === 'earnings' || viewMode === 'performance') && (
          <div className="mb-6">
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-[#083A85] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overview Mode */}
        {viewMode === 'overview' && dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile & Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Agent Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-[#083A85] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <i className="bi bi-person-badge text-3xl text-white"></i>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Agent Dashboard</h2>
                  <p className="text-gray-600">Real Estate Agent</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Clients</span>
                    <span className="font-bold text-gray-900">{dashboard.totalClients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Clients</span>
                    <span className="font-bold text-gray-900">{dashboard.activeClients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Commission</span>
                    <span className="font-bold text-gray-900">${dashboard.avgCommissionPerBooking.toFixed(0)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-bold text-center mb-4">Total Commissions</h3>
                  <div className="flex justify-center">
                    <RadialProgress value={dashboard.totalCommissions} max={10000} />
                  </div>
                  <p className="text-center text-gray-600 mt-2">
                    ${dashboard.totalCommissions.toLocaleString()} earned
                  </p>
                </div>
              </div>
            </div>

            {/* KPIs & Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#083A85] to-blue-700 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium opacity-80">Total Commissions</h3>
                      <span className="text-3xl font-bold">${dashboard.totalCommissions.toLocaleString()}</span>
                    </div>
                    <i className="bi bi-currency-dollar text-2xl opacity-80"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium opacity-80">Pending Commissions</h3>
                      <span className="text-3xl font-bold">${dashboard.pendingCommissions.toLocaleString()}</span>
                    </div>
                    <i className="bi bi-clock text-2xl opacity-80"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium opacity-80">Active Clients</h3>
                      <span className="text-3xl font-bold">{dashboard.activeClients}</span>
                    </div>
                    <i className="bi bi-people text-2xl opacity-80"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium opacity-80">Recent Bookings</h3>
                      <span className="text-3xl font-bold">{dashboard.recentBookings.length}</span>
                    </div>
                    <i className="bi bi-calendar-check text-2xl opacity-80"></i>
                  </div>
                </div>
              </div>

              {/* Commission Trend Chart */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <PerformanceChart data={dashboard.monthlyCommissions} />
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Recent Bookings</h3>
                {dashboard.recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{booking.clientName}</div>
                          <div className="text-sm text-gray-600">{booking.bookingType}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">${booking.commission.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{booking.commissionStatus}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="bi bi-calendar-x text-4xl mb-2"></i>
                    <p>No recent bookings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Earnings Mode */}
        {viewMode === 'earnings' && earnings && (
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${earnings.totalEarnings.toLocaleString()}</p>
                  </div>
                  <i className="bi bi-currency-dollar text-2xl text-green-500"></i>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Period Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${earnings.periodEarnings.toLocaleString()}</p>
                  </div>
                  <i className="bi bi-graph-up text-2xl text-blue-500"></i>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{earnings.totalBookings}</p>
                  </div>
                  <i className="bi bi-calendar-check text-2xl text-purple-500"></i>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Period Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{earnings.periodBookings}</p>
                  </div>
                  <i className="bi bi-calendar text-2xl text-orange-500"></i>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Commission Breakdown</h3>
              <div className="space-y-4">
                {earnings.commissionBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.bookingType}</div>
                      <div className="text-sm text-gray-600">{item.bookingCount} bookings</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${item.totalCommission.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">
                        ${(item.totalCommission / Math.max(item.bookingCount, 1)).toFixed(0)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Mode */}
        {viewMode === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Property Performance</h3>
              {propertyPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Property</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Bookings</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Revenue</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Commission</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Occupancy</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {propertyPerformance.map((property) => (
                        <tr key={property.propertyId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{property.propertyName}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{property.bookings}</td>
                          <td className="px-4 py-3 text-gray-700">${property.revenue.toLocaleString()}</td>
                          <td className="px-4 py-3 text-green-600 font-medium">${property.agentCommission.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-700">{property.occupancyRate.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="text-gray-700">{property.averageRating.toFixed(1)}</span>
                              <i className="bi bi-star-fill text-yellow-400 ml-1 text-sm"></i>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="bi bi-house text-4xl mb-2"></i>
                  <p>No property performance data available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPerformanceDashboard;