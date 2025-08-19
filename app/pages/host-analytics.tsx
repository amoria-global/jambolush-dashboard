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
    { name: 'Field Agent', count: 700, color: '#F20C8F' }, // secondary gray
    { name: 'Direct', count: 1000, color: '#083A85' },     // primary blue
  ],
  averageRating: 4.8,
  totalReviews: 542,
};

const recentBookings = [
  { id: 101, guest: 'Moise Caicedo', property: 'Mountain View Cabin', checkIn: '2025-08-15', revenue: 750 },
  { id: 102, guest: 'Enzo Fernandez', property: 'Downtown Loft', checkIn: '2025-08-18', revenue: 450 },
  { id: 103, guest: 'William Estavao', property: 'Mountain View Cabin', checkIn: '2025-08-20', revenue: 900 },
];

const recentReviews = [
  { id: 1, guest: 'Sarah Connor', rating: 5, comment: 'Amazing stay! Everything was perfect.', date: '2025-08-05' },
  { id: 2, guest: 'Kyle Reese', rating: 4, comment: 'Great location, but the Wi-Fi was a bit slow.', date: '2025-08-01' },
  { id: 3, guest: 'Muben Pablo', rating: 5, comment: 'Hasta la vista, baby! Excellent experience.', date: '2025-07-28' },
];

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: string;
}

// White KPI card with smaller fonts
const StatCard: React.FC<StatCardProps> = ({ title, value, trend }) => (
  <div className="p-4 rounded-xl shadow hover:shadow-lg transition duration-300 text-gray-800 flex-1 min-w-[160px] bg-white">
    <h3 className="text-base uppercase tracking-wide opacity-80">{title}</h3>
    <p className="text-2xl font-medium mt-1">{value}</p>
    {trend && <p className="text-base mt-1 opacity-90">{trend}</p>}
  </div>
);

// Line Chart
const LineChart: React.FC<{ data: { month: string; count: number }[] }> = ({ data }) => {
  const width = 400;
  const height = 180;
  const padding = 30;
  const maxCount = Math.max(...data.map(d => d.count));

  const xScale = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - (value / maxCount) * (height - 2 * padding);

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.count)}`).join(' ');

  return (
    <svg width={width} height={height}>
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#CBD5E0" strokeWidth="2" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#CBD5E0" strokeWidth="2" />
      <polyline points={points} fill="none" stroke="#003087" strokeWidth="2" />
      {data.map((d, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(d.count)} r={4} fill="#F20C8F">
          <title>{`${d.month}: ${d.count} Bookings`}</title>
        </circle>
      ))}
      {data.map((d, i) => (
        <text key={i} x={xScale(i)} y={height - padding + 12} textAnchor="middle" className="text-[10px] fill-gray-500">{d.month}</text>
      ))}
      {[0, maxCount / 2, maxCount].map((val, idx) => (
        <text key={idx} x={padding - 8} y={yScale(val)} textAnchor="end" className="text-[10px] fill-gray-500">{Math.round(val)}</text>
      ))}
    </svg>
  );
};

// Pie Chart with percentages
const PieChart: React.FC<{ data: { name: string; count: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = 70;
  const cx = 100;
  const cy = 100;
  let startAngle = 0;

  const slices = data.map((item, i) => {
    const sliceAngle = (item.count / total) * 360;
    const endAngle = startAngle + sliceAngle;
    const x1 = cx + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = cy + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = cx + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = cy + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    const largeArc = sliceAngle > 180 ? 1 : 0;
    startAngle = endAngle;

    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={item.color}
      >
        <title>{`${item.name}: ${((item.count / total) * 100).toFixed(1)}%`}</title>
      </path>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={180} height={180} className="mx-auto">{slices}</svg>
      <div className="flex flex-col mt-3 space-y-1">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-base">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
            <span>{item.name} ({((item.count / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const App: React.FC = () => (
  <div className="bg-gray-200 min-h-screen pt-20 p-4 sm:p-15 font-sans">
    <div className="container mx-auto max-w-6xl">
  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 mt-4 leading-tight">
    Host Analytics Dashboard
  </h1>

  {/* KPI Cards */}
  <div className="flex flex-wrap gap-4 mb-6">
    <StatCard title="Total Bookings" value={hostData.totalBookings.toLocaleString()} />
    <StatCard title="Total Revenue" value={`$${hostData.totalRevenue.toLocaleString()}`} />
    <StatCard title="Occupancy Rate" value={`${hostData.occupancyRate}%`} />
    <StatCard title="Cancellations (This Month)" value={hostData.cancellationsThisMonth} />
  
</div>


      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Monthly Bookings</h2>
          <LineChart data={hostData.monthlyBookings} />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Booking Sources</h2>
          <PieChart data={hostData.bookingSources} />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Reviews & Ratings</h2>
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-800">{hostData.averageRating}</span>
            <div className="flex text-yellow-400">
              <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
            </div>
          </div>
          <div className="text-gray-500 text-base">
            <p>Overall rating from {hostData.totalReviews} reviews</p>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.map(b => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-gray-900">{b.guest}</td>
                  <td className="px-4 py-2 text-gray-500">{b.property}</td>
                  <td className="px-4 py-2 text-gray-500">{b.checkIn}</td>
                  <td className="px-4 py-2 text-gray-500">${b.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

export default App;
