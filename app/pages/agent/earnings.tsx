'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '@/app/api/apiService';

// --- TYPE DEFINITIONS ---
type MonthlyCommission = {
  month: string;
  properties: number;
};

type TopPerformer = {
  name: string;
  commission: number;
  type: 'Property';
};

type CommissionStatement = {
  id: string;
  source: string;
  type: 'Property';
  date: string;
  commission: number;
};

type SummaryData = {
  totalCommission: number;
  fromProperties: number;
};

type WithdrawalAccount = {
    id: string;
    bank: string;
    number: string;
};

const KYCPendingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
            <i className="bi bi-hourglass-split text-2xl text-yellow-600"></i>
          </div>
          <h3 className="text-xl font-semibold text-center text-gray-900 mb-3">
            KYC Verification Pending
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Your account verification is currently being processed. Please wait for verification to complete before performing this action. This process typically takes 2-4 hours.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#083A85]/80 transition-colors font-medium cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- AGENT EARNINGS COMPONENT ---
const Earnings = () => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState({ 
    summary: true, 
    charts: true, 
    statements: true 
  });
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalCommission: 0,
    fromProperties: 0,
  });
  const [balance, setBalance] = useState(0);
  const [monthlyCommissionData, setMonthlyCommissionData] = useState<MonthlyCommission[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [commissionStatements, setCommissionStatements] = useState<CommissionStatement[]>([]);

  // Modals & Withdrawal state
  const [showSetAccountModal, setShowSetAccountModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<WithdrawalAccount[]>([]);
  const [newAccount, setNewAccount] = useState({ bank: '', number: '' });
  const [withdrawAmount, setWithdrawAmount] = useState<number | string>('');
  const [modalError, setModalError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  const checkKYCStatus = (): boolean => {
    if (!user || !user.kycCompleted || user.kycStatus !== 'approved') {
      setShowKYCModal(true);
      return false;
    }
    return true;
  };

  const handleWithdrawWithKYC = () => {
    if (!checkKYCStatus()) return;
    handleWithdrawClick();
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        api.setAuth(token);
        const response = await api.get('/auth/me');
        if (response.data) {
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // --- MAIN DATA FETCHING EFFECT ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setError(null);
        
        // Fetch user data for KYC
        await fetchUserData();
        
        // Use existing endpoints that work
        const [transactionsRes, walletRes] = await Promise.all([
          api.get('/payments/transactions'), // Agent transactions
          api.get('/payments/wallet'), // Wallet/balance info
        ]);

        // Process Wallet data for balance
        if (walletRes.data && walletRes.data.success) {
          const walletData = walletRes.data.data;
          setBalance(walletData.balance || walletData.availableBalance || 0);
        }

        // Process Transactions for all calculations
        if (transactionsRes.data && transactionsRes.data.success) {
          const transactions = transactionsRes.data.data.transactions || [];
          
          // Filter commission transactions
          const commissionTransactions = transactions.filter(
            (tx: any) => tx.type === 'commission' || tx.category === 'commission' || 
                        tx.description?.toLowerCase().includes('commission') ||
                        tx.description?.toLowerCase().includes('referral') ||
                        tx.amount > 0 // Positive amounts could be earnings
          );

          // Calculate summary data from transactions
          let totalCommission = 0;
          let fromProperties = 0;

          // Process monthly data
          const monthlyData: { [key: string]: { properties: number } } = {};
          const performersMap: { [key: string]: { commission: number; type: 'Property' } } = {};

          commissionTransactions.forEach((tx: any) => {
            const amount = Math.abs(tx.amount);
            totalCommission += amount;
            
            const isProperty = tx.description?.toLowerCase().includes('property') || 
                              tx.description?.toLowerCase().includes('villa') || 
                              tx.description?.toLowerCase().includes('apartment') ||
                              tx.description?.toLowerCase().includes('house') ||
                              tx.description?.toLowerCase().includes('rental') ||
                              tx.description?.toLowerCase().includes('commission') ||
                              tx.description?.toLowerCase().includes('referral') ||
                              true; // Default all transactions to property type

            if (isProperty) {
              fromProperties += amount;
            }

            // Process monthly data
            const date = new Date(tx.date || tx.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { properties: 0 };
            }

            monthlyData[monthKey].properties += amount;

            // Process top performers data
            const sourceName = tx.description || tx.reference || `Transaction ${tx.id}`;
            if (!performersMap[sourceName]) {
              performersMap[sourceName] = { 
                commission: 0, 
                type: 'Property'
              };
            }
            performersMap[sourceName].commission += amount;
          });

          // Update summary data
          setSummaryData({
            totalCommission,
            fromProperties,
          });
          setLoading(prev => ({ ...prev, summary: false }));

          // Convert monthly data to array format
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyArray = months.map(month => ({
            month,
            properties: monthlyData[month]?.properties || 0,
          }));

          // Convert performers data to array and sort
          const performersArray = Object.entries(performersMap)
            .map(([name, data]) => ({
              name,
              commission: data.commission,
              type: data.type,
            }))
            .sort((a: { commission: number }, b: { commission: number }) => b.commission - a.commission)
            .slice(0, 5);

          // Create commission statements
          const statements = commissionTransactions
            .sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
            .slice(0, 10)
            .map((tx: any) => ({
              id: tx.id,
              source: tx.description || tx.reference || 'Commission Payment',
              type: 'Property' as 'Property',
              date: new Date(tx.date || tx.createdAt).toISOString().split('T')[0],
              commission: Math.abs(tx.amount),
            }));

          setMonthlyCommissionData(monthlyArray);
          setTopPerformers(performersArray);
          setCommissionStatements(statements);
        }
        
        setLoading(prev => ({ ...prev, charts: false, statements: false }));

        // For now, set withdrawal accounts as empty since these endpoints don't exist yet
        setWithdrawalAccounts([]);

      } catch (err: any) {
        console.error('Error fetching agent earnings data:', err);
        setError(err.response?.data?.message || 'An error occurred while loading your earnings data.');
        setLoading({ summary: false, charts: false, statements: false });
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
          setShowWithdrawModal(true);
        } else {
          setModalError(response.data.message || 'Could not save account.');
        }
      } catch (err: any) {
        setModalError(err.response?.data?.message || 'Withdrawal accounts endpoint not implemented yet.');
      }
    }
  };

  const handleConfirmWithdrawal = async () => {
    const amount = Number(withdrawAmount);
    if (amount > 0 && amount <= balance) {
      try {
        // Use a more generic withdrawal endpoint
        const response = await api.post('/payments/withdraw', {
          amount,
          accountId: withdrawalAccounts[0].id,
          type: 'agent_commission'
        });

        if (response.data && response.data.success) {
          setBalance(response.data.data.newBalance || (balance - amount));
          setShowWithdrawModal(false);
          setWithdrawAmount('');
          setModalError('');
        } else {
          setModalError(response.data?.message || 'Withdrawal failed.');
        }
      } catch (err: any) {
        setModalError(err.response?.data?.message || 'Withdrawal endpoint not implemented yet.');
      }
    } else if (amount > balance) {
      setModalError('Withdrawal amount cannot exceed your balance.');
    } else {
      setModalError('Please enter a valid amount.');
    }
  };

  // --- ERROR STATE ---
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
          <input 
            type="text" 
            placeholder="Bank Name (e.g., Chase)" 
            value={newAccount.bank} 
            onChange={(e) => setNewAccount({...newAccount, bank: e.target.value})} 
            className="w-full p-2 text-sm border rounded-md"
          />
          <input 
            type="text" 
            placeholder="Account Number" 
            value={newAccount.number} 
            onChange={(e) => setNewAccount({...newAccount, number: e.target.value})} 
            className="w-full p-2 text-sm border rounded-md"
          />
        </div>
        {modalError && <p className="text-red-500 text-xs mt-2">{modalError}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button 
            onClick={() => setShowSetAccountModal(false)} 
            className="px-4 py-2 text-sm rounded-md cursor-pointer bg-gray-200 text-black"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveAccount} 
            className="px-4 py-2 text-sm rounded-md cursor-pointer text-white" 
            style={{ backgroundColor: '#083A85' }}
          >
            Save Account
          </button>
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
        <input 
          type="number" 
          placeholder="0.00" 
          value={withdrawAmount} 
          onChange={(e) => setWithdrawAmount(e.target.value)} 
          className="w-full p-2 text-2xl font-bold border-b-2 border-gray-300 focus:border-pink-500 outline-none"
        />
        {modalError && <p className="text-red-500 text-xs mt-2">{modalError}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button 
            onClick={() => setShowWithdrawModal(false)} 
            className="px-4 py-2 text-sm rounded-md bg-gray-200 text-black cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmWithdrawal} 
            className="px-4 py-2 text-sm rounded-md text-white cursor-pointer" 
            style={{ backgroundColor: '#F20C8F' }}
          >
            Confirm Withdrawal
          </button>
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#083A85]">Agent Earnings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          {/* Balance Card */}
          <div className="md:col-span-1 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105 flex flex-col justify-between">
            {loading.summary ? <div className="h-full bg-gray-200 animate-pulse rounded-md"></div> :
            (<>
              <div>
                <p className="text-sm sm:text-base text-gray-600">Available Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  ${balance.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
              <button 
                onClick={handleWithdrawWithKYC} 
                className="w-full mt-3 py-2 text-sm cursor-pointer font-semibold text-white rounded-lg" 
                style={{backgroundColor: '#083A85'}}
              >
                <i className="bi bi-send mr-2"></i>Withdraw Funds
              </button>
            </>)}
          </div>
          
          {/* Summary Cards */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loading.summary ? (
              <>
                <div className="h-24 bg-gray-200 animate-pulse rounded-xl shadow-md"></div>
                <div className="h-24 bg-gray-200 animate-pulse rounded-xl shadow-md"></div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105 flex items-center justify-between">
                  <div>
                    <p className="text-sm sm:text-base text-gray-600">Total Commission</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      ${summaryData.totalCommission.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 flex items-center justify-center rounded-full" 
                    style={{ backgroundColor: '#F20C8F' }}
                  >
                    <i className="bi bi-cash-stack text-white text-xl"></i>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105 flex items-center justify-between">
                  <div>
                    <p className="text-sm sm:text-base text-gray-600">From Properties</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      ${summaryData.fromProperties.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 flex items-center justify-center rounded-full" 
                    style={{ backgroundColor: '#083A85' }}
                  >
                    <i className="bi bi-building text-white text-xl"></i>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Commission Sources Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
            <h2 className="text-base font-semibold text-black mb-2">Monthly Property Commissions</h2>
            {loading.charts ? <div className="h-64 bg-gray-200 animate-pulse rounded-md"></div> :
              <div className="h-64">
                {monthlyCommissionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyCommissionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        tick={{ fontSize: 10 }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `${Number(value) / 1000}k`} 
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'black', 
                          border: 'none', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          color: 'white' 
                        }}
                        formatter={(value: number, name: string) => [
                          `${value.toLocaleString()}`, 
                          name.charAt(0).toUpperCase() + name.slice(1)
                        ]}
                      />
                      <Legend wrapperStyle={{fontSize: "12px"}} />
                      <Bar dataKey="properties" fill="#F20C8F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No commission data available
                  </div>
                )}
              </div>
            }
          </div>

          {/* Top Performing Sources */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
            <h2 className="text-base font-semibold text-black mb-2">Top Property Sources</h2>
            {loading.charts ? <div className="h-64 bg-gray-200 animate-pulse rounded-md"></div> :
              <div className="h-64">
                {topPerformers.length > 0 ? (
                  <div className="space-y-4">
                    {topPerformers.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate pr-2">{item.name}</p>
                          <p className="text-sm font-bold text-black">${item.commission.toLocaleString()}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((item.commission / Math.max(...topPerformers.map(p => p.commission))) * 100, 100)}%`,
                              backgroundColor: '#F20C8F'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No performance data available
                  </div>
                )}
              </div>
            }
          </div>
        </div>
        
        {/* Commission Statements Table */}
        <div className="mt-4 bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
          <h2 className="text-base font-semibold text-black mb-2">Commission Statements</h2>
          {loading.statements ? <div className="h-48 bg-gray-200 animate-pulse rounded-md"></div> :
            <div className="overflow-x-auto">
              {commissionStatements.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-2 text-xs font-semibold text-gray-500">Statement ID</th>
                      <th className="p-2 text-xs font-semibold text-gray-500">Source</th>
                      <th className="p-2 text-xs font-semibold text-gray-500">Type</th>
                      <th className="p-2 text-xs font-semibold text-gray-500">Date</th>
                      <th className="p-2 text-xs font-semibold text-gray-500 text-right">Commission Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionStatements.map((stmt) => (
                      <tr key={stmt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 text-xs text-black font-mono">{stmt.id}</td>
                        <td className="p-2 text-xs text-gray-700">{stmt.source}</td>
                        <td className="p-2 text-xs">
                          <span className="text-xs font-bold text-[#F20C8F]">
                            {stmt.type}
                          </span>
                        </td>
                        <td className="p-2 text-xs text-gray-700">{stmt.date}</td>
                        <td className="p-2 text-xs text-black font-medium text-right">
                          ${stmt.commission.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No commission statements available
                </div>
              )}
            </div>
          }
        </div>
      </div>
      <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
    </div>
  );
};

export default Earnings;