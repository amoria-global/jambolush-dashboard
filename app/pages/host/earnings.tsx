'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/app/api/apiService'; // Assuming apiService is in this path

// --- TYPE DEFINITIONS (aligned with potential API responses) ---
type EarningsSummary = {
    availableBalance: number;
    totalRevenue: number;
    ytdProfit: number;
    occupancyRate: number;
};

type MonthlyEarning = {
  month: string;
  revenue: number;
  profit: number;
};

type PropertyRevenue = {
  name: string;
  revenue: number;
};

type PayoutTransaction = {
  id: string;
  property: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
};

type WithdrawalAccount = {
    id: string; // Added ID for backend reference
    bank: string;
    number: string;
};

// --- API METHOD STUBS (to be added to apiService.ts) ---
/*
  Note: These methods would need to be implemented in the actual `apiService.ts` file.
  This demonstrates how the frontend component would consume them.

  class FrontendAPIService {
    ...
    // GET /host/earnings/summary
    async getHostEarningsSummary(): Promise<APIResponse<BackendResponse<EarningsSummary>>> {
      return this.get<BackendResponse<EarningsSummary>>('/host/earnings/summary');
    }

    // GET /host/earnings/monthly
    async getHostMonthlyEarnings(): Promise<APIResponse<BackendResponse<MonthlyEarning[]>>> {
      return this.get<BackendResponse<MonthlyEarning[]>>('/host/earnings/monthly');
    }

    // GET /host/earnings/by-property
    async getHostPropertyRevenue(): Promise<APIResponse<BackendResponse<PropertyRevenue[]>>> {
      return this.get<BackendResponse<PropertyRevenue[]>>('/host/earnings/by-property');
    }

    // GET /host/earnings/payouts
    async getHostPayouts(): Promise<APIResponse<BackendResponse<PayoutTransaction[]>>> {
      return this.get<BackendResponse<PayoutTransaction[]>>('/host/earnings/payouts');
    }
    
    // GET /users/withdrawal-accounts
    async getWithdrawalAccounts(): Promise<APIResponse<BackendResponse<WithdrawalAccount[]>>> {
        return this.get<BackendResponse<WithdrawalAccount[]>>('/users/withdrawal-accounts');
    }

    // POST /users/withdrawal-accounts
    async addWithdrawalAccount(accountData: { bank: string, number: string }): Promise<APIResponse<BackendResponse<WithdrawalAccount>>> {
        return this.post<BackendResponse<WithdrawalAccount>>('/users/withdrawal-accounts', accountData);
    }
    
    // POST /host/earnings/withdraw
    async requestWithdrawal(withdrawalData: { amount: number, accountId: string }): Promise<APIResponse<BackendResponse<{ newBalance: number }>>> {
        return this.post<BackendResponse<{ newBalance: number }>>('/host/earnings/withdraw', withdrawalData);
    }
    ...
  }
*/


// --- HOST EARNINGS COMPONENT ---
const HostEarnings = () => {
    // --- STATE MANAGEMENT ---
    const [summaryData, setSummaryData] = useState<Omit<EarningsSummary, 'availableBalance'>>({ totalRevenue: 0, ytdProfit: 0, occupancyRate: 0 });
    const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
    const [propertyRevenue, setPropertyRevenue] = useState<PropertyRevenue[]>([]);
    const [recentPayouts, setRecentPayouts] = useState<PayoutTransaction[]>([]);
    const [balance, setBalance] = useState(0);

    const [loading, setLoading] = useState({ summary: true, charts: true, payouts: true, accounts: true });
    const [error, setError] = useState<string | null>(null);

    // Modals & Withdrawal state
    const [showSetAccountModal, setShowSetAccountModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawalAccounts, setWithdrawalAccounts] = useState<WithdrawalAccount[]>([]);
    const [newAccount, setNewAccount] = useState({ bank: '', number: '' });
    const [withdrawAmount, setWithdrawAmount] = useState<number | string>('');
    const [modalError, setModalError] = useState('');

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch all data points in parallel
                const [summaryRes, monthlyRes, propertyRes, payoutsRes, accountsRes] = await Promise.all([
                    api.get('/host/earnings/summary'),
                    api.get('/host/earnings/monthly'),
                    api.get('/host/earnings/by-property'),
                    api.get('/host/earnings/payouts'),
                    api.get('/users/withdrawal-accounts')
                ]);

                // Process Summary Data
                if (summaryRes.data.success) {
                    setSummaryData(summaryRes.data.data);
                    setBalance(summaryRes.data.data.availableBalance);
                }
                setLoading(prev => ({ ...prev, summary: false }));

                // Process Chart Data
                if (monthlyRes.data.success) setMonthlyEarnings(monthlyRes.data.data);
                if (propertyRes.data.success) setPropertyRevenue(propertyRes.data.data);
                setLoading(prev => ({ ...prev, charts: false }));
                
                // Process Payouts Data
                if (payoutsRes.data.success) setRecentPayouts(payoutsRes.data.data);
                setLoading(prev => ({ ...prev, payouts: false }));

                // Process Withdrawal Accounts
                if (accountsRes.data.success) setWithdrawalAccounts(accountsRes.data.data);
                setLoading(prev => ({ ...prev, accounts: false }));

            } catch (err: any) {
                console.error("Failed to fetch earnings data:", err);
                setError(err.response?.data?.message || 'An error occurred while loading your earnings data.');
                setLoading({ summary: false, charts: false, payouts: false, accounts: false });
            }
        };

        fetchAllData();
    }, []);


    // --- EVENT HANDLERS ---
    const handleWithdrawClick = () => {
        setModalError('');
        if (withdrawalAccounts.length === 0) {
            setShowSetAccountModal(true);
        } else {
            setWithdrawAmount('');
            setShowWithdrawModal(true);
        }
    };

    const handleSaveAccount = async () => {
        if (newAccount.bank && newAccount.number) {
            try {
                const response = await api.post('/users/withdrawal-accounts', newAccount);
                if (response.data.success) {
                    setWithdrawalAccounts([...withdrawalAccounts, response.data.data]);
                    setNewAccount({ bank: '', number: '' });
                    setShowSetAccountModal(false);
                    setShowWithdrawModal(true); // Automatically open withdraw modal
                } else {
                    setModalError(response.data.message || 'Could not save account.');
                }
            } catch (err: any) {
                setModalError(err.response?.data?.message || 'An error occurred.');
            }
        }
    };

    const handleConfirmWithdrawal = async () => {
        const amount = Number(withdrawAmount);
        if (amount > 0 && amount <= balance) {
            try {
                const response = await api.post('/host/earnings/withdraw', {
                    amount,
                    accountId: withdrawalAccounts[0].id
                });

                if (response.data.success) {
                    setBalance(response.data.data.newBalance);
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setModalError('');
                    // Optionally, refresh payouts list
                    // const payoutsRes = await api.get('/host/earnings/payouts');
                    // if (payoutsRes.data.success) setRecentPayouts(payoutsRes.data.data);
                } else {
                    setModalError(response.data.message || 'Withdrawal failed.');
                }
            } catch (err: any) {
                setModalError(err.response?.data?.message || 'An error occurred.');
            }
        } else if (amount > balance) {
            setModalError('Withdrawal amount cannot exceed your balance.');
        } else {
            setModalError('Please enter a valid amount.');
        }
    };

    // --- RENDER LOGIC ---
    if (error) {
        return <div className="mt-20 text-center text-red-500">{error}</div>;
    }

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
                {modalError && <p className="text-red-500 text-xs mt-2">{modalError}</p>}
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
                {modalError && <p className="text-red-500 text-xs mt-2">{modalError}</p>}
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
                        {loading.summary ? <div className="h-full bg-gray-200 animate-pulse rounded-md"></div> :
                        (<>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Available Balance</p>
                                <p className="text-3xl font-bold text-black">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <button onClick={handleWithdrawClick} className="w-full mt-3 py-2 text-sm cursor-pointer font-semibold text-white rounded-lg" style={{backgroundColor: '#083A85'}}>
                                <i className="bi bi-send mr-2"></i>Withdraw Funds
                            </button>
                        </>)}
                    </div>
                    {/* Summary Cards */}
                    <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {loading.summary ? (
                            <>
                                <div className="h-24 bg-gray-200 animate-pulse rounded-xl shadow-md"></div>
                                <div className="h-24 bg-gray-200 animate-pulse rounded-xl shadow-md"></div>
                                <div className="h-24 bg-gray-200 animate-pulse rounded-xl shadow-md"></div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-base font-semibold text-black mb-2">Earnings Over Time</h2>
                        {loading.charts ? <div className="h-64 bg-gray-200 animate-pulse rounded-md"></div> :
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyEarnings} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: 'black', border: 'none', borderRadius: '8px', fontSize: '12px', color: 'white' }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                    <Legend wrapperStyle={{fontSize: "12px"}} /><Area type="monotone" dataKey="revenue" stackId="1" stroke="#F20C8F" fill="#F20C8F" fillOpacity={0.8} />
                                    <Area type="monotone" dataKey="profit" stackId="1" stroke="#083A85" fill="#083A85" fillOpacity={0.9} />
                                </AreaChart></ResponsiveContainer>
                            </div>
                        }
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-base font-semibold text-black mb-2">Revenue by Property</h2>
                        {loading.charts ? <div className="h-64 bg-gray-200 animate-pulse rounded-md"></div> :
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%"><BarChart data={propertyRevenue} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => `$${value.toLocaleString()}`}/>
                                    <Bar dataKey="revenue" fill="#F20C8F" radius={[0, 8, 8, 0]} barSize={12} />
                                </BarChart></ResponsiveContainer>
                            </div>
                        }
                    </div>
                </div>
                
                <div className="mt-4 bg-white p-4 rounded-xl shadow-md">
                     <h2 className="text-base font-semibold text-black mb-2">Recent Payouts</h2>
                     {loading.payouts ? <div className="h-48 bg-gray-200 animate-pulse rounded-md"></div> :
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
                                   {recentPayouts.map((tx) => (
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
                     }
                </div>
            </div>
        </div>
    );
};

export default HostEarnings;