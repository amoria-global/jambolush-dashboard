'use client';

import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- TYPE DEFINITIONS ---
type MonthlyEarning = {
  month: string;
  revenue: number;
  profit: number;
};

type PropertyRevenue = {
  name: string;
  revenue: number;
};

type Transaction = {
  id: string;
  property: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending';
};

type WithdrawalAccount = {
    bank: string;
    number: string;
};

// --- HOST EARNINGS  COMPONENT ---
const HostEarnings = () => {
    // --- STATE MANAGEMENT ---
    const [balance, setBalance] = useState(15320.75);
    const [showSetAccountModal, setShowSetAccountModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawalAccounts, setWithdrawalAccounts] = useState<WithdrawalAccount[]>([]);
    const [newAccount, setNewAccount] = useState({ bank: '', number: '' });
    const [withdrawAmount, setWithdrawAmount] = useState<number | string>('');
    const [error, setError] = useState('');

    // --- MOCK DATA ---
    const summaryData = {
        totalRevenue: 85250,
        ytdProfit: 68200,
        occupancyRate: 88,
        avgNightlyRate: 215,
    };

    const monthlyEarningsData: MonthlyEarning[] = [
        { month: 'Jan', revenue: 7200, profit: 5760 }, { month: 'Feb', revenue: 6500, profit: 5200 },
        { month: 'Mar', revenue: 8100, profit: 6480 }, { month: 'Apr', revenue: 7800, profit: 6240 },
        { month: 'May', revenue: 9500, profit: 7600 }, { month: 'Jun', revenue: 11200, profit: 8960 },
        { month: 'Jul', revenue: 12500, profit: 10000 }, { month: 'Aug', revenue: 12450, profit: 9960 },
    ];

    const propertyRevenueData: PropertyRevenue[] = [
        { name: 'Beachfront Villa', revenue: 28500 }, { name: 'Downtown Loft', revenue: 19800 },
        { name: 'Mountain Cabin', revenue: 15400 }, { name: 'Suburban Home', revenue: 12300 },
        { name: 'Lakeside Cottage', revenue: 9250 },
    ];
    
    const recentTransactions: Transaction[] = [
        { id: 'PAY-001', property: 'Beachfront Villa', date: '2025-08-20', amount: 2450.00, status: 'Completed' },
        { id: 'PAY-002', property: 'Downtown Loft', date: '2025-08-18', amount: 1800.50, status: 'Completed' },
        { id: 'PAY-003', property: 'Mountain Cabin', date: '2025-08-15', amount: 1230.00, status: 'Completed' },
        { id: 'PAY-004', property: 'Suburban Home', date: '2025-08-12', amount: 980.75, status: 'Completed' },
        { id: 'PAY-005', property: 'Beachfront Villa', date: '2025-09-01', amount: 3100.00, status: 'Pending' },
    ];

    // --- EVENT HANDLERS ---
    const handleWithdrawClick = () => {
        if (withdrawalAccounts.length === 0) {
            setShowSetAccountModal(true);
        } else {
            setError('');
            setWithdrawAmount('');
            setShowWithdrawModal(true);
        }
    };

    const handleSaveAccount = () => {
        if (newAccount.bank && newAccount.number) {
            setWithdrawalAccounts([...withdrawalAccounts, newAccount]);
            setNewAccount({ bank: '', number: '' });
            setShowSetAccountModal(false);
            setShowWithdrawModal(true); // Automatically open withdraw modal after setting account
        }
    };

    const handleConfirmWithdrawal = () => {
        const amount = Number(withdrawAmount);
        if (amount > 0 && amount <= balance) {
            setBalance(balance - amount);
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setError('');
        } else if (amount > balance) {
            setError('Withdrawal amount cannot exceed your balance.');
        } else {
            setError('Please enter a valid amount.');
        }
    };

    // --- MODAL COMPONENTS ---
    const SetAccountModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-lg font-bold text-black mb-4">Set Withdrawal Account</h2>
                <p className="text-xs text-gray-600 mb-4">You need to add a bank account before you can withdraw funds.</p>
                <div className="space-y-3">
                    <input type="text" placeholder="Bank Name (e.g., Chase)" value={newAccount.bank} onChange={(e) => setNewAccount({...newAccount, bank: e.target.value})} className="w-full p-2 text-sm border rounded-md"/>
                    <input type="text" placeholder="Account Number" value={newAccount.number} onChange={(e) => setNewAccount({...newAccount, number: e.target.value})} className="w-full p-2 text-sm border rounded-md"/>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowSetAccountModal(false)} className="px-4 py-2 text-sm rounded-md cursor-pointer bg-gray-200 text-black">Cancel</button>
                    <button onClick={handleSaveAccount} className="px-4 py-2 text-sm rounded-md cursor-pointer text-white" style={{ backgroundColor: '#083A85' }}>Save Account</button>
                </div>
            </div>
        </div>
    );

    const WithdrawModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-lg font-bold text-black mb-2">Withdraw Funds</h2>
                <div className="text-xs bg-gray-100 p-2 rounded-md mb-4">
                    <p className="font-semibold text-gray-800">To: {withdrawalAccounts[0]?.bank}</p>
                    <p className="text-gray-600">Acct: ****{withdrawalAccounts[0]?.number.slice(-4)}</p>
                </div>
                <label className="text-xs font-medium text-gray-600">Amount to withdraw</label>
                <input type="number" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full p-2 text-2xl font-bold border-b-2 border-gray-300 focus:border-pink-500 outline-none"/>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowWithdrawModal(false)} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-black">Cancel</button>
                    <button onClick={handleConfirmWithdrawal} className="px-4 py-2 text-sm rounded-md text-white" style={{ backgroundColor: '#F20C8F' }}>Confirm Withdrawal</button>
                </div>
            </div>
        </div>
    );

    // --- RENDER ---
    return (
        <div className="mt-20">
            {showSetAccountModal && <SetAccountModal />}
            {showWithdrawModal && <WithdrawModal />}
            <div className="max-w-7xl mx-auto">
               
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                    {/* Balance Card */}
                    <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-md flex flex-col justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Available Balance</p>
                            <p className="text-3xl font-bold text-black">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <button onClick={handleWithdrawClick} className="w-full mt-3 py-2 text-sm cursor-pointer font-semibold text-white rounded-lg" style={{backgroundColor: '#083A85'}}>
                            <i className="bi bi-send mr-2"></i>Withdraw Funds
                        </button>
                    </div>
                    {/* Summary Cards */}
                    <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
                                <p className="text-xl font-bold text-black">${summaryData.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: '#F20C8F' }}><i className="bi bi-cash-stack text-white text-xl"></i></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">YTD Profit</p>
                                <p className="text-xl font-bold text-black">${summaryData.ytdProfit.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: '#083A85' }}><i className="bi bi-graph-up-arrow text-white text-xl"></i></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Occupancy Rate</p>
                                <p className="text-xl font-bold text-black">{summaryData.occupancyRate}%</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800"><i className="bi bi-house-check text-white text-xl"></i></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-base font-semibold text-black mb-2">Earnings Over Time</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyEarningsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '8px', fontSize: '12px', color: 'white' }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                <Legend wrapperStyle={{fontSize: "12px"}} /><Area type="monotone" dataKey="revenue" stackId="1" stroke="#F20C8F" fill="#F20C8F" fillOpacity={0.8} />
                                <Area type="monotone" dataKey="profit" stackId="1" stroke="#083A85" fill="#083A85" fillOpacity={0.9} />
                            </AreaChart></ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-base font-semibold text-black mb-2">Revenue by Property</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={propertyRevenueData} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: '8px', fontSize: '12px' }} />
                                <Bar dataKey="revenue" fill="#F20C8F" radius={[0, 8, 8, 0]} barSize={12} />
                            </BarChart></ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 bg-white p-4 rounded-xl shadow-md">
                     <h2 className="text-base font-semibold text-black mb-2">Recent Payouts</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="p-2 text-xs font-semibold text-gray-500">Transaction ID</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500">Property</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500">Date</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500 text-right">Amount</th>
                                    <th className="p-2 text-xs font-semibold text-gray-500 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-2 text-xs text-black font-mono">{tx.id}</td>
                                        <td className="p-2 text-xs text-gray-700">{tx.property}</td>
                                        <td className="p-2 text-xs text-gray-700">{tx.date}</td>
                                        <td className="p-2 text-xs text-black font-medium text-right">${tx.amount.toFixed(2)}</td>
                                        <td className="p-2 text-xs text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ tx.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                                                {tx.status}
                                            </span>
                                        </td>
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

export default HostEarnings;
