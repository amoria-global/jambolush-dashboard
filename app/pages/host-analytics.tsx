import React from 'react';

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
  // Updated monthly data for bookings
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
  // Updated booking sources with new colors
  bookingSources: [
    { name: 'Field Agent', count: 700, color: '#F20C8F' },
    { name: 'Direct', count: 1000, color: '#083A85' },
    { name: 'Referral', count: 800, color: '#1A9F5C' },
  ],
  properties: [
    { id: 'prop-1', name: 'Mountain View Cabin' },
    { id: 'prop-2', name: 'Downtown Loft' },
  ],
  // New data for reviews
  averageRating: 4.8,
  totalReviews: 542,
};

const recentBookings = [
  { id: 101, guest: 'Moise caicedo', property: 'Mountain View Cabin', checkIn: '2025-08-15', revenue: 750 },
  { id: 102, guest: 'Enzo fernandez', property: 'Downtown Loft', checkIn: '2025-08-18', revenue: 450 },
  { id: 103, guest: 'William Estavao', property: 'Mountain View Cabin', checkIn: '2025-08-20', revenue: 900 },
];

// New mock data for recent reviews
const recentReviews = [
  { id: 1, guest: 'Sarah Connor', rating: 5, comment: 'Amazing stay! Everything was perfect.', date: '2025-08-05' },
  { id: 2, guest: 'Kyle Reese', rating: 4, comment: 'Great location, but the Wi-Fi was a bit slow.', date: '2025-08-01' },
  { id: 3, guest: 'Muben pablo', rating: 5, comment: 'Hasta la vista, baby! Excellent experience.', date: '2025-07-28' },
];

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: string;
  color?: string;
}

// Reusable component for displaying a key metric
const StatCard: React.FC<StatCardProps> = ({ title, value, trend, color = 'bg-blue-500' }) => (
  <div className={`p-6 rounded-xl shadow-lg text-white flex-1 min-w-[200px] ${color}`}>
    <h3 className="text-sm uppercase tracking-wide opacity-80">{title}</h3>
    <p className="text-4xl font-bold mt-2">{value}</p>
    {trend && <p className="text-sm mt-1 opacity-90">{trend}</p>}
  </div>
);

interface LineChartProps {
  data: { month: string; count: number }[];
}

// Custom SVG Line Chart component
const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const chartWidth = 600;
  const chartHeight = 250;
  const padding = 40;
  const innerWidth = chartWidth - 2 * padding;
  const innerHeight = chartHeight - 2 * padding;

  const maxCount = Math.max(...data.map(d => d.count));
  const xScale = (index: number) => padding + (index / (data.length - 1)) * innerWidth;
  const yScale = (value: number) => padding + innerHeight - (value / maxCount) * innerHeight;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.count)}`).join(' ');

  return (
    <div className="flex justify-center w-full">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="bg-gray-50 rounded-xl shadow-inner">
        {/* X-axis */}
        <line x1={padding} y1={padding + innerHeight} x2={padding + innerWidth} y2={padding + innerHeight} stroke="#e2e8f0" strokeWidth="2" />
        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={padding + innerHeight} stroke="#e2e8f0" strokeWidth="2" />

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={d.month} x={xScale(i)} y={padding + innerHeight + 20} textAnchor="middle" className="text-xs fill-gray-500">{d.month}</text>
        ))}

        {/* Y-axis labels */}
        {[0, maxCount / 2, maxCount].map(value => (
          <text key={value} x={padding - 10} y={yScale(value) + 5} textAnchor="end" className="text-xs fill-gray-500">{value}</text>
        ))}

        {/* Line path */}
        <polyline points={points} fill="none" stroke="#083A85" strokeWidth="3" />

        {/* Data points with tooltips */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(d.count)} r="5" fill="#F20C8F" />
            <title>{`${d.month}: ${d.count} Bookings`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

interface PieChartProps {
  data: { name: string; count: number; color: string }[];
}

// Custom SVG Pie Chart component
const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((sum, { count }) => sum + count, 0);
  let startAngle = 0;
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const strokeWidth = 30;

  const pieSlices = data.map((item, index) => {
    const sliceAngle = (item.count / total) * 360;
    const endAngle = startAngle + sliceAngle;

    const startRadians = (startAngle - 90) * Math.PI / 180;
    const endRadians = (endAngle - 90) * Math.PI / 180;

    const startX = cx + radius * Math.cos(startRadians);
    const startY = cy + radius * Math.sin(startRadians);
    const endX = cx + radius * Math.cos(endRadians);
    const endY = cy + radius * Math.sin(endRadians);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const d = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    ].join(' ');

    startAngle = endAngle;

    return (
      <path
        key={index}
        d={d}
        fill="none"
        stroke={item.color}
        strokeWidth={strokeWidth}
        className="transition-all duration-300 ease-in-out"
      >
        <title>{`${item.name}: ${item.count} (${(item.count / total * 100).toFixed(1)}%)`}</title>
      </path>
    );
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg width={200} height={200} viewBox="0 0 200 200">
        {pieSlices}
        <circle cx={100} cy={100} r={radius - strokeWidth / 2} fill="white" />
      </svg>
      <div className="flex flex-col items-start mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></span>
            <span className="text-sm text-gray-700">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const App: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Host Analytics Dashboard</h1>
        
        {/* New Booking and Financial KPI Cards Section */}
        <div className="flex flex-wrap gap-4 mb-8">
          <StatCard 
            title="Total Bookings" 
            value={hostData.totalBookings.toLocaleString()} 
            color="bg-[#1A9F5C]"
          />
          <StatCard 
            title="Total Revenue" 
            value={`$${hostData.totalRevenue.toLocaleString()}`} 
            color="bg-[#083A85]"
          />
          <StatCard 
            title="Occupancy Rate" 
            value={`${hostData.occupancyRate}%`} 
            color="bg-[#F20C8F]"
          />
          <StatCard 
            title="Cancellations (This Month)" 
            value={hostData.cancellationsThisMonth} 
            color="bg-[#EF4444]"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Bookings</h2>
            <LineChart data={hostData.monthlyBookings} />
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Sources</h2>
            <div className="flex justify-center items-center h-full">
              <PieChart data={hostData.bookingSources} />
            </div>
          </div>
        </div>

        {/* Reviews and Ratings Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews & Ratings</h2>
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-5xl font-bold text-gray-800">{hostData.averageRating}</span>
              <div className="flex text-yellow-400">
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
              </div>
            </div>
            <div className="text-gray-500">
              <p>Overall rating from {hostData.totalReviews} reviews</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Reviews</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReviews.map(review => (
                  <tr key={review.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{review.guest}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.comment}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tables Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.guest}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.property}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.checkIn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${booking.revenue.toLocaleString()}</td>
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
