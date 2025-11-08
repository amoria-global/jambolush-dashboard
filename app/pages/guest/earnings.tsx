'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/api/apiService';

interface UnifiedPaymentsProps {
  userType: 'guest';
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

interface WithdrawalProvider {
  id: string;
  code: string;
  name: string;
  type: 'BANK' | 'MOBILE_MONEY';
  country: string;
  currency: string;
  active: boolean;
  accountFormat: {
    label: string;
    placeholder: string;
    example: string;
    minLength: number;
    maxLength: number;
    pattern?: string;
  };
  logo?: string;
  color?: string;
  fees?: {
    withdrawalFee: string;
    note: string;
  };
  supportsDeposits?: boolean;
  supportsPayouts?: boolean;
}

interface Transaction {
  id: string;
  provider: string;
  type: string;
  status: 'PENDING' | 'FAILED' | 'COMPLETED'; // Based on sample
  amount: number;
  currency: string;
  reference: string;
  userId: number;
  recipientId: number;
  description: string;
  metadata: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  externalId?: string;
}

interface TransactionStats {
  totalPayments: number;
  totalRefunds: number;
  pendingAmount: number;
  transactionCount: number;
  averageTransaction: number;
}

const UnifiedPayments: React.FC<UnifiedPaymentsProps> = ({ userType }) => {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);

  // Wallet & Account Data
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([]);

  // Available Providers
  const [availableProviders, setAvailableProviders] = useState<WithdrawalProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  // Add Refund Account Modal
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState({
    methodType: 'MOBILE_MONEY' as 'BANK' | 'MOBILE_MONEY',
    providerId: '',
    accountNumber: '',
    accountName: '',
    provider: null as WithdrawalProvider | null
  });

  // Notification State
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Transaction Filters (fewer filters: by status for guest)
  const [transactionFilter, setTransactionFilter] = useState('all');

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

  // Notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ message, type });
  };

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
      const historyResponse = await api.get(`/transactions/user/${uid}`);
      if (historyResponse.data.success) {
        const txs = historyResponse.data.data || [];
        setTransactions(txs);

        // Calculate stats for guest
        const payments = txs
          .filter((t: Transaction) => t.status !== 'FAILED')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const refunds = 0; // Assume no refunds in current API response; adjust if needed
        const pending = txs
          .filter((t: Transaction) => t.status === 'PENDING')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        setStats({
          totalPayments: payments,
          totalRefunds: refunds,
          pendingAmount: pending,
          transactionCount: txs.length,
          averageTransaction: txs.length > 0 ? (payments + refunds) / txs.length : 0,
        });
      }

      // Fetch withdrawal methods (refund accounts)
      const methodsResponse = await api.get(`/transactions/withdrawal-methods/${uid}`);
      if (methodsResponse.data.success) {
        setWithdrawalMethods(methodsResponse.data.data || []);
      }

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
      showNotification('Please fill in all required fields', 'warning');
      return;
    }

    if (!newMethod.provider) {
      showNotification('Please select a valid provider', 'warning');
      return;
    }

    // Check if user already has a withdrawal method of this type
    const existingMethodOfType = withdrawalMethods.find(m => m.methodType === newMethod.methodType);
    if (existingMethodOfType) {
      const methodTypeName = newMethod.methodType === 'BANK' ? 'bank account' : 'mobile money account';
      showNotification(
        `You already have a ${methodTypeName}. You can only have one bank account and one mobile money account. Please delete the existing ${methodTypeName} first if you want to add a different one.`,
        'error'
      );
      return;
    }

    // Validate account number using provider's pattern
    if (newMethod.provider.accountFormat.pattern) {
      const pattern = new RegExp(newMethod.provider.accountFormat.pattern);
      if (!pattern.test(newMethod.accountNumber)) {
        showNotification(`Invalid ${newMethod.provider.accountFormat.label}. ${newMethod.provider.accountFormat.example ? `Example: ${newMethod.provider.accountFormat.example}` : ''}`, 'error');
        return;
      }
    }

    // Validate length
    if (newMethod.accountNumber.length < newMethod.provider.accountFormat.minLength ||
        newMethod.accountNumber.length > newMethod.provider.accountFormat.maxLength) {
      showNotification(`${newMethod.provider.accountFormat.label} must be between ${newMethod.provider.accountFormat.minLength} and ${newMethod.provider.accountFormat.maxLength} characters`, 'error');
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

        showNotification(response.data.message, 'success');
      }
    } catch (err: any) {
      console.error('Error adding refund account:', err);
      showNotification(err.response?.data?.message || err.message || 'Failed to add refund account', 'error');
    }
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by status for guest
    if (transactionFilter !== 'all') {
      filtered = filtered.filter(t => t.status.toLowerCase() === transactionFilter.toLowerCase());
    }

    return filtered;
  };

  const formatCurrency = (amount: number | undefined) => {
    const value = amount || 0;
    const currency = walletData?.currency || 'RWF';

    // Format based on currency type
    if (currency === 'USD') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // For other currencies, show without decimals
    return `${value.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      'COMPLETED': 'bi-arrow-up-circle',
      'PENDING': 'bi-clock-history',
      'FAILED': 'bi-x-circle',
    };
    return icons[status] || 'bi-arrow-left-right';
  };

  const getTransactionColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'COMPLETED': 'text-red-600',
      'PENDING': 'text-yellow-600',
      'FAILED': 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments data...</p>
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
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto px-2 sm:px-3 lg:px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payments & Wallet
          </h1>
          <p className="text-gray-600">
            Track your payments, refunds, and transaction history
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="mb-8 bg-gradient-to-br from-[#083A85] to-[#062d6b] rounded-2xl p-8 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Wallet Balance</p>
              <h2 className="text-4xl font-bold">
                {formatCurrency(walletData?.totalBalance)}
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
                {formatCurrency(walletData?.availableBalance)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white/70 text-xs mb-1">Pending</p>
              <p className="text-xl font-semibold">
                {formatCurrency(walletData?.pendingBalance)}
              </p>
            </div>
          </div>

          {/* Add Refund Account Button - Only show if user has pending or available balance */}
          {walletData && ((walletData.pendingBalance || 0) > 0 || (walletData.availableBalance || 0) > 0) && (
            <div>
              <button
                onClick={() => setShowAddMethodModal(true)}
                className="w-full bg-white text-[#083A85] py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <i className="bi bi-bank" />
                Add Refund Account
              </button>
              {withdrawalMethods.length > 0 && (
                <p className="text-white/70 text-xs mt-2 text-center">
                  <i className="bi bi-check-circle-fill mr-1" />
                  {withdrawalMethods.length} refund account{withdrawalMethods.length > 1 ? 's' : ''} added
                </p>
              )}
            </div>
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
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-arrow-up-circle text-red-600 text-2xl" />
                  <span className="text-sm text-gray-500">Total Payments</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalPayments)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-arrow-down-circle text-green-600 text-2xl" />
                  <span className="text-sm text-gray-500">Total Refunds</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRefunds)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <i className="bi bi-clock-history text-orange-600 text-2xl" />
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.pendingAmount)}
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-red-100`}>
                        <i className={`bi ${getTransactionIcon(transaction.status)} ${getTransactionColor(transaction.status)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description || transaction.reference}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-red-600`}>
                        - {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Status: {transaction.status}
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
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-red-100`}>
                      <i className={`bi ${getTransactionIcon(transaction.status)} text-xl ${getTransactionColor(transaction.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description || transaction.reference}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      {transaction.reference && (
                        <p className="text-xs text-gray-400">Ref: {transaction.reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold text-red-600`}>
                      - {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {transaction.status}
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
      </div>

      {/* Add Refund Account Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">Add Refund Account</h3>
              <p className="text-sm text-gray-500 mt-1">Select a bank or mobile money provider to receive refunds</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Account Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMethod({ ...newMethod, methodType: 'MOBILE_MONEY', providerId: '', accountNumber: '', provider: null })}
                    disabled={withdrawalMethods.some(m => m.methodType === 'MOBILE_MONEY')}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      newMethod.methodType === 'MOBILE_MONEY'
                        ? 'border-[#083A85] bg-blue-50 text-[#083A85]'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <i className="bi bi-phone mr-2" />
                    Mobile Money
                    {withdrawalMethods.some(m => m.methodType === 'MOBILE_MONEY') && (
                      <div className="text-xs mt-1 text-orange-600">
                        <i className="bi bi-check-circle-fill mr-1" />
                        Already added
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMethod({ ...newMethod, methodType: 'BANK', providerId: '', accountNumber: '', provider: null })}
                    disabled={withdrawalMethods.some(m => m.methodType === 'BANK')}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      newMethod.methodType === 'BANK'
                        ? 'border-[#083A85] bg-blue-50 text-[#083A85]'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <i className="bi bi-bank mr-2" />
                    Bank
                    {withdrawalMethods.some(m => m.methodType === 'BANK') && (
                      <div className="text-xs mt-1 text-orange-600">
                        <i className="bi bi-check-circle-fill mr-1" />
                        Already added
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Provider Selection Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newMethod.methodType === 'BANK' ? 'Select Bank' : 'Select Mobile Money Provider'} <span className="text-red-500">*</span>
                </label>
                {loadingProviders ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    <i className="bi bi-arrow-repeat animate-spin mr-2" />
                    Loading providers...
                  </div>
                ) : (
                  <>
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
                      disabled={withdrawalMethods.some(m => m.methodType === newMethod.methodType)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Select {newMethod.methodType === 'BANK' ? 'a bank' : 'a provider'} --</option>
                      {availableProviders
                        .filter(p => p.type === newMethod.methodType && p.active)
                        .map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                    </select>
                    {newMethod.provider && newMethod.provider.fees && (
                      <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                        <i className="bi bi-info-circle mt-0.5" />
                        <span>{newMethod.provider.fees.note}</span>
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Account Details Form - Shows after provider selection */}
              {newMethod.provider && (
                <div className="border-t pt-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <i className="bi bi-info-circle text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Selected: {newMethod.provider.name}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Please provide your account details below
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Account Number Field */}
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

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <i className="bi bi-shield-check mr-2" />
                      Your refund account will be reviewed and approved within 24 hours. Once approved, any refunds will be sent to this account.
                    </p>
                  </div>
                </div>
              )}
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
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`rounded-lg shadow-lg p-4 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <i className={`bi ${
                notification.type === 'success' ? 'bi-check-circle-fill text-green-600' :
                notification.type === 'error' ? 'bi-x-circle-fill text-red-600' :
                notification.type === 'warning' ? 'bi-exclamation-triangle-fill text-yellow-600' :
                'bi-info-circle-fill text-blue-600'
              } text-xl`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-900' :
                  notification.type === 'error' ? 'text-red-900' :
                  notification.type === 'warning' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedPayments;