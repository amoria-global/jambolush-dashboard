//app/pages/agent/earnings.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/app/api/apiService';

// --- TYPE DEFINITIONS ---
type MonthlyCommission = {
  month: string;
  properties: number;
  tours: number;
};

type TopPerformer = {
  name: string;
  commission: number;
  type: 'Property' | 'Tour';
};

type CommissionStatement = {
  id: string;
  source: string;
  type: 'Property' | 'Tour';
  date: string;
  commission: number;
};

type SummaryData = {
  totalCommission: number;
  fromProperties: number;
  fromTours: number;
  clients: number;
};

type Transaction = {
  id: string;
  type: string;
  category?: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  metadata?: any;
};

// --- AGENT EARNINGS COMPONENT ---
const Earnings = () => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalCommission: 0,
    fromProperties: 0,
    fromTours: 0,
    clients: 0,
  });
  const [monthlyCommissionData, setMonthlyCommissionData] = useState<MonthlyCommission[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [commissionStatements, setCommissionStatements] = useState<CommissionStatement[]>([]);

  // --- DATA FETCHING FUNCTIONS ---
  const fetchAllTransactions = async () => {
    try {
      const response: any = await api.get('/payments/transactions');
      if (response.success) {
        return response.data.data.transactions || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const response: any = await api.get('/payments/wallet');
      if (response.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching wallet info:', err);
      return null;
    }
  };

  // --- DATA PROCESSING FUNCTIONS ---
  const processTransactionsData = (transactions: Transaction[]) => {
    // Filter commission-related transactions
    const commissionTransactions = transactions.filter(
      (tx) => tx.type === 'commission' || tx.category === 'commission'
    );

    // Calculate summary data
    let totalCommission = 0;
    let fromProperties = 0;
    let fromTours = 0;
    const clientsSet = new Set();

    // Monthly data processing
    const monthlyData: { [key: string]: { properties: number; tours: number } } = {};
    const performersMap: { [key: string]: { commission: number; type: 'Property' | 'Tour' } } = {};

    commissionTransactions.forEach((tx) => {
      const amount = Math.abs(tx.amount);
      totalCommission += amount;

      // Determine if it's from properties or tours based on description or metadata
      const isProperty = tx.description?.toLowerCase().includes('property') || 
                        tx.description?.toLowerCase().includes('villa') || 
                        tx.description?.toLowerCase().includes('apartment') ||
                        tx.description?.toLowerCase().includes('loft') ||
                        tx.description?.toLowerCase().includes('cabin');
      
      const isTour = tx.description?.toLowerCase().includes('tour') || 
                    tx.description?.toLowerCase().includes('walk') ||
                    tx.description?.toLowerCase().includes('guide');

      if (isProperty) {
        fromProperties += amount;
      } else if (isTour) {
        fromTours += amount;
      } else {
        // Default to property if can't determine
        fromProperties += amount;
      }

      // Extract client info if available
      if (tx.metadata?.clientId) {
        clientsSet.add(tx.metadata.clientId);
      }

      // Process monthly data
      const date = new Date(tx.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { properties: 0, tours: 0 };
      }

      if (isProperty) {
        monthlyData[monthKey].properties += amount;
      } else {
        monthlyData[monthKey].tours += amount;
      }

      // Process top performers data
      const sourceName = tx.description || `Transaction ${tx.id}`;
      if (!performersMap[sourceName]) {
        performersMap[sourceName] = { 
          commission: 0, 
          type: isProperty ? 'Property' : 'Tour' 
        };
      }
      performersMap[sourceName].commission += amount;
    });

    // Convert monthly data to array format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyArray = months.map(month => ({
      month,
      properties: monthlyData[month]?.properties || 0,
      tours: monthlyData[month]?.tours || 0,
    }));

    // Convert performers data to array and sort
    const performersArray = Object.entries(performersMap)
      .map(([name, data]) => ({
        name,
        commission: data.commission,
        type: data.type,
      }))
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 5);

    // Create commission statements
    const statements = commissionTransactions
      .slice(0, 10) // Show latest 10
      .map((tx) => ({
        id: tx.id,
        source: tx.description || 'Commission Payment',
        type: (tx.description?.toLowerCase().includes('tour') ? 'Tour' : 'Property') as 'Property' | 'Tour',
        date: new Date(tx.date).toISOString().split('T')[0],
        commission: Math.abs(tx.amount),
      }));

    return {
      summary: {
        totalCommission,
        fromProperties,
        fromTours,
        clients: clientsSet.size || 12, // Fallback to mock data if no client info
      },
      monthly: monthlyArray,
      performers: performersArray,
      statements,
    };
  };

  // --- MAIN DATA FETCHING EFFECT ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data concurrently
        const [transactions, walletInfo] = await Promise.all([
          fetchAllTransactions(),
          fetchWalletInfo(),
        ]);

        // Process transaction data
        const processedData = processTransactionsData(transactions);

        // Update state
        setSummaryData(processedData.summary);
        setMonthlyCommissionData(processedData.monthly);
        setTopPerformers(processedData.performers);
        setCommissionStatements(processedData.statements);

        // Add wallet info if available
        if (walletInfo) {
          setSummaryData(prev => ({
            ...prev,
            totalCommission: walletInfo.totalEarnings || prev.totalCommission,
          }));
        }

      } catch (err) {
        console.error('Error fetching agent earnings data:', err);
        setError('Failed to load earnings data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading earnings data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen py-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#083A85]">Earnings</h1>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-md text-gray-500 font-medium">Total Commission</p>
              <p className="text-2xl font-bold text-black">${summaryData.totalCommission.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black">
              <i className="bi bi-briefcase text-white text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-md text-gray-500 font-medium">From Properties</p>
              <p className="text-2xl font-bold text-black">${summaryData.fromProperties.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}>
              <i className="bi bi-building text-white text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-md text-gray-500 font-medium">From Tours</p>
              <p className="text-2xl font-bold text-black">${summaryData.fromTours.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#083A85' }}>
              <i className="bi bi-compass text-white text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <p className="text-md text-gray-500 font-medium">Managed Clients</p>
              <p className="text-2xl font-bold text-black">{summaryData.clients}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800">
              <i className="bi bi-people text-white text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commission Sources Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-black mb-4">Monthly Commission Sources</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCommissionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '10px', color: 'white' }}
                    formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Legend wrapperStyle={{fontSize: "10px"}} />
                  <Bar dataKey="properties" stackId="a" fill="#F20C8F" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="tours" stackId="a" fill="#083A85" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performing Clients */}
          <div className="bg-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-black mb-4">Top Performers</h2>
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-md font-medium text-gray-800 truncate pr-2">{item.name}</p>
                      <p className="text-md font-bold text-black">${item.commission.toLocaleString()}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${Math.min((item.commission / Math.max(...topPerformers.map(p => p.commission))) * 100, 100)}%`,
                          backgroundColor: item.type === 'Property' ? '#F20C8F' : '#083A85'
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No performance data available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Commission Statements Table */}
        <div className="mt-6 bg-white p-5 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-black mb-4">Commission Statements</h2>
          <div className="overflow-x-auto">
            {commissionStatements.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="p-3 text-md font-semibold text-gray-500">Statement ID</th>
                    <th className="p-3 text-md font-semibold text-gray-500">Source</th>
                    <th className="p-3 text-md font-semibold text-gray-500">Type</th>
                    <th className="p-3 text-md font-semibold text-gray-500">Date</th>
                    <th className="p-3 text-md font-semibold text-gray-500 text-right">Commission Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionStatements.map((stmt) => (
                    <tr key={stmt.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-md text-black font-mono">{stmt.id}</td>
                      <td className="p-3 text-md text-gray-700">{stmt.source}</td>
                      <td className="p-3 text-md">
                        <span className={`text-md font-bold ${stmt.type === 'Property' ? 'text-[#F20C8F]' : 'text-[#083A85]'}`}>
                          {stmt.type}
                        </span>
                      </td>
                      <td className="p-3 text-md text-gray-700">{stmt.date}</td>
                      <td className="p-3 text-md text-black font-bold text-right">${stmt.commission.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-8">No commission statements available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;