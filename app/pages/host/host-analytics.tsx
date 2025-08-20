import React, { useState } from 'react';

// Mock data for the dashboard
const hostData = {
  totalHosts: 1250,
  activeHosts: 980,
  newHostsThisMonth: 120,
  hostByServiceType: [
    { name: 'Server', count: 600 },
    { name: 'Database', count: 350 },
    { name: 'Storage', count: 300 },
  ],
  monthlyBookings: [
    { month: 'Jan', count: 120 },
    { month: 'Feb', count: 150 },
    { month: 'Mar', count: 180 },
    { month: 'Apr', count: 200 },
    { month: 'May', count: 230 },
    { month: 'Jun', count: 250 },
  ],
  totalBookings: 2500,
  totalRevenue: 350000,
  occupancyRate: 85,
  cancellationsThisMonth: 15,
  bookingSources: [
    { name: 'Field Agent', count: 700, color: '#F20C8F' },
    { name: 'Direct', count: 1000, color: '#083A85' },
  ],
  averageRating: 4.8,
  totalReviews: 542,
};

const recentBookings = [
  { id: 101, guest: 'Moises Caicedo', property: 'Mountain View Cabin', checkIn: '2025-08-15', revenue: 750 },
  { id: 102, guest: 'Enzo Fernandez', property: 'Downtown Loft', checkIn: '2025-08-18', revenue: 450 },
  { id: 103, guest: 'Willian Estevao', property: 'Mountain View Cabin', checkIn: '2025-08-20', revenue: 900 },
];

const recentReviews = [
  { id: 1, guest: 'Sarah Connor', rating: 5, comment: 'Amazing stay! Everything was perfect.', date: '2025-08-05' },
  { id: 2, guest: 'Kyle Reese', rating: 4, comment: 'Great location, but the Wi-Fi was a bit slow.', date: '2025-08-01' },
  { id: 3, guest: 'Muben Pablo', rating: 5, comment: 'Hasta la vista, baby! Excellent experience.', date: '2025-07-28' },
];

// Icons
const TrendUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CancelIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: string;
  icon?: React.ReactNode;
  gradient?: string;
}

// Modern KPI card with gradient accent
const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, gradient = "from-blue-500 to-blue-600" }) => (
  <div className="relative p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white flex-1 min-w-[200px] group overflow-hidden">
    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
        {trend && (
          <div className="flex items-center mt-2 text-green-500">
            <TrendUpIcon />
            <span className="ml-1 text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
      {icon && (
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} text-white opacity-90`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

// Modern Line Chart with animations
const LineChart: React.FC<{ data: { month: string; count: number }[] }> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const width = 500;
  const height = 250;
  const padding = 40;
  const maxCount = Math.max(...data.map(d => d.count));

  const xScale = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - (value / maxCount) * (height - 2 * padding);

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.count)}`).join(' ');
  
  // Create area path
  const areaPath = `M ${xScale(0)},${height - padding} ` +
    data.map((d, i) => `L ${xScale(i)},${yScale(d.count)}`).join(' ') +
    ` L ${xScale(data.length - 1)},${height - padding} Z`;

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#083A85', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#083A85', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + i * (height - 2 * padding) / 4}
            x2={width - padding}
            y2={padding + i * (height - 2 * padding) / 4}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}
        
        {/* Area under line */}
        <path d={areaPath} fill="url(#areaGradient)" />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#083A85"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points and tooltips */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(d.count)}
              r={hoveredPoint === i ? 6 : 4}
              fill="#F20C8F"
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {hoveredPoint === i && (
              <g>
                <rect
                  x={xScale(i) - 30}
                  y={yScale(d.count) - 35}
                  width="60"
                  height="25"
                  rx="4"
                  fill="#1F2937"
                  fillOpacity="0.9"
                />
                <text
                  x={xScale(i)}
                  y={yScale(d.count) - 18}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  {d.count}
                </text>
              </g>
            )}
          </g>
        ))}
        
        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600 font-medium"
          >
            {d.month}
          </text>
        ))}
        
        {/* Y-axis labels */}
        {[0, maxCount / 4, maxCount / 2, (3 * maxCount) / 4, maxCount].map((val, idx) => (
          <text
            key={idx}
            x={padding - 10}
            y={yScale(val) + 4}
            textAnchor="end"
            className="text-xs fill-gray-600"
          >
            {Math.round(val)}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Modern Bar Chart
const BarChart: React.FC<{ data: { month: string; count: number }[] }> = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const width = 500;
  const height = 250;
  const padding = 40;
  const maxCount = Math.max(...data.map(d => d.count));
  const barWidth = (width - 2 * padding) / data.length - 10;

  const xScale = (index: number) => padding + index * ((width - 2 * padding) / data.length) + 5;
  const yScale = (value: number) => height - padding - (value / maxCount) * (height - 2 * padding);

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full h-auto">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#083A85' }} />
            <stop offset="100%" style={{ stopColor: '#0051BB' }} />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + i * (height - 2 * padding) / 4}
            x2={width - padding}
            y2={padding + i * (height - 2 * padding) / 4}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}
        
        {/* Bars */}
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={xScale(i)}
              y={yScale(d.count)}
              width={barWidth}
              height={height - padding - yScale(d.count)}
              fill={hoveredBar === i ? "#F20C8F" : "url(#barGradient)"}
              rx="4"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            />
            {hoveredBar === i && (
              <g>
                <rect
                  x={xScale(i) + barWidth / 2 - 30}
                  y={yScale(d.count) - 35}
                  width="60"
                  height="25"
                  rx="4"
                  fill="#1F2937"
                  fillOpacity="0.9"
                />
                <text
                  x={xScale(i) + barWidth / 2}
                  y={yScale(d.count) - 18}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  {d.count}
                </text>
              </g>
            )}
            <text
              x={xScale(i) + barWidth / 2}
              y={height - padding + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600 font-medium"
            >
              {d.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// Modern Pie Chart
const PieChart: React.FC<{ data: { name: string; count: number; color: string }[] }> = ({ data }) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = 80;
  const cx = 120;
  const cy = 120;
  let startAngle = -90;

  const createPath = (item: any, index: number) => {
    const percentage = (item.count / total) * 100;
    const sliceAngle = (item.count / total) * 360;
    const endAngle = startAngle + sliceAngle;
    const isHovered = hoveredSlice === index;
    const hoverOffset = isHovered ? 5 : 0;
    
    const x1 = cx + (radius + hoverOffset) * Math.cos(startAngle * Math.PI / 180);
    const y1 = cy + (radius + hoverOffset) * Math.sin(startAngle * Math.PI / 180);
    const x2 = cx + (radius + hoverOffset) * Math.cos(endAngle * Math.PI / 180);
    const y2 = cy + (radius + hoverOffset) * Math.sin(endAngle * Math.PI / 180);
    
    const largeArc = sliceAngle > 180 ? 1 : 0;
    
    // Calculate center position for hover offset
    const midAngle = (startAngle + endAngle) / 2;
    const offsetX = isHovered ? 5 * Math.cos(midAngle * Math.PI / 180) : 0;
    const offsetY = isHovered ? 5 * Math.sin(midAngle * Math.PI / 180) : 0;
    
    const path = `
      M ${cx + offsetX} ${cy + offsetY}
      L ${x1 + offsetX} ${y1 + offsetY}
      A ${radius + hoverOffset} ${radius + hoverOffset} 0 ${largeArc} 1 ${x2 + offsetX} ${y2 + offsetY}
      Z
    `;
    
    const result = { path, percentage, midAngle };
    startAngle = endAngle;
    return result;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={240} height={240} className="mx-auto">
          {data.map((item, idx) => {
            const { path, percentage, midAngle } = createPath(item, idx);
            return (
              <g key={idx}>
                <path
                  d={path}
                  fill={item.color}
                  fillOpacity={hoveredSlice === idx ? 1 : 0.9}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ filter: hoveredSlice === idx ? 'brightness(1.1)' : 'none' }}
                  onMouseEnter={() => setHoveredSlice(idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
                {hoveredSlice === idx && (
                  <text
                    x={cx + 50 * Math.cos(midAngle * Math.PI / 180)}
                    y={cy + 50 * Math.sin(midAngle * Math.PI / 180)}
                    textAnchor="middle"
                    className="text-sm font-bold fill-white pointer-events-none"
                  >
                    {percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-col mt-4 space-y-2">
        {data.map((item, idx) => {
          const percentage = ((item.count / total) * 100).toFixed(1);
          return (
            <div
              key={idx}
              className={`flex items-center justify-between gap-4 p-2 rounded-lg transition-all duration-200 ${
                hoveredSlice === idx ? 'bg-gray-50' : ''
              }`}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{item.count}</span>
                <span className="text-sm font-bold text-gray-800">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Modern Donut Chart
const DonutChart: React.FC<{ data: { name: string; count: number; color: string }[] }> = ({ data }) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const outerRadius = 80;
  const innerRadius = 50;
  const cx = 120;
  const cy = 120;
  let startAngle = -90;

  const createPath = (item: any, index: number) => {
    const percentage = (item.count / total) * 100;
    const sliceAngle = (item.count / total) * 360;
    const endAngle = startAngle + sliceAngle;
    const isHovered = hoveredSlice === index;
    const hoverOffset = isHovered ? 5 : 0;
    
    // Calculate center position for hover offset
    const midAngle = (startAngle + endAngle) / 2;
    const offsetX = isHovered ? 5 * Math.cos(midAngle * Math.PI / 180) : 0;
    const offsetY = isHovered ? 5 * Math.sin(midAngle * Math.PI / 180) : 0;
    
    const x1Outer = cx + (outerRadius + hoverOffset) * Math.cos(startAngle * Math.PI / 180) + offsetX;
    const y1Outer = cy + (outerRadius + hoverOffset) * Math.sin(startAngle * Math.PI / 180) + offsetY;
    const x2Outer = cx + (outerRadius + hoverOffset) * Math.cos(endAngle * Math.PI / 180) + offsetX;
    const y2Outer = cy + (outerRadius + hoverOffset) * Math.sin(endAngle * Math.PI / 180) + offsetY;
    
    const x1Inner = cx + innerRadius * Math.cos(endAngle * Math.PI / 180) + offsetX;
    const y1Inner = cy + innerRadius * Math.sin(endAngle * Math.PI / 180) + offsetY;
    const x2Inner = cx + innerRadius * Math.cos(startAngle * Math.PI / 180) + offsetX;
    const y2Inner = cy + innerRadius * Math.sin(startAngle * Math.PI / 180) + offsetY;
    
    const largeArc = sliceAngle > 180 ? 1 : 0;
    
    const path = `
      M ${x1Outer} ${y1Outer}
      A ${outerRadius + hoverOffset} ${outerRadius + hoverOffset} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
      L ${x1Inner} ${y1Inner}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
      Z
    `;
    
    const result = { path, percentage };
    startAngle = endAngle;
    return result;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={240} height={240} className="mx-auto">
          {data.map((item, idx) => {
            const { path, percentage } = createPath(item, idx);
            return (
              <g key={idx}>
                <path
                  d={path}
                  fill={item.color}
                  fillOpacity={hoveredSlice === idx ? 1 : 0.9}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ filter: hoveredSlice === idx ? 'brightness(1.1)' : 'none' }}
                  onMouseEnter={() => setHoveredSlice(idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              </g>
            );
          })}
          {/* Center text */}
          <text x={cx} y={cy - 5} textAnchor="middle" className="text-2xl font-bold fill-gray-800">
            {total}
          </text>
          <text x={cx} y={cy + 15} textAnchor="middle" className="text-sm fill-gray-500">
            Total
          </text>
        </svg>
      </div>
      <div className="flex flex-col mt-4 space-y-2">
        {data.map((item, idx) => {
          const percentage = ((item.count / total) * 100).toFixed(1);
          return (
            <div
              key={idx}
              className={`flex items-center justify-between gap-4 p-2 rounded-lg transition-all duration-200 ${
                hoveredSlice === idx ? 'bg-gray-50' : ''
              }`}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{item.count}</span>
                <span className="text-sm font-bold text-gray-800">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [chartView, setChartView] = useState<'line' | 'bar'>('line');
  const [pieView, setPieView] = useState<'donut' | 'pie'>('donut');

  return (
    <div className="bg-gray-50 min-h-screen pt-20 p-4 sm:p-15 font-sans">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 mt-4 leading-tight">
          Host Analytics Dashboard
        </h1>

        {/* KPI Cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <StatCard 
            title="Total Bookings" 
            value={hostData.totalBookings.toLocaleString()} 
            trend="+12%" 
            icon={<CalendarIcon />}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard 
            title="Total Revenue" 
            value={`$${hostData.totalRevenue.toLocaleString()}`} 
            trend="+18%" 
            icon={<DollarIcon />}
            gradient="from-green-500 to-green-600"
          />
          <StatCard 
            title="Occupancy Rate" 
            value={`${hostData.occupancyRate}%`} 
            trend="+5%" 
            icon={<ChartIcon />}
            gradient="from-purple-500 to-purple-600"
          />
          <StatCard 
            title="Cancellations" 
            value={hostData.cancellationsThisMonth} 
            icon={<CancelIcon />}
            gradient="from-red-500 to-red-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Bookings Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Monthly Bookings</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartView('line')}
                  className={`px-3 py-1 rounded-lg text-sm cursor-pointer font-medium transition-all ${
                    chartView === 'line'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartView('bar')}
                  className={`px-3 py-1 rounded-lg text-sm cursor-pointer font-medium transition-all ${
                    chartView === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {chartView === 'line' ? (
                <LineChart data={hostData.monthlyBookings} />
              ) : (
                <BarChart data={hostData.monthlyBookings} />
              )}
            </div>
          </div>

          {/* Booking Sources Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Booking Sources</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPieView('donut')}
                  className={`px-3 py-1 rounded-lg text-sm cursor-pointer font-medium transition-all ${
                    pieView === 'donut'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Donut
                </button>
                <button
                  onClick={() => setPieView('pie')}
                  className={`px-3 py-1 rounded-lg text-sm cursor-pointer font-medium transition-all ${
                    pieView === 'pie'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pie
                </button>
              </div>
            </div>
            {pieView === 'donut' ? (
              <DonutChart data={hostData.bookingSources} />
            ) : (
              <PieChart data={hostData.bookingSources} />
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Reviews & Ratings</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-gray-800">{hostData.averageRating}</span>
              <div>
                <div className="flex text-yellow-400">
                  <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                </div>
                <p className="text-sm text-gray-500 mt-1">{hostData.totalReviews} reviews</p>
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = rating === 5 ? 420 : rating === 4 ? 98 : rating === 3 ? 24 : 0;
                  const percentage = (count / hostData.totalReviews) * 100;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-4">{rating}</span>
                      <StarIcon />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {b.guest.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{b.guest}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.property}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.checkIn}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">${b.revenue.toLocaleString()}</td>
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

export default App;