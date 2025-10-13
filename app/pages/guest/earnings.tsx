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

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  // Transaction Filters (fewer filters: by status for guest)
  const [transactionFilter, setTransactionFilter] = useState('all');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userSession') || '{}');
    const uid = user.id || user.userId;
    if (uid) {
      setUserId(uid);
      fetchAllData(uid);
    }
  }, []);

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

      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
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
    return `${(amount || 0).toLocaleString()} ${walletData?.currency || 'RWF'}`;
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
    </div>
  );
};

export default UnifiedPayments;