'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/api/apiService';

interface UnifiedEarningsProps {
  userType: 'agent' | 'host' | 'tourguide';
}

interface WalletData {
  id: string;
  userId: number;
  balance: number;
  pendingBalance: number;
  currency: string;
  totalBalance: number;
  availableBalance: number;
  walletNumber?: string;
  accountNumber?: string;
}

interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description?: string;
  createdAt: string;
}

interface WithdrawalMethod {
  id: string;
  userId: number;
  methodType: string;
  accountName: string;
  accountDetails: any;
  isDefault: boolean;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionStats {
  totalIncome: number;
  totalWithdrawals: number;
  pendingAmount: number;
  transactionCount: number;
  averageTransaction: number;
}

interface WithdrawalRequest {
  id: string;
  userId: number;
  amount: number;
  withdrawalMethodId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  reference?: string;
  notes?: string;
  withdrawalMethod?: WithdrawalMethod;
}

interface AccountFormat {
  label: string;
  placeholder: string;
  example: string;
  minLength: number;
  maxLength: number;
  pattern?: string;
}

interface WithdrawalProvider {
  id: string;
  code: string;
  name: string;
  type: 'BANK' | 'MOBILE_MONEY';
  country: string;
  currency: string;
  active: boolean;
  accountFormat: AccountFormat;
  logo?: string;
  color?: string;
  fees?: {
    withdrawalFee: string;
    note: string;
  };
  supportsDeposits?: boolean;
  supportsPayouts?: boolean;
}

interface AvailableProvidersResponse {
  success: boolean;
  country: string;
  countryName: string;
  currency: string;
  count: number;
  data: {
    banks: WithdrawalProvider[];
    mobileMoney: WithdrawalProvider[];
    all: WithdrawalProvider[];
  };
  summary: {
    totalProviders: number;
    banks: number;
    mobileMoney: number;
  };
}

const UnifiedEarnings: React.FC<UnifiedEarningsProps> = ({ userType }) => {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);

  // Wallet & Account Data
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);

  // Available Providers
  const [availableProviders, setAvailableProviders] = useState<WithdrawalProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdrawals' | 'methods'>('overview');

  // Withdrawal Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  // Add Withdrawal Method Modal
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState({
    methodType: 'MOBILE_MONEY' as 'BANK' | 'MOBILE_MONEY',
    providerId: '',
    accountNumber: '',
    accountName: '',
    provider: null as WithdrawalProvider | null
  });

  // Transaction Filters
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    const uid = user.id || user.userId;
    if (uid) {
      setUserId(uid);
      fetchAllData(uid);
    }
    // Fetch available providers
    fetchAvailableProviders();
  }, []);

  const fetchAvailableProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await api.get('/transactions/withdrawal-methods/rwanda');
      if (response.data.success) {
        setAvailableProviders(response.data.data.all || []);
      }
    } catch (err) {
      console.error('Error fetching available providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchAllData = async (uid: number) => {
    try {
      setLoading(true);

      // Fetch wallet data
      const walletResponse = await api.get(`/transactions/wallet/${uid}`);
      if (walletResponse.data.success) {
        setWalletData(walletResponse.data.data);
      }

      // Fetch transaction history
      const historyResponse = await api.get(`/transactions/wallet/${uid}/history`);
      if (historyResponse.data.success) {
        setTransactions(historyResponse.data.data || []);

        // Calculate stats from transactions
        const txs = historyResponse.data.data || [];
        const income = txs.filter((t: Transaction) => t.type === 'CREDIT').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const withdrawals = txs.filter((t: Transaction) => t.type === 'DEBIT').reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

        setStats({
          totalIncome: income,
          totalWithdrawals: withdrawals,
          pendingAmount: walletResponse.data.data?.pendingBalance || 0,
          transactionCount: txs.length,
          averageTransaction: txs.length > 0 ? (income + withdrawals) / txs.length : 0
        });
      }

      // Fetch withdrawal methods
      const methodsResponse = await api.get(`/transactions/withdrawal-methods/${uid}`);
      if (methodsResponse.data.success) {
        setWithdrawalMethods(methodsResponse.data.data || []);
        // Set first default method as selected
        const defaultMethod = methodsResponse.data.data.find((m: WithdrawalMethod) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id);
        }
      }

      // Fetch withdrawal requests - mock data for now since endpoint might not exist yet
      // TODO: Replace with actual API call when endpoint is available
      // const requestsResponse = await api.get(`/transactions/withdrawals/${uid}`);
      // For now, create mock withdrawal requests from DEBIT transactions
      const mockRequests = historyResponse.data.data
        ?.filter((t: Transaction) => t.type === 'DEBIT' && t.description?.toLowerCase().includes('withdrawal'))
        .map((t: Transaction) => ({
          id: t.id,
          userId: uid,
          amount: Math.abs(t.amount),
          withdrawalMethodId: '',
          status: 'completed' as const,
          requestedAt: t.createdAt,
          processedAt: t.createdAt,
          reference: t.reference,
          notes: t.description
        })) || [];

      setWithdrawalRequests(mockRequests);

      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWithdrawalMethod = async () => {
    if (!userId || !newMethod.providerId || !newMethod.accountNumber || !newMethod.accountName) {
      alert('Please fill in all required fields');
      return;
    }

    if (!newMethod.provider) {
      alert('Please select a valid provider');
      return;
    }

    // Validate account number using provider's pattern
    if (newMethod.provider.accountFormat.pattern) {
      const pattern = new RegExp(newMethod.provider.accountFormat.pattern);
      if (!pattern.test(newMethod.accountNumber)) {
        alert(`Invalid ${newMethod.provider.accountFormat.label}. ${newMethod.provider.accountFormat.example ? `Example: ${newMethod.provider.accountFormat.example}` : ''}`);
        return;
      }
    }

    // Validate length
    if (newMethod.accountNumber.length < newMethod.provider.accountFormat.minLength ||
        newMethod.accountNumber.length > newMethod.provider.accountFormat.maxLength) {
      alert(`${newMethod.provider.accountFormat.label} must be between ${newMethod.provider.accountFormat.minLength} and ${newMethod.provider.accountFormat.maxLength} characters`);
      return;
    }

    try {
      const response = await api.post('/transactions/withdrawal-methods', {
        userId,
        methodType: newMethod.methodType,
        accountName: newMethod.accountName,
        accountDetails: {
          providerId: newMethod.provider.id,
          providerName: newMethod.provider.name,
          providerCode: newMethod.provider.code,
          accountNumber: newMethod.accountNumber,
          accountType: newMethod.methodType,
          country: newMethod.provider.country,
          currency: newMethod.provider.currency,
          ...(newMethod.methodType === 'MOBILE_MONEY' ? { phoneNumber: newMethod.accountNumber } : {}),
          ...(newMethod.methodType === 'BANK' ? { bankAccountNumber: newMethod.accountNumber } : {})
        },
        isDefault: withdrawalMethods.length === 0 // Set as default if it's the first method
      });

      if (response.data.success) {
        setWithdrawalMethods([...withdrawalMethods, response.data.data]);
        setShowAddMethodModal(false);
        setNewMethod({
          methodType: 'MOBILE_MONEY',
          providerId: '',
          accountNumber: '',
          accountName: '',
          provider: null
        });

        // If it's the first method, set it as selected
        if (withdrawalMethods.length === 0) {
          setSelectedMethod(response.data.data.id);
        }

        alert(response.data.message);
      }
    } catch (err: any) {
      console.error('Error adding withdrawal method:', err);
      alert(err.response?.data?.message || err.message || 'Failed to add withdrawal method');
    }
  };

  const handleWithdraw = async () => {
    if (!userId || !withdrawAmount || !selectedMethod) {
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (walletData && amount > walletData.availableBalance) {
      alert('Insufficient balance');
      return;
    }

    try {
      // Create a withdrawal request
      const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod);

      // Create new withdrawal request
      const newRequest: WithdrawalRequest = {
        id: `WR${Date.now()}`,
        userId,
        amount,
        withdrawalMethodId: selectedMethod,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        withdrawalMethod: selectedMethodData,
        notes: `Withdrawal to ${selectedMethodData?.accountDetails?.provider} - ${selectedMethodData?.accountDetails?.phoneNumber}`
      };

      // Add to state
      setWithdrawalRequests([newRequest, ...withdrawalRequests]);

      alert(`Withdrawal request for ${amount} ${walletData?.currency} submitted successfully! It will be processed within 24 hours.`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setActiveTab('withdrawals');

      // TODO: In production, call actual API endpoint
      // const response = await api.post('/transactions/withdrawals', {
      //   userId,
      //   amount,
      //   withdrawalMethodId: selectedMethod
      // });

      // Refresh data
      if (userId) {
        fetchAllData(userId);
      }
    } catch (err: any) {
      console.error('Error processing withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to process withdrawal');
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      const response = await api.put(`/transactions/withdrawal-methods/${methodId}/set-default`);
      if (response.data.success) {
        setWithdrawalMethods(
          withdrawalMethods.map(m => ({
            ...m,
            isDefault: m.id === methodId
          }))
        );
        setSelectedMethod(methodId);
      }
    } catch (err: any) {
      console.error('Error setting default method:', err);
    }
  };

  const deleteMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this withdrawal method?')) {
      return;
    }

    try {
      const response = await api.delete(`/transactions/withdrawal-methods/${methodId}`);
      if (response.data.success) {
        setWithdrawalMethods(withdrawalMethods.filter(m => m.id !== methodId));
        if (selectedMethod === methodId) {
          setSelectedMethod('');
        }
      }
    } catch (err: any) {
      console.error('Error deleting method:', err);
      alert(err.response?.data?.message || 'Failed to delete withdrawal method');
    }
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (transactionFilter !== 'all') {
      filtered = filtered.filter(t => t.type === transactionFilter);
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.createdAt) >= sevenDaysAgo);
    } else if (dateRange === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
    }

    return filtered;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${walletData?.currency || 'RWF'}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'CREDIT': 'bi-arrow-down-circle',
      'DEBIT': 'bi-arrow-up-circle',
      'COMMISSION': 'bi-cash-coin',
      'REFUND': 'bi-arrow-counterclockwise',
      'PAYMENT': 'bi-credit-card'
    };
    return icons[type] || 'bi-arrow-left-right';
  };

  const getTransactionColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'CREDIT': 'text-green-600',
      'DEBIT': 'text-red-600',
      'COMMISSION': 'text-blue-600',
      'REFUND': 'text-orange-600',
      'PAYMENT': 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const getWithdrawalStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'processing': 'bg-blue-100 text-blue-700 border-blue-200',
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'failed': 'bg-red-100 text-red-700 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getWithdrawalStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      'pending': 'bi-clock-history',
      'processing': 'bi-arrow-repeat',
      'completed': 'bi-check-circle-fill',
      'failed': 'bi-x-circle-fill',
      'cancelled': 'bi-dash-circle-fill'
    };
    return icons[status] || 'bi-circle';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <i className="bi bi-exclamation-triangle text-red-600 text-4xl mb-4" />
            <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => userId && fetchAllData(userId)}
              className="bg-[#083A85] text-white px-6 py-3 rounded-lg hover:bg-[#062d6b] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-5">
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Earnings & Wallet
          </h1>
          <p className="text-gray-600">
            Manage your earnings, transactions, and withdrawal methods
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="mb-8 bg-gradient-to-br from-[#083A85] to-[#062d6b] rounded-2xl p-8 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Total Balance</p>
              <h2 className="text-4xl font-bold">
                {formatCurrency(walletData?.totalBalance || 0)}
              </h2>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <i className="bi bi-wallet2 text-3xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white/70 text-xs mb-1">Available</p>
              <p className="text-xl font-semibold">
                {formatCurrency(walletData?.availableBalance || 0)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white/70 text-xs mb-1">Pending</p>
              <p className="text-xl font-semibold">
                {formatCurrency(walletData?.pendingBalance || 0)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!walletData || walletData.availableBalance <= 0 || withdrawalMethods.filter(m => m.isVerified).length === 0}
            className="w-full bg-white text-[#083A85] py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="bi bi-arrow-up-circle mr-2" />
            Withdraw Funds
          </button>
          {withdrawalMethods.filter(m => m.isVerified).length === 0 && (
            <p className="text-white/70 text-xs mt-2 text-center">
              Add and verify a withdrawal method to withdraw funds
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-[#083A85] border-b-2 border-[#083A85]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="bi bi-graph-up mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'text-[#083A85] border-b-2 border-[#083A85]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="bi bi-list-ul mr-2" />
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === 'withdrawals'
                  ? 'text-[#083A85] border-b-2 border-[#083A85]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="bi bi-cash-stack mr-2" />
              Withdrawals
              {withdrawalRequests.filter(r => r.status === 'pending' || r.status === 'processing').length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'methods'
                  ? 'text-[#083A85] border-b-2 border-[#083A85]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="bi bi-credit-card mr-2" />
              Methods
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-arrow-down-circle text-green-600 text-2xl" />
                  <span className="text-sm text-gray-500">Total Income</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalIncome || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-arrow-up-circle text-red-600 text-2xl" />
                  <span className="text-sm text-gray-500">Withdrawn</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalWithdrawals || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-clock-history text-orange-600 text-2xl" />
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.pendingAmount || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-bar-chart text-blue-600 text-2xl" />
                  <span className="text-sm text-gray-500">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.transactionCount || 0}
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {getFilteredTransactions().slice(0, 5).map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'CREDIT'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        <i className={`bi ${getTransactionIcon(transaction.type)} ${getTransactionColor(transaction.type)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description || transaction.type}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'CREDIT'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: {formatCurrency(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                ))}
                {getFilteredTransactions().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="bi bi-inbox text-4xl mb-2" />
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="CREDIT">Credits</option>
                <option value="DEBIT">Debits</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {getFilteredTransactions().map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.type === 'CREDIT'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      <i className={`bi ${getTransactionIcon(transaction.type)} text-xl ${getTransactionColor(transaction.type)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description || transaction.type}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      {transaction.reference && (
                        <p className="text-xs text-gray-400">Ref: {transaction.reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.type === 'CREDIT'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-xs text-gray-500">
                      After: {formatCurrency(transaction.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
              {getFilteredTransactions().length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <i className="bi bi-inbox text-5xl mb-3" />
                  <p className="text-lg font-medium">No transactions found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            {/* Withdrawals Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Withdrawal Requests</h2>
                <p className="text-sm text-gray-600 mt-1">Track your withdrawal requests and their status</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!walletData || walletData.availableBalance <= 0 || withdrawalMethods.filter(m => m.isVerified).length === 0}
                className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-plus-circle mr-2" />
                New Withdrawal
              </button>
            </div>

            {/* Withdrawal Requests List */}
            <div className="space-y-4">
              {withdrawalRequests.length > 0 ? (
                withdrawalRequests.map(request => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#083A85] to-[#062d6b] rounded-lg flex items-center justify-center">
                          <i className="bi bi-arrow-up-circle text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {formatCurrency(request.amount)}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.withdrawalMethod?.accountDetails?.provider || 'Mobile Money'} - {' '}
                            {request.withdrawalMethod?.accountDetails?.phoneNumber || request.withdrawalMethod?.accountName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {formatDate(request.requestedAt)}
                          </p>
                          {request.processedAt && request.status === 'completed' && (
                            <p className="text-xs text-gray-500">
                              Processed: {formatDate(request.processedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getWithdrawalStatusColor(request.status)}`}>
                          <i className={`bi ${getWithdrawalStatusIcon(request.status)}`} />
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.reference && (
                          <span className="text-xs text-gray-500">
                            Ref: {request.reference}
                          </span>
                        )}
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{request.notes}</p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                          <i className="bi bi-info-circle mt-0.5" />
                          <span>Your withdrawal is being reviewed and will be processed within 24 hours.</span>
                        </p>
                      </div>
                    )}

                    {request.status === 'processing' && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <i className="bi bi-arrow-repeat animate-spin mt-0.5" />
                          <span>Your withdrawal is currently being processed. Funds should arrive shortly.</span>
                        </p>
                      </div>
                    )}

                    {request.status === 'failed' && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800 flex items-start gap-2">
                          <i className="bi bi-exclamation-triangle mt-0.5" />
                          <span>This withdrawal failed. Please contact support or try again with a different method.</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <i className="bi bi-inbox text-5xl text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal Requests</h3>
                  <p className="text-sm text-gray-500 mb-6">You haven't made any withdrawal requests yet</p>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={!walletData || walletData.availableBalance <= 0 || withdrawalMethods.filter(m => m.isVerified).length === 0}
                    className="px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-plus-circle mr-2" />
                    Request Withdrawal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="space-y-6">
            {/* Add Method Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddMethodModal(true)}
                className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium"
              >
                <i className="bi bi-plus-circle mr-2" />
                Add Withdrawal Method
              </button>
            </div>

            {/* Withdrawal Methods List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {withdrawalMethods.map(method => (
                <div
                  key={method.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                    method.isDefault
                      ? 'border-[#083A85]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#083A85] to-[#062d6b] rounded-lg flex items-center justify-center">
                        <i className="bi bi-phone text-white text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {method.accountDetails?.provider || method.methodType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method.accountDetails?.phoneNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {method.isDefault && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Default
                        </span>
                      )}
                      {method.isVerified ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          <i className="bi bi-check-circle-fill mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                          <i className="bi bi-clock-history mr-1" />
                          {method.verificationStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{method.accountName}</p>

                  <div className="flex gap-2">
                    {!method.isDefault && method.isVerified && (
                      <button
                        onClick={() => setDefaultMethod(method.id)}
                        className="flex-1 px-3 py-2 text-sm border border-[#083A85] text-[#083A85] rounded-lg hover:bg-[#083A85] hover:text-white transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => deleteMethod(method.id)}
                      className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              ))}

              {withdrawalMethods.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <i className="bi bi-credit-card text-5xl text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No withdrawal methods yet</p>
                  <p className="text-sm text-gray-500 mb-4">Add a method to start withdrawing funds</p>
                  <button
                    onClick={() => setShowAddMethodModal(true)}
                    className="px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium"
                  >
                    Add Your First Method
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Withdraw Funds</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Method
                  </label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                  >
                    <option value="">Select method</option>
                    {withdrawalMethods.filter(m => m.isVerified).map(method => (
                      <option key={method.id} value={method.id}>
                        {method.accountDetails?.provider || method.methodType} - {method.accountDetails?.phoneNumber}
                      </option>
                    ))}
                  </select>
                  {withdrawalMethods.length > 0 && withdrawalMethods.filter(m => m.isVerified).length === 0 && (
                    <p className="text-sm text-yellow-600 mt-2">
                      <i className="bi bi-exclamation-triangle mr-1" />
                      No verified withdrawal methods available. Please wait for verification.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({walletData?.currency})
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Available: {formatCurrency(walletData?.availableBalance || 0)}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !selectedMethod}
                  className="flex-1 px-4 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Method Modal */}
        {showAddMethodModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h3 className="text-xl font-semibold text-gray-900">Add Withdrawal Method</h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Method Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewMethod({ ...newMethod, methodType: 'MOBILE_MONEY', providerId: '', accountNumber: '', provider: null })}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        newMethod.methodType === 'MOBILE_MONEY'
                          ? 'border-[#083A85] bg-blue-50 text-[#083A85]'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <i className="bi bi-phone mr-2" />
                      Mobile Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMethod({ ...newMethod, methodType: 'BANK', providerId: '', accountNumber: '', provider: null })}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        newMethod.methodType === 'BANK'
                          ? 'border-[#083A85] bg-blue-50 text-[#083A85]'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <i className="bi bi-bank mr-2" />
                      Bank
                    </button>
                  </div>
                </div>

                {/* Provider Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {newMethod.methodType === 'BANK' ? 'Bank' : 'Mobile Money Provider'} <span className="text-red-500">*</span>
                  </label>
                  {loadingProviders ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      Loading providers...
                    </div>
                  ) : (
                    <select
                      value={newMethod.providerId}
                      onChange={(e) => {
                        const selectedProvider = availableProviders.find(p => p.id === e.target.value);
                        setNewMethod({
                          ...newMethod,
                          providerId: e.target.value,
                          provider: selectedProvider || null
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                    >
                      <option value="">Select {newMethod.methodType === 'BANK' ? 'a bank' : 'a provider'}</option>
                      {availableProviders
                        .filter(p => p.type === newMethod.methodType && p.active)
                        .map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                    </select>
                  )}
                  {newMethod.provider && newMethod.provider.fees && (
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="bi bi-info-circle mr-1" />
                      {newMethod.provider.fees.note}
                    </p>
                  )}
                </div>

                {/* Dynamic Account Number Field */}
                {newMethod.provider && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newMethod.provider.accountFormat.label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                      placeholder={newMethod.provider.accountFormat.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: {newMethod.provider.accountFormat.example}
                    </p>
                  </div>
                )}

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMethod.accountName}
                    onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This should match the name registered on your {newMethod.methodType === 'BANK' ? 'bank' : 'mobile money'} account
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <i className="bi bi-info-circle mr-2" />
                    Your withdrawal method will be reviewed and approved within 24 hours.
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowAddMethodModal(false);
                    setNewMethod({
                      methodType: 'MOBILE_MONEY',
                      providerId: '',
                      accountNumber: '',
                      accountName: '',
                      provider: null
                    });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWithdrawalMethod}
                  disabled={!newMethod.providerId || !newMethod.accountNumber || !newMethod.accountName}
                  className="flex-1 px-4 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Method
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedEarnings;
