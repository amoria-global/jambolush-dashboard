import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// Define data types for the expanded dashboard
interface AgentPerformanceData {
  id: string;
  name: string;
  photoUrl: string;
  role: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  // Expanded KPIs
  tasksHandled: number;
  successRate: number; // as a percentage
  avgHandlingTime: string; // e.g., "3m 15s"
  csatScore: number; // out of 5
  salesClosed: number;
  punctuality: string; // e.g., "98%"
  
  // New data for trends
  dailyPerformance: { date: string; tasks: number; sales: number }[];
  
  // New data for breakdown
  performanceByTaskType: { name: string; count: number; successRate: number }[];
  
  // New data for comparisons
  ranking: { rank: number; totalAgents: number };
  
  // New data for feedback and awards
  feedback: { source: string; comment: string; date: string }[];
  awards: string[];

  // New data for goals and insights
  goals: {
    tasksHandled: number;
    salesClosed: number;
    csatScore: number;
  };
  // The insights are now structured objects
  insights: {
    title: string;
    description: string;
    icon: string; // Using a string to represent the icon for a simpler example
  }[];

  // Original data for charts (updated)
  clientStatusDistribution: { name: string; value: number }[];
  monthlyPerformance: { name: string; clients: number; revenue: number }[];

  // Missing data for recent activities
  recentActivities: { id: number; clientName: string; action: string; date: string }[];

  // New fields for filtering
  team: string;
  region: string;
}

// --- MOCK DATA FOR DIFFERENT FILTERS AND DATE RANGES ---
const MOCK_PERFORMANCE_DATA_JANE_MONTH: AgentPerformanceData = {
  id: 'AG-0001',
  name: 'Muben pacific',
  photoUrl: '/profile/profile1.jpg',
  role: 'Agent field',
  contactInfo: { email: 'muben23@gmail.com', phone: '+250 788 437 347' },
  tasksHandled: 180,
  successRate: 92,
  avgHandlingTime: '3m 15s',
  csatScore: 4.8,
  salesClosed: 45,
  punctuality: '98%',
  dailyPerformance: [
    { date: 'Mon', tasks: 35, sales: 5 },
    { date: 'Tue', tasks: 40, sales: 8 },
    { date: 'Wed', tasks: 38, sales: 6 },
    { date: 'Thu', tasks: 45, sales: 10 },
    { date: 'Fri', tasks: 42, sales: 7 },
  ],
  performanceByTaskType: [
    { name: 'Onboarding', count: 75, successRate: 98 },
    { name: 'Follow-up', count: 120, successRate: 90 },
    { name: 'Sales Call', count: 55, successRate: 88 },
  ],
  ranking: { rank: 2, totalAgents: 15 },
  feedback: [
    { source: 'Supervisor', comment: 'Jane consistently exceeds her sales targets.', date: '2024-08-01' },
  ],
  awards: ['Top Performer - July 2024'],
  goals: { tasksHandled: 200, salesClosed: 40, csatScore: 4.5 },
  insights: [
    {
      title: "Improve Follow-up Success",
      description: "Review call recordings for follow-up calls to identify best practices and improve your success rate from 90% to 95%.",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone-call"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M14.05 2a9 9 0 0 1 8 7.94"/><path d="M14.05 6a5 5 0 0 1 4 3.94"/></svg>`
    },
    {
      title: "Boost Sales Conversion",
      description: "Your sales calls have an 88% success rate. Focus on key clients to close 5 more sales by end of the month.",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`
    },
  ],
  clientStatusDistribution: [
    { name: 'Active', value: 75 },
    { name: 'Pending', value: 20 },
    { name: 'Inactive', value: 5 },
  ],
  monthlyPerformance: [
    { name: 'Jan', clients: 5, revenue: 15000 },
    { name: 'Feb', clients: 7, revenue: 20000 },
    { name: 'Mar', clients: 10, revenue: 35000 },
    { name: 'Apr', clients: 8, revenue: 25000 },
    { name: 'May', clients: 12, revenue: 40000 },
    { name: 'Jun', clients: 3, revenue: 10000 },
  ],
  recentActivities: [
    { id: 1, clientName: 'Sarah Johnson', action: 'New Client Onboarding', date: '2024-08-10' },
  ],
  team: 'Team Alpha',
  region: 'North America',
};

// Data for last week
const MOCK_PERFORMANCE_DATA_JANE_WEEK: AgentPerformanceData = {
  ...MOCK_PERFORMANCE_DATA_JANE_MONTH,
  tasksHandled: 65,
  successRate: 95,
  avgHandlingTime: '3m 05s',
  salesClosed: 12,
  dailyPerformance: [
    { date: 'Mon', tasks: 12, sales: 2 },
    { date: 'Tue', tasks: 15, sales: 3 },
    { date: 'Wed', tasks: 13, sales: 2 },
    { date: 'Thu', tasks: 14, sales: 3 },
    { date: 'Fri', tasks: 11, sales: 2 },
  ],
  performanceByTaskType: [
    { name: 'Onboarding', count: 20, successRate: 100 },
    { name: 'Follow-up', count: 35, successRate: 92 },
    { name: 'Sales Call', count: 10, successRate: 85 },
  ],
  insights: [
    {
      title: "Maintain High Success Rate",
      description: "Your success rate is at a strong 95%. Keep up the great work this week!",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/><path d="m9 12 2 2 4-4"/></svg>`
    },
    {
      title: "Increase Weekend Productivity",
      description: "Identify opportunities to handle a few more tasks on weekends to hit your weekly goal of 70 tasks handled.",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
    },
  ],
  recentActivities: [
    { id: 1, clientName: 'Kevin Davis', action: 'Follow-up Call', date: '2024-08-09' },
    { id: 2, clientName: 'Mia Wright', action: 'Contract Signed', date: '2024-08-08' },
  ],
};

// Data for today
const MOCK_PERFORMANCE_DATA_JANE_TODAY: AgentPerformanceData = {
  ...MOCK_PERFORMANCE_DATA_JANE_WEEK,
  tasksHandled: 15,
  successRate: 98,
  avgHandlingTime: '2m 50s',
  salesClosed: 3,
  dailyPerformance: [
    { date: 'Today', tasks: 15, sales: 3 },
  ],
  performanceByTaskType: [
    { name: 'Onboarding', count: 5, successRate: 100 },
    { name: 'Follow-up', count: 8, successRate: 100 },
    { name: 'Sales Call', count: 2, successRate: 50 },
  ],
  insights: [
    {
      title: "Excellent Start to the Day",
      description: "Your performance so far is stellar with a 98% success rate. Keep up the momentum!",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    },
  ],
  recentActivities: [
    { id: 1, clientName: 'Amelia Evans', action: 'Meeting Scheduled', date: '2024-08-11' },
    { id: 2, clientName: 'John Smith', action: 'New Client Onboarding', date: '2024-08-11' },
  ],
};

// Define the colors for the pie chart and other elements
const PIE_CHART_COLORS = ['#083A85', '#E74C3C', '#27AE60'];
const PRIMARY_COLOR = '#083A85';
const SALES_COLOR = '#F20C8F';


/**
 * A simple function to simulate fetching data based on filter criteria.
 * In a real application, this would be an API call.
 * @param dateRange - The selected date range.
 * @returns {AgentPerformanceData} The mock data for the specified filters.
 */
const getFilteredData = (dateRange: string): AgentPerformanceData => {
  if (dateRange === 'today') {
    return MOCK_PERFORMANCE_DATA_JANE_TODAY;
  }
  if (dateRange === 'week') {
    return MOCK_PERFORMANCE_DATA_JANE_WEEK;
  }
  // For 'month' and 'custom', we'll return the same mock data.
  // In a real app, 'custom' would use the selected dates to fetch specific data.
  return MOCK_PERFORMANCE_DATA_JANE_MONTH;
};

const AgentPerformanceSummary: React.FC = () => {
  const [data, setData] = useState<AgentPerformanceData>(MOCK_PERFORMANCE_DATA_JANE_MONTH);
  const [dateRange, setDateRange] = useState('month');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Use useEffect to update the data whenever the dateRange filter changes
  useEffect(() => {
    // Hide the custom picker when a preset range is selected
    if (dateRange !== 'custom') {
      setShowCustomPicker(false);
    }
    const newData = getFilteredData(dateRange);
    setData(newData);
  }, [dateRange]);

  const handleCustomButtonClick = () => {
    // Toggle the visibility of the custom date picker
    setDateRange('custom');
    setShowCustomPicker(!showCustomPicker);
  };
  
  const handleApplyCustomDate = () => {
    // This function would typically trigger an API call with the selected dates.
    // For this mock data, we'll just re-render with the 'month' data as a placeholder.
    if (startDate && endDate) {
      // For this example, we'll use a custom alert.
      const customAlert = document.createElement('div');
      customAlert.innerHTML = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div class="bg-white p-6 rounded-lg shadow-xl text-center">
            <h3 class="text-xl font-bold mb-4">Dates Applied!</h3>
            <p class="text-gray-700 mb-4">Applying custom date range from ${startDate} to ${endDate}. (Using mock data)</p>
            <button class="px-4 py-2 bg-[#083A85] text-white rounded-md hover:bg-blue-700" onclick="this.parentNode.parentNode.remove()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(customAlert);
      
      // Simulating a data fetch by setting the dateRange to 'custom' again.
      // This will trigger the useEffect hook.
      setDateRange('custom');
    } else {
      // For this example, we'll use a custom alert.
      const customAlert = document.createElement('div');
      customAlert.innerHTML = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div class="bg-white p-6 rounded-lg shadow-xl text-center">
            <h3 class="text-xl font-bold mb-4 text-red-600">Error!</h3>
            <p class="text-gray-700 mb-4">Please select both a start and end date.</p>
            <button class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onclick="this.parentNode.parentNode.remove()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(customAlert);
    }
  };
  
  const progressStyle = {
    width: `${data.successRate}%`,
    backgroundColor: PRIMARY_COLOR
  };

  const getButtonClass = (buttonRange: string) => (
    `px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
      dateRange === buttonRange
        ? 'bg-[#083A85] text-white shadow-md'
        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
    }`
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased text-gray-800">
      <div className="container mx-auto max-w-7xl">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Agent Performance Summary</h1>
            <p className="text-xl text-gray-500">Overview of {data.name}'s performance</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDateRange('today')}
              className={getButtonClass('today')}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={getButtonClass('week')}
            >
              Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={getButtonClass('month')}
            >
              Month
            </button>
            <button
              onClick={handleCustomButtonClick}
              className={getButtonClass('custom')}
            >
              Custom
            </button>
          </div>
        </div>
        
        {/* Custom Date Picker Section */}
        {showCustomPicker && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row items-center gap-4 transition-all duration-300">
            <label htmlFor="startDate" className="text-gray-700 font-medium">From:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent transition-all duration-200"
            />
            <label htmlFor="endDate" className="text-gray-700 font-medium">To:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent transition-all duration-200"
            />
            <button
              onClick={handleApplyCustomDate}
              className="ml-0 sm:ml-4 px-6 py-2 bg-[#F20C8F] text-white font-semibold rounded-lg shadow-md hover:bg-[#C00A72] transition-colors duration-200"
            >
              Apply
            </button>
          </div>
        )}

        {/* Agent Overview Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <img src={data.photoUrl} alt={`${data.name}'s avatar`} className="w-24 h-24 rounded-full border-4 border-white shadow-md" />
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold text-gray-900">{data.name}</h2>
            <p className="text-lg text-gray-600 mb-2">{data.role} | Agent ID: {data.id}</p>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-500">
              <span>Email: <a href={`mailto:${data.contactInfo.email}`} className="text-[#083A85] hover:underline">{data.contactInfo.email}</a></span>
              <span>Phone: <a href={`tel:${data.contactInfo.phone}`} className="text-[#083A85] hover:underline">{data.contactInfo.phone}</a></span>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Card for Total Tasks Handled */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tasks Handled</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{data.tasksHandled}</div>
          </div>
          {/* Card for Success Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Success Rate</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{data.successRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="h-2.5 rounded-full transition-all duration-500" style={progressStyle}></div>
            </div>
          </div>
          {/* Card for AHT */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Avg. Handling Time</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{data.avgHandlingTime}</div>
          </div>
          {/* Card for CSAT Score */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">CSAT Score</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{data.csatScore} / 5.0</div>
          </div>
          {/* Card for Sales Closed */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sales Closed</div>
            <div className="text-4xl font-bold text-gray-900 mt-2">{data.salesClosed}</div>
          </div>
        </div>
        
        {/* Goals vs. Actuals and Insights Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Goals vs. Actuals */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Goals vs. Actuals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="border-b-2 pb-2">
                        <p className="text-sm font-semibold text-gray-500">Tasks Handled</p>
                        <p className="text-lg font-bold text-gray-900">{data.tasksHandled} / {data.goals.tasksHandled}</p>
                    </div>
                    <div className="border-b-2 pb-2">
                        <p className="text-sm font-semibold text-gray-500">Sales Closed</p>
                        <p className="text-lg font-bold text-gray-900">{data.salesClosed} / {data.goals.salesClosed}</p>
                    </div>
                    <div className="border-b-2 pb-2">
                        <p className="text-sm font-semibold text-gray-500">CSAT Score</p>
                        <p className="text-lg font-bold text-gray-900">{data.csatScore} / {data.goals.csatScore}</p>
                    </div>
                </div>
            </div>
            {/* Actionable Insights */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Actionable Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.insights.map((insight, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center mb-2">
                        <div className="text-[#083A85] mr-3" dangerouslySetInnerHTML={{ __html: insight.icon }} />
                        <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  ))}
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Performance Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Performance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.dailyPerformance}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill={PRIMARY_COLOR} name="Tasks Completed" />
                <Bar dataKey="sales" fill={SALES_COLOR} name="Sales Closed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Client Status Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.clientStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {data.clientStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics & Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Breakdown Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance by Task Type</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#083A85] text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Task Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Handled</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Success Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.performanceByTaskType.map((task, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.successRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Feedback and Awards */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback & Achievements</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Ranking</h3>
              <p className="text-gray-600">
                Ranked <span className="font-bold text-[#083A85]">#{data.ranking.rank}</span> out of {data.ranking.totalAgents} agents.
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Feedback</h3>
              {data.feedback.map((f, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#27AE60] mb-2">
                  <p className="italic text-gray-700">"{f.comment}"</p>
                  <p className="text-xs text-gray-500 mt-2">— {f.source} on {f.date}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Awards & Recognition</h3>
              <ul className="list-disc list-inside space-y-1">
                {data.awards.map((award, index) => (
                  <li key={index} className="text-gray-600">
                    <span className="font-medium text-[#083A85]">{award}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity Table (Original) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Client Activity</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#083A85] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentActivities.map(activity => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const App = () => {
    return <AgentPerformanceSummary />;
};

export default App;
