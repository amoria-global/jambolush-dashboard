'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/api/apiService';
import AlertNotification from '@/app/components/notify';

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
  userId?: number;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  destination: {
    holderName: string;
    accountNumber: string;
    providerCode: string;
    providerName: string;
    providerType: string;
    countryCode: string;
    currency: string;
  };
  withdrawalMethod?: {
    id: string;
    methodType: string;
    accountName: string;
    providerName: string;
    providerCode: string;
    accountNumber: string;
  };
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
  withdrawalMethodId?: string;
  requestedAt?: string;
  processedAt?: string;
  notes?: string;
}

interface WithdrawalHistoryResponse {
  withdrawals: WithdrawalRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpMessageId, setOtpMessageId] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(0);
  const [maskedPhone, setMaskedPhone] = useState<string>('');

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

  // Notification State
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

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

      // Fetch withdrawal methods
      const requestsResponse = await api.get(`/transactions/withdrawal-methods/${uid}`);
      if (methodsResponse.data.success) {
        setWithdrawalMethods(methodsResponse.data.data || []);
        // Set first default method as selected
        const defaultMethod = methodsResponse.data.data.find((m: WithdrawalMethod) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id);
        }
      }

      // Fetch withdrawal history from API
      try {
        const withdrawalHistoryResponse = await api.getWithdrawalHistory({
          page: 1,
          limit: 50
        });

        if (withdrawalHistoryResponse.data.success && withdrawalHistoryResponse.data.data) {
          const withdrawals = withdrawalHistoryResponse.data.data.withdrawals || [];

          // Transform the withdrawal data to match our interface
          const transformedWithdrawals = withdrawals.map((w: any) => ({
            id: w.id,
            userId: uid,
            amount: w.amount,
            currency: w.currency,
            method: w.method,
            status: w.status.toLowerCase(),
            reference: w.reference,
            destination: w.destination,
            withdrawalMethod: w.withdrawalMethod,
            failureReason: w.failureReason,
            createdAt: w.createdAt,
            completedAt: w.completedAt,
            requestedAt: w.createdAt,
            processedAt: w.completedAt,
            notes: w.failureReason || undefined
          }));

          setWithdrawalRequests(transformedWithdrawals);
        } else {
          // If API fails, fall back to empty array
          setWithdrawalRequests([]);
        }
      } catch (err) {
        console.error('Error fetching withdrawal history:', err);
        // Fall back to empty array on error
        setWithdrawalRequests([]);
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

        // If it's the first method, set it as selected
        if (withdrawalMethods.length === 0) {
          setSelectedMethod(response.data.data.id);
        }

        showNotification(response.data.message, 'success');
      }
    } catch (err: any) {
      console.error('Error adding withdrawal method:', err);
      showNotification(err.response?.data?.message || err.message || 'Failed to add withdrawal method', 'error');
    }
  };

  const handleWithdraw = async () => {
    if (!userId || !withdrawAmount || !selectedMethod) {
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid amount', 'warning');
      return;
    }

    if (walletData && amount > walletData.availableBalance) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    // Ensure wallet is in USD
    if (walletData && walletData.currency !== 'USD') {
      showNotification('Withdrawals are only available for USD wallets. Please contact support to convert your wallet currency.', 'error');
      return;
    }

    // Validate minimum and maximum withdrawal amounts (USD)
    if (amount < 1) {
      showNotification('Minimum withdrawal amount is $1 USD', 'warning');
      return;
    }

    if (amount > 10000) {
      showNotification('Maximum withdrawal amount is $10,000 USD', 'warning');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);

      // Request OTP
      const response = await api.requestWithdrawalOTP(amount);

      if (response.data.success) {
        const { messageId, expiresIn, maskedPhone: phone } = response.data.data;

        setOtpMessageId(messageId);
        setOtpExpiresIn(expiresIn);
        setMaskedPhone(phone);

        // Close withdrawal modal and show OTP modal
        setShowWithdrawModal(false);
        setShowOtpModal(true);
      } else {
        showNotification(response.data.message || 'Failed to send OTP', 'error');
      }
    } catch (err: any) {
      console.error('Error requesting OTP:', err);
      const errorMessage = err?.response?.data?.message || err?.data?.message || 'Failed to request OTP';
      showNotification(errorMessage, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtpAndWithdraw = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setOtpError('Invalid withdrawal amount');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);

      // Verify OTP and process withdrawal
      const response = await api.verifyAndWithdraw({
        otp: otpCode,
        amount,
        withdrawalMethodId: selectedMethod,
        method: 'MOBILE'
      });

      if (response.data.success) {
        const withdrawalData = response.data.data;

        // Create new withdrawal request for UI
        const newRequest: WithdrawalRequest = {
          id: withdrawalData.withdrawalId,
          userId: userId!,
          amount: withdrawalData.amount,
          withdrawalMethodId: selectedMethod,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          reference: withdrawalData.reference,
          notes: `Withdrawal via ${withdrawalData.method}`,
          currency: '',
          method: '',
          destination: {
            holderName: '',
            accountNumber: '',
            providerCode: '',
            providerName: '',
            providerType: '',
            countryCode: '',
            currency: ''
          },
          failureReason: null,
          createdAt: '',
          completedAt: null
        };

        // Add to state
        setWithdrawalRequests([newRequest, ...withdrawalRequests]);

        // Close modals and reset
        setShowOtpModal(false);
        setOtpCode('');
        setWithdrawAmount('');
        setSelectedMethod('');
        setActiveTab('withdrawals');

        showNotification(`Withdrawal request submitted successfully! Reference: ${withdrawalData.reference}`, 'success');

        // Refresh data
        if (userId) {
          fetchAllData(userId);
        }
      } else {
        setOtpError(response.data.message || 'Failed to verify OTP');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      const errorMessage = err?.response?.data?.message || err?.data?.message || 'Failed to verify OTP';
      setOtpError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);

      const response = await api.resendWithdrawalOTP(amount);

      if (response.data.success) {
        const { messageId, expiresIn } = response.data.data;
        setOtpMessageId(messageId);
        setOtpExpiresIn(expiresIn);
        showNotification('OTP has been resent to your phone', 'success');
      } else {
        setOtpError(response.data.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Error resending OTP:', err);
      const errorMessage = err?.response?.data?.message || err?.data?.message || 'Failed to resend OTP';
      setOtpError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelOtp = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpError(null);
    setShowWithdrawModal(true);
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
    const currency = walletData?.currency || 'USD';
    return currency === 'USD'
      ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${amount.toLocaleString()} ${currency}`;
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
            disabled={!walletData || walletData.availableBalance <= 0 || withdrawalMethods.filter(m => m.isVerified).length === 0 || walletData.currency !== 'USD'}
            className="w-full bg-white text-[#083A85] py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="bi bi-arrow-up-circle mr-2" />
            Withdraw Funds
          </button>
          {walletData && walletData.currency !== 'USD' && (
            <p className="text-white/70 text-xs mt-2 text-center">
              <i className="bi bi-exclamation-triangle mr-1" />
              Withdrawals are only available for USD wallets
            </p>
          )}
          {withdrawalMethods.filter(m => m.isVerified).length === 0 && walletData?.currency === 'USD' && (
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
                            {request.currency === 'USD'
                              ? `$${request.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `${request.amount.toLocaleString()} ${request.currency}`
                            }
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.destination?.providerName || request.withdrawalMethod?.providerName || 'Mobile Money'} - {' '}
                            {request.destination?.holderName || request.withdrawalMethod?.accountName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Account: {request.destination?.accountNumber || request.withdrawalMethod?.accountNumber}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {formatDate(request.createdAt || request.requestedAt || '')}
                          </p>
                          {(request.completedAt || request.processedAt) && request.status === 'completed' && (
                            <p className="text-xs text-gray-500">
                              Processed: {formatDate(request.completedAt || request.processedAt || '')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getWithdrawalStatusColor(request.status.toLowerCase())}`}>
                          <i className={`bi ${getWithdrawalStatusIcon(request.status.toLowerCase())}`} />
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1).toLowerCase()}
                        </span>
                        {request.reference && (
                          <span className="text-xs text-gray-500">
                            Ref: {request.reference}
                          </span>
                        )}
                      </div>
                    </div>

                    {(request.notes || request.failureReason) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{request.notes || request.failureReason}</p>
                      </div>
                    )}

                    {request.status.toLowerCase() === 'pending' && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                          <i className="bi bi-info-circle mt-0.5" />
                          <span>Your withdrawal is being reviewed and will be processed within 24 hours.</span>
                        </p>
                      </div>
                    )}

                    {request.status.toLowerCase() === 'processing' && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 flex items-start gap-2">
                          <i className="bi bi-arrow-repeat animate-spin mt-0.5" />
                          <span>Your withdrawal is currently being processed. Funds should arrive shortly.</span>
                        </p>
                      </div>
                    )}

                    {request.status.toLowerCase() === 'failed' && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800 flex items-start gap-2">
                          <i className="bi bi-exclamation-triangle mt-0.5" />
                          <span>
                            This withdrawal failed.
                            {request.failureReason && ` Reason: ${request.failureReason}`}
                            {!request.failureReason && ' Please contact support or try again with a different method.'}
                          </span>
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
                disabled={withdrawalMethods.length >= 2}
                className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-plus-circle mr-2" />
                Add Withdrawal Method
              </button>
            </div>
            {withdrawalMethods.length >= 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <i className="bi bi-info-circle mr-2" />
                  You have reached the maximum limit of withdrawal methods (one bank account and one mobile money account). Please delete an existing method to add a different one.
                </p>
              </div>
            )}

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
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        method.methodType === 'BANK'
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                          : 'bg-gradient-to-br from-[#083A85] to-[#062d6b]'
                      }`}>
                        <i className={`bi ${method.methodType === 'BANK' ? 'bi-bank' : 'bi-phone'} text-white text-xl`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {method.accountDetails?.providerName || method.methodType}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            method.methodType === 'BANK'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {method.methodType === 'BANK' ? 'Bank' : 'Mobile Money'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {method.accountDetails?.accountNumber || method.accountDetails?.phoneNumber || 'N/A'}
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
                    <option value="">Select withdrawal method</option>
                    {withdrawalMethods.filter(m => m.isVerified).map(method => (
                      <option key={method.id} value={method.id}>
                        {method.methodType === 'BANK' ? '🏦' : '📱'} {method.accountDetails?.providerName || method.methodType} - {method.accountDetails?.accountNumber || method.accountDetails?.phoneNumber}
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
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      Available: {formatCurrency(walletData?.availableBalance || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Min: $1.00
                    </p>
                  </div>
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
                  disabled={!withdrawAmount || !selectedMethod || otpLoading}
                  className="flex-1 px-4 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-lock mr-2" />
                      Request OTP
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Verification Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Verify OTP</h3>
                  <button
                    onClick={handleCancelOtp}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="bi bi-x-lg text-xl" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <i className="bi bi-shield-lock text-blue-600 text-2xl mt-1" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        OTP Sent Successfully
                      </p>
                      <p className="text-xs text-blue-700">
                        A 6-digit verification code has been sent to {maskedPhone}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Withdrawal amount: {formatCurrency(parseFloat(withdrawAmount) || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                      setOtpError(null);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  {otpError && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle" />
                      {otpError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={handleResendOtp}
                    disabled={otpLoading}
                    className="text-[#083A85] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-arrow-clockwise mr-1" />
                    Resend OTP
                  </button>
                  <span className="text-gray-500">
                    <i className="bi bi-clock mr-1" />
                    Expires in {Math.floor(otpExpiresIn / 60)} min
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCancelOtp}
                  disabled={otpLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtpAndWithdraw}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="flex-1 px-4 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d6b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle mr-2" />
                      Verify & Withdraw
                    </>
                  )}
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
                <p className="text-sm text-gray-500 mt-1">You can have one bank account and one mobile money account</p>
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

      {/* Notification */}
      {notification && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          position="top-right"
          size="sm"
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default UnifiedEarnings;
