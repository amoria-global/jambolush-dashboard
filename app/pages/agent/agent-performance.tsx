import React, { useEffect, useState } from 'react';

// --- INTERFACES & MOCK DATA ---
interface KPI { title: string; value: string; change: string; isPositive: boolean; icon: React.ReactNode; }
interface BreakdownItem { name: string; weight: string; score: number; }
interface Goal { goal: string; target: number; current: number; unit?: string; }
interface MockData {
  profile: {
    name: string;
    location: string;
    status: string;
    tier: string;
    leads: number;
    listings: number;
    finalScore: number;
    scoreChange: string;
    performanceHistory: { month: string; score: number }[];
  };
  kpis: KPI[];
  categoryBreakdown: BreakdownItem[];
  goalTracking: Goal[];
}

const mockData: MockData = {
  profile: {
    name: 'Mubeni pacific',
    location: 'Kigali • East Africa',
    status: 'Active',
    tier: 'Gold',
    leads: 42,
    listings: 28,
    finalScore: 84.9,
    scoreChange: '+4.2 vs last month',
    performanceHistory: [
        { month: 'Mar', score: 78.5 },
        { month: 'Apr', score: 80.1 },
        { month: 'May', score: 82.3 },
        { month: 'Jun', score: 81.9 },
        { month: 'Jul', score: 84.2 },
        { month: 'Aug', score: 84.9 },
    ],
  },
  kpis: [
    { title: 'Engagement Rate', value: '78%', change: '+6%', isPositive: true, icon: <i className="bi bi-hand-thumbs-up-fill"></i> },
    { title: 'Client Rating', value: '4.7', change: '+0.1', isPositive: true, icon: <i className="bi bi-star-fill"></i> },
    { title: 'Monthly Income', value: '$2,750', change: '+12%', isPositive: true, icon: <i className="bi bi-currency-dollar"></i> },
    { title: 'Drop Rate', value: '3.2%', change: '-0.6%', isPositive: false, icon: <i className="bi bi-graph-down-arrow"></i> },
  ],
  categoryBreakdown: [
    { name: 'Quality', weight: '30%', score: 70 },
    { name: 'Productivity', weight: '25%', score: 85 },
    { name: 'Reliability', weight: '20%', score: 78 },
    { name: 'Financial Impact', weight: '15%', score: 91 },
    { name: 'Compliance', weight: '10%', score: 100 },
  ],
  goalTracking: [
    { goal: 'Engagement Rate', target: 75, current: 78, unit: '%' },
    { goal: 'Monthly Income', target: 3000, current: 2750, unit: '$' },
    { goal: 'Client Rating', target: 4.8, current: 4.7 },
    { goal: 'Listings This Month', target: 30, current: 28 },
  ],
};

// --- REUSABLE & MODERNIZED COMPONENTS ---

const RadialProgress = ({ value }: { value: number }) => {
  // This component animates the radial progress bar on load.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => setProgress(value), 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const sqSize = 120;
  const strokeWidth = 10;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * progress) / 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: sqSize, height: sqSize }}>
      <svg width={sqSize} height={sqSize} viewBox={viewBox}>
        <circle className="stroke-current text-gray-200" cx={sqSize / 2} cy={sqSize / 2} r={radius} strokeWidth={`${strokeWidth}px`} fill="none" />
        <circle
          className="stroke-current text-[#083A85]"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
          style={{ strokeDasharray: dashArray, strokeDashoffset: dashOffset, transition: 'stroke-dashoffset 1s ease-out' }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute text-3xl font-bold text-gray-800">{value}</div>
    </div>
  );
};

const AnimatedProgressBar = ({ value, max }: { value: number; max: number }) => {
    // This component animates the linear progress bar for goals.
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const timeout = setTimeout(() => {
            const progress = Math.min(100, (value / max) * 100);
            setWidth(progress);
        }, 100);
        return () => clearTimeout(timeout);
    }, [value, max]);

    return (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full bg-[#F20C8F] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${width}%` }}
            />
        </div>
    );
};

const PerformanceChart = ({ data }: { data: { month: string; score: number }[] }) => {
    // This component handles the switchable line/bar chart and its interactivity.
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string }>({ visible: false, x: 0, y: 0, content: '' });

    if (!data || data.length < 2) return null;

    const width = 500;
    const height = 200;
    const padding = 40;
    const yMax = 100;
    const yMin = Math.min(...data.map(d => d.score)) - 10;

    const xScale = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);
    const yScale = (score: number) => height - padding - ((score - yMin) / (yMax - yMin)) * (height - padding * 2);

    const handleMouseOver = (e: React.MouseEvent, content: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, x: rect.left + window.scrollX, y: rect.top + window.scrollY - 40, content });
    };

    const handleMouseOut = () => setTooltip({ ...tooltip, visible: false });

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Monthly Score Trend</h3>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button onClick={() => setChartType('line')} className={`px-3 py-1 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${chartType === 'line' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'}`}>Line</button>
                    <button onClick={() => setChartType('bar')} className={`px-3 py-1 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${chartType === 'bar' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'}`}>Bar</button>
                </div>
            </div>
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    {/* Y-Axis Labels */}
                    {[yMin, (yMin + yMax) / 2, yMax].map(val => (
                        <g key={val}>
                            <text x={padding - 10} y={yScale(val)} dy="0.3em" textAnchor="end" className="text-[10px] fill-gray-500">{Math.round(val)}</text>
                            <line x1={padding} x2={width - padding} y1={yScale(val)} y2={yScale(val)} className="stroke-gray-200" strokeDasharray="2,2" />
                        </g>
                    ))}
                    {/* X-Axis Labels */}
                    {data.map((d, i) => (
                        <text key={d.month} x={xScale(i)} y={height - padding + 15} textAnchor="middle" className="text-[10px] fill-gray-500">{d.month}</text>
                    ))}

                    {/* Chart Content */}
                    {chartType === 'line' ? (
                        <>
                            <path d={`M${data.map((d, i) => `${xScale(i)},${yScale(d.score)}`).join(' L')}`} fill="none" stroke="#083A85" strokeWidth="2.5" />
                            {data.map((d, i) => (
                                <circle key={i} cx={xScale(i)} cy={yScale(d.score)} r="4" fill="#083A85" className="cursor-pointer" onMouseOver={(e) => handleMouseOver(e, `${d.month}: ${d.score}`)} onMouseOut={handleMouseOut} />
                            ))}
                        </>
                    ) : (
                        data.map((d, i) => {
                            const barWidth = (width - padding * 2) / data.length * 0.6;
                            return (
                                <rect key={i} x={xScale(i) - barWidth / 2} y={yScale(d.score)} width={barWidth} height={height - padding - yScale(d.score)} fill="#083A85" className="cursor-pointer" onMouseOver={(e) => handleMouseOver(e, `${d.month}: ${d.score}`)} onMouseOut={handleMouseOut} />
                            )
                        })
                    )}
                </svg>
                {tooltip.visible && (
                    <div className="absolute bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none" style={{ top: `${tooltip.y}px`, left: `${tooltip.x}px`, transform: 'translate(-50%, -100%)' }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
export default function AgentPerformance() {
  const { profile, kpis, categoryBreakdown, goalTracking } = mockData;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- LEFT COLUMN (Profile & Goals) --- */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <img src="https://i.pinimg.com/736x/95/fa/19/95fa19e6202e2293e07a1a17b3fd9048.jpg" alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-base text-gray-500">{profile.location}</p>
                <div className="flex items-center text-green-600 text-base font-semibold mt-1">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                  {profile.status}
                </div>
              </div>
            </div>
            <div className="text-base space-y-1 mb-4">
                <p><strong>Tier:</strong> {profile.tier}</p>
                <p><strong>Leads this month:</strong> {profile.leads}</p>
                <p><strong>Listings live:</strong> {profile.listings}</p>
            </div>
            <h3 className="text-lg font-bold text-center">Final Score</h3>
            <div className="flex flex-col items-center justify-center mt-2">
              <RadialProgress value={profile.finalScore} />
              <span className="text-base text-green-500 font-semibold mt-2">{profile.scoreChange}</span>
            </div>
          </div>

          {/* Goal Tracking */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Goal Tracking</h3>
            {goalTracking.map((goal, idx) => {
              const isCompleted = goal.current >= goal.target;
              return (
              <div key={idx} className="mb-4">
                <div className="flex justify-between items-center text-base mb-1">
                  <span className="font-medium text-gray-700">{goal.goal}</span>
                  <div className="flex items-center">
                    <span className="font-bold text-gray-800">{goal.unit === '$' && goal.unit}{goal.current.toLocaleString()}{goal.unit !== '$' && goal.unit} / {goal.target.toLocaleString()}</span>
                    {isCompleted && <i className="bi bi-check-circle-fill text-green-500 ml-2"></i>}
                  </div>
                </div>
                <AnimatedProgressBar value={goal.current} max={goal.target} />
              </div>
            )})}
          </div>
        </div>

        {/* --- RIGHT COLUMN (KPIs & Charts) --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kpis.map((kpi) => (
              <div key={kpi.title} className={`rounded-2xl shadow-lg p-5 flex flex-col justify-between hover:shadow-2xl transition duration-300 text-white ${kpi.isPositive ? 'bg-[#083A85]' : 'bg-red-500'}`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-medium w-3/4">{kpi.title}</h3>
                  <span className="text-2xl opacity-80">{kpi.icon}</span>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{kpi.value}</span>
                  <p className="text-base font-semibold mt-1">{kpi.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* New Performance Chart Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
             <PerformanceChart data={profile.performanceHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
