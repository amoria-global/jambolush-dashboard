import React from 'react';

interface KPI {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface BreakdownItem {
  name: string;
  weight: string;
  score: number;
}

interface Agent {
  agent: string;
  score: number;
  tier: string;
  income: string;
}

interface Goal {
  goal: string;
  target: number;
  current: number;
}

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
  };
  kpis: KPI[];
  categoryBreakdown: BreakdownItem[];
  topAgents: Agent[];
  goalTracking: Goal[];
}

const mockData: MockData = {
  profile: {
    name: 'Muben Pacific',
    location: 'Kigali • East Africa',
    status: 'Active',
    tier: 'Gold',
    leads: 42,
    listings: 28,
    finalScore: 84.9,
    scoreChange: '+4.2 vs last month',
  },
  kpis: [
    { title: 'Engagement Rate', value: '78%', change: '+6%', isPositive: true },
    { title: 'Owner/Client Rating', value: '4.7 ⭐', change: '+0.1', isPositive: true },
    { title: 'Monthly Income', value: '$2,750', change: '+12%', isPositive: true },
    { title: 'Drop Rate', value: '3.2%', change: '-0.6%', isPositive: false },
  ],
  categoryBreakdown: [
    { name: 'Quality', weight: '30%', score: 92 },
    { name: 'Productivity', weight: '25%', score: 85 },
    { name: 'Reliability', weight: '20%', score: 78 },
    { name: 'Financial Impact', weight: '15%', score: 70 },
    { name: 'Compliance', weight: '10%', score: 100 },
  ],
  topAgents: [
    { agent: 'Grace Lee', score: 92.1, tier: 'Platinum', income: '$3,820' },
    { agent: 'Moses Grant', score: 84.9, tier: 'Gold', income: '$2,750' },
    { agent: 'Ali Hassan', score: 80.3, tier: 'Gold', income: '$2,410' },
    { agent: 'Mary Smith', score: 78.6, tier: 'Silver', income: '$2,120' },
    { agent: 'John Doe', score: 72.2, tier: 'Silver', income: '$1,980' },
  ],
  goalTracking: [
    { goal: 'Engagement Rate', target: 75, current: 78 },
    { goal: 'Listing Success', target: 88, current: 88 },
    { goal: 'Monthly Income', target: 2750, current: 2750 },
    { goal: 'Drop Rate', target: 3, current: 3.2 },
  ],
};

interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass?: string;
}

const ProgressBar = ({ value, max = 100, colorClass = 'bg-gray-700' }: ProgressBarProps) => (
  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
    <div
      className={`h-full ${colorClass}`}
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

export default function App() {
  const { profile, kpis, categoryBreakdown, topAgents, goalTracking } = mockData;

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-gray-50 rounded-xl shadow p-4">
            <div className="flex items-center mb-3">
              {/* Replaced the initials div with an img tag using a placeholder image */}
              <img
                src="/profile/profile1.jpg"
                alt={`${profile.name} profile`}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="ml-3">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.location}</p>
                <div className="flex items-center text-green-600 text-sm font-semibold mt-0.5">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                  {profile.status}
                </div>
              </div>
            </div>
            <p className="text-sm"><strong>Tier:</strong> {profile.tier}</p>
            <p className="text-sm"><strong>Leads this month:</strong> {profile.leads}</p>
            <p className="text-sm mb-2"><strong>Listings live:</strong> {profile.listings}</p>
            <h3 className="text-sm font-bold mt-2">Final Score</h3>
            <div className="flex items-center justify-between mt-0.5 mb-1">
              <span className="text-xl font-bold">{profile.finalScore}</span>
              <span className="text-sm text-green-500">{profile.scoreChange}</span>
            </div>
            {/* Updated the colorClass for the progress bar to use the new hex color */}
            <ProgressBar value={profile.finalScore} max={100} colorClass="bg-[#083A85]" />
          </div>

          {/* Goal Tracking */}
          <div className="bg-gray-50 rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-3">Goal Tracking</h3>
            {goalTracking.map((goal, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex justify-between text-sm mb-0.5">
                  <span>{goal.goal} {goal.goal === 'Drop Rate' ? `${goal.target}%` : goal.goal.includes('Income') ? `$${goal.target.toLocaleString()}` : `${goal.target}%`}</span>
                  <span className="font-bold">
                    {goal.current}{goal.goal === 'Drop Rate' || goal.goal.includes('Rate') ? '%' : ''}
                  </span>
                </div>
                <ProgressBar
                  value={goal.current}
                  max={goal.target * 1.5}
                  colorClass={
                    goal.goal === 'Listing Success'
                      ? 'bg-yellow-400'
                      : goal.current >= goal.target
                      // Updated the colorClass for the progress bar to use the new hex color
                      ? 'bg-[#083A85]'
                      : 'bg-red-400'
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-gray-50 rounded-xl shadow p-3">
                <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
                <div className="flex items-end justify-between mt-1 mb-1">
                  <span className="text-xl font-bold">{kpi.value}</span>
                  <span className={`${kpi.isPositive ? 'text-green-500' : 'text-red-500'} text-sm font-semibold`}>
                    {kpi.change}
                  </span>
                </div>
                <ProgressBar
                  value={parseFloat(kpi.value)}
                  max={100}
                  // Updated the colorClass for the progress bar to use the new hex color
                  colorClass={kpi.isPositive ? 'bg-[#083A85]' : 'bg-[#083A85]'}
                />
              </div>
            ))}
          </div>

          {/* Category Breakdown + Top Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Category Breakdown</h3>
                <span className="text-sm text-gray-500">Normalized (0–100)</span>
              </div>
              {categoryBreakdown.map((item, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between text-sm mb-0.5">
                    <span>{item.name} ({item.weight})</span>
                    <span className="font-bold">{item.score}</span>
                  </div>
                  {/* Updated the colorClass for the progress bar to use the new hex color */}
                  <ProgressBar value={item.score} colorClass="bg-[#083A85]" />
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Top Agents (This Month)</h3>
                {/* Updated the color of the text to a darker shade to ensure better contrast */}
                <span className="bg-gray-200 text-gray-800 text-sm font-semibold px-2 py-0.5 rounded-full">Auto-ranked</span>
              </div>
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full text-sm">
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
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Weights: Quality 30%, Productivity 25%, Reliability 20%, Financial 15%, Compliance 10%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
