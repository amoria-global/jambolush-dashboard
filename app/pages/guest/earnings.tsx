'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

// --- AGENT EARNINGS  COMPONENT ---
const AgentEarnings = () => {
    // --- MOCK DATA ---
    const summaryData = {
        totalCommission: 16850,
        fromProperties: 10250,
        fromTours: 6600,
        clients: 12,
    };

    const monthlyCommissionData: MonthlyCommission[] = [
        { month: 'Jan', properties: 1440, tours: 840 },
        { month: 'Feb', properties: 1300, tours: 750 },
        { month: 'Mar', properties: 1620, tours: 960 },
        { month: 'Apr', properties: 1560, tours: 1050 },
        { month: 'May', properties: 1900, tours: 1230 },
        { month: 'Jun', properties: 2430, tours: 1770 },
    ];

    const topPerformers: TopPerformer[] = [
        { name: 'Beachfront Villa', commission: 4275, type: 'Property' },
        { name: 'City History Walk', commission: 3750, type: 'Tour' },
        { name: 'Downtown Loft', commission: 2970, type: 'Property' },
        { name: 'Food & Drink Tour', commission: 2640, type: 'Tour' },
        { name: 'Mountain Cabin', commission: 2310, type: 'Property' },
    ];
    
    const commissionStatements: CommissionStatement[] = [
        { id: 'COM-051', source: 'Beachfront Villa', type: 'Property', date: '2025-08-20', commission: 367.50 },
        { id: 'COM-052', source: 'City History Walk', type: 'Tour', date: '2025-08-19', commission: 255.00 },
        { id: 'COM-053', source: 'Downtown Loft', type: 'Property', date: '2025-08-18', commission: 270.00 },
        { id: 'COM-054', source: 'Food & Drink Tour', type: 'Tour', date: '2025-08-17', commission: 204.00 },
    ];

    // --- RENDER ---
    return (
        <div className="bg-gray-100 min-h-screen p-4 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-black">Agent Earnings</h1>
                    <p className="text-gray-500">Manage your commission from properties and tours.</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Commission</p>
                            <p className="text-2xl font-bold text-black">${summaryData.totalCommission.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black">
                            <i className="bi bi-briefcase text-white text-2xl"></i>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">From Properties</p>
                            <p className="text-2xl font-bold text-black">${summaryData.fromProperties.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}>
                            <i className="bi bi-building text-white text-2xl"></i>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">From Tours</p>
                            <p className="text-2xl font-bold text-black">${summaryData.fromTours.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ backgroundColor: '#083A85' }}>
                            <i className="bi bi-compass text-white text-2xl"></i>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-xl shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Managed Clients</p>
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
                                    <Legend wrapperStyle={{fontSize: "14px"}} />
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
                            {topPerformers.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                        <p className="text-sm font-bold text-black">${item.commission.toLocaleString()}</p>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full"
                                            style={{ 
                                                width: `${(item.commission / 5000) * 100}%`,
                                                backgroundColor: item.type === 'Property' ? '#F20C8F' : '#083A85'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Commission Statements Table */}
                <div className="mt-6 bg-white p-5 rounded-xl shadow-md">
                     <h2 className="text-lg font-semibold text-black mb-4">Commission Statements</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-3 text-sm font-semibold text-gray-500">Statement ID</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500">Source</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500">Type</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500">Date</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Commission Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissionStatements.map((stmt) => (
                                    <tr key={stmt.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-sm text-black font-mono">{stmt.id}</td>
                                        <td className="p-3 text-sm text-gray-700">{stmt.source}</td>
                                        <td className="p-3 text-sm">
                                            <span className={`text-xs font-bold ${stmt.type === 'Property' ? 'text-[#F20C8F]' : 'text-[#083A85]'}`}>
                                                {stmt.type}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-gray-700">{stmt.date}</td>
                                        <td className="p-3 text-sm text-black font-bold text-right">${stmt.commission.toFixed(2)}</td>
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

export default AgentEarnings;
