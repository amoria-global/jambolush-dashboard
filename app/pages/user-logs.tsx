import React, { useState } from 'react';

// Mock data for the application
const initialLogs = [
  { id: 1, type: 'Login', message: 'Successful login from IP 192.168.1.1', timestamp: '2025-08-10T10:00:00Z' },
  { id: 2, type: 'Logout', message: 'User logged out', timestamp: '2025-08-10T10:30:00Z' },
  { id: 3, type: 'API Call', message: 'Accessed user data endpoint', timestamp: '2025-08-10T11:15:00Z' },
  { id: 4, type: 'Login', message: 'Failed login attempt from IP 8.8.8.8', timestamp: '2025-08-10T11:20:00Z' },
  { id: 5, type: 'Session Revoke', message: 'Revoked session for old device', timestamp: '2025-08-10T11:45:00Z' },
];

const initialSessions = [
  { id: 1, device: 'Chrome on macOS', location: 'Kigali, Rwanda', ip: '203.0.113.1', lastActive: '2025-08-10T11:45:00Z' },
  { id: 2, device: 'Firefox on Windows', location: 'Rubavu, Rwanda', ip: '198.51.100.2', lastActive: '2025-08-10T10:00:00Z' },
  { id: 3, device: 'Mobile App on iOS', location: 'Rwamagana, Rwanda', ip: '203.0.113.5', lastActive: '2025-08-10T09:30:00Z' },
];

// Helper function to format the date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

interface LogTypeData {
  name: string;
  count: number;
}

const SimpleBarChart: React.FC<{ data: LogTypeData[] }> = ({ data }) => {
  const chartHeight = 150;
  // Increased chart width to provide more space
  const chartWidth = 500;
  const barWidth = 40;
  // Increased bar gap to prevent label collision
  const barGap = 30;

  const maxCount = Math.max(...data.map(item => item.count));
  const totalWidth = data.length * (barWidth + barGap);
  const xOffset = (chartWidth - totalWidth) / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
        {/* Y-axis line */}
        <line x1="20" y1="0" x2="20" y2={chartHeight} stroke="#e2e8f0" strokeWidth="2" />
        {/* X-axis line */}
        <line x1="20" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="#e2e8f0" strokeWidth="2" />

        {/* Render bars and labels */}
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * chartHeight;
          const x = xOffset + index * (barWidth + barGap);
          const y = chartHeight - barHeight;

          return (
            <React.Fragment key={item.name}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#003087"
                className="transition-all duration-300 ease-in-out"
              >
                {/* Title element for tooltip */}
                <title>{`${item.name}: ${item.count}`}</title>
              </rect>
              {/* X-axis label, adjusted font size */}
              <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-gray-600">
                {item.name}
              </text>
              {/* Value label */}
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-xs font-bold fill-gray-800">
                {item.count}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'logs' | 'sessions'>('logs');
  const [logs, setLogs] = useState(initialLogs);
  const [sessions, setSessions] = useState(initialSessions);

  // Analyze log data for a simple chart
  const logTypeData = logs.reduce((acc, log) => {
    const type = log.type;
    const existingEntry = acc.find(item => item.name === type);
    if (existingEntry) {
      existingEntry.count++;
    } else {
      acc.push({ name: type, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number; }[]);

  const handleRevokeSession = (sessionId: number) => {
    // Simulate revoking a session by filtering it out
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    // Add a log entry for the revoked session
    setLogs(prevLogs => [...prevLogs, {
      id: prevLogs.length + 1,
      type: 'Session Revoke',
      message: `Revoked session for device ID: ${sessionId}`,
      timestamp: new Date().toISOString(),
    }]);
  };

  // Helper function to render the appropriate page
  const renderPage = () => {
    if (activePage === 'logs') {
      return (
        <div className="bg-white shadow-lg rounded-lg border-2 border-gray-200 p-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold">Self-Logs</h2>
            <p className="text-sm text-gray-500">Your recent activity, including logins, logouts, and actions.</p>
          </div>
          <div className="w-full h-48 mb-6 flex justify-center">
            <SimpleBarChart data={logTypeData} />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white shadow-lg rounded-lg border-2 border-gray-200 p-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold">Session Management</h2>
            <p className="text-sm text-gray-500">Manage your active sessions and devices.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.device}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(session.lastActive)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-[#D80B7A]"
                        style={{ backgroundColor: '#F20C8F' }}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setActivePage('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              activePage === 'logs' ? 'text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
            style={activePage === 'logs' ? { backgroundColor: '#003087' } : {}}
          >
            Self-Logs
          </button>
          <button
            onClick={() => setActivePage('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              activePage === 'sessions' ? 'text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
            style={activePage === 'sessions' ? { backgroundColor: '#003087' } : {}}
          >
            Session Management
          </button>
        </div>

        {renderPage()}
      </div>
    </div>
  );
};

export default App;
