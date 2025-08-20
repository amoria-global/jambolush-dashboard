import React, { useEffect, useState } from 'react';

interface KPI { title: string; value: string; change: string; isPositive: boolean; }
interface BreakdownItem { name: string; weight: string; score: number; }
interface Agent { agent: string; score: number; tier: string; income: string; }
interface Goal { goal: string; target: number; current: number; }

interface MockData {
  profile: { name: string; location: string; status: string; tier: string; leads: number; listings: number; finalScore: number; scoreChange: string; };
  kpis: KPI[];
  categoryBreakdown: BreakdownItem[];
  topAgents: Agent[];
  goalTracking: Goal[];
}

const mockData: MockData = {
  profile: { name: 'Mubeni pacific', location: 'Kigali • East Africa', status: 'Active', tier: 'Gold', leads: 42, listings: 28, finalScore: 84.9, scoreChange: '+4.2 vs last month' },
  kpis: [
    { title: 'Engagement Rate', value: '78', change: '+6%', isPositive: true },
    { title: 'Owner/Client Rating', value: '4.7', change: '+0.1', isPositive: true },
    { title: 'Monthly Income', value: '2750', change: '+12%', isPositive: true },
    { title: 'Drop Rate', value: '3.2', change: '-0.6%', isPositive: false },
  ],
  categoryBreakdown: [
    { name: 'Quality', weight: '30%', score: 70 },
    { name: 'Productivity', weight: '25%', score: 85 },
    { name: 'Reliability', weight: '20%', score: 78 },
    { name: 'Financial Impact', weight: '15%', score: 70 },
    { name: 'Compliance', weight: '10%', score: 100 },
  ],
  topAgents: [
    { agent: 'Moses Grant', score: 92.1, tier: 'Platinum', income: '$3,820' },
    { agent: 'Muben pacific', score: 84.9, tier: 'Gold', income: '$2,750' },
    { agent: 'Mugwiza Jackson', score: 80.3, tier: 'Gold', income: '$2,410' },
    { agent: 'Joseph Butman', score: 78.6, tier: 'Silver', income: '$2,120' },
    { agent: 'Enzo Fernandez', score: 72.2, tier: 'Silver', income: '$1,980' },
  ],
  goalTracking: [
    { goal: 'Engagement Rate', target: 75, current: 78 },
    { goal: 'Listing Success', target: 88, current: 88 },
    { goal: 'Monthly Income', target: 2750, current: 2750 },
    { goal: 'Drop Rate', target: 3, current: 3.2 },
  ],
};

// Animated ProgressBar
const ProgressBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setWidth((value / max) * 100), 100); // slight delay
    return () => clearTimeout(timeout);
  }, [value, max]);

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden border-red-200">
      <div
        className="h-full bg-[#F20C8F]  transition-all duration-1000 ease-in-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default function AgentPerformance() {
  const { profile, kpis, categoryBreakdown, topAgents, goalTracking } = mockData;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pt-16 sm:pt-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center mb-3">
              <img src="https://i.pinimg.com/736x/95/fa/19/95fa19e6202e2293e07a1a17b3fd9048.jpg" alt={profile.name} className="w-14 h-14 rounded-full object-cover" />
              <div className="ml-3">
                <h2 className="text-xs font-bold">{profile.name}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{profile.location}</p>
                <div className="flex items-center text-green-600 text-xs sm:text-sm font-semibold mt-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                  {profile.status}
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm"><strong>Tier:</strong> {profile.tier}</p>
            <p className="text-xs sm:text-sm"><strong>Leads this month:</strong> {profile.leads}</p>
            <p className="text-xs sm:text-sm mb-2"><strong>Listings live:</strong> {profile.listings}</p>
            <h3 className="text-sm font-bold mt-2">Final Score</h3>
            <div className="flex items-center justify-between mt-1 mb-1">
              <span className="text-lg sm:text-xl font-bold">{profile.finalScore}</span>
              <span className="text-xs sm:text-sm text-green-500">{profile.scoreChange}</span>
            </div>
            <ProgressBar value={profile.finalScore} max={100} />
          </div>

          {/* Goal Tracking */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-lg font-bold mb-3">Goal Tracking</h3>
            {goalTracking.map((goal, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span>{goal.goal}</span>
                  <span className="font-bold">{goal.current}{goal.goal.includes('Rate') ? '%' : ''}</span>
                </div>
                <ProgressBar value={goal.current} max={goal.target * 1.5} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className={`rounded-2xl shadow-lg p-3 hover:shadow-2xl transition duration-300 cursor-pointer text-white ${kpi.isPositive ? 'bg-[#083A85]' : 'bg-red-500'}`}
              >
                <h3 className="text-xs sm:text-sm font-medium">{kpi.title}</h3>
                <div className="flex items-end justify-between mt-1 mb-1">
                  <span className="text-lg sm:text-xl font-bold">{kpi.value}</span>
                  <span className="text-xs sm:text-sm font-semibold">{kpi.change}</span>
                </div>
                <ProgressBar value={parseFloat(kpi.value)} max={100} />
              </div>
            ))}
          </div>

          {/* Category Breakdown + Top Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Category Breakdown</h3>
                <span className="text-xs font-bold text-blue-900">Normalized (0–100)</span>
                
              </div>
              {categoryBreakdown.map((item, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span>{item.name} ({item.weight})</span>
                    <span className="font-bold">{item.score}</span>
                  </div>
                  <ProgressBar value={item.score} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Top Agents (This Month)</h3>
                <span className="bg-gray-200 text-gray-800 text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full">Auto-ranked</span>
              </div>
              <table className="min-w-full text-xs sm:text-sm table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-left">Agent</th>
                    <th className="px-2 py-1 text-left">Final Score</th>
                    <th className="px-2 py-1 text-left">Tier</th>
                    <th className="px-2 py-1 text-left">Income</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((a, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">{a.agent}</td>
                      <td className="px-2 py-1">{a.score}</td>
                      <td className="px-2 py-1">{a.tier}</td>
                      <td className="px-2 py-1">{a.income}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs sm:text-sm font-semibold">
                Weights: Quality 30%, Productivity 25%, Reliability 20%, Financial 15%, Compliance 10%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
